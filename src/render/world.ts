import type { Camera, ViewRect } from '../engine/camera';
import { clamp } from '../engine/math';
import type { FrameState } from './state';

/** World-space draw context. The canvas transform maps world units to device pixels. */
export interface W {
  ctx: CanvasRenderingContext2D;
  cam: Camera;
  view: ViewRect;
  /** World units per logical pixel (1 / cam.z). Use for zoom-independent line widths. */
  px: number;
  st: FrameState;
  f: number;
}

export const hit = (w: W, x0: number, y0: number, x1: number, y1: number): boolean =>
  !(x1 < w.view.x0 || x0 > w.view.x1 || y1 < w.view.y0 || y0 > w.view.y1);

export function box(w: W, x0: number, y0: number, x1: number, y1: number, fill: string | CanvasGradient): void {
  if (!hit(w, x0, y0, x1, y1)) return;
  w.ctx.fillStyle = fill;
  w.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

export function outline(w: W, x0: number, y0: number, x1: number, y1: number, color: string, lwPx = 1): void {
  if (!hit(w, x0, y0, x1, y1)) return;
  w.ctx.strokeStyle = color;
  w.ctx.lineWidth = lwPx * w.px;
  w.ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
}

/**
 * Section hatching anchored to world coordinates. Spacing targets `spacingPx`
 * on screen; two power-of-two levels crossfade so lines never pop or swim
 * while the camera zooms.
 */
export function hatch(
  w: W,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  opts: { spacingPx?: number; lwPx?: number; dir?: 1 | -1; alpha?: number } = {},
): void {
  if (!hit(w, x0, y0, x1, y1)) return;
  const { spacingPx = 7, lwPx = 0.8, dir = 1, alpha = 1 } = opts;
  const cx0 = Math.max(x0, w.view.x0);
  const cy0 = Math.max(y0, w.view.y0);
  const cx1 = Math.min(x1, w.view.x1);
  const cy1 = Math.min(y1, w.view.y1);
  const k = Math.log2(spacingPx * w.px);
  const kf = Math.floor(k);
  const s0 = Math.pow(2, kf);
  const t = k - kf;
  const step = s0 * Math.SQRT2;
  const ctx = w.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx0, cy0, cx1 - cx0, cy1 - cy0);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = lwPx * w.px;
  const cMin = dir > 0 ? cy0 - cx1 : cy0 + cx0;
  const cMax = dir > 0 ? cy1 - cx0 : cy1 + cx1;
  const nMin = Math.floor(cMin / step);
  const nMax = Math.ceil(cMax / step);
  for (const pass of [0, 1]) {
    ctx.globalAlpha = alpha * (pass === 0 ? 1 : clamp(1 - t));
    ctx.beginPath();
    for (let n = nMin; n <= nMax; n++) {
      const even = (n & 1) === 0;
      if ((pass === 0) !== even) continue;
      const c = n * step;
      if (dir > 0) {
        ctx.moveTo(cx0, cx0 + c);
        ctx.lineTo(cx1, cx1 + c);
      } else {
        ctx.moveTo(cx0, -cx0 + c);
        ctx.lineTo(cx1, -cx1 + c);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function line(w: W, pts: [number, number][], color: string, lwPx = 1, dash?: number[], dashOffsetPx = 0): void {
  const ctx = w.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = lwPx * w.px;
  ctx.setLineDash(dash ? dash.map((d) => d * w.px) : []);
  ctx.lineDashOffset = dashOffsetPx * w.px;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

export function circle(w: W, x: number, y: number, r: number, fill?: string, stroke?: string, lwPx = 1): void {
  const ctx = w.ctx;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lwPx * w.px;
    ctx.stroke();
  }
}

/** Arrowhead at (x, y) pointing along angle `a`, size in logical pixels. */
export function arrowHead(w: W, x: number, y: number, a: number, sizePx: number, color: string): void {
  const s = sizePx * w.px;
  const ctx = w.ctx;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
  ctx.lineTo(x + Math.cos(a + 2.5) * s, y + Math.sin(a + 2.5) * s);
  ctx.lineTo(x + Math.cos(a - 2.5) * s, y + Math.sin(a - 2.5) * s);
  ctx.closePath();
  ctx.fill();
}

/** Screen-scale chevron used for flow direction (not a particle). */
export function chevron(w: W, x: number, y: number, a: number, sizePx: number, color: string, lwPx = 1.6): void {
  const s = sizePx * w.px;
  const ctx = w.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = lwPx * w.px;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + 2.4) * s, y + Math.sin(a + 2.4) * s);
  ctx.lineTo(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4);
  ctx.lineTo(x + Math.cos(a - 2.4) * s, y + Math.sin(a - 2.4) * s);
  ctx.stroke();
}

/** 0 → 1 as zoom passes from z0 to z1 (logarithmic), for level-of-detail fades. */
export const lod = (w: W, z0: number, z1: number): number => {
  const t = (Math.log(w.cam.z) - Math.log(z0)) / (Math.log(z1) - Math.log(z0));
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
