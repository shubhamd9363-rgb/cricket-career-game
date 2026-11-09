# Maidan — Beyond the Boundary

A standalone, mobile-first Indian cricket career simulation. The project runs as a static Progressive Web App (PWA): it does not require Base44, a paid app host, Android Studio, or an app-store listing.

> **Project status:** playable development build, not a finished commercial-grade cricket game. Read `GAME_STATUS.md` before treating any simulation as a fully implemented real-world cricket system.

## What is in this build

- Player creation with age, hometown, role, batting hand, bowling style and starting circumstances.
- Career progression through local/club, district, state age-group, senior domestic, India A and national-team pathways.
- Indian competition pathways including Vijay Merchant, Vinoo Mankad, Cooch Behar, Col. C. K. Nayudu, U23 State A, Vizzy, Ranji, Vijay Hazare, Syed Mushtaq Ali, Duleep Trophy and Irani Cup.
- Coach and selector conversations, performance reviews, scouting observations, trial invitations, trial matches, shortlists and final squad decisions.
- Player-controlled batting and bowling decisions, toss, fielding moments, ball-by-ball commentary, innings, scorecards and match outcomes.
- A simulated franchise draft/auction pathway, team offers, contracts, sponsorships and agent commissions.
- A manager marketplace: managers can approach the player; the player can search, request meetings, negotiate, hire, renew, give notice or terminate. Performance-team support affects development and recovery; the career manager supports selection preparation; talent scouts can generate playable showcase invitations; PR, travel, personal-assistant and security managers have stage-appropriate effects.
- Finance centre with in-game income, spending, recurring living and academy costs, manager payroll, debt/liabilities, savings and a transaction ledger.
- Rest days and a **Rest until fully fit** option which advances the in-game calendar while recovery and rehabilitation progress.
- Local saves using browser storage plus an IndexedDB backup, export/import of career saves, and optional Supabase cloud save.
- PWA manifest, app icons, service worker and a mobile navigation layout.

All teams, fictional manager candidates, sponsorships, salaries, match results, bids and game events are generated simulation content. The competition pathway is inspired by Indian cricket; the game does not confer real selection or reproduce official association processes. Current eligibility and competition rules can change and vary by association and season.

## Play on Android

No Android application or developer tool needs to be installed.

1. Publish this repository to GitHub (the repository must be public for GitHub Free Pages).
2. Wait for the **Deploy Maidan to GitHub Pages** workflow to complete.
3. Open the Pages URL in Chrome on Android.
4. Use Chrome's menu and choose **Install app** or **Add to Home screen**.
5. Launch Maidan from the new home-screen icon.

The game is designed for portrait mobile play. The PWA shell and local career files are cached for offline play after the first successful load. Browser storage can be cleared by Android/Chrome or by the user, so periodically export a career JSON backup.

## Put the files in GitHub

Upload the extracted project contents at the repository root. Keep `index.html`, the repository root, the repository root, `manifest.webmanifest`, `service-worker.js`, the repository root, `.github/`, `package.json` and the documentation together. Do not upload `node_modules`, build output, access tokens, passwords, service-role keys or other private credentials.

The included GitHub Actions workflow checks JavaScript syntax and local file references, then deploys the repository root to GitHub Pages. In GitHub, open **Settings → Pages** and ensure the source is set to **GitHub Actions**.

## Optional local preview (desktop only)

Node.js is only needed when you want to run the source locally on a computer. It is not needed on your Android phone.

```bash
npm run check
npm run serve
```

Open `http://localhost:4173`. The check script validates JavaScript syntax, inline browser scripts, local asset references and required PWA files. It is not a substitute for end-to-end gameplay testing on a real Android device.

## Saving and accounts

### Offline-only mode (default)

No account or cloud setup is required. Maidan saves to browser local storage and keeps an IndexedDB backup. Use Player Profile → Export career save before changing devices or clearing browser data.

### Optional Supabase cloud sync

Cloud sync is disabled by default. To enable it without putting secrets in the repository:

1. Create a Supabase project on the Free plan.
2. Run `schema.sql` in the Supabase SQL Editor.
3. Copy the project URL and the browser-safe publishable/anon key into `cloud-config.js`.
4. Never place a Supabase `service_role` key in this repository.

Cloud sync is optional; the game remains playable without it. Free cloud plans have usage limits and may change. Do not rely on any cloud provider's free tier as unlimited or permanent storage. Export local backups regularly.

## Game architecture

- `index.html` — game shell, career screens, creation flow, core career systems and responsive styles.
- `interactive-cricket.js` — player-controlled ball-by-ball match loop, batting/bowling decisions, fielding events, scorecards, selector/coach interactions and trial flow.
- `standalone.js` — independent manager, economy, debt, recovery, IndexedDB backup and PWA install support.
- `cloud-sync.js` — optional Supabase Auth and per-user cloud career save.
- `cloud-config.js` — empty-by-default public client configuration.
- `schema.sql` — player save table and row-level security policies.
- `service-worker.js` and `manifest.webmanifest` — PWA caching and install metadata.

There are no Base44 SDK imports or Base44 API calls in the runtime game. The project is a static frontend with optional Supabase cloud services.

## Known limitations

- The match engine is a text-and-choice simulation, not a 3D animated cricket game. Ball outcomes and opposition play are simulated; the player controls their own batting/bowling decisions and selected fielding events.
- Multi-day cricket is condensed into four innings with a limited overs cap per innings. It is not a full real-time four/five-day Ranji/Test rules engine yet.
- Field placement and tactical options are simplified; it is not a full 360-degree field editor.
- The franchise auction, squad offers, manager candidates and payments are fictional game systems, not an official IPL auction or actual player contract values.
- Career stages, age checks, selector thresholds and probability models are balancing rules inspired by the Indian pathway, not official BCCI/state-association selection criteria.
- The game needs full playtesting on Android screen sizes, longer multi-season career tests, save/restore tests and a balance pass before it should be described as complete.

## Cost

The game code and GitHub Pages deployment can be run at ₹0 with a public GitHub repository. Offline play also costs ₹0. Optional Supabase cloud sync has free-tier quotas; check the provider's current terms before enabling it. This project does not require payment APIs or a paid AI service.
