/* ===== Themen, Theorie und Aufgaben-Generatoren ===== */
import { autoGuide, type GuideChoice, type GuideStep } from './guide.js';
import { B, M, R, divisors, exprTask, genFrom, list, pick, type Task, type Topic } from './gen.js';
import { MORE } from './topics-more.js';
import { LETTERS } from './widgets.js';
export { M, R, pick, type Task, type Topic };
import { MathError, Q, q, dp, gcd, lcm, qH, fracH, evalExpr, solveEq, tokenize, type Solution, type ExprSolution, type ListSolution } from './engine/index.js';

export function barH(n: number, d: number, label: string): string {
  let cells = ''; for (let i = 0; i < d; i++) cells += `<span class="${i < n ? 'on' : ''}"></span>`;
  return `<div class="barwrap"><div class="bar" style="--d:${d}" role="img" aria-label="${n} von ${d} Teilen">${cells}</div><span class="barlabel">${label}</span></div>`;
}

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
const allInt = (sol: ExprSolution) => sol.vals.every(v => v.isInt() && v.sign() > 0) && sol.result.isInt() && sol.result.sign() >= 0;
function leftToRight(s: string): Q | null {
  if (/[()]/.test(s)) return null;
  const t = tokenize(s) as { s?: string; v?: string }[]; let v = q(BigInt(t[0].s!));
  for (let i = 1; i < t.length; i += 2) { const b = q(BigInt(t[i + 1].s!)); const o = t[i].v; v = o === '+' ? v.add(b) : o === '-' ? v.sub(b) : o === '*' ? v.mul(b) : v.div(b); }
  return v;
}
const fr = (n: number, d: number) => `${n}/${d}`;
function coprimeFrac(maxD: number, minD = 2): [number, number] { const d = R(minD, maxD); let n: number; do { n = R(1, d - 1); } while (gcd(BigInt(n), BigInt(d)) !== 1n); return [n, d]; }

/* Teiler, ggT, kgV */
export const isPrime = (n: number) => n > 1 && divisors(n).length === 2;
const smallestFactor = (n: number) => { for (let p = 2; p * p <= n; p++) if (n % p === 0) return p; return n; };
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pairs = (n: number) => divisors(n).filter(a => a * a <= n).map(a => [a, n / a]);

function quersummeTask(n: number): Task {
  const ds = String(n).split('').map(Number), qs = ds.reduce((a, b) => a + b, 0), ok = qs % 3 === 0;
  return { prompt: `Berechne die Quersumme von ${M(String(n))}. Ist ${n} durch 3 teilbar?`, answer: q(qs), placeholder: 'Quersumme',
    sol: list([{ rule: 'Ziffern addieren', lines: [`${ds.join(' + ')} = ${qs}`] }, { rule: 'Teilbar durch 3?', lines: [ok ? `${qs} ist durch 3 teilbar, also ist auch ${n} durch 3 teilbar.` : `${qs} ist nicht durch 3 teilbar, also ist auch ${n} nicht durch 3 teilbar.`] }], q(qs)),
    guide: [{ title: 'Ziffern addieren', ask: `Die Quersumme ist die Summe aller Ziffern. Rechne:<div class="math big">${ds.join(' + ')} = ?</div>`, answer: q(qs), hint: 'Zähle die Ziffern einzeln zusammen.', explain: `${ds.join(' + ')} = ${qs}. ${ok ? `${qs} ist durch 3 teilbar, also auch ${n}.` : `${qs} ist nicht durch 3 teilbar, also auch ${n} nicht.`}` }] };
}
function teilerTask(n: number): Task {
  const dv = divisors(n), pr = pairs(n);
  return { prompt: `Wie viele Teiler hat ${M(String(n))}? (1 und ${n} zählen mit.)`, answer: q(dv.length), placeholder: 'Anzahl',
    sol: list([{ rule: 'Teiler paarweise suchen', lines: pr.map(([a, b]) => `${a} · ${b} = ${n}`) }, { rule: 'Zählen', lines: [`Teiler von ${n}: ${dv.join(', ')}`, `Das sind ${dv.length} Teiler.`] }], q(dv.length)),
    guide: [
      { title: 'Teilerpaare finden', ask: `<p>Teiler kommen immer als Paar: <b>1 · ${n} = ${n}</b>, <b>2 · ? = ${n}</b> und so weiter. Wie viele Paare findest du? Probiere 1, 2, 3, … bis die Zahlen sich treffen.</p>`, answer: q(pr.length), hint: `Prüfe der Reihe nach, ob ${n} durch 1, 2, 3, 4, … teilbar ist.`, explain: pr.map(([a, b]) => `${a} · ${b}`).join(', '), placeholder: 'Anzahl Paare' },
      { title: 'Teiler zählen', ask: `Jedes Paar sind zwei Teiler${pr.some(([a, b]) => a === b) ? ', aber bei einer Quadratzahl wie ' + M(`${Math.sqrt(n)} · ${Math.sqrt(n)}`) + ' zählt die Zahl nur einmal' : ''}. Wie viele Teiler hat ${n}?`, answer: q(dv.length), hint: 'Schreibe alle Zahlen aus den Paaren auf und zähle.', explain: `Teiler von ${n}: ${dv.join(', ')}` },
    ] };
}
function primTask(n: number): Task {
  let p = n + 1; while (!isPrime(p)) p++;
  const cand = range(n + 1, p - 1);
  return { prompt: `Welche ist die nächste Primzahl nach ${M(String(n))}?`, answer: q(p), placeholder: 'Primzahl',
    sol: list([{ rule: 'Zahlen der Reihe nach prüfen', lines: [...cand.map(k => `${k} = ${smallestFactor(k)} · ${k / smallestFactor(k)}, also keine Primzahl.`), `${p} hat nur die Teiler 1 und ${p}. Das ist eine Primzahl.`] }], q(p)),
    guide: [
      ...cand.map(k => ({ title: `Ist ${k} eine Primzahl?`, ask: `<p>Durch welche kleinste Zahl (außer 1) ist ${B(String(k))} teilbar?</p>`, answer: q(smallestFactor(k)), hint: 'Probiere 2, 3, 5, 7 … Gerade Zahlen sind durch 2 teilbar.', explain: `${k} = ${smallestFactor(k)} · ${k / smallestFactor(k)}. Also ist ${k} keine Primzahl.`, placeholder: 'kleinster Teiler' })),
      { title: 'Die Primzahl', ask: `Probiere die nächste Zahl. Welche ist also die nächste Primzahl nach ${n}?`, answer: q(p), hint: 'Eine Primzahl ist nur durch 1 und sich selbst teilbar.', explain: `${p} hat nur die Teiler 1 und ${p}.` },
    ] };
}
export function ggtTask(a: number, b: number): Task {
  const g = Number(gcd(BigInt(a), BigInt(b))), da = divisors(a), db = divisors(b);
  const mark = (l: number[], o: number[]) => l.map(x => (o.includes(x) ? `<b class="common">${x}</b>` : x)).join(', ');
  const guide: GuideStep[] = []; const used: number[] = [];
  let x = a, y = b;
  for (;;) {
    let p = 0; for (let k = 2; k <= Math.min(x, y); k++) if (x % k === 0 && y % k === 0 && isPrime(k)) { p = k; break; }
    if (!p) break;
    guide.push({ title: `Durch ${p} teilen`, ask: `<p>${B(String(x))} und ${B(String(y))} sind beide durch ${p} teilbar. Was ist <b>${x} : ${p}</b>?</p>`, answer: q(x / p), hint: `Teile ${x} durch ${p}.`, explain: `${x} : ${p} = ${x / p} und ${y} : ${p} = ${y / p}` });
    used.push(p); x /= p; y /= p;
  }
  guide.push({ title: 'ggT zusammensetzen', ask: `<p>${x} und ${y} haben keinen gemeinsamen Teiler mehr. Der ggT ist das Produkt der Zahlen, durch die du geteilt hast: ${B(used.length > 1 ? used.join(' · ') + ' = ?' : 'ggT = ?')}</p>`, answer: q(g), hint: 'Multipliziere alle Zahlen, durch die du geteilt hast.', explain: `ggT(${a}, ${b}) = ${used.join(' · ')} = ${g}` });
  return { prompt: `Was ist der größte gemeinsame Teiler (ggT) von ${M(String(a))} und ${M(String(b))}?`, answer: q(g), placeholder: 'ggT', guide,
    sol: list([{ rule: 'Teiler suchen', lines: [`Teiler von ${a}: ${mark(da, db)}`, `Teiler von ${b}: ${mark(db, da)}`, `Fett sind die gemeinsamen Teiler. Der größte ist <b>${g}</b>.`] }], q(g), String(g), [`Schneller: Teile beide immer wieder durch dieselbe Zahl, hier ${used.join(', ')}. Das Produkt ${used.join(' · ')} = ${g} ist der ggT.`]),
    diag: v => (v.eq(q(a * b / g)) ? 'Das ist das <b>kgV</b> (kleinstes gemeinsames Vielfaches). Gesucht ist der größte gemeinsame <b>Teiler</b>.' : v.isInt() && (a % Number(v.n) || b % Number(v.n)) ? `${qH(v)} teilt nicht beide Zahlen. Prüfe: geht ${a} : ${qH(v)} und ${b} : ${qH(v)} ohne Rest auf?` : null) };
}
export function kgvTask(a: number, b: number): Task {
  const big = Math.max(a, b), small = Math.min(a, b), l = Number(lcm(BigInt(a), BigInt(b))), m = l / big;
  const mult = range(1, m).map(k => big * k);
  return { prompt: `Was ist das kleinste gemeinsame Vielfache (kgV) von ${M(String(a))} und ${M(String(b))}?`, answer: q(l), placeholder: 'kgV',
    sol: list([{ rule: `Vielfache von ${big}`, lines: [mult.map(v => (v === l ? `<b class="common">${v}</b>` : v)).join(', ')] }, { rule: `Passt ${small} hinein?`, lines: [...mult.slice(0, -1).map(v => `${v} : ${small} geht nicht auf.`), `${l} : ${small} = ${l / small}. Das geht auf, also ist kgV = <b>${l}</b>.`] }], q(l), String(l), ['Tipp: Fang immer mit der größeren Zahl an, dann bist du schneller.']),
    guide: [
      ...mult.slice(1).map((v, i) => ({ title: `${i + 2}. Vielfaches von ${big}`, ask: `${i === 0 ? `${big} ist nicht durch ${small} teilbar. ` : `${mult[i]} ist auch nicht durch ${small} teilbar. `}Was ist ${M(`${i + 2} · ${big}`)}?`, answer: q(v), hint: `Rechne ${i + 2} mal ${big}.`, explain: v === l ? `${v} : ${small} = ${v / small}. Das geht auf!` : `${v} : ${small} geht nicht auf.` })),
      { title: 'Das kgV', ask: `Welches ist also das kleinste gemeinsame Vielfache von ${a} und ${b}?`, answer: q(l), hint: 'Die erste Zahl, die in beide Reihen passt.', explain: `kgV(${a}, ${b}) = ${l}` },
    ],
    diag: v => (v.eq(q(a * b)) && a * b !== l ? `${a * b} ist ein gemeinsames Vielfaches, aber nicht das <b>kleinste</b>. Geh die Vielfache von ${big} der Reihe nach durch.` : v.eq(q(Number(gcd(BigInt(a), BigInt(b))))) ? 'Das ist der ggT. Gesucht ist das gemeinsame <b>Vielfache</b>, also eine Zahl, die durch beide teilbar ist.' : null) };
}

