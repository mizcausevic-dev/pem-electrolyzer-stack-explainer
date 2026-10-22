export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number): number => (a === b ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a)));
export const smooth = (t: number): number => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

/** Linear 0→1 progress of frame `f` across [a, b]. */
export const ramp = (f: number, a: number, b: number): number => invLerp(a, b, f);

/** Smooth fade in across [a, b], hold, smooth fade out across [c, d]. */
export const fade = (f: number, a: number, b: number, c = Infinity, d = Infinity): number =>
  Math.min(smooth(ramp(f, a, b)), 1 - smooth(ramp(f, c, d)));

export const TAU = Math.PI * 2;

/** Positive modulo, safe for negative inputs. */
export const mod = (a: number, n: number): number => ((a % n) + n) % n;
