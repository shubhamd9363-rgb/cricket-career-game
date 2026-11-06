# Maidan build status

## Implemented in the current development build

- Standalone HTML/CSS/JavaScript runtime; no Base44 runtime dependency.
- Player creation and career save migration.
- Performance-based progression gates and selector/coaching conversations.
- Scouting activity, trial invitations, assessment matches, shortlists and final decisions.
- Competition directory with Indian domestic competition pathways.
- Player-controlled batting/bowling choices and selected fielding events, with delivery log and innings scorecards.
- Manager approaches, candidate search, meetings, offer negotiation, hire, contract renewal, notice and termination.
- Match and sponsorship income, academy/living costs, manager payroll, spending options, savings and debt handling.
- Short recovery and full-rest-until-fit mechanics.
- Local storage, IndexedDB backup, JSON save export/import, optional Supabase account/cloud save.
- Mobile-first layout, PWA manifest, offline cache and install prompt.

## Not yet complete / needs validation

- No 3D/animated match presentation or full field-position editor.
- Multi-day matches use a condensed four-innings/overs-limited model.
- Selection thresholds and auction outcomes are game-balancing models, not exact official selector procedures.
- Franchise draft and commercial agreements are fictional representations.
- Full multi-season regression tests, mobile-device testing, data migration testing and economy balance testing remain outstanding.
- Cloud save requires the owner to configure a Supabase project; it is deliberately disabled in the repository by default.

## Release gate

Do not call this a finished full cricket career game until the team has tested: player creation; match toss; batting and bowling; wickets and innings changes; scorecard aggregation; trial match and selector decision; competition eligibility; franchise draft; manager approaches/hire/renew/termination; monthly expense and payroll processing; recovery during injuries; export/import; offline restart; optional cloud sync; Android install and save persistence.