/* Größen umrechnen */
export interface Pair { big: string; small: string; f: number; time?: boolean }
const PAIRS: Pair[] = [
  { big: 'km', small: 'm', f: 1000 }, { big: 'm', small: 'cm', f: 100 }, { big: 'm', small: 'dm', f: 10 }, { big: 'cm', small: 'mm', f: 10 },
  { big: 'kg', small: 'g', f: 1000 }, { big: 't', small: 'kg', f: 1000 }, { big: 'h', small: 'min', f: 60, time: true }, { big: 'min', small: 's', f: 60, time: true }, { big: '€', small: 'ct', f: 100 },
];
const dH = (v: Q) => qH(v, true);
/** v in der Einheit „von“ umrechnen. down = in die kleinere Einheit. */
export function groeTask(v: Q, p: Pair, down: boolean): Task {
  const from = down ? p.big : p.small, to = down ? p.small : p.big, r = down ? v.mul(q(p.f)) : v.div(q(p.f)), op = down ? '·' : ':';
  return { prompt: `Wandle um: ${M(`${dH(v)} ${from} = ? ${to}`)}`, plain: `${dH(v)} ${from} in ${to}`, answer: r, placeholder: `Antwort in ${to}`,
    sol: list([{ rule: 'Umrechnungszahl', lines: [`1 ${p.big} = ${p.f} ${p.small}`] }, { rule: down ? 'In die kleinere Einheit: mal' : 'In die größere Einheit: geteilt', lines: [`${dH(v)} ${op} ${p.f} = ${dH(r)}`, `${dH(v)} ${from} = ${dH(r)} ${to}`] }], r, `${dH(r)} ${to}`),
    guide: [
      { title: 'Umrechnungszahl', ask: `<p>Wie viele ${p.small} sind <b>1 ${p.big}</b>?</p>`, answer: q(p.f), hint: p.time ? 'Bei der Zeit ist es 60, nicht 100.' : 'Schau in die Tabelle bei der Theorie.', explain: `1 ${p.big} = ${p.f} ${p.small}`, placeholder: `Antwort in ${p.small}` },
      { title: down ? 'Mal rechnen' : 'Geteilt rechnen', choose: { ask: 'Welche Rechnung passt?', options: [{ html: M(`${dH(v)} · ${p.f}`), ok: down }, { html: M(`${dH(v)} : ${p.f}`), ok: !down }], why: down ? `${p.small} ist die kleinere Einheit, da passt öfter hinein. Die Zahl wird größer: mal.` : `${p.big} ist die größere Einheit. Die Zahl wird kleiner: geteilt.` },
        ask: `<div class="math big">${dH(v)} ${op} ${p.f} = ?</div>`, answer: r, hint: p.f % 10 === 0 && !p.time ? `Bei ${p.f} verschiebst du das Komma um ${String(p.f).length - 1} Stellen.` : `Rechne ${dH(v)} ${op} ${p.f}.`, explain: `${dH(v)} ${from} = ${dH(r)} ${to}`, placeholder: `Antwort in ${to}` },
    ],
    diag: x => (x.eq(down ? v.div(q(p.f)) : v.mul(q(p.f))) ? (down ? 'Andersherum! In eine <b>kleinere</b> Einheit wird die Zahl größer, also mal.' : 'Andersherum! In eine <b>größere</b> Einheit wird die Zahl kleiner, also geteilt.') : p.time && x.eq(down ? v.mul(q(100)) : v.div(q(100))) ? 'Achtung: Bei der Zeit rechnest du mit <b>60</b>, nicht mit 100.' : null) };
}
export function groeMixTask(p: Pair, a: number, b: number): Task {
  const r = a * p.f + b;
  return { prompt: `Wandle in ${p.small} um: ${M(`${a} ${p.big} ${b} ${p.small} = ? ${p.small}`)}`, plain: `${a} ${p.big} ${b} ${p.small} in ${p.small}`, answer: q(r), placeholder: `Antwort in ${p.small}`,
    sol: list([{ rule: 'Den großen Teil umrechnen', lines: [`${a} ${p.big} = ${a} · ${p.f} ${p.small} = ${a * p.f} ${p.small}`] }, { rule: 'Den Rest dazu', lines: [`${a * p.f} + ${b} = ${r}`, `${a} ${p.big} ${b} ${p.small} = ${r} ${p.small}`] }], q(r), `${r} ${p.small}`),
    guide: [
      { title: `${p.big} umrechnen`, ask: `<p>Wie viele ${p.small} sind <b>${a} ${p.big}</b>?</p>`, answer: q(a * p.f), hint: `1 ${p.big} = ${p.f} ${p.small}, also ${a} · ${p.f}.`, explain: `${a} · ${p.f} = ${a * p.f}`, placeholder: `Antwort in ${p.small}` },
      { title: 'Den Rest dazu', ask: `Jetzt noch die ${b} ${p.small} dazu:<div class="math big">${a * p.f} + ${b} = ?</div>`, answer: q(r), hint: 'Einfach addieren.', explain: `${a * p.f} + ${b} = ${r} ${p.small}`, placeholder: `Antwort in ${p.small}` },
    ],
    diag: x => (p.time && x.eq(q(a * 100 + b)) ? 'Achtung: 1 h hat <b>60</b> min, nicht 100.' : null) };
}

