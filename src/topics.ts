/* ===== Themen, Theorie und Aufgaben-Generatoren ===== */
import type { GuideStep } from './guide.js';
import { MathError, Q, q, dp, gcd, qH, fracH, evalExpr, solveEq, tokenize, type Solution, type ExprSolution, type ListSolution } from './engine/index.js';

/** Eine Übungsaufgabe. `answer` und `sol` kommen immer aus der Recheneinheit. */
export interface Task {
  prompt: string;
  plain?: string;
  answer: Q;
  sol: Solution;
  needReduced?: boolean;
  diag?: (v: Q) => string | null;
  placeholder?: string;
  int?: Q;
  /** Eigene Schritte für „Gemeinsam lösen“ (sonst aus dem Rechenweg abgeleitet). */
  guide?: GuideStep[];
  /** Textaufgabe */
  word?: boolean;
}
export interface Topic {
  id: string;
  klasse: number;
  title: string;
  short: string;
  theory: string;
  example?: string;
  exampleSol?: () => { prompt: string; sol: Solution };
  gen: (level: number) => Task | null;
}

export const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const M = (s: string): string => `<span class="math">${s}</span>`;
export function barH(n: number, d: number, label: string): string {
  let cells = ''; for (let i = 0; i < d; i++) cells += `<span class="${i < n ? 'on' : ''}"></span>`;
  return `<div class="barwrap"><div class="bar" style="--d:${d}" role="img" aria-label="${n} von ${d} Teilen">${cells}</div><span class="barlabel">${label}</span></div>`;
}
const divisors = (n: number): number[] => { const r: number[] = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };

function kuerzenSol(n: number, d: number): ListSolution {
  const raw = q(n, d), g = Number(gcd(BigInt(n), BigInt(d))), r = raw.red();
  const dn = divisors(n), dd = divisors(d);
  const mark = (list: number[], other: number[]) => list.map(x => (other.includes(x) ? `<b class="common">${x}</b>` : x)).join(', ');
  const steps = [{ rule: 'Teiler suchen', lines: [
    `Teiler von ${n}: ${mark(dn, dd)}`, `Teiler von ${d}: ${mark(dd, dn)}`,
    `Fett sind die Zahlen, die beide teilen. Die größte davon ist der <b>ggT = ${g}</b> (größter gemeinsamer Teiler).`] }];
  if (g === 1) steps.push({ rule: 'Fertig', lines: ['Der ggT ist 1. Der Bruch ist also schon vollständig gekürzt.'] });
  else steps.push({ rule: 'Kürzen', lines: [`Teile Zähler und Nenner durch ${g}: ${qH(raw)} = ${fracH(`${n} : ${g}`, `${d} : ${g}`)} = ${qH(r)}`, 'Jetzt haben Zähler und Nenner keinen gemeinsamen Teiler mehr außer 1. Der Bruch ist vollständig gekürzt.'] });
  return { kind: 'list', steps, result: r, resultHTML: qH(r), extra: d <= 24 && r.d <= 24 ? [`So sieht das aus:${barH(n, d, qH(raw))}${barH(Number(r.n), Number(r.d), qH(r))}Gleich viel angemalt, nur größere Stücke.`] : [] };
}

