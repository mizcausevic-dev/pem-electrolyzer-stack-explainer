import { type Camera, worldToScreen } from '../engine/camera';
import { clamp, fade } from '../engine/math';
import { BOP, SENSORS } from './bop';
import { CC_L, CC_R, FOCUS_CELL, Y, cellX, layerX } from './geometry';
import { LOCATOR, locatorAlpha, roundRect } from './hud';
import { FOCUS_Y, type Cycle, cycle, electronAnodePos, h2Pos, o2Pos, protonPos, waterPos } from './micro';
import { C, rgba } from './palette';
import type { FrameState } from './state';
import { drawRich, measureRich } from './text';

type Tone = 'bone' | 'cyan' | 'gold' | 'violet';
type Pt = [number, number];
type Anchor = Pt | ((f: number, st: FrameState) => Pt | null);

export interface LabelSpec {
  text: string;
  sub?: string;
  /** World-space anchor (fixed or moving). Labels follow the camera through every move. */
  at: Anchor;
  /** Screen-space offset from the anchor to the label box. */
  off: Pt;
  win: [number, number, number, number];
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
}

interface BracketSpec {
  text: string;
  x0: number;
  x1: number;
  y: number;
  win: [number, number, number, number];
}

const toneColor = (t: Tone = 'bone') => (t === 'bone' ? C.bone : C[t]);
const mid = (k: Parameters<typeof layerX>[1], i = FOCUS_CELL) => {
  const [a, b] = layerX(i, k);
  return (a + b) / 2;
};

/* ---------------------------------------------------------- 01 · reveal */

const EXT: [number, number, number, number] = [12, 28, 80, 94];
const CELL: [number, number, number, number] = [112, 128, 158, 172];

const SCENE1: LabelSpec[] = [
  { text: 'End plate', sub: 'spreads the clamping load', at: [-106, 30], off: [-235, 0], win: EXT, align: 'right' },
  { text: 'Current collector', sub: 'carries DC into and out of the stack', at: [(CC_L[0] + CC_L[1]) / 2, 90], off: [-266, 40], win: EXT, align: 'right' },
  { text: 'Manifold ports', sub: 'feed and drain every cell in parallel', at: [-130, -105], off: [-175, 0], win: EXT, align: 'right' },
  { text: 'Repeating cells', sub: '6 shown · electrically in series', at: [30, -40], off: [330, 0], win: EXT, align: 'left' },
  { text: 'Tie rods', sub: 'compression holds seals and contact', at: [80, Y.rod], off: [205, -10], win: EXT, align: 'left' },
  { text: 'DC terminals', sub: '+ at the anode end, − at the cathode end', at: [(CC_R[0] + CC_R[1]) / 2, -170], off: [171, 92], win: EXT, align: 'left', tone: 'gold' },

  { text: 'Bipolar plate', sub: 'separates cells, conducts current', at: [mid('bpp'), -5], off: [-153, -148], win: CELL, align: 'center' },
  { text: 'Porous transport layer', sub: 'porous titanium, typical', at: [mid('ptl'), -5], off: [-98, -148], win: CELL, align: 'center' },
  { text: 'Membrane (PEM)', sub: 'solid polymer, passes H^+ only', at: [mid('mem'), -5], off: [87, -148], win: CELL, align: 'center' },
  { text: 'Gas diffusion layer', sub: 'porous carbon, typical', at: [mid('gdl'), -5], off: [277, -148], win: CELL, align: 'center' },
  { text: 'Anode flow channel', sub: 'water in, O_2 + water out', at: [mid('achan'), 5], off: [-146, 150], win: CELL, align: 'center', tone: 'cyan' },
  { text: 'Anode catalyst layer', sub: 'water splits here', at: [mid('acl'), 5], off: [-66, 150], win: CELL, align: 'center' },
  { text: 'Cathode catalyst layer', sub: 'H_2 forms here', at: [mid('ccl'), 5], off: [140, 150], win: CELL, align: 'center' },
  { text: 'Cathode flow channel', sub: 'H_2 out', at: [mid('cchan'), 5], off: [240, 150], win: CELL, align: 'center', tone: 'cyan' },
];

