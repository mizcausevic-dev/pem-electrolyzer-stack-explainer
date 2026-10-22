export const SANS = '"Space Grotesk", "Inter", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, "DejaVu Sans Mono", monospace';

type RunKind = 'normal' | 'sub' | 'sup' | 'arrow' | 'dot';
interface Run {
  kind: RunKind;
  text: string;
}

/**
 * Tiny markup for chemistry and math that renders the same in every font:
 *   H_2O   4H^+   4e^−   O_{2}   ->  (vector arrow)   {.Q}  (dot accent)
 * Subscripts, superscripts, and arrows are drawn by hand instead of relying on
 * Unicode glyph coverage in the web fonts.
 */
export function parseRich(src: string): Run[] {
  const runs: Run[] = [];
  let buf = '';
  const flush = () => {
    if (buf) runs.push({ kind: 'normal', text: buf });
    buf = '';
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if ((ch === '_' || ch === '^') && i + 1 < src.length) {
      flush();
      const kind: RunKind = ch === '_' ? 'sub' : 'sup';
      if (src[i + 1] === '{') {
        const end = src.indexOf('}', i + 2);
        runs.push({ kind, text: src.slice(i + 2, end) });
        i = end;
      } else {
        runs.push({ kind, text: src[i + 1] });
        i += 1;
      }
    } else if (ch === '-' && src[i + 1] === '>') {
      flush();
      runs.push({ kind: 'arrow', text: '' });
      i += 1;
    } else if (ch === '{' && src[i + 1] === '.') {
      flush();
      const end = src.indexOf('}', i + 2);
      runs.push({ kind: 'dot', text: src.slice(i + 2, end) });
      i = end;
    } else {
      buf += ch;
    }
  }
  flush();
  return runs;
}

export interface TextStyle {
  size: number;
  weight?: number;
  family?: string;
  color: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
}

const font = (s: TextStyle, scale = 1) => `${s.weight ?? 400} ${s.size * scale}px ${s.family ?? SANS}`;

export function measureRich(ctx: CanvasRenderingContext2D, src: string, s: TextStyle): number {
  let w = 0;
  for (const r of parseRich(src)) {
    if (r.kind === 'arrow') {
      w += s.size * 1.25;
      continue;
    }
    ctx.font = font(s, r.kind === 'sub' || r.kind === 'sup' ? 0.66 : 1);
    w += ctx.measureText(r.text).width + spacing(r.text, s);
  }
  return w;
}

const spacing = (t: string, s: TextStyle) => (s.letterSpacing ? s.letterSpacing * t.length : 0);

/** Draws rich text with alphabetic baseline at (x, y). Returns the drawn width. */
export function drawRich(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, s: TextStyle): number {
  const w = measureRich(ctx, src, s);
  let cx = x;
  if (s.align === 'center') cx = x - w / 2;
  else if (s.align === 'right') cx = x - w;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = s.color;
  ctx.strokeStyle = s.color;
  // When the context supports letterSpacing, measureText already includes it.
  const nativeSpacing = !!s.letterSpacing && 'letterSpacing' in ctx;
  if (nativeSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${s.letterSpacing}px`;

  for (const r of parseRich(src)) {
    if (r.kind === 'arrow') {
      const aw = s.size * 1.25;
      const ay = y - s.size * 0.32;
      ctx.lineWidth = Math.max(1, s.size * 0.075);
      ctx.beginPath();
      ctx.moveTo(cx + s.size * 0.18, ay);
      ctx.lineTo(cx + aw - s.size * 0.2, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + aw - s.size * 0.16, ay);
      ctx.lineTo(cx + aw - s.size * 0.42, ay - s.size * 0.17);
      ctx.lineTo(cx + aw - s.size * 0.42, ay + s.size * 0.17);
      ctx.closePath();
      ctx.fill();
      cx += aw;
      continue;
    }
    const small = r.kind === 'sub' || r.kind === 'sup';
    ctx.font = font(s, small ? 0.66 : 1);
    const dy = r.kind === 'sub' ? s.size * 0.24 : r.kind === 'sup' ? -s.size * 0.4 : 0;
    ctx.fillText(r.text, cx, y + dy);
    const tw = ctx.measureText(r.text).width + (nativeSpacing ? 0 : spacing(r.text, s));
    if (r.kind === 'dot') {
      ctx.beginPath();
      ctx.arc(cx + tw / 2, y - s.size * 0.86, Math.max(1, s.size * 0.065), 0, Math.PI * 2);
      ctx.fill();
    }
    cx += tw;
  }
  ctx.restore();
  return w;
}

/** Greedy word wrap for plain (non-markup) text. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, s: TextStyle, maxW: number): string[] {
  ctx.font = font(s);
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (measureRich(ctx, test, s) > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
