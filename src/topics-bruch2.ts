/* ===== Klasse 6: Brüche vergleichen, Bruch/Dezimalzahl/Prozent, rationale Zahlen ===== */
import type { GuideStep } from './guide.js';
import { autoGuide, wordTask } from './guide.js';
import { Q, q, qH, fracH, mixedH, sg, lcm, evalExpr, type ListSolution } from './engine/index.js';
import { M, R, exprTask, genFrom, list, pick, type Task, type Topic } from './gen.js';
import { LETTERS, type Widget } from './widgets.js';

/* ---------- Bausteine ---------- */
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const uniq = (a: string[]) => [...new Set(a)];
const fr = (n: number, d: number) => qH(q(n, d));
const dH = (v: Q) => qH(v, true);
const num = (v: Q) => Number(v.n) / Number(v.d);
const opts = (right: string, wrong: string[]) => [{ html: right, ok: true }, ...wrong.filter(w => w !== right).map(w => ({ html: w, ok: false }))];
/** Zahl in Zehnteln/Hundertsteln als Text für die Recheneinheit: decS(-25, 1) = "−2,5" */
const decS = (v: number, k: number) => { const s = (Math.abs(v) / 10 ** k).toFixed(k).replace(/0+$/, '').replace(/\.$/, '').replace('.', ','); return (v < 0 ? '−' : '') + s; };
/** Negative Zahl in Klammern für Rechenterme */
const pS = (v: number, k: number) => (v < 0 ? `(${decS(v, k)})` : decS(v, k));
const LT = M('&lt;'), GT = M('&gt;'), EQ = M('=');
const SIGNS = [LT, GT, EQ];

function task(prompt: string, answer: Q, resH: string, steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> = {}): Task {
  return { prompt, answer, sol: list(steps, answer, resH), guide, placeholder: 'Deine Lösung', ...o };
}
/** Auswahl-Aufgabe mit fester Reihenfolge der Optionen. */
function pickFrom(prompt: string, options: string[], ok: number, steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> & { label?: string } = {}): Task {
  const w: Widget = { kind: 'pick', options };
  const { label, ...rest } = o;
  return task(prompt, q(ok + 1), `${LETTERS[ok]}: ${label ?? options[ok]}`, steps, guide, { widget: w, placeholder: 'Auswahl', ...rest });
}
/** Auswahl-Aufgabe: richtige Option und typische Fehler, gemischt. */
function pickTask(prompt: string, right: string, wrong: string[], steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> & { label?: string } = {}): Task {
  const all = shuffle([right, ...uniq(wrong.filter(x => x !== right)).slice(0, 3)]);
  return pickFrom(prompt, all, all.indexOf(right), steps, guide, o);
}

/* Bruchbilder: Streifen und Kreis */
const ON = 'style="fill: var(--tc, var(--blue)); fill-opacity: .75"';
function stripSVG(n: number, d: number): string {
  const W = 240, w = W / d;
  let s = '';
  for (let i = 0; i < d; i++) s += `<rect class="sh" ${i < n ? ON : ''} x="${4 + i * w}" y="4" width="${w}" height="34" />`;
  return `<svg class="fig" viewBox="0 0 248 42" role="img" aria-label="Bruchstreifen mit ${d} gleichen Teilen, ${n} davon gefärbt">${s}</svg>`;
}
function pieSVG(n: number, d: number): string {
  const c = 60, r = 52;
  let s = '';
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
    s += `<path class="sh" ${i < n ? ON : ''} d="M ${c} ${c} L ${p(a0)} A ${r} ${r} 0 ${d === 1 ? 1 : 0} 1 ${p(a1)} Z" />`;
  }
  return `<svg class="fig" viewBox="0 0 120 120" style="max-width: 130px" role="img" aria-label="Kreis mit ${d} gleichen Teilen, ${n} davon gefärbt">${s}</svg>`;
}
const pic = (n: number, d: number, circle: boolean) => (circle ? pieSVG(n, d) : stripSVG(n, d));

/** Primfaktoren als Liste */
function factors(n: number): number[] { const f: number[] = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f; }
/** Schriftliches Teilen n : d (n < d): Ziffern nach dem Komma, Reste, Vorperiode und Periode. */
function longDiv(n: number, d: number) {
  const digits: number[] = [], rems: number[] = [], seen = new Map<number, number>();
  let r = n % d, pre = -1;
  while (r !== 0 && digits.length < 40) {
    if (seen.has(r)) { pre = seen.get(r)!; break; }
    seen.set(r, digits.length); rems.push(r);
    digits.push(Math.floor((10 * r) / d)); r = (10 * r) % d;
  }
  return { int: Math.floor(n / d), digits, rems, pre: pre < 0 ? digits.length : pre, periodic: pre >= 0 };
}
/** Dezimalzahl mit Periodenstrich, z. B. 0,1‾6 */
function perH(n: number, d: number): string {
  const L = longDiv(n, d);
  const a = L.digits.slice(0, L.pre).join(''), p = L.digits.slice(L.pre).join('');
  return `${L.int},${a}${p ? `<span class="per">${p}</span>` : ''}`;
}
const PER_FR: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [7, 9], [2, 11], [4, 11], [1, 12], [5, 12], [7, 12], [1, 15], [2, 15]];

/* ======================================================================
   1. Brüche vergleichen und ordnen
   ====================================================================== */
const DEN = [2, 3, 4, 5, 6, 8, 10, 12];
const properFrac = (ds = DEN): [number, number] => { for (;;) { const d = pick(ds), n = R(1, d - 1); if (q(n, d).isRed()) return [n, d]; } };

function readTask(): Task {
  const circle = Math.random() < 0.4, d = circle ? pick([3, 4, 5, 6, 8]) : R(3, 10), n = R(1, d - 1);
  return task(`Welcher Bruch ist gefärbt? Schreib ihn als Bruch.${pic(n, d, circle)}`, q(n, d), fr(n, d),
    [{ rule: 'Nenner', lines: [`Das Ganze ist in ${d} gleich große Teile geteilt. Das ist der Nenner.`] }, { rule: 'Zähler', lines: [`${n} Teile sind gefärbt. Das ist der Zähler.`, `Der Bruch heißt ${M(fr(n, d))}.`] }],
    [{ title: 'Nenner', ask: '<p>In wie viele gleich große Teile ist das Ganze geteilt?</p>', answer: q(d), hint: 'Zähle alle Teile, auch die weißen.', explain: `${d} Teile: Der Nenner ist ${d}.`, placeholder: 'Anzahl' },
     { title: 'Zähler', ask: '<p>Wie viele Teile sind gefärbt?</p>', answer: q(n), hint: 'Zähle nur die farbigen Teile.', explain: `${n} Teile: Der Zähler ist ${n}.`, placeholder: 'Anzahl' },
     { title: 'Bruch', ask: '<p>Wie heißt der Bruch? Der Zähler steht oben, der Nenner unten.</p>', answer: q(n, d), hint: 'Schreibe Zähler/Nenner, zum Beispiel 3/5.', explain: M(fr(n, d)), placeholder: 'z. B. 3/5' }],
    { form: 'frac', placeholder: 'z. B. 3/5', diag: v => (v.eq(q(d, n)) ? 'Zähler und Nenner sind vertauscht. Unten steht, in wie viele Teile das Ganze geteilt ist.' : v.eq(q(d - n, d)) ? 'Das ist der weiße Teil. Gefragt ist der gefärbte Teil.' : v.eq(q(n, d - n)) ? 'Du hast gefärbte durch weiße Teile gerechnet. Unten steht die Anzahl <b>aller</b> Teile.' : null) });
}
function erwTask(level: number): Task {
  const [a, b] = properFrac([2, 3, 4, 5, 6, 8, 10]), k = R(2, level === 1 ? 5 : 9), c = b * k;
  return task(`Erweitere: ${M(`${fr(a, b)} = ${fracH('?', c)}`)}. Welche Zahl gehört in den Zähler?`, q(a * k), String(a * k),
    [{ rule: 'Erweiterungszahl', lines: [`Der Nenner wird von ${b} zu ${c}. Also wird mit ${c} : ${b} = ${k} erweitert.`] }, { rule: 'Zähler', lines: [`Der Zähler wird genauso mit ${k} malgenommen: ${a} · ${k} = ${a * k}.`, M(`${fr(a, b)} = ${fracH(`${a} · ${k}`, `${b} · ${k}`)} = ${fr(a * k, c)}`)] }],
    [{ title: 'Erweiterungszahl', ask: `<p>Mit welcher Zahl musst du den Nenner ${b} malnehmen, damit ${c} herauskommt?</p><div class="math big">${b} · ? = ${c}</div>`, answer: q(k), hint: `Rechne ${c} : ${b}.`, explain: `${b} · ${k} = ${c}. Du erweiterst mit ${k}.`, placeholder: 'Zahl' },
     { title: 'Zähler', ask: `<p>Nimm den Zähler ${a} mit derselben Zahl mal.</p><div class="math big">${a} · ${k} = ?</div>`, answer: q(a * k), hint: 'Beim Erweitern nimmst du Zähler und Nenner mit derselben Zahl mal.', explain: M(`${fr(a, b)} = ${fr(a * k, c)}`), placeholder: 'Zähler' }],
    { placeholder: 'Zähler', diag: v => (v.eq(q(a + c - b)) ? 'Beim Erweitern wird nicht addiert, sondern <b>malgenommen</b>. Zähler und Nenner mit derselben Zahl mal.' : v.eq(q(k)) ? 'Das ist die Erweiterungszahl. Nimm jetzt noch den Zähler damit mal.' : null) });
}
function bildPick(): Task {
  for (;;) {
    const d = R(3, 8), n = R(1, d - 1);
    if (2 * n === d || !q(n, d).isRed()) continue;
    const circle = Math.random() < 0.35;
    const wrongF: [number, number][] = [[d - n, d], [n, d + 1], [n, n + d], [n + 1, d]].filter(([a, b]) => a < b) as [number, number][];
    const keys = new Set<string>([`${n}/${d}`]), wrong: string[] = [];
    for (const [a, b] of wrongF) { if (keys.has(`${a}/${b}`) || q(a, b).eq(q(n, d)) || wrong.length >= 3) continue; keys.add(`${a}/${b}`); wrong.push(pic(a, b, circle)); }
    if (wrong.length < 2) continue;
    return pickTask(`Welches Bild zeigt ${M(fr(n, d))}?`, pic(n, d, circle), wrong,
      [{ rule: 'Nenner', lines: [`Der Nenner ${d} sagt: Das Ganze ist in ${d} gleich große Teile geteilt.`] }, { rule: 'Zähler', lines: [`Der Zähler ${n} sagt: ${n} davon sind gefärbt.`] }],
      [{ title: 'Teile insgesamt', ask: `<p>In wie viele Teile muss das Ganze geteilt sein?</p>`, answer: q(d), hint: 'Das sagt der Nenner, die untere Zahl.', explain: `${d} Teile insgesamt.`, placeholder: 'Anzahl' },
       { title: 'Gefärbte Teile', ask: `<p>Wie viele Teile müssen gefärbt sein?</p>`, answer: q(n), hint: 'Das sagt der Zähler, die obere Zahl.', explain: `${n} von ${d} Teilen gefärbt. Such jetzt das passende Bild.`, placeholder: 'Anzahl' }],
      { label: `das Bild mit ${n} von ${d} gefärbten Teilen` });
  }
}

