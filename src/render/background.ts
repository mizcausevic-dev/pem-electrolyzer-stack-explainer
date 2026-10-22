import { C, rgba } from './palette';
import type { W } from './world';

export function drawBackdrop(ctx: CanvasRenderingContext2D, lw: number, lh: number): void {
  ctx.fillStyle = C.stage;
  ctx.fillRect(0, 0, lw, lh);
  const g = ctx.createRadialGradient(lw * 0.5, lh * 0.48, lh * 0.1, lw * 0.5, lh * 0.5, lw * 0.62);
  g.addColorStop(0, rgba(C.stage2, 1));
  g.addColorStop(1, rgba(C.void, 0.9));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, lw, lh);
}

/**
 * Faint registration crosses anchored to world space. They make camera moves
 * and scale changes legible without adding moving decoration. Two spacing
 * levels crossfade so marks never pop during zooms. Deliberately crosses, not
 * a full grid: grid paper is reserved for math and diagram panels.
 */
export function drawRegistration(w: W): void {
  const { ctx, view } = w;
  const k = Math.log2(64 * w.px);
  const kf = Math.floor(k);
  const t = k - kf;
  const arm = 4 * w.px;
  ctx.lineWidth = 1 * w.px;
  for (const [s, alpha] of [
    [Math.pow(2, kf), 0.11 * (1 - t)],
    [Math.pow(2, kf + 1), 0.11],
  ] as [number, number][]) {
    if (alpha < 0.005) continue;
    ctx.strokeStyle = rgba(C.structHi, alpha);
    ctx.beginPath();
    for (let gx = Math.floor(view.x0 / s); gx <= Math.ceil(view.x1 / s); gx++) {
      for (let gy = Math.floor(view.y0 / s); gy <= Math.ceil(view.y1 / s); gy++) {
        const x = gx * s;
        const y = gy * s;
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
      }
    }
    ctx.stroke();
  }
}
