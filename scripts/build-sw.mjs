import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Run after Vite: the offline cache describes this exact build, including all
// generated vocabulary chunks, rather than a hand-maintained asset list.
const dist = path.resolve('dist');
const excluded = new Set(['sw.js', '_headers', '_redirects', '.DS_Store']);
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name.startsWith('.') || excluded.has(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return nested.flat();
}
const files = (await walk(dist)).sort();
if (!files.some((file) => path.relative(dist, file) === 'index.html')) {
  throw new Error('Build the app before generating its service worker.');
}
const hash = createHash('sha256');
const urls = [];
let totalBytes = 0;
for (const file of files) {
  const contents = await readFile(file);
  const relative = path.relative(dist, file).split(path.sep).join('/');
  totalBytes += contents.length;
  hash.update(relative).update(contents);
  urls.push('/' + relative.split('/').map(encodeURIComponent).join('/'));
}
const version = hash.digest('hex').slice(0, 16);
const serviceWorker = `/* Wordtrail offline worker. Generated from the complete production build. */
const VERSION = ${JSON.stringify(version)};
const CACHE_PREFIX = 'wordtrail-assets-';
const CACHE = CACHE_PREFIX + VERSION;
const ASSETS = ${JSON.stringify(urls)};
const ASSET_SET = new Set(ASSETS);

self.addEventListener('install', (event) => {
  // Do not skipWaiting here: an update must not replace a learner's active app.
  event.waitUntil(caches.open(CACHE).then((cache) =>
    cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  // This is only used when a future UI explicitly offers an update button.
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_OFFLINE_STATUS' && event.ports[0]) {
    event.waitUntil(caches.open(CACHE).then(async (cache) => {
      const shell = await cache.match('/index.html');
      event.ports[0].postMessage({ ready: Boolean(shell), version: VERSION });
    }));
  }
});

async function navigate(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) return response;
  } catch (_) {
    // Network unavailable: use the shell from this exact cached build.
  } finally {
    clearTimeout(timeout);
  }
  const cache = await caches.open(CACHE);
  return (await cache.match('/index.html')) || new Response(
    'Wordtrail is not cached yet. Connect once to finish setup.',
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }
  // Only cache known app assets. Backups, arbitrary URLs and private responses
  // cannot accidentally become part of the app's persistent asset cache.
  if (!ASSET_SET.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.pathname);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(url.pathname, response.clone());
    return response;
  })());
});
`;
await writeFile(path.join(dist, 'sw.js'), serviceWorker);
console.log(`Offline build ${version}: ${urls.length} assets, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB.`);
