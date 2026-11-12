/* ==========================================================
   Convertly - pre-renderer
   Runs after `vite build` (see package.json). Opens every
   route in the Chrome already installed on this machine,
   waits for React to render + set the <head>, and saves the
   resulting HTML as dist/<route>/index.html.

   That bakes the title, meta description, canonical URL,
   Open Graph tags and FAQ JSON-LD into the static files, so
   Google sees them without running any JavaScript.

   Uses puppeteer-core with your installed Chrome - no
   Chromium download. Skips with a warning if Chrome is
   missing (set CHROME_PATH to point at another browser).
   ========================================================== */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4173;

/* Chrome locations to try: env overrides first, then OS defaults.
   The Linux paths cover CI images (Vercel, GitHub Actions...) which put
   the browser in different places than a desktop install. */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean);

let chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));

/* Last resort: ask the shell where the browser is. */
if (!chromePath && process.platform !== 'win32') {
  try {
    const probe = spawnSync(
      'sh',
      ['-c', 'command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser'],
      { encoding: 'utf8' }
    );
    const found = (probe.stdout || '').trim().split('\n')[0];
    if (found && existsSync(found)) chromePath = found;
  } catch {
    /* fall through to the skip below */
  }
}
if (!chromePath) {
  console.warn('[prerender] Chrome not found - skipping pre-render (set CHROME_PATH to enable it).');
  process.exit(0);
}

/* Slugs are read from the registry source text, so the route list
   can never drift from the slugs the app actually uses. */
const registrySource = readFileSync(path.join(ROOT, 'src', 'tools', 'registry.js'), 'utf8');
const slugs = [...registrySource.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);

const routes = [
  '/',
  ...slugs.map((slug) => `/tools/${slug}`),
  '/about',
  '/privacy',
  '/contact',
  '/terms',
];

/* The pristine SPA shell - served from memory for every route so each
   render starts from the same (not yet pre-rendered) document. */
const shell = readFileSync(path.join(DIST, 'index.html'), 'utf8');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/* Tiny static server: files from dist/, every extensionless URL
   (i.e. every route) answers with the SPA shell. */
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  const ext = path.extname(pathname);

  if (!ext) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(shell);
    return;
  }

  const file = path.normalize(path.join(DIST, pathname));
  if (!file.startsWith(DIST + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-gpu', '--no-sandbox', '--hide-scrollbars'],
});

let failed = 0;

for (const route of routes) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    /* Seo.jsx stamps data-seo-path on <html> once title + meta + JSON-LD
       are in place - that is our "render finished" signal. */
    await page.waitForFunction(
      (expected) => document.documentElement.getAttribute('data-seo-path') === expected,
      { timeout: 20000 },
      route
    );
    /* Tools are lazy-loaded chunks - wait until the network is quiet so
       the tool panel itself is part of the saved HTML too. */
    await page.waitForNetworkIdle({ idleTime: 400, timeout: 15000 }).catch(() => {});
    /* Two frames so the JSON-LD script and the lazily rendered panel are
       definitely part of the serialized DOM. */
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    /* Modulepreload links are created by JS with the pre-render server's
       origin - rewrite them to root-relative (/assets/...) so the deployed
       site loads its chunks from its own domain instead of localhost. */
    const html = (await page.content()).split(`http://127.0.0.1:${PORT}`).join('');
    const outFile =
      route === '/'
        ? path.join(DIST, 'index.html')
        : path.join(DIST, route.slice(1), 'index.html');
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, html, 'utf8');
    console.log(`[prerender] ${route}`);
  } catch (err) {
    failed += 1;
    console.error(`[prerender] FAILED ${route}: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

if (failed > 0) {
  console.error(`[prerender] ${failed} of ${routes.length} route(s) failed.`);
  process.exit(1);
}
console.log(`[prerender] done - ${routes.length} pages written to dist/.`);
