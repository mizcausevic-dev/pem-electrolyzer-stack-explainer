#!/usr/bin/env node
/**
 * Pre-deploy gate for dist/: every published file must have a web-servable
 * extension, no source/config/tooling file may ship, and the build-time
 * placeholders in index.html must all be resolved. Exits non-zero on failure.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const ALLOWED_EXT = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg', '.webp', '.mp4', '.woff', '.woff2', '.txt', '.xml', '.ico', '.webmanifest']);
const ALLOWED_NAMES = new Set(['.nojekyll']);
const FORBIDDEN = [/(^|\/)(src|scripts|node_modules|article|\.github|\.git)\//, /(^|\/)\.env/, /\.(ts|mjs|cjs|map|md|json|lock|yml|yaml|sh|py)$/i];
const REQUIRED = ['index.html', 'robots.txt', 'sitemap.xml', '.nojekyll', 'media/pem-electrolyzer-stack-explainer-Cursor.mp4', 'media/pem-electrolyzer-hero-Cursor.png', 'media/pem-electrolyzer-og-Cursor.png'];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const problems = [];
const files = (await walk(DIST)).map((p) => relative(DIST, p).split('\\').join('/'));
let bytes = 0;
for (const f of files) {
  bytes += (await stat(join(DIST, f))).size;
  const name = f.split('/').pop();
  if (FORBIDDEN.some((re) => re.test(f))) problems.push(`forbidden path: ${f}`);
  else if (!ALLOWED_NAMES.has(name) && !ALLOWED_EXT.has(extname(f).toLowerCase())) problems.push(`extension not on allowlist: ${f}`);
}
for (const r of REQUIRED) if (!files.includes(r)) problems.push(`missing required file: ${r}`);

const html = await readFile(join(DIST, 'index.html'), 'utf8');
for (const marker of [/%[A-Z_]+%/, /<!--(JSONLD|CHAPTERS|TRANSCRIPT|SOURCES)-->/]) {
  const m = html.match(marker);
  if (m) problems.push(`unresolved placeholder in index.html: ${m[0]}`);
}
if (!html.includes('"@type":"VideoObject"') && !html.includes('"@type": "VideoObject"')) problems.push('index.html is missing VideoObject JSON-LD');

if (problems.length) {
  console.error(`verify-dist: FAIL (${problems.length})`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`verify-dist: OK  ${files.length} files  ${(bytes / 1e6).toFixed(2)} MB`);