function percentSol(kind: 'W' | 'p' | 'G', G: Q, p: Q, W: Q, unit: string): ListSolution {
  const h = (x: Q) => qH(x, true); const u = unit ? ' ' + unit : '';
  const c = G.div(q(100));
  const steps: ListSolution['steps'] = [];
  if (kind === 'W') {
    steps.push({ rule: 'Was ist gegeben?', lines: [`Das Ganze (Grundwert) ist G = ${h(G)}${u}. Das sind 100 %.`, `Gesucht ist der Teil (Prozentwert) W für ${h(p)} %.`] });
    steps.push({ rule: 'Erst 1 % ausrechnen', lines: [`100 % sind ${h(G)}${u}. Für 1 % teilst du durch 100:`, `${h(G)} : 100 = ${h(c)}${u}`] });
    steps.push({ rule: `Dann ${h(p)} % ausrechnen`, lines: [`${h(p)} % ist ${h(p)}-mal so viel wie 1 %:`, `${h(p)} · ${h(c)} = ${h(W)}${u}`] });
    return { kind: 'list', steps, result: W, resultHTML: `${h(W)}${u}`, extra: [`Mit Formel geht es in einem Schritt: W = G · p : 100 = ${h(G)} · ${h(p)} : 100 = ${h(W)}${u}`] };
  }
  if (kind === 'p') {
    const share = W.div(G);
    steps.push({ rule: 'Was ist gegeben?', lines: [`Das Ganze ist G = ${h(G)}${u} (100 %). Der Teil ist W = ${h(W)}${u}.`, 'Gesucht ist, wie viel Prozent der Teil vom Ganzen ist.'] });
    steps.push({ rule: 'Anteil als Bruch', lines: [`Der Teil geteilt durch das Ganze: ${fracH(h(W), h(G))} = ${qH(share)}`] });
    steps.push({ rule: 'In Prozent umrechnen', lines: [`Prozent heißt „von Hundert“. Also mal 100: ${qH(share)} · 100 = ${h(p)} %`] });
    return { kind: 'list', steps, result: p, resultHTML: `${h(p)} %`, extra: [`Mit Formel: p = W : G · 100 = ${h(W)} : ${h(G)} · 100 = ${h(p)} %`] };
  }
  const one = W.div(p);
  steps.push({ rule: 'Was ist gegeben?', lines: [`Der Teil W = ${h(W)}${u} entspricht ${h(p)} %.`, 'Gesucht ist das Ganze (Grundwert), also 100 %.'] });
  steps.push({ rule: 'Erst 1 % ausrechnen', lines: [`${h(p)} % sind ${h(W)}${u}. Für 1 % teilst du durch ${h(p)}:`, `${h(W)} : ${h(p)} = ${h(one)}${u}`] });
  steps.push({ rule: 'Dann 100 % ausrechnen', lines: ['Das Ganze sind 100 %, also 100-mal so viel:', `100 · ${h(one)} = ${h(G)}${u}`] });
  return { kind: 'list', steps, result: G, resultHTML: `${h(G)}${u}`, extra: [`Mit Formel: G = W · 100 : p = ${h(W)} · 100 : ${h(p)} = ${h(G)}${u}`] };
}

function percentGuide(kind: 'W' | 'p' | 'G', G: Q, p: Q, W: Q, unit: string): GuideStep[] {
  const h = (x: Q) => qH(x, true); const u = unit ? ' ' + unit : '';
  if (kind === 'W') {
    const c = G.div(q(100));
    return [
      { title: 'Erst 1 % ausrechnen', ask: `Das Ganze sind ${h(G)}${u} (100 %). Wie viel ist 1 %?`, answer: c, hint: 'Für 1 % teilst du das Ganze durch 100.', explain: `${h(G)} : 100 = ${h(c)}${u}` },
      { title: `Dann ${h(p)} % ausrechnen`, ask: `Wie viel sind ${h(p)} %?`, answer: W, hint: `${h(p)} % ist ${h(p)}-mal so viel wie 1 %.`, explain: `${h(p)} · ${h(c)} = ${h(W)}${u}`, placeholder: `Antwort in ${unit}` },
    ];
  }
  if (kind === 'p') {
    const share = W.div(G);
    return [
      { title: 'Anteil als Bruch', ask: `Schreibe den Teil (${h(W)}) geteilt durch das Ganze (${h(G)}) als Bruch oder Kommazahl.`, answer: share, hint: 'Teil durch Ganzes.', explain: `${fracH(h(W), h(G))} = ${qH(share)}`, placeholder: 'z. B. 3/10' },
      { title: 'In Prozent umrechnen', ask: 'Wie viel Prozent sind das?', answer: p, hint: 'Prozent heißt „von Hundert“: Rechne mal 100.', explain: `${qH(share)} · 100 = ${h(p)} %`, placeholder: 'Antwort in %' },
    ];
  }
  const one = W.div(p);
  return [
    { title: 'Erst 1 % ausrechnen', ask: `${h(p)} % sind ${h(W)}${u}. Wie viel ist 1 %?`, answer: one, hint: `Teile durch ${h(p)}.`, explain: `${h(W)} : ${h(p)} = ${h(one)}${u}` },
    { title: 'Dann 100 % ausrechnen', ask: 'Wie viel sind 100 %, also das Ganze?', answer: G, hint: 'Rechne mal 100.', explain: `100 · ${h(one)} = ${h(G)}${u}`, placeholder: `Antwort in ${unit}` },
  ];
}

