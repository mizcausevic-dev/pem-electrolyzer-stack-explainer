#!/usr/bin/env node
/**
 * Renders every frame (0–1019) in headless Chrome and encodes a 1080p30 H.264 MP4.
 * Each frame is a pure function of its index, so the file is reproducible.
 * Usage: node scripts/render-video.mjs [--url http://127.0.0.1:4317/] [--out public/media/...mp4]
 */
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { once } from 'node:events';
import { appUrl, decodeDataUrl, openCapture, takeOpt } from './lib/browser.mjs';

const args = process.argv.slice(2);
const out = takeOpt(args, '--out', 'public/media/pem-electrolyzer-stack-explainer-Cursor.mp4');
const app = await appUrl(takeOpt(args, '--url'));
await mkdir(dirname(out), { recursive: true });

const { browser, page } = await openCapture(app.url);
const { totalFrames, fps } = await page.evaluate(() => ({ totalFrames: window.__pem.totalFrames, fps: window.__pem.fps }));

// prettier-ignore
const ffmpeg = spawn('ffmpeg', [
  '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', '18',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-movflags', '+faststart', '-r', String(fps),
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = once(ffmpeg, 'close');

const t0 = Date.now();
try {
  for (let f = 0; f < totalFrames; f++) {
    const data = await page.evaluate((n) => window.__pem.frameDataURL(n), f);
    if (!ffmpeg.stdin.write(decodeDataUrl(data))) await once(ffmpeg.stdin, 'drain');
    if (f % 60 === 0 || f === totalFrames - 1) process.stdout.write(`\rframe ${f + 1}/${totalFrames}`);
  }
} finally {
  ffmpeg.stdin.end();
  await browser.close();
  await app.close();
}
const [code] = await done;
if (code !== 0) {
  console.error(`\nffmpeg exited with ${code}`);
  process.exit(code ?? 1);
}
const { size } = await stat(out);
console.log(`\n${out}  ${totalFrames} frames  ${(size / 1e6).toFixed(2)} MB  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
