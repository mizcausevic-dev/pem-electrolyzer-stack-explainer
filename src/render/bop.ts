import { clamp, mod } from '../engine/math';
import { PORT } from './geometry';
import { C, mix, rgba } from './palette';
import { MONO } from './text';
import { type W, arrowHead, box, chevron, circle, line, outline } from './world';

/**
 * Balance-of-plant layout in world units around the stack (stack at origin).
 * This is a simplified process schematic (P&ID-style), not a design for any
 * product. Subsystem grouping follows NREL TP-6A20-87625: water supply and
 * deionization, thermal management, hydrogen-side separation and drying,
 * electrical BOP, and instrumentation.
 */
export const BOP = {
  ac: { x: -610, y: -255 },
  rect: { x0: -380, y0: -292, x1: -230, y1: -218 },
  feed: { x: -890, y: -40 },
  di: { x0: -770, y0: -80, x1: -620, y1: 0 },
  tank: { x0: -495, y0: -105, x1: -385, y1: 65 },
  pump: { x: -440, y: 170, r: 26 },
  hx: { x0: -330, y0: 142, x1: -200, y1: 198 },
  sep: { x0: 340, y0: -104, x1: 420, y1: 30 },
  dryer: { x0: 530, y0: -104, x1: 640, y1: 30 },
  h2out: { x: 880, y: -60 },
  ctrl: { x0: 640, y0: 168, x1: 830, y1: 252 },
} as const;

type P = [number, number];

export const PIPES = {
  anodeReturn: [[-137, PORT.anodeOut.y], [-300, PORT.anodeOut.y], [-300, -60], [BOP.tank.x1, -60]] as P[],
  o2Vent: [[-440, BOP.tank.y0], [-440, -178]] as P[],
  tankToPump: [[-440, BOP.tank.y1], [-440, BOP.pump.y - BOP.pump.r]] as P[],
  pumpToHx: [[BOP.pump.x + BOP.pump.r, BOP.pump.y], [BOP.hx.x0, BOP.pump.y]] as P[],
  hxToStack: [[BOP.hx.x1, BOP.pump.y], [-165, BOP.pump.y], [-165, PORT.anodeIn.y], [-137, PORT.anodeIn.y]] as P[],
  feedToDi: [[BOP.feed.x, -40], [BOP.di.x0, -40]] as P[],
  diToTank: [[BOP.di.x1, -40], [BOP.tank.x0, -40]] as P[],
  h2ToSep: [[137, PORT.h2.y], [380, PORT.h2.y], [380, BOP.sep.y0]] as P[],
  sepToDryer: [[BOP.sep.x1, -60], [BOP.dryer.x0, -60]] as P[],
  dryerToOut: [[BOP.dryer.x1, -60], [BOP.h2out.x, -60]] as P[],
  recovered: [[380, BOP.sep.y1], [380, 300], [-540, 300], [-540, 40], [BOP.tank.x0, 40]] as P[],
  acToRect: [[BOP.ac.x + 22, BOP.ac.y], [BOP.rect.x0, BOP.ac.y]] as P[],
  dcPlus: [[BOP.rect.x1, -236], [PORT.plus.x, -236], [PORT.plus.x, -173]] as P[],
  dcMinus: [[BOP.rect.x1, -272], [PORT.minus.x, -272], [PORT.minus.x, -173]] as P[],
  ctrlToRect: [[735, BOP.ctrl.y0], [735, -316], [-305, -316], [-305, BOP.rect.y0]] as P[],
  ctrlToPump: [[BOP.ctrl.x0, 236], [-440, 236], [-440, BOP.pump.y + BOP.pump.r]] as P[],
};

export const SENSORS: { tag: string; x: number; y: number; group: 'loop' | 'controls' }[] = [
  { tag: 'TT', x: -222, y: PORT.anodeOut.y, group: 'loop' },
  { tag: 'TT', x: -165, y: 138, group: 'loop' },
  { tag: 'PT', x: 250, y: PORT.h2.y, group: 'controls' },
  { tag: 'LT', x: BOP.tank.x1, y: 22, group: 'controls' },
  { tag: 'AT', x: -560, y: -40, group: 'controls' },
];