/* Umfang und Flächeninhalt */
type Shape = 'rect' | 'square' | 'tri' | 'para' | 'trap';
const SH: Record<Shape, string> = { rect: 'Rechteck', square: 'Quadrat', tri: 'Dreieck', para: 'Parallelogramm', trap: 'Trapez' };
const svgFig = (body: string, label: string) => `<svg class="fig" viewBox="0 0 240 150" role="img" aria-label="${label}">${body}</svg>`;
const tx = (x: number, y: number, s: string, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;
function figure(s: Shape, l: Record<string, string>): string {
  if (s === 'rect' || s === 'square') return svgFig(`<rect class="sh" x="40" y="20" width="${s === 'square' ? 100 : 160}" height="100" />${tx(s === 'square' ? 90 : 120, 140, l.a)}${tx(s === 'square' ? 146 : 206, 75, l.b ?? l.a, 'start')}`, `${SH[s]} mit ${Object.values(l).join(', ')}`);
  if (s === 'trap') return svgFig(`<polygon class="sh" points="20,120 220,120 165,25 70,25" /><line class="hl" x1="70" y1="25" x2="70" y2="120" />${tx(120, 140, l.a)}${tx(118, 17, l.c)}${tx(76, 80, l.h, 'start')}${l.b ? tx(198, 70, l.b, 'start') : ''}${l.d ? tx(40, 70, l.d, 'end') : ''}`, `Trapez mit ${Object.values(l).join(', ')}`);
  if (s === 'para') return svgFig(`<polygon class="sh" points="30,120 170,120 210,25 70,25" /><line class="hl" x1="70" y1="25" x2="70" y2="120" />${tx(100, 140, l.g)}${tx(76, 80, l.h, 'start')}${l.b ? tx(198, 80, l.b, 'start') : ''}`, `Parallelogramm mit ${Object.values(l).join(', ')}`);
  return svgFig(`<polygon class="sh" points="20,120 200,120 120,20" />${l.h ? `<line class="hl" x1="120" y1="20" x2="120" y2="120" />${tx(126, 85, l.h, 'start')}` : ''}${tx(110, 140, l.g)}${l.b ? tx(168, 62, l.b, 'start') : ''}${l.c ? tx(60, 62, l.c, 'end') : ''}`, `Dreieck mit ${Object.values(l).join(', ')}`);
}
function withChoose(t: Task & { sol: ExprSolution }, c: GuideChoice): Task {
  const g = autoGuide(t.sol);
  g[0] = { ...g[0], choose: c };
  const last = g.length - 1; g[last] = { ...g[last], placeholder: t.placeholder };
  return { ...t, guide: g };
}
const opts = (right: string, wrong: string[]) => [{ html: M(right), ok: true }, ...wrong.filter(w => w !== right).map(w => ({ html: M(w), ok: false }))];
export function flaeTask(s: Shape, what: 'A' | 'U', a: number, b: number, unit = 'cm'): Task {
  const u = what === 'A' ? `${unit}²` : unit, U = `${a} ${unit}`, V = `${b} ${unit}`;
  let expr: string, other: string, lab: Record<string, string>, formula: string, wrong: string[];
  if (s === 'square') { lab = { a: `a = ${U}` }; expr = what === 'A' ? `${a} · ${a}` : `4 · ${a}`; other = what === 'A' ? `4 · ${a}` : `${a} · ${a}`; formula = what === 'A' ? 'a · a' : '4 · a'; wrong = [what === 'A' ? '4 · a' : 'a · a', 'a + a']; }
  else if (s === 'rect') { lab = { a: `a = ${U}`, b: `b = ${V}` }; expr = what === 'A' ? `${a} · ${b}` : `2 · ${a} + 2 · ${b}`; other = what === 'A' ? `2 · ${a} + 2 · ${b}` : `${a} · ${b}`; formula = what === 'A' ? 'a · b' : '2 · a + 2 · b'; wrong = [what === 'A' ? '2 · a + 2 · b' : 'a · b', 'a + b']; }
  else if (s === 'para') { const h = Math.max(1, b - R(1, Math.max(1, b - 1))); lab = what === 'A' ? { g: `g = ${U}`, h: `h = ${h} ${unit}` } : { g: `a = ${U}`, h: `h = ${h} ${unit}`, b: `b = ${V}` }; expr = what === 'A' ? `${a} · ${h}` : `2 · ${a} + 2 · ${b}`; other = what === 'A' ? `${a} · ${b}` : `${a} · ${h}`; formula = what === 'A' ? 'g · h' : '2 · a + 2 · b'; wrong = what === 'A' ? ['g · h : 2', '2 · g + 2 · h'] : ['a · h', 'a + b + h']; }
  else if (s === 'trap') {
    // a unten, c oben (kürzer), parallel. h steht senkrecht dazwischen.
    const c = R(Math.max(2, Math.ceil(a / 3)), a - 1), h = Math.max(2, b), sb = h + R(0, 3), sd = h + R(1, 4), W = `${c} ${unit}`;
    lab = what === 'A' ? { a: `a = ${U}`, c: `c = ${W}`, h: `h = ${h} ${unit}` } : { a: `a = ${U}`, c: `c = ${W}`, b: `b = ${sb} ${unit}`, d: `d = ${sd} ${unit}` };
    expr = what === 'A' ? `(${a} + ${c}) · ${h} : 2` : `${a} + ${sb} + ${c} + ${sd}`; other = what === 'A' ? `(${a} + ${c}) · ${h}` : `(${a} + ${c}) · ${h} : 2`;
    formula = what === 'A' ? '(a + c) · h : 2' : 'a + b + c + d'; wrong = what === 'A' ? ['a · c · h', '(a + c) · h'] : ['(a + c) · h : 2', 'a · b · c · d'];
  }
  else { const c = R(Math.abs(a - b) + 1, a + b - 1); lab = what === 'A' ? { g: `g = ${U}`, h: `h = ${V}` } : { g: `a = ${U}`, b: `b = ${V}`, c: `c = ${c} ${unit}` }; expr = what === 'A' ? `${a} · ${b} : 2` : `${a} + ${b} + ${c}`; other = what === 'A' ? `${a} · ${b}` : `${a} · ${b}`; formula = what === 'A' ? 'g · h : 2' : 'a + b + c'; wrong = what === 'A' ? ['g · h', 'g + h'] : ['a · b · c', '2 · a + 2 · b']; }
  const ask = what === 'A' ? 'den Flächeninhalt' : 'den Umfang';
  const t = exprTask(expr, { prompt: `Berechne ${ask} vom ${SH[s]}.${figure(s, lab)}`, placeholder: `Antwort in ${u}` });
  const ov = evalExpr(other).result;
  t.plain = `${SH[s]}: ${Object.values(lab).join(', ')}. Gesucht: ${what === 'A' ? 'Flächeninhalt' : 'Umfang'}`;
  t.diag = v => (v.eq(ov) && !ov.eq(t.answer) ? (what === 'A' ? 'Das passt zu einer anderen Formel. Gesucht ist die <b>Fläche</b> (innen drin).' : 'Das ist die Fläche. Gesucht ist der <b>Umfang</b>, also einmal außen herum.') : (s === 'tri' || s === 'trap') && what === 'A' && v.eq(t.answer.mul(q(2))) ? `Fast! Beim ${SH[s]} musst du noch <b>durch 2</b> teilen.` : null);
  return withChoose(t, { ask: `Welche Formel passt für ${ask}?`, options: opts(formula, wrong), why: what === 'A' ? `Fläche vom ${SH[s]}: ${formula}` : `Umfang: alle Seiten außen herum, ${formula}` });
}
function lshapeTask(): Task {
  const W = R(6, 14), H = R(5, 12), cw = R(2, W - 3), ch = R(2, H - 2);
  const t = exprTask(`${W} · ${H} − ${cw} · ${ch}`, { placeholder: 'Antwort in cm²' });
  const fx = 30 + (180 * (W - cw)) / W, fy = 15 + (110 * ch) / H;
  t.prompt = `Aus einem Rechteck wurde eine Ecke herausgeschnitten. Berechne den Flächeninhalt der Figur.${svgFig(`<polygon class="sh" points="30,15 ${fx},15 ${fx},${fy} 210,${fy} 210,125 30,125" />${tx(120, 143, `${W} cm`)}${tx(24, 72, `${H} cm`, 'end')}${tx((fx + 210) / 2, fy - 6, `${cw} cm`)}${tx(fx + 6, fy / 2 + 10, `${ch} cm`, 'start')}`, `Rechteck ${W} cm mal ${H} cm, Ecke ${cw} cm mal ${ch} cm fehlt`)}`;
  t.plain = `Rechteck ${W} cm × ${H} cm, oben rechts fehlt ein Rechteck ${cw} cm × ${ch} cm. Flächeninhalt?`;
  t.diag = v => (v.eq(q(W * H)) ? 'Das ist das ganze Rechteck. Die herausgeschnittene Ecke musst du noch <b>abziehen</b>.' : null);
  return withChoose(t, { ask: 'Wie rechnest du die Fläche aus?', options: opts('großes Rechteck − Ecke', ['großes Rechteck + Ecke', 'alle Seiten addieren']), why: 'Du rechnest das große Rechteck aus und ziehst das fehlende Stück ab.' });
}
function sideTask(): Task {
  const k = R(0, 2);
  if (k === 0) { const a = R(3, 12), b = R(3, 12), A = a * b; const t = exprTask(`${A} : ${a}`, { placeholder: 'Antwort in cm' });
    t.prompt = `Ein Rechteck hat den Flächeninhalt ${M(`A = ${A} cm²`)}. Eine Seite ist ${M(`a = ${a} cm`)} lang. Wie lang ist die andere Seite b?${figure('rect', { a: `a = ${a} cm`, b: 'b = ?' })}`;
    t.plain = `Rechteck A = ${A} cm², a = ${a} cm, b gesucht`;
    return withChoose(t, { ask: 'Welche Rechnung passt?', options: opts(`${A} : ${a}`, [`${A} · ${a}`, `${A} − ${a}`]), why: `A = a · b. Also ist b = A : a.` }); }
  if (k === 1) { const a = R(3, 25), U = 4 * a; const t = exprTask(`${U} : 4`, { placeholder: 'Antwort in cm' });
    t.prompt = `Ein Quadrat hat den Umfang ${M(`u = ${U} cm`)}. Wie lang ist eine Seite?${figure('square', { a: 'a = ?' })}`;
    t.plain = `Quadrat u = ${U} cm, Seite gesucht`;
    return withChoose(t, { ask: 'Welche Rechnung passt?', options: opts(`${U} : 4`, [`${U} : 2`, `${U} · 4`]), why: 'Ein Quadrat hat 4 gleich lange Seiten: u = 4 · a.' }); }
  const a = R(4, 15), b = R(2, 12), U = 2 * a + 2 * b; const t = exprTask(`(${U} − 2 · ${a}) : 2`, { placeholder: 'Antwort in cm' });
  t.prompt = `Ein Rechteck hat den Umfang ${M(`u = ${U} cm`)}. Die Seite a ist ${M(`${a} cm`)} lang. Wie lang ist die Seite b?${figure('rect', { a: `a = ${a} cm`, b: 'b = ?' })}`;
  t.plain = `Rechteck u = ${U} cm, a = ${a} cm, b gesucht`;
  return withChoose(t, { ask: 'Welche Rechnung passt?', options: opts(`(${U} − 2 · ${a}) : 2`, [`${U} − ${a}`, `${U} : ${a}`]), why: 'u = 2 · a + 2 · b. Zieh die beiden a-Seiten ab, dann bleiben zwei b-Seiten. Die teilst du durch 2.' });
}

/* ---------- Kürzen und Erweitern: Bausteine ---------- */
const shufK = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fq = (n: number, d: number) => qH(q(n, d));
/** Gleichheitszeichen mit Rechenzahl: Kürzungszahl steht darunter, Erweiterungszahl darüber (wie im Heft). */
export function eqK(k: number, op: ':' | '·'): string {
  const z = `<small style="font-size:.7em">${op === ':' ? ':' : '·'}${k}</small>`, e = `<small aria-hidden="true" style="font-size:.7em;visibility:hidden">${op}${k}</small>`;
  return `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .25em">${op === '·' ? z : e}<span>=</span>${op === ':' ? z : e}</span>`;
}
const PART: Record<number, string> = { 2: 'Halbe', 3: 'Drittel', 4: 'Viertel', 5: 'Fünftel', 6: 'Sechstel', 8: 'Achtel', 9: 'Neuntel', 10: 'Zehntel', 12: 'Zwölftel', 15: 'Fünfzehntel', 18: 'Achtzehntel' };
const primeFactors = (n: number): number[] => { const f: number[] = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f; };
/** Auswahl-Aufgabe (Antwort = Nummer der Option). Der Guide bekommt die gemischte Reihenfolge. */
function kPick(prompt: string, right: string, wrong: string[], steps: ListSolution['steps'], guide: (o: string[]) => GuideStep[], label?: string): Task {
  const all = shufK([right, ...[...new Set(wrong)].filter(w => w !== right).slice(0, 3)]), ok = all.indexOf(right);
  return { prompt, answer: q(ok + 1), sol: list(steps, q(ok + 1), `${LETTERS[ok]}: ${label ?? right}`), guide: guide(all), widget: { kind: 'pick', options: all }, placeholder: 'Auswahl' };
}

/** Grundaufgabe: vollständig kürzen mit dem ggT. */
function kBasic(level: number): Task {
  const [n0, d0] = coprimeFrac([6, 9, 12][level - 1]);
  const k = pick([[2, 3], [2, 3, 4, 5], [4, 6, 7, 8, 9, 12]][level - 1]);
  const n = n0 * k, d = d0 * k;
  const g = Number(gcd(BigInt(n), BigInt(d)));
  const guide: GuideStep[] = [
    { title: 'ggT finden', ask: `Was ist die größte Zahl, durch die ${n} und ${d} beide teilbar sind?`, answer: q(g), hint: `Schreibe die Teiler von ${n} und von ${d} auf und suche die größte Zahl, die in beiden Listen vorkommt.`, explain: `Der ggT von ${n} und ${d} ist ${g}.` },
    { title: 'Kürzen', ask: `Teile Zähler und Nenner von ${M(qH(q(n, d)))} durch ${g}. Welcher Bruch kommt heraus?`, answer: q(n0, d0), needReduced: true, hint: `${n} : ${g} und ${d} : ${g}`, explain: `${M(`${qH(q(n, d))} ${eqK(g, ':')} ${qH(q(n0, d0))}`)}`, placeholder: 'z. B. 3/4' },
  ];
  return { guide, prompt: `Kürze den Bruch vollständig: ${M(qH(q(n, d)))}`, plain: `${n}/${d} vollständig kürzen`, answer: q(n0, d0), sol: kuerzenSol(n, d), needReduced: true, placeholder: 'z. B. 3/4',
    diag: v => (v.eq(q(n, d)) ? 'Das ist noch der Ausgangsbruch. Teile Zähler und Nenner durch dieselbe Zahl.' : 'Prüfe: Hast du Zähler und Nenner durch <b>dieselbe</b> Zahl geteilt?') };
}
/** Erweitere a/b auf den Nenner c: der neue Zähler ist gesucht. */
function kErwAuf(level: number): Task {
  const [a, b] = coprimeFrac(level === 1 ? 6 : 10), k = R(2, level === 1 ? 5 : 9), c = b * k;
  return { prompt: `Erweitere ${M(fq(a, b))} auf den Nenner ${c}: ${M(`${fq(a, b)} = ${fracH('?', c)}`)}. Welche Zahl gehört in den Zähler?`, plain: `${a}/${b} auf Nenner ${c} erweitern`, answer: q(a * k), placeholder: 'Zähler',
    sol: list([{ rule: 'Erweiterungszahl', lines: [`Der Nenner wird von ${b} zu ${c}. Also wird mit ${c} : ${b} = ${k} erweitert.`] },
      { rule: 'Zähler', lines: [`Der Zähler wird mit derselben Zahl malgenommen: ${a} · ${k} = ${a * k}.`, M(`${fq(a, b)} ${eqK(k, '·')} ${fq(a * k, c)}`), 'Im Heft schreibst du die Erweiterungszahl über das Gleichheitszeichen.'] }], q(a * k), String(a * k)),
    guide: [
      { title: 'Erweiterungszahl', ask: `<p>Mit welcher Zahl musst du den Nenner ${b} malnehmen, damit ${c} herauskommt?</p><div class="math big">${b} · ? = ${c}</div>`, answer: q(k), hint: `Rechne ${c} : ${b}.`, explain: `${b} · ${k} = ${c}. Du erweiterst mit ${k}.`, placeholder: 'Zahl' },
      { title: 'Zähler', ask: `<p>Nimm den Zähler ${a} mit derselben Zahl mal.</p><div class="math big">${a} · ${k} = ?</div>`, answer: q(a * k), hint: 'Beim Erweitern nimmst du Zähler und Nenner mit derselben Zahl mal.', explain: M(`${fq(a, b)} ${eqK(k, '·')} ${fq(a * k, c)}`), placeholder: 'Zähler' },
    ],
    diag: v => (v.eq(q(a + c - b)) ? 'Beim Erweitern wird nicht addiert, sondern <b>malgenommen</b>. Zähler und Nenner mit derselben Zahl mal.' : v.eq(q(k)) && k !== a * k ? 'Das ist die Erweiterungszahl. Nimm jetzt noch den Zähler damit mal.' : null) };
}
/** Kürze a/b auf den Nenner c: der neue Zähler ist gesucht. */
function kAufNenner(level: number): Task {
  const [n0, d0] = coprimeFrac(level === 2 ? 6 : 9), a = pick(level === 2 ? [1, 2] : [2, 3]), b = R(2, level === 2 ? 4 : 6);
  const t = d0 * a, z = n0 * a, N = z * b, D = t * b;
  return { prompt: `Kürze ${M(fq(N, D))} auf den Nenner ${t}: ${M(`${fq(N, D)} = ${fracH('?', t)}`)}. Welche Zahl gehört in den Zähler?`, plain: `${N}/${D} auf Nenner ${t} kürzen`, answer: q(z), placeholder: 'Zähler',
    sol: list([{ rule: 'Kürzungszahl', lines: [`Der Nenner wird von ${D} zu ${t}. Also wird durch ${D} : ${t} = ${b} gekürzt.`] },
      { rule: 'Zähler', lines: [`Den Zähler teilst du durch dieselbe Zahl: ${N} : ${b} = ${z}.`, M(`${fq(N, D)} ${eqK(b, ':')} ${fq(z, t)}`), 'Im Heft schreibst du die Kürzungszahl unter das Gleichheitszeichen.'] }], q(z), String(z)),
    guide: [
      { title: 'Kürzungszahl', ask: `<p>Durch welche Zahl musst du den Nenner ${D} teilen, damit ${t} herauskommt?</p><div class="math big">${D} : ? = ${t}</div>`, answer: q(b), hint: `Rechne ${D} : ${t}.`, explain: `${D} : ${b} = ${t}. Du kürzt durch ${b}.`, placeholder: 'Zahl' },
      { title: 'Zähler', ask: `<p>Teile den Zähler ${N} durch dieselbe Zahl.</p><div class="math big">${N} : ${b} = ?</div>`, answer: q(z), hint: 'Beim Kürzen teilst du Zähler und Nenner durch dieselbe Zahl.', explain: M(`${fq(N, D)} ${eqK(b, ':')} ${fq(z, t)}`), placeholder: 'Zähler' },
    ],
    diag: v => (v.eq(q(N - (D - t))) ? 'Beim Kürzen wird nicht subtrahiert, sondern <b>geteilt</b>. Zähler und Nenner durch dieselbe Zahl.' : v.eq(q(b)) && b !== z ? 'Das ist die Kürzungszahl. Teile jetzt noch den Zähler dadurch.' : null) };
}
/** Mit welcher Zahl wurde erweitert oder gekürzt? */
function kWelcheZahl(level: number): Task {
  const [n, d] = coprimeFrac(level === 1 ? 5 : 8), k = R(2, level === 1 ? 5 : 9), N = n * k, D = d * k, kurz = Math.random() < 0.5;
  const eq = kurz ? `${fq(N, D)} = ${fq(n, d)}` : `${fq(n, d)} = ${fq(N, D)}`, verb = kurz ? 'gekürzt' : 'erweitert';
  const shown = kurz ? `${fq(N, D)} ${eqK(k, ':')} ${fq(n, d)}` : `${fq(n, d)} ${eqK(k, '·')} ${fq(N, D)}`;
  return { prompt: `${M(eq)}<br>Mit welcher Zahl wurde ${verb}?`, plain: `${kurz ? `${N}/${D} = ${n}/${d}` : `${n}/${d} = ${N}/${D}`}, mit welcher Zahl ${verb}?`, answer: q(k), placeholder: 'Zahl',
    sol: list([{ rule: 'Nenner vergleichen', lines: [kurz ? `${D} : ${d} = ${k}` : `${d} · ${k} = ${D}`] }, { rule: 'Mit dem Zähler prüfen', lines: [kurz ? `${N} : ${k} = ${n}` : `${n} · ${k} = ${N}`, `Es wurde mit ${k} ${verb}: ${M(shown)}`] }], q(k), String(k)),
    guide: [
      { title: 'Nenner vergleichen', ask: `<p>Wie oft passt der kleine Nenner ${d} in den großen Nenner ${D}?</p><div class="math big">${D} : ${d} = ?</div>`, answer: q(k), hint: `Geh die Reihe von ${d} durch: ${d}, ${2 * d}, ${3 * d}, …`, explain: `${D} : ${d} = ${k}`, placeholder: 'Zahl' },
      { title: 'Mit dem Zähler prüfen', ask: `<p>Prüfe mit den Zählern: Es muss dieselbe Zahl herauskommen.</p><div class="math big">${N} : ${n} = ?</div>`, answer: q(k), hint: `Teile ${N} durch ${n}.`, explain: `Beide Male ${k}. Es wurde mit ${k} ${verb}: ${M(shown)}`, placeholder: 'Zahl' },
    ],
    diag: v => (!v.eq(q(k)) && v.eq(q(D - d)) ? `${kurz ? 'Beim Kürzen' : 'Beim Erweitern'} wird ${kurz ? 'geteilt' : 'malgenommen'}, nicht ${kurz ? 'subtrahiert' : 'addiert'}. Rechne ${D} : ${d}.` : null) };
}
/** Schrittweise kürzen: Ein Kind hat schon einmal gekürzt, jetzt weiter bis zum Ende. */
function kSchritt(level: number): Task {
  const NAMES = ['Lea', 'Tim', 'Mia', 'Ben', 'Emma', 'Paul'];
  for (;;) {
    const [n0, d0] = coprimeFrac(level === 2 ? 5 : 7), g = pick(level === 2 ? [8, 12, 18, 20] : [16, 24, 27, 36, 30, 48]);
    const N = n0 * g, D = d0 * g;
    if (D > (level === 2 ? 100 : 200)) continue;
    const f = primeFactors(g), p1 = f[0], rest = f.slice(1), who = pick(NAMES);
    let a = N / p1, b = D / p1;
    const guide: GuideStep[] = [], lines: string[] = [M(`${fq(N, D)} ${eqK(p1, ':')} ${fq(a, b)}`)];
    let chain = `${fq(N, D)} ${eqK(p1, ':')} ${fq(a, b)}`;
    for (const p of rest) {
      guide.push({ title: `Durch ${p} kürzen`, ask: `<p>${M(fq(a, b))}: ${a} und ${b} sind beide durch ${p} teilbar. Teile Zähler und Nenner durch ${p}. Wie heißt der neue Zähler?</p><div class="math big">${a} : ${p} = ?</div>`, answer: q(a / p), hint: `Rechne ${a} : ${p}. Den Nenner teilst du genauso: ${b} : ${p}.`, explain: M(`${fq(a, b)} ${eqK(p, ':')} ${fq(a / p, b / p)}`), placeholder: 'Zähler' });
      lines.push(M(`${fq(a, b)} ${eqK(p, ':')} ${fq(a / p, b / p)}`));
      a /= p; b /= p; chain += ` ${eqK(p, ':')} ${fq(a, b)}`;
    }
    guide.push({ title: 'Fertig gekürzt', ask: `<p>Jetzt haben Zähler und Nenner außer 1 keinen gemeinsamen Teiler mehr. Wie heißt der vollständig gekürzte Bruch?</p>`, answer: q(n0, d0), needReduced: true, hint: 'Schreibe den letzten Bruch auf.', explain: `${M(chain)}<br>Mit dem ggT ${g} geht es in einem Schritt: ${M(`${fq(N, D)} ${eqK(g, ':')} ${fq(n0, d0)}`)}. Denn ${f.join(' · ')} = ${g}.`, placeholder: 'z. B. 3/4' });
    return { prompt: `${who} kürzt ${M(fq(N, D))} zuerst durch ${p1}: ${M(`${fq(N, D)} ${eqK(p1, ':')} ${fq(N / p1, D / p1)}`)}<br>Kürze weiter, bis der Bruch vollständig gekürzt ist.`, plain: `${N}/${D} schrittweise vollständig kürzen`, answer: q(n0, d0), needReduced: true, placeholder: 'z. B. 3/4', guide,
      sol: list([{ rule: 'Schritt für Schritt', lines: [...lines, 'Die kleinen Zahlen unter dem Gleichheitszeichen sind die Kürzungszahlen.'] }, { rule: 'Schneller mit dem ggT', lines: [`ggT(${N}, ${D}) = ${g} = ${f.join(' · ')}`, M(`${fq(N, D)} ${eqK(g, ':')} ${fq(n0, d0)}`)] }], q(n0, d0)) };
  }
}
/** Erst kürzen, dann auf einen anderen Nenner erweitern: 6/8 = ?/20 */
function kKuerzErw(): Task {
  for (;;) {
    const [n0, d0] = coprimeFrac(6), j = R(2, 4), k = R(2, 6);
    if (j === k) continue;
    const N = n0 * j, D = d0 * j, t = d0 * k, z = n0 * k;
    if (t % D === 0 || D % t === 0) continue;
    return { prompt: `Ergänze: ${M(`${fq(N, D)} = ${fracH('?', t)}`)}. Welche Zahl gehört in den Zähler?`, plain: `${N}/${D} = ?/${t}`, answer: q(z), placeholder: 'Zähler',
      sol: list([{ rule: 'Erst kürzen', lines: [`${t} ist kein Vielfaches von ${D}. Kürze deshalb zuerst vollständig:`, M(`${fq(N, D)} ${eqK(j, ':')} ${fq(n0, d0)}`)] },
        { rule: 'Dann erweitern', lines: [`${t} : ${d0} = ${k}`, M(`${fq(n0, d0)} ${eqK(k, '·')} ${fq(z, t)}`)] }], q(z), String(z)),
      guide: [
        { title: 'Erst kürzen', ask: `<p>${t} ist kein Vielfaches von ${D}. Kürze deshalb zuerst ${M(fq(N, D))} vollständig.</p>`, answer: q(n0, d0), needReduced: true, hint: `Zähler und Nenner sind beide durch ${j} teilbar.`, explain: M(`${fq(N, D)} ${eqK(j, ':')} ${fq(n0, d0)}`), placeholder: 'z. B. 3/4' },
        { title: 'Erweiterungszahl', ask: `<p>Mit welcher Zahl musst du ${M(fq(n0, d0))} erweitern, damit der Nenner ${t} wird?</p><div class="math big">${d0} · ? = ${t}</div>`, answer: q(k), hint: `${t} : ${d0}`, explain: `${d0} · ${k} = ${t}`, placeholder: 'Zahl' },
        { title: 'Zähler', ask: `<div class="math big">${n0} · ${k} = ?</div>`, answer: q(z), hint: 'Zähler mit derselben Zahl mal.', explain: M(`${fq(N, D)} ${eqK(j, ':')} ${fq(n0, d0)} ${eqK(k, '·')} ${fq(z, t)}`), placeholder: 'Zähler' },
      ],
      diag: v => (v.eq(q(N + t - D)) || v.eq(q(N - (D - t))) ? 'Beim Kürzen und Erweitern wird geteilt oder malgenommen, nie addiert oder subtrahiert.' : null) };
  }
}
/** Bruchstreifen: Wie viele Viertel sind gefärbt? */
function kStreifen(): Task {
  const d2 = pick([2, 3, 4, 5, 6]), k = pick(d2 <= 3 ? [2, 3, 4] : [2, 3]), n2 = R(1, d2 - 1), d = d2 * k, n = n2 * k;
  const kurz = Math.random() < 0.6;
  // kurz: oben n/d (viele kleine Teile), unten d2 große Teile. Sonst umgekehrt.
  const [sn, sd, td, ans] = kurz ? [n, d, d2, n2] : [n2, d2, d, n];
  const name = PART[td];
  const rel = kurz ? `${d} : ${d2} = ${k}. Immer ${k} kleine Teile oben sind ein großes Teil unten.` : `${d} : ${d2} = ${k}. Jedes große Teil oben ist unten in ${k} kleine Teile zerlegt.`;
  const eqLine = kurz ? M(`${fq(n, d)} ${eqK(k, ':')} ${fq(n2, d2)}`) : M(`${fq(n2, d2)} ${eqK(k, '·')} ${fq(n, d)}`);
  return { prompt: `Der obere Streifen zeigt ${M(fq(sn, sd))}. Der untere Streifen hat ${td} gleiche Teile. Wie viele ${name} musst du unten färben, damit gleich viel gefärbt ist?${barH(sn, sd, fq(sn, sd))}${barH(0, td, fracH('?', td))}`,
    plain: `${sn}/${sd} = ?/${td} am Bruchstreifen`, answer: q(ans), placeholder: 'Anzahl',
    sol: list([{ rule: 'Teile vergleichen', lines: [rel] }, { rule: kurz ? 'Kürzen' : 'Erweitern', lines: [eqLine, `Unten musst du ${ans} ${name} färben.${barH(sn, sd, fq(sn, sd))}${barH(ans, td, fq(ans, td))}`] }], q(ans), String(ans)),
    guide: [
      { title: 'Teile vergleichen', ask: kurz ? `<p>Wie viele kleine Teile von oben passen in ein großes Teil unten?</p><div class="math big">${d} : ${d2} = ?</div>` : `<p>In wie viele kleine Teile ist ein großes Teil von oben unten zerlegt?</p><div class="math big">${d} : ${d2} = ?</div>`, answer: q(k), hint: 'Leg die Streifen gedanklich übereinander.', explain: rel, placeholder: 'Anzahl' },
      { title: kurz ? 'Kürzen' : 'Erweitern', ask: kurz ? `<p>Oben sind ${n} kleine Teile gefärbt. Je ${k} davon sind ein großes Teil.</p><div class="math big">${n} : ${k} = ?</div>` : `<p>Oben ${n2 === 1 ? 'ist 1 großes Teil' : `sind ${n2} große Teile`} gefärbt. Jedes große Teil sind ${k} kleine Teile.</p><div class="math big">${n2} · ${k} = ?</div>`, answer: q(ans), hint: kurz ? `Teile ${n} durch ${k}.` : `Rechne ${n2} · ${k}.`, explain: eqLine, placeholder: 'Anzahl' },
    ],
    diag: v => (v.eq(q(sn)) && sn !== ans ? 'Das ist die Anzahl oben. Unten sind die Teile anders groß.' : null) };
}
/** Welcher Streifen zeigt denselben Anteil? */
function kStreifenPick(): Task {
  for (;;) {
    const [n, d] = coprimeFrac(5), k = R(2, 3), N = n * k, D = d * k;
    const cand: [number, number][] = [[n, D], [n + k, d + k], [N + 1, D], [N - 1, D], [N, D + k], [n + 1, d + 1]];
    const wrong: string[] = [], seen = new Set<string>([`${N}/${D}`]);
    for (const [a, b] of shufK(cand)) {
      if (a < 1 || a >= b || b > 16 || q(a, b).eq(q(n, d)) || seen.has(`${a}/${b}`) || wrong.length >= 3) continue;
      seen.add(`${a}/${b}`); wrong.push(barH(a, b, ''));
    }
    if (wrong.length < 3) continue;
    const right = barH(N, D, '');
    return kPick(`Welcher Streifen zeigt denselben Anteil wie ${M(fq(n, d))}?${barH(n, d, fq(n, d))}`, right, wrong,
      [{ rule: 'Erweitern', lines: [M(`${fq(n, d)} ${eqK(k, '·')} ${fq(N, D)}`), `Der richtige Streifen hat ${D} Teile, davon sind ${N} gefärbt. Gleich viel gefärbt, nur kleinere Stücke.`] }],
      () => [
        { title: 'Teile zählen', ask: `<p>Der richtige Streifen hat ${D} Teile. Mit welcher Zahl wurde ${M(fq(n, d))} dann erweitert?</p><div class="math big">${D} : ${d} = ?</div>`, answer: q(k), hint: `Rechne ${D} : ${d}.`, explain: `Es wurde mit ${k} erweitert.`, placeholder: 'Zahl' },
        { title: 'Gefärbte Teile', ask: `<p>Wie viele der ${D} Teile müssen gefärbt sein?</p><div class="math big">${n} · ${k} = ?</div>`, answer: q(N), hint: 'Zähler mit derselben Zahl mal.', explain: `${M(`${fq(n, d)} ${eqK(k, '·')} ${fq(N, D)}`)} Such den Streifen mit ${N} von ${D} gefärbten Teilen.`, placeholder: 'Anzahl' },
      ], `der Streifen mit ${N} von ${D} gefärbten Teilen`);
  }
}
/** Welcher Bruch ist gleichwertig (oder NICHT gleichwertig)? */
function kGleich(level: number): Task {
  for (;;) {
    const [n, d] = coprimeFrac(level === 2 ? 6 : 9), j = level === 3 ? R(2, 4) : 1, k = R(2, 6);
    if (k === j) continue;
    const gN = n * j, gD = d * j, given = fq(gN, gD);
    const wrongF: [number, number][] = shufK([[gN + k, gD + k], [gN * k, gD], [gN, gD * k], [n * k, d * k + 1], [gN * k, gD + k], [gN + 1, gD + 1]] as [number, number][])
      .filter(([a, b]) => b > 0 && !q(a, b).eq(q(n, d)));
    const keys = (f: [number, number][]) => [...new Set(f.map(([a, b]) => `${a}/${b}`))];
    const show = (s: string) => { const [a, b] = s.split('/').map(Number); return M(fq(a, b)); };
    const red = (s: string) => { const [a, b] = s.split('/').map(Number); const r = q(a, b).red(); return `${M(fq(a, b))} = ${M(qH(r))}`; };
    const not = level === 3 && Math.random() < 0.5;
    if (!not) {
      const right = `${n * k}/${d * k}`, w = keys(wrongF).filter(s => s !== right && s !== `${gN}/${gD}`).slice(0, 3);
      if (w.length < 3) continue;
      return kPick(`Welcher Bruch ist gleichwertig zu ${M(given)}?`, show(right), w.map(show),
        [{ rule: 'Kürzen', lines: [`Kürze alle Brüche vollständig. Gleichwertig ist der Bruch, bei dem ${M(fq(n, d))} herauskommt.`, ...[right, ...w].map(red)] }],
        () => [
          ...(j > 1 ? [{ title: 'Vollständig kürzen', ask: `<p>Kürze zuerst ${M(given)} vollständig. Welcher Bruch kommt heraus?</p>`, answer: q(n, d), needReduced: true, hint: `Zähler und Nenner sind beide durch ${j} teilbar.`, explain: M(`${given} ${eqK(j, ':')} ${fq(n, d)}`), placeholder: 'z. B. 2/3' }] : []),
          { title: 'Erweitern', ask: `<p>Gleichwertig heißt: Zähler <b>und</b> Nenner mit derselben Zahl malnehmen. Erweitere ${M(fq(n, d))} mit ${k}. Wie heißt dann der Nenner?</p><div class="math big">${d} · ${k} = ?</div>`, answer: q(d * k), hint: `Rechne ${d} · ${k}.`, explain: `${M(`${fq(n, d)} ${eqK(k, '·')} ${fq(n * k, d * k)}`)}. Bei den anderen wurde addiert oder nur eine Zahl verändert.`, placeholder: 'Nenner' },
        ],
        `${M(fq(n * k, d * k))}`);
    }
    const ks = shufK([2, 3, 4, 5, 6].filter(x => x !== j)).slice(0, 3), eqs = ks.map(x => `${n * x}/${d * x}`);
    const bad = keys(wrongF).find(s => !eqs.includes(s) && s !== `${gN}/${gD}`);
    if (!bad) continue;
    return kPick(`Welcher Bruch ist <b>nicht</b> gleichwertig zu ${M(given)}?`, show(bad), eqs.map(show),
      [{ rule: 'Kürzen', lines: [`${M(given)} = ${M(fq(n, d))}`, ...[bad, ...eqs].map(red), `Nur ${show(bad)} ergibt nicht ${M(fq(n, d))}.`] }],
      () => [{ title: 'Vollständig kürzen', ask: `<p>Kürze ${M(given)} vollständig. Welcher Bruch kommt heraus?</p>`, answer: q(n, d), needReduced: true, hint: `Zähler und Nenner sind beide durch ${j} teilbar.`, explain: `${M(`${given} ${eqK(j, ':')} ${fq(n, d)}`)}. Kürze jetzt jede Auswahl. Drei ergeben ${M(fq(n, d))}, eine nicht.`, placeholder: 'z. B. 2/3' }],
      show(bad));
  }
}
/** Wahr oder falsch, mit Begründung. */
function kWahrFalsch(level: number): Task {
  const S: (() => Task | null)[] = [];
  const st = (claim: string, right: string, wrong: string[], expl: string[], guide: GuideStep[], label?: string) =>
    kPick(`Stimmt die Aussage? Wähle die richtige Antwort mit Begründung.${claim.startsWith('„') ? `<p><b>${claim}</b></p>` : `<div class="math big">${claim}</div>`}`, right, wrong, [{ rule: 'Begründung', lines: expl }], () => guide, label ?? right);
  const kleiner = () => {
    const [n, d] = coprimeFrac(5), k = R(2, 3), N = n * k, D = d * k;
    return st('„Beim Kürzen wird der Bruch kleiner.“', 'Falsch. Der Wert bleibt gleich. Es gibt nur weniger, dafür größere Stücke.',
      ['Wahr. Zähler und Nenner werden kleiner, also wird auch der Bruch kleiner.', 'Wahr. Beim Kürzen wird geteilt, und Teilen macht kleiner.', 'Falsch. Der Bruch wird größer, weil die Stücke größer werden.'],
      [M(`${fq(N, D)} ${eqK(k, ':')} ${fq(n, d)}`), `Beide Streifen sind gleich weit gefärbt:${barH(N, D, fq(N, D))}${barH(n, d, fq(n, d))}`],
      [{ title: 'Ausprobieren', ask: `<p>Kürze ${M(fq(N, D))} durch ${k}. Wie heißt der neue Zähler?</p>`, answer: q(n), hint: `${N} : ${k}`, explain: `${M(`${fq(N, D)} ${eqK(k, ':')} ${fq(n, d)}`)} Gleich viel gefärbt:${barH(N, D, fq(N, D))}${barH(n, d, fq(n, d))}`, placeholder: 'Zähler' }]);
  };
  const groesser = () => {
    const [n, d] = coprimeFrac(5), k = R(2, 3), N = n * k, D = d * k;
    return st('„Beim Erweitern wird der Bruch größer.“', 'Falsch. Der Wert bleibt gleich. Es gibt mehr, dafür kleinere Stücke.',
      ['Wahr. Zähler und Nenner werden größer, also auch der Bruch.', 'Wahr. Beim Erweitern wird malgenommen, und Malnehmen macht größer.', 'Falsch. Beim Erweitern wird der Bruch kleiner.'],
      [M(`${fq(n, d)} ${eqK(k, '·')} ${fq(N, D)}`), `Beide Streifen sind gleich weit gefärbt:${barH(n, d, fq(n, d))}${barH(N, D, fq(N, D))}`],
      [{ title: 'Ausprobieren', ask: `<p>Erweitere ${M(fq(n, d))} mit ${k}. Wie heißt der neue Zähler?</p>`, answer: q(N), hint: `${n} · ${k}`, explain: `${M(`${fq(n, d)} ${eqK(k, '·')} ${fq(N, D)}`)} Gleich viel gefärbt:${barH(n, d, fq(n, d))}${barH(N, D, fq(N, D))}`, placeholder: 'Zähler' }]);
  };
  const gleich = () => {
    const [n, d] = coprimeFrac(level === 3 ? 9 : 5), k = R(2, level === 3 ? 7 : 4), N = n * k, D = d * k;
    if (Math.random() < 0.5) {
      return st(`${fq(N, D)} = ${fq(n, d)}`, `Wahr. Zähler und Nenner wurden beide durch ${k} geteilt.`,
        ['Falsch. Verschiedene Zahlen ergeben verschiedene Brüche.', `Wahr. Der Zähler wurde durch ${k} geteilt, der Nenner bleibt.`, `Falsch. Man hat oben ${N - n} und unten ${D - d} abgezogen.`],
        [M(`${fq(N, D)} ${eqK(k, ':')} ${fq(n, d)}`)],
        [{ title: 'Kürzen', ask: `<p>Kürze ${M(fq(N, D))} vollständig. Welcher Bruch kommt heraus?</p>`, answer: q(n, d), needReduced: true, hint: `Zähler und Nenner sind beide durch ${k} teilbar.`, explain: `${M(`${fq(N, D)} ${eqK(k, ':')} ${fq(n, d)}`)}. Die Aussage stimmt.`, placeholder: 'z. B. 2/3' }],
        `Wahr, gekürzt durch ${k}`);
    }
    const j = R(1, 3), a = n + j, b = d + j, r = q(a, b).red();
    return st(`${fq(n, d)} = ${fq(a, b)}`, `Falsch. Oben und unten wurde ${j} addiert. Dabei ändert sich der Wert.`,
      [`Wahr. Oben und unten wurde dieselbe Zahl addiert.`, 'Falsch. Brüche mit verschiedenen Nennern sind nie gleich.', 'Wahr. Die beiden Brüche liegen nah beieinander.'],
      [`${M(fq(a, b))} ${r.d === BigInt(b) ? 'lässt sich nicht kürzen' : `= ${M(qH(r))}`}. Es kommt nicht ${M(fq(n, d))} heraus. Gleichwertig wäre zum Beispiel ${M(`${fq(n, d)} ${eqK(2, '·')} ${fq(2 * n, 2 * d)}`)}.`],
      [{ title: 'Prüfen', ask: `<p>Kürze ${M(fq(a, b))} vollständig${r.d === BigInt(b) ? ' (vielleicht geht es gar nicht)' : ''}. Welcher Bruch kommt heraus?</p>`, answer: r, needReduced: true, hint: `Suche den ggT von ${a} und ${b}.`, explain: `${M(fq(a, b))} ergibt gekürzt ${M(qH(r))}, nicht ${M(fq(n, d))}. Die Aussage ist falsch.`, placeholder: 'z. B. 2/3' }],
      `Falsch, es wurde addiert`);
  };
  const verschieden = () => {
    const [N, D, x, y] = pick([[6, 8, 2, 4], [8, 12, 4, 2], [12, 18, 6, 3], [10, 15, 5, 1], [9, 12, 3, 2]]);
    const r = q(N / x, D / y);
    return st('„Man darf Zähler und Nenner durch verschiedene Zahlen teilen.“', 'Falsch. Dann ändert sich der Wert. Beide müssen durch dieselbe Zahl geteilt werden.',
      ['Wahr. Hauptsache, beide Zahlen werden kleiner.', 'Wahr. Man muss nur darauf achten, dass kein Rest bleibt.', 'Falsch. Man darf nur den Zähler teilen.'],
      [`Beispiel: ${M(fq(N, D))}. Zähler durch ${x}, Nenner durch ${y} ergibt ${M(fq(N / x, D / y))}. Das ist ein anderer Wert als ${M(qH(q(N, D).red()))}.`],
      [{ title: 'Ausprobieren', ask: `<p>Teile im Bruch ${M(fq(N, D))} den Zähler durch ${x} und den Nenner durch ${y}. Welcher Bruch kommt heraus?</p>`, answer: r, hint: `${N} : ${x} und ${D} : ${y}`, explain: `${M(fq(N / x, D / y))} ist nicht dasselbe wie ${M(fq(N, D))} = ${M(qH(q(N, D).red()))}. Der Wert hat sich geändert.`, placeholder: 'z. B. 3/2' }], 'Falsch, der Wert ändert sich');
  };
  const jederKuerzen = () => {
    const [a, b] = coprimeFrac(9, 4);
    return st('„Jeder Bruch lässt sich kürzen.“', `Falsch. Bei ${fq(a, b)} ist der ggT 1. Der Bruch ist schon vollständig gekürzt.`,
      ['Wahr. Jede Zahl hat Teiler, also kann man immer kürzen.', 'Wahr. Man teilt einfach Zähler und Nenner durch 2.', 'Falsch. Nur Brüche mit geradem Nenner lassen sich kürzen.'],
      [`${a} und ${b} haben außer 1 keinen gemeinsamen Teiler. ${M(fq(a, b))} kann man nicht kürzen.`],
      [{ title: 'ggT', ask: `<p>Was ist der ggT von ${a} und ${b}?</p>`, answer: q(1), hint: `Schreibe die Teiler von ${a} und von ${b} auf.`, explain: `Der ggT ist 1. ${M(fq(a, b))} lässt sich nicht kürzen.`, placeholder: 'ggT' }], `Falsch, ${fq(a, b)} geht nicht`);
  };
  const jederErw = () => {
    const [a, b] = coprimeFrac(9), k = R(2, 9);
    return st('„Jeden Bruch kann man erweitern.“', 'Wahr. Man kann Zähler und Nenner mit jeder Zahl außer 0 malnehmen.',
      ['Falsch. Nur gekürzte Brüche kann man erweitern.', 'Falsch. Wenn der Nenner schon groß ist, geht es nicht mehr.', 'Wahr. Man addiert zu Zähler und Nenner dieselbe Zahl.'],
      [`Zum Beispiel: ${M(`${fq(a, b)} ${eqK(k, '·')} ${fq(a * k, b * k)}`)}. Das geht mit jeder Zahl außer 0.`],
      [{ title: 'Ausprobieren', ask: `<p>Erweitere ${M(fq(a, b))} mit ${k}. Wie heißt der neue Zähler?</p>`, answer: q(a * k), hint: `${a} · ${k}`, explain: M(`${fq(a, b)} ${eqK(k, '·')} ${fq(a * k, b * k)}`), placeholder: 'Zähler' }]);
  };
  const addieren = () => {
    const [n, d, j] = pick([[1, 2, 1], [1, 3, 1], [2, 3, 1], [1, 4, 1], [1, 2, 2], [3, 4, 1], [2, 5, 1]]);
    const a = n + j, b = d + j, H = Number(lcm(BigInt(d), BigInt(b)));
    return st('„Addiert man zu Zähler und Nenner dieselbe Zahl, bleibt der Wert gleich.“', `Falsch. Aus ${fq(n, d)} wird ${fq(a, b)}, und das ist ein anderer Wert.`,
      ['Wahr. Das ist dasselbe wie Erweitern.', 'Wahr. Oben und unten passiert ja dasselbe.', 'Falsch. Der Wert wird dabei immer kleiner.'],
      [`${M(`${fq(n, d)} = ${fq((n * H) / d, H)}`)}, aber ${M(`${fq(a, b)} = ${fq((a * H) / b, H)}`)}. Erweitern heißt <b>malnehmen</b>, nicht addieren.`],
      [{ title: 'Vergleichen', ask: `<p>Addiere ${j} zu Zähler und Nenner von ${M(fq(n, d))}. Du bekommst ${M(fq(a, b))}. Erweitere ${M(fq(a, b))} auf den Nenner ${H}. Wie heißt der Zähler?</p>`, answer: q((a * H) / b), hint: `${H} : ${b} = ${H / b}, also ${a} · ${H / b}.`, explain: `${M(`${fq(a, b)} = ${fq((a * H) / b, H)}`)}, aber ${M(`${fq(n, d)} = ${fq((n * H) / d, H)}`)}. Die Werte sind verschieden.`, placeholder: 'Zähler' }], 'Falsch, der Wert ändert sich');
  };
  const gekuerzt = () => {
    if (Math.random() < 0.5) {
      const [a, b] = pick([[8, 15], [9, 16], [4, 9], [10, 21], [14, 15], [8, 21], [16, 27], [15, 28], [25, 36], [9, 10], [20, 27]]);
      const p = primeFactors(b)[0];
      return st(`„${M(fq(a, b))} ist vollständig gekürzt.“`, `Wahr. ${a} und ${b} haben außer 1 keinen gemeinsamen Teiler.`,
        [`Falsch. ${a} und ${b} sind keine Primzahlen, also kann man kürzen.`, `Falsch. Man kann noch durch ${p} kürzen.`, 'Wahr. Der Zähler ist kleiner als der Nenner.'],
        [`Teiler von ${a}: ${divisors(a).join(', ')}`, `Teiler von ${b}: ${divisors(b).join(', ')}`, 'Gemeinsam ist nur die 1. Der Bruch ist vollständig gekürzt, obwohl beide Zahlen keine Primzahlen sind.'],
        [{ title: 'ggT', ask: `<p>Was ist der ggT von ${a} und ${b}?</p>`, answer: q(1), hint: `Schreibe die Teiler von ${a} und von ${b} auf.`, explain: 'Der ggT ist 1. Der Bruch ist vollständig gekürzt.', placeholder: 'ggT' }], 'Wahr, ggT 1');
    }
    const g = pick([3, 5, 7]), [n0, d0] = coprimeFrac(level === 3 ? 9 : 6, 3);
    if (n0 < 2) return null;
    const a = n0 * g, b = d0 * g;
    return st(`„${M(fq(a, b))} ist vollständig gekürzt.“`, `Falsch. ${a} und ${b} sind beide durch ${g} teilbar.`,
      ['Wahr. Man kann nicht durch 2 kürzen, also ist er fertig.', 'Wahr. Der Zähler ist kleiner als der Nenner.', `Falsch. Man kann noch durch ${a} kürzen.`],
      [M(`${fq(a, b)} ${eqK(g, ':')} ${fq(n0, d0)}`)],
      [{ title: 'ggT', ask: `<p>Was ist der ggT von ${a} und ${b}?</p>`, answer: q(g), hint: 'Probiere 3, 5 und 7.', explain: `Der ggT ist ${g}: ${M(`${fq(a, b)} ${eqK(g, ':')} ${fq(n0, d0)}`)}. Der Bruch war noch nicht fertig gekürzt.`, placeholder: 'ggT' }], `Falsch, durch ${g} kürzbar`);
  };
  if (level === 1) S.push(kleiner, groesser, gleich, jederErw);
  else if (level === 2) S.push(kleiner, gleich, verschieden, jederKuerzen, addieren, gekuerzt);
  else S.push(gleich, verschieden, addieren, gekuerzt);
  for (;;) { const t = pick(S)(); if (t) return t; }
}

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
    id: 'teil', klasse: 6, title: 'Teiler, Vielfache und Primzahlen', short: 'Teilbarkeitsregeln, ggT und kgV. Das brauchst du später zum Kürzen und für den Hauptnenner.',
    exampleSol: () => ({ prompt: 'Was ist der größte gemeinsame Teiler (ggT) von 24 und 36?', sol: ggtTask(24, 36).sol }),
    theory: `
      <p>Eine Zahl ist <b>durch 3 teilbar</b>, wenn beim Teilen durch 3 kein Rest bleibt. ${M('12 : 3 = 4')} geht auf, also ist 3 ein <b>Teiler</b> von 12. Umgekehrt ist 12 ein <b>Vielfaches</b> von 3.</p>
      <p>Mit den <b>Teilbarkeitsregeln</b> siehst du es oft ohne zu rechnen:</p>
      <ul><li><b>durch 2</b>: die letzte Ziffer ist gerade (0, 2, 4, 6, 8)</li><li><b>durch 5</b>: die letzte Ziffer ist 0 oder 5</li><li><b>durch 10</b>: die letzte Ziffer ist 0</li><li><b>durch 3</b>: die <b>Quersumme</b> ist durch 3 teilbar. Bei 471 ist die Quersumme 4 + 7 + 1 = 12, also ist 471 durch 3 teilbar.</li><li><b>durch 9</b>: die Quersumme ist durch 9 teilbar</li></ul>
      <p>Eine <b>Primzahl</b> hat genau zwei Teiler: 1 und sich selbst. Die ersten sind 2, 3, 5, 7, 11, 13, 17, 19, 23, 29. Die 1 ist keine Primzahl.</p>
      <p>Der <b>ggT</b> (größter gemeinsamer Teiler) ist die größte Zahl, die beide Zahlen teilt. Den brauchst du zum Kürzen. Das <b>kgV</b> (kleinstes gemeinsames Vielfaches) ist die kleinste Zahl, die in beiden Einmaleins-Reihen vorkommt. Das brauchst du für den Hauptnenner.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Quersumme durch 3 oder 9 teilbar → Zahl durch 3 oder 9 teilbar.</li><li>ggT: Teiler beider Zahlen aufschreiben, den größten gemeinsamen nehmen.</li><li>kgV: Vielfache der größeren Zahl durchgehen, bis die kleinere hineinpasst.</li></ol></div>`,
    gen(level: number) {
      if (level === 1) return Math.random() < 0.5 ? quersummeTask(R(100, 9999)) : teilerTask(pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48]));
      if (level === 2) {
        if (Math.random() < 0.35) return primTask(R(10, 90));
        return genFrom(() => { const g = pick([2, 3, 4, 5, 6, 8]), a = g * R(2, 9), b = g * R(2, 9); return a === b ? null : ggtTask(a, b); }, t => t.answer.n > 1n);
      }
      return genFrom(() => {
        if (Math.random() < 0.5) { const a = R(3, 12), b = R(4, 15); return a === b || Math.max(a, b) % Math.min(a, b) === 0 ? null : kgvTask(a, b); }
        const g = R(3, 12), a = g * R(2, 7), b = g * R(2, 7); return a === b ? null : ggtTask(a, b);
      }, t => t.answer.n > 2n && t.answer.n <= 120n && (t.guide?.length ?? 0) <= 7);
    },
  },
  {
    id: 'groe', klasse: 5, title: 'Größen und Einheiten', short: 'Längen, Gewichte, Zeit und Geld umrechnen: km, m, cm, kg, g, h, min.',
    exampleSol: () => ({ prompt: 'Wandle um: 2,5 km = ? m', sol: groeTask(q(5, 2), PAIRS[0], true).sol }),
    theory: `
      <p>Eine <b>Größe</b> besteht aus einer <b>Maßzahl</b> und einer <b>Einheit</b>: Bei 3 m ist 3 die Maßzahl und m (Meter) die Einheit.</p>
      <p>Damit du rechnen kannst, müssen alle Größen dieselbe Einheit haben. Dafür brauchst du die <b>Umrechnungszahlen</b>:</p>
      <table class="stellen"><tr><th>Länge</th><td>1 km = 1000 m · 1 m = 10 dm = 100 cm · 1 cm = 10 mm</td></tr><tr><th>Gewicht</th><td>1 t = 1000 kg · 1 kg = 1000 g</td></tr><tr><th>Zeit</th><td>1 h = 60 min · 1 min = 60 s · 1 Tag = 24 h</td></tr><tr><th>Geld</th><td>1 € = 100 ct</td></tr></table>
      <p><b>In eine kleinere Einheit</b> (km → m): Die Zahl wird größer, also <b>mal</b> die Umrechnungszahl. ${M('3 km = 3 · 1000 m = 3000 m')}</p>
      <p><b>In eine größere Einheit</b> (cm → m): Die Zahl wird kleiner, also <b>geteilt</b> durch die Umrechnungszahl. ${M('250 cm = 250 : 100 m = 2,5 m')}</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Kleinere Einheit → mal. Größere Einheit → geteilt.</li><li>Bei 10, 100, 1000 verschiebst du einfach das Komma.</li><li>Achtung bei der Zeit: 1 h hat 60 min, nicht 100!</li></ol></div>`,
    gen(level: number) {
      return genFrom(() => {
        const p = pick(PAIRS), f = p.f;
        if (level === 1) return groeTask(q(R(2, 12)), p, true);
        if (level === 2) {
          if (Math.random() < 0.5) return groeTask(p.time ? q(R(1, 5) * 4 + pick([1, 2, 3]), 4) : f === 100 ? q(R(101, 999), 100) : q(R(11, 99), 10), p, true);
          return groeTask(q(f * R(2, 9) + (Math.random() < 0.5 ? f / 2 : 0)), p, false);
        }
        if (Math.random() < 0.4) return groeMixTask(p, R(1, 9), p.time ? R(1, 59) : f === 1000 ? R(1, 199) * 5 : R(1, f - 1));
        const part = p.time ? pick([6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54]) : f === 1000 ? R(1, 99) * 10 : R(1, f - 1);
        return groeTask(q(f * R(0, 6) + part), p, false);
      }, t => t.answer.sign() > 0 && t.answer.terminating() && dp(t.answer) <= 3);
    },
  },
  {
    id: 'flae', klasse: 5, title: 'Umfang und Flächeninhalt', short: 'Rechteck, Quadrat, Dreieck, Parallelogramm und Trapez: einmal außen herum und wie viel Fläche.',
    exampleSol: () => { const t = flaeTask('rect', 'A', 6, 4); return { prompt: t.prompt, sol: t.sol }; },
    theory: `
      <p>Der <b>Umfang</b> ist der Weg einmal <b>außen herum</b>, wie ein Zaun um einen Garten. Du addierst alle Seiten. Die Einheit ist eine Länge, zum Beispiel cm.</p>
      <p>Der <b>Flächeninhalt</b> sagt, wie viel <b>Fläche</b> innen drin ist, wie viele Fliesen auf den Boden passen. Die Einheit ist eine Fläche, zum Beispiel cm² (Quadratzentimeter, ein Kästchen von 1 cm mal 1 cm).</p>
      <table class="stellen"><tr><th></th><th>Umfang u</th><th>Flächeninhalt A</th></tr>
        <tr><th>Rechteck</th><td>2 · a + 2 · b</td><td>a · b</td></tr><tr><th>Quadrat</th><td>4 · a</td><td>a · a</td></tr>
        <tr><th>Parallelogramm</th><td>2 · a + 2 · b</td><td>g · h</td></tr><tr><th>Dreieck</th><td>a + b + c</td><td>g · h : 2</td></tr>
        <tr><th>Trapez</th><td>a + b + c + d</td><td>(a + c) · h : 2</td></tr></table>
      <p>Beim Dreieck ist die Fläche genau die <b>Hälfte</b> von einem Rechteck mit derselben Grundseite g und Höhe h. Darum steht dort „: 2“.</p>
      <p>Ein <b>Trapez</b> hat zwei parallele Seiten a und c. Legst du zwei gleiche Trapeze verkehrt herum aneinander, entsteht ein Parallelogramm mit der Grundseite a + c. Ein Trapez ist davon die Hälfte: ${M('(a + c) · h : 2')}.</p>
      <p>Bei zusammengesetzten Figuren zerlegst du in Rechtecke und addierst die Flächen, oder du rechnest das große Rechteck und ziehst das fehlende Stück ab.</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Umfang: alle Seiten außen addieren, Einheit cm.</li><li>Fläche: Formel, Einheit cm².</li><li>Alle Längen vorher in dieselbe Einheit bringen.</li></ol></div>`,
    gen(level: number) {
      return genFrom(() => {
        if (level === 1) return flaeTask(pick(['rect', 'square'] as const), pick(['A', 'U'] as const), R(2, 12), R(2, 9));
        if (level === 2) return flaeTask(pick(['tri', 'para', 'rect', 'square'] as const), pick(['A', 'A', 'U'] as const), R(3, 12), R(2, 10), pick(['cm', 'm']));
        const k = Math.random();
        return k < 0.35 ? flaeTask('trap', pick(['A', 'A', 'U'] as const), R(6, 14), R(3, 9)) : k < 0.7 ? lshapeTask() : sideTask();
      }, t => t.answer.sign() > 0 && t.answer.isInt());
    },
  },
  {
    id: 'kuerzen', klasse: 6, title: 'Brüche kürzen', short: 'Was ein Bruch ist, wie du ihn kürzt und erweiterst und warum sein Wert dabei gleich bleibt.',
    exampleSol: () => ({ prompt: `Kürze vollständig: ${M(qH(q(18, 24)))}`, sol: kuerzenSol(18, 24) }),
    theory: `
      <p>Ein <b>Bruch</b> beschreibt Teile von einem Ganzen. Bei ${M(qH(q(3, 4)))} wird das Ganze in <b>4</b> gleich große Stücke geteilt. Das sagt die untere Zahl, der <b>Nenner</b>. Davon nimmst du <b>3</b> Stücke. Das sagt die obere Zahl, der <b>Zähler</b>.</p>
      ${barH(3, 4, qH(q(3, 4)))}
      <p><b>Kürzen</b> heißt: Zähler und Nenner durch dieselbe Zahl teilen. Der Bruch bleibt genauso groß, nur die Stücke werden größer und es sind weniger.</p>
      ${barH(6, 8, qH(q(6, 8)))}${barH(3, 4, qH(q(3, 4)))}
      <p>Bei ${M(qH(q(6, 8)))} teilst du oben und unten durch 2 und bekommst ${M(qH(q(3, 4)))}. Gleich viel angemalt!</p>
      <p><b>Erweitern</b> ist das Gegenteil: Zähler und Nenner mit derselben Zahl malnehmen. Dann gibt es mehr Stücke, dafür kleinere.</p>
      ${barH(2, 3, qH(q(2, 3)))}${barH(8, 12, qH(q(8, 12)))}
      <p><b>So schreibst du es im Heft:</b> Die Erweiterungszahl steht <b>über</b> dem Gleichheitszeichen, die Kürzungszahl <b>unter</b> dem Gleichheitszeichen.</p>
      <p class="math big">${qH(q(2, 3))} ${eqK(4, '·')} ${qH(q(8, 12))}&emsp;&emsp;${qH(q(18, 24))} ${eqK(6, ':')} ${qH(q(3, 4))}</p>
      <p><b>Auf einen bestimmten Nenner:</b> ${M(`${qH(q(3, 4))} = ${fracH('?', 20)}`)}. Der Nenner wird von 4 zu 20, also mal 5. Dann auch den Zähler mal 5: ${M(`${qH(q(3, 4))} ${eqK(5, '·')} ${qH(q(15, 20))}`)}. Genauso beim Kürzen: ${M(`${qH(q(12, 18))} = ${fracH('?', 3)}`)}. 18 : 3 = 6, also ${M(`${qH(q(12, 18))} ${eqK(6, ':')} ${qH(q(2, 3))}`)}.</p>
      <p><b>Schrittweise kürzen</b> ist auch erlaubt: ${M(`${qH(q(24, 36))} ${eqK(2, ':')} ${qH(q(12, 18))} ${eqK(2, ':')} ${qH(q(6, 9))} ${eqK(3, ':')} ${qH(q(2, 3))}`)}. Mit dem ggT 12 geht es in einem Schritt: ${M(`${qH(q(24, 36))} ${eqK(12, ':')} ${qH(q(2, 3))}`)}.</p>
      <p><b>Bruchstreifen</b> zeigen, warum der Wert gleich bleibt: Leg die Streifen übereinander. Es ist genau gleich viel gefärbt, egal in wie viele Stücke der Streifen geteilt ist. Alle diese Brüche heißen <b>gleichwertig</b>.</p>
      <p><b>Typische Fehler:</b> Nur den Zähler verändern (${M(`${qH(q(2, 3))} ≠ ${qH(q(4, 3))}`)}) oder addieren statt malnehmen (${M(`${qH(q(2, 3))} ≠ ${qH(q(4, 5))}`)}).</p>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Kürzen: Zähler <b>und</b> Nenner durch dieselbe Zahl teilen.</li><li>Erweitern: Zähler <b>und</b> Nenner mit derselben Zahl malnehmen.</li><li><b>Der Wert eines Bruchs ändert sich beim Kürzen und Erweitern nie.</b></li><li>Am schnellsten kürzt du mit dem <b>ggT</b>, dem größten gemeinsamen Teiler.</li><li>Vollständig gekürzt ist ein Bruch, wenn oben und unten nur noch 1 als gemeinsamen Teiler haben.</li></ol></div>
      <p>Teilbarkeits-Tricks: Gerade Zahlen gehen durch 2. Endet die Zahl auf 0 oder 5, geht sie durch 5. Ist die Quersumme durch 3 teilbar, geht die Zahl durch 3.</p>`,
    gen(level: number) {
      if (level === 1) return pick([() => kBasic(1), () => kBasic(1), () => kErwAuf(1), () => kWelcheZahl(1), kStreifen, () => kWahrFalsch(1)])();
      if (level === 2) return pick([() => kBasic(2), () => kAufNenner(2), () => kWelcheZahl(2), () => kSchritt(2), () => kGleich(2), kStreifenPick, () => kWahrFalsch(2)])();
      return pick([() => kBasic(3), () => kAufNenner(3), () => kSchritt(3), () => kGleich(3), kKuerzErw, () => kWahrFalsch(3)])();
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
    id: 'neg', klasse: 6, title: 'Negative Zahlen', short: 'Zahlen unter null: Temperatur, Kontostand und Rechnen mit Plus und Minus.',
    example: '(−3) · 4 + 7',
    theory: `
      <p><b>Negative Zahlen</b> sind kleiner als null. Du kennst sie vom Thermometer: −5 °C ist kälter als 0 °C. Auf dem <b>Zahlenstrahl</b> stehen sie links von der Null.</p>
      <p><b>Plus</b> heißt: auf dem Zahlenstrahl nach rechts gehen. <b>Minus</b> heißt: nach links gehen. ${M('−3 + 5 = 2')}: Von −3 fünf Schritte nach rechts landest du bei 2. ${M('2 − 6 = −4')}: Von 2 sechs Schritte nach links landest du bei −4.</p>
      <p><b>Eine negative Zahl abziehen</b> ist wie eine positive dazuzählen: ${M('5 − (−3) = 5 + 3 = 8')}. Stell dir vor, jemand nimmt dir 3 € Schulden weg. Dann hast du 3 € mehr.</p>
      <p><b>Mal und Geteilt:</b> Rechne erst ohne Vorzeichen. Dann das Vorzeichen:</p>
      <ul><li>gleiche Vorzeichen → <b>plus</b>: ${M('(−4) · (−3) = 12')}</li><li>verschiedene Vorzeichen → <b>minus</b>: ${M('(−4) · 3 = −12')}</li></ul>
      <div class="merke"><span class="merke-l">Merke</span><ol><li>Plus: nach rechts. Minus: nach links.</li><li>Minus minus wird plus.</li><li>Mal/Geteilt: gleiche Vorzeichen plus, verschiedene minus.</li><li>Punkt vor Strich gilt weiter.</li></ol></div>`,
    gen(level: number) {
      const n = () => R(1, 12) * pick([1, -1]);
      const p = (v: number) => (v < 0 ? `(−${-v})` : String(v));
      return genFrom(() => {
        let s;
        if (level === 1) s = pick([`${p(-R(1, 12))} + ${R(1, 15)}`, `${R(1, 9)} − ${R(10, 20)}`, `${p(-R(1, 9))} − ${R(1, 9)}`, `${p(n())} + ${p(n())}`]);
        else if (level === 2) { const a = R(2, 9), b = R(2, 9); s = pick([`${p(-a)} · ${b}`, `${p(-a)} · ${p(-b)}`, `${p(-a * b)} : ${b}`, `${p(-a * b)} : ${p(-a)}`, `${R(1, 9)} − ${p(-R(1, 9))}`]); }
        else s = pick([`${p(n())} · ${p(n())} + ${p(n())}`, `${p(n())} − ${p(n())} · ${R(2, 5)}`, `(${p(n())} + ${p(n())}) · ${p(-R(2, 4))}`, `${p(n())} · ${p(n())} − ${p(n())} · ${p(n())}`]);
        return exprTask(s, { placeholder: 'z. B. −7', diag: v => { const r = evalExpr(s).result; return v.eq(r.neg()) && !r.isZero() ? 'Der Betrag stimmt, aber das <b>Vorzeichen</b> nicht. Prüfe: gleiche Vorzeichen → plus, verschiedene → minus.' : null; } });
      }, t => t.answer.isInt() && t.answer.lt(q(200)) && q(-200).lt(t.answer) && !t.answer.isZero());
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
  ...MORE,
];
