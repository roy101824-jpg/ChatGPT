# Wordtrail

A personal, mobile-first GRE vocabulary and verbal study companion. Built with React, TypeScript and Vite, with a static Cloudflare deployment and an offline-capable iPhone home-screen app.

## Included

- 5,188 study headwords; 5,186 with definitions and two clearly flagged for review.
- A separate 4,005-term reference index and a catalog of all 67 supplied files.
- Spaced reviews, flashcards, meaning quizzes, saved words, personal notes, progress and streaks.
- 39 original explained verbal questions, five Issue-writing prompts, and a persistent timer/draft.
- Offline caching, interrupted-session recovery, and validated backup import/export.

See [SOURCE-COVERAGE.md](SOURCE-COVERAGE.md) for exact counts, provenance and unavailable sources. The ready-built [Cloudflare upload ZIP](releases/wordtrail-cloudflare.zip) contains only deployment assets.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

For the production app, including its offline service worker:

```sh
npm run build
npm run preview
```

Open the local URL printed by Vite. The service worker runs in production builds on HTTPS or localhost; it is intentionally disabled during development.

## What is stored

Study progress, bookmarks, personal notes and preferences live in this browser's local storage. There is no account, remote progress database or automatic synchronization. Export progress regularly using the app's backup controls, and import that backup when moving devices or changing the deployment's domain. Safari and a separately installed home-screen app may use separate storage; install first, then use the installed app consistently.

The vocabulary data and original practice exercises are bundled into the production app. Uploaded source PDFs, DOCX files, spreadsheets and extracted full-book text are excluded from the deployable bundle. Source labels identify where imported vocabulary was found; they do not imply endorsement or verified completeness of every source. The source coverage view describes extraction limitations. Imported definitions can require further editorial review, particularly where older material uses uncommon senses.

Wordtrail is an independent study tool. It is not affiliated with ETS, Magoosh, Kaplan, GregMat or the publishers of the supplied books. Original practice exercises are not official GRE questions and do not predict a GRE score.

## Offline behavior

The production build generates an asset manifest from every file in `dist`. The service worker caches the app shell, icons and vocabulary/practice bundles together. Open the deployed app while connected once and allow the cache to finish before going offline. Each changed build gets a new cache version; a waiting update does not forcibly replace an active study session. Close all Wordtrail windows and reopen while online to activate an update.

Offline storage is managed by the browser and may be cleared by device settings or storage pressure. Local progress is separate from the asset cache; app updates do not deliberately erase progress. Keep a backup before clearing website data or replacing a device.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

The Playwright suite uses system Chromium when present, otherwise Playwright Chromium. Run `npx playwright install --with-deps chromium` if needed. Browser coverage includes 320px portrait, phone landscape, and desktop; it does not replace a physical iPhone Safari test.

## Deploy and install

See [DEPLOY.md](DEPLOY.md) for Cloudflare Workers, an existing Cloudflare Pages project and iPhone home-screen installation. Deployment needs your Cloudflare account access and the exact existing project name; this repository does not contain credentials.
