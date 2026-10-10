/* ===== Antworten zum Klicken, Zeichnen und Auswählen ===== */
// Ein Widget schreibt seine Antwort als Zahl in dasselbe Eingabefeld wie das Tippen.
// So prüfen Üben, Klassenarbeit und Einstufungstest alles auf dieselbe Weise.
import { q, type Q } from './engine/index.js';

export interface GridPoint { x: number; y: number; label: string }
export type MirrorAxis = { dir: 'v'; at: number } | { dir: 'h'; at: number } | { dir: 'p'; x: number; y: number };
export type Widget =
  /** Punkt ins Koordinatensystem setzen. `poly` verbindet die gegebenen Punkte und den neuen Punkt zu einer Figur. */
  | { kind: 'point'; min: number; max: number; pts: GridPoint[]; label: string; poly?: boolean }
  /** Kästchen anmalen, bis die Figur symmetrisch ist. */
  | { kind: 'mirror'; w: number; h: number; axis: MirrorAxis; given: number[] }
  /** Winkel mit dem Geodreieck zeichnen. */
  | { kind: 'angle'; max: 180 | 360 }
  /** Eine von mehreren Abbildungen auswählen. */
  | { kind: 'pick'; options: string[] };

/* Punkte: (x|y) wird zu einer ganzen Zahl, damit die Recheneinheit vergleichen kann. */
export const encodePoint = (x: number, y: number): number => (x + 50) * 1000 + (y + 50);
export const decodePoint = (v: number): [number, number] => [Math.floor(v / 1000) - 50, (v % 1000) - 50];
export const pointH = (x: number, y: number) => `(${String(x).replace('-', '−')}&#8239;|&#8239;${String(y).replace('-', '−')})`;

/* Spiegeln: angemalte Kästchen als Bitmuster */
export const cellsValue = (cells: number[]): bigint => cells.reduce((a, c) => a | (1n << BigInt(c)), 0n);
export const valueCells = (v: bigint): number[] => { const out: number[] = []; for (let i = 0; v >> BigInt(i); i++) if ((v >> BigInt(i)) & 1n) out.push(i); return out; };

/** Wohin ein Kästchen beim Spiegeln wandert (null = außerhalb des Gitters). */
export function mirrorCell(c: number, w: number, h: number, a: MirrorAxis): number | null {
  const x = c % w, y = Math.floor(c / w);
  const [mx, my] = a.dir === 'v' ? [2 * a.at - 1 - x, y] : a.dir === 'h' ? [x, 2 * a.at - 1 - y] : [2 * a.x - 1 - x, 2 * a.y - 1 - y];
  return mx < 0 || my < 0 || mx >= w || my >= h ? null : my * w + mx;
}
/** Die Kästchen, die noch angemalt werden müssen. */
export function mirrorAnswer(w: Extract<Widget, { kind: 'mirror' }>): number[] {
  const set = new Set(w.given);
  const out = new Set<number>();
  for (const c of w.given) { const m = mirrorCell(c, w.w, w.h, w.axis); if (m !== null && !set.has(m)) out.add(m); }
  return [...out].sort((a, b) => a - b);
}

/** Kleines Bild vom Gitter, z. B. für die Lösung. */
export function mirrorSVG(w: Extract<Widget, { kind: 'mirror' }>, added: number[] = [], size = 18): string {
  const W = w.w * size, H = w.h * size;
  let cells = '';
  for (let c = 0; c < w.w * w.h; c++) {
    const x = (c % w.w) * size, y = Math.floor(c / w.w) * size;
    const cls = w.given.includes(c) ? 'given' : added.includes(c) ? 'added' : '';
    cells += `<rect class="mc ${cls}" x="${x}" y="${y}" width="${size}" height="${size}" />`;
  }
  return `<svg class="mirror-svg" viewBox="-2 -2 ${W + 4} ${H + 4}" role="img" aria-label="Lösung: die gespiegelte Figur">${cells}${axisSVG(w.axis, size, W, H)}</svg>`;
}
export function axisSVG(a: MirrorAxis, s: number, W: number, H: number): string {
  if (a.dir === 'v') return `<line class="axis" x1="${a.at * s}" y1="-2" x2="${a.at * s}" y2="${H + 2}" />`;
  if (a.dir === 'h') return `<line class="axis" x1="-2" y1="${a.at * s}" x2="${W + 2}" y2="${a.at * s}" />`;
  return `<circle class="axis-pt" cx="${a.x * s}" cy="${a.y * s}" r="${s / 5}" />`;
}

