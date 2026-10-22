import { type Plugin, defineConfig } from 'vite';
import { CHAPTERS, DURATION_S, FPS, timecode } from './src/engine/timeline.ts';
import { CHAPTER_NOTES, HERO_FILE, OG_FILE, REPO_URL, SITE_URL, SOURCES, VIDEO_FILE } from './src/site/content.ts';
import { richToHtml, richToText } from './src/site/markup.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const secs = (f: number) => Math.round((f / FPS) * 100) / 100;
const mmss = (f: number) => {
  const s = Math.floor(f / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Injects chapters, transcript, sources, and JSON-LD into index.html from the
 * same timeline module the renderer uses, so on-screen captions and the
 * crawlable page text cannot drift apart.
 */
function staticContent(): Plugin {
  return {
    name: 'pem-static-content',
    transformIndexHtml(html) {
      const chapters = CHAPTERS.map(
        (c) => `
          <li class="chapter-card reveal" data-start="${c.start}">
            <button type="button" class="chapter-jump" data-frame="${c.start}" aria-label="Play chapter ${c.id}: ${esc(c.title)}">
              <span class="chapter-num">${String(c.id).padStart(2, '0')}</span>
              <span class="chapter-time">${mmss(c.start)}–${mmss(c.end + 1)} · frames ${c.start}–${c.end}</span>
            </button>
            <h3>${esc(c.title)}</h3>
            <p>${esc(CHAPTER_NOTES[c.id])}</p>
          </li>`,
      ).join('');

      const transcript = CHAPTERS.map(
        (c) => `
          <section class="transcript-chapter">
            <h3>${String(c.id).padStart(2, '0')} · ${esc(c.title)}</h3>
            <ol>
              ${c.beats
                .map(
                  ([f, text]) =>
                    `<li><button type="button" class="beat-jump" data-frame="${f}"><time datetime="PT${secs(f)}S">${timecode(f)}</time></button><span>${richToHtml(text)}</span></li>`,
                )
                .join('\n              ')}
            </ol>
          </section>`,
      ).join('');

      const sources = SOURCES.map(
        (s) => `
          <li>
            <a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.title)}</a>
            <span class="source-org">${esc(s.org)}</span>
            <span class="source-supports">Supports: ${esc(s.supports)}</span>
          </li>`,
      ).join('');

      const description =
        'A 34-second, code-driven anatomy explainer of a generic PEM electrolyzer stack: membrane electrode assembly and plates, water feed, gas evolution, cooling, and balance of plant. Illustrative, not to scale.';
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: 'PEM electrolyzer stack: an anatomy explainer (generic, illustrative)',
        description,
        thumbnailUrl: [SITE_URL + HERO_FILE, SITE_URL + OG_FILE],
        uploadDate: '2026-10-22',
        duration: `PT${DURATION_S}S`,
        contentUrl: SITE_URL + VIDEO_FILE,
        embedUrl: SITE_URL,
        inLanguage: 'en',
        isFamilyFriendly: true,
        publisher: { '@type': 'Organization', name: 'Kinetic Gain LLC', url: 'https://kineticgain.com' },
        citation: SOURCES.map((s) => s.url),
        hasPart: CHAPTERS.map((c) => ({
          '@type': 'Clip',
          name: c.title,
          startOffset: Math.floor(c.start / FPS),
          endOffset: Math.ceil((c.end + 1) / FPS),
          url: `${SITE_URL}?t=${Math.floor(c.start / FPS)}`,
        })),
        transcript: CHAPTERS.flatMap((c) => c.beats.map(([, t]) => richToText(t))).join(' '),
      };

      return html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%REPO_URL%', REPO_URL)
        .replaceAll('%VIDEO_FILE%', VIDEO_FILE)
        .replaceAll('%OG_FILE%', OG_FILE)
        .replaceAll('%DESCRIPTION%', esc(description))
        .replace('<!--CHAPTERS-->', chapters)
        .replace('<!--TRANSCRIPT-->', transcript)
        .replace('<!--SOURCES-->', sources)
        .replace('<!--JSONLD-->', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
    },
  };
}

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 4317, strictPort: true },
  preview: { host: '0.0.0.0', port: 4318, strictPort: true },
  build: { target: 'es2022', sourcemap: false },
  plugins: [staticContent()],
});
