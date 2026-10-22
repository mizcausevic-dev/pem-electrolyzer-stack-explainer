import { parseRich } from '../render/text.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Converts the canvas rich-text markup (H_2O, 4H^+, ->, {.Q}) to HTML. */
export function richToHtml(src: string): string {
  return parseRich(src)
    .map((r) => {
      switch (r.kind) {
        case 'sub':
          return `<sub>${esc(r.text)}</sub>`;
        case 'sup':
          return `<sup>${esc(r.text)}</sup>`;
        case 'arrow':
          return '→';
        case 'dot':
          return `${esc(r.text)}&#775;`;
        default:
          return esc(r.text);
      }
    })
    .join('');
}

/** Same markup flattened to plain Unicode for meta tags and JSON-LD. */
export function richToText(src: string): string {
  const subs: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄' };
  const sups: Record<string, string> = { '+': '⁺', '−': '⁻', '-': '⁻' };
  return parseRich(src)
    .map((r) => {
      if (r.kind === 'sub') return [...r.text].map((c) => subs[c] ?? c).join('');
      if (r.kind === 'sup') return [...r.text].map((c) => sups[c] ?? c).join('');
      if (r.kind === 'arrow') return '→';
      return r.text;
    })
    .join('');
}
