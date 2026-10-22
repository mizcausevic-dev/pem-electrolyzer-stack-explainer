import { type Camera, LOGICAL_H, LOGICAL_W, cameraAt, viewRect } from '../engine/camera';
import { clamp } from '../engine/math';
import { LAST_FRAME } from '../engine/timeline';
import { drawBackdrop, drawRegistration } from './background';
import { drawBop } from './bop';
import { drawBadges, drawBreadcrumb, drawFooter, drawHeader, drawLegend, drawLocator, drawScrims } from './hud';
import { drawLabels } from './labels';
import { drawMicro } from './micro';
import { C, rgba } from './palette';
import { drawChargePanel, drawEquationPanel, drawTemperaturePanel } from './panels';
import { drawBubbles, drawChargePaths, drawHeat, drawStack } from './stack';
import { type FrameState, frameState } from './state';
import { MONO, drawRich } from './text';
import type { W } from './world';

export interface RenderOptions {
  /** Device pixels per logical pixel. */
  scale: number;
  /** Logical frame size. Defaults to 1920×1080. */
  lw?: number;
  lh?: number;
  /** Override the timeline camera (used for the hero image). */
  camera?: Camera;
  /** Draw captions, labels, panels, and badges. */
  hud?: boolean;
}

function drawWorld(ctx: CanvasRenderingContext2D, f: number, cam: Camera, st: FrameState, s: number, lw: number, lh: number): void {
  ctx.save();
  ctx.setTransform(s * cam.z, 0, 0, s * cam.z, s * (lw / 2 - cam.x * cam.z), s * (lh / 2 - cam.y * cam.z));
  const w: W = { ctx, cam, view: viewRect(cam, lw, lh), px: 1 / cam.z, st, f };
  drawRegistration(w);
  drawBop(w);
  drawStack(w);
  drawHeat(w);
  drawBubbles(w);
  drawChargePaths(w);
  drawMicro(w);
  ctx.restore();
}

/**
 * Pure function of the frame index: the same frame always produces the same
 * pixels. No wall-clock time, no Math.random, no accumulated state.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, frame: number, opts: RenderOptions): void {
  const f = clamp(Math.round(frame), 0, LAST_FRAME);
  const s = opts.scale;
  const lw = opts.lw ?? LOGICAL_W;
  const lh = opts.lh ?? LOGICAL_H;
  const cam = opts.camera ?? cameraAt(f);
  const st = frameState(f);

  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawBackdrop(ctx, lw, lh);
  drawWorld(ctx, f, cam, st, s, lw, lh);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  if (opts.hud === false) return;

  drawScrims(ctx);
  drawLabels(ctx, cam, f, st, lw, lh);
  drawChargePanel(ctx, f);
  drawEquationPanel(ctx, f);
  drawTemperaturePanel(ctx, st);
  drawHeader(ctx, f);
  drawBadges(ctx, f);
  drawLegend(ctx, f);
  drawBreadcrumb(ctx, cam);
  drawLocator(ctx, cam, f);
  drawFooter(ctx, f);
}

/** Hero / social card: 1920×1008 logical (1.905:1), rendered at any scale. */
export const HERO_W = 1920;
export const HERO_H = 1008;

export function renderHero(ctx: CanvasRenderingContext2D, scale: number): void {
  const lw = HERO_W;
  const lh = HERO_H;
  const f = 478;
  const cam: Camera = { x: -38, y: -58, z: 8.2 };
  const st = frameState(f);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawBackdrop(ctx, lw, lh);
  drawWorld(ctx, f, { ...cam, x: cam.x - 52 }, st, scale, lw, lh);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const g = ctx.createLinearGradient(0, 0, 980, 0);
  g.addColorStop(0, rgba(C.stage, 0.97));
  g.addColorStop(0.62, rgba(C.stage, 0.9));
  g.addColorStop(1, rgba(C.stage, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 980, lh);

  const x = 96;
  drawRich(ctx, 'GENERIC PEM · ANATOMY EXPLAINER · BUILT IN CODE', x, 210, { size: 20, family: MONO, weight: 600, color: C.cyan, letterSpacing: 2 });
  drawRich(ctx, 'Inside a PEM', x, 318, { size: 92, weight: 700, color: C.bone });
  drawRich(ctx, 'electrolyzer stack', x, 418, { size: 92, weight: 700, color: C.bone });
  drawRich(ctx, 'Water in, O_2 out, protons across, H_2 out.', x, 494, { size: 34, weight: 500, color: C.text });
  drawRich(ctx, 'One deterministic timeline: 34 s · 30 fps · 1,020 frames.', x, 540, { size: 28, weight: 400, color: C.muted });

  const items: [string, string][] = [
    [C.cyan, 'Water, protons, product gas'],
    [C.gold, 'DC power, electrons, heat'],
    [C.violet, 'Sensing, gas formation'],
  ];
  let ly = 640;
  for (const [col, label] of items) {
    ctx.fillStyle = col;
    ctx.fillRect(x, ly - 12, 30, 5);
    drawRich(ctx, label, x + 44, ly, { size: 24, weight: 500, color: C.text });
    ly += 44;
  }
  drawRich(ctx, 'Illustrative schematic · not to scale · not a certified engineering reference', x, lh - 72, {
    size: 17,
    family: MONO,
    color: rgba(C.muted, 1),
  });
}
