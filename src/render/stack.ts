import { clamp, mod, ramp, smooth } from '../engine/math';
import { hash, shash } from '../engine/rng';
import { CC_L, CC_R, CELL_W, END_L, END_R, LAST_PLATE, N_CELLS, X0, Y, cellX, layerX } from './geometry';
import { C, mix, rgba } from './palette';
import { T_GAS } from './state';
import { type W, arrowHead, box, chevron, circle, hatch, hit, line, lod, outline } from './world';

type Band = [number, number];
const OUT: Band = [Y.outManTop, Y.outManBot];
const IN: Band = [Y.inManTop, Y.inManBot];

export function drawStack(w: W): void {
  const { st, ctx } = w;
  if (st.depth > 0.002) drawDepth(w, st.depth);
  const sy = st.sweepY;
  if (sy < Y.endBot + 12) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-500, sy, 1000, 800);
    ctx.clip();
    drawExterior(w);
    ctx.restore();
  }
  if (sy > Y.endTop - 12) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-500, -800, 1000, sy + 800);
    ctx.clip();
    drawSection(w);
    ctx.restore();
  }
  drawHardwareOverlays(w);
  if (st.sweepActive) drawSweepLine(w, sy);
}

/* ------------------------------------------------------------------ exterior */

function metalGrad(w: W, y0: number, y1: number, hi: string, lo: string): CanvasGradient {
  const g = w.ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, hi);
  g.addColorStop(0.45, lo);
  g.addColorStop(1, mix(lo, '#000000', 0.25));
  return g;
}

function drawExterior(w: W): void {
  box(w, END_L[0], Y.endTop, END_L[1], Y.endBot, metalGrad(w, Y.endTop, Y.endBot, C.steelHi, C.steel));
  box(w, END_R[0], Y.endTop, END_R[1], Y.endBot, metalGrad(w, Y.endTop, Y.endBot, C.steelHi, C.steel));
  outline(w, END_L[0], Y.endTop, END_L[1], Y.endBot, C.structLo, 1);
  outline(w, END_R[0], Y.endTop, END_R[1], Y.endBot, C.structLo, 1);
  for (const cc of [CC_L, CC_R]) {
    box(w, cc[0], Y.plateTop, cc[1], Y.plateBot, metalGrad(w, Y.plateTop, Y.plateBot, C.copper, C.copperLo));
  }
  for (let i = 0; i < N_CELLS; i++) {
    const x = cellX(i);
    box(w, x, Y.plateTop, x + 4, Y.plateBot, metalGrad(w, Y.plateTop, Y.plateBot, C.titanium, C.steel));
    box(w, x + 4, Y.plateTop, x + CELL_W, Y.plateBot, metalGrad(w, Y.plateTop, Y.plateBot, C.frameHi, C.frame));
    line(w, [[x + 17.2, Y.plateTop + 6], [x + 17.2, Y.plateBot - 6]], rgba(C.bone, 0.08), 1);
    outline(w, x, Y.plateTop, x + CELL_W, Y.plateBot, rgba('#000000', 0.35), 0.8);
  }
  box(w, LAST_PLATE[0], Y.plateTop, LAST_PLATE[1], Y.plateBot, metalGrad(w, Y.plateTop, Y.plateBot, C.titanium, C.steel));
  // bolt heads on end plates
  for (const ex of [END_L, END_R]) {
    for (const by of [-118, -40, 40, 118]) {
      circle(w, (ex[0] + ex[1]) / 2, by, 3.4, C.steelLo, rgba(C.bone, 0.18), 1);
    }
  }
}

function poly(w: W, pts: [number, number][], fill: string, stroke?: string): void {
  const ctx = w.ctx;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8 * w.px;
    ctx.stroke();
  }
}

