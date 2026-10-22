/**
 * Stateless hash to [0, 1). Every "random" value in the film is derived from
 * integer seeds through this function, so frame N renders identically on every
 * run, machine, and capture pass. Never call Math.random() in render code.
 */
export function hash(a: number, b = 0, c = 0): number {
  let h = 0x811c9dc5 ^ Math.imul(a | 0, 0x9e3779b1);
  h = Math.imul(h ^ (b | 0), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h ^ (c | 0), 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Signed variant in [-1, 1). */
export const shash = (a: number, b = 0, c = 0): number => hash(a, b, c) * 2 - 1;
