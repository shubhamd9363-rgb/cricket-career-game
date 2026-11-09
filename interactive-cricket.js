/*
 * MAIDAN — player-controlled cricket match engine
 * All competition names/teams in the simulation are fictional except for
 * the names of real Indian cricket competitions shown as pathway context.
 * This is an independent, original gameplay implementation.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const fmt = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const random = (list) => list[Math.floor(Math.random() * list.length)];
  const names = [
    'Aarav Kulkarni','Ishaan Reddy','Kabir Sharma','Dev Malhotra','Arjun Nair','Rohan Iyer','Vivaan Joshi','Aditya Menon','Karan Desai','Yash Bhat',
    'Nikhil Rao','Samar Khan','Mihir Shah','Pranav Sood','Ritwik Bose','Aman Verma','Siddharth Pillai','Varun Shetty','Neeraj Dutta','Farhan Ali',
    'Anirudh Sen','Saurabh Naidu','Kunal Mehta','Rahul Chawla','Manav Kapoor','Aakash Jaiswal','Ritesh Banerjee','Sameer Qureshi','Vikram Patil','Harsh Vardhan'
  ];
  const opponents = {
    0: ['Old City Cricket Club','Railway Colts','City Sports Academy XI','University Youngsters','Maidan Challengers'],
    1: ['Deccan District XI','Coastal District XI','Central Zone Club XI','Southern Railways XI','Capital District XI'],
    2: ['State U19 Development XI','Western State U19','Southern State U19','Central State U19','North Zone U19'],
    3: ['State Senior XI','Coastal State XI','Western State XI','Central State XI','Eastern State XI'],
    4: ['India A Development XI','India A Select XI','Emerging India XI','Rest of India XI'],
    5: ['Australia','England','South Africa','New Zealand','Sri Lanka','West Indies']
  };
  const shotOptions = [
    ['defend','Defend','Safe','all'],['leave','Leave','Safe','outside'],['straight','Straight drive','Timing','full'],['cover','Cover drive','Timing','full'],
    ['cut','Cut','Square','short'],['pull','Pull / hook','Square','short'],['sweep','Sweep','Leg side','spin'],['loft','Lofted drive','High risk','full'],
    ['latecut','Late cut','Touch','outside'],['flick','Flick / glance','Leg side','leg']
  ];

  const state = {
    legacyFinish: null,
    legacyCareer: null,
    legacyScouting: null,
    legacyJourney: null,
    legacyApplySelection: null,
    matchVersion: 3
  };

  function career() { return window.MaidanGame?.getCareer?.() || null; }
  function currentTab() { try { return tab; } catch (_e) { return ''; } }
  function saveAndRender() {
    if (typeof window.save === 'function') window.save();
    if (typeof window.render === 'function') window.render();
  }
  function roleBatPosition(p) {
    if (p.role === 'Bowler') return 8;
    if (p.role === 'All-rounder') return 5;
    if (p.role === 'Wicketkeeper-batter') return 4;
    return 2;
  }
  function canPlayerBowl(p) {
    return ['Bowler','All-rounder'].includes(p.role) || (p.role === 'Batter' && p.skills?.bowl >= 48 && p.bowl !== 'Does not bowl');
  }
  function quotaFor(m) {
    if (m.formatId === 't20' || m.formatId === 'local10') return 4;
    if (m.formatId === 'listA' || m.formatId === 'local40') return 10;
    return 18;
  }
  function getFormat(id) {
    const formats = typeof availableFormats === 'function' ? availableFormats() : [];
    return formats.find(x => x.id === id) || formats[0] || { id:'t20', name:'T20 cricket', overs:20, kind:'T20' };
  }
  function newBatter(name, skill, isPlayer = false, role = 'Batter') {
    return { name, skill: clamp(skill,28,92), isPlayer, role, runs:0, balls:0, fours:0, sixes:0, dismissal:'Did not bat', out:false, notOut:false, strikeRate:0 };
  }
  function makeLineup(p, side, match) {
    if (side === 'user') {
      const playerSkill = p.role === 'Bowler' ? p.skills.bat : p.skills.bat;
      const order = roleBatPosition(p);
      const pool = Array.from({length:11},(_,i)=>newBatter(`${random(names)}${i}`, clamp(42 + (p.stage||0)*5 + Math.random()*18), false, i===0?'Opener':'Batter'));
      pool[order] = newBatter(p.name, playerSkill, true, p.role);
      return pool;
    }
    return Array.from({length:11},(_,i)=>newBatter(`${random(names)}${i+11}`, clamp(48 + (p.stage||0)*5 + Math.random()*20), false, i<3?'Top order':'Batter'));
  }
  function buildBowlingAttack(p, side, match) {
    const attack = [];
    if (side === 'user' && canPlayerBowl(p)) {
      attack.push({ name:p.name, isPlayer:true, skill:clamp(p.skills.bowl + p.skills.fit*.12), style:p.bowl||'Right-arm medium', balls:0, runs:0, wickets:0, maidens:0, concededThisOver:0 });
    }
    for (let i=0;i<5;i++) attack.push({ name:random(names), isPlayer:false, skill:clamp(48+(p.stage||0)*5+Math.random()*24), style:random(['Right-arm fast','Right-arm medium','Left-arm fast','Off-spin','Leg-spin']), balls:0,runs:0,wickets:0,maidens:0,concededThisOver:0 });
    return attack;
  }
  function createMatch() {
    const p = career();
    if (!p) return null;
    const selected = p.nextMatchFormat || (p.stage===0?'local10':'t20');
    const f = getFormat(selected);
    const redBall = ['firstClass','test'].includes(f.id);
    const opp = p.selectedCompetition?.id === 'india' ? random(['Australia','England','South Africa','New Zealand']) : random(opponents[Math.min(5,Math.max(0,p.stage||0))] || opponents[0]);
    const own = `${p.town || 'Home Town'} XI`;
    const pitch = redBall ? random(['Traditional red-ball surface','Dry surface with footmarks','Green seam-friendly pitch','Slow turner']) : random(['Fresh batting surface','Two-paced surface','Good carry and bounce','Dry surface with grip']);
    const m = {
      interactive:true, version:state.matchVersion, phase:'toss', formatId:f.id, format:f.name, kind:f.kind, oversLimit:Number(f.overs)||20,
      redBall, inningsPerSide:redBall?2:1, inningsSequence:[], innings:[], currentInnings:null, inningsNo:0,
      ownTeam:own, opposition:opp, userSide:'user', opponentSide:'opponent', pitch,
      tossWinner:Math.random()<.5?'user':'opponent', tossDecision:null, firstBattingSide:null,
      day: p.day, matchDate:typeof careerDate==='function'?careerDate():'In-game date',
      playerBat:{played:false,runs:0,balls:0,fours:0,sixes:0,dismissal:'Did not bat',dismissals:0},
      playerWickets:0, playerOvers:0, playerRunsConceded:0, playerMaidens:0, playerCatches:0,
      playerRunOuts:0, playerBowlingBalls:0, playerBowlingOversByInnings:0, playerBowlingQuota:quotaFor({formatId:f.id}),
      playerBattingPosition:roleBatPosition(p), playerBattedInInnings:[], totalPlayerBowlingWickets:0,
      fieldingEvents:[], lastBalls:[], tactics:{batting:'balanced',bowling:'balanced',field:'balanced'},
      trialId:p.activeTrial?.id || null, competition:p.selectedCompetition?.name || f.name,
      teamStrategy:'balanced', matchCompleted:false, target:null, result:null, dayCount:1
    };
    if (m.tossWinner === 'opponent') m.tossDecision = redBall ? (Math.random()<.6?'bat':'bowl') : (Math.random()<.55?'bowl':'bat');
    return m;
  }
  function teamLabel(m, side) { return side==='user'?m.ownTeam:m.opposition; }
  function opposite(side) { return side==='user'?'opponent':'user'; }
  function formatOvers(legalBalls) { return `${Math.floor(legalBalls/6)}.${legalBalls%6}`; }
  function inningsTarget(m, side) {
    if (!m.redBall) {
      const other = m.innings.find(x=>x.side!==side);
      return other ? other.runs+1 : null;
    }
    if (m.innings.length >= 3) {
      const a=m.innings[0]?.runs||0,b=m.innings[1]?.runs||0,c=m.innings[2]?.runs||0;
      if (side===m.inningsSequence[3]) return m.inningsSequence[0]===side ? b+c-a+1 : a+c-b+1;
    }
    return null;
  }
  function setupInnings(m, battingSide) {
    const p=career();
    m.inningsNo += 1;
    const batting=makeLineup(p,battingSide,m);
    const fielding=buildBowlingAttack(p,opposite(battingSide),m);
    const inn={
      inningsNo:m.inningsNo, side:battingSide, teamName:teamLabel(m,battingSide), fieldingTeam:teamLabel(m,opposite(battingSide)),
      runs:0,wickets:0,legalBalls:0,extras:0,wide:0,noBall:0,byes:0,legByes:0,batRuns:0,fours:0,sixes:0,
      batters:batting,bowlers:fielding,deliveries:[],strikerIndex:0,nonStrikerIndex:1,nextBatterIndex:2,
      currentBowler:null,currentOverIndex:-1,overRuns:0,overWickets:0,playerBatted:false,playerOut:false,playerBowledBalls:0,
      playerBowlingRuns:0,playerBowlingWickets:0,playerBowlingMaidens:0,playerCatches:0,target:inningsTarget(m,battingSide),
      maxOvers:m.oversLimit,declared:false,complete:false,summary:null
    };
    if (battingSide==='user' && inn.batters.some(x=>x.isPlayer)) m.playerBattedInInnings.push(m.inningsNo);
    m.currentInnings=inn;
    m.phase='playing';
    m.lastBalls=[];
    return inn;
  }
  function tossDecision(choice) {
    const p=career(),m=p?.match;
    if (!m || m.phase!=='toss') return;
    const decision = m.tossWinner==='user' ? choice : m.tossDecision;
    if (!['bat','bowl'].includes(decision)) return;
    m.tossDecision=decision;
    m.firstBattingSide = m.tossWinner==='user' ? (decision==='bat'?'user':'opponent') : (decision==='bat'?'opponent':'user');
    m.inningsSequence = m.redBall ? [m.firstBattingSide,opposite(m.firstBattingSide),m.firstBattingSide,opposite(m.firstBattingSide)] : [m.firstBattingSide,opposite(m.firstBattingSide)];
    setupInnings(m,m.inningsSequence[0]);
    advanceUntilAction(m);
    saveAndRender();
  }
  function battingStats(inn, batter) {
    if (!batter) return;
    return `${batter.name}: ${batter.runs} (${batter.balls})`;
  }
  function currentOver(m) { return Math.floor((m.currentInnings?.legalBalls||0)/6); }
  function chooseBowlerForOver(m, inn, overIndex) {
    if (inn.currentOverIndex===overIndex && inn.currentBowler) return inn.currentBowler;
    inn.currentOverIndex=overIndex;
    inn.overRuns=0; inn.overWickets=0;
    const playerBowler=inn.bowlers.find(x=>x.isPlayer);
    const quota=quotaFor(m);
    const userOvers=playerBowler ? Math.floor(playerBowler.balls/6) : 0;
    const usePlayer = playerBowler && userOvers < quota && overIndex % 4 === 0;
    if (usePlayer) inn.currentBowler=playerBowler;
    else {
      const choices=inn.bowlers.filter(x=>!x.isPlayer);
      const pick=choices[overIndex % choices.length];
      inn.currentBowler=pick;
    }
    return inn.currentBowler;
  }
  function needsPlayerAction(m) {
    const inn=m.currentInnings;
    if (!inn) return null;
    const striker=inn.batters[inn.strikerIndex];
    if (inn.side==='user' && striker?.isPlayer && !striker.out) return 'batting';
    const overIndex=Math.floor(inn.legalBalls/6);
    const bowler=chooseBowlerForOver(m,inn,overIndex);
    if (inn.side==='opponent' && bowler?.isPlayer) return 'bowling';
    return null;
  }
  function isInningsComplete(inn) {
    if (!inn) return true;
    if (inn.wickets>=10 || inn.legalBalls>=inn.maxOvers*6) return true;
    if (inn.target && inn.runs>=inn.target) return true;
    return false;
  }
  function deliveryLabel(inn) {
    const over=Math.floor(inn.legalBalls/6)+1;
    const ball=inn.legalBalls%6+1;
    return `${over}.${ball}`;
  }
  function pushCommentary(m, text, outcome='', ballLabel=null) {
    const inn=m.currentInnings;
    const item={ball:ballLabel || deliveryLabel(inn),text,outcome,score:`${inn.runs}/${inn.wickets}`,overs:formatOvers(inn.legalBalls)};
    m.lastBalls.unshift(item); m.lastBalls=m.lastBalls.slice(0,10);
  }
  function ensureBowlerFigure(inn, bowler) {
    if (!bowler) return;
    if (!Number.isFinite(bowler.balls)) bowler.balls=0;
    if (!Number.isFinite(bowler.runs)) bowler.runs=0;
    if (!Number.isFinite(bowler.wickets)) bowler.wickets=0;
    if (!Number.isFinite(bowler.maidens)) bowler.maidens=0;
    if (!Number.isFinite(bowler.concededThisOver)) bowler.concededThisOver=0;
  }
  function addDelivery(inn, d) {
    const legalNumber = Math.max(0, Number(inn.legalBalls) || 0);
    const completedLegal = d.legal && legalNumber > 0 ? legalNumber - 1 : null;
    const deliveryOver = completedLegal === null ? Math.floor(legalNumber / 6) + 1 : Math.floor(completedLegal / 6) + 1;
    const deliveryBall = completedLegal === null ? (legalNumber % 6) + 1 : (completedLegal % 6) + 1;
    const legalLabel = `${Math.floor(legalNumber / 6) + 1}.${(legalNumber % 6) + 1}`;
    const displayBall = completedLegal === null ? `${legalLabel}${d.legal ? '' : (d.outcome === 'Wide' ? ' wd' : ' nb')}` : `${deliveryOver}.${deliveryBall}`;
    const row={
      over:deliveryOver,
      ball:deliveryBall,
      displayBall, batter:d.batter?.name||'', bowler:d.bowler?.name||'',
      outcome:d.outcome, runs:d.runs||0, extras:d.extras||0, totalAfter:inn.runs, wicketsAfter:inn.wickets,
      legal:!!d.legal, wicket:!!d.wicket, dismissal:d.dismissal||'', zone:d.zone||null, isPlayerBall:!!d.isPlayerBall,
      line:d.line||'',length:d.length||'', timing:d.timing||null, shot:d.shot||null
    };
    inn.deliveries.push(row);
    const liveMatch = window.MaidanGame?.getCareer?.()?.match;
    if (d.batter && Number(d.batter.balls) > 0 && !d.batter.out && d.batter.dismissal === 'Did not bat') {
      d.batter.dismissal = 'Not out';
    }
    if (liveMatch?.interactive && d.batter?.isPlayer && (d.legal || d.outcome === 'No-ball')) {
      liveMatch.playerBatInnings = liveMatch.playerBatInnings || {};
      liveMatch.playerBatInnings[String(inn.inningsNo)] = {
        runs:Number(d.batter.runs)||0, balls:Number(d.batter.balls)||0,
        fours:Number(d.batter.fours)||0, sixes:Number(d.batter.sixes)||0,
        out:!!d.batter.out, dismissal:d.batter.out ? (d.batter.dismissal || 'out') : 'Not out'
      };
      const inningsRows = Object.values(liveMatch.playerBatInnings);
      liveMatch.playerBat = {
        played:true,
        runs:inningsRows.reduce((sum,x)=>sum+(x.runs||0),0),
        balls:inningsRows.reduce((sum,x)=>sum+(x.balls||0),0),
        fours:inningsRows.reduce((sum,x)=>sum+(x.fours||0),0),
        sixes:inningsRows.reduce((sum,x)=>sum+(x.sixes||0),0),
        dismissals:inningsRows.filter(x=>x.out).length,
        dismissal:inningsRows.slice().reverse().find(x=>x.out)?.dismissal || 'Not out'
      };
    }
    pushCommentary(liveMatch || {lastBalls:[]}, `${row.batter} to ${row.bowler}: ${row.outcome}${d.dismissal?' · '+d.dismissal:''}. ${inn.runs}/${inn.wickets}`,d.outcome,row.displayBall);
  }
  function rotateStrike(inn, runs) { if (Math.abs(Number(runs)||0)%2===1) [inn.strikerIndex,inn.nonStrikerIndex]=[inn.nonStrikerIndex,inn.strikerIndex]; }
  function replaceDismissedBatter(inn, dismissal='bowled') {
    const batter=inn.batters[inn.strikerIndex];
    if (!batter || batter.out) return;
    batter.out=true; batter.dismissal=dismissal; inn.wickets += 1; inn.overWickets += 1;
    if (batter.isPlayer) inn.playerOut=true;
    if (inn.nextBatterIndex<inn.batters.length) {
      inn.strikerIndex=inn.nextBatterIndex;
      inn.nextBatterIndex += 1;
    }
  }
  function maybeExtras() {
    const n=Math.random();
    if (n<.018) return {type:'wide',runs:1,legal:false};
    if (n<.027) return {type:'no-ball',runs:1,legal:false};
    return null;
  }
  function weightedRuns(skill, bowlSkill, aggressive=false) {
    const r=Math.random();
    const boundary=0.07 + Math.max(0,skill-55)*.0021 + (aggressive?.045:0) - Math.max(0,bowlSkill-70)*.001;
    const six=0.012 + Math.max(0,skill-70)*.0012 + (aggressive?.022:0);
    if (r<six) return 6;
    if (r<six+boundary*.55) return 4;
    if (r<six+boundary) return 3;
    if (r<six+boundary+.25) return 2;
    if (r<six+boundary+.52) return 1;
    return 0;
  }
  function runAiDelivery(m) {
    const inn=m.currentInnings;
    const batter=inn.batters[inn.strikerIndex];
    const bowler=chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    ensureBowlerFigure(inn,bowler);
    const extra=maybeExtras();
    if (extra) {
      inn.runs+=extra.runs;inn.extras+=extra.runs;inn[extra.type==='wide'?'wide':'noBall']+=extra.runs;
      bowler.runs+=extra.runs;bowler.concededThisOver+=extra.runs;
      if (extra.type==='no-ball' && batter) batter.balls+=1;
      addDelivery(inn,{batter,bowler,runs:0,extras:extra.runs,legal:false,outcome:extra.type==='wide'?'Wide':'No-ball',isPlayerBall:false});
      return;
    }
    const playerBowl = bowler.isPlayer;
    const batterSkill=batter?.skill||55;
    const bowlingSkill=bowler.skill||55;
    const wicketChance=Math.max(.012,Math.min(.095,.035+(bowlingSkill-55)*.00065-(batterSkill-55)*.0003+(m.tactics.bowling==='attacking'?.018:0)));
    const wicket=Math.random()<wicketChance;
    const runs=wicket?0:weightedRuns(batterSkill,bowlingSkill,false);
    if (batter) { batter.balls+=1; batter.runs+=runs; if(runs===4)batter.fours++;if(runs===6)batter.sixes++; }
    inn.runs+=runs;inn.batRuns+=runs;inn.legalBalls++;bowler.balls++;bowler.runs+=runs;bowler.concededThisOver+=runs;
    if(runs===4)inn.fours++;if(runs===6)inn.sixes++;
    if(wicket){const dismissal=random(['caught','bowled','lbw','caught behind']);bowler.wickets++;if(playerBowl){m.playerWickets++;m.playerBowlingWickets++;}replaceDismissedBatter(inn,dismissal);}
    else rotateStrike(inn,runs);
    addDelivery(inn,{batter,bowler,runs,legal:true,wicket,outcome:wicket?'Wicket':runs===0?'Dot ball':`${runs} run${runs===1?'':'s'}`,dismissal:wicket?(inn.batters[inn.strikerIndex]?.dismissal||'wicket'):'',isPlayerBall:false});
  }
  function computeBattingDelivery(m, choice) {
    const p=career(),inn=m.currentInnings,batter=inn.batters[inn.strikerIndex],bowler=chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    ensureBowlerFigure(inn,bowler);
    const extra=maybeExtras();
    if (extra) {
      inn.runs+=extra.runs;inn.extras+=extra.runs;inn[extra.type==='wide'?'wide':'noBall']+=extra.runs;bowler.runs+=extra.runs;bowler.concededThisOver+=extra.runs;
      if(extra.type==='no-ball') batter.balls++;
      addDelivery(inn,{batter,bowler,runs:0,extras:extra.runs,legal:false,outcome:extra.type==='wide'?'Wide':'No-ball',isPlayerBall:true});
      return;
    }
    const actualLength=random(['full','good length','short','yorker','bouncer']);
    const actualLine=random(['outside off','off stump','middle','leg stump','wide outside off']);
    const actualSpin=random([false,false,false,true]);
    const readCorrect=(choice.readLength===actualLength || (choice.readLength==='good length'&&actualLength==='full'))?1:0;
    const lineCorrect=(choice.readLine===actualLine || (choice.readLine==='off stump'&&actualLine==='outside off'))?1:0;
    const shot=choice.shot;
    const shotMap={
      defend:['good length','yorker'],leave:['outside off','wide outside off'],straight:['full','good length'],cover:['full','good length'],cut:['short','good length'],pull:['short','bouncer'],sweep:['good length','full'],loft:['full','good length'],latecut:['good length','short'],flick:['full','good length']
    };
    const shotFit=(shotMap[shot]||[]).includes(actualLength) || (shot==='sweep'&&actualSpin) || (shot==='cut'&&actualLine.includes('off'));
    const footworkFit=(choice.footwork==='front'&&['full','good length'].includes(actualLength))||(choice.footwork==='back'&&['short','bouncer'].includes(actualLength))||(choice.footwork==='crease'&&['yorker','good length'].includes(actualLength));
    const timing=clamp(choice.timing,0,100);
    const timingQuality=1-Math.min(1,Math.abs(timing-82)/82);
    const aggression=choice.intent==='aggressive';
    const defence=choice.intent==='cautious';
    const batting=p.skills.bat||40;
    const technique=(p.skills.bat||40)*.65+(p.skills.fit||40)*.05+(p.morale||50)*.08;
    const bowling=bowler.skill||55;
    const matchPressure=(inn.target&&inn.target-inn.runs<25)?0.02:0;
    const readBonus=readCorrect*.025+lineCorrect*.018;
    const contact=Math.max(0,Math.min(1,.45+technique/250+timingQuality*.22+(shotFit?.055:-.065)+(footworkFit?.035:-.045)+readBonus-bowling/550-(aggression?.035:0)));
    const risk=Math.max(.01,Math.min(.27,.025+(aggression?.075:0)+(shot==='loft'?.07:0)+(timing<45?.09:0)+(contact<.52?.05:0)+(bowling>75?.025:0)-technique*.00035+(defence?-.018:0)));
    const wicket=Math.random()<risk;
    let runs=0;
    if (!wicket) {
      let scored=weightedRuns(batting,bowling,aggression);
      if (shot==='defend'||shot==='leave') scored=Math.min(scored,1);
      if (defence && Math.random()<.43) scored=0;
      if (!shotFit && scored>=4) scored=1;
      if (timing<42 && scored>=4) scored=Math.random()<.55?0:1;
      if (timing>92 && shotFit && ['straight','cover','loft','pull'].includes(shot) && Math.random()<.28) scored=6;
      runs=scored;
    }
    batter.balls++;batter.runs+=runs;if(runs===4)batter.fours++;if(runs===6)batter.sixes++;
    inn.runs+=runs;inn.batRuns+=runs;inn.legalBalls++;bowler.balls++;bowler.runs+=runs;bowler.concededThisOver+=runs;
    if(runs===4)inn.fours++;if(runs===6)inn.sixes++;
    if(wicket){
      const dismissal=choice.shot==='loft'?'caught':actualLength==='yorker'?'bowled':actualLength==='good length'?'lbw':random(['caught','caught behind','bowled']);
      bowler.wickets++;replaceDismissedBatter(inn,dismissal);
    } else {
      rotateStrike(inn,runs);
    }
    addDelivery(inn,{batter,bowler,runs,legal:true,wicket,outcome:wicket?'Wicket':runs===0?'Defended / dot ball':`${runs} run${runs===1?'':'s'}`,dismissal:wicket?batter.dismissal:'',line:actualLine,length:actualLength,timing,shot,isPlayerBall:true});
    m.lastRead={line:actualLine,length:actualLength,shot,readCorrect,lineCorrect,timing,contact,shotFit,footworkFit};
  }
  function computeBowlingDelivery(m, choice) {
    const p=career(),inn=m.currentInnings,batter=inn.batters[inn.strikerIndex],bowler=chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    ensureBowlerFigure(inn,bowler);
    const extra=maybeExtras();
    if(extra){inn.runs+=extra.runs;inn.extras+=extra.runs;inn[extra.type==='wide'?'wide':'noBall']+=extra.runs;bowler.runs+=extra.runs;bowler.concededThisOver+=extra.runs;if(extra.type==='no-ball')batter.balls++;addDelivery(inn,{batter,bowler,runs:0,extras:extra.runs,legal:false,outcome:extra.type==='wide'?'Wide':'No-ball',isPlayerBall:true});return;}
    const release=clamp(choice.release,0,100);
    const releaseQuality=1-Math.min(1,Math.abs(release-78)/78);
    const line=choice.line,length=choice.length,variation=choice.variation,field=choice.field;
    const skill=p.skills.bowl||38;
    const control=skill/100*.52+releaseQuality*.27+(p.fitness||50)/100*.12+(p.form||0)*.002;
    const batterSkill=batter?.skill||58;
    const attacking=field==='attacking';
    const planBonus=(length==='yorker'||line==='off stump'||line==='outside off')?.02:0;
    const wicketChance=Math.max(.012,Math.min(.23,.035+control*.105+(attacking?.035:0)+planBonus+(variation==='slower'||variation==='googly'?.018:0)-(batterSkill/100)*.045+(releaseQuality-.65)*.09));
    const wicket=Math.random()<wicketChance;
    let runs=wicket?0:weightedRuns(batterSkill,skill, false);
    const misfield=Math.random()<.025;
    if(!wicket && misfield)runs=Math.min(4,runs+1);
    if(!wicket && field==='defensive' && runs>=4 && Math.random()<.45)runs=2;
    if(!wicket && field==='attacking' && runs===1 && Math.random()<.22)runs=0;
    batter.balls++;batter.runs+=runs;if(runs===4)batter.fours++;if(runs===6)batter.sixes++;
    inn.runs+=runs;inn.batRuns+=runs;inn.legalBalls++;bowler.balls++;bowler.runs+=runs;bowler.concededThisOver+=runs;
    if(runs===4)inn.fours++;if(runs===6)inn.sixes++;
    if(wicket){const dismissal=length==='yorker'?'bowled':line==='middle'?'lbw':random(['caught','bowled','lbw','caught behind']);bowler.wickets++;inn.playerBowlingWickets++;m.playerWickets++;replaceDismissedBatter(inn,dismissal);}
    else rotateStrike(inn,runs);
    if (inn.playerBowlingBalls>=0 && bowler.isPlayer) { inn.playerBowlingBalls++;inn.playerBowlingRuns+=runs;if(wicket)inn.playerBowlingWickets++; }
    addDelivery(inn,{batter,bowler,runs,legal:true,wicket,outcome:wicket?'Wicket':runs===0?'Dot ball':`${runs} run${runs===1?'':'s'}`,dismissal:wicket?'dismissal':'',line,length,isPlayerBall:true});
    m.lastPlan={line,length,variation,field,release,releaseQuality,control};
  }
  function fieldingPrompt(m) {
    const chance=Math.random();
    if(chance>.021) return false;
    const type=chance<.006?'catch':chance<.014?'boundary':'runout';
    m.pendingFielding={type,description:type==='catch'?'A high chance goes toward your fielding position. Choose how to attack the catch.':type==='boundary'?'The batter has driven the ball into the deep. Choose how you save runs.':'A quick single is on. A direct hit could create a run-out chance.',quality:Math.random()};
    m.phase='fielding';
    return true;
  }
  function resolveFielding(choice) {
    const p=career(),m=p?.match,inn=m?.currentInnings,e=m?.pendingFielding;
    if(!m||!inn||m.phase!=='fielding'||!e)return;
    const batter=inn.batters[inn.strikerIndex];
    const bowler=inn.currentBowler || chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    if(!batter || !bowler)return;
    ensureBowlerFigure(inn,bowler);
    const fieldSkill=p.skills.field||35;
    const effort=choice==='dive'||choice==='attack'?8:choice==='safe'?0:4;
    const success=clamp(fieldSkill*.72+e.quality*24+effort+(p.fitness||50)*.08,8,98)/100;
    let msg='', runs=0, wicket=false, dismissal='';
    batter.balls += 1;
    inn.legalBalls += 1;
    bowler.balls += 1;
    if(e.type==='catch'){
      if(Math.random()<success){
        wicket=true; dismissal='caught';
        replaceDismissedBatter(inn,'c '+p.name+' b '+bowler.name);
        inn.playerCatches++;m.playerCatches++;
        bowler.wickets++;
        if(bowler.isPlayer)m.playerWickets++;
        msg='Caught! A safe pair of hands. The team has taken a wicket.';
      } else msg='The catch goes down. The batter survives.';
    } else if(e.type==='boundary') {
      if(Math.random()<success){runs=1;msg='Excellent stop. You save three or four runs.';}
      else {runs=4;batter.fours++;inn.fours++;msg='The ball reaches the rope. Four runs.';}
      batter.runs += runs;inn.runs += runs;inn.batRuns += runs;bowler.runs += runs;bowler.concededThisOver += runs;
      rotateStrike(inn,runs);
    } else {
      if(Math.random()<success*.52){
        wicket=true;dismissal='run out';replaceDismissedBatter(inn,'run out');m.playerRunOuts++;
        msg='Direct hit! Run out.';
      } else {
        runs=1;batter.runs++;inn.runs++;inn.batRuns++;bowler.runs++;bowler.concededThisOver++;rotateStrike(inn,1);
        msg='The batters make it safely. One run.';
      }
    }
    if(wicket && batter.isPlayer) m.playerBat.out=true;
    const displayBall=`${Math.floor((inn.legalBalls-1)/6)+1}.${((inn.legalBalls-1)%6)+1}`;
    const row={over:Math.floor((inn.legalBalls-1)/6)+1,ball:((inn.legalBalls-1)%6)+1,displayBall,batter:batter.name,bowler:bowler.name,outcome:msg,runs,extras:0,totalAfter:inn.runs,wicketsAfter:inn.wickets,legal:true,wicket,dismissal,isPlayerBall:true};
    inn.deliveries.push(row);
    if (bowler.balls > 0 && bowler.balls % 6 === 0) applyOverEnd(inn);
    pushCommentary(m,msg,wicket?'Wicket':runs===0?'Dot ball':`${runs} run${runs===1?'':'s'}`,displayBall);
    m.fieldingEvents=m.fieldingEvents||[];
    m.fieldingEvents.push({type:e.type,choice,success:!!(wicket||runs===1),day:m.day,ball:displayBall});
    m.pendingFielding=null;m.phase='playing';advanceUntilAction(m);saveAndRender();
  }
  function applyOverEnd(inn) {
    const lastBowler=inn.currentBowler;
    if(lastBowler && lastBowler.balls>0 && lastBowler.balls%6===0 && lastBowler.concededThisOver===0) lastBowler.maidens++;
    if(lastBowler) lastBowler.concededThisOver=0;
  }
  function advanceUntilAction(m) {
    let loops=0;
    while(m.phase==='playing' && loops<12000){
      loops++;
      const inn=m.currentInnings;
      if(!inn||isInningsComplete(inn)){completeCurrentInnings(m);return;}
      const action=needsPlayerAction(m);
      if(action){m.phase=action;return;}
      if(inn.side==='opponent' && fieldingPrompt(m)) return;
      const before=inn.legalBalls;
      runAiDelivery(m);
      if(inn.legalBalls>before && inn.legalBalls%6===0) applyOverEnd(inn);
    }
    if(loops>=12000){completeCurrentInnings(m);}
  }
  function summariseInnings(inn) {
    const batters=inn.batters.filter(b=>b.balls||b.runs||b.out);
    const notBatted=inn.batters.filter(b=>!b.balls&&!b.runs&&!b.out).map(b=>({...b,dismissal:'Did not bat'}));
    const bowlers=inn.bowlers.filter(b=>b.balls>0).map(b=>({...b,overs:`${Math.floor(b.balls/6)}.${b.balls%6}`}));
    const overs=`${Math.floor(inn.legalBalls/6)}.${inn.legalBalls%6}`;
    return {
      inningsNo:inn.inningsNo,side:inn.side,teamName:inn.teamName,opposition:inn.fieldingTeam,runs:inn.runs,wickets:inn.wickets,
      legalBalls:inn.legalBalls,overs,extras:inn.extras,wide:inn.wide,noBall:inn.noBall,byes:inn.byes,legByes:inn.legByes,batRuns:inn.batRuns,
      fours:inn.fours,sixes:inn.sixes,batters:[...batters,...notBatted],bowlers,deliveries:inn.deliveries,
      playerBat:batters.find(x=>x.isPlayer)||null,
      playerBowling:bowlers.find(x=>x.isPlayer)||null,playerCatches:inn.playerCatches||0,
      result:inn.complete?'Completed':'In progress'
    };
  }
  function finishResult(m) {
    const p=career();
    const ownInns=m.innings.filter(x=>x.side==='user');
    const oppInns=m.innings.filter(x=>x.side==='opponent');
    const ownRuns=ownInns.reduce((s,x)=>s+x.runs,0);
    const oppRuns=oppInns.reduce((s,x)=>s+x.runs,0);
    const ownWkts=ownInns.reduce((s,x)=>s+x.wickets,0);
    const oppWkts=oppInns.reduce((s,x)=>s+x.wickets,0);
    m.ownRuns=ownRuns;m.ownWickets=ownWkts;m.opponentRuns=oppRuns;m.opponentWickets=oppWkts;
    m.ownOvers=ownInns.map(x=>x.overs).join(' & ');m.opponentOvers=oppInns.map(x=>x.overs).join(' & ');
    let won=false,tied=false,result='';
    if(!m.redBall){
      if(ownRuns>oppRuns){
        won=true;
        result=m.firstBattingSide==='user' ? `Won by ${ownRuns-oppRuns} runs` : `Won by ${Math.max(1,10-ownWkts)} wickets`;
      } else if(ownRuns===oppRuns){
        tied=true;result='Match tied';
      } else {
        result=m.firstBattingSide==='opponent' ? `Lost by ${oppRuns-ownRuns} runs` : `Lost by ${Math.max(1,10-oppWkts)} wickets`;
      }
    } else {
      const firstSide=m.firstBattingSide,secondSide=opposite(firstSide);
      const s0=m.innings[0]?.runs||0,s1=m.innings[1]?.runs||0,s2=m.innings[2]?.runs||0,s3=m.innings[3]?.runs||0;
      const chaseTarget=s0+s2-s1+1;
      const fourth=m.innings[3];
      if(fourth && fourth.runs>=chaseTarget){won=secondSide==='user';result=secondSide==='user'?`Won by ${10-fourth.wickets} wickets`:`Lost by ${10-fourth.wickets} wickets`;}
      else if(fourth && fourth.wickets>=10){won=firstSide==='user';result=firstSide==='user'?`Won by ${chaseTarget-fourth.runs-1} runs`:`Lost by ${chaseTarget-fourth.runs-1} runs`;}
      else {tied=false;result='Match drawn';}
    }
    if(m.redBall && m.innings.length<4) result='Match drawn';
    m.won=won;m.tied=tied;m.result=result;m.resultText=result;m.phase='result';m.done=true;
    m.playerBat.played=!!m.playerBat.played;
    m.playerBat.dismissals=m.playerBat.dismissals||0;
    m.overs=m.oversLimit;
    m.ownExtras=ownInns.reduce((s,x)=>s+x.extras,0);
    m.opponentSkill=55+(p.stage||0)*5;
    m.playerBowling={overs:m.playerOvers,runs:m.playerRunsConceded,wickets:m.playerWickets,maidens:m.playerMaidens};
  }
  function completeCurrentInnings(m) {
    const inn=m.currentInnings;
    if(!inn) return;
    inn.complete=true;
    const summary=summariseInnings(inn);
    m.innings.push(summary);
    m.currentInnings=null;
    if(m.innings.length>=m.inningsSequence.length){finishResult(m);return;}
    m.phase='innings-break';
    m.dayCount += (m.redBall?1:0);
  }
  function continueInnings() {
    const p=career(),m=p?.match;
    if(!m||m.phase!=='innings-break')return;
    const side=m.inningsSequence[m.innings.length];
    setupInnings(m,side);
    advanceUntilAction(m);
    saveAndRender();
  }
  function handlePlayerShot() {
    const p=career(),m=p?.match;
    if(!m||m.phase!=='batting')return;
    const get=(id,def)=>$(id)?.value??def;
    const choice={shot:document.querySelector('input[name="shotPick"]:checked')?.value || 'defend',footwork:get('footworkChoice','crease'),intent:get('intentChoice','balanced'),readLength:get('readLength','good length'),readLine:get('readLine','outside off'),timing:get('timingInput',72)};
    computeBattingDelivery(m,choice);
    const inn=m.currentInnings;
    if(inn && inn.legalBalls%6===0 && inn.legalBalls>0)applyOverEnd(inn);
    m.phase='playing';advanceUntilAction(m);saveAndRender();
  }
  function handlePlayerBowl() {
    const p=career(),m=p?.match;
    if(!m||m.phase!=='bowling')return;
    const get=(id,def)=>$(id)?.value??def;
    const choice={line:get('bowlLine','outside off'),length:get('bowlLength','good length'),variation:get('bowlVariation','stock'),field:get('fieldSetting','balanced'),release:get('releaseInput',78)};
    computeBowlingDelivery(m,choice);
    const inn=m.currentInnings;
    if(inn && inn.legalBalls%6===0 && inn.legalBalls>0)applyOverEnd(inn);
    m.phase='playing';advanceUntilAction(m);saveAndRender();
  }
  function simulateNextOver() {
    const p=career(),m=p?.match;
    if(!m||m.phase!=='playing')return;
    const start=m.currentInnings?.legalBalls||0;
    let safety=0;
    while(m.phase==='playing' && m.currentInnings && (m.currentInnings.legalBalls-start<6) && safety<400){
      if(m.currentInnings && isInningsComplete(m.currentInnings)){completeCurrentInnings(m);break;}
      const action=needsPlayerAction(m);
      if(action){m.phase=action;break;}
      if(m.currentInnings.side==='opponent' && fieldingPrompt(m))break;
      const before=m.currentInnings.legalBalls;runAiDelivery(m);if(m.currentInnings && m.currentInnings.legalBalls>before && m.currentInnings.legalBalls%6===0)applyOverEnd(m.currentInnings);safety++;
    }
    advanceUntilAction(m);saveAndRender();
  }
  function tossView(m) {
    const userWon=m.tossWinner==='user';
    return `<div class="panel match-card"><div class="eyebrow">THE TOSS · ${esc(m.format)}</div><h2>${esc(m.ownTeam)} vs ${esc(m.opposition)}</h2><p>${userWon?'You have won the toss.':'The opposition have won the toss.'}</p><p class="muted">Pitch: ${esc(m.pitch)} · ${m.oversLimit} overs per innings${m.redBall?' · Four innings, red-ball match':''}</p>${userWon?`<div class="choice-grid"><button class="primary" onclick="MaidanToss('bat')">🏏 Bat first</button><button onclick="MaidanToss('bowl')">🎯 Bowl first</button></div>`:`<p>${esc(m.opposition)} have elected to ${m.tossDecision} first.</p><button class="primary" onclick="MaidanToss('continue')">Start match</button>`}<p class="muted">Your decisions will influence the innings. A match is not decided by a single rating: conditions, role, skill, fitness, choices and execution all matter.</p></div>`;
  }
  function scoreboard(m,inn) {
    const target=inn.target?`<span>Target <b>${inn.target}</b> · Need ${Math.max(0,inn.target-inn.runs)} from ${Math.max(0,inn.maxOvers*6-inn.legalBalls)} balls</span>`:'';
    const striker=inn.batters[inn.strikerIndex],partner=inn.batters[inn.nonStrikerIndex];
    return `<div class="scoreboard"><div><div class="eyebrow">${esc(inn.teamName)} · INNINGS ${inn.inningsNo}</div><div class="big-score">${inn.runs}<small>/${inn.wickets}</small></div><div class="score-meta"><span>${formatOvers(inn.legalBalls)} / ${inn.maxOvers} overs</span><span>RR ${inn.legalBalls?(inn.runs/(inn.legalBalls/6)).toFixed(2):'0.00'}</span>${target}</div></div><div class="crease"><div><span>STRIKER</span><b>${esc(striker?.name||'—')}</b><small>${striker?.runs||0} (${striker?.balls||0})</small></div><div><span>NON-STRIKER</span><b>${esc(partner?.name||'—')}</b><small>${partner?.runs||0} (${partner?.balls||0})</small></div></div></div>`;
  }
  function recentBallList(m) {
    return `<div class="panel"><h3>Over-by-over commentary</h3>${m.lastBalls?.length?m.lastBalls.slice(0,6).map(x=>`<div class="commentary-row"><span class="ball-chip">${esc(x.ball)}</span><div><b>${esc(x.text)}</b><small>${esc(x.score)} · ${esc(x.overs)} overs</small></div></div>`).join(''):'<p class="muted">The first delivery is about to be bowled.</p>'}</div>`;
  }
  function battingView(m,inn) {
    const bowler=chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    return `${scoreboard(m,inn)}<div class="panel match-card"><div class="eyebrow">YOU ARE BATTING · DELIVERY ${formatOvers(inn.legalBalls+1)}</div><h2>Read the bowler. Make your decision.</h2><p class="muted">${esc(bowler?.name||'Bowler')} · ${esc(bowler?.style||'Right-arm medium')} · ${esc(m.pitch)}</p>
      <label>Read the length<select id="readLength"><option value="good length">Good length</option><option value="full">Full</option><option value="short">Short</option><option value="yorker">Yorker</option><option value="bouncer">Bouncer</option></select></label>
      <label>Read the line<select id="readLine"><option value="outside off">Outside off</option><option value="off stump">Off stump</option><option value="middle">Middle</option><option value="leg stump">Leg stump</option><option value="wide outside off">Wide outside off</option></select></label>
      <div class="choice-grid">${shotOptions.map(([id,label,tag])=>`<label class="shot-option"><input type="radio" name="shotPick" value="${id}" ${id==='defend'?'checked':''}><span><b>${label}</b><small>${tag}</small></span></label>`).join('')}</div>
      <div class="grid"><label>Footwork<select id="footworkChoice"><option value="front">Front foot</option><option value="back">Back foot</option><option value="crease">Stay in crease / adjust</option></select></label><label>Intent<select id="intentChoice"><option value="cautious">Cautious — protect wicket</option><option value="balanced" selected>Balanced — build innings</option><option value="aggressive">Aggressive — score quickly</option></select></label></div>
      <label>Shot timing <output id="timingOutput">72 / 100</output><input id="timingInput" type="range" min="0" max="100" step="1" value="72" oninput="$('timingOutput').textContent=this.value+' / 100'"></label>
      <p class="muted">A good read and balanced timing improve control. Aggressive intent can create boundaries, but it raises dismissal risk. Defending, leaving and rotating strike are valid decisions.</p>
      <button class="primary action-full" onclick="MaidanPlayShot()">Play this delivery →</button></div>${recentBallList(m)}`;
  }
  function bowlingView(m,inn) {
    const batter=inn.batters[inn.strikerIndex],bowler=chooseBowlerForOver(m,inn,Math.floor(inn.legalBalls/6));
    return `${scoreboard(m,inn)}<div class="panel match-card"><div class="eyebrow">YOU ARE BOWLING · ${formatOvers(inn.legalBalls+1)}</div><h2>Set the plan. Execute the delivery.</h2><p class="muted">Facing ${esc(batter?.name||'Batter')} · ${esc(bowler?.style||career()?.bowl||'Right-arm medium')} · Bowler figures ${bowler?.wickets||0}/${bowler?.runs||0}</p>
      <div class="grid"><label>Line<select id="bowlLine"><option value="outside off">Outside off</option><option value="off stump">Off stump</option><option value="middle">Middle stump</option><option value="leg stump">Leg stump</option></select></label><label>Length<select id="bowlLength"><option value="good length">Good length</option><option value="full">Full</option><option value="short">Short</option><option value="yorker">Yorker</option><option value="bouncer">Bouncer</option></select></label><label>Variation<select id="bowlVariation"><option value="stock">Stock ball</option><option value="swing">Swing / seam</option><option value="slower">Slower ball</option><option value="googly">Variation / googly</option></select></label><label>Field setting<select id="fieldSetting"><option value="balanced">Balanced field</option><option value="attacking">Attacking field</option><option value="defensive">Defensive field</option></select></label></div>
      <label>Release timing <output id="releaseOutput">78 / 100</output><input id="releaseInput" type="range" min="0" max="100" value="78" oninput="$('releaseOutput').textContent=this.value+' / 100'"></label>
      <p class="muted">Good release and a clear plan help control line, length and variation. Attacking fields increase wicket opportunity but may concede more boundaries.</p>
      <button class="primary action-full" onclick="MaidanBowlDelivery()">Deliver the ball →</button></div>${recentBallList(m)}`;
  }
  function fieldingView(m,inn) {
    const e=m.pendingFielding;
    return `${scoreboard(m,inn)}<div class="panel match-card"><div class="eyebrow">FIELDING MOMENT</div><h2>Be ready — the ball is coming your way.</h2><p>${esc(e?.description||'A fielding chance has developed.')}</p><div class="choice-grid"><button onclick="MaidanFieldChoice('safe')">Safe hands / stop the ball</button><button onclick="MaidanFieldChoice('attack')">Attack the ball</button><button onclick="MaidanFieldChoice('dive')">Dive / attempt a direct hit</button></div></div>${recentBallList(m)}`;
  }
  function inningsBreakView(m) {
    const last=m.innings[m.innings.length-1];
    const nextSide=m.inningsSequence[m.innings.length];
    const label=teamLabel(m,nextSide);
    return `<div class="panel match-card"><div class="eyebrow">INNINGS ${last.inningsNo} COMPLETE</div><h2>${esc(last.teamName)} · ${last.runs}/${last.wickets}</h2><p>${last.overs} overs · Extras ${last.extras} · ${last.fours} fours · ${last.sixes} sixes</p><div class="notice">${m.redBall?'The red-ball match continues. Review the score and prepare for the next innings.':'The first innings is complete. The chase begins next.'}</div><p><b>Next to bat:</b> ${esc(label)}</p><div class="actions"><button class="primary" onclick="MaidanContinueInnings()">Continue to innings ${m.innings.length+1} →</button><button onclick="MaidanOpenScorecard()">Review scorecard</button></div>${scorecardHTML(m)}</div>`;
  }
  function scorecardHTML(m) {
    return (m.innings||[]).map(inn=>`<details class="panel"><summary><b>Innings ${inn.inningsNo} · ${esc(inn.teamName)} · ${inn.runs}/${inn.wickets}</b></summary><p class="muted">${inn.overs} overs · Extras ${inn.extras}</p><div class="table-wrap"><table class="data"><thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>Dismissal</th></tr></thead><tbody>${inn.batters.map(b=>`<tr><td>${esc(b.name)}</td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${esc(b.dismissal)}</td></tr>`).join('')}</tbody></table></div><div class="table-wrap"><table class="data"><thead><tr><th>Bowler</th><th>Overs</th><th>Runs</th><th>Wkts</th></tr></thead><tbody>${inn.bowlers.map(b=>`<tr><td>${esc(b.name)}</td><td>${esc(b.overs)}</td><td>${b.runs}</td><td>${b.wickets}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
  }
  function resultView(m) {
    const p=career();
    const own=m.innings.filter(x=>x.side==='user'),opp=m.innings.filter(x=>x.side==='opponent');
    return `<div class="panel match-result"><div class="eyebrow">FULL-TIME · ${esc(m.format)} · ${esc(m.competition)}</div><h2>${m.won?'🏆 Victory':m.tied?'🤝 Match tied':'Match complete'}</h2><p class="result-line">${esc(m.result)}</p><div class="dashboard-grid"><div class="dashboard-metric"><span>Your team</span><strong>${m.ownRuns}/${m.ownWickets}</strong></div><div class="dashboard-metric"><span>Opposition</span><strong>${m.opponentRuns}/${m.opponentWickets}</strong></div><div class="dashboard-metric"><span>Your batting</span><strong>${m.playerBat.played?`${m.playerBat.runs} (${m.playerBat.balls})`:'Did not bat'}</strong></div><div class="dashboard-metric"><span>Your bowling</span><strong>${m.playerOvers?`${m.playerWickets}/${m.playerRunsConceded}`:'Did not bowl'}</strong></div></div><p class="muted">Your performance feeds into form, fitness, reputation, coach assessment, scouting reports and the selection record. One match will not secure promotion by itself.</p></div>${scorecardHTML(m)}<div class="panel"><h2>Match report</h2><ul><li>${m.won?'The result strengthens your team record.':'Review what went wrong. A defeat does not erase your previous work.'}</li><li>Player workload and fitness will be adjusted.</li><li>Coach and selector attention depends on performance quality, opposition strength and consistency.</li><li>Match payments and any contract instalments are recorded in your financial ledger.</li></ul><button class="primary action-full" onclick="MaidanCompleteMatch()">Complete match & update my career</button></div>`;
  }
  function interactiveMatchView() {
    const p=career();
    if(!p)return '<div class="panel">Create your player first.</div>';
    const m=p.match;
    if(m && m.interactive){
      if(m.phase==='toss')return tossView(m);
      if(m.phase==='batting')return battingView(m,m.currentInnings);
      if(m.phase==='bowling')return bowlingView(m,m.currentInnings);
      if(m.phase==='fielding')return fieldingView(m,m.currentInnings);
      if(m.phase==='innings-break')return inningsBreakView(m);
      if(m.phase==='result')return resultView(m);
      return `<div class="panel"><h2>Match in progress</h2><p>Match state is being restored. Continue to the next player-controlled event.</p><button class="primary" onclick="MaidanResumeMatch()">Resume match</button></div>`;
    }
    const formats=typeof availableFormats==='function'?availableFormats():[];
    const selected=formats.find(f=>f.id===p.nextMatchFormat)?.id||formats[0]?.id||'t20';
    const comp=p.selectedCompetition?.name || 'Open fixture';
    const battingCapable=['Batter','All-rounder','Wicketkeeper-batter'].includes(p.role);
    return `<div class="panel match-card"><div class="eyebrow">MATCH CENTRE · PLAYER-CONTROLLED CRICKET</div><h2>Match day</h2><p>${esc(comp)} · ${esc(p.town)} XI</p><div class="dashboard-grid"><div class="dashboard-metric"><span>Fitness</span><strong>${p.fitness}/100</strong></div><div class="dashboard-metric"><span>Form</span><strong>${p.form||0}</strong></div><div class="dashboard-metric"><span>Batting</span><strong>${p.skills.bat}/100</strong></div><div class="dashboard-metric"><span>Bowling</span><strong>${p.skills.bowl}/100</strong></div></div>
      ${p.injury?`<div class="notice"><b>Medical unavailability:</b> ${esc(p.injury.name)} · ${p.injuryDays||p.injury.days||0} day(s) estimated. Complete recovery before playing.</div>`:''}
      <label>Competition format<select id="matchFormat" onchange="MaidanSetFormat(this.value)">${formats.map(f=>`<option value="${f.id}" ${f.id===selected?'selected':''}>${esc(f.name)} · ${f.overs} overs${['firstClass','test'].includes(f.id)?' per innings · 4 innings':''}</option>`).join('')}</select></label>
      <p class="muted">You will make decisions during your own batting and bowling spells. Other players' deliveries are simulated, with fielding chances when they come your way. Ranji-style matches use four innings; limited-overs matches use one innings per side.</p>
      <button class="primary action-full" onclick="MaidanStartMatch()" ${p.fitness<15||p.injury||p.injuryDays>0?'disabled':''}>Start match · coin toss →</button>
    </div><div class="panel"><h3>Before you play</h3><p>Choose a match strategy in the innings breaks. Protect your wicket, rotate strike, set fields, and balance risk with match conditions. The match engine records ball-by-ball events and full scorecards.</p><div class="muted">No instant result button. Results are earned through the innings.</div></div>`;
  }
  function completeInteractiveMatch() {
    const p=career(),m=p?.match;
    if(!m||!m.interactive||m.phase!=='result'||!m.done)return;
    const ownInns=m.innings.filter(x=>x.side==='user');
    const firstOwn=ownInns[0]||{batters:[],runs:0,wickets:0,overs:'0.0',extras:0};
    const playerBat=m.playerBat;
    const playerBowl=m.innings.flatMap(x=>x.bowlers||[]).filter(x=>x.isPlayer);
    const playerBalls=playerBowl.reduce((s,x)=>s+(x.balls||0),0);
    m.playerOvers=playerBalls/6;
    m.playerRunsConceded=playerBowl.reduce((s,x)=>s+(x.runs||0),0);
    m.playerWickets=playerBowl.reduce((s,x)=>s+(x.wickets||0),0);
    m.playerMaidens=playerBowl.reduce((s,x)=>s+(x.maidens||0),0);
    m.playerCatches=m.innings.reduce((s,x)=>s+(x.playerCatches||0),0);
    m.ownBatters=firstOwn.batters.map(x=>({...x}));m.ownExtras=ownInns.reduce((s,x)=>s+(x.extras||0),0);
    m.opponentSkill=58+(p.stage||0)*5;m.resultText=m.result;m.done=true;m.completed=false;
    m.playerBat={played:!!playerBat.played,runs:playerBat.runs,balls:playerBat.balls,fours:playerBat.fours,sixes:playerBat.sixes,dismissal:playerBat.dismissal||'Did not bat',dismissals:playerBat.dismissals||0};
    m.playerBowling={overs:m.playerOvers,runs:m.playerRunsConceded,wickets:m.playerWickets,maidens:m.playerMaidens};
    if(typeof state.legacyFinish==='function') state.legacyFinish();
    if(Number(p.stage)===0 && !m.realismUpdated && typeof window.applyRealismMatchUpdate==='function'){
      window.applyRealismMatchUpdate(m.playerBat || {runs:0});
      m.realismUpdated=true;
    }
    const wasTrial=!!(p.activeTrial?.id && m.trialId);
    if(wasTrial) resolveTrialMatch(m);
    if(typeof go==='function') go(wasTrial?'Scouting':'Home');
    else saveAndRender();
  }
  function resolveTrialMatch(m) {
    const p=career(),trial=(p.trials||[]).find(t=>t.id===m.trialId);
    if(!trial)return;
    const batting=m.playerBat||{}, bowling=m.playerWickets||0;
    const contribution=(batting.runs||0)*.9+(bowling*24)+(m.playerCatches||0)*8;
    const levelFactor=(p.stage||0)*7;
    const pass=contribution+levelFactor+(p.fitness||0)*.12+(p.form||0)*.4 >= 42 + (trial.level?.includes('Senior')?36:trial.level?.includes('State')?20:0);
    trial.status='Completed';trial.resultDay=p.day;trial.selectionStatus=pass?'Shortlisted':'Not selected';
    trial.outcome=pass?`Trial performance accepted: ${batting.runs||0} runs and ${bowling} wicket(s). You have been shortlisted for final squad discussion.`:`Trial not successful: ${batting.runs||0} runs and ${bowling} wicket(s). The coach has asked you to keep building match evidence.`;
    trial.squadDecision=pass?'Pending': 'Not selected';
    if(pass){p.rep=(p.rep||0)+9;pushInbox('Trial shortlist','You have been shortlisted after your trial',trial.outcome,'Scouting');}
    else pushInbox('Trial feedback','Trial assessment feedback',trial.outcome,'Scouting');
    p.activeTrial=null;
    if(typeof save==='function')save();
  }
  function setFormat(id) { const p=career();if(!p)return;p.nextMatchFormat=id;saveAndRender(); }

  // Career conversations: selectors and coaches give feedback, not automatic promotions.
  function ensureConversationState(p) {
    p.realism=p.realism||{};
    const r=p.realism;
    if(!Array.isArray(r.conversations))r.conversations=[];
    if(!Number.isFinite(r.selectorTrust))r.selectorTrust=0;
    if(!Number.isFinite(r.selectorMeetingDay))r.selectorMeetingDay=0;
    if(!Number.isFinite(r.coachMeetings))r.coachMeetings=0;
    if(!Array.isArray(r.performanceTargets))r.performanceTargets=[];
    return r;
  }
  function recentPerformance(p) {
    const rows=(p.scorecards||[]).slice(0,8);
    const runs=rows.reduce((s,x)=>s+(x.runs||0),0);
    const wickets=rows.reduce((s,x)=>s+(x.wickets||0),0);
    const average=rows.length?runs/rows.length:0;
    const wins=rows.filter(x=>x.won).length;
    return {matches:rows.length,runs,wickets,average,wins,rows};
  }
  function selectorNeed(p) {
    const perf=recentPerformance(p);
    const batRole=['Batter','All-rounder','Wicketkeeper-batter'].includes(p.role);
    const bowlRole=['Bowler','All-rounder'].includes(p.role);
    if (batRole && perf.average<22) return 'Your recent batting contributions need greater consistency. Build longer innings and reduce low-score dismissals.';
    if (bowlRole && perf.wickets<2) return 'Your wicket-taking impact needs to improve. Review your line, length, control and match-up plans.';
    if (p.fitness<60) return 'Your availability is a concern. Bring fitness up and manage workload before the next selection window.';
    if (p.form<0) return 'Recent form has dipped. Selectors want to see a response over the next few appearances.';
    return 'You are showing promise. We need to see this level of performance repeated against stronger opposition.';
  }
  function journeyConversationsPanel(p) {
    const r=ensureConversationState(p), perf=recentPerformance(p);
    const selectorUnlocked=(p.stage>=1 && p.matches>=5 && p.rep>=35) || !!p.selection || (p.trials||[]).some(t=>t.status==='Completed');
    const latest=r.conversations.slice(0,4).map(c=>`<div class="conversation-card"><div class="muted">${esc(c.type)} · Day ${c.day}</div><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div>`).join('');
    return `<section class="panel conversation-panel"><div class="eyebrow">THE PEOPLE WHO SHAPE YOUR CAREER</div><h2>Coach & selector conversations</h2><p class="muted">Meetings are based on your record and career stage. A good conversation can build trust or clarify expectations; it cannot replace performances or guarantee selection.</p>
      <div class="grid"><div class="panel"><h3>Coach meeting</h3><p>Your coach reviews your technique, discipline, fitness and response to feedback.</p><p class="muted">Trust ${p.realism?.coachTrust||0}/100 · Opinion ${p.realism?.coachOpinion||0}/100</p><button onclick="MaidanCoachMeeting()">Request coach feedback</button></div>
      <div class="panel"><h3>Selection committee</h3><p>${selectorUnlocked?'Your current record is ready for a discussion about role fit, consistency and the next selection window.':'Selectors are not yet holding formal meetings for your profile. Build match experience, performance and reputation first.'}</p><p class="muted">Selector relationship ${r.selectorTrust}/100 · ${perf.matches} recent scorecards</p><button class="primary" onclick="MaidanSelectorMeeting()" ${selectorUnlocked?'':'disabled'}>Request selector meeting</button></div></div>
      ${latest?`<h3>Recent discussions</h3>${latest}`:'<p class="muted">Your coach and selector discussions will be recorded here as the journey develops.</p>'}</section>`;
  }
  function openCoachMeeting() {
    const p=career();if(!p)return;const r=ensureConversationState(p);const msg=selectorNeed(p);
    const coach=p.realism?.coach?.name||'Your coach';
    const html=`<div class="panel"><div class="eyebrow">PRIVATE COACH MEETING</div><h2>${esc(coach)}</h2><div class="chat-thread"><div class="chat-row chat-team"><div class="chat-bubble"><div class="chat-who">COACH</div>“I have reviewed your recent performances. ${esc(msg)} What would you like to do next?”</div></div></div><div class="choice-grid"><button onclick="MaidanCoachResponse('accept')">I understand. I'll work on it.</button><button onclick="MaidanCoachResponse('detail')">Show me specific areas to improve.</button><button onclick="MaidanCoachResponse('challenge')">I believe I'm ready for a bigger opportunity.</button></div><button onclick="renderJourney()">Return to career journey</button></div>`;
    $('screen').innerHTML=html;
  }
  function coachResponse(choice) {
    const p=career();if(!p)return;const r=ensureConversationState(p);const msg=selectorNeed(p);const coach=p.realism?.coach?.name||'Your coach';
    let text='';
    if(choice==='accept'){r.coachTrust=clamp((r.coachTrust||0)+4);r.development.discipline=clamp((r.development.discipline||30)+3);text=`${coach}: “Good. Consistency matters. I will note your commitment, but you still need to deliver in the next matches.” ${msg}`;}
    else if(choice==='detail'){r.coachTrust=clamp((r.coachTrust||0)+2);r.coachOpinion=clamp((r.coachOpinion||0)+1);r.performanceTargets.unshift({title:'Coach action plan',description:msg,createdDay:p.day,status:'Active'});text=`${coach}: “Let's make this measurable. ${msg} We'll review your response after three competitive appearances.”`;}
    else {const perf=recentPerformance(p);const well=perf.matches>=5 && ((p.role==='Bowler'?perf.wickets>=6:perf.runs>=160));r.coachTrust=clamp((r.coachTrust||0)+(well?2:-5));text=well?`${coach}: “You have a case, and I respect the ambition. Keep this level against stronger opposition; I'll discuss an assessment with the selectors.”`:`${coach}: “Ambition is good. But I need more evidence before I recommend you. ${msg}`;}
    r.coachMeetings++;r.conversations.unshift({day:p.day,type:'Coach meeting',title:'Feedback & development discussion',text});r.conversations=r.conversations.slice(0,30);
    if(typeof realismEvent==='function')realismEvent('Coach meeting',text,'Conversation');p.notice=text;p.noticeContext='Career Journey';saveAndRender();
    if(typeof renderJourney==='function')renderJourney();
  }
  function openSelectorMeeting() {
    const p=career();if(!p)return;const r=ensureConversationState(p);const perf=recentPerformance(p);const assessment=selectorNeed(p);
    const selectionReady=!!p.selection && typeof meetsStageRequirements==='function' && meetsStageRequirements(p.selection.stage);
    const selector=['State association selector','District selection panel','Age-group selection committee','Senior selection panel'][Math.min(3,p.stage||0)];
    const html=`<div class="panel"><div class="eyebrow">SELECTION COMMITTEE · FORMAL DISCUSSION</div><h2>${esc(selector)}</h2><p class="muted">They have reviewed your role, match record, recent form, fitness and available squad depth.</p><div class="chat-thread"><div class="chat-row chat-team"><div class="chat-bubble"><div class="chat-who">SELECTOR</div>“Your file shows ${p.matches} career matches, ${p.runs} runs and ${p.wickets||0} wickets. ${esc(assessment)} We are not promising a place today. What do you want to discuss?”</div></div></div><div class="choice-grid"><button onclick="MaidanSelectorResponse('criteria')">Explain the selection criteria for my role.</button><button onclick="MaidanSelectorResponse('evidence')">Review my recent match performances.</button><button onclick="MaidanSelectorResponse('trial')" ${selectionReady?'':'disabled'}>Request a formal trial assessment.</button><button onclick="MaidanSelectorResponse('listen')">I understand. I'll keep working.</button></div><button onclick="renderJourney()">Return to career journey</button></div>`;
    $('screen').innerHTML=html;
  }
  function selectorResponse(choice) {
    const p=career();if(!p)return;const r=ensureConversationState(p);const perf=recentPerformance(p);let text='',title='Selection committee discussion';
    if(choice==='criteria'){
      const bat=['Batter','All-rounder','Wicketkeeper-batter'].includes(p.role);
      const bowl=['Bowler','All-rounder'].includes(p.role);
      text=`Selector: “For your role we look at sustained performance, not a single score. ${bat?'Batting consistency, average, strike rotation and performance under pressure. ':''}${bowl?'Wickets, control, economy and impact in different phases. ':''}For every player we also assess fielding, fitness, temperament, conduct and team balance.”`;
      r.selectorTrust=clamp(r.selectorTrust+4);
    } else if(choice==='evidence') {
      const summaries=perf.rows.slice(0,4).map(x=>`${x.competition||x.format}: ${x.runs||0} runs, ${x.wickets||0} wickets`).join('; ')||'No completed scorecards yet';
      text=`Selector: “Your recent record is: ${summaries}. We will compare this with the standard of the competition and the needs of the squad. Continue performing at this level against stronger opponents.”`;
      r.selectorTrust=clamp(r.selectorTrust+3);
    } else if(choice==='trial') {
      const target=p.selection?.stage;
      if(!target || typeof meetsStageRequirements!=='function' || !meetsStageRequirements(target))text='Selector: “You are not eligible for a formal assessment at this point. Return after meeting the performance and availability benchmarks.”';
      else {
        const id=`formal-trial-${p.day}-${Math.floor(Math.random()*100000)}`;
        const formatId=p.nextMatchFormat||'t20';
        p.trials=p.trials||[];p.trials.unshift({id,scout:'Selection Committee',level:stages[target]?.name||'Next level assessment',stage:target,formal:true,status:'Invited',day:p.day,format:formatId==='firstClass'?'First-class':formatId==='listA'?'List A':'T20',formatId,competition:p.selectedCompetition?.name||'Selection trial',selectionStatus:'Awaiting assessment'});
        p.activeTrial={id,stage:target};r.selectorTrust=clamp(r.selectorTrust+5);
        text='Selector: “Your assessment has been scheduled. This is an opportunity to demonstrate your ability in a competitive match. Your performance will determine whether you are shortlisted.”';
        if(typeof pushInbox==='function')pushInbox('Formal trial scheduled','A selection assessment has been scheduled',text,'Scouting');
      }
    } else {
      r.selectorTrust=clamp(r.selectorTrust+5);text='Selector: “That is the right approach. Stay available, keep improving and let your cricket do the talking. We will continue monitoring your record.”';
    }
    r.selectorMeetingDay=p.day;r.conversations.unshift({day:p.day,type:'Selector meeting',title,text});r.conversations=r.conversations.slice(0,30);
    if(typeof realismEvent==='function')realismEvent('Selector meeting',text,'Selection');p.notice=text;p.noticeContext='Career Journey';saveAndRender();
    if(typeof renderJourney==='function')renderJourney();
  }

  function newJourney() {
    const p=career();if(!p)return;
    if(typeof state.legacyJourney==='function')state.legacyJourney();
    const panel=journeyConversationsPanel(p);
    $('screen')?.insertAdjacentHTML('beforeend',panel);
    if(p.activeTrial){$('screen')?.insertAdjacentHTML('afterbegin',`<div class="panel notice"><b>Trial assessment pending</b><p>Your trial is ready. Start the next match to play the assessment. The result will be judged on your actual match contribution.</p><button class="primary" onclick="MaidanStartTrial()">Start trial match</button></div>`);}
  }
  function startTrial() {
    const p=career();if(!p?.activeTrial)return;
    p.selectedCompetition={id:'trial',name:`${p.trials.find(x=>x.id===p.activeTrial.id)?.level||'Selection'} Trial`,format:'Assessment match'};
    p.nextMatchFormat=p.trials?.find(x=>x.id===p.activeTrial.id)?.formatId||'t20';
    p.match=null;
    if(typeof go==='function')go('Match');else saveAndRender();
  }
  function trialAttend(id) {
    const p=career();if(!p)return;const trial=(p.trials||[]).find(t=>t.id===id&&t.status==='Invited');if(!trial)return;
    const target=Number(trial.stage||p.selection?.stage||p.stage+1);
    p.activeTrial={id:trial.id,stage:target};trial.status='Scheduled';
    p.selectedCompetition={id:trial.formal?'formal-selection-trial':'scouting-trial',name:trial.competition||`${trial.level} assessment`,format:trial.format||'T20 trial'};
    p.nextMatchFormat=trial.formatId||'t20';
    p.notice='Your assessment has been scheduled. You will play the trial match yourself; the result will be based on your actual contribution.';p.noticeContext='Scouting';saveAndRender();
    if(typeof go==='function')go('Match');
  }
  function stageConversationGate() {
    const p=career();if(!p)return;
    const target=p.selection?.stage;
    if(!target || typeof meetsStageRequirements!=='function' || !meetsStageRequirements(target)){
      p.notice='Selection review is not available yet. Build your match record, form, fitness and reputation, then request a selector meeting.';p.noticeContext='Career Journey';saveAndRender();return false;
    }
    const r=ensureConversationState(p);
    const requiredTrust=12+(Number(target)||0)*5;
    if(r.selectorTrust<requiredTrust){p.notice=`The selection committee wants a formal discussion first. Current relationship: ${r.selectorTrust}; expected: ${requiredTrust}. Request a selector meeting and discuss your record.`;p.noticeContext='Career Journey';saveAndRender();return false;}
    const selectedTrial=(p.trials||[]).some(t=>t.formal&&Number(t.stage)===Number(target)&&t.status==='Completed'&&t.selectionStatus==='Squad selected');
    if(!selectedTrial){p.notice='You have met the paper benchmarks, but selection requires the next step: hold a selector meeting, receive a formal trial invitation, play the assessment match, and succeed in the final squad review.';p.noticeContext='Career Journey';saveAndRender();return false;}
    return true;
  }
  function stricterApplySelection() {
    const p=career();if(!p)return;
    if(!stageConversationGate())return;
    const target=p.selection.stage;
    const perf=recentPerformance(p);
    const average=perf.matches?perf.runs/perf.matches:0;
    const r=ensureConversationState(p);
    const form=Math.max(0,Math.min(10,Number(p.form)||0));
    const readiness=(p.skills.bat+p.skills.bowl+p.skills.field+p.skills.fit)/4;
    const roleBonus=p.role==='Bowler'?Math.min(8,perf.wickets*1.2):Math.min(8,average/12);
    const careerManager=(p.managers||[]).find(m=>m.roleId==='career_manager'&&['Active','Notice given'].includes(m.status));
    const careerPlanningBonus=careerManager?Math.min(5,3+Math.floor((Number(careerManager.rating)||55)/50)):0;
    const chance=Math.max(5,Math.min(38,7+Math.floor((p.rep-stages[target].need)/60)+Math.floor((readiness-stageRequirements(target).skill)/3)+Math.floor((p.fitness-stageRequirements(target).fitness)/6)+form+roleBonus+careerPlanningBonus+r.selectorTrust*.06));
    const last=Number(p.selection.lastAttemptDay)||0;
    if(p.day-last<7){p.notice=`The committee needs time to review fresh evidence. You can request another decision after ${7-(p.day-last)} in-game days.`;p.noticeContext='Career Journey';saveAndRender();return;}
    p.selection.lastAttemptDay=p.day;
    const pass=Math.random()*100<chance;
    if(pass){const old=stages[p.stage].name;p.stage=target;p.career=stages[target].name;p.selection=null;r.selectorTrust=clamp(r.selectorTrust+8);r.coachTrust=clamp((r.coachTrust||0)+5);p.history.unshift(`Selection earned: progressed from ${old} to ${p.career} after a selector review.`);p.history=p.history.slice(0,40);if(typeof receiveTeamOffers==='function')receiveTeamOffers(true);p.notice=`Selection committee decision: selected for ${p.career}. The opportunity was earned through your record, fitness and assessment.`;if(p.activeTrial)p.activeTrial=null;}
    else {r.selectorTrust=clamp(r.selectorTrust-2);p.notice=`The committee has not selected you this time. Estimated decision likelihood was ${chance}%. Feedback: ${selectorNeed(p)} Continue to play and request a later review.`;}
    p.noticeContext='Career Journey';
    r.conversations.unshift({day:p.day,type:'Selection decision',title:pass?'Selection confirmed':'Not selected this window',text:p.notice});saveAndRender();if(typeof renderJourney==='function')renderJourney();
  }

  // Replace the auto-simulated match controls with the player-controlled engine.
  state.legacyFinish=window.finishMatch;
  state.legacyCareer=window.career;
  state.legacyScouting=window.scouting;
  state.legacyJourney=window.renderJourney;
  state.legacyApplySelection=window.applyForSelection;
  window.matchView=interactiveMatchView;
  window.startMatch=function(){
    const p=career();if(!p)return;
    if(p.injury||Number(p.injuryDays)>0){p.notice='You are medically unavailable. Complete recovery and rehabilitation before playing.';p.noticeContext='Management Tools';saveAndRender();return;}
    if((p.fitness||0)<15){p.notice='Fitness is too low to play safely. Choose a recovery block before the match.';p.noticeContext='Management Tools';saveAndRender();return;}
    if(p.match?.interactive && !['result'].includes(p.match.phase)){p.notice='You already have a match in progress. Resume it rather than starting another fixture.';p.noticeContext='Match';saveAndRender();return;}
    p.match=createMatch();
    if(p.activeTrial)p.match.trialId=p.activeTrial.id;
    p.notice='Match created. Win the toss, set your strategy and play your innings.';p.noticeContext='Match';saveAndRender();
  };
  window.matchLive=interactiveMatchView;
  window.finishMatch=completeInteractiveMatch;
  window.MaidanStartMatch=window.startMatch;
  window.MaidanToss=tossDecision;
  window.MaidanPlayShot=handlePlayerShot;
  window.MaidanBowlDelivery=handlePlayerBowl;
  window.MaidanFieldChoice=resolveFielding;
  window.MaidanContinueInnings=continueInnings;
  window.MaidanCompleteMatch=completeInteractiveMatch;
  window.MaidanResumeMatch=function(){const p=career();if(!p?.match)return;advanceUntilAction(p.match);saveAndRender();};
  window.MaidanSetFormat=setFormat;
  window.MaidanOpenScorecard=function(){const p=career();if(!p?.match)return;alert((p.match.innings||[]).map(x=>`Innings ${x.inningsNo}: ${x.teamName} ${x.runs}/${x.wickets}`).join('\n'));};
  window.MaidanCoachMeeting=openCoachMeeting;
  window.MaidanCoachResponse=coachResponse;
  window.MaidanSelectorMeeting=openSelectorMeeting;
  window.MaidanSelectorResponse=selectorResponse;
  window.MaidanStartTrial=startTrial;
  window.MaidanTrialAttend=trialAttend;
  window.applyForSelection=stricterApplySelection;
  window.renderJourney=newJourney;
  window.resolveTrial=trialAttend;

  // Keep a persistent status card when the active match is resumed from the Home tab.
  const legacyRender=window.render;
  window.render=function(){
    if(typeof legacyRender==='function')legacyRender();
    const p=career();
    if(p && currentTab()==='Match'){
      const screen=$('screen');if(screen)screen.innerHTML=interactiveMatchView();
    }
  };

  // Mobile controls: prevent double-tap zoom on the frequent match action controls.
  document.addEventListener('click',e=>{
    const b=e.target.closest('.action-full,.shot-option button');
    if(b)b.classList.add('pressed');
  },{passive:true});

  // Attach mobile and selection CSS to the document once.
  if(!document.getElementById('maidan-interactive-style')){
    const style=document.createElement('style');style.id='maidan-interactive-style';
    style.textContent=`
      .match-card{border-color:#b4d9cb;background:linear-gradient(145deg,#fff,#f4fbf7)}
      .eyebrow{font-size:10px;font-weight:850;letter-spacing:1.7px;text-transform:uppercase;color:#0f766e;margin-bottom:8px}
      .scoreboard{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-radius:18px;background:linear-gradient(135deg,#102b25,#1a4737);color:#fff;padding:15px;margin:10px 0}
      .big-score{font-size:42px;line-height:1.05;font-weight:950;color:#f7d978;letter-spacing:-1.5px}.big-score small{font-size:24px;color:#fff}
      .score-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:#d4eee1;margin-top:8px}.score-meta b{color:#fff}
      .crease{display:grid;gap:8px;align-content:center}.crease>div{padding:8px 10px;border:1px solid #ffffff28;border-radius:10px;background:#ffffff0c}.crease span{display:block;font-size:9px;letter-spacing:1px;color:#b9d9cb}.crease b{display:block;font-size:12px;color:white}.crease small{display:block;color:#f6d978}
      .choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}.choice-grid button{min-height:48px;text-align:center}.shot-option{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #d8e6df;border-radius:12px;background:#fff;color:#20324a}.shot-option input{width:18px;height:18px;accent-color:#0f9f78;flex:0 0 auto}.shot-option span{display:grid;gap:2px}.shot-option b{font-size:13px;color:#172338}.shot-option small{font-size:10px;color:#718096}.shot-option:has(input:checked){border-color:#0f9f78;background:#e9fbf3;box-shadow:0 0 0 2px #10b98120}
      .action-full{width:100%;min-height:52px;margin-top:12px;font-size:15px}.commentary-row{display:flex;gap:10px;border-bottom:1px solid #e5ece9;padding:9px 0}.commentary-row:last-child{border-bottom:0}.commentary-row div{display:grid;gap:3px}.commentary-row b{font-size:12px}.commentary-row small{font-size:10px;color:#64748b}.ball-chip{display:grid;place-items:center;min-width:42px;height:32px;border-radius:9px;background:#e3f5ec;color:#08634a;font-weight:850;font-size:11px}
      .result-line{font-size:19px;font-weight:850;color:#087f5b}.match-result{background:linear-gradient(135deg,#eefbf4,#fff)}.conversation-panel{margin-top:14px;border-color:#d7e4ef}.conversation-card{padding:10px 12px;background:#f8fbff;border:1px solid #e1eaf2;border-radius:12px;margin:8px 0}.conversation-card p{font-size:13px}.chat-thread{max-width:100%}
      @media(max-width:700px){.scoreboard{grid-template-columns:1fr}.big-score{font-size:36px}.choice-grid{grid-template-columns:1fr 1fr}.shot-option{min-height:58px;padding:8px}.score-meta{font-size:10px}.action-full{position:sticky;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:5;box-shadow:0 6px 20px #102b2530}.match-card{padding:12px}}
    `;document.head.appendChild(style);
  }

  // Surface the player-controlled mode in the Match navigation and ensure save schema has the fields it uses.
  const p=career();
  if(p){
    p.realism=p.realism||{};ensureConversationState(p);
    if(p.match?.interactive && p.match.version!==state.matchVersion && p.match.phase!=='result'){
      p.match.phase='playing';p.match.version=state.matchVersion;
    }
    if(typeof save==='function')save();
  }
})();