function drawDepth(w: W, D: number): void {
  const dx = 48 * D;
  const dy = -32 * D;
  const top = (x0: number, x1: number, y: number, fill: string) =>
    poly(w, [[x0, y], [x1, y], [x1 + dx, y + dy], [x0 + dx, y + dy]], fill, rgba('#000000', 0.3));

  for (const ry of [-Y.rod, Y.rod]) {
    line(w, [[-128 + dx, ry + dy], [128 + dx, ry + dy]], rgba(C.steelHi, 0.6 * D), 5);
  }
  top(END_L[0], END_L[1], Y.endTop, C.steelHi);
  poly(w, [[END_L[1], Y.endTop], [END_L[1] + dx, Y.endTop + dy], [END_L[1] + dx, Y.endBot + dy], [END_L[1], Y.endBot]], C.steelLo);
  top(CC_L[0], CC_L[1], Y.plateTop, C.copper);
  for (let i = 0; i < N_CELLS; i++) {
    const x = cellX(i);
    top(x, x + 4, Y.plateTop, mix(C.titanium, C.bone, 0.15));
    top(x + 4, x + CELL_W, Y.plateTop, C.frameHi);
  }
  top(LAST_PLATE[0], LAST_PLATE[1], Y.plateTop, mix(C.titanium, C.bone, 0.15));
  top(CC_R[0], CC_R[1], Y.plateTop, C.copper);
  top(END_R[0], END_R[1], Y.endTop, C.steelHi);
  poly(w, [[END_R[1], Y.endTop], [END_R[1] + dx, Y.endTop + dy], [END_R[1] + dx, Y.endBot + dy], [END_R[1], Y.endBot]], C.steelLo, rgba('#000000', 0.3));
}

/* ------------------------------------------------------------------- section */

/** Cut metal: fill + 45° hatch, skipping manifold bands that pass through it. */
function metalCut(w: W, x0: number, x1: number, y0: number, y1: number, gaps: Band[], tone: 'steel' | 'ti' | 'cu'): void {
  const fill = tone === 'cu' ? C.copperLo : tone === 'ti' ? mix(C.titaniumLo, C.steel, 0.4) : C.steelLo;
  const hatchColor = tone === 'cu' ? rgba(C.copper, 0.9) : rgba(C.steelHi, 0.95);
  let cur = y0;
  const segs: Band[] = [];
  for (const g of gaps) {
    if (g[0] > cur) segs.push([cur, g[0]]);
    cur = g[1];
  }
  if (cur < y1) segs.push([cur, y1]);
  for (const [a, b] of segs) {
    box(w, x0, a, x1, b, fill);
    hatch(w, x0, a, x1, b, hatchColor, { spacingPx: 6, lwPx: 0.75, alpha: 0.75 });
    outline(w, x0, a, x1, b, rgba('#000000', 0.45), 0.8);
  }
}

function polymer(w: W, x0: number, y0: number, x1: number, y1: number, tone: string = C.frame): void {
  box(w, x0, y0, x1, y1, tone);
  hatch(w, x0, y0, x1, y1, rgba(C.frameHi, 0.9), { spacingPx: 11, lwPx: 0.6, alpha: 0.6 });
  hatch(w, x0, y0, x1, y1, rgba(C.frameHi, 0.9), { spacingPx: 11, lwPx: 0.6, dir: -1, alpha: 0.6 });
}

