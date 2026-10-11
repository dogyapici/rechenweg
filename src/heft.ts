/**
 * „So schreibst du es ins Heft“: Rechenwege so, wie sie auf kariertem Papier stehen.
 * Eine Ziffer pro Kästchen, Komma unter Komma, Überträge klein. Jeder Schritt hält
 * den ganzen Seitenstand fest, damit die Ansicht Zeile für Zeile vorrechnen kann.
 * Alle Zahlen kommen aus exakten Rechnungen (BigInt), nichts wird geraten.
 */
import { evalExpr, gcd, q, qH, type Q, type Solution } from './engine/index.js';

export interface HCell {
  t: string;
  /** Strich unter dem Kästchen (Summenstrich oder Bruchstrich) */
  u?: boolean;
  /** kleine Schrift (Randnotiz) */
  s?: boolean;
  /** Strich über der Ziffer (Periode) */
  o?: boolean;
  /** Komma unten rechts an dieser Ziffer (bei der Division ohne eigenes Kästchen) */
  cm?: boolean;
  /** halbes Kästchen nach unten: Rechenzeichen zwischen Zähler- und Nennerzeile */
  mid?: boolean;
  /** Übertrag: kleine Ziffer unten links im Kästchen */
  carry?: string;
  /** Farbe: Hinweis (grau) */
  c?: 'carry' | 'note';
}
export type HeftBlock = { kind: 'grid'; rows: (HCell | null)[][] } | { kind: 'text'; lines: { html: string; note?: string }[] };
export interface HeftStep { say: string; blocks: HeftBlock[] }
export interface Heft { title: string; steps: HeftStep[] }

const MINUS = '−';
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Ein Kästchen-Raster, in das man wie ins Heft schreibt. */
export class Grid {
  rows: (HCell | null)[][] = [];
  /** Wird links zu wenig Platz, rückt alles nach rechts. */
  private off = 0;
  private at(r: number, c: number): HCell {
    c += this.off;
    if (c < 0) { const k = -c; this.rows.forEach(row => row.unshift(...Array<null>(k).fill(null))); this.off += k; c = 0; }
    while (this.rows.length <= r) this.rows.push([]);
    const row = this.rows[r];
    while (row.length <= c) row.push(null);
    if (!row[c]) row[c] = { t: '' };
    return row[c]!;
  }
  /** Text ab Spalte c, ein Zeichen pro Kästchen. */
  put(r: number, c: number, text: string, o: Omit<HCell, 't'> = {}) {
    [...text].forEach((ch, i) => Object.assign(this.at(r, c + i), { t: ch }, o));
    return this;
  }
  /** Text so schreiben, dass das letzte Zeichen in Spalte end steht. */
  putR(r: number, end: number, text: string, o: Omit<HCell, 't'> = {}) { return this.put(r, end - [...text].length + 1, text, o); }
  under(r: number, c0: number, c1: number) { for (let c = c0; c <= c1; c++) this.at(r, c).u = true; return this; }
  mark(r: number, c: number, o: Omit<HCell, 't'>) { Object.assign(this.at(r, c), o); return this; }
}

export class HeftBuilder {
  private blocks: (Grid | { kind: 'text'; lines: { html: string; note?: string }[] })[] = [];
  private steps: HeftStep[] = [];
  constructor(private title: string) {}
  grid(): Grid { const g = new Grid(); this.blocks.push(g); return g; }
  text(html: string, note?: string) {
    const last = this.blocks[this.blocks.length - 1];
    if (last && !(last instanceof Grid)) last.lines.push({ html, note });
    else this.blocks.push({ kind: 'text', lines: [{ html, note }] });
    return this;
  }
  /** Fertige Nebenrechnung (letzter Stand einer anderen Heft-Rechnung) einfügen. */
  embed(h: Heft) {
    const last = h.steps[h.steps.length - 1];
    for (const b of last.blocks) { if (b.kind === 'grid') { const g = this.grid(); g.rows = clone(b.rows); } }
    this.newText();
    return this;
  }
  /** Zeile ganz oben auf der Seite (z. B. eine Nebenrechnung, die man vorher macht). */
  top(html: string, note?: string) {
    const first = this.blocks[0];
    if (first && !(first instanceof Grid)) first.lines.push({ html, note });
    else this.blocks.unshift({ kind: 'text', lines: [{ html, note }] });
    return this;
  }
  /** Neuer Textabschnitt, auch wenn davor schon Text steht. */
  newText() { this.blocks.push({ kind: 'text', lines: [] }); return this; }
  snap(say: string) {
    this.steps.push({ say, blocks: clone(this.blocks.map(b => (b instanceof Grid ? { kind: 'grid' as const, rows: b.rows } : b))) });
    return this;
  }
  done(): Heft { return { title: this.title, steps: this.steps }; }
}

