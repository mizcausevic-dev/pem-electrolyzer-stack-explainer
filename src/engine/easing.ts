export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const inOutSine: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const inOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const inOutQuint: Ease = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
export const outCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const outExpo: Ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