function polyLength(pts: P[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

function pointAt(pts: P[], d: number): { x: number; y: number; a: number } {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (acc + seg >= d) {
      const t = (d - acc) / seg;
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, a: Math.atan2(y1 - y0, x1 - x0) };
    }
    acc += seg;
  }
  const n = pts.length;
  return { x: pts[n - 1][0], y: pts[n - 1][1], a: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) };
}

type PipeKind = 'water' | 'gas' | 'twoPhase' | 'recovered';

function pipe(w: W, pts: P[], kind: PipeKind, alpha: number, hot = 0): void {
  if (alpha < 0.01) return;
  const { f } = w;
  const body = kind === 'gas' ? 7 : kind === 'recovered' ? 4 : 9;
  line(w, pts, rgba(C.structLo, 0.95 * alpha), body);
  line(w, pts, rgba(C.struct, 0.9 * alpha), body - 2);
  const core = hot > 0 ? mix(C.cyan, C.gold, 0.65 * hot, 0.95 * alpha) : rgba(C.cyan, 0.95 * alpha);
  if (kind === 'gas') line(w, pts, rgba(C.cyan, 0.9 * alpha), 1.6, [7, 5], -f * 1.2);
  else if (kind === 'recovered') line(w, pts, rgba(C.cyan, 0.7 * alpha), 1.4, [4, 5], -f * 0.8);
  else line(w, pts, core, 2.6);

  const L = polyLength(pts);
  const sp = 30;
  const speed = kind === 'gas' ? 1.4 : 0.9;
  for (let d = mod(f * speed, sp); d < L - 4; d += sp) {
    const p = pointAt(pts, d);
    chevron(w, p.x, p.y, p.a, 5.5, kind === 'water' || kind === 'twoPhase' ? core : rgba(C.cyan, 0.9 * alpha), 1.6);
    if (kind === 'twoPhase') {
      circle(w, p.x - Math.cos(p.a) * 12, p.y - Math.sin(p.a) * 12 + 1.5, 2.4 * w.px * 1.4, undefined, rgba(C.bone, 0.75 * alpha), 1);
    }
  }
  arrowHead(w, pts[pts.length - 1][0], pts[pts.length - 1][1], pointAt(pts, L).a, 7, kind === 'gas' ? rgba(C.cyan, alpha) : core);
}

function wire(w: W, pts: P[], alpha: number, widthPx: number, dash?: number[]): void {
  if (alpha < 0.01) return;
  line(w, pts, rgba(C.gold, 0.9 * alpha), widthPx, dash, dash ? -w.f * 1.2 : 0);
}

function equip(w: W, x0: number, y0: number, x1: number, y1: number, alpha: number, accent?: string): void {
  const ctx = w.ctx;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, C.structHi);
  g.addColorStop(1, C.structLo);
  box(w, x0, y0, x1, y1, g);
  outline(w, x0, y0, x1, y1, accent ?? rgba(C.bone, 0.35), 1.2);
  ctx.restore();
}

function vessel(w: W, x0: number, y0: number, x1: number, y1: number, alpha: number): void {
  const ctx = w.ctx;
  const r = (x1 - x0) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, C.structLo);
  g.addColorStop(0.4, C.structHi);
  g.addColorStop(1, C.structLo);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + r * 0.6);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r * 0.6);
  ctx.lineTo(x1, y1 - r * 0.6);
  ctx.quadraticCurveTo(x1, y1, x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r * 0.6);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.bone, 0.35);
  ctx.lineWidth = 1.2 * w.px;
  ctx.stroke();
  ctx.restore();
}