/* Hilfen für Generatoren */
function exprTask(s: string, o: { prompt?: string; needReduced?: boolean; diag?: (v: Q) => string | null; placeholder?: string } = {}): Task & { sol: ExprSolution } {
  const sol = evalExpr(s);
  return { prompt: o.prompt || `Berechne: ${M(sol.inputHTML)}`, plain: s, answer: sol.result, sol, needReduced: !!o.needReduced, diag: o.diag, placeholder: o.placeholder || 'Deine Lösung' };
}
function genFrom<T>(make: () => T | null, ok: (t: T) => boolean, tries = 400): T | null { for (let i = 0; i < tries; i++) { try { const t = make(); if (t && ok(t)) return t; } catch (e) { if (!(e instanceof MathError)) throw e; } } return null; }
const allInt = (sol: ExprSolution) => sol.vals.every(v => v.isInt() && v.sign() > 0) && sol.result.isInt() && sol.result.sign() >= 0;
function leftToRight(s: string): Q | null {
  if (/[()]/.test(s)) return null;
  const t = tokenize(s) as { s?: string; v?: string }[]; let v = q(BigInt(t[0].s!));
  for (let i = 1; i < t.length; i += 2) { const b = q(BigInt(t[i + 1].s!)); const o = t[i].v; v = o === '+' ? v.add(b) : o === '-' ? v.sub(b) : o === '*' ? v.mul(b) : v.div(b); }
  return v;
}
const fr = (n: number, d: number) => `${n}/${d}`;
function coprimeFrac(maxD: number, minD = 2): [number, number] { const d = R(minD, maxD); let n: number; do { n = R(1, d - 1); } while (gcd(BigInt(n), BigInt(d)) !== 1n); return [n, d]; }