const BRACKETS: BracketSpec[] = [
  { text: 'CCM · catalyst-coated membrane', x0: layerX(FOCUS_CELL, 'acl')[0], x1: layerX(FOCUS_CELL, 'ccl')[1], y: -2.3, win: [120, 136, 158, 172] },
  { text: 'MEA · CCM + porous layers (usage varies)', x0: layerX(FOCUS_CELL, 'ptl')[0], x1: layerX(FOCUS_CELL, 'gdl')[1], y: 1.9, win: [126, 142, 158, 172] },
];

/* ---------------------------------------------------------- 02 · water feed */

const SCENE2: LabelSpec[] = [
  { text: 'Deionized water in', sub: 'anode inlet manifold', at: [-134, (Y.inManTop + Y.inManBot) / 2], off: [-6, -112], win: [180, 192, 226, 236], align: 'left', tone: 'cyan' },
  { text: 'Feeds every cell in parallel', sub: 'one manifold, many channels', at: [mid('achan', 3), (Y.inManTop + Y.inManBot) / 2], off: [0, -150], win: [194, 206, 228, 238], align: 'center', tone: 'cyan' },
  { text: 'Water rises in each anode channel', at: [mid('achan', 1), 64], off: [-200, 70], win: [202, 214, 230, 240], align: 'right', tone: 'cyan' },
  { text: 'Cathode channel: no liquid feed', sub: 'in this generic configuration', at: [mid('cchan', 1), 70], off: [120, 0], win: [208, 220, 230, 240], align: 'left' },
  { text: 'Porous transport layer wets', sub: 'water reaches the anode catalyst', at: [mid('ptl'), -30], off: [-260, 0], win: [262, 276, 296, 306], align: 'right', tone: 'cyan' },
];

/* ---------------------------------------------------------- 03 · gas evolution */

/** The molecular cycle followed by labels: the one whose event sits closest to the frame's vertical center. */
const TRACK: Cycle = [2, 3, 4, 5].map(cycle).reduce((best, c) => (Math.abs(c.ya - FOCUS_Y) < Math.abs(best.ya - FOCUS_Y) ? c : best));
const tA = TRACK.tA;

const pt = (p: { x: number; y: number } | null): Pt | null => (p ? [p.x, p.y] : null);

const MICRO_WIN: [number, number, number, number] = [362, 376, 434, 446];

const SCENE3: LabelSpec[] = [
  { text: 'e^− through the plates', sub: 'external circuit, cell to cell in series', at: [cellX(FOCUS_CELL) + 2, -34], off: [-200, 30], win: [310, 320, 336, 348], align: 'right', tone: 'gold' },
  { text: 'H^+ through the membrane', sub: 'anode to cathode', at: [mid('mem'), -23], off: [150, 120], win: [310, 320, 336, 348], align: 'left', tone: 'cyan' },

  { text: 'Anode catalyst layer', sub: 'catalyst particles in ionomer', at: [mid('acl'), -19], off: [0, -128], win: MICRO_WIN, align: 'center' },
  { text: 'Membrane (PEM)', sub: 'passes H^+ only', at: [mid('mem'), -19], off: [0, -128], win: MICRO_WIN, align: 'center' },
  { text: 'Cathode catalyst layer', sub: 'catalyst particles in ionomer', at: [mid('ccl'), -19], off: [0, -128], win: MICRO_WIN, align: 'center' },
  { text: 'Porous transport layer', sub: 'water-filled pores', at: [layerX(FOCUS_CELL, 'ptl')[1] - 1.0, -16.4], off: [-60, 62], win: MICRO_WIN, align: 'left' },
  { text: 'Gas diffusion layer', sub: 'carries H_2 to the channel', at: [mid('gdl') - 1.0, -16.4], off: [0, 62], win: MICRO_WIN, align: 'center' },

  { text: '2 H_2O', at: (f) => pt(waterPos(TRACK, 0, f)), off: [-30, -70], win: [tA - 18, tA - 12, tA - 3, tA + 2], align: 'right', tone: 'cyan' },
  { text: 'O_2 forms (gas)', at: (f) => pt(o2Pos(TRACK, f)), off: [-30, -70], win: [tA + 4, tA + 10, tA + 40, tA + 50], align: 'right', tone: 'violet' },
  {
    text: '4 H^+ -> cathode',
    at: (f) => {
      const ps = [0, 1, 2, 3].map((m) => protonPos(TRACK, m, f)).filter((p) => p !== null);
      if (!ps.length) return null;
      return [ps.reduce((s, p) => s + p.x, 0) / ps.length, ps.reduce((s, p) => s + p.y, 0) / ps.length];
    },
    off: [30, -70],
    win: [tA + 4, tA + 10, tA + 26, tA + 32],
    align: 'left',
    tone: 'cyan',
  },
  { text: '4 e^− -> external circuit', at: (f) => pt(electronAnodePos(TRACK, 0, f)), off: [-30, 70], win: [tA + 4, tA + 10, tA + 18, tA + 24], align: 'right', tone: 'gold' },
  { text: '2 H_2 forms (gas)', at: (f) => pt(h2Pos(TRACK, 0, f)), off: [30, 70], win: [tA + 32, tA + 38, tA + 56, tA + 64], align: 'left', tone: 'violet' },

  { text: 'O_2 + water -> anode outlet manifold', sub: 'exits through the anode outlet port', at: [-75, (Y.outManTop + Y.outManBot) / 2], off: [0, 120], win: [484, 496, 522, 534], align: 'center', tone: 'cyan' },
  { text: 'H_2 -> hydrogen manifold', sub: 'hidden lines: behind the section plane', at: [10, (Y.h2ManTop + Y.h2ManBot) / 2], off: [0, 100], win: [484, 496, 522, 534], align: 'center', tone: 'cyan' },
  { text: 'About 2 H_2 bubbles per O_2 bubble', sub: '2 : 1 molar ratio · sizes and counts schematic', at: [mid('cchan', 1), -70], off: [0, 70], win: [490, 502, 522, 534], align: 'center', tone: 'violet' },
];

