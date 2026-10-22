import { clamp, fade, mod, ramp, smooth } from '../engine/math';
import { roundRect } from './hud';
import { reactionActivity } from './micro';
import { C, rgba } from './palette';
import { MONO, drawRich, wrap } from './text';
import type { FrameState } from './state';

const PX = 1400;
const PW = 456;

/** Grid-paper panel: the visual grammar for math and schematic diagrams. */
function mathPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tag: string): void {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = rgba(C.stage2, 0.94);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(C.bone, 0.045);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x; gx < x + w; gx += 16) {
    ctx.moveTo(gx + 0.5, y);
    ctx.lineTo(gx + 0.5, y + h);
  }
  for (let gy = y; gy < y + h; gy += 16) {
    ctx.moveTo(x, gy + 0.5);
    ctx.lineTo(x + w, gy + 0.5);
  }
  ctx.stroke();
  ctx.restore();
  roundRect(ctx, x, y, w, h, 10);
  ctx.strokeStyle = rgba(C.bone, 0.22);
  ctx.stroke();
  ctx.strokeStyle = rgba(C.bone, 0.7);
  ctx.lineWidth = 1.5;
  const k = 12;
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * 4, cy + sy * (4 + k));
    ctx.lineTo(cx + sx * 4, cy + sy * 4);
    ctx.lineTo(cx + sx * (4 + k), cy + sy * 4);
    ctx.stroke();
  }
  drawRich(ctx, tag, x + 22, y + 30, { size: 13, family: MONO, weight: 600, color: rgba(C.bone, 0.75), letterSpacing: 1.4 });
}