/* ---------- Zahlen zerlegen ---------- */
interface Num { digits: string; k: number } // Ziffern ohne Komma, Anzahl Nachkommastellen
function num(s: string): Num {
  const t = s.trim().replace('.', ',');
  const i = t.indexOf(',');
  return i < 0 ? { digits: t.replace(/^0+(?=\d)/, ''), k: 0 } : { digits: (t.slice(0, i) + t.slice(i + 1)).replace(/^0+(?=\d)/, '') || '0', k: t.length - i - 1 };
}
/** Ziffernfolge mit k Nachkommastellen als Text (mit Komma). */
function withComma(digits: string, k: number): string {
  if (k === 0) return digits;
  const d = digits.padStart(k + 1, '0');
  return d.slice(0, d.length - k) + ',' + d.slice(d.length - k);
}
const isNum = (s: string) => /^\d+(,\d+)?$/.test(s.trim());

/* ---------- Schriftlich addieren und subtrahieren ---------- */
export function heftAddSub(aS: string, bS: string, op: '+' | '-'): Heft | null {
  const A = num(aS), B = num(bS);
  const k = Math.max(A.k, B.k);
  const a = A.digits + '0'.repeat(k - A.k), b = B.digits + '0'.repeat(k - B.k);
  const av = BigInt(a), bv = BigInt(b);
  if (op === '-' && bv > av) return null;
  const res = String(op === '+' ? av + bv : av - bv);
  const aT = withComma(a, k), bT = withComma(b, k), rT = withComma(res, k);
  const w = Math.max(aT.length, bT.length, rT.length) + 1, end = w; // Spalte 0 für das Rechenzeichen
  const hb = new HeftBuilder(op === '+' ? 'Schriftlich addieren' : 'Schriftlich subtrahieren');
  const g = hb.grid();
  g.putR(0, end, aT); g.putR(1, end, bT); g.put(1, 0, op === '+' ? '+' : MINUS);
  hb.snap(k ? `Schreibe die Zahlen untereinander: <b>Komma unter Komma</b>. ${A.k !== B.k ? 'Fehlende Stellen füllst du mit Nullen auf.' : ''}` : 'Schreibe die Zahlen untereinander: Einer unter Einer, Zehner unter Zehner.');
  g.under(1, 0, end);
  hb.snap('Zieh einen Strich darunter. Du fängst rechts an, bei der kleinsten Stelle.');
  // Spalte für Spalte von rechts
  const col = (t: string, i: number) => { const j = t.length - 1 - i; return j >= 0 ? Number(t[j]) : 0; };
  // Kästchen-Spalte der i-ten Ziffer von rechts (das Komma bekommt ein eigenes Kästchen)
  const cOf = (i: number) => end - i - (k > 0 && i >= k ? 1 : 0);
  const L = Math.max(a.length, b.length, k + 1);
  const resP = res.padStart(k + 1, '0');
  let carry = 0;
  for (let i = 0; i < L; i++) {
    const x = col(a, i), y = col(b, i), c = cOf(i);
    let say: string, newCarry: number;
    const digit = col(resP, i);
    if (i >= a.length && i >= b.length && !carry) {
      newCarry = 0;
      say = 'Vor dem Komma steht keine Ziffer mehr. Schreibe eine 0 vor das Komma.';
    } else if (op === '+') {
      const sum = x + y + carry;
      newCarry = Math.floor(sum / 10);
      say = `${x} + ${y}${carry ? ` + ${carry} (Übertrag)` : ''} = ${sum}. ${newCarry ? `Schreibe ${digit} und die ${newCarry} klein als Übertrag in die nächste Spalte.` : `Schreibe ${digit}.`}`;
    } else {
      const need = y + carry;
      newCarry = x < need ? 1 : 0;
      say = `${carry ? `${y} + ${carry} (Übertrag) = ${need}. ` : ''}Ergänze: ${need} plus wie viel ist ${x + 10 * newCarry}? ${digit}.${newCarry ? ` Weil ${need} größer als ${x} ist, rechnest du bis ${x + 10}. Schreibe ${digit} und eine kleine 1 als Übertrag in die nächste Spalte.` : ` Schreibe ${digit}.`}`;
    }
    if (k > 0 && i === k) g.put(2, end - k, ',');
    if (i < resP.length) g.put(2, c, String(digit));
    if (newCarry && i < L - 1) g.mark(1, cOf(i + 1), { carry: String(newCarry) });
    if (newCarry && i === L - 1) { g.put(2, cOf(i + 1), String(newCarry)); say += ` Ganz vorne schreibst du die ${newCarry} einfach hin.`; }
    hb.snap(say);
    carry = newCarry;
  }
  hb.snap(`${k ? 'Das Komma im Ergebnis steht genau unter den anderen Kommas. ' : ''}Ergebnis: <b>${rT}</b>.`);
  return hb.done();
}