function glyph(w: W, text: string, x: number, y: number, sizePx: number, color: string): void {
  const ctx = w.ctx;
  ctx.save();
  ctx.font = `600 ${sizePx * w.px}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawBop(w: W): void {
  const { st, f } = w;
  const loop = st.loop;
  const { power, water, hydrogen, controls } = st.bop;
  const heat = st.heat;

  // ---- electrical (gold)
  if (power > 0.01) {
    wire(w, PIPES.acToRect, power, 2);
    const ac = BOP.ac;
    circle(w, ac.x, ac.y, 22, rgba(C.structLo, power), rgba(C.gold, 0.9 * power), 1.6);
    glyph(w, '~', ac.x, ac.y, 26, rgba(C.gold, power));
    equip(w, BOP.rect.x0, BOP.rect.y0, BOP.rect.x1, BOP.rect.y1, power, rgba(C.gold, 0.7));
    glyph(w, 'AC  DC', (BOP.rect.x0 + BOP.rect.x1) / 2, (BOP.rect.y0 + BOP.rect.y1) / 2 - 2, 15, rgba(C.bone, 0.9 * power));
    line(w, [[BOP.rect.x0 + 8, BOP.rect.y1 - 8], [BOP.rect.x1 - 8, BOP.rect.y0 + 8]], rgba(C.gold, 0.6 * power), 1);
    wire(w, PIPES.dcPlus, power, 4);
    wire(w, PIPES.dcMinus, power, 4);
    // current pulses along the DC bus (conventional direction is irrelevant here; shows energy delivery)
    for (const pts of [PIPES.dcPlus, PIPES.dcMinus]) {
      const L = polyLength(pts);
      for (let d = mod(f * 2, 40); d < L; d += 40) {
        const p = pointAt(pts, d);
        circle(w, p.x, p.y, 3.2 * w.px, rgba(C.gold, power));
      }
    }
  }

  // ---- anode water loop + thermal management (visible from the cooling chapter)
  if (loop > 0.01) {
    pipe(w, PIPES.anodeReturn, 'twoPhase', loop, heat);
    pipe(w, PIPES.tankToPump, 'water', loop, heat);
    pipe(w, PIPES.pumpToHx, 'water', loop, heat);
    pipe(w, PIPES.hxToStack, 'water', loop, 0);
    pipe(w, PIPES.o2Vent, 'gas', loop);
    vessel(w, BOP.tank.x0, BOP.tank.y0, BOP.tank.x1, BOP.tank.y1, loop);
    // water level and O2 headspace inside the tank (schematic)
    box(w, BOP.tank.x0 + 6, -50, BOP.tank.x1 - 6, BOP.tank.y1 - 14, rgba(C.cyan, 0.16 * loop));
    line(w, [[BOP.tank.x0 + 6, -50], [BOP.tank.x1 - 6, -50]], rgba(C.cyan, 0.8 * loop), 1.4);
    for (let k = 0; k < 4; k++) {
      const t = mod(f * 0.012 + k * 0.25, 1);
      circle(w, BOP.tank.x0 + 24 + k * 20, -50 - t * 36, (2.5 + 2 * t) * w.px * 1.6, undefined, rgba(C.bone, 0.7 * loop * (1 - t)), 1);
    }
    // pump (actuator: gold)
    const p = BOP.pump;
    circle(w, p.x, p.y, p.r, rgba(C.structHi, loop), rgba(C.gold, 0.85 * loop), 1.6);
    const ang = f * 0.12;
    w.ctx.save();
    w.ctx.globalAlpha = loop;
    w.ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = ang + (k * Math.PI * 2) / 3;
      w.ctx.moveTo(p.x, p.y);
      w.ctx.lineTo(p.x + Math.cos(a) * p.r * 0.7, p.y + Math.sin(a) * p.r * 0.7);
    }
    w.ctx.strokeStyle = rgba(C.gold, 0.9);
    w.ctx.lineWidth = 2 * w.px;
    w.ctx.stroke();
    w.ctx.restore();
    // heat exchanger
    equip(w, BOP.hx.x0, BOP.hx.y0, BOP.hx.x1, BOP.hx.y1, loop);
    const zz: P[] = [];
    for (let k = 0; k <= 10; k++) zz.push([BOP.hx.x0 + 10 + k * 11, (BOP.hx.y0 + BOP.hx.y1) / 2 + (k % 2 ? -14 : 14)]);
    line(w, zz, mix(C.gold, C.cyan, 0.5, 0.9 * loop), 1.8);
    // heat rejected (energy: gold), rising from the exchanger
    const hr = loop * clamp(heat * 1.4);
    for (let k = 0; k < 4; k++) {
      const x = BOP.hx.x0 + 22 + k * 28;
      const t = mod(f * 0.02 + k * 0.27, 1);
      const pts: P[] = [];
      for (let s = 0; s <= 8; s++) pts.push([x + 4 * Math.sin(s * 1.2 + f * 0.1), BOP.hx.y0 - 6 - s * 4 - t * 10]);
      line(w, pts, rgba(C.gold, 0.85 * hr * (1 - t * 0.6)), 1.6);
      arrowHead(w, pts[8][0], pts[8][1] - 3, -Math.PI / 2, 6, rgba(C.gold, 0.85 * hr * (1 - t * 0.6)));
    }
  }

  // ---- water supply (makeup) and recovered water
  if (water > 0.01) {
    pipe(w, PIPES.feedToDi, 'water', water);
    pipe(w, PIPES.diToTank, 'water', water);
    equip(w, BOP.di.x0, BOP.di.y0, BOP.di.x1, BOP.di.y1, water);
    // carbon filter + ion-exchange columns
    for (let k = 0; k < 3; k++) {
      const cx = BOP.di.x0 + 30 + k * 45;
      box(w, cx - 12, BOP.di.y0 + 12, cx + 12, BOP.di.y1 - 12, rgba(k === 0 ? C.carbon : C.structLo, water));
      outline(w, cx - 12, BOP.di.y0 + 12, cx + 12, BOP.di.y1 - 12, rgba(C.bone, 0.3 * water), 1);
    }
    circle(w, BOP.feed.x, -40, 6, rgba(C.cyan, 0.9 * water));
  }

  // ---- hydrogen side
  if (hydrogen > 0.01) {
    pipe(w, PIPES.h2ToSep, 'gas', hydrogen);
    pipe(w, PIPES.sepToDryer, 'gas', hydrogen);
    pipe(w, PIPES.dryerToOut, 'gas', hydrogen);
    pipe(w, PIPES.recovered, 'recovered', hydrogen);
    vessel(w, BOP.sep.x0, BOP.sep.y0, BOP.sep.x1, BOP.sep.y1, hydrogen);
    box(w, BOP.sep.x0 + 6, 0, BOP.sep.x1 - 6, BOP.sep.y1 - 10, rgba(C.cyan, 0.16 * hydrogen));
    line(w, [[BOP.sep.x0 + 6, 0], [BOP.sep.x1 - 6, 0]], rgba(C.cyan, 0.8 * hydrogen), 1.4);
    for (const cx of [BOP.dryer.x0 + 26, BOP.dryer.x1 - 26]) vessel(w, cx - 20, BOP.dryer.y0, cx + 20, BOP.dryer.y1, hydrogen);
    circle(w, BOP.h2out.x + 10, -60, 7, rgba(C.cyan, 0.9 * hydrogen));
  }

  // ---- controls and instrumentation
  if (controls > 0.01) {
    wire(w, PIPES.ctrlToRect, controls, 1.4, [8, 6]);
    wire(w, PIPES.ctrlToPump, controls, 1.4, [8, 6]);
    equip(w, BOP.ctrl.x0, BOP.ctrl.y0, BOP.ctrl.x1, BOP.ctrl.y1, controls, rgba(C.violet, 0.8));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        const on = ((c + r * 2 + Math.floor(f / 20)) % 5) !== 0;
        circle(w, BOP.ctrl.x0 + 26 + c * 26, BOP.ctrl.y0 + 22 + r * 20, 3.2, rgba(on ? C.violet : C.structLo, 0.9 * controls));
      }
    }
  }
  for (const s of SENSORS) {
    const a = s.group === 'loop' ? loop : controls;
    if (a < 0.01) continue;
    if (s.group === 'controls' || controls > 0.01) {
      const sa = s.group === 'loop' ? controls : a;
      const cx = (BOP.ctrl.x0 + BOP.ctrl.x1) / 2;
      const cy = BOP.ctrl.y0;
      const ctx = w.ctx;
      ctx.save();
      ctx.strokeStyle = rgba(C.violet, 0.55 * sa);
      ctx.lineWidth = 1.3 * w.px;
      ctx.setLineDash([2 * w.px, 5 * w.px]);
      ctx.lineDashOffset = f * 0.9 * w.px;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 14);
      ctx.bezierCurveTo(s.x, s.y - 120, cx, cy - 160, cx, cy);
      ctx.stroke();
      ctx.restore();
    }
    circle(w, s.x, s.y - 14, 13, rgba(C.stage, 0.95 * a), rgba(C.violet, 0.95 * a), 1.6);
    line(w, [[s.x, s.y - 1], [s.x, s.y - 4]], rgba(C.violet, a), 1.4);
    glyph(w, s.tag, s.x, s.y - 14, 11, rgba(C.bone, a));
  }
}
