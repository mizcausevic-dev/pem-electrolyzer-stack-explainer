/**
 * World geometry of the generic stack (side elevation, stack axis horizontal,
 * anode on the left of each membrane). Units are arbitrary world units.
 * NOT TO SCALE: cell count is reduced and layer thicknesses are exaggerated
 * so every layer is legible. No dimension here is a real specification.
 */
export const N_CELLS = 6;
export const CELL_W = 30;
export const X0 = -92;

export const Y = {
  activeTop: -90,
  activeBot: 90,
  sealTop: -100,
  sealBot: 100,
  outManTop: -110,
  outManBot: -100,
  inManTop: 100,
  inManBot: 110,
  h2ManTop: -122,
  h2ManBot: -112,
  plateTop: -128,
  plateBot: 128,
  endTop: -150,
  endBot: 150,
  rod: 140,
} as const;

/** Layer offsets inside one repeating cell, left to right. */
export const L = {
  bpp: [0, 4],
  achan: [4, 9.5],
  ptl: [9.5, 14.5],
  acl: [14.5, 15.9],
  mem: [15.9, 18.5],
  ccl: [18.5, 19.9],
  gdl: [19.9, 24.5],
  cchan: [24.5, 30],
} as const;
export type LayerKey = keyof typeof L;

export const cellX = (i: number): number => X0 + i * CELL_W;
export const layerX = (i: number, k: LayerKey): [number, number] => [cellX(i) + L[k][0], cellX(i) + L[k][1]];

export const LAST_PLATE: [number, number] = [X0 + N_CELLS * CELL_W, X0 + N_CELLS * CELL_W + 4];
export const CC_L: [number, number] = [-95, -92];
export const CC_R: [number, number] = [92, 95];
export const END_L: [number, number] = [-117, -95];
export const END_R: [number, number] = [95, 117];

export const FOCUS_CELL = 2;
const mem = layerX(FOCUS_CELL, 'mem');
export const MEM_CX = (mem[0] + mem[1]) / 2;

export const PORT = {
  anodeIn: { x: -117, y: (Y.inManTop + Y.inManBot) / 2 },
  anodeOut: { x: -117, y: (Y.outManTop + Y.outManBot) / 2 },
  h2: { x: 117, y: (Y.h2ManTop + Y.h2ManBot) / 2 },
  plus: { x: (CC_L[0] + CC_L[1]) / 2, y: -170 },
  minus: { x: (CC_R[0] + CC_R[1]) / 2, y: -170 },
} as const;

/** Stack bounding box used by the locator inset. */
export const STACK_BOUNDS = { x0: -135, y0: -175, x1: 135, y1: 160 };
