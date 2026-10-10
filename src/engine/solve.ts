import { MathError, Q, abs, dp, gcd, lcm, q } from './q.js';
import { MINUS, fracH, hb, mixedH, pn, qH, sg } from './format.js';
import { type Node, type Op, anyDec, hasX, parse, rH, tokenize } from './parse.js';

export interface ExprStep { rule: string; before: string; lines: string[]; after: string }
export interface ExprSolution {
  kind: 'expr'; input: string; inputHTML: string; steps: ExprStep[];
  /** Alle Zwischenergebnisse, z. B. für Generatoren, die nur ganze Zahlen wollen. */
  vals: Q[]; result: Q; resultHTML: string; extra: string[];
}
/** `ask`: Frage für „Gemeinsam lösen“ mit der Zahl, die nach diesem Schritt herauskommt. */
export interface EqRow { eq: string; op?: string; expl: string; ask?: { q: string; v: Q } }
export interface EqSolution {
  kind: 'eq'; input: string; rows: EqRow[]; probe?: string;
  solution: 'one' | 'none' | 'all'; result: Q | null; resultHTML: string;
}
export interface ListStep { rule: string; lines: string[] }
export interface ListSolution { kind: 'list'; steps: ListStep[]; result: Q; resultHTML: string; extra?: string[] }
export type Solution = ExprSolution | EqSolution | ListSolution;

interface OpResult { v: Q; lines: string[]; dec: boolean }

export function kuerzen(raw: Q, lines: string[]): Q {
  const r = raw.red();
  const g = gcd(raw.n, raw.d);
  if (g > 1n && raw.n !== 0n)
    lines.push(`Kürzen mit ${g}: ${qH(raw)} = ${fracH(`${sg(raw.n)} : ${g}`, `${raw.d} : ${g}`)} = ${qH(r)}`);
  return r;
}

/** Schriftliche Addition/Subtraktion: Komma unter Komma. */
function columnH(a: Q, b: Q, op: '+' | '-', res: Q): string {
  const k = Math.max(dp(a), dp(b), dp(res));
  const f = (x: Q) => {
    let s = x.toDec();
    if (k > 0) {
      if (!s.includes(',')) s += ',';
      s += '0'.repeat(k - (s.length - s.indexOf(',') - 1));
    }
    return s;
  };
  const A = f(a), B = f(b), C = f(res);
  const w = Math.max(A.length, B.length, C.length) + 2;
  return `<pre class="column" aria-label="schriftlich">${A.padStart(w)}\n${op === '+' ? '+' : MINUS}${B.padStart(w - 1)}\n${'─'.repeat(w)}\n${C.padStart(w)}</pre>`;
}

