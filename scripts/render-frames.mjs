#!/usr/bin/env node
/**
 * Renders selected frames to PNG for review.
 * Usage: node scripts/render-frames.mjs [--url http://127.0.0.1:4317/] [--out review] 0 120 360 ...
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decodeDataUrl, openCapture } from './lib/browser.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const url = opt('--url', 'http://127.0.0.1:4317/');
const out = opt('--out', 'review');
const frames = args.map(Number).filter((n) => Number.isFinite(n));
if (!frames.length) {
  console.error('Pass one or more frame numbers.');
  process.exit(1);
}

await mkdir(out, { recursive: true });
const { browser, page } = await openCapture(url);
try {
  for (const f of frames) {
    const data = await page.evaluate((n) => window.__pem.frameDataURL(n), f);
    const file = join(out, `frame-${String(f).padStart(4, '0')}.png`);
    await writeFile(file, decodeDataUrl(data));
    console.log(file);
  }
} finally {
  await browser.close();
}