/* ---------- Schriftlich multiplizieren ---------- */
export function heftMul(aS: string, bS: string): Heft | null {
  const A = num(aS), B = num(bS);
  if (A.digits.length + B.digits.length > 12) return null;
  const k = A.k + B.k;
  const head = `${withComma(A.digits, A.k)}·${withComma(B.digits, B.k)}`;
  const bDig = B.digits.split('');
  const av = BigInt(A.digits);
  const parts = bDig.map(d => String(av * BigInt(d)));
  const res = String(av * BigInt(B.digits));
  const resT = withComma(res, k);
  const end = Math.max(head.length, resT.length + 1, ...parts.map((p, i) => p.length + 1 + (bDig.length - 1 - i)));
  const off = end - head.length; // Kopf rechtsbündig
  const hb = new HeftBuilder('Schriftlich multiplizieren');
  const g = hb.grid();
  g.put(0, off, head); g.under(0, 1, end);
  hb.snap(k ? `Schreibe die Aufgabe auf. Das Komma beachtest du erst am Ende: Du rechnest zuerst <b>${A.digits} · ${B.digits}</b> ohne Komma.` : 'Schreibe die Aufgabe auf und zieh einen Strich darunter.');
  // Ziffern der zweiten Zahl stehen ab Spalte off + (Länge erster Faktor + 1)
  const bStart = off + withComma(A.digits, A.k).length + 1;
  const bCol: number[] = [];
  { let c = bStart; for (const ch of withComma(B.digits, B.k)) { if (ch !== ',') bCol.push(c); c++; } }
  parts.forEach((p, i) => {
    const row = 1 + i;
    g.putR(row, bCol[i], p);
    hb.snap(`${A.digits} · ${bDig[i]} = ${p}. Die letzte Ziffer schreibst du genau unter die ${bDig[i]}.`);
  });
  if (parts.length > 1) {
    const r = parts.length + 1;
    g.under(parts.length, 1, end);
    g.putR(r, bCol[bCol.length - 1], res);
    hb.snap(`Zähle die Zeilen Stelle für Stelle zusammen, von rechts nach links: ${parts.join(' + ')}${parts.length ? '' : ''}. Ergebnis ohne Komma: ${res}.`);
  }
  const r = parts.length > 1 ? parts.length + 1 : 1;
  if (k) {
    const g2 = hb.grid();
    g2.put(0, 1, `${A.k}+${B.k}=${k}`, { c: 'note' });
    g2.put(1, 1, resT);
    hb.snap(`Jetzt das Komma: Die Faktoren haben zusammen ${A.k} + ${B.k} = ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach dem Komma. Also bekommt auch das Ergebnis ${k} ${k === 1 ? 'Stelle' : 'Stellen'}: Zähle von rechts ${k} ${k === 1 ? 'Ziffer' : 'Ziffern'} ab. Ergebnis: <b>${resT}</b>.`);
  } else hb.snap(`Ergebnis: <b>${resT}</b>.`);
  void r;
  return hb.done();
}