function drawSection(w: W): void {
  const { st } = w;
  metalCut(w, END_L[0], END_L[1], Y.endTop, Y.endBot, [OUT, IN], 'steel');
  metalCut(w, END_R[0], END_R[1], Y.endTop, Y.endBot, [], 'steel');
  metalCut(w, CC_L[0], CC_L[1], Y.plateTop, Y.plateBot, [OUT, IN], 'cu');
  metalCut(w, CC_R[0], CC_R[1], Y.plateTop, Y.plateBot, [], 'cu');

  for (const b of [OUT, IN]) box(w, END_L[0], b[0], LAST_PLATE[1], b[1], C.void);

  const tex = lod(w, 5, 9);
  const porous = tex * (1 - 0.6 * lod(w, 60, 120));
  for (let i = 0; i < N_CELLS; i++) {
    const x = cellX(i);
    if (!hit(w, x - 1, Y.plateTop, x + CELL_W + 1, Y.plateBot)) continue;
    metalCut(w, x, x + 4, Y.plateTop, Y.plateBot, [OUT, IN], 'ti');
    polymer(w, x + 4, Y.plateTop, x + CELL_W, OUT[0]);
    polymer(w, x + 4, IN[1], x + CELL_W, Y.plateBot);
    for (const [s0, s1] of [[Y.sealTop, Y.activeTop], [Y.activeBot, Y.sealBot]] as Band[]) {
      polymer(w, x + 9.5, s0, x + 15.9, s1, C.rubber);
      polymer(w, x + 18.5, s0, x + CELL_W, s1, C.rubber);
    }
    box(w, x + 4, Y.sealTop, x + 9.5, Y.sealBot, C.void);
    box(w, x + 24.5, Y.activeTop, x + CELL_W, Y.activeBot, C.void);

    // porous transport layer (anode): sintered metal look; pores tinted when wet
    const [p0, p1] = layerX(i, 'ptl');
    box(w, p0, Y.activeTop, p1, Y.activeBot, mix(C.titaniumLo, C.void, 0.55));
    const front = st.chanFront[i];
    const wet = st.ptlWet[i];
    if (front < Y.sealBot) {
      const wy0 = Math.max(front, Y.activeTop);
      box(w, p0, wy0, p0 + (p1 - p0) * Math.max(wet, 0.02), Y.activeBot, rgba(C.cyan, 0.2));
    }
    if (porous > 0.01) ptlTexture(w, p0, Y.activeTop, p1, Y.activeBot, porous);

    const [a0, a1] = layerX(i, 'acl');
    const [m0, m1] = layerX(i, 'mem');
    const [c0, c1] = layerX(i, 'ccl');
    const [g0, g1] = layerX(i, 'gdl');
    box(w, a0, Y.activeTop, a1, Y.activeBot, C.catalyst);
    box(w, c0, Y.activeTop, c1, Y.activeBot, C.catalyst);
    const mg = w.ctx.createLinearGradient(m0, 0, m1, 0);
    mg.addColorStop(0, mix(C.membrane, C.stage, 0.35));
    mg.addColorStop(0.5, mix(C.membrane, C.bone, 0.08));
    mg.addColorStop(1, mix(C.membrane, C.stage, 0.35));
    box(w, m0, Y.sealTop, m1, Y.sealBot, mg);
    box(w, g0, Y.activeTop, g1, Y.activeBot, C.carbon);
    if (tex > 0.01) {
      clTexture(w, a0, Y.activeTop, a1, Y.activeBot, tex * (1 - lod(w, 45, 80)));
      clTexture(w, c0, Y.activeTop, c1, Y.activeBot, tex * (1 - lod(w, 45, 80)));
      gdlTexture(w, g0, Y.activeTop, g1, Y.activeBot, porous);
    }
    for (const xb of [x + 4, p0, p1, a1, m1, c1, g1, x + CELL_W]) {
      line(w, [[xb, Y.activeTop], [xb, Y.activeBot]], rgba('#000000', 0.5), 0.8);
    }
    // hidden riser from the cathode channel to the H2 manifold (outside the section plane)
    line(w, [[x + 25.6, Y.activeTop], [x + 25.6, Y.h2ManBot]], rgba(C.bone, 0.38), 1, [5, 4]);
    line(w, [[x + 28.9, Y.activeTop], [x + 28.9, Y.h2ManBot]], rgba(C.bone, 0.38), 1, [5, 4]);
  }
  metalCut(w, LAST_PLATE[0], LAST_PLATE[1], Y.plateTop, Y.plateBot, [OUT, IN], 'ti');

  // H2 outlet manifold: hidden lines (dashed) because it sits outside the cut plane
  const h2 = w.ctx;
  h2.save();
  if (st.gas > 0) box(w, X0, Y.h2ManTop, END_R[1], Y.h2ManBot, rgba(C.cyan, 0.05 * st.gas));
  line(w, [[X0, Y.h2ManTop], [END_R[1], Y.h2ManTop]], rgba(C.bone, 0.5), 1, [6, 4]);
  line(w, [[X0, Y.h2ManBot], [END_R[1], Y.h2ManBot]], rgba(C.bone, 0.5), 1, [6, 4]);
  line(w, [[X0, Y.h2ManTop], [X0, Y.h2ManBot]], rgba(C.bone, 0.5), 1, [3, 3]);
  h2.restore();

  drawWater(w);
}

/* ------------------------------------------------------------------ textures */

function gridRange(w: W, x0: number, y0: number, x1: number, y1: number, s: number) {
  const gx0 = Math.floor(Math.max(x0, w.view.x0) / s) - 1;
  const gx1 = Math.ceil(Math.min(x1, w.view.x1) / s) + 1;
  const gy0 = Math.floor(Math.max(y0, w.view.y0) / s) - 1;
  const gy1 = Math.ceil(Math.min(y1, w.view.y1) / s) + 1;
  return { gx0, gx1, gy0, gy1 };
}

function clipRect(w: W, x0: number, y0: number, x1: number, y1: number): void {
  w.ctx.save();
  w.ctx.beginPath();
  w.ctx.rect(x0, y0, x1 - x0, y1 - y0);
  w.ctx.clip();
}

