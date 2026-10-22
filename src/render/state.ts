import { ramp, smooth } from '../engine/math';
import { N_CELLS, Y, layerX } from './geometry';

/** Frame at which gas bubbles may first be born (power is already on). */
export const T_GAS = 352;
/** Water rise speed in the anode channels, world units per frame (illustrative). */
export const WATER_RISE = 2.0;

const MANIFOLD_START = 178;
const MANIFOLD_END = 206;
const MANIFOLD_X0 = -137;
const MANIFOLD_X1 = 92;

export interface FrameState {
  f: number;
  /** Oblique 3D depth of the exterior, 1 → 0 as the view flattens into a section. */
  depth: number;
  /** World y of the section sweep line; section is shown above it. */
  sweepY: number;
  sweepActive: number;
  manifoldFront: number;
  chanStart: number[];
  chanFront: number[];
  outFill: number;
  ptlWet: number[];
  power: number;
  gas: number;
  heat: number;
  loop: number;
  bop: { power: number; water: number; hydrogen: number; controls: number };
}

const chanStart: number[] = Array.from({ length: N_CELLS }, (_, i) => {
  const [a0, a1] = layerX(i, 'achan');
  const cx = (a0 + a1) / 2;
  return MANIFOLD_START + (MANIFOLD_END - MANIFOLD_START) * ((cx - MANIFOLD_X0) / (MANIFOLD_X1 - MANIFOLD_X0));
});

export function frameState(f: number): FrameState {
  const sweep = smooth(ramp(f, 20, 74));
  const firstTop = chanStart[0] + (Y.sealBot - Y.sealTop) / WATER_RISE;
  const lastTop = chanStart[N_CELLS - 1] + (Y.sealBot - Y.sealTop) / WATER_RISE;

  return {
    f,
    depth: 1 - smooth(ramp(f, 60, 96)),
    sweepY: Y.endTop - 12 + (Y.endBot - Y.endTop + 24) * sweep,
    sweepActive: sweep > 0 && sweep < 1 ? 1 : 0,
    manifoldFront: MANIFOLD_X0 + (MANIFOLD_X1 - MANIFOLD_X0) * ramp(f, MANIFOLD_START, MANIFOLD_END),
    chanStart,
    chanFront: chanStart.map((s) => (f < s ? Y.sealBot : Math.max(Y.sealTop, Y.sealBot - (f - s) * WATER_RISE))),
    outFill: smooth(ramp(f, firstTop - 4, lastTop + 8)),
    ptlWet: chanStart.map((s) => smooth(ramp(f, s + 50, s + 104))),
    power: smooth(ramp(f, 302, 326)),
    gas: smooth(ramp(f, T_GAS, T_GAS + 30)),
    heat: smooth(ramp(f, 524, 612)),
    loop: smooth(ramp(f, 652, 708)),
    bop: {
      power: smooth(ramp(f, 784, 812)),
      water: smooth(ramp(f, 820, 848)),
      hydrogen: smooth(ramp(f, 866, 894)),
      controls: smooth(ramp(f, 906, 934)),
    },
  };
}
