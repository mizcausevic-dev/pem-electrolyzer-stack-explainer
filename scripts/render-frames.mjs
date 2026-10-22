#!/usr/bin/env node
/**
 * Renders selected frames to PNG for review.
 * Usage: node scripts/render-frames.mjs [--url http://127.0.0.1:4317/] [--out review] 0 120 360 ...
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appUrl, decodeDataUrl, openCapture, takeOpt } from './lib/browser.mjs';

const args = process.argv.slice(2);
const out = takeOpt(args, '--out', 'review');
const app = await appUrl(takeOpt(args, '--url'));
const frames = args.map(Number).filter((n) => Number.isFinite(n));
if (!frames.length) {
  console.error('Pass one or more frame numbers.');
  await app.close();
  process.exit(1);
}

await mkdir(out, { recursive: true });
const { browser, page } = await openCapture(app.url);
try {
  for (const f of frames) {
    const data = await page.evaluate((n) => window.__pem.frameDataURL(n), f);
    const file = join(out, `frame-${String(f).padStart(4, '0')}.png`);
    await writeFile(file, decodeDataUrl(data));
    console.log(file);
  }
} finally {
  await browser.close();
  await app.close();
}
