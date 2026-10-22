import { type Camera, viewRect } from '../engine/camera';
import { clamp, fade, ramp, smooth } from '../engine/math';
import { CHAPTERS, LAST_FRAME, beatAt, timecode } from '../engine/timeline';
import { STACK_BOUNDS } from './geometry';
import { C, rgba } from './palette';
import { MONO, drawRich, measureRich, wrap } from './text';

type Tone = 'neutral' | 'cyan' | 'gold' | 'violet';

interface Badge {
  text: string;
  win: [number, number, number, number];
  tone: Tone;
}

/** Every change of scale, speed, or representation is announced on screen. */
export const BADGES: Badge[] = [
  { text: 'EXTERIOR · GENERIC STACK', win: [0, 1, 34, 60], tone: 'neutral' },
  { text: 'CELL COUNT REDUCED FOR CLARITY', win: [8, 26, 148, 168], tone: 'neutral' },
  { text: 'SECTION VIEW A–A · NO DISASSEMBLY', win: [30, 50, 740, 770], tone: 'neutral' },
  { text: 'NOT TO SCALE · LAYERS EXAGGERATED', win: [96, 116, 740, 770], tone: 'neutral' },
  { text: 'FLOW SPEED ILLUSTRATIVE', win: [176, 196, 500, 520], tone: 'cyan' },
  { text: 'SCHEMATIC · MOLECULAR SCALE', win: [338, 354, 444, 460], tone: 'neutral' },
  { text: 'SLOW MOTION', win: [344, 360, 444, 460], tone: 'violet' },
  { text: 'HIDDEN LINES DASHED', win: [456, 472, 506, 524], tone: 'neutral' },
  { text: 'FIELD · SCHEMATIC', win: [530, 550, 700, 720], tone: 'gold' },
  { text: 'TIME COMPRESSED · THERMAL BUILD-UP', win: [530, 550, 744, 764], tone: 'gold' },
  { text: 'PROCESS SCHEMATIC · SIMPLIFIED', win: [778, 800, Infinity, Infinity], tone: 'neutral' },
];

const toneColor = (t: Tone) => (t === 'neutral' ? C.bone : C[t]);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { roundRect };

