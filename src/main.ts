import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles.css';

import { LOGICAL_H, LOGICAL_W } from './engine/camera';
import { clamp } from './engine/math';
import { CHAPTERS, FPS, LAST_FRAME, TOTAL_FRAMES, chapterAt, timecode } from './engine/timeline';
import { HERO_H, HERO_W, renderFrame, renderHero } from './render';

declare global {
  interface Window {
    __pem?: {
      ready: Promise<void>;
      totalFrames: number;
      fps: number;
      render: (frame: number) => void;
      frameDataURL: (frame: number) => string;
      heroDataURL: (scale: number) => string;
    };
  }
}

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false });

async function loadFonts(): Promise<void> {
  const faces = [
    '400 20px "Space Grotesk"',
    '500 20px "Space Grotesk"',
    '600 20px "Space Grotesk"',
    '700 20px "Space Grotesk"',
    '400 20px "JetBrains Mono"',
    '500 20px "JetBrains Mono"',
    '600 20px "JetBrains Mono"',
    '700 20px "JetBrains Mono"',
  ];
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
  await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, 'AaH₂O·−'))).then(() => document.fonts.ready), timeout]);
}

/* ------------------------------------------------------------ capture mode */

function setupCapture(c: CanvasRenderingContext2D): void {
  document.documentElement.classList.add('capture');
  const hero = params.has('hero');
  const scale = Number(params.get('scale') ?? (hero ? 1.25 : 1));
  canvas.width = Math.round((hero ? HERO_W : LOGICAL_W) * scale);
  canvas.height = Math.round((hero ? HERO_H : LOGICAL_H) * scale);
  const ready = loadFonts();
  window.__pem = {
    ready,
    totalFrames: TOTAL_FRAMES,
    fps: FPS,
    render: (frame) => renderFrame(c, frame, { scale }),
    frameDataURL: (frame) => {
      renderFrame(c, frame, { scale });
      return canvas.toDataURL('image/png');
    },
    heroDataURL: (s) => {
      canvas.width = Math.round(HERO_W * s);
      canvas.height = Math.round(HERO_H * s);
      renderHero(c, s);
      return canvas.toDataURL('image/png');
    },
  };
  ready.then(() => {
    if (hero) renderHero(c, scale);
    else renderFrame(c, Number(params.get('frame') ?? 0), { scale });
    document.documentElement.dataset.ready = '1';
  });
}

/* ------------------------------------------------------------ player */