/* ---------------------------------------------------------- 04 · cooling */

const COOL: [number, number, number, number] = [586, 600, 646, 660];
const LOOP: [number, number, number, number] = [712, 726, 766, 780];

const SCENE4: LabelSpec[] = [
  { text: 'T_{out} > T_{in}', sub: 'water leaves warmer, carrying heat', at: [-137, (Y.outManTop + Y.outManBot) / 2], off: [-40, 0], win: COOL, align: 'right', tone: 'violet' },
  { text: 'Heat from cell losses', sub: 'concentrated in each MEA', at: [cellX(0) + 17.2, -10], off: [-190, 0], win: COOL, align: 'right', tone: 'gold' },
  { text: 'T_{in}', sub: 'cooler water enters', at: [-137, (Y.inManTop + Y.inManBot) / 2], off: [-40, 0], win: COOL, align: 'right', tone: 'violet' },

  { text: 'Water tank + O_2 separation', at: [-440, BOP.tank.y0], off: [0, -50], win: LOOP, align: 'center', tone: 'cyan' },
  { text: 'Circulation pump', at: [BOP.pump.x - BOP.pump.r, BOP.pump.y], off: [-40, 0], win: LOOP, align: 'right', tone: 'gold' },
  { text: 'Heat exchanger', sub: 'rejects heat to air or a cooling circuit', at: [(BOP.hx.x0 + BOP.hx.x1) / 2, BOP.hx.y1], off: [0, 50], win: LOOP, align: 'center', tone: 'gold' },
  { text: 'Stack outlet temperature (TT)', at: [SENSORS[0].x, SENSORS[0].y - 27], off: [0, -50], win: LOOP, align: 'center', tone: 'violet' },
  { text: 'Cooled water back to the stack', at: [-165, 150], off: [60, 50], win: LOOP, align: 'left', tone: 'cyan' },
];

/* ---------------------------------------------------------- 05 · balance of plant */

const from = (start: number): [number, number, number, number] => [start, start + 14, Infinity, Infinity];