/* Würfelnetze: Ein Netz ist ein Würfel, wenn beim Abrollen jedes Feld auf einer anderen Würfelseite landet. */
export type Cell = [number, number];
export function isCubeNet(cells: Cell[]): boolean {
  if (cells.length !== 6) return false;
  const key = (c: Cell) => `${c[0]},${c[1]}`;
  const has = new Set(cells.map(key));
  const seen = new Map<string, number>();
  type O = { B: number; T: number; N: number; S: number; E: number; W: number };
  const roll: Record<string, (o: O) => O> = {
    '1,0': o => ({ ...o, B: o.E, T: o.W, E: o.T, W: o.B }),
    '-1,0': o => ({ ...o, B: o.W, T: o.E, W: o.T, E: o.B }),
    '0,-1': o => ({ ...o, B: o.N, T: o.S, N: o.T, S: o.B }),
    '0,1': o => ({ ...o, B: o.S, T: o.N, S: o.T, N: o.B }),
  };
  const stack: [Cell, O][] = [[cells[0], { B: 0, T: 1, N: 2, S: 3, E: 4, W: 5 }]];
  while (stack.length) {
    const [c, o] = stack.pop()!;
    if (seen.has(key(c))) continue;
    seen.set(key(c), o.B);
    for (const d of Object.keys(roll)) {
      const [dx, dy] = d.split(',').map(Number);
      const n: Cell = [c[0] + dx, c[1] + dy];
      if (has.has(key(n)) && !seen.has(key(n))) stack.push([n, roll[d](o)]);
    }
  }
  return seen.size === 6 && new Set(seen.values()).size === 6;
}
/** Zufällige zusammenhängende Figur aus 6 Quadraten. */
export function randomHexomino(): Cell[] {
  const cells: Cell[] = [[0, 0]];
  const key = (c: Cell) => `${c[0]},${c[1]}`;
  while (cells.length < 6) {
    const [x, y] = cells[Math.floor(Math.random() * cells.length)];
    const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
    const n: Cell = [x + d[0], y + d[1]];
    if (!cells.some(c => key(c) === key(n))) cells.push(n);
  }
  return normCells(cells);
}
export function normCells(cells: Cell[]): Cell[] {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
export const cellsKey = (cells: Cell[]) => normCells(cells).map(c => c.join(',')).join(';');
export const has2x2 = (cells: Cell[]) => cells.some(([x, y]) => [[x + 1, y], [x, y + 1], [x + 1, y + 1]].every(([a, b]) => cells.some(c => c[0] === a && c[1] === b)));
export function netSVG(cells: Cell[], s = 22): string {
  const W = (Math.max(...cells.map(c => c[0])) + 1) * s, H = (Math.max(...cells.map(c => c[1])) + 1) * s;
  return `<svg class="net" viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}" aria-hidden="true">${cells.map(([x, y]) => `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}" />`).join('')}</svg>`;
}

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Wie die Antwort in der Auswertung angezeigt wird. */
export function answerLabel(w: Widget | undefined, input: string): string {
  const s = input.trim();
  if (!w || !s) return s;
  if (w.kind === 'point') { const [x, y] = decodePoint(Number(s)); return `Punkt ${pointH(x, y)}`.replace(/&#8239;/g, ' '); }
  if (w.kind === 'angle') return `${s}°`;
  if (w.kind === 'pick') return LETTERS[Number(s) - 1] ?? s;
  return 'deine Zeichnung';
}
export const qBig = (v: bigint): Q => q(v);