function setupPlayer(c: CanvasRenderingContext2D): void {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const stage = $<HTMLDivElement>('stage');
  const stateBox = $<HTMLDivElement>('stage-state');
  const stateText = $<HTMLSpanElement>('stage-state-text');
  const bigPlay = $<HTMLButtonElement>('stage-play');
  const btnPlay = $<HTMLButtonElement>('btn-play');
  const scrub = $<HTMLInputElement>('scrub');
  const tc = $<HTMLOutputElement>('timecode');
  const speedSel = $<HTMLSelectElement>('speed');
  const strip = $<HTMLOListElement>('chapter-strip');
  const ticks = $<HTMLDivElement>('scrub-ticks');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startParam = params.has('frame') ? Number(params.get('frame')) : params.has('t') ? Number(params.get('t')) * FPS : 0;
  let pos = clamp(Number.isFinite(startParam) ? startParam : 0, 0, LAST_FRAME);
  let playing = false;
  let speed = 1;
  let lastTs = 0;
  let drawn = -1;
  let scale = 1;
  let ready = false;
  let raf = 0;

  // chapter strip + scrub ticks
  const stripItems = CHAPTERS.map((ch) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strip-btn';
    b.dataset.frame = String(ch.start);
    b.style.setProperty('--w', String(ch.end - ch.start + 1));
    b.innerHTML = `<span class="strip-num">${String(ch.id).padStart(2, '0')}</span><span class="strip-title">${ch.title}</span><span class="strip-fill"></span>`;
    b.setAttribute('aria-label', `Chapter ${ch.id}: ${ch.title}, ${timecode(ch.start)}`);
    li.appendChild(b);
    strip.appendChild(li);
    if (ch.start > 0) {
      const t = document.createElement('span');
      t.style.left = `${(ch.start / LAST_FRAME) * 100}%`;
      ticks.appendChild(t);
    }
    return { ch, b, fill: b.querySelector('.strip-fill') as HTMLSpanElement };
  });

  function resize(): void {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.round(rect.width * dpr));
    canvas.width = w;
    canvas.height = Math.round((w * LOGICAL_H) / LOGICAL_W);
    scale = w / LOGICAL_W;
    drawn = -1;
    schedule();
  }

  function updateUi(f: number): void {
    scrub.value = String(f);
    scrub.style.setProperty('--p', `${(f / LAST_FRAME) * 100}%`);
    tc.value = `${timecode(f)} · F ${String(f).padStart(4, '0')}`;
    const cur = chapterAt(f);
    for (const { ch, b, fill } of stripItems) {
      const p = clamp((f - ch.start) / (ch.end - ch.start));
      fill.style.transform = `scaleX(${f >= ch.start ? p : 0})`;
      b.classList.toggle('active', ch.id === cur.id);
      if (ch.id === cur.id) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    }
    document.querySelectorAll<HTMLElement>('.chapter-card').forEach((el) => {
      el.classList.toggle('is-current', Number(el.dataset.start) === cur.start);
    });
  }

  function draw(): void {
    const f = Math.floor(pos);
    if (f === drawn) return;
    renderFrame(c, f, { scale });
    drawn = f;
    updateUi(f);
  }

  function frameLoop(ts: number): void {
    raf = 0;
    if (playing) {
      const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
      lastTs = ts;
      pos += dt * FPS * speed;
      if (pos >= LAST_FRAME) {
        pos = LAST_FRAME;
        setPlaying(false);
      }
    }
    draw();
    if (playing) schedule();
  }

  function schedule(): void {
    if (!raf && ready) raf = requestAnimationFrame(frameLoop);
  }

  function setPlaying(p: boolean): void {
    if (p && pos >= LAST_FRAME) pos = 0;
    playing = p;
    lastTs = 0;
    btnPlay.classList.toggle('is-playing', p);
    btnPlay.setAttribute('aria-label', p ? 'Pause' : 'Play');
    bigPlay.hidden = p || !ready;
    bigPlay.setAttribute('aria-label', pos >= LAST_FRAME ? 'Replay explainer' : 'Play explainer');
    schedule();
  }

  function seek(f: number, play?: boolean): void {
    pos = clamp(Math.round(f), 0, LAST_FRAME);
    drawn = -1;
    if (play !== undefined) setPlaying(play);
    else schedule();
  }

  btnPlay.addEventListener('click', () => setPlaying(!playing));
  bigPlay.addEventListener('click', () => setPlaying(true));
  canvas.addEventListener('click', () => setPlaying(!playing));
  $('btn-restart').addEventListener('click', () => seek(0, true));
  $('btn-back').addEventListener('click', () => seek(Math.floor(pos) - 1, false));
  $('btn-fwd').addEventListener('click', () => seek(Math.floor(pos) + 1, false));
  $('btn-full').addEventListener('click', () => toggleFullscreen());
  scrub.addEventListener('input', () => seek(Number(scrub.value), false));
  speedSel.addEventListener('change', () => {
    speed = Number(speedSel.value);
  });
  strip.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.strip-btn');
    if (b) seek(Number(b.dataset.frame), true);
  });
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.chapter-jump, .beat-jump');
    if (!b) return;
    seek(Number(b.dataset.frame), true);
    stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  function toggleFullscreen(): void {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
  }
  document.addEventListener('fullscreenchange', resize);

  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
    if (t instanceof HTMLInputElement && t.type === 'range' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return;
    if (t instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const step = e.shiftKey ? FPS : 1;
    switch (e.key) {
      case ' ':
      case 'k':
        setPlaying(!playing);
        break;
      case 'ArrowLeft':
        seek(Math.floor(pos) - step, false);
        break;
      case 'ArrowRight':
        seek(Math.floor(pos) + step, false);
        break;
      case 'Home':
        seek(0, false);
        break;
      case 'End':
        seek(LAST_FRAME, false);
        break;
      case 'f':
        toggleFullscreen();
        break;
      default:
        if (/^[1-5]$/.test(e.key)) seek(CHAPTERS[Number(e.key) - 1].start, true);
        else return;
    }
    e.preventDefault();
  });

  new ResizeObserver(resize).observe(stage);

  loadFonts()
    .then(() => {
      ready = true;
      stateBox.hidden = true;
      resize();
      draw();
      const autoplay = !reduceMotion && !params.has('frame');
      if (!autoplay) {
        bigPlay.hidden = false;
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            setPlaying(true);
            io.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(stage);
    })
    .catch((err: unknown) => {
      stateText.textContent = `Could not start the renderer: ${err instanceof Error ? err.message : String(err)}`;
      stateBox.classList.add('is-error');
    });
}

/* ------------------------------------------------------------ page effects */

function setupPageEffects(): void {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  document.querySelectorAll<HTMLElement>('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll<HTMLElement>('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }
}

/* ------------------------------------------------------------ boot */

if (!ctx) {
  const box = document.getElementById('stage-state');
  const text = document.getElementById('stage-state-text');
  if (box && text) {
    text.textContent = 'This browser cannot draw a 2D canvas. The transcript and chapter notes below cover the full explainer.';
    box.classList.add('is-error');
  }
} else if (params.has('capture')) {
  setupCapture(ctx);
} else {
  setupPlayer(ctx);
  setupPageEffects();
}
