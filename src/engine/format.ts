import { Q, abs } from './q.js';

/** Formatierung von Zahlen und Brüchen als HTML (gestapelte Brüche, echtes Minuszeichen). */
export const MINUS = '−';
export const sg = (s: string | bigint | number): string => String(s).replace(/-/g, MINUS);
export const fracH = (num: string | bigint | number, den: string | bigint | number): string =>
  `<span class="frac"><span class="fn">${num}</span><span class="fd">${den}</span></span>`;

export function qH(x: Q, dec = false): string {
  if (dec && x.terminating()) return sg(x.toDec());
  if (x.d === 1n) return sg(x.n);
  return (x.n < 0n ? MINUS : '') + fracH(String(abs(x.n)), String(x.d));
}
/** Ganze Zahl in Klammern, wenn negativ. */
export const pn = (n: bigint): string => (n < 0n ? `(${MINUS}${-n})` : `${n}`);
/** Bruch in Klammern, wenn negativ. */
export const hb = (x: Q, dec = false): string => (x.sign() < 0 ? `(${qH(x, dec)})` : qH(x, dec));

export function mixedH(x: Q): string | null {
  const r = x.red();
  if (r.d === 1n || abs(r.n) < r.d) return null;
  const w = r.n / r.d;
  const rest = abs(r.n % r.d);
  return `${sg(w)}&#8202;${fracH(String(rest), String(r.d))}`;
}

export const OPS: Record<string, string> = { '+': '+', '-': MINUS, '*': '·', ':': ':' };