/* ---------- Schriftlich dividieren (auch mit Komma und Periode) ---------- */
export function heftDiv(aS: string, bS: string, maxDigits = 12): Heft | null {
  let A = num(aS), B = num(bS);
  const hb = new HeftBuilder('Schriftlich dividieren');
  if (B.digits === '0') return null;
  if (B.k > 0) {
    const s = B.k;
    const t0 = hb.grid();
    const aOld = withComma(A.digits, A.k), bOld = withComma(B.digits, B.k);
    const nA = { digits: A.digits + '0'.repeat(Math.max(0, s - A.k)), k: Math.max(0, A.k - s) };
    const nB = { digits: B.digits.replace(/^0+(?=\d)/, ''), k: 0 };
    t0.put(0, 0, `${aOld}:${bOld}`); t0.put(1, 0, `=${withComma(nA.digits, nA.k).replace(/^0+(?=\d)/, '')}:${nB.digits}`);
    hb.snap(`Durch eine Kommazahl teilst du nicht direkt. Verschiebe das Komma bei <b>beiden</b> Zahlen um ${s} ${s === 1 ? 'Stelle' : 'Stellen'} nach rechts, bis die zweite Zahl keine Kommastellen mehr hat. Das Ergebnis bleibt gleich.`);
    A = { digits: nA.digits.replace(/^0+(?=\d)/, '') || '0', k: nA.k }; B = nB;
  }
  const b = BigInt(B.digits);
  const aT = withComma(A.digits, A.k);
  const g = hb.grid();
  const intLen = A.digits.length - A.k; // Ziffern vor dem Komma
  // Ziffern des Dividenden (mit Nullen, die man später „herunterholt“)
  // Das Komma sitzt an der Ziffer davor, damit die Ziffern beim Herunterholen genau untereinander stehen.
  A.digits.split('').forEach((ch, j) => g.put(0, 1 + j, ch, A.k > 0 && j === intLen - 1 ? { cm: true } : {}));
  g.put(0, 1 + A.digits.length, `:${B.digits}=`);
  const qStart = 1 + A.digits.length + B.digits.length + 2;
  hb.snap(`Schreibe die Aufgabe auf: ${aT} : ${B.digits} = . Du gehst die Ziffern von links nach rechts durch.`);
  const digits = A.digits.split('').map(Number);
  // Spalte der Ziffer i des Dividenden (Komma überspringen)
  const colOf = (i: number) => 1 + i;
  let cur = 0n, qd = '', started = false, row = 1, commaDone = false;
  const seen = new Map<string, number>();
  let period: [number, number] | null = null;
  let i = 0, extra = 0;
  const qCols: number[] = [];
  const writeQ = (t: string) => {
    qd += t;
    if (t === ',') { g.mark(0, qCols[qCols.length - 1], { cm: true }); return; }
    const c = qStart + qCols.length; g.put(0, c, t); qCols.push(c);
  };
  while (true) {
    const inDividend = i < digits.length;
    if (!inDividend && cur === 0n) break;
    if (!inDividend && extra >= maxDigits) break;
    const isAfterComma = i >= intLen;
    if (isAfterComma && !commaDone) {
      if (!started) { writeQ('0'); started = true; }
      writeQ(',');
      commaDone = true;
      hb.snap(i < digits.length ? 'Du kommst über das Komma. Setze auch im Ergebnis ein Komma.' : 'Die Zahl ist zu Ende, aber es bleibt ein Rest. Setze im Ergebnis ein Komma und hänge Nullen an.');
    }
    const d = inDividend ? digits[i] : 0;
    if (!inDividend) {
      const key = String(cur);
      if (seen.has(key)) { period = [seen.get(key)!, qCols.length]; break; }
      seen.set(key, qCols.length);
      extra++;
    }
    cur = cur * 10n + BigInt(d);
    const c = colOf(i);
    i++;
    if (!started && cur < b && i < intLen) continue;
    const qv = cur / b, sub = qv * b, rem = cur - sub;
    const curT = String(cur);
    if (started || qv > 0n || i >= intLen) {
      if (!started && qv === 0n) { writeQ('0'); started = true; }
      else { writeQ(String(qv)); started = true; }
    }
    if (row > 1) { g.putR(row, c, curT); }
    g.putR(row + 1, c, MINUS + String(sub));
    g.under(row + 1, c - Math.max(curT.length, String(sub).length + 1) + 1, c);
    const say = `${row === 1 ? `Wie oft passt die ${b} in ${curT}? ` : `${!inDividend ? 'Hänge eine 0 an' : `Hol die ${d} herunter`}: ${curT}. Wie oft passt die ${b} in ${curT}? `}${qv}-mal, denn ${b} · ${qv} = ${sub}. Schreibe ${qv} ins Ergebnis und ${sub} darunter. Rest: ${curT} ${MINUS} ${sub} = ${rem}.`;
    row += 2;
    cur = rem;
    g.putR(row, c, String(rem));
    hb.snap(say);
    if (i >= digits.length && cur === 0n) break;
  }
  if (period) {
    // Periode markieren: die Ziffern von period[0] bis zum Ende
    const [p0] = period;
    for (let j = p0; j < qCols.length; j++) g.mark(0, qCols[j], { o: true });
    hb.snap(`Der Rest ${String(cur)} kommt schon zum zweiten Mal. Ab hier wiederholen sich die Ziffern immer wieder. Mach einen Strich über die Ziffern, die sich wiederholen: Das ist die <b>Periode</b>.`);
  } else hb.snap(`Der Rest ist 0. Ergebnis: <b>${qd}</b>. Probe: ${qd} · ${B.digits} = ${aT}.`);
  return hb.done();
}

