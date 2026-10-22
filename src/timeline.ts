export const TOTAL_FRAMES = 1020;
export const FPS = 30;
export const DURATION_S = TOTAL_FRAMES / FPS; // 34

export interface Chapter {
  id: string;
  index: number;
  start: number;
  end: number; // exclusive
  title: string;
  short: string;
  cameraNote: string;
  scaleNote: string;
  causalFrom: string;
  causalTo: string;
  narration: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: "reveal",
    index: 0,
    start: 0,
    end: 150,
    title: "Reveal: MEA and plates",
    short: "01 · MEA & PLATES",
    cameraNote: "Slow push-in, wide stack to sectional close-up",
    scaleNote: "SCHEMATIC SECTION · NOT TO SCALE",
    causalFrom: "Stack hardware",
    causalTo: "Where the reaction can happen",
    narration:
      "A generic PEM electrolyzer stack is a repeating sandwich. End plates and tie rods hold compression. Inside, each cell repeats: bipolar plate, porous transport layer, catalyst layer, membrane, catalyst layer, porous transport layer. The membrane electrode assembly, the MEA, is where water, protons, and electrons are sorted.",
  },
  {
    id: "water",
    index: 1,
    start: 150,
    end: 300,
    title: "Water feed",
    short: "02 · WATER FEED",
    cameraNote: "Lateral track along the inlet manifold to the anode",
    scaleNote: "TIME COMPRESSION · FLOW SHOWN SCHEMATICALLY",
    causalFrom: "MEA revealed",
    causalTo: "Reactant delivered to the anode",
    narration:
      "Deionized water is pumped to the anode side of each cell. Manifolds distribute it across the flow field so every cell in the stack sees feed, not just the first one. No water at the anode, no reaction downstream. This feed is the causal input for everything that follows.",
  },
  {
    id: "gas",
    index: 2,
    start: 300,
    end: 510,
    title: "Gas evolution",
    short: "03 · GAS EVOLUTION",
    cameraNote: "Dive from plate scale to the membrane interface",
    scaleNote: "SCALE CHANGE: MACRO TO MICRO · SLOW MOTION · BUBBLE SIZE EXAGGERATED",
    causalFrom: "Water at the anode + DC power",
    causalTo: "Oxygen, protons, electrons, then hydrogen",
    narration:
      "At the anode catalyst, water splits: 2H2O becomes O2 plus 4H+ plus 4 electrons. Protons cross the hydrated membrane. Electrons cannot. They take the external circuit, which is the useful work the power supply does. At the cathode, 4H+ plus 4 electrons become 2H2. Oxygen leaves with excess water on the anode side. Hydrogen leaves on the cathode side. The gases never need to meet.",
  },
  {
    id: "cooling",
    index: 3,
    start: 510,
    end: 750,
    title: "Cooling",
    short: "04 · COOLING",
    cameraNote: "Rise and pull back from MEA to plate and coolant loop",
    scaleNote: "SCHEMATIC TRACE · NO MEASURED DATA SHOWN",
    causalFrom: "Reaction running",
    causalTo: "Heat removed, temperature held in range",
    narration:
      "Not all input energy leaves as chemical energy in hydrogen. Part becomes heat in the stack. Coolant channels, often integrated into or routed alongside the bipolar plates, carry that heat to an external exchanger. Temperature sensors feed a controller that adjusts coolant flow. Hold temperature steady and the membrane, seals, and catalysts age on a predictable curve instead of a fast one.",
  },
  {
    id: "bop",
    index: 4,
    start: 750,
    end: 1020,
    title: "Balance of plant",
    short: "05 · BALANCE OF PLANT",
    cameraNote: "Pull back to the complete system, then settle",
    scaleNote: "FULL SYSTEM · ALL LOOPS SHOWN SIMULTANEOUSLY",
    causalFrom: "Stack cooled and producing",
    causalTo: "A system that can run unattended",
    narration:
      "The stack is only the middle of the plant. Around it: a DC power supply, water purification and pumping, gas liquid separation on both outlets, hydrogen drying, cooling, sensors, and controls. The balance of plant is what turns a good cell reaction into a system that starts, runs, protects itself, and shuts down cleanly.",
  },
];

export function chapterAt(frame: number): Chapter {
  const f = clampFrame(frame);
  for (const c of CHAPTERS) if (f >= c.start && f < c.end) return c;
  return CHAPTERS[CHAPTERS.length - 1];
}

export function clampFrame(f: number): number {
  if (!Number.isFinite(f)) return 0;
  return Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(f)));
}

/** Local progress 0..1 inside the chapter that owns `frame`. */
export function chapterProgress(frame: number): number {
  const c = chapterAt(frame);
  return (clampFrame(frame) - c.start) / (c.end - c.start);
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep easing. Deliberate, no overshoot, camera-safe. */
export const ease = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeInOut = ease;
/** Fade in over [a,b], hold, fade out over [c,d], all in local progress units. */
export function window(p: number, a: number, b: number, c: number, d: number): number {
  return clamp01((p - a) / Math.max(1e-6, b - a)) * (1 - clamp01((p - c) / Math.max(1e-6, d - c)));
}

/**
 * Deterministic pseudo-random in [0,1) from integer seeds.
 * Same input, same output, on every machine. No Math.random anywhere in render.
 */
export function hash01(seed: number): number {
  let h = (seed | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export interface Camera { cx: number; cy: number; scale: number }

/**
 * One camera key per chapter boundary. The camera eases between keys
 * across the first 55% of each chapter, then holds. Deliberate moves,
 * no handheld noise, so the causal subject stays readable.
 */
const CAM_KEYS: Camera[] = [
  { cx: 640, cy: 350, scale: 0.82 }, // reveal start, wide
  { cx: 640, cy: 340, scale: 1.12 }, // reveal end / water start
  { cx: 470, cy: 330, scale: 1.18 }, // water: tracked left to manifold
  { cx: 640, cy: 330, scale: 1.9 },  // gas: micro dive on MEA
  { cx: 640, cy: 335, scale: 1.05 }, // cooling: back to plate scale
  { cx: 640, cy: 345, scale: 0.78 }, // bop: full system
];

export function cameraAt(frame: number): Camera {
  const f = clampFrame(frame);
  const c = chapterAt(f);
  const p = chapterProgress(f);
  const from = CAM_KEYS[c.index];
  const to = CAM_KEYS[c.index + 1];
  const t = ease(clamp01(p / 0.55));
  if (c.index === CHAPTERS.length - 1) {
    // Final chapter: settle early, then hold a stable complete-system view.
    const s = ease(clamp01(p / 0.4));
    return { cx: lerp(from.cx, to.cx, s), cy: lerp(from.cy, to.cy, s), scale: lerp(from.scale, to.scale, s) };
  }
  return { cx: lerp(from.cx, to.cx, t), cy: lerp(from.cy, to.cy, t), scale: lerp(from.scale, to.scale, t) };
}

export function timecode(frame: number): string {
  const f = clampFrame(frame);
  const s = f / FPS;
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  const ff = (f % FPS).toString().padStart(2, "0");
  return `${mm}:${ss}:${ff}`;
}
