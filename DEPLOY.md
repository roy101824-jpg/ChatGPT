# Deploy Wordtrail to Cloudflare

Wordtrail builds to a static `dist` directory. No database, server secrets or paid API keys are needed. Use the path that matches the Cloudflare app you already created. Publishing exposes the bundled vocabulary and original practice exercises to anyone who can access the resulting site; raw uploaded books are not included. The app has no login screen. If you want a private site, apply your Cloudflare Access policy to the deployment and test installation and offline use through that policy.

## Existing Cloudflare Pages project

If the project is connected to `roy101824-jpg/ChatGPT`, configure it with:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `22` or newer |

Cloudflare's Git integration builds the app when a commit is pushed to the selected production branch. The deployment's exact URL is shown in your Cloudflare dashboard. Do not assume a project URL until the deployment succeeds.

For a direct upload from your computer, install the locked dependencies, build, sign in to the intended Cloudflare account, then deploy to the **existing** project name:

```sh
npm ci
npm run build
npx wrangler login
npx wrangler pages project list
npx wrangler pages deploy dist --project-name YOUR_EXISTING_PAGES_PROJECT --branch main
```

Replace `YOUR_EXISTING_PAGES_PROJECT` with the name from the dashboard. `main` must match that project's production branch. The command publishes a new version; verify the displayed project and account before running it. Alternatively, an existing Direct Upload project can accept the contents of `dist` through its dashboard's deployment flow. Upload the built assets, not the repository directory.

Cloudflare documents [direct upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) and the [`pages deploy` command](https://developers.cloudflare.com/workers/wrangler/commands/pages/).

## Existing Cloudflare Worker

The included `wrangler.jsonc` configures Workers Static Assets. Change its `name` from `wordtrail` to your existing Worker name if different, keeping `assets.directory` set to `./dist`.

```sh
npm ci
npx wrangler login
npm run deploy
```

The deploy command runs the production build, then publishes its assets. For a Worker connected to Git builds, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command. Keep your existing domain bindings and access policy. No Worker entry-point script is required for this static app. See Cloudflare's [static assets documentation](https://developers.cloudflare.com/workers/static-assets/) and [configuration reference](https://developers.cloudflare.com/workers/static-assets/binding/).

## Add Wordtrail to your iPhone home screen

1. Open the successful deployment's HTTPS URL in **Safari**.
2. Let the app load while you have an internet connection.
3. Open Safari's **Share** menu and choose **Add to Home Screen**. If it is hidden, use **Edit Actions** to add it.
4. Keep **Open as Web App** enabled if Safari shows that option, then tap **Add**.
5. Launch **Wordtrail** from the new home-screen icon and use that installed app for your study sessions.

Apple's current steps are in [Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/iphea86e5236/ios). Controls can vary by iOS release. The app adapts to the screen size rather than a particular iPhone model.

Once installed, open Wordtrail online and wait for its offline cache to finish. Then enable airplane mode, reopen it, and check the word library and a study session. Return online to download future app updates. Pronunciation uses your device's available speech voices; offline voice availability depends on the device.

## After deployment

Verify the homepage, icons and manifest load over HTTPS, complete a short session, and reload to check that progress persists. Test a progress export and import before relying on a device migration. Run the airplane-mode check above. New deployments must not change the origin if you want to retain the same browser storage; moving to a custom domain requires transferring a backup.

If a new version does not appear, close every browser tab and installed window for Wordtrail, then reopen online. The service worker intentionally waits rather than interrupting an active session. Do not clear website data as the first update step, because doing so removes local study progress.