export function drawScrims(ctx: CanvasRenderingContext2D): void {
  const top = ctx.createLinearGradient(0, 0, 0, 240);
  top.addColorStop(0, rgba(C.stage, 0.92));
  top.addColorStop(0.7, rgba(C.stage, 0.55));
  top.addColorStop(1, rgba(C.stage, 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, 1920, 240);
  const bot = ctx.createLinearGradient(0, 1080, 0, 880);
  bot.addColorStop(0, rgba(C.stage, 0.95));
  bot.addColorStop(0.6, rgba(C.stage, 0.6));
  bot.addColorStop(1, rgba(C.stage, 0));
  ctx.fillStyle = bot;
  ctx.fillRect(0, 880, 1920, 200);
}

export function drawHeader(ctx: CanvasRenderingContext2D, f: number): void {
  const { chapter, text, since } = beatAt(f);
  const chapterIn = smooth(ramp(f, chapter.start, chapter.start + 14));
  const beatIn = smooth(ramp(f, since, since + 12));
  const x = 64;

  drawRich(ctx, `${String(chapter.id).padStart(2, '0')} / 05`, x, 66, { size: 17, family: MONO, weight: 600, color: rgba(C.cyan, 0.95), letterSpacing: 1 });
  drawRich(ctx, 'PEM ELECTROLYZER STACK · GENERIC · ILLUSTRATIVE', x + 104, 66, { size: 15, family: MONO, color: rgba(C.muted, 0.95), letterSpacing: 1.5 });

  ctx.save();
  ctx.globalAlpha = chapterIn;
  drawRich(ctx, chapter.title, x - (1 - chapterIn) * 14, 118, { size: 46, weight: 700, color: C.bone });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = beatIn;
  const lines = wrap(ctx, text, { size: 23, color: C.text }, 1000);
  lines.slice(0, 2).forEach((ln, i) => drawRich(ctx, ln, x, 156 + i * 30, { size: 23, weight: 400, color: C.text }));
  ctx.restore();
}

export function drawBreadcrumb(ctx: CanvasRenderingContext2D, cam: Camera): void {
  const levels = ['SYSTEM', 'STACK', 'CELL SECTION', 'CATALYST INTERFACE · SCHEMATIC'];
  const z = cam.z;
  const idx = z < 1.25 ? 0 : z < 7 ? 1 : z < 60 ? 2 : 3;
  let x = 1856;
  const y = 1000;
  ctx.save();
  ctx.font = `500 14px ${MONO}`;
  const parts: { t: string; active: boolean }[] = [];
  levels.forEach((t, i) => {
    parts.push({ t, active: i === idx });
    if (i < levels.length - 1) parts.push({ t: '›', active: false });
  });
  const widths = parts.map((p) => ctx.measureText(p.t).width + 10);
  const total = widths.reduce((a, b) => a + b, 0);
  x -= total;
  drawRich(ctx, 'VIEW LEVEL', x - 112, y, { size: 13, family: MONO, color: rgba(C.faint, 1), letterSpacing: 1.5 });
  parts.forEach((p, i) => {
    drawRich(ctx, p.t, x, y, { size: 14, family: MONO, weight: p.active ? 700 : 500, color: p.active ? C.cyan : rgba(C.muted, 0.7) });
    x += widths[i];
  });
  ctx.restore();
}

export function drawBadges(ctx: CanvasRenderingContext2D, f: number): void {
  let y = 44;
  for (const b of BADGES) {
    const a = fade(f, ...b.win);
    if (a <= 0.001) continue;
    const s = { size: 14, family: MONO, weight: 600, color: toneColor(b.tone), letterSpacing: 1.2 };
    const w = measureRich(ctx, b.text, s) + 30;
    const h = 30;
    const x = 1856 - w + (1 - a) * 18;
    ctx.save();
    ctx.globalAlpha = a;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = rgba(C.stage, 0.82);
    ctx.fill();
    ctx.strokeStyle = rgba(toneColor(b.tone), b.tone === 'neutral' ? 0.35 : 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = toneColor(b.tone);
    ctx.fillRect(x + 10, y + 11, 6, 8);
    drawRich(ctx, b.text, x + 22, y + 20, s);
    ctx.restore();
    y += (h + 8) * a;
  }
}

export function drawLegend(ctx: CanvasRenderingContext2D, f: number): void {
  const a = smooth(ramp(f, 12, 36));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const x = 64;
  const y = 952;
  const items: [string, string][] = [
    [C.cyan, 'Primary pathway: water, protons, product gas'],
    [C.gold, 'Energy & actuation: DC power, electrons, heat, pumps'],
    [C.violet, 'Sensing & state change: sensors, gas formation'],
  ];
  let cx = x;
  for (const [col, label] of items) {
    ctx.fillStyle = col;
    ctx.fillRect(cx, y - 11, 22, 4);
    const w = drawRich(ctx, label, cx + 30, y, { size: 16, weight: 500, color: C.text });
    cx += w + 58;
  }
  drawRich(ctx, 'Explanatory overlays, not literal emission  ·  solid fill = hardware  ·  translucent contours = field  ·  grid panel = math', x, y + 28, {
    size: 13,
    family: MONO,
    color: rgba(C.muted, 0.95),
  });
  ctx.restore();
}

export function drawFooter(ctx: CanvasRenderingContext2D, f: number): void {
  drawRich(ctx, `${timecode(f)}   F ${String(f).padStart(4, '0')} / ${LAST_FRAME}   30 FPS`, 1856, 1062, {
    size: 14,
    family: MONO,
    color: rgba(C.muted, 0.95),
    align: 'right',
  });
  drawRich(
    ctx,
    'Generic PEM · not a certified engineering reference · mechanism: U.S. DOE HFTO · architecture: NREL TP-6A20-72740, TP-6A20-87625',
    64,
    1062,
    { size: 13, family: MONO, color: rgba(C.faint, 1) },
  );
  // chapter progress
  const x0 = 64;
  const x1 = 1856;
  const y = 1028;
  const gap = 8;
  const total = LAST_FRAME + 1;
  for (const ch of CHAPTERS) {
    const sx = x0 + ((x1 - x0) * ch.start) / total + gap / 2;
    const ex = x0 + ((x1 - x0) * (ch.end + 1)) / total - gap / 2;
    ctx.fillStyle = rgba(C.struct, 0.9);
    ctx.fillRect(sx, y, ex - sx, 3);
    const p = clamp((f - ch.start) / (ch.end - ch.start));
    if (p > 0) {
      ctx.fillStyle = f >= ch.start && f <= ch.end ? C.cyan : rgba(C.cyan, 0.45);
      ctx.fillRect(sx, y, (ex - sx) * p, 3);
    }
  }
}

export const LOCATOR = { x: 1856 - 230, y: 808, w: 230, h: 150 };

export const locatorAlpha = (cam: Camera, f: number): number => smooth(ramp(cam.z, 3.2, 5)) * smooth(ramp(f, 100, 120));

/** Locator inset: stack outline with the current viewport, keeps context during dives. */
export function drawLocator(ctx: CanvasRenderingContext2D, cam: Camera, f: number): void {
  const a = locatorAlpha(cam, f);
  if (a <= 0.01) return;
  const { w: W, h: H, x: X, y: Y0 } = LOCATOR;
  ctx.save();
  ctx.globalAlpha = a;
  roundRect(ctx, X, Y0, W, H, 8);
  ctx.fillStyle = rgba(C.stage, 0.85);
  ctx.fill();
  ctx.strokeStyle = rgba(C.bone, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();
  drawRich(ctx, 'LOCATOR', X + 12, Y0 + 20, { size: 12, family: MONO, color: rgba(C.muted, 1), letterSpacing: 1.5 });
  const b = STACK_BOUNDS;
  const s = Math.min((W - 24) / (b.x1 - b.x0), (H - 40) / (b.y1 - b.y0));
  const ox = X + W / 2 - ((b.x0 + b.x1) / 2) * s;
  const oy = Y0 + 28 + (H - 36) / 2 - ((b.y0 + b.y1) / 2) * s;
  const map = (x: number, y: number): [number, number] => [ox + x * s, oy + y * s];
  const [sx0, sy0] = map(-117, -150);
  const [sx1, sy1] = map(117, 150);
  ctx.strokeStyle = rgba(C.structHi, 1);
  ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
  for (let i = 0; i <= 6; i++) {
    const [lx] = map(-92 + i * 30, 0);
    ctx.beginPath();
    ctx.moveTo(lx, map(0, -128)[1]);
    ctx.lineTo(lx, map(0, 128)[1]);
    ctx.strokeStyle = rgba(C.struct, 1);
    ctx.stroke();
  }
  const v = viewRect(cam);
  const [vx0, vy0] = map(Math.max(v.x0, b.x0 - 40), Math.max(v.y0, b.y0 - 40));
  const [vx1, vy1] = map(Math.min(v.x1, b.x1 + 40), Math.min(v.y1, b.y1 + 40));
  const cw = Math.max(4, vx1 - vx0);
  const chh = Math.max(4, vy1 - vy0);
  const ccx = (vx0 + vx1) / 2;
  const ccy = (vy0 + vy1) / 2;
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ccx - cw / 2, ccy - chh / 2, cw, chh);
  ctx.restore();
}
