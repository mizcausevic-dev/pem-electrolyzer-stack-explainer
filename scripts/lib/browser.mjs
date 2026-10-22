import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const CHROME = process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome';

/**
 * Opens the app in capture mode (bare canvas, window.__pem exposed) and waits
 * until fonts are loaded so every captured frame uses the final typography.
 */
export async function openCapture(baseUrl, query = '') {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('[console]', m.text());
  });
  await page.goto(`${baseUrl}?capture=1${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__pem !== undefined, { timeout: 30000 });
  await page.evaluate(() => window.__pem.ready);
  return { browser, page };
}

/**
 * Resolves the app URL: uses `--url` when given, otherwise starts a private
 * Vite dev server on a spare port so capture scripts run without setup.
 */
export async function appUrl(url) {
  if (url) return { url, close: async () => {} };
  const server = await createServer({ logLevel: 'error', server: { port: 4391, strictPort: false, host: '127.0.0.1' } });
  await server.listen();
  return { url: server.resolvedUrls.local[0], close: () => server.close() };
}

/** Removes `--name value` from argv and returns the value. */
export function takeOpt(args, name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

export const decodeDataUrl = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