/* ---------- Brüche ---------- */
interface Fr { n: bigint; d: bigint }
/** Brüche ins Raster: Zähler in Zeile r, Nenner in Zeile r + 1, Bruchstrich dazwischen. */
class FracLine {
  c = 1;
  /** So viele Kästchen passen auf eine Handy-Zeile; danach geht es mit „=“ in der nächsten Zeile weiter. */
  static MAX = 11;
  private wrap() { this.r += 4; this.c = 1; }
  constructor(public g: Grid, public r: number) {}
  frac(n: string, d: string, o: { small?: string; smallBelow?: boolean } = {}) {
    const w = Math.max([...n].length, [...d].length);
    if (this.c + w - 1 > FracLine.MAX) this.wrap();
    const cn = this.c + Math.floor((w - [...n].length) / 2), cd = this.c + Math.floor((w - [...d].length) / 2);
    this.g.put(this.r, cn, n); this.g.put(this.r + 1, cd, d); this.g.under(this.r, this.c, this.c + w - 1);
    this.c += w;
    return this;
  }
  num(t: string) { if (this.c + [...t].length - 1 > FracLine.MAX) this.wrap(); this.g.put(this.r, this.c, t, { mid: true }); this.c += [...t].length; return this; }
  op(t: string, o: { above?: string; below?: string } = {}) {
    if ((t === '=' && this.c > 7) || this.c > FracLine.MAX) this.wrap();
    this.g.put(this.r, this.c, t, { mid: true });
    if (o.above) this.g.put(this.r - 1, this.c, o.above, { s: true, c: 'note' });
    if (o.below) this.g.put(this.r + 2, this.c, o.below, { s: true, c: 'note' });
    this.c += 1;
    return this;
  }
}
const S = (x: bigint) => String(x);
/** a/b ± c/d (± …) mit Hauptnenner, Erweitern und Kürzen. */
export function heftFracAdd(terms: { f: Fr; sign: 1 | -1 }[]): Heft | null {
  if (terms.length < 2 || terms.some(t => t.f.n < 0n || t.f.d <= 0n)) return null;
  const H = terms.reduce((h, t) => (h * t.f.d) / gcd(h, t.f.d), 1n);
  const hb = new HeftBuilder('Brüche addieren und subtrahieren');
  const g = hb.grid();
  const line = new FracLine(g, 1);
  const opS = (t: { sign: 1 | -1 }) => (t.sign > 0 ? '+' : MINUS);
  terms.forEach((t, i) => { if (i) line.op(opS(t)); t.f.d === 1n ? line.num(S(t.f.n)) : line.frac(S(t.f.n), S(t.f.d)); });
  hb.snap('Schreibe die Aufgabe ab. Zähler oben, Nenner unten, der Bruchstrich liegt auf der Kästchenlinie.');
  const same = terms.every(t => t.f.d === H);
  let num = 0n;
  if (!same) {
    hb.top(`Hauptnenner: ${S(H)}`, 'Nebenrechnung');
    hb.snap(`Die Nenner sind verschieden. Such den Hauptnenner: die kleinste Zahl, in der ${terms.map(t => S(t.f.d)).join(' und ')} aufgehen. Das ist <b>${S(H)}</b>. Schreib ihn dir an den Rand.`);
    line.op('=');
    terms.forEach((t, i) => {
      const k = H / t.f.d;
      if (i) line.op(opS(t));
      if (t.f.d === 1n) line.frac(S(t.f.n * H), S(H));
      else line.frac(k === 1n ? S(t.f.n) : `${S(t.f.n)}·${S(k)}`, k === 1n ? S(t.f.d) : `${S(t.f.d)}·${S(k)}`);
    });
    hb.snap(`Erweitere jeden Bruch auf den Nenner ${S(H)}: ${terms.filter(t => t.f.d > 1n).map(t => `${S(t.f.d)} · ${S(H / t.f.d)} = ${S(H)}`).join(', ')}. Den Zähler nimmst du mit derselben Zahl mal.${terms.some(t => t.f.d === 1n) ? ` Eine ganze Zahl schreibst du als Bruch mit dem Nenner ${S(H)}.` : ''}`);
    line.op('=');
    terms.forEach((t, i) => { if (i) line.op(opS(t)); line.frac(S(t.f.n * (H / t.f.d)), S(H)); });
    hb.snap('Rechne Zähler und Nenner aus.');
  }
  num = terms.reduce((s, t) => s + BigInt(t.sign) * t.f.n * (H / t.f.d), 0n);
  if (num < 0n) return null;
  line.op('=');
  line.frac(terms.map((t, i) => `${i ? (t.sign > 0 ? '+' : MINUS) : ''}${S(t.f.n * (H / t.f.d))}`).join(''), S(H));
  hb.snap('Jetzt haben alle Brüche denselben Nenner. Schreib einen gemeinsamen Bruchstrich: Die Zähler rechnest du zusammen, der Nenner bleibt.');
  line.op('=');
  line.frac(S(num), S(H));
  hb.snap(`${terms.map((t, i) => `${i ? (t.sign > 0 ? '+ ' : MINUS + ' ') : ''}${S(t.f.n * (H / t.f.d))}`).join(' ')} = ${S(num)}.`);
  finishFrac(hb, line, num, H);
  return hb.done();
}
/** Kürzen (Kürzungszahl unter dem Gleichheitszeichen) und gemischte Zahl. */
function finishFrac(hb: HeftBuilder, line: FracLine, n: bigint, d: bigint) {
  const k = gcd(n, d);
  if (k > 1n) {
    line.op('=', { below: `:${S(k)}` });
    n /= k; d /= k;
    d === 1n ? line.num(S(n)) : line.frac(S(n), S(d));
    hb.snap(`Kürze mit <b>${S(k)}</b>: Zähler und Nenner durch ${S(k)}. Die Kürzungszahl schreibst du unter das Gleichheitszeichen.`);
  }
  if (d > 1n && n > d) {
    line.op('=');
    const w = n / d, r = n % d;
    line.num(S(w)); if (r) line.frac(S(r), S(d));
    hb.snap(`Der Zähler ist größer als der Nenner. Als gemischte Zahl: ${S(n)} : ${S(d)} = ${S(w)} Rest ${S(r)}, also ${S(w)} ganze und ${S(r)}/${S(d)}.`);
  }
  hb.snap('Fertig. Prüfe: Ist der Bruch vollständig gekürzt?');
}
export function heftFracMul(a: Fr, b: Fr, div: boolean): Heft | null {
  if (a.n < 0n || b.n <= 0n || a.d <= 0n || b.d <= 0n) return null;
  const hb = new HeftBuilder(div ? 'Brüche dividieren' : 'Brüche multiplizieren');
  const g = hb.grid();
  const line = new FracLine(g, 1);
  const fr = (f: Fr) => (f.d === 1n ? line.num(S(f.n)) : line.frac(S(f.n), S(f.d)));
  fr(a); line.op(div ? ':' : '·'); fr(b);
  hb.snap('Schreibe die Aufgabe ab.');
  let c = b;
  if (div) {
    c = { n: b.d, d: b.n };
    line.op('='); fr(a); line.op('·'); fr(c);
    hb.snap(`Durch einen Bruch teilst du, indem du mit dem <b>Kehrwert</b> malnimmst: Zähler und Nenner tauschen die Plätze. Aus dem : wird ein ·.`);
  }
  line.op('=');
  line.frac(`${S(a.n)}·${S(c.n)}`, `${S(a.d)}·${S(c.d)}`);
  hb.snap('Zähler mal Zähler, Nenner mal Nenner. Alles auf einen Bruchstrich.');
  const k1 = gcd(a.n, c.d), k2 = gcd(c.n, a.d);
  if (k1 > 1n || k2 > 1n) {
    hb.snap(`Tipp: Vor dem Ausrechnen kannst du kürzen${k1 > 1n ? `, ${S(a.n)} und ${S(c.d)} durch ${S(k1)}` : ''}${k2 > 1n ? `, ${S(c.n)} und ${S(a.d)} durch ${S(k2)}` : ''}. Dann werden die Zahlen kleiner.`);
  }
  const n = a.n * c.n, d = a.d * c.d;
  line.op('='); line.frac(S(n), S(d));
  hb.snap(`Ausrechnen: ${S(a.n)} · ${S(c.n)} = ${S(n)} und ${S(a.d)} · ${S(c.d)} = ${S(d)}.`);
  finishFrac(hb, line, n, d);
  return hb.done();
}

