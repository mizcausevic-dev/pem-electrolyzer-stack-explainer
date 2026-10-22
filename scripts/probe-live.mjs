#!/usr/bin/env node
/**
 * Post-deploy probe. Checks that the published assets resolve AND that
 * repository-only paths (source, tooling, CI, article drafts) do not.
 * Usage: node scripts/probe-live.mjs [https://user.github.io/repo/]
 */
import { readFile } from 'node:fs/promises';

const content = await readFile(new URL('../src/site/content.ts', import.meta.url), 'utf8');
const base = process.argv[2] ?? content.match(/SITE_URL\s*=\s*'([^']+)'/)?.[1];
if (!base) {
  console.error('No base URL.');
  process.exit(1);
}

const MUST_RESOLVE = ['', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'media/pem-electrolyzer-stack-explainer-Cursor.mp4', 'media/pem-electrolyzer-hero-Cursor.png', 'media/pem-electrolyzer-og-Cursor.png'];
const MUST_NOT_RESOLVE = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'README.md',
  'src/main.ts',
  'src/site/content.ts',
  'scripts/render-video.mjs',
  'scripts/verify-dist.mjs',
  '.github/workflows/deploy.yml',
  'article/medium-article-Cursor.md',
  '.git/config',
  '.env',
];

let failed = 0;
const check = async (path, expectOk) => {
  const url = new URL(path, base).href;
  const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
  const ok = res.status >= 200 && res.status < 300;
  const pass = ok === expectOk;
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${res.status}  ${expectOk ? 'resolves    ' : 'must not    '}  /${path}`);
};

for (const p of MUST_RESOLVE) await check(p, true);
for (const p of MUST_NOT_RESOLVE) await check(p, false);
console.log(failed ? `probe-live: FAIL (${failed})` : 'probe-live: OK');
process.exit(failed ? 1 : 0);
