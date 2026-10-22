#!/usr/bin/env node
/**
 * Renders the article hero (2400×1260) and the social card (1200×630) from the
 * same deterministic scene used by the explainer.
 * Usage: node scripts/render-hero.mjs [--url http://127.0.0.1:4317/] [--dir public/media]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appUrl, decodeDataUrl, openCapture, takeOpt } from './lib/browser.mjs';

const args = process.argv.slice(2);
const dir = takeOpt(args, '--dir', 'public/media');
const app = await appUrl(takeOpt(args, '--url'));
await mkdir(dir, { recursive: true });

const outputs = [
  ['pem-electrolyzer-hero-Cursor.png', 1.25],
  ['pem-electrolyzer-og-Cursor.png', 0.625],
];

const { browser, page } = await openCapture(app.url, '&hero=1');
try {
  for (const [name, scale] of outputs) {
    const data = await page.evaluate((s) => window.__pem.heroDataURL(s), scale);
    const file = join(dir, name);
    await writeFile(file, decodeDataUrl(data));
    console.log(file);
  }
} finally {
  await browser.close();
  await app.close();
}