export const TOPICS: Topic[] = [
  {
    id: 'pvs', klasse: 5, title: 'Punkt vor Strich', short: 'In welcher Reihenfolge rechnest du, wenn Plus, Mal und Klammern zusammen vorkommen?',
    example: '2 + 3 · (8 − 4)',
    theory: `
      <p>Ein <b>Term</b> ist eine Rechenaufgabe mit mehreren Rechenzeichen, zum Beispiel ${M('2 + 3 · 4')}. Die große Frage ist: Was rechnest du zuerst?</p>
      <p>Würdest du einfach von links nach rechts rechnen, käme 5 · 4 = 20 heraus. Richtig ist aber <b>14</b>. Warum? Stell dir vor, du kaufst ein Heft für 2 € und 3 Stifte für je 4 €. Die Stifte kosten 3 · 4 = 12 €. Dazu das Heft: 2 + 12 = 14 €.</p>
      <p>Mal ist eine Abkürzung für viele gleiche Plus-Aufgaben: ${M('3 · 4 = 4 + 4 + 4')}. Das gehört zusammen, deshalb rechnest du es zuerst.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li><b>Klammern zuerst.</b> Was in ( ) steht, wird zuerst ausgerechnet.</li><li><b>Punkt vor Strich.</b> · und : kommen vor + und −.</li><li><b>Sonst von links nach rechts.</b></li></ol></div>
      <p>Tipp: Unterstreiche oder markiere vor dem Rechnen den Teil, der zuerst dran ist. Genau so zeigt es dir auch der Rechenweg in der App.</p>`,
    gen(level: number) {
      const T = [
        ['a + b · c', 'a · b − c', 'a − b · c', 'a + b : c', 'a · b + c · d'],
        ['(a + b) · c', 'a · (b − c)', 'a + b · c − d', '(a − b) : c + d', 'a · b − c : d'],
        ['a · (b + c) − d : e', '(a + b) · (c − d)', 'a − (b + c · d) : e', '(a · b − c) : d + e', 'a + b · (c − d) : e'],
      ][level - 1];
      const max = [10, 15, 20][level - 1];
      return genFrom(() => {
        const s = pick(T).replace(/[a-e]/g, () => String(R(2, max)));
        const t = exprTask(s, { diag: v => { const l = leftToRight(s); return l && l.eq(v) ? 'Du hast einfach von links nach rechts gerechnet. Denk an <b>Punkt vor Strich</b>: · und : kommen zuerst!' : /\(/.test(s) ? 'Hast du die <b>Klammer zuerst</b> ausgerechnet? Gehe die Aufgabe Schritt für Schritt durch.' : null; } });
        return t;
      }, t => allInt(t.sol) && t.answer.lt(q(1000)));
    },
  },
  {
    id: 'kuerzen', klasse: 6, title: 'Brüche kürzen', short: 'Was ein Bruch ist und wie du ihn so einfach wie möglich schreibst.',
    exampleSol: () => ({ prompt: `Kürze vollständig: ${M(qH(q(18, 24)))}`, sol: kuerzenSol(18, 24) }),
    theory: `
      <p>Ein <b>Bruch</b> beschreibt Teile von einem Ganzen. Bei ${M(qH(q(3, 4)))} wird das Ganze in <b>4</b> gleich große Stücke geteilt. Das sagt die untere Zahl, der <b>Nenner</b>. Davon nimmst du <b>3</b> Stücke. Das sagt die obere Zahl, der <b>Zähler</b>.</p>
      ${barH(3, 4, qH(q(3, 4)))}
      <p><b>Kürzen</b> heißt: Zähler und Nenner durch dieselbe Zahl teilen. Der Bruch bleibt genauso groß, nur die Stücke werden größer und es sind weniger.</p>
      ${barH(6, 8, qH(q(6, 8)))}${barH(3, 4, qH(q(3, 4)))}
      <p>Bei ${M(qH(q(6, 8)))} teilst du oben und unten durch 2 und bekommst ${M(qH(q(3, 4)))}. Gleich viel angemalt!</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Kürzen: Zähler <b>und</b> Nenner durch dieselbe Zahl teilen.</li><li>Am schnellsten geht es mit dem <b>ggT</b>, dem größten gemeinsamen Teiler.</li><li>Vollständig gekürzt ist ein Bruch, wenn oben und unten nur noch 1 als gemeinsamen Teiler haben.</li></ol></div>
      <p>Teilbarkeits-Tricks: Gerade Zahlen gehen durch 2. Endet die Zahl auf 0 oder 5, geht sie durch 5. Ist die Quersumme durch 3 teilbar, geht die Zahl durch 3.</p>`,
    gen(level: number) {
      const [n0, d0] = coprimeFrac([6, 9, 12][level - 1]);
      const k = pick([[2, 3], [2, 3, 4, 5], [4, 6, 7, 8, 9, 12]][level - 1]);
      const n = n0 * k, d = d0 * k;
      const g = Number(gcd(BigInt(n), BigInt(d)));
      const guide: GuideStep[] = [
        { title: 'ggT finden', ask: `Was ist die größte Zahl, durch die ${n} und ${d} beide teilbar sind?`, answer: q(g), hint: `Schreibe die Teiler von ${n} und von ${d} auf und suche die größte Zahl, die in beiden Listen vorkommt.`, explain: `Der ggT von ${n} und ${d} ist ${g}.` },
        { title: 'Kürzen', ask: `Teile Zähler und Nenner von ${M(qH(q(n, d)))} durch ${g}. Welcher Bruch kommt heraus?`, answer: q(n0, d0), needReduced: true, hint: `${n} : ${g} und ${d} : ${g}`, explain: `${M(`${qH(q(n, d))} = ${fracH(`${n} : ${g}`, `${d} : ${g}`)} = ${qH(q(n0, d0))}`)}`, placeholder: 'z. B. 3/4' },
      ];
      return { guide, prompt: `Kürze den Bruch vollständig: ${M(qH(q(n, d)))}`, plain: `${n}/${d} vollständig kürzen`, answer: q(n0, d0), sol: kuerzenSol(n, d), needReduced: true, placeholder: 'z. B. 3/4',
        diag: v => (v.eq(q(n, d)) ? 'Das ist noch der Ausgangsbruch. Teile Zähler und Nenner durch dieselbe Zahl.' : 'Prüfe: Hast du Zähler und Nenner durch <b>dieselbe</b> Zahl geteilt?') };
    },
  },
  {
    id: 'bradd', klasse: 6, title: 'Brüche addieren und subtrahieren', short: 'Hauptnenner finden, erweitern, zusammenrechnen.',
    example: '1/2 + 2/3',
    theory: `
      <p>Du kannst nur <b>gleich große Stücke</b> zusammenzählen. Ein halbes Stück Pizza plus ein Viertel ist nicht „zwei Sechstel“, denn Halbe und Viertel sind verschieden groß.</p>
      <p><b>Fall 1: gleiche Nenner.</b> Die Stücke sind gleich groß. Du zählst nur die Zähler zusammen, der Nenner bleibt: ${M(`${qH(q(1, 5))} + ${qH(q(2, 5))} = ${qH(q(3, 5))}`)}.</p>
      ${barH(1, 5, qH(q(1, 5)))}${barH(2, 5, qH(q(2, 5)))}${barH(3, 5, qH(q(3, 5)))}
      <p><b>Fall 2: verschiedene Nenner.</b> Zuerst machst du gleich große Stücke. Dafür suchst du den <b>Hauptnenner</b>: die kleinste Zahl, in der beide Nenner aufgehen. Dann <b>erweiterst</b> du: Zähler und Nenner mit derselben Zahl malnehmen.</p>
      <p>Beispiel: ${M(`${qH(q(1, 2))} + ${qH(q(1, 4))}`)}. Hauptnenner ist 4. ${M(`${qH(q(1, 2))} = ${qH(q(2, 4))}`)}. Also ${M(`${qH(q(2, 4))} + ${qH(q(1, 4))} = ${qH(q(3, 4))}`)}.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Nie Nenner plus Nenner rechnen!</li><li>Erst gleiche Nenner herstellen (Hauptnenner, erweitern).</li><li>Dann Zähler addieren oder subtrahieren, der Nenner bleibt.</li><li>Zum Schluss kürzen, wenn es geht.</li></ol></div>`,
    gen(level: number) {
      return genFrom(() => {
        let s: string, a: number, b: number, c: number, d: number, op = '+';
        if (level === 1) { d = R(3, 12); a = R(1, d - 1); b = R(1, d - 1); op = pick(['+', '-']); if (op === '-' && b > a) [a, b] = [b, a]; s = `${fr(a, d)} ${op} ${fr(b, d)}`; }
        else if (level === 2) { const D = [2, 3, 4, 5, 6, 8, 10, 12]; b = pick(D); d = pick(D.filter(x => x !== b)); a = R(1, b - 1); c = R(1, d - 1); op = pick(['+', '+', '-']); s = `${fr(a, b)} ${op} ${fr(c, d)}`; }
        else {
          const D = [2, 3, 4, 5, 6, 8, 9, 10, 12]; const x = pick(D), y = pick(D), z = pick(D);
          s = pick([`${R(1, 3)} + ${fr(R(1, x - 1), x)} − ${fr(R(1, y - 1), y)}`, `${fr(R(1, x - 1), x)} + ${fr(R(1, y - 1), y)} − ${fr(R(1, z - 1), z)}`, `${fr(R(1, x - 1), x)} − ${fr(R(1, y - 1), y)}`]);
        }
        const t = exprTask(s, { needReduced: true, placeholder: 'z. B. 7/12',
          diag: v => {
            const m = s.match(/^(\d+)\/(\d+) ([+-]) (\d+)\/(\d+)$/); if (!m) return null;
            const [A, B, C, D2] = [m[1], m[2], m[4], m[5]].map(Number);
            const wrong = m[3] === '+' ? q(A + C, B + D2) : (B - D2 !== 0 ? q(A - C, B - D2) : null);
            return wrong && wrong.eq(v) ? 'Du hast Zähler plus Zähler <b>und</b> Nenner plus Nenner gerechnet. Die Stücke müssen aber zuerst gleich groß sein: Suche den Hauptnenner!' : null;
          } });
        return t;
      }, t => t.answer.sign() > 0 && t.sol.vals.every(v => v.sign() >= 0));
    },
  },
  {
    id: 'brmul', klasse: 6, title: 'Brüche multiplizieren und dividieren', short: 'Zähler mal Zähler, Nenner mal Nenner und der Trick mit dem Kehrwert.',
    example: '3/4 : 5/8',
    theory: `
      <p><b>Malnehmen:</b> ${M(`${qH(q(1, 2))} · ${qH(q(1, 3))}`)} heißt „die Hälfte von einem Drittel“. Teilst du ein Drittel in zwei Hälften, bekommst du ein Sechstel. Die Regel dafür ist einfach: <b>Zähler mal Zähler, Nenner mal Nenner.</b></p>
      <p>${M(`${qH(q(2, 3))} · ${qH(q(3, 5))} = ${fracH('2 · 3', '3 · 5')} = ${qH(q(6, 15))} = ${qH(q(2, 5))}`)}</p>
      <p>Hier brauchst du keinen Hauptnenner. Den brauchst du nur bei Plus und Minus.</p>
      <p><b>Teilen:</b> ${M(`3 : ${qH(q(1, 2))}`)} fragt: Wie oft passt ein Halb in 3? In jedes Ganze passen 2 Halbe, also 6-mal. Das ist dasselbe wie ${M('3 · 2')}. Deshalb gilt: <b>Durch einen Bruch teilen heißt, mit seinem Kehrwert malnehmen.</b> Den Kehrwert bekommst du, wenn du Zähler und Nenner tauschst.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Mal: Zähler · Zähler und Nenner · Nenner.</li><li>Geteilt: mit dem Kehrwert malnehmen, also umdrehen und mal.</li><li>Ganze Zahl als Bruch: ${M(`3 = ${fracH('3', '1')}`)}</li><li>Am Ende kürzen.</li></ol></div>`,
    gen(level: number) {
      return genFrom(() => {
        const [a, b] = coprimeFrac(level === 1 ? 6 : 10), [c, d] = coprimeFrac(level === 1 ? 6 : 10);
        let s;
        if (level === 1) s = `${fr(a, b)} · ${fr(c, d)}`;
        else if (level === 2) s = pick([`${fr(a, b)} : ${fr(c, d)}`, `${fr(a, b)} · ${fr(c, d)}`, `${fr(a, b)} : ${fr(c, d)}`]);
        else s = pick([`${R(2, 9)} · ${fr(c, d)}`, `${fr(a, b)} : ${R(2, 6)}`, `${R(2, 6)} : ${fr(c, d)}`, `${fr(a, b)} · ${fr(c, d)} : ${fr(R(1, 4), 5)}`]);
        return exprTask(s, { needReduced: true, placeholder: 'z. B. 3/5',
          diag: v => {
            const m = s.match(/^(\d+)\/(\d+) ([·:]) (\d+)\/(\d+)$/); if (!m) return null;
            const [A, B, C, D] = [m[1], m[2], m[4], m[5]].map(Number);
            if (m[3] === ':' && q(A * C, B * D).eq(v)) return 'Du hast mal statt geteilt gerechnet. Beim Teilen musst du zuerst den <b>Kehrwert</b> des zweiten Bruchs bilden.';
            if (m[3] === ':' && q(B * C, A * D).eq(v)) return 'Fast! Du hast den <b>ersten</b> Bruch umgedreht. Umgedreht wird der Bruch, durch den du teilst, also der zweite.';
            return null;
          } });
      }, t => t.answer.sign() > 0 && t.answer.d <= 200n);
    },
  },
  {
    id: 'dez', klasse: 6, title: 'Dezimalzahlen', short: 'Komma unter Komma, Kommastellen zählen und Komma verschieben.',
    example: '3,75 + 2,5',
    theory: `
      <p>Bei einer <b>Dezimalzahl</b> zeigt das Komma, wo die Ganzen aufhören. ${M('2,35')} heißt: 2 Ganze, 3 Zehntel und 5 Hundertstel. Wie beim Geld: 2,35 € sind 2 Euro und 35 Cent.</p>
      <table class="stellen"><tr><th>Einer</th><th></th><th>Zehntel</th><th>Hundertstel</th></tr><tr><td>2</td><td>,</td><td>3</td><td>5</td></tr></table>
      <p><b>Plus und Minus:</b> Schreibe die Zahlen so untereinander, dass <b>Komma unter Komma</b> steht. Fehlende Stellen füllst du mit 0 auf. Dann rechnest du wie gewohnt.</p>
      <p><b>Mal:</b> Rechne erst ohne Komma. Zähle dann, wie viele Stellen hinter dem Komma beide Zahlen zusammen haben. So viele Stellen setzt du im Ergebnis von rechts das Komma. ${M('0,4 · 0,3')}: 4 · 3 = 12, zwei Nachkommastellen, also ${M('0,12')}.</p>
      <p><b>Geteilt:</b> Durch eine Kommazahl teilt man nicht gern. Verschiebe das Komma bei <b>beiden</b> Zahlen gleich weit nach rechts, bis der Teiler eine ganze Zahl ist. ${M('4,5 : 0,5 = 45 : 5 = 9')}.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Plus/Minus: Komma unter Komma.</li><li>Mal: Nachkommastellen zusammenzählen.</li><li>Geteilt: Komma bei beiden Zahlen gleich weit verschieben.</li></ol></div>`,
    gen(level: number) {
      const nz = (a: number, b: number) => { let v: number; do { v = R(a, b); } while (v % 10 === 0); return v; };
      const d1 = () => (nz(1, 99) / 10).toFixed(1).replace('.', ',');
      const d2 = () => (nz(1, 999) / 100).toFixed(2).replace('.', ',');
      return genFrom(() => {
        let s;
        if (level === 1) s = pick([`${d1()} + ${d1()}`, `${d2()} + ${d1()}`, `${d1()} + ${R(1, 20)}`]);
        else if (level === 2) s = pick([`${d2()} − ${d1()}`, `${d1()} · ${R(2, 9)}`, `${d1()} − ${d2()}`, `${d2()} + ${d2()}`]);
        else s = pick([`${d1()} · ${d1()}`, `${d1()} : 0,${R(2, 5)}`, `${d1()} · 0,${R(2, 9)}`, `${R(2, 9)},${R(1, 9)} : ${R(2, 5)}`]);
        return exprTask(s, { placeholder: 'z. B. 6,25',
          diag: v => {
            const a = evalExpr(s).result;
            for (const f of [10, 100]) if (v.eq(a.mul(q(f))) || v.eq(a.div(q(f)))) return 'Die Ziffern stimmen, aber das <b>Komma</b> steht an der falschen Stelle. Zähle die Nachkommastellen noch einmal.';
            return null;
          } });
      }, t => t.answer.sign() > 0 && t.answer.terminating() && dp(t.answer) <= 3);
    },
  },
  {
    id: 'proz', klasse: 7, title: 'Prozentrechnung', short: 'Grundwert, Prozentsatz und Prozentwert mit dem Dreisatz.',
    exampleSol: () => ({ prompt: 'Eine Jacke kostet 80 €. Im Angebot gibt es 25 % Rabatt. Wie viel Euro sparst du?', sol: percentSol('W', q(80), q(25), q(20), '€') }),
    theory: `
      <p><b>Prozent</b> heißt „von Hundert“. ${M(`25 % = ${qH(q(25, 100))} = ${qH(q(1, 4))}`)}, also ein Viertel. 100 % ist immer <b>das Ganze</b>.</p>
      <p>Bei jeder Prozentaufgabe gibt es drei Größen. Zwei sind gegeben, eine suchst du:</p>
      <ul><li><b>Grundwert G</b>: das Ganze (100 %). Zum Beispiel alle 40 Kinder einer Klasse.</li><li><b>Prozentsatz p %</b>: wie viel Prozent. Zum Beispiel 25 %.</li><li><b>Prozentwert W</b>: der Teil. Zum Beispiel 10 Kinder.</li></ul>
      <p>Der sicherste Weg ist der <b>Dreisatz</b>: Rechne zuerst aus, wie viel <b>1 %</b> ist. Dann rechnest du auf das hoch, was du suchst.</p>
      <p>Beispiel: 25 % von 40. 1 % von 40 ist ${M('40 : 100 = 0,4')}. 25 % sind ${M('25 · 0,4 = 10')}.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>W = G · p : 100</li><li>p = W : G · 100</li><li>G = W · 100 : p</li><li>Wenn du unsicher bist: Dreisatz über 1 %.</li></ol></div>`,
    gen(level: number) {
      const ctx = [
        { G: () => pick([20, 25, 30, 40, 50]), unit: 'Kinder', W: (p: number, G: number) => `In einer Schule gehen ${G} Kinder in die Klasse 6. ${p} % davon fahren mit dem Rad. Wie viele Kinder sind das?`, P: (W: string, G: number) => `Von ${G} Kindern einer Klasse spielen ${W} Fußball im Verein. Wie viel Prozent sind das?`, Gq: (W: string, p: number) => `${W} Kinder einer Jahrgangsstufe haben eine 1 in Mathe. Das sind ${p} % aller Kinder. Wie viele Kinder sind es insgesamt?` },
        { G: () => pick([40, 60, 80, 120, 150, 200, 250]), unit: '€', W: (p: number, G: number) => `Ein Fahrrad kostet ${G} €. Im Angebot gibt es ${p} % Rabatt. Wie viel Euro sparst du?`, P: (W: string, G: number) => `Ein Spiel kostet ${G} €. Du bekommst ${W} € Rabatt. Wie viel Prozent Rabatt sind das?`, Gq: (W: string, p: number) => `Du sparst ${W} €. Das sind ${p} % vom ursprünglichen Preis. Wie teuer war es vorher?` },
        { G: () => pick([200, 300, 400, 500, 800, 1000]), unit: 'g', W: (p: number, G: number) => `Eine Tüte Müsli wiegt ${G} g. ${p} % davon sind Haferflocken. Wie viel Gramm sind das?`, P: (W: string, G: number) => `In ${G} g Joghurt stecken ${W} g Zucker. Wie viel Prozent Zucker sind das?`, Gq: (W: string, p: number) => `${W} g Nüsse sind ${p} % einer Studentenfutter-Packung. Wie schwer ist die ganze Packung?` },
      ];
      return genFrom(() => {
        const c = pick(ctx); const G = c.G();
        const p = pick([[10, 20, 25, 50, 75], [5, 15, 30, 40, 60, 80], [12, 35, 45, 65, 8]][level - 1]);
        const W = q(G).mul(q(p)).div(q(100));
        const kind = level === 1 ? pick(['W', 'W', 'p']) : level === 2 ? pick(['W', 'p']) : pick(['G', 'p', 'W']);
        if (kind === 'W') return { prompt: c.W(p, G), plain: c.W(p, G), answer: W, sol: percentSol('W', q(G), q(p), W, c.unit), guide: percentGuide('W', q(G), q(p), W, c.unit), placeholder: `Antwort in ${c.unit}`, diag: v => (v.eq(q(G * p)) ? 'Du hast G · p gerechnet, aber noch nicht durch 100 geteilt.' : v.eq(q(G).div(q(p))) ? 'Du hast durch den Prozentsatz geteilt. Rechne zuerst aus, wie viel 1 % ist.' : null), int: W };
        if (kind === 'p') { const t = c.P(W.toDec(), G); return { prompt: t, plain: t, answer: q(p), sol: percentSol('p', q(G), q(p), W, c.unit), guide: percentGuide('p', q(G), q(p), W, c.unit), placeholder: 'Antwort in %', diag: v => (v.eq(W.div(q(G))) ? 'Das ist der Anteil als Zahl. Für Prozent musst du noch mal 100 rechnen.' : null), int: W }; }
        const t = c.Gq(W.toDec(), p); return { prompt: t, plain: t, answer: q(G), sol: percentSol('G', q(G), q(p), W, c.unit), guide: percentGuide('G', q(G), q(p), W, c.unit), placeholder: `Antwort in ${c.unit}`, diag: v => (v.eq(W.mul(q(p)).div(q(100))) ? 'Du hast den Prozentwert ausgerechnet. Gesucht ist aber das Ganze (100 %).' : null), int: W };
      }, t => t.int.terminating() && dp(t.int) <= 2 && (t.prompt.includes('Kinder') ? t.int.isInt() : true));
    },
  },
  {
    id: 'gl', klasse: 7, title: 'Gleichungen lösen', short: 'Die Waage im Gleichgewicht: x Schritt für Schritt allein stellen.',
    example: '3x + 5 = 20',
    theory: `
      <p>Eine <b>Gleichung</b> ist wie eine <b>Waage</b> im Gleichgewicht. Links und rechts ist gleich viel. Das <b>x</b> ist eine Zahl, die du noch nicht kennst.</p>
      <p>${M('x + 3 = 8')} heißt: Welche Zahl plus 3 ergibt 8? Du siehst es vielleicht sofort: 5. Bei schwierigen Gleichungen brauchst du aber ein Verfahren.</p>
      <p><b>Die goldene Regel:</b> Was du auf einer Seite machst, musst du auch auf der anderen Seite machen. Sonst kippt die Waage.</p>
      <p>Dein Ziel ist, dass <b>x ganz allein</b> auf einer Seite steht. Dafür machst du immer das <b>Gegenteil</b> von dem, was mit dem x passiert:</p>
      <ul><li>Steht <b>+ 3</b> beim x, rechnest du auf beiden Seiten <b>− 3</b>.</li><li>Steht <b>3x</b> da (3 mal x), teilst du beide Seiten <b>durch 3</b>.</li></ul>
      <p>In der Schule schreibt man den Schritt rechts neben die Gleichung, mit einem Strich davor: ${M('3x + 5 = 20 &nbsp;| − 5')}.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Beide Seiten immer gleich behandeln.</li><li>Gegenteil: + und − heben sich auf, · und : heben sich auf.</li><li>Erst die Zahlen weg vom x, dann durch die Zahl vor dem x teilen.</li><li>Zum Schluss die <b>Probe</b>: x einsetzen, beide Seiten müssen gleich sein.</li></ol></div>`,
    gen(level: number) {
      return genFrom(() => {
        const x = level === 3 ? R(-6, 10) : R(1, 12);
        let s;
        if (level === 1) { const a = R(2, 15), k = R(2, 9); s = pick([`x + ${a} = ${x + a}`, `${k}x = ${k * x}`, `x − ${a} = ${x - a}`]); }
        else if (level === 2) { const a = R(2, 9), b = R(1, 20); s = pick([`${a}x + ${b} = ${a * x + b}`, `${a}x − ${b} = ${a * x - b}`]); }
        else { const a = R(2, 9), c = R(1, 8), b = R(1, 10) * pick([1, -1]), d = (a - c) * x + b; s = pick([`${a}x + ${b} = ${c}x + ${d}`, `${a}(x + ${Math.abs(b) || 1}) = ${a * (x + (Math.abs(b) || 1))}`]).replace(/\+ -/g, '− '); }
        const sol = solveEq(s);
        if (sol.solution !== 'one') return null;
        return { prompt: `Löse die Gleichung: ${M(sol.rows[0].eq)}`, plain: s, answer: sol.result!, sol, placeholder: 'x = …',
          diag: (v: Q) => (v.eq(sol.result!.neg()) ? 'Fast! Prüfe das <b>Vorzeichen</b>. Mach die Probe: Setze deine Zahl ein.' : 'Mach die Probe: Setze deine Zahl für x ein. Sind beide Seiten gleich?') };
      }, t => t.answer.isInt());
    },
  },
];