/* ---------- Gleichungen ---------- */
export function heftEq(sol: Solution): Heft | null {
  if (sol.kind !== 'eq' || sol.rows.length < 2) return null;
  const hb = new HeftBuilder('Gleichung umformen');
  sol.rows.forEach((r, i) => {
    const nx = sol.rows[i + 1];
    const note = nx && nx.op && nx.op.startsWith('|') ? nx.op : undefined;
    hb.text(`<span class="math">${r.eq}</span>`, note);
    hb.snap(i === 0 ? `Schreibe die Gleichung ab. ${note ? `Rechts neben den senkrechten Strich schreibst du, was du auf <b>beiden</b> Seiten machst: ${note.slice(1).trim()}.` : ''}` : `${r.expl}${note ? ` Als Nächstes: ${note.slice(1).trim()} auf beiden Seiten.` : ''}`);
  });
  hb.text(`<span class="math">L = { ${sol.resultHTML.replace(/^.*=\s*/, '')} }</span>`);
  hb.snap('Zum Schluss schreibst du die Lösungsmenge auf. Mach die Probe: Setze die Zahl in die erste Zeile ein.');
  return hb.done();
}

/* ---------- Rechenkette (Punkt vor Strich, Klammern) ---------- */
export function heftChain(sol: Solution): Heft | null {
  if (sol.kind !== 'expr' || sol.steps.length < 2) return null;
  const hb = new HeftBuilder('Rechenkette');
  hb.text(`<span class="math">${sol.inputHTML}</span>`);
  hb.snap('Schreibe die Aufgabe ab. Unterstreiche, was du zuerst rechnest: Klammern, dann Punkt vor Strich.');
  sol.steps.forEach(st => {
    hb.text(`<span class="math">= ${st.after}</span>`);
    hb.snap(`${st.rule}. Schreib jede neue Zeile mit = darunter. Was du noch nicht rechnest, schreibst du einfach ab.`);
  });
  return hb.done();
}