export function drawChargePanel(ctx: CanvasRenderingContext2D, f: number): void {
  const a = fade(f, 304, 322, 440, 458);
  if (a <= 0.01) return;
  const x = PX;
  const y = 236;
  const h = 262;
  ctx.save();
  ctx.globalAlpha = a;
  mathPanel(ctx, x, y, PW, h, 'SCHEMATIC · CHARGE PATH');

  const cy = y + 150;
  const colW = [130, 70, 130];
  const cx0 = x + 63;
  const cols: [string, string, string][] = [
    ['Anode', C.titaniumLo, '+'],
    ['PEM', C.membrane, ''],
    ['Cathode', C.carbonHi, '−'],
  ];
  let cx = cx0;
  const centers: number[] = [];
  cols.forEach(([name, col], i) => {
    ctx.fillStyle = rgba(col, i === 1 ? 0.55 : 0.9);
    ctx.fillRect(cx, cy, colW[i], 62);
    ctx.strokeStyle = rgba(C.bone, 0.35);
    ctx.strokeRect(cx + 0.5, cy + 0.5, colW[i] - 1, 61);
    drawRich(ctx, name, cx + colW[i] / 2, cy + 86, { size: 15, weight: 500, color: C.text, align: 'center' });
    centers.push(cx + colW[i] / 2);
    cx += colW[i];
  });

  const srcX = x + PW / 2;
  const srcY = y + 74;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  const path: [number, number][] = [
    [centers[0], cy],
    [centers[0], srcY],
    [srcX - 14, srcY],
  ];
  const path2: [number, number][] = [
    [srcX + 14, srcY],
    [centers[2], srcY],
    [centers[2], cy],
  ];
  for (const p of [path, path2]) {
    ctx.beginPath();
    p.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(srcX - 8, srcY - 18);
  ctx.lineTo(srcX - 8, srcY + 18);
  ctx.moveTo(srcX + 8, srcY - 10);
  ctx.lineTo(srcX + 8, srcY + 10);
  ctx.stroke();
  drawRich(ctx, '+', srcX - 26, srcY - 12, { size: 16, family: MONO, color: C.gold, align: 'center' });
  drawRich(ctx, '−', srcX + 26, srcY - 12, { size: 16, family: MONO, color: C.gold, align: 'center' });
  drawRich(ctx, 'DC supply', srcX, srcY - 26, { size: 14, family: MONO, color: C.gold, align: 'center' });

  const along = (p: [number, number][], t: number): [number, number] => {
    const segs = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1]));
    let d = t * segs.reduce((s, v) => s + v, 0);
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) {
        const k = d / segs[i];
        return [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k];
      }
      d -= segs[i];
    }
    return p[p.length - 1];
  };
  const pw = smooth(ramp(f, 306, 326));
  for (let k = 0; k < 5; k++) {
    const t = mod(f * 0.012 + k / 5, 1);
    for (const p of [path, path2]) {
      const [ex, ey] = along(p, t);
      ctx.fillStyle = rgba(C.gold, pw);
      ctx.beginPath();
      ctx.arc(ex, ey, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawRich(ctx, 'e^− out', centers[0] - 58, srcY + 40, { size: 14, family: MONO, color: C.gold });
  drawRich(ctx, 'e^− in', centers[2] + 12, srcY + 40, { size: 14, family: MONO, color: C.gold });
  for (let k = 0; k < 3; k++) {
    const t = mod(f * 0.02 + k / 3, 1);
    const hx = centers[1] - 44 + 88 * t;
    const hy = cy + 16 + k * 15;
    ctx.fillStyle = rgba(C.cyan, Math.sin(Math.PI * t) * pw);
    ctx.beginPath();
    ctx.moveTo(hx + 7, hy);
    ctx.lineTo(hx - 4, hy - 5);
    ctx.lineTo(hx - 4, hy + 5);
    ctx.closePath();
    ctx.fill();
  }
  drawRich(ctx, 'H^+', centers[1], cy - 8, { size: 14, family: MONO, color: C.cyan, align: 'center' });
  const cap = wrap(ctx, 'In a stack, bipolar plates carry current cell to cell in series.', { size: 14, color: C.muted }, PW - 44);
  cap.forEach((ln, i) => drawRich(ctx, ln, x + 22, y + h - 14 - (cap.length - 1 - i) * 18, { size: 14, color: C.muted }));
  ctx.restore();
}

export function drawEquationPanel(ctx: CanvasRenderingContext2D, f: number): void {
  const a = fade(f, 350, 366, 500, 518);
  if (a <= 0.01) return;
  const x = PX;
  const y = 514;
  const h = 284;
  const act = reactionActivity(f);
  ctx.save();
  ctx.globalAlpha = a;
  mathPanel(ctx, x, y, PW, h, 'EQUATION · SOURCE: U.S. DOE');
  const rows: [string, string, number][] = [
    ['ANODE', '2H_2O -> O_2 + 4H^+ + 4e^−', act.anode],
    ['CATHODE', '4H^+ + 4e^− -> 2H_2', act.cathode],
    ['NET', '2H_2O -> 2H_2 + O_2', 0],
  ];
  rows.forEach(([label, eq, hl], i) => {
    const ry = y + 78 + i * 52;
    if (hl > 0.01) {
      ctx.fillStyle = rgba(C.violet, 0.22 * hl);
      ctx.fillRect(x + 12, ry - 30, PW - 24, 42);
      ctx.fillStyle = rgba(C.violet, 0.9 * hl);
      ctx.fillRect(x + 12, ry - 30, 3, 42);
    }
    drawRich(ctx, label, x + 24, ry - 2, { size: 12, family: MONO, weight: 600, color: rgba(C.muted, 1), letterSpacing: 1.2 });
    drawRich(ctx, eq, x + 112, ry, { size: 24, family: MONO, weight: 500, color: i === 2 ? C.text : C.bone });
  });
  ctx.strokeStyle = rgba(C.bone, 0.2);
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 210);
  ctx.lineTo(x + PW - 22, y + 210);
  ctx.stroke();
  drawRich(ctx, 'Per 4 e^− transferred: 1 O_2 at the anode,', x + 22, y + 238, { size: 16, color: C.text });
  drawRich(ctx, '2 H_2 at the cathode (2 : 1 molar ratio).', x + 22, y + 262, { size: 16, color: C.text });
  ctx.restore();
}

export function drawTemperaturePanel(ctx: CanvasRenderingContext2D, st: FrameState): void {
  const f = st.f;
  const a = fade(f, 566, 586, 704, 722);
  if (a <= 0.01) return;
  const x = PX;
  const y = 236;
  const h = 470;
  ctx.save();
  ctx.globalAlpha = a;
  mathPanel(ctx, x, y, PW, h, 'DIAGRAM · QUALITATIVE');
  drawRich(ctx, 'Water temperature along one anode channel', x + 22, y + 62, { size: 17, weight: 600, color: C.bone });

  const px0 = x + 62;
  const px1 = x + PW - 30;
  const py0 = y + 92;
  const py1 = y + 290;
  const bandTop = py0 + 34;
  const bandBot = py1 - 42;
  ctx.fillStyle = rgba(C.bone, 0.06);
  ctx.fillRect(px0, bandTop, px1 - px0, bandBot - bandTop);
  ctx.strokeStyle = rgba(C.bone, 0.25);
  ctx.setLineDash([4, 4]);
  for (const by of [bandTop, bandBot]) {
    ctx.beginPath();
    ctx.moveTo(px0, by);
    ctx.lineTo(px1, by);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  drawRich(ctx, 'Typical PEM range ≈ 70–90 °C (U.S. DOE)', px1 - 6, bandTop + 18, { size: 13, family: MONO, color: rgba(C.muted, 1), align: 'right' });

  ctx.strokeStyle = rgba(C.bone, 0.7);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px0, py0 - 6);
  ctx.lineTo(px0, py1);
  ctx.lineTo(px1 + 6, py1);
  ctx.stroke();
  drawRich(ctx, 'T', px0 - 26, py0 + 8, { size: 16, family: MONO, color: C.text });
  drawRich(ctx, 'inlet', px0, py1 + 24, { size: 14, family: MONO, color: C.muted });
  drawRich(ctx, 'outlet', px1, py1 + 24, { size: 14, family: MONO, color: C.muted, align: 'right' });
  drawRich(ctx, 'channel position ->', (px0 + px1) / 2, py1 + 24, { size: 14, family: MONO, color: C.muted, align: 'center' });

  const heat = st.heat;
  const tIn = bandBot - 26;
  const tOut = tIn - (tIn - (bandTop + 26)) * heat;
  const draw = clamp(smooth(ramp(f, 580, 640)));
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const n = 40;
  for (let i = 0; i <= n * draw; i++) {
    const t = i / n;
    const px = px0 + (px1 - px0) * t;
    const py = tIn + (tOut - tIn) * (t * 0.85 + 0.15 * t * t);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  for (const [vx, vy, lab, show] of [
    [px0, tIn, 'T_{in}', 1],
    [px1, tOut, 'T_{out}', draw >= 0.999 ? 1 : 0],
  ] as [number, number, string, number][]) {
    if (!show) continue;
    ctx.fillStyle = C.violet;
    ctx.beginPath();
    ctx.arc(vx, vy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    drawRich(ctx, lab, vx + (vx === px0 ? 12 : -12), vy - 10, { size: 16, family: MONO, color: C.violet, align: vx === px0 ? 'left' : 'right' });
  }

  ctx.strokeStyle = rgba(C.bone, 0.2);
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 340);
  ctx.lineTo(x + PW - 22, y + 340);
  ctx.stroke();
  drawRich(ctx, '{.Q} = {.m} · c_p · (T_{out} − T_{in})', x + 22, y + 384, { size: 24, family: MONO, weight: 500, color: C.bone });
  drawRich(ctx, 'Energy balance on the circulating water:', x + 22, y + 418, { size: 15, color: C.muted });
  drawRich(ctx, 'heat carried out of the stack. No values implied.', x + 22, y + 440, { size: 15, color: C.muted });
  ctx.restore();
}