const SCENE5: LabelSpec[] = [
  { text: 'PEM stack', sub: '6 cells shown; real stacks vary', at: [0, 150], off: [0, 44], win: from(770), align: 'center' },

  { text: 'AC supply', at: [BOP.ac.x, BOP.ac.y - 22], off: [0, -24], win: from(792), align: 'center', tone: 'gold' },
  { text: 'Transformer + rectifier', sub: 'AC -> DC', at: [(BOP.rect.x0 + BOP.rect.x1) / 2, BOP.rect.y1], off: [0, 36], win: from(796), align: 'center', tone: 'gold' },
  { text: 'DC bus to the stack', at: [20, -272], off: [0, -30], win: from(800), align: 'center', tone: 'gold' },

  { text: 'Feed water', at: [BOP.feed.x, -40], off: [-18, -40], win: from(828), align: 'left', tone: 'cyan' },
  { text: 'Carbon filter + deionizer', at: [(BOP.di.x0 + BOP.di.x1) / 2, BOP.di.y1], off: [0, 36], win: from(832), align: 'center', tone: 'cyan' },
  { text: 'Water tank + O_2 separation', at: [-470, BOP.tank.y0], off: [-20, -44], win: from(836), align: 'right', tone: 'cyan' },
  { text: 'O_2 vent (or capture)', at: [-440, -178], off: [-18, -16], win: from(840), align: 'right', tone: 'cyan' },
  { text: 'Circulation pump', at: [BOP.pump.x - BOP.pump.r, BOP.pump.y], off: [-16, 0], win: from(844), align: 'right', tone: 'gold' },
  { text: 'Heat exchanger', at: [(BOP.hx.x0 + BOP.hx.x1) / 2, BOP.hx.y1], off: [0, 32], win: from(848), align: 'center', tone: 'gold' },

  { text: 'H_2 / water separator', at: [380, BOP.sep.y1], off: [20, 30], win: from(876), align: 'left', tone: 'cyan' },
  { text: 'H_2 dryer', at: [(BOP.dryer.x0 + BOP.dryer.x1) / 2, BOP.dryer.y0], off: [0, -30], win: from(880), align: 'center', tone: 'cyan' },
  { text: 'H_2 product', sub: 'to compression, storage, or use', at: [BOP.h2out.x + 10, -60], off: [0, -44], win: from(886), align: 'right', tone: 'cyan' },
  { text: 'Recovered water (route simplified)', at: [-80, 300], off: [0, -26], win: from(890), align: 'center', tone: 'cyan' },

  { text: 'Controls + safety logic', sub: 'TT temperature · PT pressure · LT level · AT water quality', at: [(BOP.ctrl.x0 + BOP.ctrl.x1) / 2, BOP.ctrl.y1], off: [-40, 40], win: from(916), align: 'center', tone: 'violet' },
];

export const LABELS: LabelSpec[] = [...SCENE1, ...SCENE2, ...SCENE3, ...SCENE4, ...SCENE5];

/* ---------------------------------------------------------- drawing */

const TITLE = { size: 19, weight: 600, color: C.bone };
const SUB = { size: 14.5, weight: 400, color: C.muted };

/** Fades a label box as it slides under the header, badges, legend/footer band, or locator inset. */
function safeArea(cam: Camera, f: number, x0: number, y0: number, w: number, h: number, lh: number): number {
  const x1 = x0 + w;
  const y1 = y0 + h;
  let pen = Math.max(0, y1 - (lh - 150));
  if (x0 < 1090 || x1 > 1520) pen = Math.max(pen, 204 - y0);
  const loc = locatorAlpha(cam, f);
  if (loc > 0.01) {
    const g = 12;
    const depth = Math.min(x1 - (LOCATOR.x - g), LOCATOR.x + LOCATOR.w + g - x0, y1 - (LOCATOR.y - g), LOCATOR.y + LOCATOR.h + g - y0);
    if (depth > 0) pen = Math.max(pen, depth * loc);
  }
  return clamp(1 - pen / 28);
}