/* ---------- Dreisatz-Tabelle ---------- */
export function heftDreisatz(o: { a: string; b: string; ya: string; y1: string; yb: string; x: string; y: string; anti: boolean }): Heft {
  const hb = new HeftBuilder('Dreisatz');
  const row = (l: string, r: string) => `<span class="hk-tab"><span>${l}</span><span>${r}</span></span>`;
  hb.text(row(`<b>${o.x}</b>`, `<b>${o.y}</b>`));
  hb.text(row(o.a, o.ya));
  hb.snap('Mach eine Tabelle mit zwei Spalten. In die erste Zeile schreibst du, was du weißt.');
  hb.text(row('1', o.y1), `: ${o.a}   ${o.anti ? '·' : ':'} ${o.a}`);
  hb.snap(o.anti ? `Auf <b>1</b> zurückrechnen: Links teilst du durch ${o.a}. Je weniger, desto mehr: Rechts nimmst du deshalb mal ${o.a}.` : `Auf <b>1</b> zurückrechnen: Links und rechts durch ${o.a}.`);
  hb.text(row(o.b, o.yb), `· ${o.b}   ${o.anti ? ':' : '·'} ${o.b}`);
  hb.snap(o.anti ? `Von 1 auf ${o.b}: Links mal ${o.b}, rechts durch ${o.b}.` : `Von 1 auf ${o.b}: Links und rechts mal ${o.b}.`);
  return hb.done();
}

/* ---------- Primfaktoren: Teilerleiter ---------- */
export function heftPrim(n: number): Heft {
  const hb = new HeftBuilder('Primfaktorzerlegung');
  const g = hb.grid();
  const w = String(n).length;
  let m = n, r = 0;
  const fs: number[] = [];
  g.putR(0, w, String(n)); g.put(0, w + 1, '|');
  hb.snap(`Schreibe ${n} hin und rechts daneben einen senkrechten Strich. Rechts kommen die Primfaktoren hin.`);
  while (m > 1) {
    let p = 2; while (m % p) p++;
    fs.push(p);
    g.put(r, w + 2, String(p));
    m /= p; r++;
    g.putR(r, w, String(m)); g.put(r, w + 1, '|');
    hb.snap(`${m * p} ist durch ${p} teilbar: ${m * p} : ${p} = ${m}. Schreib ${p} rechts hin und ${m} darunter.${m === 1 ? ' Bei 1 hörst du auf.' : ''}`);
  }
  const pw = [...new Set(fs)].map(p => { const e = fs.filter(x => x === p).length; return e > 1 ? `${p}<sup>${e}</sup>` : String(p); }).join(' · ');
  hb.text(`<span class="math">${n} = ${fs.join(' · ')}${new Set(fs).size < fs.length ? ` = ${pw}` : ''}</span>`);
  hb.snap('Die Zahlen rechts vom Strich sind die Primfaktoren. Schreib sie als Produkt auf, gleiche Faktoren als Potenz.');
  return hb.done();
}

/* ---------- Textaufgaben: Rechnung und Antwortsatz ---------- */
export function heftWord(steps: { title: string; calc: string; unit?: string }[], sentence: string): Heft | null {
  const hb = new HeftBuilder('Textaufgabe');
  hb.snap('Lies die Aufgabe zweimal. Unterstreiche im Text, was gegeben ist und was gesucht ist. Dann schreibst du ins Heft:');
  for (const s of steps) {
    let sol;
    try { sol = evalExpr(s.calc); } catch { return null; }
    const dec = /,/.test(s.calc) || !/\//.test(s.calc);
    const vH = qH(sol.result, dec && sol.result.terminating());
    const u = s.unit ? ' ' + s.unit : '';
    hb.text(/[+\-−·:/]/.test(s.calc.replace(/^-/, '')) ? `<span class="math">${sol.inputHTML} = ${vH}${u}</span>` : `${s.title}: <span class="math">${vH}${u}</span>`, s.title);
    const side = sideCalc(s.calc);
    hb.snap(`${s.title}: Schreib die Rechnung mit Einheit auf.`);
    if (side) { hb.embed(side); hb.snap(`Diese Rechnung ist nicht im Kopf zu schaffen. Mach sie daneben schriftlich, als <b>Nebenrechnung</b>. So geht ${side.title.toLowerCase()}.`); }
  }
  hb.newText();
  hb.text(`<b>Antwort:</b> ${sentence}`);
  hb.snap('Zum Schluss schreibst du einen <b>Antwortsatz</b>. Er beantwortet die Frage aus der Aufgabe mit Zahl und Einheit.');
  return hb.done();
}