/** Eine einzelne Rechenoperation ausführen und den Weg dorthin in Sätzen erklären. */
export function opInfo(op: Op, a: Q, b: Q, dec: boolean): OpResult {
  const lines: string[] = [];
  const D = dec && a.terminating() && b.terminating();
  const h = (x: Q) => qH(x, D);

  if (op === '+' || op === '-') {
    const S = op === '+' ? '+' : MINUS;
    const f = op === '+' ? (x: Q, y: Q) => x.add(y) : (x: Q, y: Q) => x.sub(y);
    if (D && !(a.isInt() && b.isInt())) {
      const v = f(a, b);
      if (a.sign() >= 0 && b.sign() >= 0 && v.sign() >= 0) {
        lines.push('Komma unter Komma schreiben, fehlende Stellen mit 0 auffüllen, dann rechnen wie mit ganzen Zahlen:');
        lines.push(columnH(a, b, op, v));
      }
      lines.push(`${h(a)} ${S} ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: true };
    }
    if (a.d === 1n && b.d === 1n) {
      const v = f(a, b);
      lines.push(`${h(a)} ${S} ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: D };
    }
    let A = a, B = b;
    if (a.d !== b.d) {
      const L = lcm(a.d, b.d);
      lines.push(`Die Nenner sind verschieden (${a.d} und ${b.d}). Man kann nur gleich große Stücke zusammenrechnen. Hauptnenner = kleinste Zahl, in der ${a.d} und ${b.d} aufgehen: <b>${L}</b>`);
      const ext = (x: Q) => {
        const k = L / x.d;
        const e = new Q(x.n * k, L);
        if (k > 1n) lines.push(`Erweitern mit ${k}: ${x.d === 1n ? sg(x.n) : qH(x)} = ${fracH(`${pn(x.n)} · ${k}`, `${x.d} · ${k}`)} = ${qH(e)}`);
        return e;
      };
      A = ext(a);
      B = ext(b);
    } else lines.push(`Gleicher Nenner (${a.d}): Zähler ${op === '+' ? 'addieren' : 'subtrahieren'}, der Nenner bleibt.`);
    const raw = new Q(op === '+' ? A.n + B.n : A.n - B.n, A.d);
    lines.push(`${qH(A)} ${S} ${hb(B)} = ${fracH(`${sg(A.n)} ${S} ${pn(B.n)}`, A.d)} = ${qH(raw)}`);
    return { v: kuerzen(raw, lines), lines, dec: false };
  }

  if (op === '*') {
    if (D && !(a.isInt() && b.isInt())) {
      const v = a.mul(b);
      const k = dp(a) + dp(b);
      const ia = abs((a.red().n * 10n ** BigInt(dp(a))) / a.red().d);
      const ib = abs((b.red().n * 10n ** BigInt(dp(b))) / b.red().d);
      const P = (ia * ib).toString().padStart(k + 1, '0');
      const Pc = k ? P.slice(0, P.length - k) + ',' + P.slice(-k) : P;
      const st = k === 1 ? 'Stelle' : 'Stellen';
      lines.push(`Erst ohne Komma rechnen: ${ia} · ${ib} = ${ia * ib}. Die Zahlen haben zusammen ${k} Nachkomma${k === 1 ? 'stelle' : 'stellen'}, also ${k} ${st} von rechts das Komma setzen: ${Pc}`);
      lines.push(`${h(a)} · ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: true };
    }
    if (a.d === 1n && b.d === 1n) {
      const v = a.mul(b);
      lines.push(`${h(a)} · ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: D };
    }
    lines.push('Bruch mal Bruch: Zähler mal Zähler, Nenner mal Nenner.' + (a.d === 1n || b.d === 1n ? ' Eine ganze Zahl schreibst du dafür als Bruch mit Nenner 1.' : ''));
    const raw = new Q(a.n * b.n, a.d * b.d);
    lines.push(`${a.d === 1n ? fracH(sg(a.n), 1) : qH(a)} · ${b.d === 1n ? fracH(sg(b.n), 1) : hb(b)} = ${fracH(`${sg(a.n)} · ${pn(b.n)}`, `${a.d} · ${b.d}`)} = ${qH(raw)}`);
    return { v: kuerzen(raw, lines), lines, dec: false };
  }

  // Division
  if (b.isZero()) throw new MathError('Durch 0 kann man nicht teilen. Das ist in der Mathematik nicht erlaubt.');
  if (D && !(a.isInt() && b.isInt())) {
    const v = a.div(b);
    const k = dp(b);
    if (k > 0) {
      const s = q(10 ** k);
      lines.push(`Das Komma im Teiler muss weg: Verschiebe es bei beiden Zahlen um ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts. Das Ergebnis bleibt gleich: ${h(a)} : ${h(b)} = ${h(a.mul(s))} : ${h(b.mul(s))}`);
    }
    if (v.terminating()) {
      lines.push(`${h(a)} : ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: true };
    }
    lines.push(`${h(a)} : ${hb(b, D)} = ${qH(v)} ≈ ${v.approx()} (geht nicht genau als Dezimalzahl auf)`);
    return { v, lines, dec: false };
  }
  if (a.d === 1n && b.d === 1n) {
    if (a.n % b.n === 0n) {
      const v = a.div(b);
      lines.push(`${h(a)} : ${hb(b, D)} = ${h(v)}`);
      return { v, lines, dec: D };
    }
    const raw = new Q(a.n, b.n);
    lines.push(`${sg(a.n)} : ${pn(b.n)} geht nicht glatt auf. Das Ergebnis schreibst du als Bruch: ${sg(a.n)} : ${pn(b.n)} = ${qH(raw)}`);
    return { v: kuerzen(raw, lines), lines, dec: false };
  }
  const kb = new Q(b.d, b.n);
  lines.push('Durch einen Bruch teilen heißt: mit seinem Kehrwert malnehmen. Den Kehrwert bekommst du, indem du Zähler und Nenner tauschst.');
  const aH = a.d === 1n ? sg(a.n) : qH(a);
  lines.push(`${aH} : ${b.d === 1n ? sg(b.n) : hb(b)} = ${aH} · ${hb(kb)}`);
  const m = opInfo('*', a, kb, false);
  return { v: m.v, lines: lines.concat(m.lines), dec: false };
}

/** Nächster ausrechenbarer Teil: tiefste Klammer zuerst, dann Punkt vor Strich, dann von links. */
function pickReducible(root: Node): { n: Node; d: number } {
  const c: { n: Node; d: number; i: number }[] = [];
  let idx = 0;
  (function walk(n: Node, depth: number) {
    const d = depth + (n.paren ? 1 : 0);
    if (n.t === 'bin') {
      walk(n.l!, d);
      if (n.l!.t === 'num' && n.r!.t === 'num') c.push({ n, d, i: idx++ });
      walk(n.r!, d);
    } else if (n.t === 'neg') {
      walk(n.e!, d);
      if (n.e!.t === 'num') c.push({ n, d, i: idx++ });
    }
  })(root, 0);
  const pr = (x: { n: Node }) => (x.n.t === 'bin' && (x.n.op === '*' || x.n.op === ':') ? 1 : 0);
  c.sort((a, b) => b.d - a.d || pr(b) - pr(a) || a.i - b.i);
  return c[0];
}
const hasAddSub = (n: Node): boolean => n.t === 'bin' && (n.op === '+' || n.op === '-' || hasAddSub(n.l!) || hasAddSub(n.r!));

/** Term Schritt für Schritt ausrechnen. */
export function evalExpr(str: string): ExprSolution {
  const tokens = tokenize(str);
  if (!tokens.length) throw new MathError('Gib zuerst eine Aufgabe ein.');
  if (tokens.some(t => t.t === '=')) throw new MathError('Das ist eine Gleichung. Dafür nutze ich den Gleichungslöser.');
  let root = parse(tokens);
  if (hasX(root)) throw new MathError('In der Aufgabe steht ein x. Für eine Gleichung brauche ich ein =, zum Beispiel 3x + 2 = 11.');
  const dec = anyDec(root);
  const inputHTML = rH(root, null, dec);
  const steps: ExprStep[] = [];
  const vals: Q[] = [];
  while (root.t !== 'num') {
    const pick = pickReducible(root);
    const n = pick.n;
    let rule: string;
    if (n === root) rule = steps.length ? 'Letzter Schritt' : 'Ausrechnen';
    else if (pick.d > 0) rule = 'Klammer zuerst';
    else if (n.t === 'bin' && (n.op === '*' || n.op === ':') && hasAddSub(root)) rule = 'Punkt vor Strich';
    else rule = 'Von links nach rechts';
    const before = rH(root, n, dec);
    const info: OpResult = n.t === 'neg'
      ? { v: n.e!.v!.neg(), lines: [`${MINUS}${hb(n.e!.v!, dec)} = ${qH(n.e!.v!.neg(), dec)}`], dec: !!n.e!.dec }
      : opInfo(n.op!, n.l!.v!, n.r!.v!, dec && n.l!.dec !== false && n.r!.dec !== false);
    vals.push(info.v);
    const repl: Node = { t: 'num', v: info.v, dec: dec ? info.dec : undefined };
    if (n === root) root = repl;
    else {
      for (const k of Object.keys(n)) delete (n as unknown as Record<string, unknown>)[k];
      Object.assign(n, repl);
    }
    steps.push({ rule, before, lines: info.lines, after: rH(root, null, dec) });
  }
  let result = root.v!;
  const extra: string[] = [];
  if (!result.isRed()) {
    const l: string[] = [];
    result = kuerzen(result, l);
    steps.push({ rule: 'Kürzen', before: qH(root.v!), lines: l, after: qH(result) });
  }
  result = result.red();
  const mixed = mixedH(result);
  if (mixed) extra.push(`Als gemischte Zahl: ${qH(result)} = ${mixed}`);
  if (result.d !== 1n && result.terminating() && result.d <= 1000n) extra.push(`Als Dezimalzahl: ${qH(result)} = ${sg(result.toDec())}`);
  else if (result.d !== 1n && !result.terminating() && dec) extra.push(`Gerundet: ≈ ${sg(result.approx())}`);
  const resDec = dec && root.dec !== false && result.terminating();
  return { kind: 'expr', input: str, inputHTML, steps, vals, result, resultHTML: qH(result, resDec), extra };
}

/* ---------- Lineare Gleichungen ---------- */
interface Lin { a: Q; b: Q } // a·x + b

function lin(n: Node): Lin {
  if (n.t === 'num') return { a: q(0), b: n.v! };
  if (n.t === 'x') return { a: q(1), b: q(0) };
  if (n.t === 'neg') {
    const e = lin(n.e!);
    return { a: e.a.neg(), b: e.b.neg() };
  }
  const l = lin(n.l!), r = lin(n.r!);
  if (n.op === '+') return { a: l.a.add(r.a), b: l.b.add(r.b) };
  if (n.op === '-') return { a: l.a.sub(r.a), b: l.b.sub(r.b) };
  if (n.op === '*') {
    if (l.a.isZero()) return { a: r.a.mul(l.b), b: r.b.mul(l.b) };
    if (r.a.isZero()) return { a: l.a.mul(r.b), b: l.b.mul(r.b) };
    throw new MathError('Hier wird x mit x malgenommen. Das ist keine lineare Gleichung mehr; die kommen erst später dran.');
  }
  if (!r.a.isZero()) throw new MathError('Hier wird durch x geteilt. Solche Gleichungen kann der Löser noch nicht.');
  if (r.b.isZero()) throw new MathError('Durch 0 kann man nicht teilen. Das ist in der Mathematik nicht erlaubt.');
  return { a: l.a.div(r.b), b: l.b.div(r.b) };
}
const coefH = (a: Q): string => (a.eq(q(1)) ? '' : a.eq(q(-1)) ? MINUS : qH(a));
function linH(L: Lin): string {
  if (L.a.isZero()) return qH(L.b);
  let s = coefH(L.a) + '<i>x</i>';
  if (L.b.sign() > 0) s += ' + ' + qH(L.b);
  else if (L.b.sign() < 0) s += ` ${MINUS} ` + qH(L.b.neg());
  return s;
}
const evalLin = (L: Lin, x: Q): Q => L.a.mul(x).add(L.b);

/** Lineare Gleichung mit Äquivalenzumformungen lösen, Schreibweise wie in der Schule („| − 5“). */
export function solveEq(str: string): EqSolution {
  const tokens = tokenize(str);
  const eqs = tokens.filter(t => t.t === '=').length;
  if (eqs !== 1) throw new MathError(eqs ? 'Eine Gleichung hat genau ein =.' : 'Eine Gleichung braucht ein =.');
  const k = tokens.findIndex(t => t.t === '=');
  const lt = tokens.slice(0, k), rt = tokens.slice(k + 1);
  if (!lt.length || !rt.length) throw new MathError('Auf beiden Seiten vom = muss etwas stehen.');
  const left = parse(lt), right = parse(rt);
  if (!hasX(left) && !hasX(right)) throw new MathError('In der Gleichung kommt kein x vor.');
  const L = lin(left), R = lin(right);
  const rows: EqRow[] = [{ eq: `${rH(left)} = ${rH(right)}`, expl: 'Die Gleichung' }];
  let a1 = L.a, b1 = L.b, a2 = R.a, b2 = R.b;
  const simple = `${linH(L)} = ${linH(R)}`;
  if (simple !== rows[0].eq)
    rows.push({ eq: simple, op: 'vereinfachen', expl: 'Beide Seiten vereinfachen: Klammern ausmultiplizieren und gleiche Teile zusammenfassen (x-Teile zu x-Teilen, Zahlen zu Zahlen).' });
  if (a1.isZero() && !a2.isZero()) {
    [a1, b1, a2, b2] = [a2, b2, a1, b1];
    rows.push({ eq: `${linH({ a: a1, b: b1 })} = ${qH(b2)}`, op: 'Seiten tauschen', expl: 'Das x steht nur rechts. Du darfst die beiden Seiten einfach tauschen, damit x links steht.' });
  }
  if (!a2.isZero()) {
    const op = a2.sign() > 0 ? `${MINUS} ${coefH(a2)}<i>x</i>` : `+ ${coefH(a2.neg())}<i>x</i>`;
    a1 = a1.sub(a2);
    a2 = q(0);
    rows.push({ eq: `${linH({ a: a1, b: b1 })} = ${qH(b2)}`, op: `| ${op}`, ask: { q: 'Welche Zahl steht danach links vor dem <i>x</i>?', v: a1 }, expl: `Alle x sollen auf die linke Seite. Rechne dafür auf beiden Seiten ${op}. Was du links machst, machst du auch rechts, wie bei einer Waage.` });
  }
  if (a1.isZero()) {
    const all = b1.eq(b2);
    const msg = all
      ? 'Das x ist verschwunden und die Aussage stimmt immer. Jede Zahl ist eine Lösung.'
      : 'Das x ist verschwunden und die Aussage ist falsch. Die Gleichung hat keine Lösung.';
    const eqs0 = `${qH(b1)} = ${qH(b2)}`, last = rows[rows.length - 1];
    if (rows.length > 1 && last.eq === eqs0) last.expl += ' ' + msg;
    else rows.push({ eq: eqs0, expl: msg });
    return { kind: 'eq', input: str, rows, solution: all ? 'all' : 'none', result: null, resultHTML: all ? 'Jede Zahl ist eine Lösung' : 'Keine Lösung' };
  }
  if (!b1.isZero()) {
    const op = b1.sign() > 0 ? `${MINUS} ${qH(b1)}` : `+ ${qH(b1.neg())}`;
    const nb = b2.sub(b1);
    const shown = b1.sign() > 0 ? '+ ' + qH(b1) : MINUS + ' ' + qH(b1.neg());
    rows.push({ eq: `${linH({ a: a1, b: q(0) })} = ${qH(nb)}`, op: `| ${op}`, ask: { q: 'Welche Zahl steht danach rechts vom = ?', v: nb }, expl: `Die Zahl ${shown} soll weg von der x-Seite. Mach das Gegenteil und rechne auf beiden Seiten ${op}: ${qH(b2)} ${b1.sign() > 0 ? MINUS + ' ' + qH(b1) : '+ ' + qH(b1.neg())} = ${qH(nb)}.` });
    b2 = nb;
    b1 = q(0);
  }
  let x = b2;
  if (!a1.eq(q(1))) {
    x = b2.div(a1);
    const isFrac = a1.d !== 1n;
    rows.push({ eq: `<i>x</i> = ${qH(x)}`, op: `| : ${hb(a1)}`, ask: { q: 'Was ist <i>x</i>?', v: x }, expl: `Vor dem x steht ${qH(a1)}. Das heißt „${qH(a1)} mal x“. Das Gegenteil von Malnehmen ist Teilen: Teile beide Seiten durch ${hb(a1)}. ${isFrac ? 'Durch einen Bruch teilen heißt, mit dem Kehrwert malnehmen. ' : ''}${qH(b2)} : ${hb(a1)} = ${qH(x)}.` });
  }
  const lv = evalLin(L, x), rv = evalLin(R, x);
  const probe = `Probe: Setze <i>x</i> = ${qH(x)} in die Gleichung ein. Links kommt ${qH(lv)} heraus, rechts ${qH(rv)}. ${lv.eq(rv) ? 'Beide Seiten sind gleich, die Lösung stimmt ✓' : 'Achtung, die Seiten sind verschieden!'}`;
  return { kind: 'eq', input: str, rows, probe, solution: 'one', result: x, resultHTML: `<i>x</i> = ${qH(x)}` };
}

/** Eingabe mit = ist eine Gleichung, sonst ein Term. */
export function solveAny(input: string): ExprSolution | EqSolution {
  const str = String(input || '').trim();
  if (!str) throw new MathError('Gib zuerst eine Aufgabe ein.');
  return str.includes('=') ? solveEq(str) : evalExpr(str);
}

export interface Answer { v: Q; raw: boolean }
/** Antwort eines Schülers lesen: 3/4, 1 1/2, 0,75, x = 5, 25 %, 12 € … `raw` = als Bruch a/b eingegeben (zum Prüfen aufs Kürzen). */
export function parseAnswer(input: string): Answer {
  const s = String(input || '').trim()
    .replace(/^x\s*=\s*/i, '')
    .replace(/°\s*c?|[%€°]|\b(kg|g|t|mm|dm|cm|km|m|l|ml|ct|cent|euro|eur|stück|stücke|schüler|kinder|min|minuten|h|s|sek|sekunden|jahre|jahr|tage|liter|personen|stunden|std|seiten|punkte|plätze|gläser|tüten|hefte|stifte|pakete|packungen|grad)[²³]?(?![a-zäöüß])\.?/gi, '')
    .trim();
  if (!s) throw new MathError('Gib zuerst eine Antwort ein.');
  // Große Zahlen mit Tausenderpunkten oder Leerzeichen: 4.382.615 oder 4 382 615
  if (/^-?\d{1,3}([ .\u202f\u00a0]\d{3})+$/.test(s)) return { v: q(BigInt(s.replace(/[ .\u202f\u00a0]/g, ''))), raw: false };
  let m = s.match(/^(-|−)?\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    if (BigInt(m[3]) === 0n) throw new MathError('Ein Bruch mit Nenner 0 ist nicht erlaubt.');
    return { v: new Q(BigInt(m[2]) * (m[1] ? -1n : 1n), BigInt(m[3])), raw: true };
  }
  m = s.match(/^(-|−)?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const v = q(BigInt(m[2])).add(new Q(BigInt(m[3]), BigInt(m[4])));
    return { v: m[1] ? v.neg() : v, raw: false };
  }
  if (/x/i.test(s)) throw new MathError('Gib nur die Zahl ein, zum Beispiel 5 oder x = 5.');
  return { v: evalExpr(s).result, raw: false };
}