function drawLabel(ctx: CanvasRenderingContext2D, cam: Camera, f: number, st: FrameState, L: LabelSpec, lw: number, lh: number, safe = true): void {
  const a = fade(f, ...L.win);
  if (a <= 0.01) return;
  const p = typeof L.at === 'function' ? L.at(f, st) : L.at;
  if (!p) return;
  const [sx, sy] = worldToScreen(cam, p[0], p[1], lw, lh);
  const margin = 12;
  const inside = clamp(Math.min(sx + margin, lw + margin - sx, sy + margin, lh + margin - sy) / 40);
  if (a * inside <= 0.01) return;

  const tone = toneColor(L.tone);
  const tw = measureRich(ctx, L.text, TITLE);
  const sw = L.sub ? measureRich(ctx, L.sub, SUB) : 0;
  const padL = 18;
  const padR = 12;
  const w = Math.max(tw, sw) + padL + padR;
  const h = L.sub ? 54 : 34;
  const slide = (1 - a) * 8;
  const bx = sx + L.off[0] + Math.sign(L.off[0]) * slide;
  const by = sy + L.off[1] + Math.sign(L.off[1]) * slide;
  const align = L.align ?? 'left';
  const x0 = clamp(align === 'left' ? bx : align === 'right' ? bx - w : bx - w / 2, 24, lw - 24 - w);
  const y0 = by - h / 2;

  const alpha = a * inside * (safe ? safeArea(cam, f, x0, y0, w, h, lh) : 1);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  const nx = clamp(sx, x0, x0 + w);
  const ny = clamp(sy, y0, y0 + h);
  if (Math.hypot(nx - sx, ny - sy) > 6) {
    ctx.strokeStyle = rgba(tone, L.tone && L.tone !== 'bone' ? 0.75 : 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  }
  ctx.fillStyle = rgba(C.stage, 0.9);
  ctx.beginPath();
  ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();

  roundRect(ctx, x0, y0, w, h, 6);
  ctx.fillStyle = rgba(C.stage, 0.86);
  ctx.fill();
  ctx.strokeStyle = rgba(tone, L.tone && L.tone !== 'bone' ? 0.45 : 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = tone;
  ctx.fillRect(x0 + 7, y0 + 9, 3, h - 18);
  drawRich(ctx, L.text, x0 + padL, y0 + (L.sub ? 24 : 23), TITLE);
  if (L.sub) drawRich(ctx, L.sub, x0 + padL, y0 + 44, SUB);
  ctx.restore();
}

function drawBracket(ctx: CanvasRenderingContext2D, cam: Camera, f: number, B: BracketSpec, lw: number, lh: number): void {
  const a = fade(f, ...B.win);
  if (a <= 0.01) return;
  const [x0, y] = worldToScreen(cam, B.x0, B.y, lw, lh);
  const [x1] = worldToScreen(cam, B.x1, B.y, lw, lh);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = rgba(C.bone, 0.85);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y - 8);
  ctx.lineTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.lineTo(x1, y - 8);
  ctx.stroke();
  const style = { size: 15, weight: 600, color: C.bone };
  const tw = measureRich(ctx, B.text, style) + 20;
  const cx = (x0 + x1) / 2;
  roundRect(ctx, cx - tw / 2, y + 6, tw, 26, 13);
  ctx.fillStyle = rgba(C.stage, 0.9);
  ctx.fill();
  ctx.strokeStyle = rgba(C.bone, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  drawRich(ctx, B.text, cx, y + 24, { ...style, align: 'center' });
  ctx.restore();
}

export function drawLabels(ctx: CanvasRenderingContext2D, cam: Camera, f: number, st: FrameState, lw: number, lh: number): void {
  for (const B of BRACKETS) drawBracket(ctx, cam, f, B, lw, lh);
  for (const L of LABELS) drawLabel(ctx, cam, f, st, L, lw, lh);
}

const ALWAYS: [number, number, number, number] = [-2, -1, Infinity, Infinity];

/** Static callouts for the hero image: no video HUD, so no safe-area fade. */
export const HERO_CALLOUTS: LabelSpec[] = [
  { text: 'Outlet manifolds', sub: 'O_2 + water in front · H_2 behind the section plane', at: [8, -105], off: [-36, 84], win: ALWAYS, align: 'right', tone: 'cyan' },
  { text: 'Anode channel', sub: 'water in, O_2 + water out', at: [mid('achan', 1), -58], off: [-22, 112], win: ALWAYS, align: 'right', tone: 'cyan' },
  { text: 'Membrane (PEM)', sub: 'passes H^+ only', at: [mid('mem', 1), -58], off: [0, 192], win: ALWAYS, align: 'center' },
  { text: 'Cathode channel', sub: 'H_2 out', at: [mid('cchan', 1), -58], off: [22, 112], win: ALWAYS, align: 'left', tone: 'cyan' },
];

/** Draws callouts `k`× larger while keeping every anchor pinned to its world point. */
export function drawCallouts(ctx: CanvasRenderingContext2D, cam: Camera, f: number, st: FrameState, specs: LabelSpec[], lw: number, lh: number, k = 1): void {
  ctx.save();
  ctx.scale(k, k);
  const scaled = { ...cam, z: cam.z / k };
  for (const L of specs) drawLabel(ctx, scaled, f, st, L, lw / k, lh / k, false);
  ctx.restore();
}
