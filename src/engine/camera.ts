import { type Ease, inOutCubic, inOutQuint, inOutSine } from './easing';
import { clamp } from './math';

export interface Camera {
  /** World-space point at the center of the 1920×1080 logical frame. */
  x: number;
  y: number;
  /** Logical pixels per world unit. */
  z: number;
}

export interface CamKey extends Camera {
  f: number;
  /** Easing applied on the segment that ENDS at this key. */
  ease?: Ease;
}

/**
 * Camera path. World units: the stack is ~234 units wide, one repeating cell is
 * 30 units, and the full balance-of-plant layout spans roughly ±900 units.
 * Holds are consecutive keys with identical values.
 */
export const CAMERA_KEYS: CamKey[] = [
  // 01 · Reveal MEA & plates
  { f: 0, x: 34, y: 6, z: 2.12 },
  { f: 48, x: 0, y: -4, z: 2.5, ease: inOutSine },
  { f: 88, x: 0, y: -4, z: 2.5 },
  { f: 124, x: -15.5, y: 0, z: 26, ease: inOutQuint },
  // 02 · Water feed
  { f: 162, x: -15.5, y: 0, z: 26 },
  { f: 188, x: -50, y: 90, z: 10.5, ease: inOutCubic },
  { f: 236, x: -50, y: 90, z: 10.5 },
  { f: 274, x: -22, y: -20, z: 19, ease: inOutSine },
  // 03 · Gas evolution
  { f: 326, x: -22, y: -20, z: 19 },
  { f: 360, x: -12.6, y: -18, z: 150, ease: inOutQuint },
  { f: 440, x: -12.6, y: -18, z: 150 },
  { f: 484, x: -20, y: -92, z: 10.5, ease: inOutCubic },
  // 04 · Cooling
  { f: 520, x: -20, y: -92, z: 10.5 },
  { f: 574, x: 40, y: -12, z: 2.4, ease: inOutCubic },
  { f: 650, x: 40, y: -12, z: 2.4 },
  { f: 722, x: -215, y: 30, z: 1.6, ease: inOutQuint },
  // 05 · Balance of plant
  { f: 762, x: -215, y: 30, z: 1.6 },
  { f: 864, x: 0, y: 12, z: 0.98, ease: inOutCubic },
  { f: 1019, x: 0, y: 12, z: 0.98 },
];

/**
 * Interpolates zoom in log space and moves the center so that one world point
 * stays fixed on screen during the zoom (zoom-about-a-point). This keeps
 * macro-to-micro dives from "swinging" sideways, which linear center
 * interpolation does at high zoom ratios.
 */
export function cameraAt(f: number, keys: CamKey[] = CAMERA_KEYS): Camera {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y, z: keys[0].z };
  const lastKey = keys[keys.length - 1];
  if (f >= lastKey.f) return { x: lastKey.x, y: lastKey.y, z: lastKey.z };

  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].f <= f) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = clamp((f - a.f) / (b.f - a.f));
  const e = (b.ease ?? inOutSine)(t);

  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e);
  let w = e;
  if (Math.abs(Math.log(b.z / a.z)) > 0.05) {
    w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  }
  return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, z };
}

export const LOGICAL_W = 1920;
export const LOGICAL_H = 1080;

export interface ViewRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function viewRect(cam: Camera, w = LOGICAL_W, h = LOGICAL_H): ViewRect {
  const hw = w / 2 / cam.z;
  const hh = h / 2 / cam.z;
  return { x0: cam.x - hw, y0: cam.y - hh, x1: cam.x + hw, y1: cam.y + hh };
}

export function worldToScreen(cam: Camera, x: number, y: number, w = LOGICAL_W, h = LOGICAL_H): [number, number] {
  return [w / 2 + (x - cam.x) * cam.z, h / 2 + (y - cam.y) * cam.z];
}
