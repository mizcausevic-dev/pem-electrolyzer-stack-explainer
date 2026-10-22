/** Brief palette: stage #0B1019, structure #344257, three explanatory accents. */
export const C = {
  stage: '#0B1019',
  stage2: '#0F1624',
  void: '#060A11',

  struct: '#344257',
  structHi: '#4B5D78',
  structLo: '#232D3D',
  steel: '#3B485B',
  steelHi: '#5A6A82',
  steelLo: '#2A3444',
  titanium: '#707C8D',
  titaniumLo: '#4D5868',
  carbon: '#262C36',
  carbonHi: '#3D4552',
  catalyst: '#121519',
  membrane: '#8E97A6',
  copper: '#8A6F58',
  copperLo: '#5F4B3C',
  frame: '#2A3343',
  frameHi: '#36425A',
  rubber: '#1A2029',

  bone: '#EAF0F7',
  text: '#C9D3E1',
  muted: '#8C99AD',
  faint: '#5B687C',

  cyan: '#00E5FF',
  gold: '#FFD166',
  violet: '#9D4EDD',
} as const;

const hexCache = new Map<string, [number, number, number]>();

function hexToRgb(hex: string): [number, number, number] {
  let v = hexCache.get(hex);
  if (!v) {
    const h = hex.replace('#', '');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    hexCache.set(hex, v);
  }
  return v;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

export function mix(hexA: string, hexB: string, t: number, a = 1): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const k = Math.max(0, Math.min(1, t));
  return `rgba(${Math.round(r1 + (r2 - r1) * k)},${Math.round(g1 + (g2 - g1) * k)},${Math.round(b1 + (b2 - b1) * k)},${a.toFixed(3)})`;
}

export type Accent = 'cyan' | 'gold' | 'violet' | 'hardware';

export const accentColor = (a: Accent): string => (a === 'hardware' ? C.structHi : C[a]);
