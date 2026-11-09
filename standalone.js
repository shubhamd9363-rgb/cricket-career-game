/*
 * MAIDAN — standalone gameplay systems
 * Extends the existing Beyond the Boundary career build without a Base44 runtime.
 * All currency values are fictional in-game INR.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(n) || 0)));
  const fmt = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const escHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (typeof p === 'undefined') return;

  const ROLE_NAMES = {
    sports_agent: 'Sports agent',
    career_manager: 'Career manager',
    business_manager: 'Business & commercial manager',
    financial_manager: 'Financial / wealth manager',
    legal_manager: 'Legal & contract manager',
    pr_manager: 'PR & communications manager',
    social_media_manager: 'Social media manager',
    travel_manager: 'Travel & logistics manager',
    personal_assistant: 'Personal assistant',
    security_manager: 'Security manager',
    team_manager: 'Team manager',
    director_cricket: 'Director of cricket',
    talent_scout: 'Talent / opportunity scout',
    head_coach: 'Personal head coach',
    batting_coach: 'Batting coach',
    bowling_coach: 'Bowling coach',
    fielding_coach: 'Fielding & wicketkeeping coach',
    fitness_coach: 'Strength & conditioning coach',
    physio: 'Physiotherapist / sports doctor',
    nutritionist: 'Sports nutritionist',
    psychologist: 'Sports psychologist',
    analyst: 'Performance analyst',
    mentor: 'Career mentor'
  };

  const MANAGER_DEFS = [
    { id: 'head_coach', category: 'Performance team', minStage: 0, minRep: 0, baseSalary: 260, signFee: 180, description: 'Builds your technical plan, reviews performances and coordinates specialist coaches.', effect: 'Training quality and development-plan gains improve.' },
    { id: 'batting_coach', category: 'Performance team', minStage: 0, minRep: 0, baseSalary: 220, signFee: 140, description: 'Works on technique, shot selection, strike rotation and match situations.', effect: 'Improves batting training gains and confidence after technical sessions.' },
    { id: 'bowling_coach', category: 'Performance team', minStage: 0, minRep: 5, baseSalary: 230, signFee: 150, description: 'Develops line, length, pace or spin, variations and bowling plans.', effect: 'Improves bowling development and reduces workload from bowling practice.' },
    { id: 'fielding_coach', category: 'Performance team', minStage: 0, minRep: 0, baseSalary: 180, signFee: 120, description: 'Develops catching, ground fielding, throwing and wicketkeeping skills.', effect: 'Improves fielding practice and match fielding readiness.' },
    { id: 'fitness_coach', category: 'Performance team', minStage: 0, minRep: 15, baseSalary: 240, signFee: 160, description: 'Plans strength, conditioning, mobility and workload progression.', effect: 'Improves conditioning sessions and reduces fatigue build-up.' },
    { id: 'physio', category: 'Performance team', minStage: 1, minRep: 25, baseSalary: 320, signFee: 220, description: 'Monitors injuries, rehabilitation, recovery and return-to-play readiness.', effect: 'Recovery restores more fitness and rehabilitation progresses faster.' },
    { id: 'nutritionist', category: 'Performance team', minStage: 1, minRep: 35, baseSalary: 260, signFee: 180, description: 'Plans match-day nutrition, hydration and recovery meals.', effect: 'Improves recovery and fitness maintenance.' },
    { id: 'psychologist', category: 'Performance team', minStage: 1, minRep: 35, baseSalary: 300, signFee: 200, description: 'Works on confidence, pressure, routines, setbacks and mental preparation.', effect: 'Improves morale and confidence after difficult matches.' },
    { id: 'analyst', category: 'Performance team', minStage: 1, minRep: 45, baseSalary: 350, signFee: 240, description: 'Reviews video, scoring patterns, dismissals, opposition and performance data.', effect: 'Adds performance insight and a small form/readiness benefit after matches.' },
    { id: 'mentor', category: 'Performance team', minStage: 0, minRep: 0, baseSalary: 150, signFee: 100, description: 'Provides career perspective, guidance and support through setbacks.', effect: 'Supports morale and confidence during career decisions.' },
    { id: 'sports_agent', category: 'Career & commercial', minStage: 0, minRep: 12, baseSalary: 120, signFee: 250, commission: 7, description: 'Finds opportunities, speaks to clubs and negotiates playing and commercial agreements.', effect: 'Negotiation leverage improves; a commission is deducted from eligible deals.' },
    { id: 'career_manager', category: 'Career & commercial', minStage: 1, minRep: 40, baseSalary: 380, signFee: 260, description: 'Plans career moves, reviews options and coordinates professional decisions.', effect: 'Improves access to relevant opportunities and reduces avoidable career setbacks.' },
    { id: 'talent_scout', category: 'Career & commercial', minStage: 1, minRep: 35, baseSalary: 280, signFee: 200, description: 'Finds trials, camps, club openings and development opportunities.', effect: 'Increases the chance of trial and scouting opportunities appearing.' },
    { id: 'business_manager', category: 'Career & commercial', minStage: 2, minRep: 95, baseSalary: 560, signFee: 450, description: 'Builds commercial relationships, evaluates brand deals and sponsorship terms.', effect: 'Improves commercial deal values and partnership opportunities.' },
    { id: 'social_media_manager', category: 'Career & commercial', minStage: 2, minRep: 85, baseSalary: 380, signFee: 300, description: 'Plans player communication, content, audience growth and digital reputation.', effect: 'Improves sponsor visibility and public profile growth.' },
    { id: 'pr_manager', category: 'Career & commercial', minStage: 3, minRep: 145, baseSalary: 620, signFee: 450, description: 'Handles interviews, media requests, public statements and reputation issues.', effect: 'Protects reputation and improves positive media outcomes.' },
    { id: 'legal_manager', category: 'Career & commercial', minStage: 3, minRep: 165, baseSalary: 650, signFee: 500, description: 'Reviews contracts, image-rights clauses, disputes and termination terms.', effect: 'Reduces contract and termination risk.' },
    { id: 'financial_manager', category: 'Career & commercial', minStage: 1, minRep: 35, baseSalary: 320, signFee: 240, description: 'Plans budgets, savings, tax reserves and long-term financial decisions.', effect: 'Reduces routine costs and earns a modest return on reserved savings.' },
    { id: 'travel_manager', category: 'Career & commercial', minStage: 2, minRep: 80, baseSalary: 320, signFee: 240, description: 'Coordinates travel, accommodation, reporting times and itinerary changes.', effect: 'Reduces selected travel and logistics expenses.' },
    { id: 'team_manager', category: 'Operations & leadership', minStage: 3, minRep: 130, baseSalary: 700, signFee: 550, description: 'Coordinates team schedules, reporting, travel, kit and daily administration.', effect: 'Reduces administrative stress and match workload slightly.' },
    { id: 'personal_assistant', category: 'Operations & leadership', minStage: 3, minRep: 170, baseSalary: 560, signFee: 420, description: 'Manages appointments, correspondence, reminders and personal administration.', effect: 'Reduces schedule pressure and day-to-day stress.' },
    { id: 'director_cricket', category: 'Operations & leadership', minStage: 4, minRep: 260, baseSalary: 1200, signFee: 900, description: 'Advises on high-performance pathway, squad strategy and long-term cricket decisions.', effect: 'Improves senior opportunity access and high-level career planning.' },
    { id: 'security_manager', category: 'Operations & leadership', minStage: 5, minRep: 500, baseSalary: 1600, signFee: 1200, description: 'Coordinates event security, crowd movement, travel protocols and personal safety.', effect: 'Reduces disruption and reputation risk around high-profile appearances.' }
  ];

  const NAME_POOL = [
    'Arjun Rao','Dev Malhotra','Kabir Mehta','Nikhil Menon','Raghav Bhat','Sameer Kulkarni','Farhan Khan','Aditya Iyer','Vikram Desai','Ishaan Sethi','Manav Kapoor','Rahul Nair','Siddharth Bose','Karan Shetty','Aman Verma','Sanjay Pillai','Pranav Shah','Ritesh Banerjee','Aakash Joshi','Varun Reddy','Neeraj Sood','Samar Khanna','Abhinav Rao','Mihir Shah','Yash Tandon','Kunal Bedi','Aarav Dutta','Saurabh Naidu','Rohan Malhotra','Anirudh Sen'
  ];

  const CATEGORY_ORDER = ['Performance team','Career & commercial','Operations & leadership'];
  const LIVING_COSTS = [
    { living: 180, academy: 120 },
    { living: 300, academy: 280 },
    { living: 520, academy: 480 },
    { living: 850, academy: 700 },
    { living: 1450, academy: 1000 },
    { living: 2200, academy: 1400 }
  ];

  function ensureGameFields() {
    if (!p) return;
    if (!Array.isArray(p.managers)) p.managers = [];
    if (!Array.isArray(p.managerOffers)) p.managerOffers = [];
    if (!Array.isArray(p.managerMarket)) p.managerMarket = [];
    if (!Array.isArray(p.transactions)) p.transactions = [];
    if (!Array.isArray(p.inbox)) p.inbox = [];
    if (!Number.isFinite(p.debt)) p.debt = 0;
    if (!Number.isFinite(p.careerSavings)) p.careerSavings = 0;
    if (!Number.isFinite(p.managerLastProcessedDay)) p.managerLastProcessedDay = Number(p.day) || 1;
    if (!Number.isFinite(p.managerLastApproachDay)) p.managerLastApproachDay = Number(p.day) || 1;
    if (!Number.isFinite(p.lastBillingMonth)) p.lastBillingMonth = Math.floor(((Number(p.day) || 1) - 1) / 30);
    if (!Number.isFinite(p.managerSequence)) p.managerSequence = 1;
    if (!Number.isFinite(p.unpaidBills)) p.unpaidBills = 0;
    p.managers = p.managers.filter((m) => m && typeof m === 'object');
    p.managerOffers = p.managerOffers.filter((o) => o && typeof o === 'object');
    p.managerMarket = p.managerMarket.filter((c) => c && typeof c === 'object');
    for (const m of p.managers) {
      if (!Number.isFinite(m.loyalty)) m.loyalty = 70;
      if (!Number.isFinite(m.arrears)) m.arrears = 0;
      if (!Number.isFinite(m.missedPayMonths)) m.missedPayMonths = 0;
      if (!m.status) m.status = 'Active';
    }
  }

  function tx(type, description, amount, extra = {}) {
    if (!p) return;
    if (!Array.isArray(p.transactions)) p.transactions = [];
    p.transactions.unshift({ day: p.day, type, description, amount: Math.round(Number(amount) || 0), ...extra });
    p.transactions = p.transactions.slice(0, 500);
  }

  function notify(type, title, message, target = 'Management Team') {
    if (typeof window.pushInbox === 'function') {
      window.pushInbox(type, title, message, target);
      return;
    }
    p.inbox = p.inbox || [];
    p.inbox.unshift({ id: Date.now() + Math.random(), type, title, message, target, day: p.day, read: false });
    p.inbox = p.inbox.slice(0, 100);
  }

  function logEvent(title, desc, type = 'Management') {
    p.history = Array.isArray(p.history) ? p.history : [];
    p.history.unshift(`Day ${p.day} — ${title}: ${desc}`);
    p.history = p.history.slice(0, 80);
  }

  function roleDef(id) { return MANAGER_DEFS.find((x) => x.id === id); }
  function activeManagers() { return (p.managers || []).filter((m) => m.status === 'Active' || m.status === 'Notice given'); }
  function hasManager(roleId) { return activeManagers().some((m) => m.roleId === roleId); }
  function manager(roleId) { return activeManagers().find((m) => m.roleId === roleId) || null; }
  function ratingFor(roleId) { const m = manager(roleId); return m ? Number(m.rating) || 55 : 0; }
  function unlocked(def) { return Number(p.stage || 0) >= def.minStage && Number(p.rep || 0) >= def.minRep; }
  function hasOpenOffer(roleId) { return (p.managerOffers || []).some((o) => o.roleId === roleId && o.status === 'Offered'); }

  function makeCandidate(roleId, source = 'market') {
    const def = roleDef(roleId);
    if (!def) return null;
    const rating = clamp(54 + (Number(p.stage) || 0) * 3 + Math.floor(Math.random() * 28), 50, 96);
    const years = Math.max(1, Math.floor((Number(p.stage) || 0) * 2 + 2 + Math.random() * 13));
    const name = NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
    const salaryFactor = 0.72 + rating / 100 * 0.55;
    const salaryMonthly = Math.max(80, Math.round(def.baseSalary * salaryFactor / 10) * 10);
    const signingFee = Math.max(0, Math.round(def.signFee * (0.7 + rating / 100 * 0.5) / 10) * 10);
    return {
      id: `candidate_${p.managerSequence++}_${Math.floor(Math.random() * 100000)}`,
      roleId, role: def.title || ROLE_NAMES[roleId], name, rating, yearsExperience: years,
      salaryMonthly, signingFee, commission: def.commission ? clamp(def.commission + Math.floor(Math.random() * 5), 3, 15) : 0,
      source, status: 'Available', personality: ['Analytical','Direct','Relationship-led','Calm under pressure','Commercially focused'][Math.floor(Math.random() * 5)],
      generatedDay: p.day
    };
  }

  function createOffer(candidate, source = 'Approach') {
    if (!candidate || hasManager(candidate.roleId) || hasOpenOffer(candidate.roleId)) return null;
    const offer = {
      id: `manager_offer_${p.managerSequence++}_${Math.floor(Math.random() * 100000)}`,
      ...candidate, status: 'Offered', source, offeredDay: p.day, contractDays: 180,
      message: source === 'Approach'
        ? `I have been following your recent performances and would like to discuss representing you as your ${ROLE_NAMES[candidate.roleId].toLowerCase()}.`
        : `Your request for a meeting has been accepted. I would like to offer my services on these terms.`
    };
    p.managerOffers.unshift(offer);
    p.managerOffers = p.managerOffers.slice(0, 40);
    notify('Manager approach', `${candidate.name} approached you`, `${ROLE_NAMES[candidate.roleId]} · ${candidate.rating}/100 · ${fmt(candidate.salaryMonthly)} per in-game month. Review the offer and negotiate before signing.`, 'Management Team');
    logEvent('Manager approach received', `${candidate.name} offered to work as your ${ROLE_NAMES[candidate.roleId].toLowerCase()}.`);
    return offer;
  }

  function maybeManagerApproach(force = false) {
    if (!p) return;
    ensureGameFields();
    if (!force && Number(p.day) - Number(p.managerLastApproachDay || 0) < 6) return;
    if (!force) p.managerLastApproachDay = Number(p.day);
    const eligibleRoles = MANAGER_DEFS.filter((d) => unlocked(d) && !hasManager(d.id) && !hasOpenOffer(d.id));
    if (!eligibleRoles.length) return;
    const form = Number(p.form) || 0;
    const performance = Number(p.rep || 0) + (Number(p.matches || 0) * 2) + (form > 5 ? 8 : 0);
    const chance = Math.min(0.58, 0.075 + performance / 1800 + (Number(p.stage || 0) * 0.035));
    if (!force && Math.random() > chance) return;
    const weighted = eligibleRoles.filter((d) => {
      const stageGap = Number(p.stage || 0) - d.minStage;
      return stageGap >= 0 && Number(p.rep || 0) >= d.minRep;
    });
    if (!weighted.length) return;
    const priority = weighted.sort((a, b) => (b.minStage + b.minRep / 100) - (a.minStage + a.minRep / 100));
    const pickPool = priority.slice(0, Math.min(priority.length, Math.max(2, Number(p.stage || 0) + 2)));
    const def = pickPool[Math.floor(Math.random() * pickPool.length)];
    const candidate = makeCandidate(def.id, 'approach');
    createOffer(candidate, 'Approach');
  }

  function managerMarketSearch(roleId) {
    ensureGameFields();
    const def = roleDef(roleId);
    if (!def) return;
    if (!unlocked(def)) {
      p.notice = `You need ${def.minStage > p.stage ? stages[def.minStage]?.name || 'a higher career level' : 'more reputation'} before this role becomes available.`;
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    if (hasManager(roleId)) {
      p.notice = `You already have an active ${ROLE_NAMES[roleId].toLowerCase()}.`;
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    const candidate = makeCandidate(roleId, 'player-search');
    p.managerMarket.unshift(candidate);
    p.managerMarket = p.managerMarket.slice(0, 50);
    p.notice = `Found ${candidate.name}, a ${candidate.rating}/100 ${ROLE_NAMES[roleId].toLowerCase()}. Request an introductory meeting to see whether they are interested.`;
    p.noticeContext = 'Management Team';
    logEvent('Manager search completed', `You identified ${candidate.name} for the ${ROLE_NAMES[roleId].toLowerCase()} role.`);
    save(); render();
  }

  function requestManagerMeeting(candidateId) {
    ensureGameFields();
    const candidate = p.managerMarket.find((x) => x.id === candidateId);
    if (!candidate || candidate.status !== 'Available') return;
    if (hasManager(candidate.roleId) || hasOpenOffer(candidate.roleId)) {
      p.notice = 'You already have this role covered or have an open offer to review.';
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    const def = roleDef(candidate.roleId);
    const leverage = Number(p.rep || 0) / 600 + Number(p.stage || 0) * 0.08 + (Number(p.form || 0) > 5 ? 0.06 : 0);
    const acceptance = Math.max(0.18, Math.min(0.9, 0.48 + leverage + (Number(p.cash || 0) > candidate.salaryMonthly * 3 ? 0.08 : -0.08) - (candidate.rating - 80) / 250));
    candidate.status = 'Contacted';
    if (Math.random() <= acceptance) {
      createOffer(candidate, 'Player approach');
      p.notice = `${candidate.name} has accepted your meeting request and sent a proposed contract.`;
    } else {
      candidate.status = 'Not interested';
      p.notice = `${candidate.name} is not ready to join at your current career stage. Build your profile and approach again later.`;
      logEvent('Manager declined meeting', `${candidate.name} declined the initial approach.`);
    }
    p.noticeContext = 'Management Team'; save(); render();
  }

  function acceptManagerOffer(offerId) {
    ensureGameFields();
    const offer = p.managerOffers.find((x) => x.id === offerId && x.status === 'Offered');
    if (!offer) return;
    if (hasManager(offer.roleId)) {
      p.notice = 'That position is already filled. Terminate or release the current manager before hiring another.';
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    const totalEntryCost = Number(offer.signingFee) || 0;
    if (Number(p.cash || 0) < totalEntryCost) {
      p.notice = `Insufficient balance. You need ${fmt(totalEntryCost)} for the signing fee; the monthly salary will be charged separately.`;
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    p.cash -= totalEntryCost;
    if (totalEntryCost) tx('Manager signing fee', `${ROLE_NAMES[offer.roleId]} — ${offer.name}`, -totalEntryCost);
    const hire = {
      id: `manager_${p.managerSequence++}`,
      roleId: offer.roleId,
      name: offer.name,
      rating: offer.rating,
      yearsExperience: offer.yearsExperience,
      salaryMonthly: Number(offer.salaryMonthly) || 0,
      commission: Number(offer.commission) || 0,
      startDay: p.day,
      contractEndDay: Number(p.day) + (Number(offer.contractDays) || 180),
      contractDays: Number(offer.contractDays) || 180,
      loyalty: 76,
      arrears: 0,
      missedPayMonths: 0,
      status: 'Active',
      noticeEndDay: null,
      renewalNotified: false
    };
    p.managers.push(hire);
    offer.status = 'Hired';
    if (offer.roleId === 'sports_agent') {
      p.agent = { name: hire.name, commission: hire.commission || 7, day: p.day, retainer: totalEntryCost, linkedManagerId: hire.id };
    }
    p.notice = `${hire.name} has joined your team as ${ROLE_NAMES[hire.roleId]}. Monthly salary: ${fmt(hire.salaryMonthly)}. Contract: six in-game months.`;
    p.noticeContext = 'Management Team';
    notify('Manager hired', `${hire.name} joined your management team`, `${ROLE_NAMES[hire.roleId]} · ${fmt(hire.salaryMonthly)} monthly salary. Contract review on Day ${hire.contractEndDay}.`, 'Management Team');
    logEvent('Manager hired', `${hire.name} joined as ${ROLE_NAMES[hire.roleId]}.`);
    save(); render();
  }

  function declineManagerOffer(offerId) {
    const offer = (p.managerOffers || []).find((x) => x.id === offerId && x.status === 'Offered');
    if (!offer) return;
    offer.status = 'Declined';
    p.notice = `You declined ${offer.name}'s offer for the ${ROLE_NAMES[offer.roleId]} position.`;
    p.noticeContext = 'Management Team';
    logEvent('Manager offer declined', `${offer.name}'s offer was not accepted.`);
    save(); render();
  }

  function negotiateManagerOffer(offerId) {
    const offer = (p.managerOffers || []).find((x) => x.id === offerId && x.status === 'Offered');
    if (!offer) return;
    const input = $('manager_salary_' + offerId);
    const target = Math.round(Number(input?.value));
    if (!Number.isFinite(target) || target < 50 || target > 1000000) {
      p.notice = 'Enter a valid proposed monthly salary between ₹50 and ₹10,00,000.';
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    const base = Number(offer.salaryMonthly) || 0;
    const discount = base ? (base - target) / base : 0;
    const negotiationSkill = manager('sports_agent') ? 0.08 : 0;
    const legalSkill = manager('legal_manager') ? 0.05 : 0;
    const playerLeverage = Math.min(0.2, Number(p.rep || 0) / 2500 + Number(p.stage || 0) * 0.02);
    const acceptChance = Math.max(0.08, Math.min(0.97, 0.78 + negotiationSkill + legalSkill + playerLeverage - Math.max(0, discount - 0.08) * 2.2));
    if (Math.random() <= acceptChance && target <= base * 1.18) {
      offer.salaryMonthly = target;
      offer.negotiated = true;
      p.notice = `${offer.name} accepted your salary proposal of ${fmt(target)} per in-game month.`;
    } else {
      p.notice = `${offer.name} rejected the proposal. The original terms remain open for you to accept or decline.`;
    }
    p.noticeContext = 'Management Team'; save(); render();
  }

  function clearAgentLink(hire) {
    if (hire?.roleId === 'sports_agent' && p.agent && (p.agent.linkedManagerId === hire.id || p.agent.name === hire.name)) p.agent = null;
  }

  function terminateManager(managerId, immediate = false) {
    const hire = (p.managers || []).find((x) => x.id === managerId && (x.status === 'Active' || x.status === 'Notice given'));
    if (!hire) return;
    if (immediate) {
      const legalDiscount = manager('legal_manager') ? 0.45 : 1;
      const fee = Math.round((Number(hire.salaryMonthly) || 0) * legalDiscount);
      if (Number(p.cash || 0) < fee) {
        p.notice = `Immediate termination requires ${fmt(fee)}. Give contractual notice instead to avoid this fee.`;
        p.noticeContext = 'Management Team'; save(); render(); return;
      }
      p.cash -= fee;
      if (fee) tx('Manager termination', `${hire.name} — early termination settlement`, -fee);
      hire.status = 'Terminated';
      hire.endDay = p.day;
      clearAgentLink(hire);
      p.notice = `${hire.name}'s contract has been terminated. Settlement paid: ${fmt(fee)}.`;
      logEvent('Manager contract terminated', `${hire.name} was released immediately with a termination settlement.`);
    } else {
      hire.status = 'Notice given';
      hire.noticeEndDay = Number(p.day) + 30;
      p.notice = `You gave ${hire.name} 30 in-game days' notice. The manager remains active until Day ${hire.noticeEndDay}.`;
      logEvent('Manager notice issued', `${hire.name} will leave after the notice period.`);
    }
    p.noticeContext = 'Management Team'; save(); render();
  }

  function renewManager(managerId) {
    const hire = (p.managers || []).find((x) => x.id === managerId && x.status === 'Active');
    if (!hire) return;
    const renewalFee = Math.round((Number(hire.salaryMonthly) || 0) * 0.25);
    if (Number(p.cash || 0) < renewalFee) {
      p.notice = `Renewal administration fee is ${fmt(renewalFee)}. Your balance is not sufficient.`;
      p.noticeContext = 'Management Team'; save(); render(); return;
    }
    p.cash -= renewalFee;
    tx('Manager contract renewal', `${hire.name} — six-month renewal`, -renewalFee);
    hire.contractEndDay = Math.max(Number(hire.contractEndDay) || Number(p.day), Number(p.day)) + 180;
    hire.contractDays = 180;
    hire.renewalNotified = false;
    hire.loyalty = clamp(Number(hire.loyalty || 0) + 8);
    p.notice = `${hire.name}'s contract has been renewed for another six in-game months.`;
    p.noticeContext = 'Management Team'; logEvent('Manager contract renewed', `${hire.name}'s contract was renewed.`);
    save(); render();
  }

  function processManagerStatuses(day) {
    for (const hire of [...activeManagers()]) {
      if (hire.status === 'Notice given' && Number(hire.noticeEndDay) <= day) {
        hire.status = 'Terminated'; hire.endDay = day; clearAgentLink(hire);
        notify('Manager departure', `${hire.name} left your team`, `The 30-day notice period ended. ${ROLE_NAMES[hire.roleId]} position is now vacant.`, 'Management Team');
        continue;
      }
      if (hire.status === 'Active' && Number(hire.contractEndDay) <= day) {
        hire.status = 'Expired'; hire.endDay = day; clearAgentLink(hire);
        notify('Manager contract expired', `${hire.name}'s contract ended`, `Renew the agreement or search for a replacement ${ROLE_NAMES[hire.roleId].toLowerCase()}.`, 'Management Team');
      } else if (hire.status === 'Active' && !hire.renewalNotified && Number(hire.contractEndDay) - day <= 30) {
        hire.renewalNotified = true;
        notify('Manager renewal due', `${hire.name}'s contract is nearing expiry`, `Review the ${ROLE_NAMES[hire.roleId].toLowerCase()} contract in the Management Team screen.`, 'Management Team');
      }
    }
  }

  function payExpense(total, type, description) {
    const amount = Math.max(0, Math.round(total));
    if (!amount) return 0;
    const paid = Math.min(Number(p.cash || 0), amount);
    p.cash = Math.max(0, Number(p.cash || 0) - paid);
    const due = amount - paid;
    if (due > 0) {
      p.debt = (Number(p.debt) || 0) + due;
      p.unpaidBills = (Number(p.unpaidBills) || 0) + 1;
    }
    tx(type, due > 0 ? `${description} — paid ${fmt(paid)}, outstanding ${fmt(due)}` : description, -amount, { paid, outstanding: due });
    return due;
  }

  function processMonthlyBilling(monthBlock) {
    const stage = clamp(Number(p.stage || 0), 0, LIVING_COSTS.length - 1);
    const costs = LIVING_COSTS[stage];
    const financialManager = manager('financial_manager');
    const discount = financialManager ? Math.min(0.18, 0.06 + (Number(financialManager.rating) - 60) / 500) : 0;
    const living = Math.round(costs.living * (1 - discount));
    const academy = Math.round(costs.academy * (1 - discount));
    payExpense(living, 'Monthly living expenses', `Month ${monthBlock + 1} — food, accommodation and personal costs`);
    if (academy > 0 && stage < 3) payExpense(academy, 'Academy / coaching fee', `Month ${monthBlock + 1} — academy and facility fee`);

    for (const hire of activeManagers().filter((m) => m.status === 'Active' || m.status === 'Notice given')) {
      const salary = Math.max(0, Number(hire.salaryMonthly) || 0);
      const due = salary + (Number(hire.arrears) || 0);
      const outstanding = payExpense(due, 'Manager salary', `${hire.name} — ${ROLE_NAMES[hire.roleId]} salary and arrears`);
      if (outstanding > 0) {
        hire.arrears = outstanding;
        hire.missedPayMonths = (Number(hire.missedPayMonths) || 0) + 1;
        hire.loyalty = clamp((Number(hire.loyalty) || 0) - 14);
        notify('Manager payment overdue', `${hire.name} has not been paid in full`, `Outstanding salary: ${fmt(hire.arrears)}. Continued non-payment may result in resignation.`, 'Management Team');
        if (hire.missedPayMonths >= 2) {
          hire.status = 'Resigned'; hire.endDay = p.day; clearAgentLink(hire);
          notify('Manager resigned', `${hire.name} resigned`, `The ${ROLE_NAMES[hire.roleId].toLowerCase()} role is vacant after two missed salary payments.`, 'Management Team');
        }
      } else {
        hire.arrears = 0;
        hire.missedPayMonths = 0;
        hire.loyalty = clamp((Number(hire.loyalty) || 0) + 2);
      }
    }

    if (financialManager && Number(p.careerSavings) > 0) {
      const interestRate = 0.003 + Math.max(0, Number(financialManager.rating) - 65) * 0.00004;
      const interest = Math.max(1, Math.round(Number(p.careerSavings) * interestRate));
      p.careerSavings += interest;
      tx('Savings interest', 'Reserved career savings return', interest);
    }
    if (Number(p.debt) > 0) {
      p.history = Array.isArray(p.history) ? p.history : [];
      p.history.unshift(`Day ${p.day} — Financial review: outstanding career liabilities are ${fmt(p.debt)}.`);
    }
  }

  function processAdditionalManagerEffects(day) {
    if (!p) return;

    // A personal assistant reduces routine administration and schedule pressure.
    const assistant = manager('personal_assistant');
    if (assistant && day % 7 === 0) {
      p.workload = clamp((Number(p.workload) || 0) - 1);
      p.morale = clamp((Number(p.morale) || 0) + 1);
    }

    // Security support matters only once the player has a genuinely high public profile.
    if (day % 30 !== 0 || Number(p.stage || 0) < 5 || Number(p.rep || 0) < 500) return;
    if (Number(p.securityReviewDay || 0) >= day) return;
    p.securityReviewDay = day;
    const security = manager('security_manager');
    const disruptionChance = security ? 0.02 : 0.10;
    if (Math.random() >= disruptionChance) return;

    if (security) {
      p.morale = clamp((Number(p.morale) || 0) - 1);
      notify('Public appearance managed', 'Your security team handled a crowd disruption', `${security.name} coordinated the venue response. Your appearance continued with minimal disruption.`, 'Management Team');
      logEvent('Public appearance managed', `${security.name} handled a crowd-management issue.`);
    } else {
      p.morale = clamp((Number(p.morale) || 0) - 4);
      p.rep = Math.max(0, (Number(p.rep) || 0) - 3);
      notify('Public appearance disrupted', 'A crowd-management issue affected your appearance', 'The event was delayed and public confidence took a small hit. A security manager becomes available at the appropriate career level.', 'Management Team');
      logEvent('Public appearance disrupted', 'A high-profile event was affected by a crowd-management issue.');
    }
  }

  function processElapsedGameDays() {
    if (!p) return;
    ensureGameFields();
    const currentDay = Math.max(1, Number(p.day) || 1);
    const previous = Math.max(1, Number(p.managerLastProcessedDay) || currentDay);
    if (currentDay <= previous) return;
    for (let day = previous + 1; day <= currentDay; day += 1) {
      processManagerStatuses(day);
      processAdditionalManagerEffects(day);
      if (day % 30 === 0) {
        const block = Math.floor((day - 1) / 30);
        if (block > Number(p.lastBillingMonth)) {
          processMonthlyBilling(block);
          p.lastBillingMonth = block;
        }
      }
      if (day % 7 === 0) maybeManagerApproach(false);
    }
    p.managerLastProcessedDay = currentDay;
  }

  function recoveryGain() {
    return (manager('physio') ? 3 : 0) + (manager('nutritionist') ? 1 : 0) + (manager('fitness_coach') ? 1 : 0);
  }

  function restFully() {
    ensureGameFields();
    if (!p) return;
    if (p.match?.interactive && !['result'].includes(p.match.phase)) {
      p.notice = 'You cannot begin a recovery block while a match is in progress. Complete or resume the match first.';
      p.noticeContext = 'Management Tools'; save(); render(); return;
    }
    const startFitness = Number(p.fitness) || 0;
    const startWorkload = Number(p.workload) || 0;
    const startInjury = Number(p.injuryDays) || 0;
    let days = 0;
    const maxDays = 90;
    if (p.injury && Number(p.injuryDays || 0) <= 0) p.injury = null;
    const isRecovered = () => Number(p.fitness) >= 100 && Number(p.workload) <= 8 && Number(p.injuryDays || 0) <= 0 && !p.injury;
    while (days < maxDays && !isRecovered()) {
      p.day = (Number(p.day) || 1) + 1;
      // Process contract expiry, approaches and monthly bills day by day during a long rest.
      // A manager whose contract expires mid-rest must not keep providing benefits for later days.
      processElapsedGameDays();
      p.fitness = clamp(Number(p.fitness || 0) + 9 + recoveryGain());
      p.workload = clamp(Number(p.workload || 0) - (9 + (manager('fitness_coach') ? 2 : 0)));
      p.morale = clamp(Number(p.morale || 0) + (manager('psychologist') || manager('mentor') ? 2 : 1));
      p.stress = clamp(Number(p.stress || 0) - (manager('psychologist') ? 3 : 2));
      if (Number(p.injuryDays) > 0) p.injuryDays = Math.max(0, Number(p.injuryDays) - 1);
      if (p.injury && Number(p.injuryDays) <= 0) p.injury = null;
      days += 1;
    }
    if (days > 10) p.form = Math.max(-20, (Number(p.form) || 0) - Math.floor((days - 10) / 5));
    const complete = isRecovered();
    p.notice = complete
      ? `Full recovery achieved after ${days} day(s). Fitness ${startFitness} → ${p.fitness}; workload ${startWorkload} → ${p.workload}; injury days ${startInjury} → ${p.injuryDays || 0}. You are fully fit and medically available.`
      : `Recovery block paused after ${days} days. Fitness ${p.fitness}, workload ${p.workload}, injury days ${p.injuryDays || 0}. Continue medical review or another recovery block before returning.`;
    p.noticeContext = 'Management Tools';
    logEvent(complete ? 'Full recovery achieved' : 'Recovery block paused', p.notice);
    save(); render();
  }

  function recoveryDays(days) {
    if (p?.match?.interactive && !['result'].includes(p.match.phase)) {
      p.notice = 'Complete or resume your current match before scheduling a recovery block.';
      p.noticeContext = 'Management Tools'; save(); render(); return;
    }
    const count = Math.max(1, Math.min(14, Number(days) || 1));
    const startDay = Number(p.day) || 1;
    for (let i = 0; i < count; i += 1) {
      p.day = (Number(p.day) || 1) + 1;
      processElapsedGameDays();
      p.fitness = clamp(Number(p.fitness || 0) + 8 + recoveryGain());
      p.workload = clamp(Number(p.workload || 0) - 9);
      p.morale = clamp(Number(p.morale || 0) + 1);
      p.stress = clamp(Number(p.stress || 0) - 2);
      if (Number(p.injuryDays) > 0) p.injuryDays = Math.max(0, Number(p.injuryDays) - 1);
      if (p.injury && Number(p.injuryDays) <= 0) p.injury = null;
    }
    p.notice = `${count} recovery day(s) completed. In-game date advanced from Day ${startDay} to Day ${p.day}.`;
    p.noticeContext = 'Management Tools'; save(); render();
  }

  function repayDebt(amount) {
    const value = Math.min(Math.max(0, Number(amount) || 0), Number(p.cash) || 0, Number(p.debt) || 0);
    if (!value) {
      p.notice = 'There is no available balance or outstanding debt to repay.';
    } else {
      p.cash -= value; p.debt -= value;
      tx('Debt repayment', 'Payment toward outstanding career expenses', -value);
      p.notice = `${fmt(value)} paid toward outstanding expenses. Remaining debt: ${fmt(p.debt)}.`;
    }
    p.noticeContext = 'Finances'; save(); render();
  }

  function managerEffectForTraining(kind) {
    if (kind === 'bat') return Math.max(ratingFor('head_coach'), ratingFor('batting_coach'));
    if (kind === 'bowl') return Math.max(ratingFor('head_coach'), ratingFor('bowling_coach'));
    if (kind === 'field') return Math.max(ratingFor('head_coach'), ratingFor('fielding_coach'));
    if (kind === 'fit') return Math.max(ratingFor('head_coach'), ratingFor('fitness_coach'));
    return ratingFor('head_coach');
  }

  function managerPage() {
    ensureGameFields();
    const hires = activeManagers();
    const monthlyPayroll = hires.reduce((sum, m) => sum + (Number(m.salaryMonthly) || 0), 0);
    const offers = (p.managerOffers || []).filter((o) => o.status === 'Offered');
    const candidates = (p.managerMarket || []).filter((c) => c.status === 'Available');
    const availableDefs = MANAGER_DEFS.filter((d) => unlocked(d) && !hasManager(d.id));
    const stageName = (window.stages?.[Number(p.stage || 0)]?.name) || p.career || 'Local Cricket';

    const roster = hires.length ? hires.map((m) => {
      const left = Math.max(0, Number(m.contractEndDay) - Number(p.day));
      const progress = clamp(Number(m.loyalty) || 0);
      return `<div class="manager-card">
        <div class="manager-head"><div><div class="manager-role">${escHtml(ROLE_NAMES[m.roleId] || m.roleId)}</div><h3 style="margin:4px 0 2px">${escHtml(m.name)}</h3><p class="muted" style="margin:0">${m.yearsExperience || 0} years' experience · ${m.rating}/100 reputation</p></div><span class="manager-rating">★ ${m.rating}</span></div>
        <div class="manager-meta"><span>Salary ${fmt(m.salaryMonthly)}/month</span><span>${m.status === 'Notice given' ? `Notice ends Day ${m.noticeEndDay}` : `${left} days left on contract`}</span><span>${m.commission ? `${m.commission}% commission` : 'No commission'}</span></div>
        <div class="manager-meter"><i style="width:${progress}%"></i></div><p class="muted">Working relationship ${progress}/100 · ${m.arrears ? `Salary arrears ${fmt(m.arrears)}` : 'Payments up to date'}</p>
        <div class="manager-actions">${m.status === 'Active' ? `<button onclick="MaidanRenewManager('${m.id}')">Renew contract</button><button onclick="MaidanNoticeManager('${m.id}')">Give 30-day notice</button><button onclick="MaidanTerminateManager('${m.id}')">Terminate now</button>` : '<span class="muted">Notice period in progress</span>'}</div>
      </div>`;
    }).join('') : '<div class="panel"><p><b>You currently have no individually hired managers.</b></p><p class="muted">Your academy and team may provide some shared support. Build results and reputation, then hire or respond to approaches from your professional network.</p></div>';

    const offerHtml = offers.length ? offers.map((o) => `<div class="manager-card">
      <div class="manager-role">${escHtml(o.source || 'Manager approach')} · Day ${o.offeredDay}</div><div class="manager-head"><div><h3 style="margin:4px 0">${escHtml(o.name)}</h3><p class="muted">${escHtml(ROLE_NAMES[o.roleId])} · ${o.yearsExperience} years' experience</p></div><span class="manager-rating">★ ${o.rating}/100</span></div>
      <p>${escHtml(o.message || '')}</p><div class="manager-meta"><span>Signing fee ${fmt(o.signingFee)}</span><span>Offer salary ${fmt(o.salaryMonthly)}/month</span><span>${o.commission ? `${o.commission}% commission` : 'No commission'}</span><span>6-month contract</span></div>
      <label>Proposed monthly salary<input id="manager_salary_${o.id}" type="number" inputmode="numeric" min="50" step="50" value="${o.salaryMonthly}" style="max-width:220px"></label>
      <div class="manager-actions"><button class="primary" onclick="MaidanAcceptManager('${o.id}')" ${Number(p.cash) < Number(o.signingFee) ? 'disabled' : ''}>Accept & hire</button><button onclick="MaidanNegotiateManager('${o.id}')">Submit salary proposal</button><button onclick="MaidanDeclineManager('${o.id}')">Decline offer</button></div>
    </div>`).join('') : '<p class="muted">No active manager approaches. Stronger performances and career progression may attract new approaches. You can also search for candidates below.</p>';

    const marketHtml = candidates.length ? candidates.map((c) => `<div class="manager-card">
      <div class="manager-role">${escHtml(ROLE_NAMES[c.roleId])} · Search result</div><div class="manager-head"><div><h3 style="margin:4px 0">${escHtml(c.name)}</h3><p class="muted">${c.yearsExperience} years' experience · ${escHtml(c.personality)} approach</p></div><span class="manager-rating">★ ${c.rating}/100</span></div>
      <div class="manager-meta"><span>Expected fee ${fmt(c.signingFee)}</span><span>Expected salary ${fmt(c.salaryMonthly)}/month</span><span>${c.commission ? `${c.commission}% commission` : 'No commission'}</span></div>
      <p class="muted">${escHtml(roleDef(c.roleId)?.description || '')}</p>
      <div class="manager-actions"><button class="primary" onclick="MaidanRequestMeeting('${c.id}')">Request introductory meeting</button></div>
    </div>`).join('') : '<p class="muted">No candidates waiting. Select a role and search the market.</p>';

    const options = MANAGER_DEFS.map((d) => {
      const isOpen = unlocked(d) && !hasManager(d.id);
      return `<option value="${d.id}" ${isOpen ? '' : 'disabled'}>${isOpen ? 'Available · ' : 'Locked / position filled · '}${escHtml(ROLE_NAMES[d.id])} — ${fmt(d.baseSalary)}/month${d.minStage > p.stage ? ` · ${stages[d.minStage]?.name || 'Higher level'}` : d.minRep > p.rep ? ` · Rep ${d.minRep}+` : ''}</option>`;
    }).join('');

    const roleCards = CATEGORY_ORDER.map((cat) => {
      const list = MANAGER_DEFS.filter((d) => d.category === cat);
      return `<div class="manager-category"><h3>${escHtml(cat)}</h3><div class="grid">${list.map((d) => {
        const open = unlocked(d);
        const hired = hasManager(d.id);
        const text = hired ? 'Position filled' : open ? 'Available to approach' : `Unlock at ${stages[d.minStage]?.name || 'higher level'} and reputation ${d.minRep}+`;
        return `<div class="panel" style="padding:12px"><div class="manager-role">${escHtml(text)}</div><b>${escHtml(ROLE_NAMES[d.id])}</b><p class="muted" style="margin:5px 0">${escHtml(d.effect)}</p><p class="muted">Typical salary ${fmt(d.baseSalary)} / month</p></div>`;
      }).join('')}</div></div>`;
    }).join('');

    return `${typeof note === 'function' ? note() : ''}
      <div class="panel"><div class="muted">PROFESSIONAL MANAGEMENT · ${escHtml(stageName)}</div><h2>Management team</h2><p class="muted">Managers are employed professionals, not decorative unlocks. They approach you as your career grows; you can also search, request meetings, negotiate, hire, renew or terminate contracts.</p>
        <div class="dashboard-grid"><div class="dashboard-metric"><span>Active managers</span><strong>${hires.length}</strong></div><div class="dashboard-metric"><span>Monthly payroll</span><strong>${fmt(monthlyPayroll)}</strong></div><div class="dashboard-metric"><span>Open approaches</span><strong>${offers.length}</strong></div><div class="dashboard-metric"><span>Outstanding debt</span><strong>${fmt(p.debt || 0)}</strong></div></div>
        <p class="muted">All salaries, sign-on fees, commission and contract settlements are charged to your in-game balance. Missed salary payments reduce loyalty and can cause a manager to resign.</p>
      </div>
      <div class="panel"><h2>Your current team</h2>${roster}</div>
      <div class="panel"><h2>Offers & approaches</h2>${offerHtml}</div>
      <div class="panel"><h2>Approach a manager</h2><p class="muted">You can contact professionals when your career stage and reputation meet their entry requirements. High-profile specialists expect higher salaries and signing fees.</p>
        <div class="grid"><label>Professional role<select id="managerRoleSearch">${options}</select></label><div style="display:flex;align-items:end"><button class="primary" onclick="MaidanSearchManager($('managerRoleSearch').value)" style="width:100%">Find candidates</button></div></div>
        ${marketHtml}
      </div>
      <div class="panel"><h2>Manager roles & unlock path</h2><p class="muted">Roles unlock progressively. You do not need to employ everyone immediately; balance capability against cash flow.</p>${roleCards}</div>
      <div class="panel"><h2>Recovery planner</h2><p class="muted">Choose recovery days or take a full rest block. Full rest advances the in-game calendar until fitness is 100, workload is low and injury rehabilitation is complete (up to 90 days per block).</p>
        <div class="recovery-choice"><button onclick="MaidanRecoveryDays(1)">Rest 1 day</button><button onclick="MaidanRecoveryDays(3)">Rest 3 days</button><button class="primary" onclick="MaidanFullRest()">Rest until fully fit</button></div>
      </div>`;
  }

  function financeExtraPanel() {
    ensureGameFields();
    const monthCost = LIVING_COSTS[clamp(Number(p.stage || 0), 0, 5)];
    const payroll = activeManagers().filter((m) => m.status === 'Active').reduce((s, m) => s + (Number(m.salaryMonthly) || 0), 0);
    const financialManager = !!manager('financial_manager');
    const discounts = financialManager ? 'A financial manager is reducing routine monthly expenses and earning interest on reserved savings.' : 'A financial manager can reduce selected routine expenses and earn modest interest on reserved savings.';
    return `<div class="panel" style="margin-top:12px"><h2>Monthly budget & obligations</h2><div class="dashboard-grid"><div class="dashboard-metric"><span>Living costs / month</span><strong>${fmt(monthCost.living)}</strong></div><div class="dashboard-metric"><span>Academy / facility</span><strong>${fmt(Number(p.stage || 0) < 3 ? monthCost.academy : 0)}</strong></div><div class="dashboard-metric"><span>Manager payroll</span><strong>${fmt(payroll)}</strong></div><div class="dashboard-metric"><span>Outstanding debt</span><strong>${fmt(p.debt || 0)}</strong></div></div><p class="muted">Living and academy expenses are charged automatically every 30 in-game days. Manager salaries are charged monthly. If you cannot pay, the unpaid amount becomes a liability; managers may resign after repeated missed payments.</p><p class="muted">${discounts}</p>${Number(p.debt || 0) > 0 ? `<div class="financial-alert"><b>Outstanding career liabilities: ${fmt(p.debt)}</b><p>Reduce debt to protect your future cash flow.</p><div class="manager-actions"><button onclick="MaidanRepayDebt(250)" ${Number(p.cash) < 1 ? 'disabled' : ''}>Repay ₹250</button><button onclick="MaidanRepayDebt(1000)" ${Number(p.cash) < 1 ? 'disabled' : ''}>Repay ₹1,000</button><button onclick="MaidanRepayDebt('all')" ${Number(p.cash) < 1 ? 'disabled' : ''}>Repay as much as possible</button></div></div>` : ''}</div>`;
  }

  function cloudPage() {
    const state = window.MaidanCloud?.getState?.() || { configured: false, loading: false, user: null, message: 'Cloud sync not configured. Offline saving is active.' };
    const email = state.user?.email || '';
    return `${typeof note === 'function' ? note() : ''}<div class="panel"><div class="muted">ACCOUNT & DATA STORAGE</div><h2>Save and synchronise</h2><p>Your career saves automatically on this device using browser storage. The game also keeps an IndexedDB backup for offline use. You can export a JSON backup at any time from Player Profile.</p><div class="cloud-panel"><h3>Cloud save status</h3><p><b>${state.configured ? (state.user ? 'Signed in' : 'Cloud service configured') : 'Offline mode'}</b></p><p class="muted">${escHtml(state.message || (state.configured ? 'Sign in to synchronise your career.' : 'Add your Supabase project URL and publishable key in js/cloud-config.js to enable optional cloud accounts.'))}</p>
        ${state.configured ? (state.user ? `<p>Account: <b>${escHtml(email)}</b></p><div class="manager-actions"><button class="primary" onclick="MaidanCloudSyncNow()">Sync current career now</button><button onclick="MaidanCloudRestore()">Restore latest cloud save</button><button onclick="MaidanCloudSignOut()">Sign out</button></div>` : `<div class="grid"><label>Email<input id="cloudEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="cloudPassword" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters"></label></div><div class="manager-actions"><button class="primary" onclick="MaidanCloudSignIn()">Sign in</button><button onclick="MaidanCloudSignUp()">Create free account</button></div>`) : '<p class="muted">The game remains fully playable without an account. Cloud sync is optional and is not required to install or play on Android.</p>'}
      </div></div><div class="panel"><h3>Storage and privacy</h3><ul><li>Offline career save: browser local storage plus IndexedDB backup.</li><li>Cloud save: optional Supabase Auth and a private database row scoped to your account.</li><li>Never put a Supabase service-role secret in this repository. Only the browser-safe publishable/anon key belongs in the client config.</li><li>Use Player Profile → Export career save before clearing browser data or moving to another phone.</li></ul></div>`;
  }

  // Wrap the existing local save: localStorage remains the immediate save, IndexedDB is an offline backup.
  const originalSave = window.save;
  window.save = function () {
    if (p) {
      ensureGameFields();
      processElapsedGameDays();
    }
    if (typeof originalSave === 'function') originalSave();
    if (p && window.MaidanOfflineStore) window.MaidanOfflineStore.persist(p).catch(() => {});
    if (p && window.MaidanCloud?.scheduleSave) window.MaidanCloud.scheduleSave(p);
  };

  const originalTraining = window.training;
  if (typeof originalTraining === 'function') {
    window.training = function () {
      return originalTraining() + `<div class="panel" style="margin-top:12px"><h2>Recovery options</h2><p class="muted">Rest is a deliberate training decision. A full recovery block advances the calendar, reduces fatigue and completes injury rehabilitation where possible.</p><div class="recovery-choice"><button onclick="MaidanRecoveryDays(1)">Rest 1 day</button><button onclick="MaidanRecoveryDays(3)">Rest 3 days</button><button class="primary" onclick="MaidanFullRest()">Rest until fully fit</button></div></div>`;
    };
  }

  const originalManagementTools = window.managementTools;
  window.managementTools = function () { return managerPage(); };

  const originalFinances = window.finances;
  if (typeof originalFinances === 'function') {
    window.finances = function () { return originalFinances() + financeExtraPanel(); };
  }

  const originalRender = window.render;
  window.render = function () {
    if (typeof originalRender === 'function') originalRender();
    if (p && typeof tab !== 'undefined') {
      if (tab === 'Management Team') $('screen').innerHTML = managerPage();
      else if (tab === 'Cloud Account') $('screen').innerHTML = cloudPage();
    }
  };

  try {
    if (typeof NAV_GROUPS !== 'undefined' && NAV_GROUPS.Management) {
      if (!NAV_GROUPS.Management.some((x) => x.target === 'Management Team')) NAV_GROUPS.Management.splice(1, 0, { label: 'Management team', target: 'Management Team', desc: 'Hire, negotiate, manage and terminate professional staff.' });
      if (!NAV_GROUPS.Management.some((x) => x.target === 'Cloud Account')) NAV_GROUPS.Management.push({ label: 'Account & cloud save', target: 'Cloud Account', desc: 'Optional sign-in and synchronisation across devices.' });
    }
  } catch (_err) { /* Navigation remains usable if the source shell changes. */ }

  const originalTrain = window.train;
  if (typeof originalTrain === 'function') {
    window.train = function (kind, cost) {
      const before = Number(p?.skills?.[kind]) || 0;
      originalTrain(kind, cost);
      if (!p) return;
      const rating = managerEffectForTraining(kind);
      if (rating >= 55) {
        const bonus = rating >= 88 ? 2 : rating >= 70 ? 1 : 0;
        if (bonus) p.skills[kind] = clamp((Number(p.skills[kind]) || 0) + bonus);
      }
      if (manager('psychologist') || manager('mentor')) p.morale = clamp((Number(p.morale) || 0) + 1);
      if (Number(p.skills?.[kind]) > before) p.lastTrainingManagerNote = `Specialist support contributed to your ${kind} development.`;
      save(); render();
    };
  }

  const originalRest = window.rest;
  if (typeof originalRest === 'function') {
    window.rest = function () {
      if (p?.match?.interactive && !['result'].includes(p.match.phase)) {
        p.notice = 'You cannot skip a live match to rest. Complete or resume the match first.';
        p.noticeContext = 'Management Tools'; save(); render(); return;
      }
      originalRest();
      if (!p) return;
      p.fitness = clamp((Number(p.fitness) || 0) + recoveryGain());
      p.workload = clamp((Number(p.workload) || 0) - (manager('fitness_coach') ? 3 : 0));
      if (manager('psychologist') || manager('mentor')) p.morale = clamp((Number(p.morale) || 0) + 1);
      save(); render();
    };
  }

  const originalMedicalRest = window.medicalRest;
  if (typeof originalMedicalRest === 'function') {
    window.medicalRest = function () {
      if (p?.match?.interactive && !['result'].includes(p.match.phase)) {
        p.notice = 'Complete or resume your live match before taking medical rest.';
        p.noticeContext = 'Management Tools'; save(); render(); return;
      }
      originalMedicalRest();
      if (!p) return;
      p.fitness = clamp((Number(p.fitness) || 0) + recoveryGain());
      if (manager('physio') && p.injuryDays > 0) p.injuryDays = Math.max(0, p.injuryDays - 1);
      save(); render();
    };
  }

  function maybeCreateTalentScoutShowcase(matchSnapshot, playerBat, playerWickets, playerCatches) {
    const scout = manager('talent_scout');
    if (!scout) return;
    const runs = Number(playerBat?.runs) || 0;
    if (runs < 30 && Number(playerWickets) < 2 && Number(playerCatches) < 2) return;

    if (!Array.isArray(p.trials)) p.trials = [];
    if (!Array.isArray(p.scouts)) p.scouts = [];
    const pending = p.trials.some((trial) =>
      trial.talentScoutInvite && ['Invited', 'Scheduled'].includes(trial.status)
    );
    if (pending) return;

    const chance = Math.min(0.48, 0.18 + Math.max(0, (Number(scout.rating) || 55) - 60) / 250);
    if (Math.random() >= chance) return;

    const stageIndex = Math.max(0, Math.min((window.stages?.length || 6) - 1, Number(p.stage) || 0));
    const stageName = window.stages?.[stageIndex]?.name || p.career || 'Current level';
    const formatId = matchSnapshot?.formatId || p.nextMatchFormat || 't20';
    const formatName = formatId === 'firstClass' ? 'First-class' : formatId === 'listA' ? 'List A' : formatId === 'test' ? 'Test' : 'T20';
    const id = `talent-showcase-${p.day}-${Math.floor(Math.random() * 100000)}`;
    const invitation = {
      id,
      scout: scout.name,
      level: `${stageName} Showcase`,
      stage: stageIndex,
      formal: false,
      status: 'Invited',
      day: p.day,
      format: formatName,
      formatId,
      competition: 'Talent scout showcase',
      selectionStatus: 'Awaiting assessment',
      talentScoutInvite: true
    };
    p.trials.unshift(invitation);
    p.trials = p.trials.slice(0, 50);
    p.scouts.unshift({
      day: `Day ${p.day}`,
      name: scout.name,
      note: `After your recent performance, ${scout.name} has invited you to a ${stageName.toLowerCase()} showcase. Attend the assessment from your Scouting Network.`,
      interest: 'Showcase invitation',
      read: false
    });
    p.scouts = p.scouts.slice(0, 50);
    notify('Talent scout invitation', `${scout.name} invited you to a showcase`, `Your performance has earned a ${stageName} showcase invitation. Open Scouting Network and attend the assessment when ready.`, 'Scouting');
    logEvent('Talent scout opportunity', `${scout.name} arranged a ${stageName} showcase after your performance.`);
  }

  const originalFinishMatch = window.finishMatch;
  if (typeof originalFinishMatch === 'function') {
    window.finishMatch = function () {
      const pre = Number(p?.rep) || 0;
      const matchSnapshot = p?.match ? JSON.parse(JSON.stringify(p.match)) : null;
      originalFinishMatch();
      if (!p) return;
      const battingCoach = manager('batting_coach');
      const bowlingCoach = manager('bowling_coach');
      const fieldingCoach = manager('fielding_coach');
      const analyst = manager('analyst');
      const nutritionist = manager('nutritionist');
      const psychologist = manager('psychologist');
      const teamManager = manager('team_manager');
      const director = manager('director_cricket');
      const prManager = manager('pr_manager');
      if (analyst) {
        p.form = Math.min(20, (Number(p.form) || 0) + (analyst.rating >= 85 ? 2 : 1));
        p.analystSessions = (Number(p.analystSessions) || 0) + 1;
        p.history.unshift(`${analyst.name} added a match review to your development record.`);
      }
      if (nutritionist) p.fitness = clamp((Number(p.fitness) || 0) + 2);
      if (psychologist) p.morale = clamp((Number(p.morale) || 0) + 2);
      if (teamManager) p.workload = clamp((Number(p.workload) || 0) - 3);
      const playerBat = matchSnapshot?.playerBat || {};
      const playerWickets = Number(matchSnapshot?.playerWickets || matchSnapshot?.playerBowling?.wickets || 0);
      const playerCatches = Number(matchSnapshot?.playerCatches || 0);
      if (battingCoach && Number(playerBat.runs) >= 30) p.skills.bat = clamp((Number(p.skills.bat) || 0) + 1);
      if (bowlingCoach && playerWickets >= 2) p.skills.bowl = clamp((Number(p.skills.bowl) || 0) + 1);
      if (fieldingCoach && playerCatches >= 2) p.skills.field = clamp((Number(p.skills.field) || 0) + 1);
      if (director && Number(p.stage) >= 4 && Number(p.rep) > pre) p.rep = Math.min(2000, Number(p.rep) + 1);
      const good = Number(playerBat.runs || 0) >= 40 || playerWickets >= 2 || playerCatches >= 2;
      if (prManager) {
        const standout = Number(playerBat.runs || 0) >= 50 || playerWickets >= 3 || playerCatches >= 3;
        if (standout) {
          p.rep = Math.min(2000, (Number(p.rep) || 0) + 2);
          p.morale = clamp((Number(p.morale) || 0) + 2);
          notify('Positive media coverage', `${prManager.name} managed your match coverage`, 'Your standout performance has been presented positively to local and cricket media. Reputation received a small boost.', 'Management Team');
          logEvent('PR support', `${prManager.name} handled media coverage after a standout performance.`);
        } else if (Number(playerBat.runs || 0) < 10 && playerWickets === 0) {
          p.morale = clamp((Number(p.morale) || 0) + 1);
          p.history.unshift(`${prManager.name} helped you prepare a measured response after a difficult performance.`);
        }
      }
      maybeCreateTalentScoutShowcase(matchSnapshot, playerBat, playerWickets, playerCatches);
      for (const m of activeManagers()) {
        if (m.status !== 'Active') continue;
        m.loyalty = clamp((Number(m.loyalty) || 0) + (good ? 2 : -1));
      }
      // Approach cadence is handled by the weekly career clock; do not spam offers after every match.
      save(); render();
    };
  }

  const originalAcceptSponsor = window.acceptSponsor;
  if (typeof originalAcceptSponsor === 'function') {
    window.acceptSponsor = function (id) {
      const before = Number(p.cash) || 0;
      originalAcceptSponsor(id);
      if (!p) return;
      const business = manager('business_manager');
      const social = manager('social_media_manager');
      const credited = (Number(p.cash) || 0) - before;
      if (credited > 0 && (business || social)) {
        const boostRate = (business ? 0.08 : 0) + (social ? 0.04 : 0);
        const bonus = Math.round(credited * boostRate);
        if (bonus > 0) {
          p.cash += bonus;
          tx('Commercial management bonus', 'Additional value from professional commercial support', bonus);
          p.notice = (p.notice || 'Sponsorship accepted.') + ` Commercial team added ${fmt(bonus)} in deal value.`;
          p.noticeContext = 'Sponsors & Auction';
          save(); render();
        }
      }
    };
  }

  const originalSpendCareer = window.spendCareer;
  if (typeof originalSpendCareer === 'function') {
    window.spendCareer = function (kind) {
      const travelManager = manager('travel_manager');
      if (!travelManager || !['travel', 'localTravel'].includes(kind)) {
        return originalSpendCareer(kind);
      }
      const baseCost = kind === 'travel' ? 350 : 200;
      const saving = Math.round(baseCost * 0.25);
      const previousFirstTransaction = p.transactions?.[0] || null;
      p.cash = (Number(p.cash) || 0) + saving;
      originalSpendCareer(kind);
      const newFirstTransaction = p.transactions?.[0] || null;
      const completed = newFirstTransaction !== previousFirstTransaction && newFirstTransaction?.type === 'Travel expense';
      if (completed) {
        tx('Travel manager saving', `${travelManager.name} negotiated a 25% discount on travel costs`, saving);
        logEvent('Travel support', `${travelManager.name} reduced a travel expense by 25%.`);
      } else {
        p.cash = Math.max(0, (Number(p.cash) || 0) - saving);
      }
      save(); render();
    };
  }

  // A personal assistant can coordinate a tighter recovery buffer, but never override an actual clash.
  const originalCheckAvailability = window.checkAvailability;
  if (typeof originalCheckAvailability === 'function') {
    window.checkAvailability = function (startDate, endDate, ignoreId = null) {
      if (!p || !manager('personal_assistant')) {
        return originalCheckAvailability(startDate, endDate, ignoreId);
      }
      const hadOwnValue = Object.prototype.hasOwnProperty.call(p, 'requiredRestDays');
      const previousRestDays = p.requiredRestDays;
      p.requiredRestDays = Math.max(1, (Number.isFinite(previousRestDays) ? previousRestDays : 2) - 1);
      try {
        return originalCheckAvailability(startDate, endDate, ignoreId);
      } finally {
        if (hadOwnValue) p.requiredRestDays = previousRestDays;
        else delete p.requiredRestDays;
      }
    };
  }

  // Public functions used by inline controls.
  window.MaidanSearchManager = managerMarketSearch;
  window.MaidanRequestMeeting = requestManagerMeeting;
  window.MaidanAcceptManager = acceptManagerOffer;
  window.MaidanDeclineManager = declineManagerOffer;
  window.MaidanNegotiateManager = negotiateManagerOffer;
  window.MaidanTerminateManager = (id) => terminateManager(id, true);
  window.MaidanNoticeManager = (id) => terminateManager(id, false);
  window.MaidanRenewManager = renewManager;
  window.MaidanFullRest = restFully;
  window.MaidanRecoveryDays = recoveryDays;
  window.MaidanRepayDebt = (n) => repayDebt(n === 'all' ? Number(p.cash) : n);
  window.MaidanRefreshManagement = () => { maybeManagerApproach(false); save(); render(); };
  window.MaidanGame = {
    getCareer: () => p,
    setCareer: (value) => { p = value; if (typeof save === 'function') save(); if (typeof continueCareer === 'function') continueCareer(); else render(); },
    render: () => render(),
    notify: (message) => { if (typeof window.toast === 'function') window.toast(message); }
  };

  // Offline database backup: localStorage remains the instant source of truth; IndexedDB is a resilient local backup.
  const DB_NAME = 'maidan-offline-db';
  const STORE_NAME = 'career-saves';
  const OFFLINE_KEY = 'primary-career';
  const offlineStore = {
    db: null,
    open() {
      if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
      if (this.db) return Promise.resolve(this.db);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => { this.db = request.result; resolve(this.db); };
        request.onerror = () => reject(request.error);
      });
    },
    async persist(career) {
      if (!career) return;
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ career, savedAt: new Date().toISOString() }, OFFLINE_KEY);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
    },
    async restore() {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(OFFLINE_KEY);
        request.onsuccess = () => resolve(request.result?.career || null);
        request.onerror = () => reject(request.error);
      });
    }
  };
  window.MaidanOfflineStore = offlineStore;

  async function restoreIndexedDbIfNeeded() {
    if (p) {
      offlineStore.persist(p).catch(() => {});
      return;
    }
    try {
      const saved = await offlineStore.restore();
      if (saved && saved.player && saved.skills) {
        p = saved;
        if (typeof continueCareer === 'function') continueCareer();
        else if (typeof render === 'function') render();
      }
    } catch (_err) { /* Local storage remains available as fallback. */ }
  }

  // Progressive Web App install and offline cache.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(() => {}));
  }
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); installPrompt = event;
    if (!$('maidanInstallButton')) {
      const button = document.createElement('button');
      button.id = 'maidanInstallButton'; button.className = 'install-cta'; button.textContent = '＋ Install Maidan';
      button.addEventListener('click', async () => {
        if (!installPrompt) return;
        installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; button.remove();
      });
      document.body.appendChild(button);
    }
  });
  window.addEventListener('appinstalled', () => { const b = $('maidanInstallButton'); if (b) b.remove(); });

  ensureGameFields();
  window.setTimeout(restoreIndexedDbIfNeeded, 350);
  if (p) {
    // A migration is additive; existing v2 career saves keep their original fields and history.
    save();
  }
})();
