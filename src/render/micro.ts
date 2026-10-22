import { outCubic } from '../engine/easing';
import { clamp, lerp } from '../engine/math';
import { hash, shash } from '../engine/rng';
import { FOCUS_CELL, layerX } from './geometry';
import { C, rgba } from './palette';
import { type W, circle, hit, lod } from './world';

/**
 * Molecular-scale view of the anode catalyst / membrane / cathode catalyst
 * interface. Explicitly SCHEMATIC: particle sizes, spacing, and timing are
 * illustrative, not measured. Each reaction cycle follows the DOE
 * half-reactions: 2H2O -> O2 + 4H+ + 4e-  and  4H+ + 4e- -> 2H2.
 */
export const FOCUS_Y = -18;
export const MICRO_CYCLES = 9;
export const CYCLE_T0 = 338;
export const CYCLE_GAP = 12;

const ACL = layerX(FOCUS_CELL, 'acl');
const MEM = layerX(FOCUS_CELL, 'mem');
const CCL = layerX(FOCUS_CELL, 'ccl');
const PTL = layerX(FOCUS_CELL, 'ptl');
const GDL = layerX(FOCUS_CELL, 'gdl');

const REGION = { x0: PTL[0], x1: GDL[1], y0: FOCUS_Y - 22, y1: FOCUS_Y + 22 };

export interface Cycle {
  k: number;
  t0: number;
  tA: number;
  xa: number;
  ya: number;
  xc: [number, number];
  yc: [number, number];
}

export function cycle(k: number): Cycle {
  const ya = FOCUS_Y + 2.6 * shash(k, 2, 7);
  const t0 = CYCLE_T0 + CYCLE_GAP * k;
  return {
    k,
    t0,
    tA: t0 + 14,
    xa: (ACL[0] + ACL[1]) / 2 + 0.3 * shash(k, 1, 7),
    ya,
    xc: [(CCL[0] + CCL[1]) / 2 + 0.25 * shash(k, 3, 7), (CCL[0] + CCL[1]) / 2 + 0.25 * shash(k, 4, 7)],
    yc: [ya - 0.65 + 0.3 * shash(k, 5, 7), ya + 0.65 + 0.3 * shash(k, 6, 7)],
  };
}

type Pt = { x: number; y: number; a: number };

export function waterPos(c: Cycle, j: number, f: number): Pt | null {
  if (f < c.t0 - 6 || f >= c.tA) return null;
  const t = outCubic(clamp((f - c.t0) / 14));
  const sx = PTL[1] - 0.9 - 0.5 * hash(c.k, j, 51);
  const sy = c.ya + (j ? 0.75 : -0.75);
  return { x: lerp(sx, c.xa - 0.18, t), y: lerp(sy, c.ya + (j ? 0.18 : -0.18), t), a: clamp((f - c.t0 + 6) / 6) };
}

export function o2Pos(c: Cycle, f: number): (Pt & { r: number }) | null {
  const a = f - c.tA;
  if (a < 0 || a > 62) return null;
  return {
    x: c.xa - 0.25 - 1.7 * (1 - Math.exp(-a / 25)),
    y: c.ya + 0.25 * Math.sin(a * 0.1 + c.k),
    r: 0.1 + 0.24 * (1 - Math.exp(-a / 15)),
    a: 1 - clamp((a - 44) / 18),
  };
}

export function protonPos(c: Cycle, m: number, f: number): Pt | null {
  const s = c.tA + 2 * m;
  const t = (f - s) / 26;
  if (t < 0 || t > 1) return null;
  const j = m % 2;
  const y0 = c.ya + 0.15 * shash(c.k, m, 8);
  return {
    x: lerp(c.xa + 0.12, c.xc[j] - 0.12, t),
    y: lerp(y0, c.yc[j], t) + 0.14 * Math.sin(t * Math.PI * 3 + m),
    a: 1,
  };
}

export function electronAnodePos(c: Cycle, m: number, f: number): Pt | null {
  const s = c.tA + 2 * m;
  const t = (f - s) / 24;
  if (t < 0 || t > 1) return null;
  const y = c.ya + 0.25 * shash(c.k, m, 9);
  return { x: lerp(c.xa - 0.1, PTL[0] + 0.6, t), y: y + 0.12 * Math.sin(t * 9 + m), a: 1 - clamp((t - 0.85) / 0.15) };
}

export function electronCathodePos(c: Cycle, m: number, f: number): Pt | null {
  const s = c.tA + 4 + 2 * m;
  const t = (f - s) / 22;
  if (t < 0 || t > 1) return null;
  const j = m % 2;
  return { x: lerp(GDL[1] - 0.4, c.xc[j] + 0.12, t), y: lerp(c.yc[j] + 0.3 * shash(c.k, m, 10), c.yc[j], t), a: clamp(t / 0.12) };
}

export const cathodeEventT = (c: Cycle, j: number): number => c.tA + 30 + 4 * j;

export function h2Pos(c: Cycle, j: number, f: number): (Pt & { r: number }) | null {
  const a = f - cathodeEventT(c, j);
  if (a < 0 || a > 56) return null;
  return {
    x: c.xc[j] + 0.22 + 1.6 * (1 - Math.exp(-a / 25)),
    y: c.yc[j] + 0.2 * Math.sin(a * 0.12 + j),
    r: 0.08 + 0.18 * (1 - Math.exp(-a / 15)),
    a: 1 - clamp((a - 40) / 16),
  };
}

/** Reaction activity in [0, 1] for highlighting equation lines. */
export function reactionActivity(f: number): { anode: number; cathode: number } {
  let anode = 0;
  let cathode = 0;
  for (let k = 0; k < MICRO_CYCLES; k++) {
    const c = cycle(k);
    anode = Math.max(anode, 1 - clamp(Math.abs(f - c.tA) / 10));
    for (const j of [0, 1]) cathode = Math.max(cathode, 1 - clamp(Math.abs(f - cathodeEventT(c, j)) / 10));
  }
  return { anode, cathode };
}

