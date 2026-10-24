# Wordtrail

A personal, mobile-first GRE vocabulary and Verbal study companion. Built with React, TypeScript and Vite, with a static Cloudflare deployment and an offline-capable iPhone home-screen app.

## Included

- 5,188 study headwords; 5,186 with definitions and two clearly flagged for review.
- A separate 4,005-term reference index and a catalog of all 67 supplied files.
- Spaced reviews, flashcards, meaning quizzes, saved words, personal notes, progress and streaks.
- 99 original Verbal questions across all seven response formats: the previous 39 questions plus 60 new items, including 37 labeled Advanced.
- Focused drills by format, topic, difficulty and unseen status, with explanations, tempting-answer analysis and reusable strategies.
- A 27-question, 41-minute Verbal simulation: 12 questions in 18 minutes, then 15 in 23 minutes. It uses fixed sections, without adaptive routing or a scaled-score estimate.
- An error journal, confidence-based review queue, latest-attempt topic insights and a separate log for official Verbal benchmarks.
- 12 practical strategy guides and six official-resource entries, with ETS links and access notes.
- Five original Issue-writing prompts and a persistent timer/draft in the separate writing studio.
- Offline caching, interrupted-session recovery, and validated global backup import/export.

The training bank and timed simulation are Verbal-only. A 170 Verbal score is a preparation goal, not a promised result. As of **24 October 2026**, the official ETS pages checked did not identify a separately announced 2027 pattern. The app uses the currently published format; see [GRE-2027-ALIGNMENT.md](GRE-2027-ALIGNMENT.md) for the dated findings, scoring boundaries and official references.

See [SOURCE-COVERAGE.md](SOURCE-COVERAGE.md) for exact counts, provenance and unavailable sources. The ready-built [Cloudflare upload ZIP](releases/wordtrail-cloudflare.zip) contains only deployment assets.

## Preview

[Phone preview](docs/preview-mobile.png) · [Desktop preview](docs/preview-desktop.png)

[Verbal training on phone](docs/preview-verbal-mobile.png) · [Verbal training on desktop](docs/preview-verbal-desktop.png)

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

Study progress, bookmarks, personal notes and preferences live in this browser's local storage. Verbal attempts, confidence ratings, error reasons, journal notes, target date and recorded official scores are stored there too. There is no account, remote progress database or automatic synchronization. Export progress regularly using the app's backup controls, and import that backup when moving devices or changing the deployment's domain. Safari and a separately installed home-screen app may use separate storage; install first, then use the installed app consistently.

The global backup includes vocabulary progress, Verbal-prep history, practice totals and the writing draft. Saved in-progress sessions remain local to the browser; importing prep progress clears the current saved prep session. A timed session's clock continues when the app is backgrounded or closed, so resuming does not grant extra time.

The vocabulary data and original practice exercises are bundled into the production app. Uploaded source PDFs, DOCX files, spreadsheets and extracted full-book text are excluded from the deployable bundle. Source labels identify where imported vocabulary was found; they do not imply endorsement or verified completeness of every source. The source coverage view describes extraction limitations. Imported definitions can require further editorial review, particularly where older material uses uncommon senses.

Wordtrail is an independent study tool. It is not affiliated with ETS, Magoosh, Kaplan, GregMat or the publishers of the supplied books. Original practice exercises and editorial difficulty labels are not ETS-calibrated. Results show raw correct counts and practice accuracy, not a predicted GRE score. Official benchmarks are scores you enter from a scored official test; the app does not generate or verify them.

## Offline behavior

The production build generates an asset manifest from every file in `dist`. The service worker caches the app shell, icons and vocabulary/practice bundles together. Open the deployed app while connected once and allow the cache to finish before going offline. Each changed build gets a new cache version; a waiting update does not forcibly replace an active study session. Close all Wordtrail windows and reopen while online to activate an update.

Bundled vocabulary, Verbal questions and strategy guides work with the offline cache. External official-resource links require connectivity and may require an ETS account or purchase.

Offline storage is managed by the browser and may be cleared by device settings or storage pressure. Local progress is separate from the asset cache; app updates do not deliberately erase progress. Keep a backup before clearing website data or replacing a device.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Content and engine checks cover vocabulary provenance, Verbal response formats, complete-answer scoring, progress validation and session timing. Browser checks exercise practice, review and backup flows.

The Playwright suite uses system Chromium when present, otherwise Playwright Chromium. Run `npx playwright install --with-deps chromium` if needed. Browser coverage includes 320px portrait, phone landscape, and desktop; it does not replace a physical iPhone Safari test.

## Deploy and install

See [DEPLOY.md](DEPLOY.md) for Cloudflare Workers, an existing Cloudflare Pages project and iPhone home-screen installation. Deployment needs your Cloudflare account access and the exact existing project name; this repository does not contain credentials.