/** Zwei Brüche vergleichen über den Hauptnenner. */
function vglTask(level: number): Task {
  let a: number, b: number, c: number, d: number;
  for (;;) {
    [a, b] = properFrac(); [c, d] = properFrac();
    if (Math.random() < 0.15) { const k = R(2, 4); if (b * k > 24) continue; c = a * k; d = b * k; }
    if (level === 3 && Math.random() < 0.4) { a += b * R(1, 2); c += d * R(1, 2); }
    if (b !== d && lcm(BigInt(b), BigInt(d)) <= 40n) break;
  }
  const H = Number(lcm(BigInt(b), BigInt(d))), A = (a * H) / b, C = (c * H) / d;
  const ok = A < C ? 0 : A > C ? 1 : 2, sym = ['&lt;', '&gt;', '='][ok];
  return pickFrom(`Welches Zeichen gehört in die Lücke?<div class="math big">${fr(a, b)} &#9633; ${fr(c, d)}</div>`, SIGNS, ok,
    [{ rule: 'Hauptnenner', lines: [`Der Hauptnenner von ${b} und ${d} ist ${H}.`] },
     { rule: 'Erweitern', lines: [M(`${fr(a, b)} = ${fr(A, H)}`), M(`${fr(c, d)} = ${fr(C, H)}`)] },
     { rule: 'Vergleichen', lines: [`Gleicher Nenner: Der größere Zähler gewinnt. ${A} ${sym} ${C}, also ${M(`${fr(a, b)} ${sym} ${fr(c, d)}`)}.`] }],
    [{ title: 'Hauptnenner', ask: `<p>Welches ist die kleinste Zahl, in der ${b} und ${d} beide aufgehen?</p>`, answer: q(H), hint: `Geh die Vielfachen von ${Math.max(b, d)} durch: ${Math.max(b, d)}, ${2 * Math.max(b, d)}, … Welche ist auch durch ${Math.min(b, d)} teilbar?`, explain: `Der Hauptnenner ist ${H}.`, placeholder: 'Hauptnenner' },
     { title: `${fr(a, b)} erweitern`, ask: `<p>Erweitere ${M(fr(a, b))} auf den Nenner ${H}. Wie heißt der neue Zähler?</p>`, answer: q(A), hint: `Erweitere mit ${H / b}: ${a} · ${H / b}.`, explain: M(`${fr(a, b)} = ${fr(A, H)}`), placeholder: 'Zähler' },
     { title: `${fr(c, d)} erweitern`, ask: `<p>Erweitere ${M(fr(c, d))} auf den Nenner ${H}. Wie heißt der neue Zähler?</p>`, answer: q(C), hint: `Erweitere mit ${H / d}: ${c} · ${H / d}.`, explain: `${M(`${fr(c, d)} = ${fr(C, H)}`)}. Jetzt vergleichst du nur noch die Zähler ${A} und ${C}.`, placeholder: 'Zähler' }],
    { label: sym });
}
/** Bruch auf der Zahlengeraden von 0 bis U. */
function bruchLine(): Task {
  const [d, U] = pick([[2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [4, 4], [5, 2], [5, 3], [8, 2]] as [number, number][]);
  const n = d * U;
  let k: number; do k = R(1, n - 1); while (k % d === 0);
  const v = q(k, d).red(), mixed = num(v) > 1 && Math.random() < 0.5;
  const vH = mixed ? mixedH(v)! : qH(v);
  const ticks = Array.from({ length: n + 1 }, (_, i) => (i % d === 0 ? String(i / d) : ''));
  const g: GuideStep[] = [
    { title: 'Abschnitte pro Ganzes', ask: '<p>In wie viele gleich große Abschnitte ist die Strecke von 0 bis 1 geteilt?</p>', answer: q(d), hint: 'Zähle die Abschnitte zwischen 0 und 1, nicht die Striche.', explain: `Ein Abschnitt ist ${M(fr(1, d))}.`, placeholder: 'Anzahl' },
    { title: 'Abschnitte zählen', ask: `<p>Schreibe ${M(vH)} mit dem Nenner ${d}. Wie viele ${d === 2 ? 'Halbe' : `${d}tel`} sind das?</p>`, answer: q(k), hint: mixed ? `Ein Ganzes sind ${d} Abschnitte. Rechne ganze Zahl mal ${d}, plus Zähler.` : `Erweitere auf den Nenner ${d}.`, explain: `${M(`${vH} = ${fr(k, d)}`)}. Geh von 0 aus ${k} Abschnitte nach rechts.`, placeholder: 'Anzahl' },
  ];
  return task(`Setze den Punkt P auf die Zahl ${M(vH)}.`, q(k + 1), `Strich ${k + 1} von links`,
    [{ rule: 'Einteilung', lines: [`Von 0 bis 1 sind es ${d} Abschnitte. Jeder Abschnitt ist ${M(fr(1, d))}.`] }, { rule: 'Abzählen', lines: [`${M(`${vH} = ${fr(k, d)}`)}: ${k} Abschnitte von 0 nach rechts.`] }],
    g, { widget: { kind: 'line', n, label: 'P', ticks }, placeholder: 'Punkt setzen' });
}
function toImproper(level: number): Task {
  const [n, d] = properFrac([2, 3, 4, 5, 6, 8, 9, 10]), w = R(1, level === 3 ? 9 : 4), Z = w * d + n, v = q(Z, d);
  return task(`Schreibe ${M(mixedH(v)!)} als unechten Bruch.`, v, fr(Z, d),
    [{ rule: 'Ganze in Bruchteile', lines: [`${w} Ganze sind ${w} · ${d} = ${w * d} ${d}tel.`] }, { rule: 'Dazuzählen', lines: [`${w * d} + ${n} = ${Z}, also ${M(`${mixedH(v)} = ${fr(Z, d)}`)}`] }],
    [{ title: 'Die Ganzen', ask: `<p>Ein Ganzes sind ${M(fr(d, d))}. Wie viele ${d}tel sind ${w} Ganze?</p><div class="math big">${w} · ${d} = ?</div>`, answer: q(w * d), hint: `Ganze Zahl mal Nenner.`, explain: `${w} = ${fr(w * d, d)}`, placeholder: 'Anzahl' },
     { title: 'Zähler', ask: `<p>Dazu kommen noch ${M(fr(n, d))}. Wie heißt der neue Zähler?</p>`, answer: q(Z), hint: `${w * d} + ${n}`, explain: `${w * d} + ${n} = ${Z}`, placeholder: 'Zähler' },
     { title: 'Unechter Bruch', ask: `<p>Wie heißt der unechte Bruch? Der Nenner bleibt ${d}.</p>`, answer: v, hint: `Zähler ${Z}, Nenner ${d}.`, explain: M(`${mixedH(v)} = ${fr(Z, d)}`), placeholder: 'z. B. 11/4' }],
    { form: 'frac', placeholder: 'z. B. 11/4', diag: x => (x.eq(q(w * n, d)) || x.eq(q(w + n, d)) ? `Rechne so: ganze Zahl mal Nenner, plus Zähler: ${w} · ${d} + ${n}.` : null) });
}
function toMixed(level: number): Task {
  const [n, d] = properFrac([2, 3, 4, 5, 6, 8, 9, 10]), w = R(1, level === 3 ? 9 : 4), Z = w * d + n, v = q(Z, d);
  return task(`Schreibe ${M(fr(Z, d))} als gemischte Zahl.`, v, mixedH(v)!,
    [{ rule: 'Ganze herausziehen', lines: [`${Z} : ${d} = ${w} Rest ${n}`] }, { rule: 'Gemischte Zahl', lines: [`${w} Ganze und ${M(fr(n, d))} übrig: ${M(`${fr(Z, d)} = ${mixedH(v)}`)}`] }],
    [{ title: 'Ganze', ask: `<p>Wie oft passt ${d} ganz in ${Z}?</p><div class="math big">${Z} : ${d} = ? Rest …</div>`, answer: q(w), hint: `Geh die Einmaleins-Reihe von ${d} durch.`, explain: `${w} · ${d} = ${w * d}. Das sind ${w} Ganze.`, placeholder: 'Ganze' },
     { title: 'Rest', ask: `<p>Wie viel bleibt übrig?</p><div class="math big">${Z} − ${w * d} = ?</div>`, answer: q(n), hint: 'Der Rest wird der neue Zähler.', explain: `Rest ${n}, das sind ${M(fr(n, d))}.`, placeholder: 'Rest' },
     { title: 'Gemischte Zahl', ask: `<p>Schreib die gemischte Zahl: erst die Ganzen, dann ein Leerzeichen, dann den Bruch.</p>`, answer: v, hint: `${w} ${n}/${d}`, explain: M(`${fr(Z, d)} = ${mixedH(v)}`), placeholder: 'z. B. 2 3/4' }],
    { form: 'mixed', placeholder: 'z. B. 2 3/4', diag: x => (x.eq(q(w).add(q(d, n))) ? 'Zähler und Nenner im Bruchteil sind vertauscht. Der Nenner bleibt gleich.' : null) });
}
/** Drei oder vier Brüche ordnen. */
function ordTask(): Task | null {
  return genFrom(() => {
    const cnt = Math.random() < 0.3 ? 4 : 3, fs: [number, number][] = [];
    while (fs.length < cnt) { const f = properFrac(); if (!fs.some(([a, b]) => q(a, b).eq(q(f[0], f[1])))) fs.push(f); }
    const H = Number(fs.reduce((m, [, b]) => lcm(m, BigInt(b)), 1n));
    if (H > 60 || new Set(fs.map(f => f[1])).size < 2) return null;
    const show = (o: [number, number][]) => M(o.map(([a, b]) => fr(a, b)).join(' &lt; '));
    const asc = [...fs].sort((x, y) => x[0] / x[1] - y[0] / y[1]);
    const wrong = uniq([show([...fs].sort((x, y) => x[1] - y[1] || x[0] - y[0])), show([...fs].sort((x, y) => x[0] - y[0] || x[1] - y[1])), show([...asc].reverse()), ...Array.from({ length: 6 }, () => show(shuffle(fs)))]).filter(s => s !== show(asc));
    if (wrong.length < 3) return null;
    const pickW = [...wrong.slice(0, 2), wrong[R(2, wrong.length - 1)]];
    return pickTask(`Ordne die Brüche der Größe nach. Fang mit dem <b>kleinsten</b> an.<div class="math big">${shuffle(fs).map(([a, b]) => fr(a, b)).join(' ; ')}</div>`, show(asc), pickW,
      [{ rule: 'Hauptnenner', lines: [`Der Hauptnenner von ${fs.map(f => f[1]).join(', ')} ist ${H}.`] },
       { rule: 'Erweitern', lines: fs.map(([a, b]) => M(`${fr(a, b)} = ${fr((a * H) / b, H)}`)) },
       { rule: 'Ordnen', lines: [`Nach den Zählern ordnen: ${show(asc)}`] }],
      [{ title: 'Hauptnenner', ask: `<p>Welches ist die kleinste Zahl, in der ${fs.map(f => f[1]).join(', ')} alle aufgehen?</p>`, answer: q(H), hint: 'Geh die Vielfachen des größten Nenners durch.', explain: `Der Hauptnenner ist ${H}.`, placeholder: 'Hauptnenner' },
       ...fs.map(([a, b]): GuideStep => ({ title: `${fr(a, b)} erweitern`, ask: `<p>Erweitere ${M(fr(a, b))} auf den Nenner ${H}. Wie heißt der neue Zähler?</p>`, answer: q((a * H) / b), hint: `${a} · ${H / b}`, explain: M(`${fr(a, b)} = ${fr((a * H) / b, H)}`), placeholder: 'Zähler' }))],
      { label: show(asc) });
  }, () => true);
}
/** Welche Zahl liegt zwischen zwei Brüchen? */
function zwischenTask(): Task | null {
  return genFrom(() => {
    const [a, b] = properFrac([2, 3, 4, 5, 6, 8]), [c, d] = properFrac([2, 3, 4, 5, 6, 8]);
    const x = q(a, b), y = q(c, d);
    if (!x.lt(y) || num(y) - num(x) > 0.35 || b === d) return null;
    const H = Number(lcm(BigInt(b), BigInt(d)));
    let k = 1; while ((c * H * k) / d - (a * H * k) / b < 2) k++;
    const N = H * k, X = (a * N) / b, Y = (c * N) / d, m = R(X + 1, Y - 1), right = q(m, N).red();
    const cand: Q[] = [];
    for (let den = 2; den <= 12; den++) for (let z = 1; z < den; z++) { const v = q(z, den); if (v.isRed() && (v.lt(x) || y.lt(v)) && Math.min(Math.abs(num(v) - num(x)), Math.abs(num(v) - num(y))) < 0.2) cand.push(v); }
    const below = shuffle(cand.filter(v => v.lt(x))), above = shuffle(cand.filter(v => y.lt(v)));
    const wrongs = [below[0], above[0], shuffle([...below.slice(1), ...above.slice(1)])[0]].filter(Boolean);
    if (wrongs.length < 3) return null;
    return pickTask(`Welche Zahl liegt <b>zwischen</b> ${M(qH(x))} und ${M(qH(y))}?`, M(qH(right)), wrongs.map(v => M(qH(v))),
      [{ rule: 'Gleicher Nenner', lines: [`${k > 1 ? `Beim Hauptnenner ${H} liegt kein Zähler dazwischen. Deshalb nimmst du den Nenner ${N}.` : `Der Hauptnenner ist ${H}.`}`, M(`${qH(x)} = ${fr(X, N)}`), M(`${qH(y)} = ${fr(Y, N)}`)] },
       { rule: 'Dazwischen', lines: [`Zwischen ${fr(X, N)} und ${fr(Y, N)} liegt zum Beispiel ${M(fr(m, N))}${right.d !== BigInt(N) ? ` = ${M(qH(right))}` : ''}.`] }],
      [{ title: `${qH(x)} erweitern`, ask: `<p>Erweitere ${M(qH(x))} auf den Nenner ${N}. Wie heißt der neue Zähler?</p>`, answer: q(X), hint: `${k > 1 ? `Beim kleinsten gemeinsamen Nenner ${H} liegt nichts dazwischen, deshalb nehmen wir ${N}. ` : ''}${a} · ${N / b}`, explain: M(`${qH(x)} = ${fr(X, N)}`), placeholder: 'Zähler' },
       { title: `${qH(y)} erweitern`, ask: `<p>Erweitere ${M(qH(y))} auf den Nenner ${N}. Wie heißt der neue Zähler?</p>`, answer: q(Y), hint: `${c} · ${N / d}`, explain: `${M(`${qH(y)} = ${fr(Y, N)}`)}. Jeder Bruch mit Nenner ${N} und Zähler zwischen ${X} und ${Y} liegt dazwischen.`, placeholder: 'Zähler' }],
      { label: qH(right) });
  }, () => true);
}
/** Gemischte Zahlen addieren oder subtrahieren. */
function mixAddTask(): Task | null {
  return genFrom(() => {
    const [n1, d1] = properFrac([2, 3, 4, 5, 6, 8]), [n2, d2] = properFrac([2, 3, 4, 5, 6, 8]), w1 = R(1, 5), w2 = R(1, 3), op = pick(['+', '−']);
    const A = q(w1 * d1 + n1, d1), Bv = q(w2 * d2 + n2, d2), res = op === '+' ? A.add(Bv) : A.sub(Bv);
    if (!q(1).lt(res) || res.isInt() || lcm(BigInt(d1), BigInt(d2)) > 24n) return null;
    const H = Number(lcm(BigInt(d1), BigInt(d2))), An = (Number(A.n) * H) / d1, Bn = (Number(Bv.n) * H) / d2, Z = op === '+' ? An + Bn : An - Bn;
    const mH = mixedH(res)!, shown = `${mixedH(A)} ${op} ${mixedH(Bv)}`;
    return task(`Berechne und schreibe das Ergebnis als gemischte Zahl: ${M(shown)}`, res, mH,
      [{ rule: 'Unechte Brüche', lines: [M(`${mixedH(A)} = ${qH(A)}`), M(`${mixedH(Bv)} = ${qH(Bv)}`)] },
       { rule: 'Gleicher Nenner', lines: [`Hauptnenner ${H}: ${M(`${qH(A)} ${op} ${qH(Bv)} = ${fr(An, H)} ${op} ${fr(Bn, H)} = ${fr(Z, H)}`)}`] },
       { rule: 'Gemischte Zahl', lines: [M(`${fr(Z, H)} = ${qH(res)} = ${mH}`)] }],
      [{ title: 'Erste Zahl', ask: `<p>Schreibe ${M(mixedH(A)!)} als unechten Bruch.</p>`, answer: A, hint: `${w1} · ${d1} + ${n1} ergibt den Zähler.`, explain: M(`${mixedH(A)} = ${qH(A)}`), placeholder: 'z. B. 7/3' },
       { title: 'Zweite Zahl', ask: `<p>Schreibe ${M(mixedH(Bv)!)} als unechten Bruch.</p>`, answer: Bv, hint: `${w2} · ${d2} + ${n2} ergibt den Zähler.`, explain: M(`${mixedH(Bv)} = ${qH(Bv)}`), placeholder: 'z. B. 7/3' },
       { title: 'Hauptnenner', ask: `<p>Welcher ist der Hauptnenner von ${d1} und ${d2}?</p>`, answer: q(H), hint: 'Die kleinste Zahl, in der beide Nenner aufgehen.', explain: `Hauptnenner ${H}.`, placeholder: 'Hauptnenner' },
       { title: op === '+' ? 'Addieren' : 'Subtrahieren', ask: `<p>Erweitere beide Brüche auf ${H} und rechne. Wie heißt der Zähler?</p><div class="math big">${fr(An, H)} ${op} ${fr(Bn, H)} = ${fracH('?', H)}</div>`, answer: q(Z), hint: 'Nur die Zähler rechnen, der Nenner bleibt.', explain: M(`${fr(An, H)} ${op} ${fr(Bn, H)} = ${fr(Z, H)}`), placeholder: 'Zähler' },
       { title: 'Gemischte Zahl', ask: `<p>Schreibe ${M(fr(Z, H))} als gemischte Zahl. Kürze, wenn es geht.</p>`, answer: res, hint: `${Z} : ${H} ergibt die Ganzen, der Rest ist der Zähler.`, explain: M(`${fr(Z, H)} = ${mH}`), placeholder: 'z. B. 3 1/4' }],
      { form: 'mixed', placeholder: 'z. B. 3 1/4', diag: v => (v.eq(q(op === '+' ? w1 + w2 : w1 - w2).add(q(op === '+' ? n1 + n2 : Math.abs(n1 - n2), d1 + d2))) ? 'Achtung: Nenner werden nie addiert! Mach erst gleiche Nenner.' : null) });
  }, () => true);
}

/* Brüche im Koordinatensystem (1. Quadrant, Einheit in d Teile geteilt) */
interface FP { x: Q; y: Q; label: string }
const cH = (v: Q) => mixedH(v) ?? qH(v.red());
/** k/d und, wenn anders geschrieben, die gekürzte oder gemischte Form */
const kd = (k: number, d: number) => { const a = fr(k, d), b = cH(q(k, d)); return a === b ? a : `${a} = ${b}`; };
const ptH = (x: Q, y: Q) => `(${cH(x)}&#8239;|&#8239;${cH(y)})`;
const DNAME: Record<number, string> = { 2: 'Halbe', 3: 'Drittel', 4: 'Viertel' };
function coordFracSVG(d: number, U: number, pts: FP[]): string {
  const s = 300 / U, X = (v: number) => v * s, Y = (v: number) => 300 - v * s;
  let g = '';
  for (let k = 0; k <= U * d; k++) {
    const v = k / d, whole = k % d === 0;
    const cls = k === 0 ? 'ax' : 'gl', st = whole && k ? ' style="stroke-width:2.2"' : '';
    g += `<line class="${cls}"${st} x1="${X(v)}" y1="0" x2="${X(v)}" y2="300" /><line class="${cls}"${st} x1="0" y1="${Y(v)}" x2="300" y2="${Y(v)}" />`;
    if (whole) g += `<text class="tk" x="${X(v)}" y="316" text-anchor="middle">${k / d}</text>${k ? `<text class="tk" x="-7" y="${Y(v) + 4}" text-anchor="end">${k / d}</text>` : ''}`;
  }
  g += `<text class="ax-l" x="304" y="296">x</text><text class="ax-l" x="6" y="-2">y</text>`;
  g += pts.map(p => `<g class="pt given"><circle cx="${X(num(p.x))}" cy="${Y(num(p.y))}" r="5" /><text x="${X(num(p.x)) + 7}" y="${Y(num(p.y)) - 7}">${p.label}</text></g>`).join('');
  return `<svg class="coord" viewBox="-26 -12 340 338" role="img" aria-label="Koordinatensystem von 0 bis ${U}, jede Einheit in ${d} Teile geteilt, mit den Punkten ${pts.map(p => p.label).join(', ')}">${g}</svg>`;
}
/** Vier Punkte: das Ziel, das Ziel mit vertauschten Koordinaten und zwei Nachbarn. */
function fracPoints(d: number, U: number): { pts: FP[]; t: number } | null {
  const M2 = U * d, kx = R(1, M2 - 1), ky = R(1, M2 - 1);
  if (kx % d === 0 && ky % d === 0) return null;
  if (kx === ky) return null;
  const raw: [number, number][] = [[kx, ky], [ky, kx], ...shuffle([[kx + 1, ky], [kx - 1, ky], [kx, ky + 1], [kx, ky - 1], [kx + d, ky], [kx, ky - d]] as [number, number][])];
  const keep: [number, number][] = [];
  for (const [a, b] of raw) {
    if (a < 1 || b < 1 || a > M2 || b > M2 || keep.some(([u, v]) => Math.abs(u - a) + Math.abs(v - b) < 1) || keep.length >= 4) continue;
    keep.push([a, b]);
  }
  if (keep.length < 4 || keep[1][0] !== ky) return null;
  const order = shuffle([0, 1, 2, 3]);
  const pts = order.map((i, j) => ({ x: q(keep[i][0], d).red(), y: q(keep[i][1], d).red(), label: LETTERS[j] }));
  return { pts, t: order.indexOf(0) };
}
function coordGuide(d: number, p: FP): GuideStep[] {
  const kx = Number(p.x.mul(q(d)).n), ky = Number(p.y.mul(q(d)).n);
  return [
    { title: 'Einteilung', ask: `<p>In wie viele gleiche Teile ist die Strecke von 0 bis 1 auf der x-Achse geteilt?</p>`, answer: q(d), hint: 'Zähle die Kästchen zwischen 0 und 1.', explain: `Ein Kästchen ist ${M(fr(1, d))} lang.`, placeholder: 'Anzahl' },
    { title: 'Nach rechts', ask: `<p>Die x-Koordinate zuerst: Wie viele Kästchen gehst du von 0 nach <b>rechts</b>, bis du bei ${M(cH(p.x))} bist?</p>`, answer: q(kx), hint: `${M(cH(p.x))} = ${M(fr(kx, d))}`, explain: `${M(`${cH(p.x)} = ${fr(kx, d)}`)}: ${kx} Kästchen nach rechts.`, placeholder: 'Anzahl' },
    { title: 'Nach oben', ask: `<p>Dann die y-Koordinate: Wie viele Kästchen gehst du nach <b>oben</b>, bis du bei ${M(cH(p.y))} bist?</p>`, answer: q(ky), hint: `${M(cH(p.y))} = ${M(fr(ky, d))}`, explain: `${M(`${cH(p.y)} = ${fr(ky, d)}`)}: ${ky} Kästchen nach oben. Dort liegt Punkt ${p.label}.`, placeholder: 'Anzahl' },
  ];
}
const coordSteps = (d: number, p: FP): ListSolution['steps'] => [
  { rule: 'Einteilung', lines: [`Jede Einheit ist in ${d} Teile geteilt. Ein Kästchen ist ${M(fr(1, d))}.`] },
  { rule: 'Ablesen', lines: [`Erst nach rechts (x), dann nach oben (y). Punkt ${p.label} liegt bei ${M(ptH(p.x, p.y))}.`, `x = ${M(kd(Number(p.x.mul(q(d)).n), d))}, y = ${M(kd(Number(p.y.mul(q(d)).n), d))}`] },
];
function coordWhich(level: number): Task | null {
  return genFrom(() => {
    const d = level === 2 ? pick([2, 4]) : pick([3, 4]), U = level === 2 ? 2 : pick([2, 3]);
    const r = fracPoints(d, U); if (!r) return null;
    const p = r.pts[r.t];
    return pickFrom(`Welcher Punkt hat die Koordinaten ${M(ptH(p.x, p.y))}?${coordFracSVG(d, U, r.pts)}`, r.pts.map(x => `Punkt ${x.label}`), r.t,
      coordSteps(d, p), coordGuide(d, p), { label: `Punkt ${p.label}` });
  }, () => true);
}
function coordRead(level: number): Task | null {
  return genFrom(() => {
    const d = level === 2 ? pick([2, 4]) : pick([3, 4]), U = level === 2 ? 2 : 3;
    const r = fracPoints(d, U); if (!r) return null;
    const p = r.pts[R(0, 3)], ax = Math.random() < 0.5 ? 'x' : 'y', v = ax === 'x' ? p.x : p.y, o = ax === 'x' ? p.y : p.x;
    if (v.isInt()) return null;
    const k = Number(v.mul(q(d)).n), g = coordGuide(d, p);
    const steps: GuideStep[] = [g[0], { ...g[ax === 'x' ? 1 : 2], ask: ax === 'x' ? '<p>Wie viele Kästchen liegt der Punkt rechts von der y-Achse?</p>' : '<p>Wie viele Kästchen liegt der Punkt über der x-Achse?</p>', hint: ax === 'x' ? 'Zähle von 0 aus nach rechts.' : 'Zähle von 0 aus nach oben.', explain: `${k} Kästchen, das sind ${M(fr(k, d))}.` },
      { title: `${ax}-Koordinate`, ask: `<p>${k} Kästchen, jedes ist ${M(fr(1, d))}. Wie heißt die ${ax}-Koordinate? Schreibe sie als Bruch oder gemischte Zahl.</p>`, answer: v, hint: `${k} ${DNAME[d]}`, explain: M(`${ax} = ${kd(k, d)}`), placeholder: 'z. B. 3/4' }];
    return task(`Gib die <b>${ax}-Koordinate</b> von Punkt ${p.label} an. Schreibe sie als Bruch oder gemischte Zahl.${coordFracSVG(d, U, r.pts)}`, v, cH(v), coordSteps(d, p), steps,
      { form: 'frac', placeholder: 'z. B. 3/4', diag: x => (x.eq(o) ? `Das ist die ${ax === 'x' ? 'y' : 'x'}-Koordinate. Die ${ax}-Koordinate liest du ${ax === 'x' ? 'nach rechts' : 'nach oben'} ab.` : x.eq(q(k)) ? `Das ist die Anzahl der Kästchen. Jedes Kästchen ist aber nur ${M(fr(1, d))} lang.` : x.eq(q(k, d + 1)) ? `Zähle die Kästchen zwischen 0 und 1, nicht die Striche. Es sind ${d}.` : null) });
  }, () => true);
}
function coordPickCoords(): Task | null {
  return genFrom(() => {
    const d = pick([3, 4]), U = pick([2, 3]);
    const r = fracPoints(d, U); if (!r) return null;
    const p = r.pts[r.t], one = q(1, d);
    const right = M(ptH(p.x, p.y));
    const wrong = uniq([M(ptH(p.y, p.x)), M(ptH(p.x.add(one), p.y)), M(ptH(p.x, p.y.sub(one))), M(ptH(q(Number(p.x.mul(q(d)).n), d + 1), q(Number(p.y.mul(q(d)).n), d + 1)))]).filter(s => s !== right && !s.includes('−') && !/\(0|&#8239;0\)/.test(s));
    if (wrong.length < 3) return null;
    return pickTask(`Welche Koordinaten hat Punkt ${p.label}?${coordFracSVG(d, U, r.pts)}`, right, wrong.slice(0, 3), coordSteps(d, p), coordGuide(d, p), { label: ptH(p.x, p.y) });
  }, () => true);
}
/** Zahlenstrahl: An einer Stelle stehen viele gleichwertige Brüche. */
function lineFracSVG(d: number, U: number, k: number): string {
  const W = 280, s = W / U, X = (v: number) => 10 + v * s;
  let g = `<line x1="4" y1="40" x2="${W + 18}" y2="40" stroke="currentColor" stroke-width="2" />`;
  for (let i = 0; i <= U * d; i++) {
    const whole = i % d === 0;
    g += `<line x1="${X(i / d)}" y1="${whole ? 30 : 34}" x2="${X(i / d)}" y2="${whole ? 50 : 46}" stroke="currentColor" stroke-width="${whole ? 2 : 1.3}" />`;
    if (whole) g += `<text x="${X(i / d)}" y="68" text-anchor="middle">${i / d}</text>`;
  }
  g += `<circle class="dot" cx="${X(k / d)}" cy="40" r="6" /><text x="${X(k / d)}" y="20" text-anchor="middle">?</text>`;
  return `<svg class="fig" viewBox="0 0 ${W + 24} 76" style="max-width:340px" role="img" aria-label="Zahlenstrahl von 0 bis ${U}, jede Einheit in ${d} Teile geteilt, ein Punkt ist markiert">${g}</svg>`;
}
function lineNot(level: number): Task | null {
  return genFrom(() => {
    const [n, d, U] = pick(level === 2 ? [[1, 2, 1], [1, 3, 1], [2, 3, 1], [1, 4, 1], [3, 4, 1], [2, 5, 1]] : [[3, 2, 2], [5, 4, 2], [2, 3, 1], [3, 4, 1], [3, 5, 1], [4, 3, 2]] as [number, number, number][]);
    const ks = shuffle([2, 3, 4, 5, 6]).slice(0, 3);
    const eqs = ks.map(k => `${n * k}/${d * k}`), k0 = pick(ks);
    const badC: [number, number][] = shuffle([[n * k0 + 1, d * k0], [n + k0, d + k0], [n * k0, d * k0 + 1], [n * k0 - 1, d * k0], [n * k0, d + k0]] as [number, number][]);
    const bad = badC.map(([a, b]) => `${a}/${b}`).find(s => { const [a, b] = s.split('/').map(Number); return a > 0 && !q(a, b).eq(q(n, d)) && !eqs.includes(s); });
    if (!bad) return null;
    const sh = (s: string) => { const [a, b] = s.split('/').map(Number); return M(fr(a, b)); };
    const rd = (s: string) => { const [a, b] = s.split('/').map(Number); return `${M(fr(a, b))} = ${M(qH(q(a, b).red()))}`; };
    const v = q(n, d), vH = cH(v);
    return pickTask(`An einer Stelle des Zahlenstrahls stehen viele Brüche. Welcher Bruch steht <b>nicht</b> an der markierten Stelle?${lineFracSVG(d, U, n)}`, sh(bad), eqs.map(sh),
      [{ rule: 'Ablesen', lines: [`Jede Einheit ist in ${d} Teile geteilt. Der Punkt liegt bei ${M(fr(n, d))}${mixedH(v) ? ` = ${M(vH)}` : ''}.`] },
       { rule: 'Kürzen', lines: [...[bad, ...eqs].map(rd), `Nur ${sh(bad)} ist nicht gleichwertig zu ${M(fr(n, d))}.`] }],
      [{ title: 'Ablesen', ask: `<p>Jede Einheit ist in ${d} Teile geteilt. Welcher Bruch mit dem Nenner ${d} steht an der markierten Stelle?</p>`, answer: v, needReduced: true, hint: `Zähle die Teile von 0 bis zum Punkt.`, explain: `Der Punkt liegt bei ${M(fr(n, d))}.`, placeholder: 'z. B. 1/2' },
       { title: 'Kürzen', ask: `<p>Kürze ${sh(bad)} vollständig. Welcher Bruch kommt heraus?</p>`, answer: q(...(bad.split('/').map(Number) as [number, number])).red(), needReduced: true, hint: 'Teile Zähler und Nenner durch ihren ggT.', explain: `${rd(bad)}. Das ist nicht ${M(fr(n, d))}. Alle anderen Brüche ergeben gekürzt ${M(fr(n, d))}: ${eqs.map(rd).join(', ')}.`, placeholder: 'z. B. 2/3' }],
      { label: sh(bad) });
  }, () => true);
}

const BRVGL: Topic = {
  id: 'brvgl', klasse: 6, title: 'Brüche vergleichen und ordnen', short: 'Brüche erweitern, vergleichen, ordnen und auf der Zahlengeraden und im Koordinatensystem finden.',
  exampleSol: () => { const t = vglTask(2); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Ein Bruch wie ${M(fr(3, 5))} heißt: Das Ganze wird in <b>5</b> gleiche Teile geteilt (Nenner), davon nimmst du <b>3</b> (Zähler).${stripSVG(3, 5)}</p>
    <p><b>Erweitern</b> heißt: Zähler und Nenner mit derselben Zahl malnehmen. Der Wert bleibt gleich, nur die Stücke werden kleiner: ${M(`${fr(3, 4)} = ${fracH('3 · 5', '4 · 5')} = ${fr(15, 20)}`)}.</p>
    <p><b>Vergleichen:</b> Haben zwei Brüche den gleichen Nenner, ist der mit dem größeren Zähler größer. Sonst machst du zuerst gleiche Nenner (Hauptnenner):</p>
    <p>${M(`${fr(2, 3)} &#9633; ${fr(3, 4)}`)}: Hauptnenner 12. ${M(`${fr(2, 3)} = ${fr(8, 12)}`)} und ${M(`${fr(3, 4)} = ${fr(9, 12)}`)}. Also ${M(`${fr(2, 3)} &lt; ${fr(3, 4)}`)}.</p>
    <p><b>Gemischte Zahlen</b> bestehen aus Ganzen und einem Bruch: ${M(`${mixedH(q(11, 4))} = ${fr(11, 4)}`)}, denn 2 Ganze sind 8 Viertel und 8 + 3 = 11.</p>
    <p><b>Zwischen</b> zwei Brüchen liegt immer noch ein Bruch. Erweitere so weit, bis zwischen den Zählern Platz ist: ${M(`${fr(1, 3)} = ${fr(4, 12)}`)} und ${M(`${fr(1, 2)} = ${fr(6, 12)}`)}. Dazwischen liegt ${M(fr(5, 12))}.</p>
    <p><b>An einer Stelle stehen viele Brüche:</b> ${M(fr(1, 2))}, ${M(fr(2, 4))}, ${M(fr(3, 6))} und ${M(fr(5, 10))} sind gleichwertig. Sie stehen auf dem Zahlenstrahl an derselben Stelle. ${M(fr(4, 6))} nicht, denn ${M(`${fr(4, 6)} = ${fr(2, 3)}`)}.${lineFracSVG(4, 1, 2)}</p>
    <p><b>Brüche im Koordinatensystem:</b> Ist jede Einheit in gleiche Teile geteilt, kannst du auch Brüche ablesen. Erst nach rechts (x), dann nach oben (y). Hier ist jede Einheit in 4 Teile geteilt. Ein Kästchen ist ${M(fr(1, 4))}. Punkt A liegt bei ${M(ptH(q(3, 4), q(5, 4)))}.${coordFracSVG(4, 2, [{ x: q(3, 4), y: q(5, 4), label: 'A' }])}</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Erweitern: Zähler und Nenner mit derselben Zahl mal.</li><li>Vergleichen: erst gleiche Nenner, dann die Zähler vergleichen.</li><li>Gemischte Zahl in unechten Bruch: Ganze mal Nenner, plus Zähler.</li><li>Nenner werden nie addiert.</li></ol></div>`,
  gen(level) {
    if (level === 1) return pick([readTask, () => erwTask(1), bildPick])();
    if (level === 2) return pick([() => vglTask(2), bruchLine, () => toImproper(2), () => toMixed(2), () => erwTask(2), () => coordRead(2), () => coordWhich(2), () => lineNot(2)])();
    return pick([ordTask, zwischenTask, mixAddTask, () => vglTask(3), () => coordWhich(3), () => coordRead(3), coordPickCoords, () => lineNot(3)])();
  },
  text: level => genFrom(() => {
    if (level === 4) {
      const k = R(0, 2);
      if (k === 0) {
        const [n1, d1] = properFrac([2, 4, 3]), [n2, d2] = properFrac([2, 3, 4]), w1 = R(1, 3), w2 = R(1, 2), A = q(w1 * d1 + n1, d1), Bv = q(w2 * d2 + n2, d2);
        if (d1 === d2) return null;
        const t = wordTask({
          prompt: `Für ein Brot braucht Oma ${mixedH(A)} kg Mehl, für einen Kuchen ${mixedH(Bv)} kg Mehl. Wie viel Mehl braucht sie zusammen?`,
          steps: [
            { title: 'Brot', ask: `Schreibe ${mixedH(A)} als unechten Bruch.`, calc: `${w1} + ${n1}/${d1}`, unit: 'kg' },
            { title: 'Kuchen', ask: `Schreibe ${mixedH(Bv)} als unechten Bruch.`, calc: `${w2} + ${n2}/${d2}`, unit: 'kg' },
            { title: 'Zusammen', ask: 'Wie viel Mehl ist das zusammen? Mach erst gleiche Nenner.', calc: `${A.n}/${A.d} + ${Bv.n}/${Bv.d}`, wrong: [`${A.n}/${A.d} − ${Bv.n}/${Bv.d}`], why: 'Zusammen heißt plus.', unit: 'kg' },
          ],
          unit: 'kg', sentence: () => `Oma braucht zusammen ${mixedH(A.add(Bv)) ?? qH(A.add(Bv))} kg Mehl.`,
        });
        return t;
      }
      if (k === 1) {
        const [a, b] = properFrac([3, 4, 5, 6, 8]), [c, d] = properFrac([3, 4, 5, 6, 8]), x = q(a, b), y = q(c, d);
        if (b === d || x.eq(y)) return null;
        const P: [string, number, number][] = [['Mia', a, b], ['Ben', c, d]], [lo, hi] = x.lt(y) ? P : [P[1], P[0]];
        const H = Number(lcm(BigInt(b), BigInt(d)));
        const t = wordTask({
          prompt: `Mia läuft ${fr(a, b)} km, Ben läuft ${fr(c, d)} km. Wer läuft weiter? Um wie viele Kilometer?`,
          steps: [
            { title: 'Hauptnenner', ask: `Welcher ist der Hauptnenner von ${b} und ${d}?`, calc: String(H), explain: `Hauptnenner ${H}.` },
            { title: 'Mia', ask: `Erweitere Mias Strecke auf ${H}. Wie heißt der Zähler?`, calc: `${a} · ${H / b}`, explain: M(`${fr(a, b)} = ${fr((a * H) / b, H)}`) },
            { title: 'Ben', ask: `Erweitere Bens Strecke auf ${H}. Wie heißt der Zähler?`, calc: `${c} · ${H / d}`, explain: M(`${fr(c, d)} = ${fr((c * H) / d, H)}`) },
            { title: 'Unterschied', ask: `Um wie viele Kilometer läuft ${hi[0]} weiter?`, calc: `${hi[1]}/${hi[2]} − ${lo[1]}/${lo[2]}`, wrong: [`${hi[1]}/${hi[2]} + ${lo[1]}/${lo[2]}`], why: 'Um wie viel weiter: größere minus kleinere Strecke.', unit: 'km' },
          ],
          unit: 'km', sentence: v => `${hi[0]} läuft weiter, und zwar ${v} mehr.`,
        });
        t.guide[3].choose = { ask: 'Wer läuft weiter?', options: shuffle(opts(hi[0], [lo[0]])), why: `${M(fr((hi[1] * H) / hi[2], H))} ist mehr als ${M(fr((lo[1] * H) / lo[2], H))}.` };
        return t;
      }
      const [a, b] = properFrac([3, 4, 6, 8]), [c, d] = properFrac([3, 4, 6, 8]);
      if (b === d || !q(a, b).lt(q(c, d)) || !q(a, b).add(q(c, d)).lt(q(1))) return null;
      const t = wordTask({
        prompt: `Lena isst ${fr(a, b)} einer Pizza, Tom isst ${fr(c, d)} derselben Pizza. Tom hat mehr gegessen. Wie viel mehr? Wie viel von der Pizza bleibt übrig?`,
        steps: [
          { title: 'Wie viel mehr', ask: 'Wie viel mehr hat Tom gegessen?', calc: `${c}/${d} − ${a}/${b}`, wrong: [`${c}/${d} + ${a}/${b}`], why: 'Wie viel mehr: Unterschied, also minus.' },
          { title: 'Zusammen gegessen', ask: 'Wie viel haben beide zusammen gegessen?', calc: `${a}/${b} + ${c}/${d}`, wrong: [`${c}/${d} − ${a}/${b}`], why: 'Zusammen heißt plus.' },
          { title: 'Rest', ask: 'Wie viel bleibt übrig? Die ganze Pizza ist 1.', calc: `1 − ${q(a, b).add(q(c, d)).n}/${q(a, b).add(q(c, d)).d}`, wrong: [`1 + ${q(a, b).add(q(c, d)).n}/${q(a, b).add(q(c, d)).d}`], why: 'Vom Ganzen wird das Gegessene abgezogen.' },
        ],
        sentence: v => `Tom hat ${qH(q(c, d).sub(q(a, b)))} der Pizza mehr gegessen. Übrig bleibt ${v} der Pizza.`,
      });
      return t;
    }
    const k = R(0, 2);
    if (k === 0) {
      const ds = shuffle([3, 4, 6, 8, 12]).slice(0, 3), fs = ds.map(d => { let n: number; do n = R(1, d - 1); while (!q(n, d).isRed()); return q(n, d); });
      const sum = fs.reduce((x, y) => x.add(y), q(0));
      if (!sum.lt(q(1)) || new Set(fs.map(f => f.txt())).size < 3) return null;
      const names = ['Anna', 'Jonas', 'Ella'], max = fs.reduce((m, f, i) => (fs[m].lt(f) ? i : m), 0);
      const t = wordTask({
        prompt: `Anna, Jonas und Ella teilen sich ein Blech Pizza. Anna isst ${qH(fs[0])}, Jonas ${qH(fs[1])} und Ella ${qH(fs[2])} vom Blech. Wer isst am meisten? Wie viel bleibt übrig?`,
        steps: [
          { title: 'Hauptnenner', ask: `Welcher ist der Hauptnenner von ${ds.join(', ')}?`, calc: String(ds.reduce((m, d) => Number(lcm(BigInt(m), BigInt(d))), 1)) },
          { title: 'Zusammen gegessen', ask: 'Wie viel haben alle drei zusammen gegessen?', calc: fs.map(f => f.txt()).join(' + '), wrong: [`1 − ${fs[0].txt()}`], why: 'Zusammen heißt plus.' },
          { title: 'Rest', ask: 'Wie viel vom Blech bleibt übrig?', calc: `1 − ${sum.txt()}`, wrong: [`${sum.txt()} − 1`], why: 'Das ganze Blech ist 1. Davon ziehst du ab, was gegessen wurde.' },
        ],
        sentence: v => `${names[max]} isst am meisten. Übrig bleibt ${v} vom Blech.`,
      });
      t.guide[1].choose = { ask: 'Wer isst am meisten?', options: shuffle(opts(names[max], names.filter((_, i) => i !== max))), why: `Mit dem Hauptnenner siehst du es: ${fs.map((f, i) => `${names[i]} ${qH(f)}`).join(', ')}. ${names[max]} hat den größten Anteil.` };
      return t;
    }
    if (k === 1) {
      const [n0, d0] = properFrac([2, 4]), [n1, d1] = properFrac([2, 3, 4]), [n2, d2] = properFrac([2, 3, 4]), w0 = R(3, 5), w1 = R(1, 2);
      const T = q(w0 * d0 + n0, d0), A = q(w1 * d1 + n1, d1), Bv = q(n2, d2), used = A.add(Bv);
      if (!used.lt(T) || T.sub(used).isZero()) return null;
      return wordTask({
        prompt: `Lisa hat ${mixedH(T)} kg Mehl. Für ein Brot braucht sie ${mixedH(A)} kg, für Waffeln ${qH(Bv)} kg. Wie viel Mehl bleibt übrig?`,
        steps: [
          { title: 'Verbraucht', ask: 'Wie viel Mehl braucht sie zusammen?', calc: `${A.n}/${A.d} + ${Bv.n}/${Bv.d}`, wrong: [`${A.n}/${A.d} − ${Bv.n}/${Bv.d}`], why: 'Brot und Waffeln zusammen: plus.', unit: 'kg' },
          { title: 'Übrig', ask: 'Wie viel Mehl bleibt übrig?', calc: `${T.n}/${T.d} − ${used.n}/${used.d}`, wrong: [`${T.n}/${T.d} + ${used.n}/${used.d}`], why: 'Was übrig bleibt: alles minus verbraucht.', unit: 'kg' },
        ],
        unit: 'kg', sentence: () => `Es bleiben ${mixedH(T.sub(used)) ?? qH(T.sub(used))} kg Mehl übrig.`,
      });
    }
    const days = Array.from({ length: 3 }, () => { const [n, d] = properFrac([2, 3, 4]); return q(R(1, 2) * d + n, d); });
    const sum = days.reduce((x, y) => x.add(y), q(0)), ben = q(R(4, 7));
    if (sum.eq(ben)) return null;
    const miaMore = ben.lt(sum), diff = miaMore ? sum.sub(ben) : ben.sub(sum);
    const t = wordTask({
      prompt: `Mia läuft an drei Tagen ${days.map(x => mixedH(x)).join(' km, ')} km. Ben läuft an diesen Tagen zusammen ${ben.n} km. Wer ist insgesamt weiter gelaufen? Um wie viele Kilometer?`,
      steps: [
        { title: 'Mia zusammen', ask: 'Wie viele Kilometer läuft Mia zusammen? Rechne mit unechten Brüchen.', calc: days.map(x => x.txt()).join(' + '), unit: 'km' },
        { title: 'Unterschied', ask: 'Um wie viele Kilometer ist der eine weiter gelaufen als der andere?', calc: miaMore ? `${sum.txt()} − ${ben.n}` : `${ben.n} − ${sum.txt()}`, wrong: [miaMore ? `${ben.n} − ${sum.txt()}` : `${sum.txt()} − ${ben.n}`], why: 'Größere minus kleinere Strecke, damit es positiv bleibt.', unit: 'km' },
      ],
      unit: 'km', sentence: () => `${miaMore ? 'Mia' : 'Ben'} ist weiter gelaufen, und zwar ${mixedH(diff) ?? qH(diff)} km.`,
    });
    t.guide[1].choose = { ask: 'Wer ist weiter gelaufen?', options: shuffle(opts(miaMore ? 'Mia' : 'Ben', [miaMore ? 'Ben' : 'Mia'])), why: `Mia: ${mixedH(sum) ?? qH(sum)} km, Ben: ${ben.n} km.` };
    return t;
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

/* ======================================================================
   2. Bruch, Dezimalzahl und Prozent
   ====================================================================== */
const HUND: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [9, 20], [11, 20], [13, 20], [1, 25], [4, 25], [6, 25], [12, 25], [7, 50], [3, 50], [21, 50]];
const TERM: [number, number][] = [...HUND, [1, 8], [3, 8], [5, 8], [7, 8], [3, 40], [9, 40], [1, 16], [3, 16], [3, 125]];
const tenPow = (d: number) => { let T = 1; while (T % d) T *= 10; return T; };
const zeros = (T: number) => String(T).length - 1;

function zehnerToDec(): Task {
  const k = R(1, 3), T = 10 ** k;
  let n: number; do n = R(1, k === 1 ? 99 : k === 2 ? 999 : 9999); while (n % 10 === 0);
  const v = q(n, T);
  return task(`Schreibe als Dezimalzahl: ${M(fr(n, T))}`, v, dH(v),
    [{ rule: 'Nullen zählen', lines: [`Der Nenner ${T} hat ${k} ${k === 1 ? 'Null' : 'Nullen'}. Also hat die Dezimalzahl ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach dem Komma.`] }, { rule: 'Dezimalzahl', lines: [M(`${fr(n, T)} = ${dH(v)}`)] }],
    [{ title: 'Nullen zählen', ask: `<p>Wie viele Nullen hat der Nenner ${T}?</p>`, answer: q(k), hint: 'So viele Stellen hat die Zahl nach dem Komma.', explain: `${k} Nullen, also ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach dem Komma.`, placeholder: 'Anzahl' },
     { title: 'Dezimalzahl', ask: `<p>Schreibe den Zähler ${n} so, dass ${k} Ziffern hinter dem Komma stehen. Fehlen Ziffern, füllst du vorne mit 0 auf.</p>`, answer: v, hint: `Die letzte Ziffer von ${n} steht an der ${['', 'Zehntel', 'Hundertstel', 'Tausendstel'][k]}stelle.`, explain: M(`${fr(n, T)} = ${dH(v)}`), placeholder: 'z. B. 0,37' }],
    { form: 'dec', placeholder: 'z. B. 0,37', diag: x => ([10, 100].some(f => x.eq(v.mul(q(f))) || x.eq(v.div(q(f)))) ? 'Die Ziffern stimmen, aber das <b>Komma</b> steht falsch. Der Nenner hat so viele Nullen, wie Stellen nach dem Komma stehen.' : null) });
}
function decToZehner(): Task {
  const k = R(1, 3), T = 10 ** k;
  let n: number; do n = R(1, k === 1 ? 29 : k === 2 ? 299 : 1999); while (n % 10 === 0);
  const v = q(n, T);
  return task(`Schreibe ${M(dH(v))} als Zehnerbruch (Nenner 10, 100 oder 1000).`, v, fr(n, T),
    [{ rule: 'Stellen zählen', lines: [`${dH(v)} hat ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach dem Komma, also ist der Nenner ${T}.`] }, { rule: 'Zehnerbruch', lines: [M(`${dH(v)} = ${fr(n, T)}`)] }],
    [{ title: 'Stellen zählen', ask: `<p>Wie viele Stellen hat ${M(dH(v))} nach dem Komma?</p>`, answer: q(k), hint: 'Zähle die Ziffern rechts vom Komma.', explain: `${k} ${k === 1 ? 'Stelle' : 'Stellen'}.`, placeholder: 'Anzahl' },
     { title: 'Nenner', ask: `<p>Welcher Nenner gehört dazu? Eine 1 mit ${k} ${k === 1 ? 'Null' : 'Nullen'}.</p>`, answer: q(T), hint: '1 Stelle: 10, 2 Stellen: 100, 3 Stellen: 1000.', explain: `Nenner ${T}.`, placeholder: 'Nenner' },
     { title: 'Zähler', ask: `<p>Lass das Komma weg. Welche Zahl wird der Zähler?</p>`, answer: q(n), hint: 'Nullen ganz vorne fallen weg.', explain: `Zähler ${n}.`, placeholder: 'Zähler' },
     { title: 'Zehnerbruch', ask: `<p>Wie heißt der Zehnerbruch?</p>`, answer: v, hint: `${n}/${T}`, explain: M(`${dH(v)} = ${fr(n, T)}`), placeholder: 'z. B. 37/100' }],
    { form: 'frac', placeholder: 'z. B. 37/100', diag: x => ([10, 100].some(f => x.eq(v.mul(q(f))) || x.eq(v.div(q(f)))) ? 'Der Nenner passt nicht. So viele Stellen nach dem Komma, so viele Nullen im Nenner.' : null) });
}
function prozHund(): Task {
  const p = R(1, 99);
  if (Math.random() < 0.5) return task(`Schreibe als Hundertstelbruch: ${M(`${p} % = ${fracH('?', 100)}`)}. Welche Zahl gehört in den Zähler?`, q(p), String(p),
    [{ rule: 'Prozent heißt Hundertstel', lines: [M(`${p} % = ${fr(p, 100)}`)] }],
    [{ title: 'Hundertstel', ask: `<p>„Prozent“ heißt „von Hundert“. ${p} % sind also wie viele Hundertstel?</p>`, answer: q(p), hint: 'Die Prozentzahl wird der Zähler, 100 der Nenner.', explain: M(`${p} % = ${fr(p, 100)}`), placeholder: 'Zähler' }], { placeholder: 'Zähler' });
  return task(`Wie viel Prozent sind ${M(fr(p, 100))}?`, q(p), `${p} %`,
    [{ rule: 'Hundertstel heißt Prozent', lines: [M(`${fr(p, 100)} = ${p} %`)] }],
    [{ title: 'Prozent', ask: `<p>1 Hundertstel ist 1 %. Wie viel Prozent sind ${p} Hundertstel?</p>`, answer: q(p), hint: 'Der Zähler ist die Prozentzahl.', explain: M(`${fr(p, 100)} = ${p} %`), placeholder: 'Antwort in %' }], { placeholder: 'Antwort in %' });
}
function erwDec(): Task {
  const [n, d] = pick(TERM.filter(([, d]) => d !== 10)), T = tenPow(d), k = T / d, v = q(n, d);
  return task(`Schreibe ${M(fr(n, d))} als Dezimalzahl. Erweitere dafür auf 10, 100 oder 1000.`, v, dH(v),
    [{ rule: 'Zehnernenner suchen', lines: [`${d} · ${k} = ${T}`] }, { rule: 'Erweitern', lines: [M(`${fr(n, d)} = ${fracH(`${n} · ${k}`, `${d} · ${k}`)} = ${fr(n * k, T)}`)] }, { rule: 'Dezimalzahl', lines: [M(`${fr(n * k, T)} = ${dH(v)}`)] }],
    [{ title: 'Zehnernenner', ask: `<p>Welcher Nenner 10, 100 oder 1000 ist der kleinste, in dem ${d} aufgeht?</p>`, answer: q(T), hint: `Probiere: Geht ${d} in 10? In 100? In 1000?`, explain: `${d} geht in ${T}.`, placeholder: '10, 100 oder 1000' },
     { title: 'Erweiterungszahl', ask: `<p>Mit welcher Zahl erweiterst du?</p><div class="math big">${d} · ? = ${T}</div>`, answer: q(k), hint: `${T} : ${d}`, explain: `Erweitern mit ${k}.`, placeholder: 'Zahl' },
     { title: 'Neuer Zähler', ask: `<p>Wie heißt der neue Zähler?</p><div class="math big">${n} · ${k} = ?</div>`, answer: q(n * k), hint: 'Zähler mal dieselbe Zahl.', explain: M(`${fr(n, d)} = ${fr(n * k, T)}`), placeholder: 'Zähler' },
     { title: 'Dezimalzahl', ask: `<p>Schreibe ${M(fr(n * k, T))} als Dezimalzahl.</p>`, answer: v, hint: `${zeros(T)} ${zeros(T) === 1 ? 'Stelle' : 'Stellen'} nach dem Komma.`, explain: M(`${fr(n, d)} = ${dH(v)}`), placeholder: 'z. B. 0,75' }],
    { form: 'dec', placeholder: 'z. B. 0,75', diag: x => (x.eq(q(n * 10 ** String(d).length + d, 10 ** String(d).length)) ? 'Ein Bruch ist nicht „Zähler Komma Nenner“. Erweitere auf 10, 100 oder 1000.' : null) });
}
function decToRed(): Task {
  const [n, d] = pick(TERM.filter(([, d]) => d !== 10 && d !== 125)), T = tenPow(d), N = (n * T) / d, g = T / d, v = q(n, d);
  return task(`Schreibe ${M(dH(v))} als <b>vollständig gekürzten</b> Bruch.`, v, fr(n, d),
    [{ rule: 'Zehnerbruch', lines: [M(`${dH(v)} = ${fr(N, T)}`)] }, { rule: 'Kürzen', lines: [`Der ggT von ${N} und ${T} ist ${g}.`, M(`${fr(N, T)} = ${fracH(`${N} : ${g}`, `${T} : ${g}`)} = ${fr(n, d)}`)] }],
    [{ title: 'Zehnerbruch', ask: `<p>Schreibe ${M(dH(v))} zuerst als Zehnerbruch mit dem Nenner ${T}. Wie heißt der Zähler?</p>`, answer: q(N), hint: 'Lass das Komma weg.', explain: M(`${dH(v)} = ${fr(N, T)}`), placeholder: 'Zähler' },
     { title: 'ggT', ask: `<p>Was ist die größte Zahl, durch die ${N} und ${T} beide teilbar sind?</p>`, answer: q(g), hint: `Probiere 2, 4, 5, 25, …`, explain: `ggT = ${g}`, placeholder: 'ggT' },
     { title: 'Kürzen', ask: `<p>Kürze ${M(fr(N, T))} durch ${g}.</p>`, answer: v, needReduced: true, hint: `${N} : ${g} und ${T} : ${g}`, explain: M(`${fr(N, T)} = ${fr(n, d)}`), placeholder: 'z. B. 3/4' }],
    { form: 'frac', needReduced: true, placeholder: 'z. B. 3/4' });
}
function bruchProz(): Task {
  const [n, d] = pick(HUND), k = 100 / d, p = n * k, v = q(n, d);
  if (Math.random() < 0.5) return task(`Wie viel Prozent sind ${M(fr(n, d))}?`, q(p), `${p} %`,
    [{ rule: 'Auf Hundertstel erweitern', lines: [M(`${fr(n, d)} = ${fracH(`${n} · ${k}`, `${d} · ${k}`)} = ${fr(p, 100)}`)] }, { rule: 'Prozent', lines: [M(`${fr(p, 100)} = ${p} %`)] }],
    [...(k > 1 ? [{ title: 'Erweiterungszahl', ask: `<p>Mit welcher Zahl erweiterst du ${M(fr(n, d))}, damit der Nenner 100 wird?</p>`, answer: q(k), hint: `100 : ${d}`, explain: `${d} · ${k} = 100`, placeholder: 'Zahl' }] : []),
     { title: 'Prozent', ask: `<p>Wie heißt der Zähler über 100? Das ist die Prozentzahl.</p><div class="math big">${n} · ${k} = ?</div>`, answer: q(p), hint: 'Zähler mal dieselbe Zahl.', explain: M(`${fr(n, d)} = ${fr(p, 100)} = ${p} %`), placeholder: 'Antwort in %' }],
    { placeholder: 'Antwort in %', diag: x => (x.eq(v) ? 'Das ist der Anteil als Zahl. In Prozent musst du noch mal 100 rechnen.' : null) });
  const g = 100 / d;
  return task(`Schreibe ${M(`${p} %`)} als vollständig gekürzten Bruch.`, v, fr(n, d),
    [{ rule: 'Hundertstel', lines: [M(`${p} % = ${fr(p, 100)}`)] }, { rule: 'Kürzen', lines: [`ggT von ${p} und 100 ist ${g}.`, M(`${fr(p, 100)} = ${fr(n, d)}`)] }],
    [{ title: 'Hundertstel', ask: `<p>${p} % sind wie viele Hundertstel?</p>`, answer: q(p), hint: 'Prozent heißt Hundertstel.', explain: M(`${p} % = ${fr(p, 100)}`), placeholder: 'Zähler' },
     { title: 'ggT', ask: `<p>Was ist der ggT von ${p} und 100?</p>`, answer: q(g), hint: 'Die größte Zahl, die beide teilt.', explain: `ggT = ${g}`, placeholder: 'ggT' },
     { title: 'Kürzen', ask: `<p>Kürze ${M(fr(p, 100))} durch ${g}.</p>`, answer: v, needReduced: true, hint: `${p} : ${g} und 100 : ${g}`, explain: M(`${fr(p, 100)} = ${fr(n, d)}`), placeholder: 'z. B. 2/5' }],
    { form: 'frac', needReduced: true, placeholder: 'z. B. 2/5' });
}
function periodPick(): Task {
  for (;;) {
    const [n, d] = pick(PER_FR), L = longDiv(n, d), right = perH(n, d);
    const flat = `${L.int},${L.digits.join('')}`;
    const allBar = `${L.int},<span class="per">${L.digits.join('')}</span>`;
    const others = PER_FR.filter(([a, b]) => b === d && a !== n).map(([a, b]) => perH(a, b));
    const swap = q(d, n).terminating() ? sg(q(d, n).toDec()) : '';
    const wrong = uniq([flat, ...(L.pre > 0 ? [allBar] : []), ...shuffle(others).slice(0, 1), ...(swap ? [swap] : [])]).filter(s => s && s !== right);
    if (wrong.length < 2) continue;
    const show = L.digits.length + 1;
    const g: GuideStep[] = [];
    let r = n;
    for (let i = 0; i < show; i++) {
      const dg = Math.floor((10 * r) / d), nr = (10 * r) % d;
      g.push({ title: `${i + 1}. Stelle nach dem Komma`, ask: `<p>Rechne ${n} : ${d} schriftlich. Jetzt teilst du ${10 * r} durch ${d}. Welche Ziffer schreibst du?</p>`, answer: q(dg), hint: `Wie oft passt ${d} in ${10 * r}?`, explain: `${10 * r} : ${d} = ${dg} Rest ${nr}${i === show - 1 ? '. Dieser Rest war schon einmal da. Ab jetzt wiederholt sich alles!' : ''}`, placeholder: 'Ziffer' });
      r = nr;
    }
    return pickTask(`Welche Dezimalzahl ist ${M(fr(n, d))}? Der Strich über Ziffern heißt: Diese Ziffern wiederholen sich immer weiter.`, M(right), wrong.slice(0, 3).map(M),
      [{ rule: 'Schriftlich teilen', lines: [`${n} : ${d} = ${L.int},${L.digits.join('')}${L.digits.slice(L.pre).join('')}…`, 'Ein Rest kommt zum zweiten Mal vor. Ab da wiederholen sich die Ziffern.'] }, { rule: 'Periode', lines: [M(`${fr(n, d)} = ${right}`)] }], g, { label: right });
  }
}
function abbrPick(): Task {
  const T = Math.random() < 0.5;
  for (;;) {
    const d = T ? pick([8, 16, 20, 25, 40, 50, 32, 80]) : pick([6, 7, 9, 11, 12, 14, 15, 18, 24, 30]);
    const n = R(1, d - 1);
    if (!q(n, d).isRed()) continue;
    const f = factors(d), fac = f.join(' · '), big = Math.max(...f), bad = f.find(p => p !== 2 && p !== 5);
    const only = [...new Set(f)].join(' und ');
    const right = T ? `abbrechend, weil der Nenner ${d} = ${fac} nur ${new Set(f).size > 1 ? 'die Primfaktoren' : 'den Primfaktor'} ${only} hat` : `periodisch, weil der Nenner ${d} = ${fac} den Primfaktor ${bad} hat`;
    const wrong = T
      ? [`periodisch, weil ${n} : ${d} nicht aufgeht`, `periodisch, weil der Nenner ${d} keine Zehnerzahl ist`, `abbrechend, weil der Zähler kleiner als der Nenner ist`]
      : [`abbrechend, weil man ${n} : ${d} schriftlich rechnen kann`, `abbrechend, weil der Nenner ${d} ${d % 2 === 0 ? 'gerade' : 'kleiner als 100'} ist`, `periodisch, weil der Zähler kleiner als der Nenner ist`];
    return pickTask(`Ist die Dezimalzahl von ${M(fr(n, d))} <b>abbrechend</b> oder <b>periodisch</b>? Welche Antwort mit Begründung stimmt?`, right, wrong,
      [{ rule: 'Nenner zerlegen', lines: [`Der Bruch ist vollständig gekürzt. Nenner: ${d} = ${fac}`] }, { rule: 'Entscheiden', lines: [T ? `Nur 2 und 5: Man kann auf 10, 100, 1000 … erweitern. Die Dezimalzahl bricht ab: ${M(`${fr(n, d)} = ${dH(q(n, d))}`)}.` : `Der Primfaktor ${bad} steckt in keiner Zehnerzahl. Die Dezimalzahl ist periodisch: ${M(`${fr(n, d)} = ${perH(n, d)}`)}.`] }],
      [{ title: 'Primfaktoren', ask: `<p>Zerlege den Nenner ${d} in Primfaktoren. Welches ist der <b>größte</b> Primfaktor?</p>`, answer: q(big), hint: `Teile ${d} so lange durch 2, 3, 5, 7, … wie es geht.`, explain: `${d} = ${fac}. ${T ? 'Nur 2 und 5 kommen vor.' : `Die ${bad} ist weder 2 noch 5.`} Zehnerzahlen 10, 100, 1000 … haben nur die Primfaktoren 2 und 5.`, placeholder: 'Primfaktor' }],
      { label: right });
  }
}
function mixOrder(): Task | null {
  return genFrom(() => {
    const [n, d] = pick(HUND.filter(([n, d]) => n / d >= 0.15 && n / d <= 0.9)), vf = (n * 100) / d;
    const vd = vf + pick([-1, 1]) * R(1, 8), vp = vf + pick([-1, 1]) * R(1, 8);
    if (new Set([vf, vd, vp]).size < 3 || Math.min(vd, vp) < 5 || Math.max(vd, vp) > 99) return null;
    const items = [{ v: vf, h: fr(n, d) }, { v: vd, h: dH(q(vd, 100)) }, { v: vp, h: `${vp} %` }];
    const show = (o: typeof items) => M(o.map(x => x.h).join(' &lt; '));
    const asc = [...items].sort((a, b) => a.v - b.v);
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(p => show(p.map(i => items[i]))).filter(s => s !== show(asc));
    return pickTask(`Ordne die Zahlen der Größe nach. Fang mit der <b>kleinsten</b> an.<div class="math big">${shuffle(items).map(x => x.h).join(' ; ')}</div>`, show(asc), shuffle(perms).slice(0, 3),
      [{ rule: 'Gleiche Schreibweise', lines: [`Schreibe alle als Dezimalzahl: ${items.map(x => `${x.h} = ${dH(q(x.v, 100))}`).join(', ')}`] }, { rule: 'Ordnen', lines: [show(asc)] }],
      [{ title: 'Bruch umwandeln', ask: `<p>Schreibe ${M(fr(n, d))} als Dezimalzahl.</p>`, answer: q(n, d), hint: 'Erweitere auf den Nenner 100.', explain: M(`${fr(n, d)} = ${fr(vf, 100)} = ${dH(q(n, d))}`), placeholder: 'z. B. 0,75' },
       { title: 'Prozent umwandeln', ask: `<p>Schreibe ${M(`${vp} %`)} als Dezimalzahl.</p>`, answer: q(vp, 100), hint: 'Prozent heißt Hundertstel.', explain: M(`${vp} % = ${fr(vp, 100)} = ${dH(q(vp, 100))}`), placeholder: 'z. B. 0,72' }],
      { label: show(asc) });
  }, () => true);
}
function divDec(): Task {
  const d = pick([8, 8, 16, 40]);
  let n: number; do n = R(1, d - 1); while (!q(n, d).isRed());
  const v = q(n, d), L = longDiv(n, d), g: GuideStep[] = [];
  let r = n;
  for (const dg of L.digits) {
    const nr = (10 * r) % d;
    g.push({ title: `Ziffer ${g.length + 1}`, ask: `<p>${g.length ? 'Hänge eine 0 an den Rest.' : `${n} : ${d} = 0, … Hänge eine 0 an.`} Rechne ${10 * r} : ${d}. Welche Ziffer kommt als Nächstes?</p>`, answer: q(dg), hint: `Wie oft passt ${d} in ${10 * r}?`, explain: `${10 * r} : ${d} = ${dg} Rest ${nr}`, placeholder: 'Ziffer' });
    r = nr;
  }
  g.push({ title: 'Dezimalzahl', ask: '<p>Der Rest ist 0, die Rechnung ist fertig. Wie heißt die Dezimalzahl?</p>', answer: v, hint: `0, dann die Ziffern ${L.digits.join(', ')}`, explain: M(`${fr(n, d)} = ${dH(v)}`), placeholder: 'z. B. 0,375' });
  let rr = n;
  const lines = L.digits.map(dg => { const s = `${10 * rr} : ${d} = ${dg} Rest ${(10 * rr) % d}`; rr = (10 * rr) % d; return s; });
  return task(`Schreibe ${M(fr(n, d))} als Dezimalzahl. Rechne ${M(`${n} : ${d}`)} schriftlich.`, v, dH(v),
    [{ rule: 'Schriftlich teilen', lines: [`${n} : ${d} = 0, … (${d} passt 0-mal in ${n})`, ...lines] }, { rule: 'Ergebnis', lines: [M(`${fr(n, d)} = ${dH(v)}`)] }], g,
    { form: 'dec', placeholder: 'z. B. 0,375' });
}

const UMW: Topic = {
  id: 'umw', klasse: 6, title: 'Bruch, Dezimalzahl und Prozent', short: 'Dieselbe Zahl in drei Schreibweisen: 3/4 = 0,75 = 75 %.',
  exampleSol: () => { const t = erwDec(); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Viele Zahlen kannst du auf drei Arten schreiben: als <b>Bruch</b>, als <b>Dezimalzahl</b> und in <b>Prozent</b>. ${M(`${fr(3, 4)} = 0,75 = 75 %`)}</p>
    <p><b>Zehnerbrüche</b> haben den Nenner 10, 100, 1000 … Die Nullen im Nenner sagen, wie viele Stellen nach dem Komma stehen: ${M(`${fr(37, 100)} = 0,37`)}, ${M(`${fr(7, 1000)} = 0,007`)}.</p>
    <p><b>Bruch → Dezimalzahl:</b> Erweitere auf 10, 100 oder 1000: ${M(`${fr(3, 4)} = ${fr(75, 100)} = 0,75`)}. Oder teile schriftlich: ${M('3 : 8 = 0,375')}.</p>
    <p><b>Dezimalzahl → Bruch:</b> Zehnerbruch schreiben und kürzen: ${M(`0,35 = ${fr(35, 100)} = ${fr(7, 20)}`)}.</p>
    <p><b>Prozent</b> heißt „von Hundert“: ${M(`45 % = ${fr(45, 100)} = 0,45`)}.</p>
    <p>Manche Brüche geben eine <b>periodische</b> Dezimalzahl. Die Ziffern wiederholen sich immer weiter. Man schreibt einen Strich darüber: ${M(`${fr(1, 3)} = ${perH(1, 3)}`)}, ${M(`${fr(1, 6)} = ${perH(1, 6)}`)}.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Nullen im Nenner = Stellen nach dem Komma.</li><li>Prozent = Hundertstel.</li><li>Ein gekürzter Bruch gibt eine <b>abbrechende</b> Dezimalzahl, wenn der Nenner nur die Primfaktoren 2 und 5 hat. Sonst ist sie <b>periodisch</b>.</li><li>Zum Vergleichen alles in dieselbe Schreibweise bringen.</li></ol></div>`,
  gen(level) {
    if (level === 1) return pick([zehnerToDec, decToZehner, prozHund])();
    if (level === 2) return pick([erwDec, decToRed, bruchProz])();
    return pick([periodPick, abbrPick, mixOrder, divDec])();
  },
  text: level => genFrom(() => {
    const things = [['ein Haustier', 'haben'], ['ein Fahrrad', 'haben'], ['ein Instrument', 'spielen'], ['im Sportverein', 'sind']] as const;
    if (level === 4) {
      if (Math.random() < 0.65) {
        const G = pick([20, 25, 50]), W = R(2, G - 2), k = 100 / G, [what, verb] = pick([...things]);
        return wordTask({
          prompt: `In einer Gruppe sind ${G} Kinder. ${W} von ihnen ${verb} ${what}. Wie viel Prozent der Kinder sind das?`,
          steps: [
            { title: 'Erweiterungszahl', ask: `Der Anteil ist ${fr(W, G)}. Mit welcher Zahl erweiterst du, damit der Nenner 100 wird?`, calc: `100 : ${G}`, wrong: [`100 − ${G}`], why: 'Erweitern heißt malnehmen. Wie oft passt der Nenner in 100?' },
            { title: 'Prozent', ask: 'Wie viel Prozent sind das?', calc: `${W} · ${k}`, wrong: [`${W} + ${k}`], why: 'Den Zähler mit derselben Zahl malnehmen.', unit: '%' },
          ],
          unit: '%', sentence: v => `${v} der Kinder ${verb} ${what}.`,
        });
      }
      const G = 40, W = 2 * R(2, 18);
      return wordTask({
        prompt: `Bei einer Tombola gibt es ${G} Lose. ${W} davon sind Gewinne. Wie viel Prozent der Lose gewinnen?`,
        steps: [
          { title: 'Anteil als Dezimalzahl', ask: `Rechne den Anteil ${fr(W, G)} als Dezimalzahl aus.`, calc: `${W} : ${G}`, wrong: [`${G} : ${W}`], why: 'Anteil: Teil geteilt durch das Ganze.' },
          { title: 'Prozent', ask: 'Wie viel Prozent sind das?', calc: `${decS(W * 25, 3)} · 100`, wrong: [`${decS(W * 25, 3)} : 100`], why: 'Dezimalzahl in Prozent: mal 100.', unit: '%' },
        ],
        unit: '%', sentence: v => `${v} der Lose gewinnen.`,
      });
    }
    if (Math.random() < 0.6) {
      const [Ga, Gb] = shuffle([20, 25]), Wa = R(4, Ga - 3), Wb = R(4, Gb - 3), pa = (Wa * 100) / Ga, pb = (Wb * 100) / Gb, [what, verb] = pick([...things]);
      if (pa === pb) return null;
      const [hi, lo] = pa > pb ? ['6a', '6b'] : ['6b', '6a'];
      const t = wordTask({
        prompt: `In der 6a ${verb} ${Wa} von ${Ga} Kindern ${what}, in der 6b ${Wb} von ${Gb} Kindern. In welcher Klasse ist der Anteil größer? Um wie viele Prozentpunkte?`,
        steps: [
          { title: '6a in Prozent', ask: `Wie viel Prozent sind ${fr(Wa, Ga)}?`, calc: `${Wa} · ${100 / Ga}`, explain: `${fr(Wa, Ga)} = ${fr(pa, 100)} = ${pa} %`, unit: '%' },
          { title: '6b in Prozent', ask: `Wie viel Prozent sind ${fr(Wb, Gb)}?`, calc: `${Wb} · ${100 / Gb}`, explain: `${fr(Wb, Gb)} = ${fr(pb, 100)} = ${pb} %`, unit: '%' },
          { title: 'Unterschied', ask: 'Um wie viele Prozentpunkte ist der Anteil größer? (Gib nur die Zahl ein.)', calc: `${Math.max(pa, pb)} − ${Math.min(pa, pb)}`, wrong: [`${Math.min(pa, pb)} − ${Math.max(pa, pb)}`], why: 'Größerer minus kleinerer Prozentsatz.' },
        ],
        sentence: v => `In der ${hi} ist der Anteil größer, und zwar um ${v} Prozentpunkte.`,
      });
      t.guide[2].choose = { ask: 'In welcher Klasse ist der Anteil größer?', options: shuffle(opts(hi, [lo])), why: `6a: ${pa} %, 6b: ${pb} %. Nur die Anzahl der Kinder zu vergleichen reicht nicht, weil die Klassen verschieden groß sind.` };
      t.placeholder = 'Prozentpunkte';
      return t;
    }
    const G = 40, rad = pick([1, 3, 5, 7]), radN = (rad * G) / 8, bus = pick([10, 15, 20, 25, 30]), busN = (bus * G) / 100, fuss = G - radN - busN;
    if (fuss <= 0 || !Number.isInteger(busN)) return null;
    return wordTask({
      prompt: `Von den ${G} Kindern der Klasse 6c kommen ${fr(rad, 8)} mit dem Rad und ${bus} % mit dem Bus. Die anderen kommen zu Fuß. Wie viel Prozent der Klasse kommen zu Fuß?`,
      steps: [
        { title: 'Mit dem Rad', ask: 'Wie viele Kinder kommen mit dem Rad?', calc: `${rad}/8 · ${G}`, wrong: [`${rad}/8 + ${G}`], why: 'Bruchteil von einer Anzahl: mal.', unit: 'Kinder' },
        { title: 'Mit dem Bus', ask: 'Wie viele Kinder kommen mit dem Bus?', calc: `${bus} : 100 · ${G}`, wrong: [`${bus} · ${G}`], why: 'Erst 1 % (durch 100), dann mal die Prozentzahl.', unit: 'Kinder' },
        { title: 'Zu Fuß', ask: 'Wie viele Kinder kommen zu Fuß?', calc: `${G} − ${radN} − ${busN}`, unit: 'Kinder' },
        { title: 'In Prozent', ask: 'Wie viel Prozent der Klasse sind das?', calc: `${fuss} : ${G} · 100`, wrong: [`${G} : ${fuss} · 100`], why: 'Teil geteilt durch das Ganze, dann mal 100.', unit: '%' },
      ],
      unit: '%', sentence: v => `${v} der Klasse kommen zu Fuß.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

/* ======================================================================
   3. Rationale Zahlen
   ====================================================================== */
/** Zufällige rationale Zahl mit Schreibweise (Kommazahl oder Bruch). */
interface RN { v: Q; h: string; s: string }
function ratNum(neg: boolean | null = null, kind: 'dec' | 'frac' | null = null): RN {
  const sgn = neg === null ? pick([1, -1]) : neg ? -1 : 1;
  if ((kind ?? pick(['dec', 'frac'])) === 'dec') {
    let t: number; do t = R(1, 39); while (t % 10 === 0);
    const v = q(sgn * t, 10);
    return { v, h: dH(v), s: decS(sgn * t, 1) };
  }
  const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 5], [2, 5], [3, 5], [5, 4], [3, 2], [7, 4]] as [number, number][]);
  const v = q(sgn * n, d);
  return { v, h: qH(v), s: `${sgn < 0 ? '−' : ''}${n}/${d}` };
}
const dz = (v: Q) => (v.terminating() ? dH(v) : `≈ ${sg(v.approx(2))}`);

function betragTask(): Task {
  const x = ratNum(Math.random() < 0.7);
  if (Math.random() < 0.5) {
    const a = x.v.neg();
    return task(`Wie heißt die <b>Gegenzahl</b> von ${M(x.h)}?`, a, qH(a, x.h.includes(',')),
      [{ rule: 'Gegenzahl', lines: ['Die Gegenzahl liegt auf der anderen Seite der Null, gleich weit weg. Nur das Vorzeichen ändert sich.', M(`${x.h} → ${qH(a, x.h.includes(','))}`)] }],
      [{ title: 'Gegenzahl', ask: `<p>Spiegle ${M(x.h)} an der Null. Welche Zahl kommt heraus?</p>`, answer: a, hint: 'Das Vorzeichen wechselt, die Ziffern bleiben.', explain: M(`${x.h} → ${qH(a, x.h.includes(','))}`), placeholder: 'z. B. −2,5' }],
      { placeholder: 'z. B. −2,5', diag: v => (v.eq(x.v) ? 'Das ist die Zahl selbst. Die Gegenzahl hat das <b>andere</b> Vorzeichen.' : null) });
  }
  const a = x.v.sign() < 0 ? x.v.neg() : x.v;
  return task(`Wie groß ist der <b>Betrag</b>: ${M(`|${x.h}|`)}?`, a, qH(a, x.h.includes(',')),
    [{ rule: 'Betrag', lines: ['Der Betrag ist der Abstand zur Null. Ein Abstand ist nie negativ.', M(`|${x.h}| = ${qH(a, x.h.includes(','))}`)] }],
    [{ title: 'Abstand zur Null', ask: `<p>Wie weit ist ${M(x.h)} von der Null entfernt?</p>`, answer: a, hint: 'Lass das Minuszeichen weg.', explain: M(`|${x.h}| = ${qH(a, x.h.includes(','))}`), placeholder: 'z. B. 2,5' }],
    { placeholder: 'z. B. 2,5', diag: v => (v.sign() < 0 ? 'Ein Betrag ist <b>nie negativ</b>. Er ist der Abstand zur Null.' : null) });
}
function ratVgl(): Task {
  let a: RN, b: RN;
  if (Math.random() < 0.15) {
    const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 2]] as [number, number][]), v = q(-n, d);
    [a, b] = shuffle([{ v, h: qH(v), s: '' }, { v, h: dH(v), s: '' }]);
  } else {
    do { a = ratNum(Math.random() < 0.8); b = ratNum(Math.random() < 0.8); } while (a.v.eq(b.v) || (a.v.sign() > 0 && b.v.sign() > 0));
  }
  const ok = a.v.lt(b.v) ? 0 : b.v.lt(a.v) ? 1 : 2, sym = ['&lt;', '&gt;', '='][ok];
  const big = a.v.lt(b.v) ? b.v : a.v;
  const g: GuideStep[] = ok === 2
    ? [{ title: 'Gleiche Schreibweise', ask: `<p>Schreibe beide Zahlen als Kommazahl. Was ist ${M(a.h)} als Kommazahl?</p>`, answer: a.v, hint: 'Erweitere den Bruch auf 10 oder 100.', explain: `Beide sind ${M(dH(a.v))}.`, placeholder: 'z. B. −0,5' }]
    : [{ title: 'Die größere Zahl', ask: `<p>Welche der beiden Zahlen liegt auf der Zahlengeraden weiter <b>rechts</b>? Gib sie ein.</p>`, answer: big, hint: 'Bei negativen Zahlen gilt: Je weiter weg von der Null, desto kleiner.', explain: `${M(qH(big, true))} liegt weiter rechts, ist also größer.`, placeholder: 'Zahl' }];
  return pickFrom(`Welches Zeichen gehört in die Lücke?<div class="math big">${a.h} &#9633; ${b.h}</div>`, SIGNS, ok,
    [{ rule: 'Zahlengerade', lines: ['Weiter rechts auf der Zahlengeraden heißt größer. Negative Zahlen: Je weiter weg von der Null, desto kleiner.', `Als Kommazahlen: ${M(dz(a.v))} und ${M(dz(b.v))}`] }, { rule: 'Ergebnis', lines: [M(`${a.h} ${sym} ${b.h}`)] }], g, { label: sym });
}
function ratLine(): Task {
  const [d, lo, hi] = pick([[2, -2, 2], [4, -2, 2], [10, -1, 1], [5, -1, 1], [2, -3, 1], [4, -1, 1]] as [number, number, number][]);
  const n = (hi - lo) * d;
  let k: number; do k = R(1, n - 1); while (k % d === 0);
  const v = q(lo * d + k, d), dec = d === 10 || (d !== 3 && Math.random() < 0.5), vH = qH(v, dec);
  const ticks = Array.from({ length: n + 1 }, (_, i) => (i % d === 0 ? sg(lo + i / d) : ''));
  const steps = Math.abs(lo * d + k), left = v.sign() < 0;
  return task(`Setze den Punkt P auf die Zahl ${M(vH)}.`, q(k + 1), `Strich ${k + 1} von links`,
    [{ rule: 'Einteilung', lines: [`Von 0 bis 1 sind es ${d} Abschnitte. Jeder Abschnitt ist ${M(qH(q(1, d), dec))}.`] }, { rule: 'Abzählen', lines: [`${M(vH)} liegt ${steps} Abschnitte ${left ? 'links' : 'rechts'} von der Null.`] }],
    [{ title: 'Einteilung', ask: '<p>In wie viele Abschnitte ist die Strecke von 0 bis 1 geteilt?</p>', answer: q(d), hint: 'Zähle die Abschnitte zwischen 0 und 1.', explain: `Jeder Abschnitt ist ${M(qH(q(1, d), dec))}.`, placeholder: 'Anzahl' },
     { title: 'Abstand zur Null', choose: { ask: `Liegt ${M(vH)} links oder rechts von der Null?`, options: opts(left ? 'links' : 'rechts', [left ? 'rechts' : 'links']), why: left ? 'Negative Zahlen liegen links von der Null.' : 'Positive Zahlen liegen rechts von der Null.' },
       ask: `<p>Wie viele Abschnitte ist ${M(vH)} von der Null entfernt?</p>`, answer: q(steps), hint: `${M(qH(v.sign() < 0 ? v.neg() : v, dec))} = ${M(fr(steps, d))}`, explain: `${steps} Abschnitte ${left ? 'nach links' : 'nach rechts'}.`, placeholder: 'Anzahl' }],
    { widget: { kind: 'line', n, label: 'P', ticks }, placeholder: 'Punkt setzen' });
}
function ratOrd(): Task | null {
  return genFrom(() => {
    const xs = [ratNum(true), ratNum(true), ratNum(null), ratNum(null)];
    if (new Set(xs.map(x => x.v.red().txt())).size < 4) return null;
    const show = (o: RN[]) => M(o.map(x => x.h).join(' &lt; '));
    const asc = [...xs].sort((a, b) => num(a.v) - num(b.v));
    const abs = [...xs].sort((a, b) => Math.abs(num(a.v)) - Math.abs(num(b.v)));
    const negWrong = [...asc.filter(x => x.v.sign() < 0).sort((a, b) => num(b.v) - num(a.v)), ...asc.filter(x => x.v.sign() > 0)];
    const wrong = uniq([show(abs), show(negWrong), show([...asc].reverse()), show(shuffle(xs))]).filter(s => s !== show(asc));
    if (wrong.length < 2) return null;
    const mn = asc[0].v, mx = asc[3].v;
    return pickTask(`Ordne die Zahlen der Größe nach. Fang mit der <b>kleinsten</b> an.<div class="math big">${shuffle(xs).map(x => x.h).join(' ; ')}</div>`, show(asc), wrong,
      [{ rule: 'Als Kommazahlen', lines: [xs.map(x => `${x.h} ${x.v.terminating() ? '=' : '≈'} ${x.v.terminating() ? dH(x.v) : sg(x.v.approx(2))}`).join(', ')] }, { rule: 'Ordnen', lines: ['Negative Zahlen: Je größer der Betrag, desto kleiner die Zahl.', show(asc)] }],
      [{ title: 'Die kleinste Zahl', ask: '<p>Welche Zahl ist die kleinste? Gib sie ein.</p>', answer: mn, hint: 'Die negative Zahl, die am weitesten von der Null weg ist.', explain: `${M(qH(mn, true))} ist die kleinste.`, placeholder: 'Zahl' },
       { title: 'Die größte Zahl', ask: '<p>Welche Zahl ist die größte? Gib sie ein.</p>', answer: mx, hint: 'Die Zahl, die am weitesten rechts liegt.', explain: `${M(qH(mx, true))} ist die größte.`, placeholder: 'Zahl' }],
      { label: show(asc) });
  }, () => true);
}
const signDiag = (s: string) => (v: Q) => { const r = evalExpr(s).result; return v.eq(r.neg()) && !r.isZero() ? 'Der Betrag stimmt, aber das <b>Vorzeichen</b> nicht. Prüfe noch einmal, in welche Richtung du gehst.' : null; };
function ratAdd(): Task | null {
  return genFrom(() => {
    const t1 = () => { let t: number; do t = R(1, 69); while (t % 10 === 0); return t; };
    const a = t1(), b = t1();
    const s = pick([`(${decS(-a, 1)}) + ${decS(b, 1)}`, `${decS(-a, 1)} − ${decS(b, 1)}`, `${decS(a, 1)} − (${decS(-b, 1)})`, `(${decS(-a, 1)}) + (${decS(-b, 1)})`, `${decS(a, 1)} − ${decS(b, 1)}`, `(${decS(-a, 1)}) − (${decS(-b, 1)})`]);
    const t = exprTask(s, { placeholder: 'z. B. −1,5', diag: signDiag(s) });
    const g = autoGuide(t.sol);
    g[0] = { ...g[0], hint: 'Plus: nach rechts gehen. Minus: nach links gehen. Minus eine negative Zahl wird plus.' };
    return { ...t, guide: g };
  }, t => !t.answer.isZero());
}
function ratFrac(): Task | null {
  return genFrom(() => {
    const f = () => { const [n, d] = properFrac([2, 3, 4, 5, 6, 8, 9, 10]); return { n, d }; };
    const a = f(), b = f();
    const A = `(−${a.n}/${a.d})`, Bp = `${b.n}/${b.d}`, Bn = `(−${b.n}/${b.d})`;
    const s = pick([`${A} + ${Bp}`, `${A} − ${Bp}`, `${Bp} − ${A}`, `${A} + ${Bn}`, `${A} · ${Bp}`, `${A} · ${Bn}`, `${Bp} · ${A}`, `${A} : ${Bp}`]);
    const t = exprTask(s, { placeholder: 'z. B. −3/4', needReduced: true, diag: signDiag(s) });
    return { ...t, form: 'frac' as const };
  }, t => !t.answer.isZero() && !t.answer.isInt() && t.answer.d <= 40n);
}
function ratMulDec(): Task | null {
  return genFrom(() => {
    const t1 = () => { let t: number; do t = R(2, 49); while (t % 10 === 0); return t; };
    const a = t1(), b = R(2, 9), sa = pick([1, -1]), sb = sa > 0 ? -1 : pick([1, -1]);
    const prod = a * b * sa * sb;
    const s = Math.random() < 0.5 ? `${pS(sa * a, 1)} · ${pS(sb * b, 1)}` : `${pS(prod, 2)} : ${pS(sb * b, 1)}`;
    return exprTask(s, { placeholder: 'z. B. −0,6', diag: signDiag(s) });
  }, t => !t.answer.isZero() && t.answer.terminating());
}

/* Zahlenmengen ℕ, ℤ, ℚ */
const SETS = ['ℕ (natürliche Zahlen)', 'ℤ (ganze Zahlen)', 'ℚ (rationale Zahlen)'];
const setsSVG = () => `<svg class="fig" viewBox="0 0 320 180" style="max-width:380px" role="img" aria-label="Zahlenmengen ineinander: ℕ liegt in ℤ, ℤ liegt in ℚ">
  <rect class="sh" x="4" y="4" width="312" height="172" rx="16" /><rect class="sh" x="22" y="34" width="208" height="128" rx="14" /><rect class="sh" x="40" y="64" width="110" height="84" rx="12" />
  <text x="16" y="24" style="font-size:16px">ℚ rationale Zahlen</text><text x="34" y="54" style="font-size:16px">ℤ ganze Zahlen</text><text x="50" y="84" style="font-size:14px">ℕ natürliche</text>
  <text x="62" y="112">1; 2; 3</text><text x="62" y="134">17; 250</text>
  <text x="166" y="92">0</text><text x="166" y="116">−1</text><text x="166" y="140">−20</text>
  <text x="248" y="70">1/2</text><text x="248" y="98">−0,75</text><text x="248" y="126">2,5</text><text x="248" y="154">−7/3</text>
</svg>`;
interface MZ { h: string; v: Q; set: 0 | 1 | 2; simple: boolean }
function mzNum(level: number): MZ {
  const k = R(0, level === 1 ? 2 : 4);
  if (k === 0) { const n = R(1, 99); return { h: String(n), v: q(n), set: 0, simple: true }; }
  if (k === 1) { const n = R(1, 60); return { h: sg(-n), v: q(-n), set: 1, simple: true }; }
  if (k === 2) { const x = ratNum(null); return { h: x.h, v: x.v, set: 2, simple: true }; }
  // Stufe 2: Brüche, die eigentlich ganze Zahlen sind
  const d = R(2, 6), w = R(1, 8), neg = k === 4;
  const v = q(neg ? -w * d : w * d, d);
  return { h: (neg ? '−' : '') + fracH(w * d, d), v, set: neg ? 1 : 0, simple: false };
}
function mengeTask(level: number): Task {
  const x = mzNum(level), r = x.v.red(), ganz = r.isInt();
  const why = x.set === 0 ? `${M(qH(r))} ist eine positive ganze Zahl, also eine natürliche Zahl.` : x.set === 1 ? `${M(qH(r))} ist eine ganze Zahl, aber negativ. Natürliche Zahlen sind nur 1, 2, 3, …` : `${M(x.h)} ist keine ganze Zahl. Sie liegt zwischen zwei ganzen Zahlen. Das ist eine rationale Zahl.`;
  return pickFrom(`Zu welcher <b>kleinsten</b> Zahlenmenge gehört ${M(x.h)}?`, SETS, x.set,
    [{ rule: 'Vereinfachen', lines: [x.simple ? `${M(x.h)} lässt sich nicht einfacher schreiben.` : `${M(x.h)} = ${M(qH(r))}`] }, { rule: 'Entscheiden', lines: [why, 'Jede natürliche Zahl ist auch ganz, jede ganze Zahl ist auch rational. Gefragt ist die kleinste passende Menge.'] }],
    [{ title: 'Ganz oder nicht?', choose: { ask: `Ist ${M(x.h)} eine ganze Zahl (ohne Bruchteil und ohne Stellen nach dem Komma)?`, options: opts(ganz ? 'Ja' : 'Nein', [ganz ? 'Nein' : 'Ja']), why: ganz ? (x.simple ? `${M(x.h)} hat keinen Bruchteil.` : `Rechne aus: ${M(`${x.h} = ${qH(r)}`)}.`) : `${M(x.h)} liegt zwischen zwei ganzen Zahlen.` },
      ask: `<p>Schreibe ${M(x.h)} so einfach wie möglich. Kürze oder rechne aus, wenn es geht.</p>`, answer: r, hint: x.simple ? 'Manchmal ist die Zahl schon ganz einfach.' : 'Ein Bruchstrich heißt: geteilt. Rechne Zähler : Nenner.', explain: `${x.simple ? M(x.h) : M(`${x.h} = ${qH(r)}`)}. ${why}`, placeholder: 'Zahl' }],
    { label: SETS[x.set] });
}
function wfMenge(level: number): Task {
  const st = (claim: string, right: string, wrong: string[], expl: string[], g: GuideStep[], label: string) =>
    pickTask(`Stimmt die Aussage? Wähle die richtige Antwort mit Begründung.<p><b>${claim}</b></p>`, right, wrong, [{ rule: 'Begründung', lines: expl }], g, { label });
  const S: (() => Task)[] = [
    () => { const m = R(2, 20);
      return st('„Jede ganze Zahl ist auch eine rationale Zahl.“', `Wahr. Jede ganze Zahl kann man als Bruch schreiben, zum Beispiel ${M(`−${m} = −${fracH(m, 1)}`)}.`,
        ['Falsch. Rationale Zahlen sind nur Brüche und Kommazahlen.', 'Falsch. Negative Zahlen sind nicht rational.', 'Wahr. Aber nur die positiven ganzen Zahlen.'],
        [`ℤ liegt ganz in ℚ. Jede ganze Zahl ist ein Bruch mit dem Nenner 1: ${M(`−${m} = −${fracH(m, 1)}`)}.`],
        [{ title: 'Als Bruch schreiben', ask: `<p>Schreibe ${M(sg(-m))} als Bruch mit dem Nenner 1. Wie heißt der Zähler?</p><div class="math big">${sg(-m)} = ${fracH('?', 1)}</div>`, answer: q(-m), hint: 'Geteilt durch 1 ändert nichts.', explain: `${M(`−${m} = −${fracH(m, 1)}`)}. Also ist ${sg(-m)} auch eine rationale Zahl.`, placeholder: 'Zähler' }], 'Wahr'); },
    () => { const m = R(2, 30);
      return st(`„${sg(-m)} ist eine natürliche Zahl.“`, `Falsch. Natürliche Zahlen sind 1, 2, 3, … ${sg(-m)} ist negativ. Es ist eine ganze Zahl.`,
        [`Wahr. ${sg(-m)} hat kein Komma und keinen Bruchstrich.`, 'Wahr. Jede ganze Zahl ist natürlich.', `Falsch. ${sg(-m)} ist gar keine ganze Zahl.`],
        [`ℕ = {1; 2; 3; …}. Negative Zahlen gehören nicht dazu. ${sg(-m)} liegt in ℤ, aber nicht in ℕ.`],
        [{ title: 'Natürliche Zahlen', ask: '<p>Natürliche Zahlen sind die Zahlen zum Zählen. Welches ist die kleinste natürliche Zahl?</p>', answer: q(1), hint: 'Womit fängst du beim Zählen an?', explain: `ℕ = {1; 2; 3; …}. ${sg(-m)} ist kleiner als 1, also keine natürliche Zahl.`, placeholder: 'Zahl' }], 'Falsch'); },
    () => st('„Jede natürliche Zahl ist auch eine ganze Zahl.“', 'Wahr. ℤ enthält 1, 2, 3, … und dazu die Null und die negativen ganzen Zahlen.',
        ['Falsch. Ganze Zahlen sind nur die negativen Zahlen.', 'Falsch. ℕ und ℤ haben keine gemeinsamen Zahlen.', 'Wahr. ℕ ist größer als ℤ.'],
        ['ℕ liegt ganz in ℤ: ℤ = {…; −2; −1; 0; 1; 2; …}.'],
        [{ title: 'Ganze Zahlen', ask: '<p>Wie viele ganze Zahlen liegen <b>zwischen</b> −3 und 3 (ohne −3 und 3)?</p>', answer: q(5), hint: 'Schreibe sie auf: −2, …', explain: '−2, −1, 0, 1, 2. Die natürlichen Zahlen 1 und 2 sind auch dabei.', placeholder: 'Anzahl' }], 'Wahr'),
  ];
  if (level >= 2) S.push(
    () => st('„Jede rationale Zahl ist auch eine ganze Zahl.“', `Falsch. ${fr(1, 2)} ist rational, liegt aber zwischen 0 und 1. Dort gibt es keine ganze Zahl.`,
        ['Wahr. ℚ ist die größte Menge, also steckt alles in ℤ.', 'Wahr. Man kann jeden Bruch so lange kürzen, bis eine ganze Zahl herauskommt.', 'Falsch. Rationale Zahlen sind immer negativ.'],
        [`Andersherum stimmt es: Jede ganze Zahl ist rational. Aber ${M(fr(1, 2))} = 0,5 ist nicht ganz.`],
        [{ title: 'Beispiel', ask: `<p>Schreibe ${M(fr(1, 2))} als Kommazahl.</p>`, answer: q(1, 2), hint: '1 : 2', explain: `${M(`${fr(1, 2)} = 0,5`)}. Das ist keine ganze Zahl.`, placeholder: 'z. B. 0,5' }], 'Falsch'),
    () => { const [n, d] = pick([[3, 4], [1, 4], [1, 2], [2, 5], [3, 5], [1, 5]] as [number, number][]), v = q(-n, d), h = dH(v);
      return st(`„${h} ist eine rationale Zahl.“`, `Wahr. ${M(`${h} = ${qH(v)}`)}. Das ist ein Bruch, also rational.`,
        ['Falsch. Kommazahlen sind nicht rational.', `Falsch. ${h} ist negativ, also eine ganze Zahl.`, `Wahr. ${h} ist eine ganze Zahl.`],
        [`${M(`${h} = ${qH(v)}`)}. Jede Zahl, die man als Bruch schreiben kann, ist rational.`],
        [{ title: 'Als Bruch', ask: `<p>Schreibe ${M(h)} als vollständig gekürzten Bruch.</p>`, answer: v, needReduced: true, hint: `${h} sind ${n * (100 / d)} Hundertstel.`, explain: `${M(`${h} = ${qH(v)}`)}`, placeholder: 'z. B. −3/4' }], 'Wahr'); },
  );
  return pick(S)();
}
/** Welche Zahl ist ganz, aber nicht natürlich? (oder rational, aber nicht ganz?) */
function ganzNichtNat(): Task {
  const m = R(2, 30), [n, d] = pick([[3, 4], [1, 2], [2, 3], [5, 4], [1, 5]] as [number, number][]), dd = R(2, 5), w = R(2, 6);
  if (Math.random() < 0.5) {
    return pickTask('Welche Zahl ist <b>ganz</b>, aber <b>nicht natürlich</b>?', M(sg(-m)), [M(String(m)), M(`−${fr(n, d)}`), M(sg(decS(-(R(11, 49) * 10 + R(1, 9)), 2)))],
      [{ rule: 'Ganz, aber nicht natürlich', lines: [`Natürliche Zahlen sind 1, 2, 3, … Ganze Zahlen sind zusätzlich 0 und die negativen ganzen Zahlen.`, `${M(sg(-m))} ist ganz und negativ, also nicht natürlich.`] }],
      [{ title: 'Negativ und ganz', choose: { ask: 'Welche Zahlen sind sicher nicht natürlich?', options: opts('die negativen Zahlen', ['die großen Zahlen', 'die Zahlen mit zwei Ziffern']), why: 'Natürliche Zahlen sind 1, 2, 3, … Negative Zahlen gehören nicht dazu.' },
        ask: '<p>Welche der Zahlen ist negativ und hat weder Bruchstrich noch Komma? Gib sie ein.</p>', answer: q(-m), hint: 'Ganze Zahlen haben keinen Bruchteil.', explain: `${M(sg(-m))} ist ganz, aber nicht natürlich.`, placeholder: 'Zahl' }],
      { label: sg(-m) });
  }
  const trap = fracH(w * dd, dd);
  return pickTask('Welche Zahl ist <b>rational</b>, aber <b>nicht ganz</b>?', M(`−${fr(n, d)}`), [M(sg(-m)), M(String(m)), M(trap)],
    [{ rule: 'Nicht ganz', lines: [`${M(`${trap} = ${w * dd} : ${dd} = ${w}`)} ist ganz.`, `${M(`−${fr(n, d)}`)} liegt zwischen zwei ganzen Zahlen. Sie ist rational, aber nicht ganz.`] }],
    [{ title: 'Vorsicht, Falle', ask: `<p>Rechne aus: ${M(`${trap} = ?`)}</p>`, answer: q(w), hint: `${w * dd} : ${dd}`, explain: `${M(`${trap} = ${w}`)}. Das ist eine ganze Zahl. Also bleibt nur ${M(`−${fr(n, d)}`)}.`, placeholder: 'Zahl' }],
    { label: `−${fr(n, d)}` });
}

const RAT: Topic = {
  id: 'rat', klasse: 6, title: 'Rationale Zahlen', short: 'Negative Kommazahlen und Brüche vergleichen, ordnen und damit rechnen.',
  example: '(−2,5) + 1,7',
  theory: `
    <p>Du kennst schon negative ganze Zahlen wie −3. Es gibt auch <b>negative Kommazahlen und Brüche</b>: −2,5 liegt genau in der Mitte zwischen −3 und −2, ${M(qH(q(-3, 4)))} liegt zwischen −1 und 0. Alle diese Zahlen heißen <b>rationale Zahlen</b>.</p>
    <p><b>Gegenzahl:</b> gleich weit von der Null weg, nur auf der anderen Seite. Die Gegenzahl von −2,5 ist 2,5.</p>
    <p><b>Betrag:</b> der Abstand zur Null. Er ist nie negativ: ${M('|−2,5| = 2,5')}.</p>
    <p><b>Vergleichen:</b> Weiter rechts auf der Zahlengeraden ist größer. Bei negativen Zahlen ist die mit dem größeren Betrag die kleinere: ${M('−2,7 &lt; −2,3')}.</p>
    <p><b>Rechnen</b> geht wie mit ganzen Zahlen: Plus heißt nach rechts, Minus heißt nach links. ${M('(−2,5) + 1,7 = −0,8')}. Bei Mal und Geteilt rechnest du erst ohne Vorzeichen, dann gilt: gleiche Vorzeichen plus, verschiedene minus. ${M(`(−${fr(2, 3)}) · ${fr(3, 4)} = −${fr(1, 2)}`)}</p>
    <p><b>Zahlenmengen:</b> Zahlen werden in Mengen eingeteilt. Jede Menge hat ein eigenes Zeichen.</p>
    <ul><li><b>ℕ, die natürlichen Zahlen:</b> die Zahlen zum Zählen, 1; 2; 3; 4; … (Mit der Null schreibt man ℕ₀.)</li>
    <li><b>ℤ, die ganzen Zahlen:</b> alle natürlichen Zahlen, die Null und die negativen ganzen Zahlen: …; −2; −1; 0; 1; 2; …</li>
    <li><b>ℚ, die rationalen Zahlen:</b> alle Zahlen, die man als Bruch schreiben kann, auch negative. Zum Beispiel ${M(fr(1, 2))}, ${M('−0,75')}, ${M('2,5')} und auch ${M(`−4 = −${fracH(4, 1)}`)}.</li></ul>
    ${setsSVG()}
    <p>Die Mengen stecken ineinander: Jede natürliche Zahl ist auch ganz, jede ganze Zahl ist auch rational. Andersherum nicht: ${M('−3')} ist ganz, aber nicht natürlich. ${M(`−${fr(3, 4)}`)} ist rational, aber nicht ganz. Vorsicht: ${M(fr(8, 4))} sieht aus wie ein Bruch, ist aber 2, also eine natürliche Zahl.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>ℕ liegt in ℤ, ℤ liegt in ℚ.</li><li>Negative Zahlen: je weiter weg von der Null, desto kleiner.</li><li>Der Betrag ist nie negativ.</li><li>Minus eine negative Zahl wird plus.</li><li>Mal/Geteilt: gleiche Vorzeichen plus, verschiedene minus.</li></ol></div>`,
  gen(level) {
    if (level === 1) return pick([betragTask, ratVgl, () => mengeTask(1), () => wfMenge(1)])();
    if (level === 2) return pick([ratLine, ratOrd, ratAdd, ratAdd, () => mengeTask(2), () => wfMenge(2), ganzNichtNat])();
    return pick([ratFrac, ratFrac, ratMulDec])();
  },
  text: level => genFrom(() => {
    if (level === 4) {
      const k = R(0, 2);
      if (k === 0) {
        const a = R(11, 89), b = R(11, 99);
        if (a % 10 === 0 || b % 10 === 0) return null;
        return wordTask({
          prompt: `Am Morgen zeigt das Thermometer ${decS(-a, 1)} °C. Am Mittag sind es ${decS(b, 1)} °C. Um wie viel Grad ist es wärmer geworden?`,
          steps: [
            { title: 'Bis zur Null', ask: `Um wie viel Grad steigt die Temperatur von ${decS(-a, 1)} °C bis 0 °C?`, calc: `0 − (${decS(-a, 1)})`, wrong: [`0 + (${decS(-a, 1)})`], why: 'Unterschied: neu minus alt. Minus minus wird plus.', unit: 'Grad' },
            { title: 'Ab der Null', ask: `Und dann noch von 0 °C bis ${decS(b, 1)} °C. Wie viel Grad sind es zusammen?`, calc: `${decS(a, 1)} + ${decS(b, 1)}`, wrong: [`${decS(b, 1)} − ${decS(a, 1)}`], why: 'Beide Teilstücke zusammenzählen.', unit: 'Grad' },
          ],
          unit: 'Grad', term: `${decS(b, 1)} − (${decS(-a, 1)})`, sentence: v => `Es ist um ${v} wärmer geworden.`,
        });
      }
      if (k === 1) {
        const a = R(105, 899), b = R(10, 15) * 10, c = R(150, 2990), after = b * 10 - a, end = after - c;
        if (end <= 0 || a % 10 === 0 || c % 10 === 0) return null;
        const fe = (x: number) => (x / 10).toFixed(2).replace('.', ',');
        return wordTask({
          prompt: `Auf Jonas' Konto sind −${fe(a)} €. Er hat also ${fe(a)} € Schulden. Er zahlt ${b} € ein und kauft danach ein Buch für ${fe(c)} €. Wie viel Guthaben hat er am Ende?`,
          steps: [
            { title: 'Einzahlung', ask: 'Wie hoch ist der Kontostand nach dem Einzahlen?', calc: `(${decS(-a, 1)}) + ${b}`, wrong: [`(${decS(-a, 1)}) − ${b}`], why: 'Einzahlen: Es kommt Geld dazu, also plus.', unit: '€' },
            { title: 'Buch', ask: 'Wie viel Guthaben bleibt nach dem Kauf?', calc: `${decS(after, 1)} − ${decS(c, 1)}`, wrong: [`${decS(after, 1)} + ${decS(c, 1)}`], why: 'Kaufen: Geld geht weg, also minus.', unit: '€' },
          ],
          unit: '€', sentence: () => `Jonas hat am Ende ${fe(end)} € Guthaben.`,
        });
      }
      const a = R(15, 189), b = R(11, 99);
      if (a % 10 === 0 || b % 10 === 0) return null;
      return wordTask({
        prompt: `Eine Taucherin ist ${decS(a, 1)} m unter der Wasseroberfläche, also bei ${decS(-a, 1)} m. Über ihr fliegt eine Möwe in ${decS(b, 1)} m Höhe. Wie weit sind die beiden voneinander entfernt?`,
        steps: [
          { title: 'Abstand', ask: 'Rechne obere Höhe minus untere Höhe.', calc: `${decS(b, 1)} − (${decS(-a, 1)})`, wrong: [`${decS(b, 1)} + (${decS(-a, 1)})`], why: 'Abstand: oben minus unten. Minus minus wird plus.', unit: 'm' },
        ],
        unit: 'm', sentence: v => `Die beiden sind ${v} voneinander entfernt.`,
      });
    }
    if (Math.random() < 0.5) {
      const rate = pick([15, 20, 25, 30]), h = R(4, 9), kuehl = R(30, 70), truhe = kuehl - rate * h;
      if (truhe > -140 || truhe < -260 || truhe % 10 === 0) return null;
      return wordTask({
        prompt: `In der Tiefkühltruhe hat ein Eis ${decS(truhe, 1)} °C. Im Kühlschrank sind es ${decS(kuehl, 1)} °C. Um wie viel Grad ist es im Kühlschrank wärmer? Das Eis wird in den Kühlschrank gestellt und erwärmt sich jede Stunde um ${decS(rate, 1)} Grad. Nach wie vielen Stunden hat es die Temperatur im Kühlschrank erreicht?`,
        steps: [
          { title: 'Unterschied', ask: 'Um wie viel Grad ist es im Kühlschrank wärmer als in der Truhe?', calc: `${decS(kuehl, 1)} − (${decS(truhe, 1)})`, wrong: [`${decS(kuehl, 1)} + (${decS(truhe, 1)})`], why: 'Unterschied: wärmer minus kälter. Minus minus wird plus.', unit: 'Grad' },
          { title: 'Stunden', ask: `Jede Stunde wird es ${decS(rate, 1)} Grad wärmer. Wie viele Stunden dauert es?`, calc: `${decS(kuehl - truhe, 1)} : ${decS(rate, 1)}`, wrong: [`${decS(kuehl - truhe, 1)} · ${decS(rate, 1)}`], why: 'Wie oft passt der Schritt in den Unterschied: geteilt.', unit: 'Stunden' },
        ],
        unit: 'Stunden', sentence: v => `Nach ${v} hat das Eis die Temperatur im Kühlschrank erreicht.`,
      });
    }
    const a = R(205, 895), k = R(3, 5), e = pick([20, 25, 30]), c = R(105, 2490);
    const after = k * e * 10 - a, end = after - c;
    if (a % 10 === 0 || c % 10 === 0 || after <= 0 || end <= 0) return null;
    const fe = (x: number) => (x / 10).toFixed(2).replace('.', ',');
    return wordTask({
      prompt: `Leas Konto steht bei −${fe(a)} €. Sie zahlt ${k}-mal je ${e} € ein. Dann kauft sie Schuhe für ${fe(c)} €. Wie viel Guthaben hat sie danach?`,
      steps: [
        { title: 'Alle Einzahlungen', ask: 'Wie viel zahlt Lea insgesamt ein?', calc: `${k} · ${e}`, wrong: [`${k} + ${e}`], why: 'Mehrmals gleich viel: mal.', unit: '€' },
        { title: 'Nach dem Einzahlen', ask: 'Wie hoch ist der Kontostand nach dem Einzahlen?', calc: `(${decS(-a, 1)}) + ${k * e}`, wrong: [`(${decS(-a, 1)}) − ${k * e}`], why: 'Einzahlen: plus.', unit: '€' },
        { title: 'Nach dem Kauf', ask: 'Wie viel Guthaben bleibt nach dem Kauf?', calc: `${decS(after, 1)} − ${decS(c, 1)}`, wrong: [`${decS(after, 1)} + ${decS(c, 1)}`], why: 'Kaufen: minus.', unit: '€' },
      ],
      unit: '€', sentence: () => `Lea hat danach ${fe(end)} € Guthaben.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

export const BRUCH2_TOPICS: Topic[] = [BRVGL, UMW, RAT];
