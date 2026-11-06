# Updating `shubhamd9363-rgb/cricket-career-game`

This package is a more complete, mobile-first PWA build of Beyond the Boundary / Maidan. It replaces the older two-file repository snapshot (`index.html` + a short `README.md`) with a modular static web app.

## Before replacing files

1. Keep a backup of the current repository ZIP. The old `index.html` is preserved in your downloaded ZIP, so you can restore it if needed.
2. Extract this package on your computer.
3. Upload the **contents** of this extracted folder to the root of your GitHub repository: `https://github.com/shubhamd9363-rgb/cricket-career-game`.
4. Keep the folders at the repository root. In particular, do not upload the package as one nested folder. The root should contain `index.html`, `manifest.webmanifest`, `service-worker.js`, `assets/`, `js/`, `scripts/`, `supabase/`, and `.github/`.
5. Commit the changes to the `main` branch.

The `.github/workflows/pages.yml` workflow validates the source and deploys the static site to GitHub Pages. In the repository, open **Settings → Pages** and make sure the deployment source is **GitHub Actions**. Then check the **Actions** tab for the deployment result and use the Pages URL shown by GitHub.

## Installing on Android

1. Open the published GitHub Pages URL in Chrome on Android.
2. Open Chrome's menu and choose **Install app** or **Add to Home screen**.
3. Launch the installed Maidan icon. No Android Studio, APK, paid hosting, custom domain, or app-store listing is required.

The service worker caches the app shell after the first successful online load. Offline access is therefore expected after the app has been loaded once; it is not available before the initial cache is populated.

## Saves and accounts

- The game saves locally in the browser and keeps an IndexedDB backup.
- Export a career JSON backup from Player Profile before clearing browser data or moving to another device.
- The same GitHub Pages address should be retained when updating the repository so browser storage remains under the same site origin.
- Supabase cloud sync is optional and disabled until configured. The supplied `js/cloud-config.js` contains blank values; no key or secret is included in this package. You do not need Supabase to play.

## Validation performed on this package

- `npm run check` passed: JavaScript syntax, inline script syntax, local HTML references and required PWA/cloud files.
- Local browser-flow checks passed for player creation, toss, controlled batting, controlled bowling, a fielding event, innings and match completion, scorecard/career recording, manager search/meeting, and full recovery from an injury state.
- These are development checks, not exhaustive regression tests across every career stage, all formats, every manager contract path, every save migration, or a physical Android device.