/* ---------- Erkennen, welche Aufgabe auf Papier gehört ---------- */
const dg = (s: string) => s.replace(/\D/g, '').replace(/^0+/, '').length;
/** Ist das eine Rechnung, die man schriftlich macht (nicht im Kopf)? */
export function isPaper(a: string, op: string, b: string): boolean {
  const da = dg(a), db = dg(b), dec = /,/.test(a + b);
  if (op === '+' || op === '-') return Math.max(da, db) >= 4 || (dec && Math.max(da, db) >= 3);
  // Mal oder geteilt durch 10, 100, 1000 rechnet man im Kopf (Komma verschieben).
  if ((op === '·' || op === ':') && (/^10*(,0*)?$/.test(b.trim()) || (op === '·' && /^10*$/.test(a.trim())))) return false;
  if (op === '·') return (da >= 2 && db >= 2 && da + db >= 5) || (dec && da + db >= 4) || da + db >= 6;
  if (op === ':') return /,/.test(b) || db >= 2 && da >= 3 || da >= 4 || (dec && da >= 3);
  return false;
}
/** Nebenrechnung für eine einfache Rechnung „a op b“, wenn sie schriftlich gerechnet wird. */
export function sideCalc(calc: string): Heft | null {
  const m = calc.replace(/\s+/g, ' ').trim().match(/^(\d+(?:,\d+)?) ([+\-−·:]) (\d+(?:,\d+)?)$/);
  if (!m) return null;
  const op = m[2] === '−' ? '-' : m[2];
  if (!isPaper(m[1], op, m[3])) return null;
  return opHeft(m[1], op, m[3]);
}
function opHeft(a: string, op: string, b: string): Heft | null {
  if (op === '+' || op === '-') return heftAddSub(a, b, op);
  if (op === '·') return heftMul(a, b);
  if (op === ':') return heftDiv(a, b);
  return null;
}
const FR = /^\(?(\d+)\/(\d+)\)?$/;
const frOf = (s: string): Fr | null => { const m = s.trim().match(FR); if (m) return { n: BigInt(m[1]), d: BigInt(m[2]) }; return /^\d+$/.test(s.trim()) ? { n: BigInt(s.trim()), d: 1n } : null; };

/** Passende Heft-Ansicht zu einer Aufgabe, aus ihrer Rechnung (plain) oder ihrem Rechenweg. */
export function heftFor(task: { prompt?: string; plain?: string; sol: Solution; word?: boolean; widget?: unknown }): Heft | null {
  if (task.widget || task.word || /im Kopf/i.test(task.prompt ?? '')) return null;
  if (task.sol.kind === 'eq') return heftEq(task.sol);
  const p = (task.plain ?? '').replace(/\s+/g, ' ').trim().replace(/−/g, '-');
  // a op b mit Zahlen
  let m = p.match(/^(\d+(?:,\d+)?) ([+\-·:]) (\d+(?:,\d+)?)$/);
  if (m && isNum(m[1]) && isNum(m[3]) && isPaper(m[1], m[2], m[3])) return opHeft(m[1], m[2], m[3]);
  // Brüche: a/b ± c/d (± …)
  if (/\//.test(p) && !/[()·:]/.test(p.replace(/^\(|\)$/g, ''))) {
    const parts = p.split(/ ([+-]) /);
    const terms: { f: Fr; sign: 1 | -1 }[] = [];
    let ok = true;
    for (let i = 0; i < parts.length; i += 2) {
      const f = frOf(parts[i]);
      if (!f) { ok = false; break; }
      terms.push({ f, sign: i === 0 || parts[i - 1] === '+' ? 1 : -1 });
    }
    if (ok && terms.length >= 2) return heftFracAdd(terms);
  }
  m = p.match(/^(\d+(?:\/\d+)?) ([·:]) (\d+(?:\/\d+)?)$/);
  if (m && /\//.test(m[1] + m[3])) {
    const a = frOf(m[1]), b = frOf(m[3]);
    if (a && b) return heftFracMul(a, b, m[2] === ':');
  }
  return heftChain(task.sol);
}
/** Für Tests: der letzte Stand als Text (Zeilen des ersten Rasters). */
export function heftText(h: Heft): string[] {
  const last = h.steps[h.steps.length - 1];
  return last.blocks.flatMap(b => (b.kind === 'grid' ? b.rows.map(r => r.map(c => (c && !c.s ? (c.t || ' ') + (c.cm ? ',' : '') : ' ')).join('').trimEnd()) : b.lines.map(l => l.html)));
}
export const _q = q;