function ptlTexture(w: W, x0: number, y0: number, x1: number, y1: number, a: number): void {
  if (!hit(w, x0, y0, x1, y1)) return;
  const S = 0.62;
  const { gx0, gx1, gy0, gy1 } = gridRange(w, x0, y0, x1, y1, S);
  const ctx = w.ctx;
  clipRect(w, x0, y0, x1, y1);
  ctx.globalAlpha = a * 0.85;
  ctx.beginPath();
  for (let gx = gx0; gx <= gx1; gx++) {
    for (let gy = gy0; gy <= gy1; gy++) {
      const cx = gx * S + 0.16 * shash(gx, gy, 11);
      const cy = gy * S + 0.16 * shash(gx, gy, 12);
      const r = S * (0.36 + 0.09 * hash(gx, gy, 13));
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  ctx.fillStyle = mix(C.titaniumLo, C.titanium, 0.45);
  ctx.fill();
  ctx.strokeStyle = rgba(C.bone, 0.16);
  ctx.lineWidth = 0.8 * w.px;
  ctx.beginPath();
  for (let gx = gx0; gx <= gx1; gx++) {
    for (let gy = gy0; gy <= gy1; gy++) {
      const cx = gx * S + 0.16 * shash(gx, gy, 11);
      const cy = gy * S + 0.16 * shash(gx, gy, 12);
      const r = S * (0.36 + 0.09 * hash(gx, gy, 13));
      ctx.moveTo(cx + r * Math.cos(3.6), cy + r * Math.sin(3.6));
      ctx.arc(cx, cy, r * 0.82, 3.6, 4.9);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function gdlTexture(w: W, x0: number, y0: number, x1: number, y1: number, a: number): void {
  if (!hit(w, x0, y0, x1, y1)) return;
  const S = 0.6;
  const { gx0, gx1, gy0, gy1 } = gridRange(w, x0, y0, x1, y1, S);
  const ctx = w.ctx;
  clipRect(w, x0, y0, x1, y1);
  ctx.globalAlpha = a * 0.8;
  ctx.strokeStyle = C.carbonHi;
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.15;
  ctx.beginPath();
  const dots: [number, number][] = [];
  for (let gx = gx0; gx <= gx1; gx++) {
    for (let gy = gy0; gy <= gy1; gy++) {
      const h = hash(gx, gy, 21);
      const cx = gx * S + 0.2 * shash(gx, gy, 22);
      const cy = gy * S + 0.2 * shash(gx, gy, 23);
      if (h < 0.55) {
        const len = 0.45 + 0.8 * hash(gx, gy, 24);
        const tilt = 0.15 * shash(gx, gy, 25);
        ctx.moveTo(cx - tilt * len, cy - len / 2);
        ctx.lineTo(cx + tilt * len, cy + len / 2);
      } else {
        dots.push([cx, cy]);
      }
    }
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = mix(C.carbonHi, C.bone, 0.08);
  ctx.beginPath();
  for (const [cx, cy] of dots) {
    ctx.moveTo(cx + 0.11, cy);
    ctx.arc(cx, cy, 0.11, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function clTexture(w: W, x0: number, y0: number, x1: number, y1: number, a: number): void {
  if (a < 0.01 || !hit(w, x0, y0, x1, y1)) return;
  const S = 0.4;
  const { gx0, gx1, gy0, gy1 } = gridRange(w, x0, y0, x1, y1, S);
  const ctx = w.ctx;
  clipRect(w, x0, y0, x1, y1);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#2C323C';
  for (let gx = gx0; gx <= gx1; gx++) {
    for (let gy = gy0; gy <= gy1; gy++) {
      if (hash(gx, gy, 31) < 0.5) continue;
      const s = 0.1 + 0.08 * hash(gx, gy, 32);
      ctx.fillRect(gx * S + 0.15 * shash(gx, gy, 33), gy * S + 0.15 * shash(gx, gy, 34), s, s);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* --------------------------------------------------------------------- water */

function chevronSize(w: W): number {
  return clamp(2.4 * w.cam.z, 4, 11);
}

function drawWater(w: W): void {
  const { st, f } = w;
  const heat = st.heat;
  const cs = chevronSize(w);
  const chevA = rgba(C.cyan, 0.8);

  // inlet manifold
  if (st.manifoldFront > -137) {
    const x1 = st.manifoldFront;
    box(w, -137, IN[0], x1, IN[1], rgba(C.cyan, 0.16));
    line(w, [[-137, IN[0]], [x1, IN[0]]], rgba(C.cyan, 0.45), 1);
    line(w, [[-137, IN[1]], [x1, IN[1]]], rgba(C.cyan, 0.45), 1);
    line(w, [[x1, IN[0]], [x1, IN[1]]], rgba(C.cyan, 0.95), 1.6);
    const sp = 12;
    for (let x = -137 + mod(f * 1.1, sp); x < x1 - 2; x += sp) chevron(w, x, (IN[0] + IN[1]) / 2, 0, cs, chevA);
  }

  for (let i = 0; i < N_CELLS; i++) {
    const front = st.chanFront[i];
    if (front >= Y.sealBot) continue;
    const [x0, x1] = layerX(i, 'achan');
    if (!hit(w, x0, front, x1, Y.sealBot)) continue;
    box(w, x0, front, x1, Y.sealBot, rgba(C.cyan, 0.14));
    if (heat > 0) {
      const g = w.ctx.createLinearGradient(0, Y.sealBot, 0, Y.sealTop);
      g.addColorStop(0, rgba(C.gold, 0));
      g.addColorStop(1, rgba(C.gold, 0.32 * heat));
      box(w, x0, front, x1, Y.sealBot, g);
    }
    line(w, [[x0, front], [x0, Y.sealBot]], rgba(C.cyan, 0.4), 1);
    line(w, [[x1, front], [x1, Y.sealBot]], rgba(C.cyan, 0.4), 1);
    if (front > Y.sealTop) line(w, [[x0, front], [x1, front]], rgba(C.cyan, 0.95), 1.6);
    const sp = 9;
    const cx = (x0 + x1) / 2;
    for (let y = Y.sealBot - mod(f * 0.9, sp); y > front + 1.5; y -= sp) {
      if (y < w.view.y0 - 2 || y > w.view.y1 + 2) continue;
      chevron(w, cx, y, -Math.PI / 2, cs, chevA);
    }
  }

  if (st.outFill > 0) {
    const a = st.outFill;
    box(w, -137, OUT[0], LAST_PLATE[0], OUT[1], rgba(C.cyan, 0.14 * a));
    if (heat > 0) box(w, -137, OUT[0], LAST_PLATE[0], OUT[1], rgba(C.gold, 0.3 * heat * a));
    line(w, [[-137, OUT[0]], [LAST_PLATE[0], OUT[0]]], rgba(C.cyan, 0.45 * a), 1);
    line(w, [[-137, OUT[1]], [LAST_PLATE[0], OUT[1]]], rgba(C.cyan, 0.45 * a), 1);
    const sp = 12;
    for (let x = LAST_PLATE[0] - 3 - mod(f * 1.1, sp); x > -137; x -= sp) {
      chevron(w, x, (OUT[0] + OUT[1]) / 2, Math.PI, cs, rgba(C.cyan, 0.8 * a));
    }
  }
}

/* ------------------------------------------------------------------- bubbles */

const EMITTERS = 10;
const OUT_Y = (Y.outManTop + Y.outManBot) / 2;
const H2_Y = (Y.h2ManTop + Y.h2ManBot) / 2;

interface Bubble {
  x: number;
  y: number;
  r: number;
  hidden: boolean;
  born: number;
}

function emitter(i: number, e: number, side: 0 | 1) {
  const span = Y.activeBot - Y.activeTop - 12;
  const ye = Y.activeTop + 6 + (span * (e + 0.5 + 0.35 * shash(i, e, side + 1))) / EMITTERS;
  const P = side === 0 ? 40 + 10 * hash(i, e, 3) : 20 + 5 * hash(i, e, 6);
  return { ye, P, phase: P * hash(i, e, 4 + side * 5), v: 0.55 + 0.3 * hash(i, e, 5 + side * 7), seed: hash(i, e, 9 + side) };
}

function anodeBubble(i: number, ye: number, v: number, seed: number, a: number, r0: number): Bubble | null {
  const ax1 = layerX(i, 'achan')[1];
  if (a < 10) {
    const t = a / 10;
    return { x: ax1 + 0.3 - 1.7 * t, y: ye, r: r0 * (0.35 + 0.65 * t), hidden: false, born: a };
  }
  const ar = a - 10;
  const drift = (t: number) => ax1 - 1.4 - 1.5 * (1 - Math.exp(-t / 25));
  const y = ye - v * ar;
  if (y > OUT_Y) return { x: drift(ar) + 0.3 * Math.sin(0.17 * a + 7 * seed), y, r: r0, hidden: false, born: a };
  const aM = (ye - OUT_Y) / v;
  const x = drift(aM) - 1.3 * (ar - aM);
  if (x < -137) return null;
  return { x, y: OUT_Y + 1.6 * Math.sin(0.2 * a + 5 * seed), r: r0 * 0.9, hidden: false, born: a };
}

function cathodeBubble(i: number, ye: number, v: number, seed: number, a: number, r0: number): Bubble | null {
  const cx0 = layerX(i, 'cchan')[0];
  if (a < 10) {
    const t = a / 10;
    return { x: cx0 - 0.3 + 1.7 * t, y: ye, r: r0 * (0.35 + 0.65 * t), hidden: false, born: a };
  }
  const ar = a - 10;
  const drift = (t: number) => cx0 + 1.4 + 1.5 * (1 - Math.exp(-t / 25));
  const y = ye - v * ar;
  if (y > Y.activeTop) return { x: drift(ar) + 0.3 * Math.sin(0.19 * a + 9 * seed), y, r: r0, hidden: false, born: a };
  const aTop = (ye - Y.activeTop) / v;
  if (y > H2_Y) {
    const xr = cx0 + 2.8;
    const k = clamp((Y.activeTop - y) / 6);
    return { x: drift(aTop) + (xr - drift(aTop)) * k, y, r: r0 * 0.85, hidden: true, born: a };
  }
  const aM = (ye - H2_Y) / v;
  const x = cx0 + 2.8 + 2.2 * (ar - aM);
  if (x > 137) return null;
  return { x, y: H2_Y + 1.2 * Math.sin(0.23 * a + 3 * seed), r: r0 * 0.8, hidden: true, born: a };
}

function maxAge(i: number, ye: number, v: number, side: 0 | 1): number {
  if (side === 0) {
    const xM = layerX(i, 'achan')[1] - 2.9;
    return 10 + (ye - OUT_Y) / v + (xM + 137) / 1.3 + 2;
  }
  const xR = layerX(i, 'cchan')[0] + 2.8;
  return 10 + (ye - H2_Y) / v + (137 - xR) / 2.2 + 2;
}

export function drawBubbles(w: W): void {
  const { f } = w;
  if (f < T_GAS) return;
  const fadeMicro = 1 - lod(w, 40, 75);
  if (fadeMicro <= 0.01) return;
  const ctx = w.ctx;
  const minR = 1.1 * w.px;
  const showRings = lod(w, 6, 10);
  const fill = rgba(C.bone, 0.07 * fadeMicro);
  const stroke = rgba(C.cyan, 0.9 * fadeMicro);
  const strokeHidden = rgba(C.cyan, 0.35 * fadeMicro);

  for (let i = 0; i < N_CELLS; i++) {
    for (const side of [0, 1] as const) {
      for (let e = 0; e < EMITTERS; e++) {
        const em = emitter(i, e, side);
        const A = maxAge(i, em.ye, em.v, side);
        const t0 = T_GAS + em.phase;
        const nMax = Math.floor((f - t0) / em.P);
        const nMin = Math.max(0, Math.ceil((f - A - t0) / em.P));
        for (let n = nMin; n <= nMax; n++) {
          const a = f - (t0 + n * em.P);
          if (a < 0) continue;
          const r0 = side === 0 ? 0.55 + 0.35 * hash(i, e * 97 + n, 41) : 0.42 + 0.28 * hash(i, e * 97 + n, 42);
          const b = side === 0 ? anodeBubble(i, em.ye, em.v, em.seed, a, r0) : cathodeBubble(i, em.ye, em.v, em.seed, a, r0);
          if (!b) continue;
          if (b.x < w.view.x0 - 2 || b.x > w.view.x1 + 2 || b.y < w.view.y0 - 2 || b.y > w.view.y1 + 2) continue;
          const r = Math.max(b.r, minR);
          ctx.beginPath();
          ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = b.hidden ? strokeHidden : stroke;
          ctx.lineWidth = 1.1 * w.px;
          ctx.stroke();
          if (showRings > 0 && b.born < 12) {
            const t = b.born / 12;
            ctx.beginPath();
            ctx.arc(b.x, b.y, r * (1.2 + 1.6 * t), 0, Math.PI * 2);
            ctx.strokeStyle = rgba(C.violet, 0.75 * (1 - t) * showRings * fadeMicro);
            ctx.lineWidth = 1.4 * w.px;
            ctx.stroke();
          }
        }
      }
    }
  }
}

/* ------------------------------------------------------- charge paths (gold) */

/** Electron and proton paths at cell scale once DC power is on. */
export function drawChargePaths(w: W): void {
  const { st, f } = w;
  const a = st.power * (1 - smooth(ramp(f, 496, 530))) * lod(w, 5, 9) * (1 - lod(w, 40, 70));
  if (a < 0.01) return;
  const gold = rgba(C.gold, 0.85 * a);
  const goldHidden = rgba(C.gold, 0.4 * a);
  const heights: number[] = [];
  for (let y = Y.activeTop + 12; y < Y.activeBot - 6; y += 22) heights.push(y);

  for (let i = 0; i < N_CELLS; i++) {
    const x = cellX(i);
    if (!hit(w, x - CELL_W, Y.activeTop, x + CELL_W, Y.activeBot)) continue;
    const acl = x + 15.2;
    const ptlL = x + 9.5;
    const bppL = x;
    const prevGdlR = x - CELL_W + 24.5;
    const prevCcl = x - CELL_W + 19.2;
    for (const y of heights) {
      if (y < w.view.y0 - 4 || y > w.view.y1 + 4) continue;
      line(w, [[acl, y], [ptlL, y]], gold, 1.3);
      line(w, [[ptlL, y], [x + 4, y]], goldHidden, 1.2, [4, 4]);
      line(w, [[x + 4, y], [bppL, y]], gold, 1.3);
      if (i > 0) {
        line(w, [[bppL, y], [prevGdlR, y]], goldHidden, 1.2, [4, 4]);
        line(w, [[prevGdlR, y], [prevCcl, y]], gold, 1.3);
        arrowHead(w, prevCcl + 0.2, y, Math.PI, 6, gold);
      } else {
        line(w, [[bppL, y], [CC_L[1], y]], goldHidden, 1.2, [4, 4]);
        arrowHead(w, CC_L[1] + 0.1, y, Math.PI, 6, gold);
      }
      // electrons moving right-to-left along the path
      const sp = 4.5;
      const xEnd = i > 0 ? prevCcl : CC_L[1];
      for (let ex = acl - mod(f * 0.45, sp); ex > xEnd; ex -= sp) {
        circle(w, ex, y, 2.6 * w.px, rgba(C.gold, a));
      }
      // protons crossing the membrane (anode → cathode)
      const [m0, m1] = layerX(i, 'mem');
      const py = y + 11;
      if (py < Y.activeBot - 2) {
        const t = mod(f * 0.035 + i * 0.3 + y * 0.01, 1);
        const px = m0 - 0.6 + (m1 - m0 + 1.2) * t;
        chevron(w, px, py, 0, clamp(1.4 * w.cam.z, 4, 9), rgba(C.cyan, 0.9 * a), 1.6);
      }
    }
  }
  if (st.power > 0) {
    // last cell's cathode is fed from the right current collector
    const iLast = N_CELLS - 1;
    const x = LAST_PLATE[0];
    for (const y of heights) {
      if (y < w.view.y0 - 4 || y > w.view.y1 + 4) continue;
      line(w, [[CC_R[0], y], [x, y]], gold, 1.3);
      line(w, [[x, y], [cellX(iLast) + 24.5, y]], goldHidden, 1.2, [4, 4]);
      line(w, [[cellX(iLast) + 24.5, y], [cellX(iLast) + 19.2, y]], gold, 1.3);
    }
  }
}

/* ---------------------------------------------------------------- heat field */

export function drawHeat(w: W): void {
  const { st, f } = w;
  const h = st.heat;
  if (h < 0.01) return;
  const ctx = w.ctx;
  const arrows = lod(w, 1.8, 2.8);
  for (let i = 0; i < N_CELLS; i++) {
    const xm = cellX(i) + 17.2;
    const W2 = 3 + 8 * h;
    if (!hit(w, xm - W2, Y.activeTop, xm + W2, Y.activeBot)) continue;
    const g = ctx.createLinearGradient(xm - W2, 0, xm + W2, 0);
    g.addColorStop(0, rgba(C.gold, 0));
    g.addColorStop(0.5, rgba(C.gold, 0.38 * h));
    g.addColorStop(1, rgba(C.gold, 0));
    box(w, xm - W2, Y.activeTop, xm + W2, Y.activeBot, g);
    // isotherms (schematic contour lines of the temperature field)
    for (let k = 1; k <= 3; k++) {
      for (const sgn of [-1, 1]) {
        const off = sgn * k * (1.3 + 1.9 * h);
        const pts: [number, number][] = [];
        for (let y = Y.activeTop; y <= Y.activeBot; y += 3) {
          pts.push([xm + off + 0.35 * k * Math.sin(y * 0.11 + k + i), y]);
        }
        line(w, pts, rgba(C.gold, (0.55 * h) / k), 1, [3, 4]);
      }
    }
    if (arrows > 0.01) {
      const target = cellX(i) + 6.75;
      for (let y = Y.activeTop + 10; y < Y.activeBot - 4; y += 18) {
        if (y < w.view.y0 || y > w.view.y1) continue;
        const t = mod(f * 0.02 + y * 0.013 + i * 0.17, 1);
        const xa = xm - 2 - (xm - 2 - target) * t;
        const al = Math.sin(Math.PI * t) * h * arrows;
        line(w, [[xa + 2.4, y], [xa, y]], rgba(C.gold, 0.9 * al), 1.6);
        arrowHead(w, xa, y, Math.PI, 6, rgba(C.gold, 0.9 * al));
      }
    }
  }
}

/* ---------------------------------------------------------- hardware overlay */

function drawHardwareOverlays(w: W): void {
  const { st } = w;
  // tie rods with nuts (front pair)
  for (const ry of [-Y.rod, Y.rod]) {
    line(w, [[-128, ry], [128, ry]], C.steelHi, 4.5 * Math.min(1, w.cam.z / 2.5));
    line(w, [[-128, ry - 1.2], [128, ry - 1.2]], rgba(C.bone, 0.22), 1);
    for (const nx of [-121, 121]) {
      box(w, nx - 4, ry - 5, nx + 4, ry + 5, C.steel);
      outline(w, nx - 4, ry - 5, nx + 4, ry + 5, rgba(C.bone, 0.25), 1);
    }
  }
  // DC terminals on the current collectors
  for (const cc of [CC_L, CC_R]) {
    const x0 = cc[0] - 0.5;
    const x1 = cc[1] + 0.5;
    box(w, x0, -172, x1, Y.plateTop, metalGrad(w, -172, Y.plateTop, C.copper, C.copperLo));
    circle(w, (x0 + x1) / 2, -166, 2.2, C.copperLo, rgba(C.bone, 0.4), 1);
  }
  const power = st.power;
  if (power > 0) {
    for (const cc of [CC_L, CC_R]) {
      outline(w, cc[0] - 1.2, -173, cc[1] + 1.2, Y.plateTop, rgba(C.gold, 0.9 * power), 1.6);
    }
  }
  // port stubs with flanges
  const stub = (x0: number, x1: number, y: number) => {
    box(w, Math.min(x0, x1), y - 4.5, Math.max(x0, x1), y + 4.5, C.steelLo);
    line(w, [[Math.min(x0, x1), y - 4.5], [Math.max(x0, x1), y - 4.5]], rgba(C.bone, 0.25), 1);
    const fx = x1;
    box(w, fx - 1.5, y - 7.5, fx + 1.5, y + 7.5, C.steel);
  };
  stub(END_L[0], -137, (IN[0] + IN[1]) / 2);
  stub(END_L[0], -137, (OUT[0] + OUT[1]) / 2);
  stub(END_R[1], 137, (Y.h2ManTop + Y.h2ManBot) / 2);
  // fluid in stubs
  if (st.manifoldFront > -137) box(w, -137, IN[0] + 2, Math.min(END_L[0], st.manifoldFront), IN[1] - 2, rgba(C.cyan, 0.35));
  if (st.outFill > 0) box(w, -137, OUT[0] + 2, END_L[0], OUT[1] - 2, rgba(C.cyan, 0.35 * st.outFill));
  if (st.gas > 0) box(w, END_R[1], Y.h2ManTop + 2, 137, Y.h2ManBot - 2, rgba(C.cyan, 0.3 * st.gas));
}

function drawSweepLine(w: W, sy: number): void {
  line(w, [[-150, sy], [150, sy]], rgba(C.bone, 0.85), 1.4, [10, 6]);
  for (const sx of [-150, 150]) {
    line(w, [[sx, sy], [sx, sy - 14]], rgba(C.bone, 0.85), 1.6);
    arrowHead(w, sx, sy - 16, -Math.PI / 2, 7, rgba(C.bone, 0.85));
  }
}