/* ------------------------------------------------------------------ drawing */

function water(w: W, x: number, y: number, rot: number, alpha: number): void {
  const ang = (104.5 / 2) * (Math.PI / 180);
  const d = 0.13;
  for (const s of [-1, 1]) {
    circle(w, x + Math.cos(rot + s * ang) * d, y + Math.sin(rot + s * ang) * d, 0.065, rgba(C.bone, 0.55 * alpha), rgba(C.stage, 0.8 * alpha), 1);
  }
  circle(w, x, y, 0.11, rgba(C.bone, 0.9 * alpha), rgba(C.stage, 0.8 * alpha), 1);
}

function gasBubble(w: W, x: number, y: number, r: number, alpha: number, atomR: number): void {
  circle(w, x, y, r, rgba(C.bone, 0.06 * alpha), rgba(C.cyan, 0.9 * alpha), 1.4);
  circle(w, x - atomR * 0.75, y, atomR, rgba(C.bone, 0.85 * alpha));
  circle(w, x + atomR * 0.75, y, atomR, rgba(C.bone, 0.85 * alpha));
}

function ring(w: W, x: number, y: number, t: number, base: number): void {
  if (t < 0 || t > 1) return;
  circle(w, x, y, base + 0.5 * t, undefined, rgba(C.violet, 0.9 * (1 - t)), 2);
}

export function drawMicro(w: W): void {
  const m = lod(w, 40, 95);
  if (m < 0.01 || !hit(w, REGION.x0, REGION.y0, REGION.x1, REGION.y1)) return;
  const ctx = w.ctx;
  const { f } = w;
  ctx.save();
  ctx.globalAlpha = m;
  ctx.beginPath();
  ctx.rect(REGION.x0, REGION.y0, REGION.x1 - REGION.x0, REGION.y1 - REGION.y0);
  ctx.clip();

  const vy0 = Math.max(REGION.y0, w.view.y0);
  const vy1 = Math.min(REGION.y1, w.view.y1);

  // catalyst layer microstructure: ionomer film around catalyst particles
  for (const [x0, x1, seed, rr] of [[ACL[0], ACL[1], 61, 0.085], [CCL[0], CCL[1], 62, 0.07]] as const) {
    ctx.fillStyle = '#1B2028';
    ctx.fillRect(x0, vy0, x1 - x0, vy1 - vy0);
    const S = 0.2;
    ctx.beginPath();
    for (let gx = Math.floor(x0 / S); gx <= Math.ceil(x1 / S); gx++) {
      for (let gy = Math.floor(vy0 / S) - 1; gy <= Math.ceil(vy1 / S) + 1; gy++) {
        const cx = gx * S + 0.07 * shash(gx, gy, seed);
        const cy = gy * S + 0.07 * shash(gx, gy, seed + 1);
        const r = rr * (0.7 + 0.5 * hash(gx, gy, seed + 2));
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = '#3A404B';
    ctx.fill();
    ctx.strokeStyle = rgba(C.membrane, 0.35);
    ctx.lineWidth = 1 * w.px;
    ctx.stroke();
  }

  // membrane: schematic polymer chains
  ctx.strokeStyle = rgba(C.bone, 0.13);
  ctx.lineWidth = 1 * w.px;
  ctx.beginPath();
  for (let y = Math.floor(vy0 / 0.32) * 0.32; y < vy1; y += 0.32) {
    for (let x = MEM[0]; x <= MEM[1] + 0.01; x += 0.08) {
      const yy = y + 0.05 * Math.sin(x * 9 + y * 3);
      if (x === MEM[0]) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
  }
  ctx.stroke();

  for (let k = 0; k < MICRO_CYCLES; k++) {
    const c = cycle(k);
    for (const j of [0, 1]) {
      const p = waterPos(c, j, f);
      if (p) water(w, p.x, p.y, Math.PI / 2 + (j ? 0.4 : -0.4) + 0.1 * Math.sin(f * 0.2 + k), p.a);
    }
    ring(w, c.xa, c.ya, (f - c.tA) / 14, 0.08);
    const o2 = o2Pos(c, f);
    if (o2) gasBubble(w, o2.x, o2.y, o2.r, o2.a, 0.07);
    for (let mm = 0; mm < 4; mm++) {
      const p = protonPos(c, mm, f);
      if (p) {
        circle(w, p.x, p.y, 0.075, rgba(C.cyan, 0.95), rgba(C.stage, 0.6), 1);
        const s = 0.04;
        ctx.strokeStyle = C.stage;
        ctx.lineWidth = 1.6 * w.px;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      }
      const ea = electronAnodePos(c, mm, f);
      if (ea) {
        circle(w, ea.x, ea.y, 0.11, rgba(C.gold, 0.18 * ea.a));
        circle(w, ea.x, ea.y, 0.05, rgba(C.gold, ea.a));
      }
      const ec = electronCathodePos(c, mm, f);
      if (ec) {
        circle(w, ec.x, ec.y, 0.11, rgba(C.gold, 0.18 * ec.a));
        circle(w, ec.x, ec.y, 0.05, rgba(C.gold, ec.a));
      }
    }
    for (const j of [0, 1]) {
      ring(w, c.xc[j], c.yc[j], (f - cathodeEventT(c, j)) / 14, 0.07);
      const h2 = h2Pos(c, j, f);
      if (h2) gasBubble(w, h2.x, h2.y, h2.r, h2.a, 0.05);
    }
  }
  ctx.restore();
}
