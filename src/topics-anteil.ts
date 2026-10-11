/* ===== Klasse 6: Anteile berechnen, Brüche als Quotienten, Verhältnisse ===== */
import type { GuideStep } from './guide.js';
import { wordTask } from './guide.js';
import { Q, q, qH, fracH, mixedH, gcd, evalExpr, type ListSolution } from './engine/index.js';
import { M, R, genFrom, list, pick, type Task, type Topic } from './gen.js';
import { LETTERS, type Widget } from './widgets.js';

/* ---------- Bausteine ---------- */
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const uniq = (a: string[]) => [...new Set(a)];
const fr = (n: number, d: number) => qH(q(n, d));
const ev = (s: string): Q => evalExpr(s).result;
const vH = (v: Q) => qH(v, true);
const big = (s: string) => `<div class="math big">${s}</div>`;
const ggt = (a: number, b: number) => Number(gcd(BigInt(a), BigInt(b)));
const opts = (right: string, wrong: string[]) => shuffle([{ html: right, ok: true }, ...uniq(wrong).filter(w => w !== right).map(w => ({ html: w, ok: false }))]);
/** Rechnung mit Ergebnis aus der Recheneinheit, als HTML */
const calcH = (s: string, unit = '') => { const r = evalExpr(s); return `${M(r.inputHTML)} = ${M(vH(r.result))}${unit ? ' ' + unit : ''}`; };
/** Typische Fehler erkennen: erster passender Fall gewinnt, die richtige Lösung selbst nie. */
const diagOf = (ans: Q, cases: [Q | null, string][]) => (v: Q): string | null => {
  for (const [w, m] of cases) if (w && !w.eq(ans) && v.eq(w)) return m;
  return null;
};
const echt = (n: number, d: number) => n < d;

function task(prompt: string, answer: Q, resH: string, steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> = {}): Task {
  return { prompt, answer, sol: list(steps, answer, resH), guide, placeholder: 'Deine Lösung', ...o };
}
function pickFrom(prompt: string, options: string[], ok: number, steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> & { label?: string } = {}): Task {
  const w: Widget = { kind: 'pick', options };
  const { label, ...rest } = o;
  return task(prompt, q(ok + 1), `${LETTERS[ok]}: ${label ?? options[ok]}`, steps, guide, { widget: w, placeholder: 'Auswahl', ...rest });
}
/** Auswahl: die richtige Option und bis zu drei typische Fehler, gemischt. */
function pickTask(prompt: string, right: string, wrong: string[], steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> & { label?: string } = {}): Task | null {
  const w = uniq(wrong.filter(x => x !== right)).slice(0, 3);
  if (w.length < 2) return null;
  const all = shuffle([right, ...w]);
  return pickFrom(prompt, all, all.indexOf(right), steps, guide, o);
}
/** Ein Bruch n/d, gekürzt, Zähler kleiner als Nenner */
const properFrac = (ds: number[], n1 = false): [number, number] => { for (;;) { const d = pick(ds), n = n1 && Math.random() < 0.25 ? 1 : R(1, d - 1); if (ggt(n, d) === 1) return [n, d]; } };

/* ---------- Bilder: Säulendiagramm und Kreisdiagramm ---------- */
const ON = 'style="fill: var(--tc, var(--blue)); fill-opacity: .75"';
function barSVG(labels: string[], vals: number[], unit: string): string {
  const max = Math.max(...vals), step = max > 12 ? 2 : 1, top = Math.ceil(max / step) * step, H = 150, bw = 220 / labels.length;
  let g = '';
  for (let v = 0; v <= top; v += step) { const y = 22 + H - (v / top) * H; g += `<line class="gl" x1="40" y1="${y}" x2="270" y2="${y}" /><text class="tk" x="34" y="${y + 4}" text-anchor="end">${v}</text>`; }
  const bars = vals.map((v, i) => { const h = (v / top) * H, x = 48 + i * bw; return `<rect class="bar-r" x="${x}" y="${22 + H - h}" width="${bw - 10}" height="${h}" /><text class="tk" x="${x + (bw - 10) / 2}" y="${H + 38}" text-anchor="middle">${labels[i]}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 280 ${H + 46}" role="img" aria-label="Säulendiagramm ${unit}: ${labels.map((l, i) => `${l} ${vals[i]}`).join(', ')}">${g}${bars}<text class="tk" x="40" y="10" text-anchor="end">${unit}</text></svg>`;
}
/** Kreis aus D gleichen Stücken; jede Gruppe belegt k Stücke. Die Gruppe `hi` ist gefärbt. */
function pieCatSVG(cats: { name: string; k: number }[], D: number, hi: number): string {
  const c = 100, r = 90;
  const p = (a: number, rr = r) => `${(c + rr * Math.cos(a)).toFixed(2)} ${(c + rr * Math.sin(a)).toFixed(2)}`;
  const ang = (i: number) => (i / D) * 2 * Math.PI - Math.PI / 2;
  let s = '', at = 0, lines = '', labels = '';
  cats.forEach((g, j) => {
    const a0 = ang(at), a1 = ang(at + g.k);
    s += `<path class="sh" ${j === hi ? ON : ''} d="M ${c} ${c} L ${p(a0)} A ${r} ${r} 0 ${g.k * 2 > D ? 1 : 0} 1 ${p(a1)} Z" />`;
    const m = ang(at + g.k / 2), [lx, ly] = p(m, r * 0.6).split(' ');
    labels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${g.name}</text>`;
    for (let i = 1; i < g.k; i++) lines += `<line class="hl" x1="${c}" y1="${c}" x2="${p(ang(at + i)).split(' ')[0]}" y2="${p(ang(at + i)).split(' ')[1]}" />`;
    at += g.k;
  });
  return `<svg class="fig" viewBox="0 0 200 200" style="max-width: 220px" role="img" aria-label="Kreisdiagramm mit ${D} gleichen Stücken: ${cats.map(g => `${g.name} ${g.k} Stücke`).join(', ')}">${s}${lines}${labels}</svg>`;
}

/* ======================================================================
   Teil 1: Anteile berechnen und vom Anteil aufs Ganze schließen
   ====================================================================== */
interface Ctx { u: string; of: (G: number) => string; vals: number[] }
const rng = (a: number, b: number, s = 1) => { const o: number[] = []; for (let v = a; v <= b; v += s) o.push(v); return o; };
const ANT_CTX: Ctx[] = [
  { u: '€', of: G => `${G} €`, vals: rng(6, 60) },
  { u: 'g', of: G => `${G} g`, vals: [100, 120, 150, 200, 240, 250, 300, 360, 400, 450, 500, 600, 750, 800, 900, 1000] },
  { u: 'kg', of: G => `${G} kg`, vals: rng(4, 48) },
  { u: 'm', of: G => `${G} m`, vals: rng(6, 100) },
  { u: 'min', of: G => `${G} min`, vals: [12, 15, 20, 24, 30, 36, 40, 45, 48, 50, 60, 80, 90, 120] },
  { u: 'Kinder', of: G => `${G} Kindern`, vals: rng(12, 32) },
];

function anteilTask(level: number): Task | null {
  return genFrom(() => {
    const [n, d] = properFrac(level === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8, 10], level === 1);
    const c = pick(ANT_CTX), Gs = c.vals.filter(G => G % d === 0 && (level > 1 || G <= 40));
    if (!Gs.length) return null;
    const G = pick(Gs), e = ev(`${G} : ${d}`), r = ev(`${G} : ${d} · ${n}`);
    const u = c.u;
    const steps = [{ rule: 'Ein Teil', lines: [`${M(fr(1, d))} von ${c.of(G)}: Teile das Ganze in ${d} gleiche Teile.`, calcH(`${G} : ${d}`, u)] }];
    const guide: GuideStep[] = [{ title: `${1}/${d} ausrechnen`, ask: `<p>Teile das Ganze durch den <b>Nenner</b>. Wie viel ist ${M(fr(1, d))} von ${c.of(G)}?</p>${big(`${G} : ${d} = ?`)}`, answer: e, hint: `Der Nenner ${d} sagt: in ${d} gleiche Teile teilen.`, explain: calcH(`${G} : ${d}`, u), placeholder: `Antwort in ${u}` }];
    if (n > 1) {
      steps.push({ rule: `${n} Teile`, lines: [`Der Zähler ${n} sagt: Nimm ${n} solche Teile.`, calcH(`${vH(e)} · ${n}`, u)] });
      guide.push({ title: `${n}/${d} ausrechnen`, ask: `<p>Nimm jetzt so viele Teile, wie der <b>Zähler</b> sagt.</p>${big(`${vH(e)} · ${n} = ?`)}`, answer: r, hint: `Der Zähler ist ${n}.`, explain: `${calcH(`${vH(e)} · ${n}`, u)}. Also sind ${M(fr(n, d))} von ${c.of(G)} genau ${vH(r)} ${u}.`, placeholder: `Antwort in ${u}` });
    }
    return task(`Wie viel sind ${M(fr(n, d))} von ${c.of(G)}?`, r, `${vH(r)} ${u}`, steps, guide, {
      placeholder: `Antwort in ${u}`,
      diag: diagOf(r, [
        [n > 1 ? e : null, `Das ist erst ${M(fr(1, d))}. Nimm das Ergebnis noch mit dem Zähler ${n} mal.`],
        [q(G * d, n), 'Du hast durch den Zähler geteilt und mit dem Nenner malgenommen. Andersherum: durch den <b>Nenner</b> (unten) teilen, mit dem <b>Zähler</b> (oben) mal.'],
        [q(G, n), `Du hast durch den Zähler geteilt. Teile durch den <b>Nenner</b> ${d}.`],
        [q(G * n), `Du hast vergessen, durch den Nenner ${d} zu teilen.`],
        [q(G - (G / d) * n), 'Das ist der Rest. Gefragt ist der Anteil selbst.'],
        [q(G), 'Das ist das Ganze. Gesucht ist nur ein Teil davon.'],
      ]),
    });
  }, () => true);
}

const GANZ_CTX: { s: (f: string, T: number) => string; u: string; sent: string; unit: (T: number) => number[] }[] = [
  { s: (f, T) => `${f} der Kinder der Klasse 6a sind ${T} Kinder. Wie viele Kinder hat die Klasse?`, u: 'Kinder', sent: 'Kinder', unit: () => [] },
  { s: (f, T) => `Lisa ist schon ${f} ihres Schulwegs gegangen. Das sind ${T} m. Wie lang ist der ganze Schulweg?`, u: 'm', sent: 'm', unit: () => [] },
  { s: (f, T) => `Max hat ${f} seines Taschengelds ausgegeben. Das sind ${T} €. Wie viel Taschengeld hatte er?`, u: '€', sent: '€', unit: () => [] },
  { s: (f, T) => `Ein Glas ist zu ${f} gefüllt. Das sind ${T} ml. Wie viel passt in das volle Glas?`, u: 'ml', sent: 'ml', unit: () => [] },
  { s: (f, T) => `Ben hat ${f} seines Buches gelesen. Das sind ${T} Seiten. Wie viele Seiten hat das Buch?`, u: 'Seiten', sent: 'Seiten', unit: () => [] },
];
function ganzesTask(level: number): Task | null {
  return genFrom(() => {
    const [n, d] = properFrac(level <= 2 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8, 10]);
    if (n === 1 && Math.random() < 0.5) return null;
    const c = pick(GANZ_CTX), i = GANZ_CTX.indexOf(c);
    const k = i === 0 ? R(2, Math.floor(32 / d)) : i === 1 ? pick([20, 25, 30, 40, 50, 60, 80, 100, 120]) : i === 3 ? pick([10, 20, 25, 30, 40, 50]) : i === 4 ? R(5, 30) : R(2, 15);
    const T = n * k, W = d * k;
    if (i === 0 && (W < 18 || W > 32)) return null;
    const e = ev(`${T} : ${n}`), whole = ev(`${vH(e)} · ${d}`);
    if (!whole.eq(q(W))) return null;
    const u = c.u;
    const steps = [
      { rule: 'Ein Teil', lines: [`${M(fr(n, d))} sind ${T} ${u}. Das sind ${n} von ${d} gleichen Teilen.`, `Ein Teil, also ${M(fr(1, d))}: ${calcH(`${T} : ${n}`, u)}`] },
      { rule: 'Das Ganze', lines: [`Das Ganze hat ${d} solche Teile: ${calcH(`${vH(e)} · ${d}`, u)}`] },
    ];
    const guide: GuideStep[] = [
      { title: 'Ein Teil', choose: { ask: 'Was ist gegeben?', options: opts(`der Teil ${M(fr(n, d))}`, ['das Ganze', `der Teil ${M(fr(1, d))}`]), why: `${T} ${u} gehören zu ${M(fr(n, d))}. Das Ganze ist gesucht.` }, ask: `<p>${T} ${u} sind ${n} Teile. Wie viel ist <b>ein</b> Teil (${M(fr(1, d))})?</p>${big(`${T} : ${n} = ?`)}`, answer: e, hint: `Teile durch den Zähler ${n}, denn ${T} ${u} sind ${n} Teile.`, explain: calcH(`${T} : ${n}`, u), placeholder: `Antwort in ${u}` },
      { title: 'Das Ganze', ask: `<p>Das Ganze hat ${d} Teile. Wie viel ist das?</p>${big(`${vH(e)} · ${d} = ?`)}`, answer: whole, hint: `Der Nenner ${d} sagt, wie viele Teile das Ganze hat.`, explain: calcH(`${vH(e)} · ${d}`, u), placeholder: `Antwort in ${u}` },
    ];
    return task(c.s(M(fr(n, d)), T), whole, `${vH(whole)} ${u}`, steps, guide, {
      placeholder: `Antwort in ${u}`,
      diag: diagOf(whole, [
        [q(T * n, d), `Du hast ${M(fr(n, d))} von ${T} ausgerechnet. Aber ${T} ist schon der Teil. Gesucht ist das <b>Ganze</b>, und das ist größer.`],
        [e, `Das ist erst ein Teil, also ${M(fr(1, d))}. Das Ganze hat ${d} solche Teile.`],
        [q(T * d), `Du hast vergessen, erst durch den Zähler ${n} zu teilen. ${T} ${u} sind ja ${n} Teile, nicht einer.`],
        [q(T, d), `Hier ist der Teil gegeben, nicht das Ganze. Das Ganze muss größer sein als ${T}.`],
      ]),
    });
  }, () => true);
}

/** Anteil von einer Größe mit Umrechnen: 3/4 h = ? min */
const EINH: { big: string; small: string; f: number }[] = [
  { big: 'h', small: 'min', f: 60 },
  { big: 'kg', small: 'g', f: 1000 },
  { big: 'm', small: 'cm', f: 100 },
  { big: 'km', small: 'm', f: 1000 },
  { big: 'l', small: 'ml', f: 1000 },
];
function anteilEinheit(): Task | null {
  return genFrom(() => {
    const E = pick(EINH), [n, d] = properFrac([2, 3, 4, 5, 6, 8, 10, 12]);
    if (E.f % d !== 0 || n === 1 && Math.random() < 0.6) return null;
    const e = ev(`${E.f} : ${d}`), r = ev(`${E.f} : ${d} · ${n}`);
    return task(`Wie viel sind ${M(fr(n, d))} ${E.big}? Gib das Ergebnis in ${E.small} an.`, r, `${vH(r)} ${E.small}`,
      [{ rule: 'Umrechnen', lines: [`1 ${E.big} = ${E.f} ${E.small}`] }, { rule: 'Ein Teil', lines: [calcH(`${E.f} : ${d}`, E.small)] }, { rule: `${n} Teile`, lines: [calcH(`${vH(e)} · ${n}`, E.small)] }],
      [{ title: 'Umrechnen', ask: `<p>Rechne erst um. Wie viele ${E.small} sind 1 ${E.big}?</p>`, answer: q(E.f), hint: `Denk an die Umrechnungszahl von ${E.big} in ${E.small}.`, explain: `1 ${E.big} = ${E.f} ${E.small}`, placeholder: E.small },
       { title: `${1}/${d} ausrechnen`, ask: `<p>Teile durch den Nenner.</p>${big(`${E.f} : ${d} = ?`)}`, answer: e, hint: `${E.f} in ${d} gleiche Teile.`, explain: calcH(`${E.f} : ${d}`, E.small), placeholder: E.small },
       { title: `${n}/${d} ausrechnen`, ask: `<p>Nimm mit dem Zähler mal.</p>${big(`${vH(e)} · ${n} = ?`)}`, answer: r, hint: `Der Zähler ist ${n}.`, explain: calcH(`${vH(e)} · ${n}`, E.small), placeholder: E.small }],
      { placeholder: `Antwort in ${E.small}`, diag: diagOf(r, [[q(n, d), `Rechne in ${E.small} um: 1 ${E.big} = ${E.f} ${E.small}.`], [n > 1 ? e : null, `Das ist erst ${M(fr(1, d))} ${E.big}. Nimm noch mit ${n} mal.`], [q(E.f * d, n), 'Durch den Nenner teilen, mit dem Zähler mal. Nicht andersherum.'], [E.f !== 100 ? q(n * 100, d) : null, `1 ${E.big} sind nicht 100 ${E.small}, sondern ${E.f} ${E.small}.`]]) });
  }, () => true);
}

/* ---------- Echte und unechte Brüche, gemischte Zahlen ---------- */
function echtPick(): Task | null {
  const wantUnecht = Math.random() < 0.5;
  const mk = (u: boolean): [number, number] => { for (;;) { const d = R(2, 9); const n = u ? (Math.random() < 0.25 ? d : R(d + 1, 3 * d)) : R(1, d - 1); if (ggt(n, d) === 1 || n === d) return [n, d]; } };
  const right = mk(wantUnecht), wrongF: [number, number][] = [];
  const keys = new Set([right.join('/')]);
  while (wrongF.length < 3) { const f = mk(!wantUnecht); if (!keys.has(f.join('/'))) { keys.add(f.join('/')); wrongF.push(f); } }
  // Eine typische Falle: bei den echten Brüchen ein großer Nenner, bei den unechten auch einer mit Zähler = Nenner.
  const all = shuffle([right, ...wrongF]), ok = all.indexOf(right);
  const nEcht = all.filter(([n, d]) => echt(n, d)).length;
  const w = wantUnecht ? 'unechter' : 'echter';
  return pickFrom(`Welcher Bruch ist ein <b>${w}</b> Bruch?`, all.map(([n, d]) => M(fr(n, d))), ok,
    [{ rule: 'Regel', lines: ['Echter Bruch: Zähler kleiner als Nenner. Er ist kleiner als 1.', 'Unechter Bruch: Zähler gleich groß wie der Nenner oder größer. Er ist 1 oder mehr.'] },
     { rule: 'Prüfen', lines: all.map(([n, d]) => `${M(fr(n, d))}: ${n} ${n < d ? '&lt;' : n === d ? '=' : '&gt;'} ${d}, also ${echt(n, d) ? 'echt' : 'unecht'}`) }],
    [{ title: 'Die Regel', choose: { ask: 'Wann ist ein Bruch echt?', options: opts('Der Zähler ist kleiner als der Nenner.', ['Der Zähler ist größer als der Nenner.', 'Zähler und Nenner sind gleich.', 'Der Nenner ist eine gerade Zahl.']), why: 'Ein echter Bruch ist weniger als ein Ganzes. Dafür muss der Zähler kleiner sein.' },
      ask: '<p>Wie viele der vier Brüche sind <b>echte</b> Brüche?</p>', answer: q(nEcht), hint: 'Vergleiche bei jedem Bruch Zähler (oben) und Nenner (unten).', explain: `${nEcht} echte Brüche. Such jetzt den ${w}n Bruch.`, placeholder: 'Anzahl' }],
    { label: M(fr(right[0], right[1])) });
}
/** Wahr oder falsch? Mit Begründung. */
function echtWF(): Task | null {
  const k = R(0, 3);
  let stmt: string, right: string, wrong: string[], step: GuideStep, rule: string;
  if (k === 0) {
    const a = R(2, 12);
    stmt = `${M(fr(a, a))} ist ein echter Bruch.`;
    right = `Falsch, denn der Zähler ist nicht kleiner als der Nenner. ${M(fr(a, a))} ist genau 1 Ganzes, also unecht.`;
    wrong = ['Wahr, denn Zähler und Nenner sind gleich groß.', 'Wahr, denn jeder Bruch ist kleiner als 1.', 'Falsch, denn bei einem echten Bruch ist der Zähler größer als der Nenner.'];
    step = { title: 'Wie viel ist das?', ask: `<p>Wie viele Ganze sind ${M(fr(a, a))}?</p>`, answer: q(1), hint: `${a} von ${a} Teilen: alles ist gefärbt.`, explain: `${M(`${fr(a, a)} = 1`)}. Ein echter Bruch ist aber kleiner als 1.`, placeholder: 'Zahl' };
    rule = `${M(fr(a, a))} = 1. Ein echter Bruch ist kleiner als 1. Die Aussage ist falsch.`;
  } else if (k === 1) {
    let n: number, d: number; do { d = R(2, 9); n = R(d + 1, 3 * d); } while (ggt(n, d) !== 1);
    const g = Math.floor(n / d);
    stmt = `${M(fr(n, d))} ist größer als 1.`;
    right = `Wahr, denn der Zähler ist größer als der Nenner. Es sind mehr Teile als ein Ganzes hat.`;
    wrong = ['Falsch, denn ein Bruch ist immer kleiner als 1.', `Falsch, denn der Nenner ${d} ist kleiner als der Zähler.`, 'Wahr, denn der Nenner ist größer als der Zähler.'];
    step = { title: 'Ganze zählen', ask: `<p>Wie viele <b>ganze</b> Ganze stecken in ${M(fr(n, d))}? Wie oft passt ${d} ganz in ${n}?</p>`, answer: q(g), hint: `${d} · ${g} = ${d * g}.`, explain: `${d} passt ${g}-mal in ${n}. Also ist ${M(fr(n, d))} mindestens ${g}, und das ist mindestens 1.`, placeholder: 'Zahl' };
    rule = `${n} &gt; ${d}: unechter Bruch, größer als 1. Die Aussage ist wahr.`;
  } else if (k === 2) {
    let n: number, d: number; do { d = R(3, 9); n = R(d + 1, 4 * d); } while (ggt(n, d) !== 1);
    const g = Math.floor(n / d), rest = n % d, ok = Math.random() < 0.5;
    const wrongMix = pick([`${rest}&#8202;${fracH(g, d)}`, `${g + 1}&#8202;${fracH(rest, d)}`, `${g}&#8202;${fracH(rest, n)}`].filter(x => x !== mixedH(q(n, d))));
    const shown = ok ? mixedH(q(n, d))! : wrongMix;
    stmt = `${M(fr(n, d))} kann man als gemischte Zahl ${M(shown)} schreiben.`;
    right = ok ? `Wahr, denn ${d} · ${g} = ${d * g} und ${d * g} + ${rest} = ${n}.` : `Falsch, denn ${d} passt ${g}-mal in ${n}, es bleiben ${rest} übrig. Richtig ist ${M(mixedH(q(n, d))!)}.`;
    wrong = ok ? [`Falsch, denn ein unechter Bruch lässt sich nicht als gemischte Zahl schreiben.`, `Falsch, denn ${n} : ${d} geht nicht auf.`, `Wahr, denn ${n} − ${d} = ${n - d}.`] : [`Wahr, denn ${d} · ${g} = ${d * g} und ${d * g} + ${rest} = ${n}.`, `Falsch, denn ein unechter Bruch lässt sich nicht als gemischte Zahl schreiben.`, `Wahr, denn ${n} − ${d} = ${n - d}.`];
    step = { title: 'Ganze zählen', ask: `<p>Wie oft passt ${d} ganz in ${n}?</p>`, answer: q(g), hint: `Geh die Vielfachen von ${d} durch.`, explain: `${d} · ${g} = ${d * g}, Rest ${rest}. Also ${M(`${fr(n, d)} = ${mixedH(q(n, d))}`)}.`, placeholder: 'Zahl' };
    rule = `${M(`${fr(n, d)} = ${mixedH(q(n, d))}`)}. Die Aussage ist ${ok ? 'wahr' : 'falsch'}.`;
  } else {
    let n: number, d: number; do { d = R(3, 12); n = R(1, d - 1); } while (ggt(n, d) !== 1);
    stmt = `${M(fr(n, d))} ist ein echter Bruch.`;
    right = `Wahr, denn der Zähler ${n} ist kleiner als der Nenner ${d}. Es fehlen noch Teile bis zu einem Ganzen.`;
    wrong = [`Falsch, denn der Nenner ${d} ist größer als der Zähler.`, 'Falsch, denn echte Brüche müssen gekürzt sein.', `Wahr, denn ${d} ist größer als 10.`].filter(s => d > 10 || !s.includes('größer als 10'));
    if (wrong.length < 3) wrong.push('Falsch, denn ein echter Bruch ist größer als 1.');
    step = { title: 'Bis zum Ganzen', ask: `<p>Wie viele ${d}tel fehlen ${M(fr(n, d))} noch bis zu einem Ganzen?</p>`, answer: q(d - n), hint: `Ein Ganzes sind ${M(fr(d, d))}.`, explain: `Es fehlen ${M(fr(d - n, d))}. Also ist ${M(fr(n, d))} kleiner als 1.`, placeholder: 'Anzahl' };
    rule = `${n} &lt; ${d}: echter Bruch, kleiner als 1. Die Aussage ist wahr.`;
  }
  return pickTask(`Stimmt die Aussage? Wähle die richtige Antwort mit Begründung.<div class="math big" style="font-size: 1.1em">„${stmt}“</div>`, right, wrong,
    [{ rule: 'Prüfen', lines: [rule] }], [step], { label: right });
}
function mixedTask(): Task | null {
  return genFrom(() => {
    const d = R(2, 9), n = R(d + 1, 5 * d);
    if (ggt(n, d) !== 1) return null;
    const g = Math.floor(n / d), rest = n % d, v = ev(`${n} : ${d}`), toMix = Math.random() < 0.6, asDiv = toMix && Math.random() < 0.4;
    if (toMix) {
      return task(asDiv ? `Rechne ${M(`${n} : ${d}`)} und schreib das Ergebnis als <b>gemischte Zahl</b>.` : `Schreibe ${M(fr(n, d))} als <b>gemischte Zahl</b>.`, v, mixedH(v)!,
        [{ rule: 'Ganze', lines: [`${M(fr(n, d))} = ${M(`${n} : ${d}`)}. ${d} passt ${g}-mal in ${n}: ${d} · ${g} = ${d * g}.`] }, { rule: 'Rest', lines: [`${n} − ${d * g} = ${rest}. Das sind noch ${M(fr(rest, d))}.`, M(`${fr(n, d)} = ${mixedH(v)}`)] }],
        [{ title: 'Ganze', ask: `<p>Wie oft passt ${d} ganz in ${n}?</p>`, answer: q(g), hint: `Geh die Vielfachen von ${d} durch, bis du über ${n} kommst.`, explain: `${d} · ${g} = ${d * g}. Das sind ${g} Ganze.`, placeholder: 'Zahl' },
         { title: 'Rest', ask: `<p>Wie viel bleibt übrig? ${M(`${n} − ${d * g} = ?`)}</p>`, answer: q(rest), hint: 'Der Rest wird der Zähler.', explain: `Rest ${rest}, also noch ${M(fr(rest, d))}.`, placeholder: 'Rest' },
         { title: 'Gemischte Zahl', ask: `<p>Schreib die gemischte Zahl: erst die Ganzen, dann ein Leerzeichen, dann den Bruch.</p>`, answer: v, hint: `Zum Beispiel ${g} ${rest}/${d}`, explain: M(`${fr(n, d)} = ${mixedH(v)}`), placeholder: 'z. B. 3 2/5' }],
        { form: 'mixed', placeholder: 'z. B. 3 2/5', diag: diagOf(v, [[q(g * 1).add(q(d, rest > 0 ? rest : 1)), 'Zähler und Nenner vom Rest sind vertauscht. Der Nenner bleibt gleich.'], [q(rest).add(q(g, d)), 'Ganze und Rest sind vertauscht. Die Ganzen stehen vorne.']]) });
    }
    return task(`Schreibe ${M(mixedH(v)!)} als <b>Bruch</b>.`, v, fr(n, d),
      [{ rule: 'Ganze in Teile', lines: [`${g} Ganze sind ${calcH(`${g} · ${d}`)} ${d}tel.`] }, { rule: 'Dazuzählen', lines: [`${d * g} + ${rest} = ${n}, also ${M(`${mixedH(v)} = ${fr(n, d)}`)}`] }],
      [{ title: 'Ganze in Teile', ask: `<p>Wie viele ${d}tel sind ${g} Ganze?</p>${big(`${g} · ${d} = ?`)}`, answer: q(g * d), hint: `Ein Ganzes sind ${d} ${d}tel.`, explain: calcH(`${g} · ${d}`), placeholder: 'Anzahl' },
       { title: 'Bruch', ask: `<p>Zähl noch die ${rest} ${d}tel dazu. Wie heißt der Bruch?</p>`, answer: v, hint: `Zähler: ${g * d} + ${rest}. Der Nenner bleibt ${d}.`, explain: M(`${mixedH(v)} = ${fr(n, d)}`), placeholder: 'z. B. 17/5' }],
      { form: 'frac', placeholder: 'z. B. 17/5', diag: diagOf(v, [[q(g * rest, d), 'Du hast die Ganzen mit dem Zähler malgenommen. Nimm die Ganzen mit dem <b>Nenner</b> mal und zähl den Zähler dazu.'], [q(g + rest, d), `Ein Ganzes sind ${d} ${d}tel, nicht 1. Rechne ${g} · ${d} + ${rest}.`]]) });
  }, () => true);
}

/* ---------- Anteile aus Diagrammen ---------- */
const BAR_SETS: { title: string; who: string; labels: string[]; ask: (l: string) => string }[] = [
  { title: 'Die Klasse 6a hat abgestimmt: Welches Haustier ist dein Lieblingstier?', who: 'Kinder', labels: ['Hund', 'Katze', 'Pferd', 'Hase'], ask: l => `Welcher Anteil der Kinder hat <b>${l}</b> gewählt?` },
  { title: 'So kommen die Kinder der Klasse 6b zur Schule:', who: 'Kinder', labels: ['Bus', 'Rad', 'zu Fuß', 'Auto'], ask: l => `Welcher Anteil der Kinder kommt mit <b>${l === 'Rad' ? 'dem Rad' : l === 'Bus' ? 'dem Bus' : l === 'Auto' ? 'dem Auto' : 'zu Fuß'}</b>${l === 'zu Fuß' ? '' : ''}?`.replace('mit <b>zu Fuß</b>', '<b>zu Fuß</b>') },
  { title: 'Beim Sportfest haben die Kinder eine Sportart gewählt:', who: 'Kinder', labels: ['Laufen', 'Weitsprung', 'Werfen'], ask: l => `Welcher Anteil der Kinder hat <b>${l}</b> gewählt?` },
];
function diagramTask(): Task | null {
  return genFrom(() => {
    if (Math.random() < 0.5) {
      const S = pick(BAR_SETS), vals = S.labels.map(() => R(1, 10)), T = vals.reduce((a, b) => a + b, 0), i = R(0, vals.length - 1), v = vals[i];
      if (T < 12 || T > 32 || ggt(v, T) === 1 && Math.random() < 0.6) return null;
      const a = ev(`${v}/${T}`), sumS = vals.join(' + ');
      return task(`${S.title}${barSVG(S.labels, vals, S.who)}${S.ask(S.labels[i])} Gib den Anteil als <b>gekürzten Bruch</b> an.`, a, qH(a),
        [{ rule: 'Alle zusammen', lines: [calcH(sumS, S.who)] }, { rule: 'Anteil', lines: [`Anteil = Teil : Ganzes = ${M(fr(v, T))}${a.d !== BigInt(T) ? ` = ${M(qH(a))}` : ''}`] }],
        [{ title: 'Das Ganze', ask: `<p>Wie viele ${S.who} sind es insgesamt? Zähle alle Säulen zusammen.</p>`, answer: q(T), hint: `Lies jede Säule ab und rechne ${sumS}.`, explain: calcH(sumS, S.who), placeholder: 'Anzahl' },
         { title: 'Der Teil', ask: `<p>Wie viele davon gehören zu <b>${S.labels[i]}</b>?</p>`, answer: q(v), hint: 'Lies die Höhe der Säule ab.', explain: `${v} ${S.who}.`, placeholder: 'Anzahl' },
         { title: 'Anteil', ask: `<p>Schreib den Anteil als Bruch <b>Teil durch Ganzes</b> und kürze ihn.</p>`, answer: a, needReduced: true, hint: `Der Teil kommt in den Zähler, das Ganze in den Nenner: ${v}/${T}.`, explain: `${M(fr(v, T))}${a.d !== BigInt(T) ? ` = ${M(qH(a))}` : ''}`, placeholder: 'z. B. 3/8' }],
        { form: 'frac', needReduced: true, placeholder: 'z. B. 3/8', diag: diagOf(a, [[q(v, T - v), 'Du hast den Teil mit den <b>anderen</b> verglichen. Das ist ein Verhältnis. Beim Anteil kommt in den Nenner die Anzahl von <b>allen</b>.'], [q(T, v), 'Zähler und Nenner sind vertauscht. Der Teil steht oben, das Ganze unten.']]) });
    }
    const D = pick([8, 10, 12]), names = shuffle(['Bus', 'Rad', 'zu Fuß', 'Auto']).slice(0, 3);
    const k1 = R(2, D - 4), k2 = R(2, D - k1 - 2), k3 = D - k1 - k2;
    if (k3 < 2) return null;
    const cats = [{ name: names[0], k: k1 }, { name: names[1], k: k2 }, { name: names[2], k: k3 }], i = R(0, 2), kk = cats[i].k, a = ev(`${kk}/${D}`);
    const how = cats[i].name === 'zu Fuß' ? '<b>zu Fuß</b>' : `mit dem <b>${cats[i].name === 'Rad' ? 'Rad' : cats[i].name}</b>`;
    return task(`Das Kreisdiagramm zeigt, wie die Kinder der Klasse 6c zur Schule kommen. Der Kreis ist in gleich große Stücke geteilt.${pieCatSVG(cats, D, i)}Welcher Anteil der Kinder kommt ${how} (gefärbt)? Gib den Anteil als <b>gekürzten Bruch</b> an.`, a, qH(a),
      [{ rule: 'Stücke zählen', lines: [`Der ganze Kreis hat ${D} gleiche Stücke. ${cats[i].name}: ${kk} Stücke.`] }, { rule: 'Anteil', lines: [`${M(fr(kk, D))}${a.d !== BigInt(D) ? ` = ${M(qH(a))}` : ''}`] }],
      [{ title: 'Das Ganze', ask: '<p>In wie viele gleich große Stücke ist der ganze Kreis geteilt?</p>', answer: q(D), hint: 'Zähle alle Stücke, auch die gestrichelt getrennten.', explain: `${D} Stücke.`, placeholder: 'Anzahl' },
       { title: 'Der Teil', ask: '<p>Wie viele Stücke sind gefärbt?</p>', answer: q(kk), hint: 'Zähle nur im gefärbten Bereich.', explain: `${kk} Stücke.`, placeholder: 'Anzahl' },
       { title: 'Anteil', ask: '<p>Schreib den Anteil als Bruch und kürze ihn vollständig.</p>', answer: a, needReduced: true, hint: `${kk}/${D}: Suche eine Zahl, durch die beide teilbar sind.`, explain: `${M(fr(kk, D))}${a.d !== BigInt(D) ? ` = ${M(qH(a))}` : ''}`, placeholder: 'z. B. 3/8' }],
      { form: 'frac', needReduced: true, placeholder: 'z. B. 3/8', diag: diagOf(a, [[q(kk, D - kk), 'Du hast die gefärbten mit den weißen Stücken verglichen. Beim Anteil steht unten die Anzahl <b>aller</b> Stücke.'], [q(D - kk, D), 'Das ist der Anteil der anderen Kinder. Gefragt ist der gefärbte Teil.']]) });
  }, () => true);
}

/* ======================================================================
   Teil 2: Brüche als Quotienten, Größen teilen
   ====================================================================== */
function quotTask(): Task | null {
  return genFrom(() => {
    const b = R(2, 12), a = R(1, Math.random() < 0.7 ? b - 1 : 2 * b);
    if (a % b === 0 || ggt(a, b) !== 1) return null;
    const v = q(a, b);
    return task(`Schreibe ${M(`${a} : ${b}`)} als Bruch.`, v, fr(a, b),
      [{ rule: 'Bruch als Quotient', lines: [`Die Zahl, die geteilt wird, kommt in den Zähler. Die Zahl, durch die geteilt wird, in den Nenner.`, M(`${a} : ${b} = ${fr(a, b)}`)] }],
      [{ title: 'Zähler', ask: `<p>Welche Zahl wird geteilt? Sie kommt in den Zähler (oben).</p>`, answer: q(a), hint: 'Die Zahl vor dem Geteiltzeichen.', explain: `${a} kommt nach oben.`, placeholder: 'Zahl' },
       { title: 'Bruch', ask: `<p>Wie heißt der Bruch?</p>`, answer: v, hint: `Zähler/Nenner, also ${a}/${b}.`, explain: M(`${a} : ${b} = ${fr(a, b)}`), placeholder: 'z. B. 3/4' }],
      { form: 'frac', placeholder: 'z. B. 3/4', diag: diagOf(v, [[q(b, a), 'Zähler und Nenner sind vertauscht. Die erste Zahl (die geteilt wird) kommt nach oben.']]) });
  }, () => true);
}
function divPick(): Task | null {
  let a: number, b: number; do { b = R(2, 12); a = R(1, 2 * b); } while (a === b || ggt(a, b) !== 1 || a % b === 0);
  const f = M(fr(a, b));
  return pickTask(`Welche Rechnung hat das Ergebnis ${f}?`, M(`${a} : ${b}`), [M(`${b} : ${a}`), M(`${a} · ${b}`), M(`${b} − ${a}`)],
    [{ rule: 'Bruch als Quotient', lines: [`Ein Bruch ist eine Geteiltaufgabe: Zähler geteilt durch Nenner.`, M(`${fr(a, b)} = ${a} : ${b}`)] }],
    [{ title: 'Was wird geteilt?', ask: `<p>Bei ${f} wird der Zähler durch den Nenner geteilt. Welche Zahl wird geteilt?</p>`, answer: q(a), hint: 'Der Zähler steht oben.', explain: `${a} wird durch ${b} geteilt: ${M(`${a} : ${b}`)}.`, placeholder: 'Zahl' }],
    { label: M(`${a} : ${b}`) });
}

/** Größen teilen: Band, Pizza, Saft */
function teilenTask(): Task | null {
  return genFrom(() => {
    const k = R(0, 3);
    if (k === 0 || k === 1) {
      // Band in Stücke
      const L = R(1, 7), s = pick([2, 3, 4, 5, 8, 10]);
      if (L % s === 0 || ggt(L, s) !== 1) return null;
      const inCm = k === 1;
      const v = inCm ? ev(`${L * 100} : ${s}`) : ev(`${L} : ${s}`);
      if (inCm && !v.isInt()) return null;
      const what = pick(['Band', 'Seil', 'Holzleiste']), art = what === 'Holzleiste' ? 'Eine' : 'Ein', lang = what === 'Holzleiste' ? 'lange' : 'langes';
      const prompt = `${art} ${L} m ${lang} ${what} wird in ${s} gleich lange Stücke geteilt. Wie lang ist ein Stück? ${inCm ? 'Gib das Ergebnis in <b>cm</b> an.' : 'Gib das Ergebnis in <b>m als Bruch</b> an.'}`;
      if (!inCm) return task(prompt, v, `${qH(v)} m`,
        [{ rule: 'Teilen', lines: [`${L} m werden in ${s} Teile geteilt: ${M(`${L} m : ${s} = ${fr(L, s)} m`)}`] }],
        [{ title: 'Rechnung', choose: { ask: 'Welche Rechnung passt?', options: opts(M(`${L} : ${s}`), [M(`${s} : ${L}`), M(`${L} · ${s}`)]), why: 'Die Länge wird verteilt, also geteilt durch die Anzahl der Stücke.' }, ask: `<p>Schreib ${M(`${L} : ${s}`)} als Bruch.</p>`, answer: v, hint: `Die Zahl, die geteilt wird, kommt nach oben: ${L}/${s}.`, explain: M(`${L} : ${s} = ${fr(L, s)}`), placeholder: 'z. B. 3/4' }],
        { form: 'frac', placeholder: 'z. B. 3/4 m', diag: diagOf(v, [[q(s, L), 'Vertauscht: Die Länge, die verteilt wird, kommt in den Zähler (oben).'], [q(L * s), 'Beim Teilen wird ein Stück kürzer, nicht länger. Rechne geteilt.']]) });
      return task(prompt, v, `${vH(v)} cm`,
        [{ rule: 'Umrechnen', lines: [`${L} m = ${L * 100} cm`] }, { rule: 'Teilen', lines: [calcH(`${L * 100} : ${s}`, 'cm')] }],
        [{ title: 'Umrechnen', ask: `<p>Wie viele cm sind ${L} m?</p>`, answer: q(L * 100), hint: '1 m = 100 cm.', explain: `${L} m = ${L * 100} cm`, placeholder: 'cm' },
         { title: 'Teilen', ask: `<p>Teile in ${s} gleiche Stücke.</p>${big(`${L * 100} : ${s} = ?`)}`, answer: v, hint: `Wie oft passt ${s} in ${L * 100}?`, explain: calcH(`${L * 100} : ${s}`, 'cm'), placeholder: 'cm' }],
        { placeholder: 'Antwort in cm', diag: diagOf(v, [[q(L, s), 'Das ist das Ergebnis in m. Rechne in cm um: 1 m = 100 cm.'], [q(s * 100, L), 'Vertauscht: Die Länge wird durch die Anzahl der Stücke geteilt.']]) });
    }
    if (k === 2) {
      // Pizza
      const p = R(1, 9), c = R(2, 10);
      if (p === c || ggt(p, c) !== 1 || p % c === 0) return null;
      const v = ev(`${p} : ${c}`), mixed = p > c;
      return task(`${p} ${p === 1 ? 'Pizza wird' : 'Pizzen werden'} gerecht an ${c} Kinder verteilt. Wie viel Pizza bekommt jedes Kind? Gib das Ergebnis als ${mixed ? '<b>gemischte Zahl</b>' : '<b>Bruch</b>'} an.`, v, mixed ? mixedH(v)! : qH(v),
        [{ rule: 'Verteilen', lines: [`Verteilen heißt teilen: ${M(`${p} : ${c} = ${fr(p, c)}`)}${mixed ? ` = ${M(mixedH(v)!)}` : ''}`, 'Jedes Kind bekommt so viel Pizza.'] }],
        [{ title: 'Rechnung', choose: { ask: 'Welche Rechnung passt?', options: opts(M(`${p} : ${c}`), [M(`${c} : ${p}`), M(`${p} · ${c}`)]), why: 'Die Pizzen werden auf die Kinder verteilt: Pizzen geteilt durch Kinder.' }, ask: `<p>Schreib ${M(`${p} : ${c}`)} als Bruch.</p>`, answer: v, hint: `${p}/${c}`, explain: M(`${p} : ${c} = ${fr(p, c)}`), placeholder: 'z. B. 3/4' },
         ...(mixed ? [{ title: 'Gemischte Zahl', ask: `<p>Schreib ${M(fr(p, c))} als gemischte Zahl.</p>`, answer: v, hint: `${c} passt ${Math.floor(p / c)}-mal in ${p}. Rest ${p % c}.`, explain: M(`${fr(p, c)} = ${mixedH(v)}`), placeholder: 'z. B. 1 1/4' }] : [])],
        { form: mixed ? 'mixed' : 'frac', placeholder: mixed ? 'z. B. 1 1/4' : 'z. B. 3/4', diag: diagOf(v, [[q(c, p), 'Vertauscht: Die Pizzen werden verteilt, sie kommen in den Zähler (oben).']]) });
    }
    // Saft auf Gläser in ml
    const L = R(1, 3), g = pick([4, 5, 8]), v = ev(`${L * 1000} : ${g}`);
    return task(`${L} ${L === 1 ? 'Liter' : 'Liter'} Saft ${L === 1 ? 'wird' : 'werden'} gleichmäßig auf ${g} Gläser verteilt. Wie viel ml sind in jedem Glas?`, v, `${vH(v)} ml`,
      [{ rule: 'Umrechnen', lines: [`${L} l = ${L * 1000} ml`] }, { rule: 'Verteilen', lines: [calcH(`${L * 1000} : ${g}`, 'ml')] }],
      [{ title: 'Umrechnen', ask: `<p>Wie viele ml sind ${L} l?</p>`, answer: q(L * 1000), hint: '1 l = 1000 ml.', explain: `${L} l = ${L * 1000} ml`, placeholder: 'ml' },
       { title: 'Verteilen', ask: `<p>Verteile auf ${g} Gläser.</p>${big(`${L * 1000} : ${g} = ?`)}`, answer: v, hint: 'Verteilen heißt teilen.', explain: calcH(`${L * 1000} : ${g}`, 'ml'), placeholder: 'ml' }],
      { placeholder: 'Antwort in ml', diag: diagOf(v, [[q(L, g), 'Das ist in Litern. Rechne in ml um: 1 l = 1000 ml.']]) });
  }, () => true);
}

/* ======================================================================
   Teil 3: Verhältnisse
   ====================================================================== */
interface Pair { s: (a: number, b: number) => string; intro: string; la: string; lb: string; all: string; anteilQ: (first: boolean) => string; max: number }
const PAIRS: Pair[] = [
  { s: (a, b) => `In der Klasse 6b sind ${a} Mädchen und ${b} Jungen.`, intro: 'In der Klasse 6b', la: 'Mädchen', lb: 'Jungen', all: 'Kinder', anteilQ: f => `Welcher Anteil der Klasse sind ${f ? 'Mädchen' : 'Jungen'}?`, max: 32 },
  { s: (a, b) => `In einer Tüte sind ${a} rote und ${b} grüne Gummibärchen.`, intro: 'In einer Tüte Gummibärchen', la: 'rot', lb: 'grün', all: 'Gummibärchen', anteilQ: f => `Welcher Anteil der Gummibärchen ist ${f ? 'rot' : 'grün'}?`, max: 60 },
  { s: (a, b) => `Im Sportverein spielen ${a} Kinder Fußball und ${b} Kinder Handball.`, intro: 'Im Sportverein', la: 'Fußball', lb: 'Handball', all: 'Kinder', anteilQ: f => `Welcher Anteil der Kinder spielt ${f ? 'Fußball' : 'Handball'}?`, max: 80 },
  { s: (a, b) => `In einer Obstkiste liegen ${a} Äpfel und ${b} Birnen.`, intro: 'In einer Obstkiste', la: 'Äpfel', lb: 'Birnen', all: 'Obststücke', anteilQ: f => `Welcher Anteil des Obstes sind ${f ? 'Äpfel' : 'Birnen'}?`, max: 60 },
  { s: (a, b) => `Beim Ausflug sind ${a} Erwachsene und ${b} Kinder dabei.`, intro: 'Beim Ausflug', la: 'Erwachsene', lb: 'Kinder', all: 'Personen', anteilQ: f => `Welcher Anteil der Gruppe sind ${f ? 'Erwachsene' : 'Kinder'}?`, max: 40 },
];
const coprime = (lo: number, hi: number): [number, number] => { for (;;) { const x = R(lo, hi), y = R(lo, hi); if (x !== y && ggt(x, y) === 1) return [x, y]; } };
const rH = (x: number | string, y: number | string) => M(`${x} : ${y}`);

function verhKuerzen(): Task | null {
  return genFrom(() => {
    const P = pick(PAIRS), [x, y] = coprime(1, 7), g = R(2, 8), a = g * x, b = g * y;
    if (a + b > P.max || a + b < 8) return null;
    const lab = `${P.la} : ${P.lb}`;
    const steps = [{ rule: 'Verhältnis aufschreiben', lines: [`${lab} = ${a} : ${b}`] }, { rule: 'Kürzen', lines: [`Beide Zahlen durch ${g} teilen: ${a} : ${g} = ${x} und ${b} : ${g} = ${y}.`, `${lab} = ${x} : ${y}`] }];
    const g1: GuideStep = { title: 'Kürzungszahl', ask: `<p>Durch welche größte Zahl kannst du ${a} und ${b} beide teilen?</p>`, answer: q(g), hint: `Geh die Teiler von ${Math.min(a, b)} durch.`, explain: `Der ggT von ${a} und ${b} ist ${g}.`, placeholder: 'Zahl' };
    if (Math.random() < 0.5) {
      const second = Math.random() < 0.6, ans = second ? q(y) : q(x);
      return task(`${P.s(a, b)} Gib das Verhältnis ${P.la} zu ${P.lb} vollständig gekürzt an.${big(`${lab} = ${second ? `${x} : ?` : `? : ${y}`}`)}`, ans, `${lab} = ${x} : ${y}`, steps,
        [g1, { title: 'Kürzen', ask: `<p>Teile ${second ? b : a} durch ${g}.</p>${big(`${second ? b : a} : ${g} = ?`)}`, answer: ans, hint: 'Beim Kürzen teilst du beide Zahlen durch dieselbe Zahl.', explain: `${lab} = ${x} : ${y}`, placeholder: 'Zahl' }],
        { placeholder: 'Zahl', diag: diagOf(ans, [[q(second ? b : a), 'Das ist die ungekürzte Anzahl. Teile auch diese Zahl durch dieselbe Zahl wie die andere.'], [q(x + y), `${x} + ${y} ist das Ganze. Beim Verhältnis vergleichst du Teil mit Teil, nicht mit dem Ganzen.`], [q(second ? x : y), 'Die Reihenfolge ist vertauscht. Zuerst steht, was zuerst genannt wird.']]) });
    }
    const half = g % 2 === 0 && g > 2 ? rH(2 * x, 2 * y) : g % 3 === 0 && g > 3 ? rH(3 * x, 3 * y) : rH(a, b);
    return pickTask(`${P.s(a, b)} Welches ist das <b>vollständig gekürzte</b> Verhältnis ${P.la} zu ${P.lb}?`, rH(x, y), [rH(y, x), rH(x, x + y), half], steps,
      [g1, { title: 'Kürzen', ask: `<p>Teile ${a} durch ${g}.</p>`, answer: q(x), hint: 'Beide Zahlen durch dieselbe Zahl teilen.', explain: `${a} : ${g} = ${x} und ${b} : ${g} = ${y}. Also ${rH(x, y)}.`, placeholder: 'Zahl' }],
      { label: rH(x, y) });
  }, () => true);
}

interface Mix { s: (x: number, y: number, A: number, first: boolean) => string; n1: string; n2: string; u: string; ratios: [number, number][]; base: number[] }
const MIX: Mix[] = [
  { s: (x, y, A, f) => `Für Holundersaft mischt man Sirup und Wasser im Verhältnis ${x} : ${y}. Du nimmst ${A} ml ${f ? 'Sirup' : 'Wasser'}. Wie viel ${f ? 'Wasser' : 'Sirup'} brauchst du?`, n1: 'Sirup', n2: 'Wasser', u: 'ml', ratios: [[1, 4], [1, 5], [1, 6], [1, 7], [2, 7], [2, 9]], base: [10, 20, 25, 30, 40, 50] },
  { s: (x, y, A, f) => `Für einen Mürbeteig nimmt man Butter und Mehl im Verhältnis ${x} : ${y}. Du hast ${A} g ${f ? 'Butter' : 'Mehl'}. Wie viel ${f ? 'Mehl' : 'Butter'} brauchst du?`, n1: 'Butter', n2: 'Mehl', u: 'g', ratios: [[1, 2], [2, 3], [2, 5], [3, 5]], base: [25, 40, 50, 60, 80, 100] },
  { s: (x, y, A, f) => `Für Beton mischt man Zement und Sand im Verhältnis ${x} : ${y}. Es sind ${A} kg ${f ? 'Zement' : 'Sand'} da. Wie viel ${f ? 'Sand' : 'Zement'} braucht man?`, n1: 'Zement', n2: 'Sand', u: 'kg', ratios: [[1, 3], [1, 4], [2, 5]], base: [5, 10, 15, 20, 25] },
  { s: (x, y, A, f) => `In der Klasse 6d ist das Verhältnis Mädchen zu Jungen ${x} : ${y}. Es sind ${A} ${f ? 'Mädchen' : 'Jungen'}. Wie viele ${f ? 'Jungen' : 'Mädchen'} sind es?`, n1: 'Mädchen', n2: 'Jungen', u: 'Kinder', ratios: [[2, 3], [3, 4], [4, 3], [3, 2], [5, 4], [4, 5]], base: [2, 3] },
];
function verhTeil(): Task | null {
  return genFrom(() => {
    const X = pick(MIX), [x, y] = pick(X.ratios), k = pick(X.base), first = Math.random() < 0.7;
    const A = (first ? x : y) * k, Bv = (first ? y : x), other = first ? X.n2 : X.n1, given = first ? X.n1 : X.n2;
    const e = ev(`${A} : ${first ? x : y}`), r = ev(`${vH(e)} · ${Bv}`), u = X.u === 'Kinder' ? '' : X.u;
    const steps = [{ rule: 'Ein Teil', lines: [`${given}: ${first ? x : y} Teile sind ${A}${u ? ' ' + u : ''}. Ein Teil: ${calcH(`${A} : ${first ? x : y}`, u)}`] }, { rule: other, lines: [`${other}: ${Bv} Teile. ${calcH(`${vH(e)} · ${Bv}`, u)}`] }];
    const guide: GuideStep[] = [
      { title: 'Ein Teil', ask: `<p>${given} sind ${first ? x : y} Teile. Wie viel ist <b>ein</b> Teil?</p>${big(`${A} : ${first ? x : y} = ?`)}`, answer: e, hint: `Teile durch die Zahl für ${given} im Verhältnis.`, explain: calcH(`${A} : ${first ? x : y}`, u), placeholder: u || 'Anzahl' },
      { title: other, ask: `<p>${other} sind ${Bv} Teile.</p>${big(`${vH(e)} · ${Bv} = ?`)}`, answer: r, hint: `Nimm einen Teil mit ${Bv} mal.`, explain: calcH(`${vH(e)} · ${Bv}`, u), placeholder: u || 'Anzahl' },
    ];
    if ((first ? x : y) === 1) guide.shift();
    return task(X.s(x, y, A, first), r, `${vH(r)}${u ? ' ' + u : ''}`, steps, guide, {
      placeholder: u ? `Antwort in ${u}` : 'Anzahl',
      diag: diagOf(r, [[q(A * Bv), `Erst einen Teil ausrechnen: ${A} : ${first ? x : y}. Dann mit ${Bv} mal.`], [q(A * (first ? x : y), Bv), 'Vertauscht: Teile durch die Zahl, die zu der gegebenen Menge gehört.'], [q(A + Bv), 'Beim Verhältnis wird nicht addiert. Rechne erst aus, wie viel ein Teil ist.'], [q(A), 'Das ist die gegebene Menge. Gesucht ist die andere.']]),
    });
  }, () => true);
}

const SHARE: { s: (x: number, y: number, T: number) => string; n1: string; n2: string; u: string; base: number[] }[] = [
  { s: (x, y, T) => `Anna und Ben teilen sich ${T} Murmeln im Verhältnis ${x} : ${y}. Anna bekommt ${x} Teile, Ben ${y} Teile.`, n1: 'Anna', n2: 'Ben', u: 'Murmeln', base: [2, 3, 4, 5, 6] },
  { s: (x, y, T) => `Mia und Tom haben zusammen ${T} € gewonnen. Sie teilen das Geld im Verhältnis ${x} : ${y}. Mia bekommt ${x} Teile, Tom ${y} Teile.`, n1: 'Mia', n2: 'Tom', u: '€', base: [3, 4, 5, 6, 8, 10] },
  { s: (x, y, T) => `${T} ml Holundersaft bestehen aus Sirup und Wasser im Verhältnis ${x} : ${y}.`, n1: 'Sirup', n2: 'Wasser', u: 'ml', base: [20, 25, 30, 40, 50] },
];
function verhGesamt(): Task | null {
  return genFrom(() => {
    const S = pick(SHARE), i = SHARE.indexOf(S), [x, y] = i === 2 ? pick([[1, 4], [1, 5], [1, 6], [1, 7], [2, 3]] as [number, number][]) : coprime(1, 5), k = pick(S.base), T = (x + y) * k, second = Math.random() < 0.6;
    const who = second ? S.n2 : S.n1, mine = second ? y : x, other = second ? x : y;
    const parts = ev(`${x} + ${y}`), e = ev(`${T} : ${x + y}`), r = ev(`${vH(e)} · ${mine}`), u = i === 0 ? '' : S.u;
    const ask = i === 2 ? `Wie viel ml ${who} sind darin?` : `Wie viele ${S.u} bekommt ${who}?`.replace('Wie viele € bekommt', 'Wie viel € bekommt');
    return task(`${S.s(x, y, T)} ${ask}`, r, `${vH(r)} ${S.u}`,
      [{ rule: 'Teile zählen', lines: [`Insgesamt: ${calcH(`${x} + ${y}`)} Teile.`] }, { rule: 'Ein Teil', lines: [calcH(`${T} : ${x + y}`, S.u)] }, { rule: who, lines: [`${who}: ${mine} Teile. ${calcH(`${vH(e)} · ${mine}`, S.u)}`] }],
      [{ title: 'Teile zählen', ask: `<p>Wie viele Teile gibt es insgesamt?</p>${big(`${x} + ${y} = ?`)}`, answer: parts, hint: 'Zähle die Zahlen im Verhältnis zusammen.', explain: calcH(`${x} + ${y}`), placeholder: 'Teile' },
       { title: 'Ein Teil', ask: `<p>Wie viel ist ein Teil?</p>${big(`${T} : ${x + y} = ?`)}`, answer: e, hint: `Teile das Ganze durch die Anzahl aller Teile.`, explain: calcH(`${T} : ${x + y}`, S.u), placeholder: u || 'Anzahl' },
       { title: who, ask: `<p>${who} bekommt ${mine} Teile.</p>${big(`${vH(e)} · ${mine} = ?`)}`, answer: r, hint: `Ein Teil mal ${mine}.`, explain: calcH(`${vH(e)} · ${mine}`, S.u), placeholder: u || 'Anzahl' }],
      { placeholder: u ? `Antwort in ${u}` : 'Anzahl', diag: diagOf(r, [[q(T, mine), `Du hast durch ${mine} geteilt. Aber insgesamt gibt es ${x} + ${y} = ${x + y} Teile. Teile durch ${x + y}.`], [e, `Das ist erst ein Teil. ${who} bekommt ${mine} Teile.`], [q(T * other, x + y), `Das ist der Anteil von ${second ? S.n1 : S.n2}.`]]) });
  }, () => true);
}

function verhAnteil(): Task | null {
  return genFrom(() => {
    const P = pick(PAIRS), [x, y] = coprime(1, 7), first = Math.random() < 0.6, fromCounts = Math.random() < 0.4;
    const g = fromCounts ? R(2, 6) : 1, a = g * x, b = g * y;
    if (a + b > P.max) return null;
    const T = a + b, mine = first ? a : b, v = ev(`${mine}/${T}`), Xs = first ? x : y;
    const start = fromCounts ? P.s(a, b) : `${P.intro} ist das Verhältnis ${P.la} zu ${P.lb} gleich ${rH(x, y)}.`;
    const steps = fromCounts
      ? [{ rule: 'Das Ganze', lines: [`Alle zusammen: ${calcH(`${a} + ${b}`, P.all)}`] }, { rule: 'Anteil', lines: [`Anteil = Teil : Ganzes = ${M(fr(mine, T))} = ${M(qH(v))}`] }]
      : [{ rule: 'Teile', lines: [`Das Verhältnis ${rH(x, y)} heißt: auf ${x} ${P.la} kommen ${y} ${P.lb}. Zusammen sind es ${calcH(`${x} + ${y}`)} Teile.`] }, { rule: 'Anteil', lines: [`Anteil = Teil : Ganzes = ${M(fr(Xs, x + y))}`] }];
    return task(`${start} ${P.anteilQ(first)} Gib den Anteil als ${fromCounts ? 'gekürzten ' : ''}Bruch an.`, v, qH(v), steps,
      [{ title: 'Das Ganze', choose: { ask: 'Was kommt beim Anteil in den Nenner?', options: opts(`alle ${P.all} zusammen`, [`nur die ${first ? P.lb : P.la}`, `nur die ${first ? P.la : P.lb}`]), why: 'Ein Anteil vergleicht einen Teil mit dem Ganzen.' }, ask: fromCounts ? `<p>Wie viele ${P.all} sind es insgesamt?</p>` : `<p>Wie viele Teile sind es zusammen?</p>${big(`${x} + ${y} = ?`)}`, answer: q(fromCounts ? T : x + y), hint: 'Zähle beide Gruppen zusammen.', explain: fromCounts ? calcH(`${a} + ${b}`, P.all) : calcH(`${x} + ${y}`), placeholder: 'Anzahl' },
       { title: 'Anteil', ask: '<p>Schreib den Anteil als Bruch: Teil durch Ganzes.' + (fromCounts ? ' Kürze vollständig.' : '') + '</p>', answer: v, needReduced: true, hint: fromCounts ? `${mine}/${T}, dann kürzen.` : `${Xs}/${x + y}`, explain: fromCounts ? `${M(fr(mine, T))} = ${M(qH(v))}` : M(fr(Xs, x + y)), placeholder: 'z. B. 3/7' }],
      { form: 'frac', needReduced: true, placeholder: 'z. B. 3/7', diag: diagOf(v, [[q(first ? x : y, first ? y : x), `Das ist das <b>Verhältnis</b> (Teil zu Teil). Für den Anteil teilst du durch das Ganze: ${x} + ${y} = ${x + y} Teile.`], [q(first ? y : x, x + y), `Das ist der Anteil der ${first ? P.lb : P.la}.`]]) });
  }, () => true);
}

/** Typische Verwechslung: Verhältnis (Teil zu Teil) und Anteil (Teil zum Ganzen). */
function verhVsAnteil(): Task | null {
  return genFrom(() => {
    const P = pick(PAIRS.slice(0, 4)), [x, y] = coprime(1, 6), g = R(1, 3), a = g * x, b = g * y;
    if (a + b > P.max) return null;
    const S = x + y, A = P.la, Bn = P.lb;
    const ant = (who: string, n: number) => `Der Anteil der ${who === 'rot' ? 'roten Gummibärchen' : who === 'grün' ? 'grünen Gummibärchen' : who === 'Fußball' ? 'Fußballkinder' : who === 'Handball' ? 'Handballkinder' : who} ist ${M(fr(n, S))}.`;
    const antW = (who: string, n: number, d: number) => `Der Anteil der ${who === 'rot' ? 'roten Gummibärchen' : who === 'grün' ? 'grünen Gummibärchen' : who === 'Fußball' ? 'Fußballkinder' : who === 'Handball' ? 'Handballkinder' : who} ist ${M(fr(n, d))}.`;
    const ver = (u: number, w: number) => `Das Verhältnis ${A} zu ${Bn} ist ${rH(u, w)}.`;
    const rightIsRatio = Math.random() < 0.5;
    const right = rightIsRatio ? ver(x, y) : ant(A, x);
    const wrong = rightIsRatio ? [antW(A, x, y), ver(x, S), ver(y, x), antW(Bn, x, S)] : [antW(A, x, y), ver(x, S), antW(Bn, x, S), antW(A, y, S)];
    return pickTask(`${P.s(a, b)} Welche Aussage ist <b>richtig</b>?`, right, wrong.filter(w => w !== right),
      [{ rule: 'Verhältnis', lines: [`Teil zu Teil: ${A} : ${Bn} = ${a} : ${b}${g > 1 ? ` = ${x} : ${y}` : ''}`] }, { rule: 'Anteil', lines: [`Teil zum Ganzen: ${A} sind ${M(fr(a, a + b))}${g > 1 ? ` = ${M(fr(x, S))}` : ''} von allen.`] }],
      [{ title: 'Das Ganze', ask: `<p>Wie viele ${P.all} sind es insgesamt?</p>`, answer: q(a + b), hint: 'Zähle beide Gruppen zusammen.', explain: `${a} + ${b} = ${a + b}. Das Ganze brauchst du für den Anteil, nicht für das Verhältnis.`, placeholder: 'Anzahl' }],
      { label: right });
  }, () => true);
}

/* ======================================================================
   Stufe 4 und 5: Textaufgaben
   ====================================================================== */
type WT = ReturnType<typeof wordTask>;
const asFrac = (t: WT): Task => ({ ...t, form: 'frac' as const, placeholder: 'z. B. 3/4' });

function text4(): Task | null {
  const k = R(0, 5);
  if (k === 0) {
    const C = pick([
      { s: (f: string, G: number) => `Lena hat ${G} € gespart. Sie gibt ${f} davon für ein Spiel aus. Wie viel kostet das Spiel?`, u: '€', Gs: rng(12, 60), sent: (v: string) => `Das Spiel kostet ${v}.` },
      { s: (f: string, G: number) => `Die Klasse 6a hat ${G} Kinder. ${f} davon kommen mit dem Fahrrad zur Schule. Wie viele Kinder sind das?`, u: 'Kinder', Gs: rng(20, 32), sent: (v: string) => `${v} kommen mit dem Fahrrad.` },
      { s: (f: string, G: number) => `Ein Kuchen wiegt ${G} g. Opa isst ${f} davon. Wie viel Gramm Kuchen isst Opa?`, u: 'g', Gs: [600, 800, 900, 1000, 1200, 1500], sent: (v: string) => `Opa isst ${v} Kuchen.` },
      { s: (f: string, G: number) => `Der Ausflug dauert ${G} min. ${f} der Zeit sind die Kinder im Zoo. Wie viele Minuten sind das?`, u: 'min', Gs: [60, 90, 120, 150, 180, 240], sent: (v: string) => `Die Kinder sind ${v} im Zoo.` },
    ]);
    const [n, d] = properFrac([3, 4, 5, 6, 8]), Gs = C.Gs.filter(G => G % d === 0);
    if (n === 1 || !Gs.length) return null;
    const G = pick(Gs), e = G / d;
    return wordTask({
      prompt: C.s(M(fr(n, d)), G),
      steps: [
        { title: 'Ein Teil', ask: `Wie viel ist ${M(fr(1, d))} von ${G}?`, calc: `${G} : ${d}`, wrong: [`${G} : ${n}`, `${G} · ${d}`], why: 'Der Nenner sagt, in wie viele gleiche Teile du das Ganze teilst.', unit: C.u },
        { title: `${n} Teile`, ask: `Wie viel sind ${M(fr(n, d))}?`, calc: `${e} · ${n}`, wrong: [`${e} : ${n}`, `${e} + ${n}`], why: 'Der Zähler sagt, wie viele Teile du nimmst.', unit: C.u },
      ],
      unit: C.u, term: `${G} : ${d} · ${n}`, sentence: C.sent,
    });
  }
  if (k === 1) {
    const C = pick([
      { s: (f: string, T: number) => `Tim hat schon ${f} seines Buches gelesen. Das sind ${T} Seiten. Wie viele Seiten hat das ganze Buch?`, u: 'Seiten', ks: rng(8, 30), sent: (v: string) => `Das Buch hat ${v}.` },
      { s: (f: string, T: number) => `Familie Weber ist schon ${f} der Strecke in den Urlaub gefahren. Das sind ${T} km. Wie lang ist die ganze Strecke?`, u: 'km', ks: [20, 25, 30, 40, 50, 60, 80, 100], sent: (v: string) => `Die ganze Strecke ist ${v} lang.` },
      { s: (f: string, T: number) => `${f} der Kinder einer Schule fahren mit dem Bus. Das sind ${T} Kinder. Wie viele Kinder hat die Schule?`, u: 'Kinder', ks: rng(20, 80), sent: (v: string) => `Die Schule hat ${v}.` },
    ]);
    const [n, d] = properFrac([3, 4, 5, 6, 8, 10]), kk = pick(C.ks);
    if (n === 1) return null;
    const T = n * kk;
    return wordTask({
      prompt: C.s(M(fr(n, d)), T),
      steps: [
        { title: 'Ein Teil', ask: `${T} ${C.u} sind ${n} Teile. Wie viel ist ein Teil (${M(fr(1, d))})?`, calc: `${T} : ${n}`, wrong: [`${T} : ${d}`, `${T} · ${n}`], why: `${T} ${C.u} gehören zu ${n} Teilen. Also durch den Zähler teilen.`, unit: C.u },
        { title: 'Das Ganze', ask: `Das Ganze hat ${d} Teile. Wie viel ist das?`, calc: `${kk} · ${d}`, wrong: [`${kk} : ${d}`, `${kk} · ${n}`], why: 'Der Nenner sagt, wie viele Teile das Ganze hat.', unit: C.u },
      ],
      unit: C.u, term: `${T} : ${n} · ${d}`, sentence: C.sent,
    });
  }
  if (k === 2) {
    const [x, y] = pick([[1, 3], [1, 4], [2, 3], [3, 5], [1, 5]] as [number, number][]), total = pick([500, 600, 800, 1000, 1200]);
    if (total % (x + y) !== 0) return null;
    const one = total / (x + y), wantJuice = Math.random() < 0.5;
    return wordTask({
      prompt: `Für eine Apfelschorle mischt Ole Apfelsaft und Wasser im Verhältnis ${x} : ${y}. Er möchte ${total} ml Schorle machen. Wie viel ml ${wantJuice ? 'Apfelsaft' : 'Wasser'} braucht er?`,
      steps: [
        { title: 'Teile', ask: 'Aus wie vielen Teilen besteht die Schorle?', calc: `${x} + ${y}`, wrong: [`${x} · ${y}`, `${y} − ${x}`], why: 'Saft-Teile und Wasser-Teile zusammen ergeben das Ganze.', unit: 'Teile' },
        { title: 'Ein Teil', ask: 'Wie viel ml ist ein Teil?', calc: `${total} : ${x + y}`, wrong: [`${total} : ${wantJuice ? x : y}`, `${total} · ${x + y}`], why: 'Die ganze Menge wird auf alle Teile verteilt.', unit: 'ml' },
        { title: wantJuice ? 'Apfelsaft' : 'Wasser', ask: `Wie viel ml ${wantJuice ? 'Apfelsaft' : 'Wasser'} sind das?`, calc: `${one} · ${wantJuice ? x : y}`, wrong: [`${one} · ${wantJuice ? y : x}`, `${one} + ${wantJuice ? x : y}`], why: `${wantJuice ? 'Apfelsaft' : 'Wasser'} hat ${wantJuice ? x : y} Teile.`, unit: 'ml' },
      ],
      unit: 'ml', sentence: v => `Ole braucht ${v} ${wantJuice ? 'Apfelsaft' : 'Wasser'}.`,
    });
  }
  if (k === 3) {
    const L = R(2, 6), s = pick([4, 5, 8, 10, 20, 25]), cm = L * 100;
    if (cm % s !== 0 || L % s === 0) return null;
    return wordTask({
      prompt: `Herr Kaya sägt ein ${L} m langes Brett in ${s} gleich lange Stücke. Wie lang ist ein Stück in cm?`,
      steps: [
        { title: 'Umrechnen', ask: `Wie viele cm sind ${L} m?`, calc: `${L} · 100`, wrong: [`${L} · 10`, `${L} · 1000`], why: '1 m = 100 cm.', unit: 'cm' },
        { title: 'Teilen', ask: 'Wie lang ist ein Stück?', calc: `${cm} : ${s}`, wrong: [`${cm} · ${s}`, `${s} : ${cm}`], why: 'Die Länge wird auf die Stücke verteilt: geteilt.', unit: 'cm' },
      ],
      unit: 'cm', term: `${L} · 100 : ${s}`, sentence: v => `Ein Stück ist ${v} lang.`,
    });
  }
  if (k === 4) {
    const p = R(2, 5), c = pick([3, 4, 6, 8]), st = 8;
    if ((p * st) % c !== 0 || p % c === 0) return null;
    const each = (p * st) / c;
    if (each >= st) return null;
    return asFrac(wordTask({
      prompt: `${p} Pizzen werden gerecht an ${c} Kinder verteilt. Jede Pizza ist in ${st} gleiche Stücke geschnitten. Wie viele Stücke bekommt jedes Kind? Welcher Bruchteil einer Pizza ist das? Gib ihn gekürzt an.`,
      steps: [
        { title: 'Alle Stücke', ask: 'Wie viele Stücke gibt es insgesamt?', calc: `${p} · ${st}`, wrong: [`${p} + ${st}`], why: `Jede der ${p} Pizzen hat ${st} Stücke.`, unit: 'Stücke' },
        { title: 'Pro Kind', ask: 'Wie viele Stücke bekommt jedes Kind?', calc: `${p * st} : ${c}`, wrong: [`${p * st} · ${c}`], why: 'Gerecht verteilen heißt teilen.', unit: 'Stücke' },
        { title: 'Bruchteil', ask: `${each} von ${st} Stücken einer Pizza. Schreib das als gekürzten Bruch.`, calc: `${each}/${st}`, explain: `${M(fr(each, st))} = ${M(qH(q(each, st).red()))}. Das ist dasselbe wie ${M(`${p} : ${c}`)}.`, needReduced: true, hint: `${each}/${st} kürzen.` },
      ],
      sentence: v => `Jedes Kind bekommt ${each} Stücke, also ${v} Pizza.`,
    }));
  }
  const total = R(24, 32), kids = pick([[18, 'mit dem Bus'], [12, 'mit dem Rad'], [15, 'zu Fuß']] as [number, string][]);
  const other = total - kids[0];
  if (other <= 0 || ggt(other, total) === 1) return null;
  return asFrac(wordTask({
    prompt: `In der Klasse 6c sind ${total} Kinder. ${kids[0]} Kinder kommen ${kids[1]}, die anderen werden mit dem Auto gebracht. Welcher Anteil der Klasse wird mit dem Auto gebracht? Gib den Anteil gekürzt an.`,
    steps: [
      { title: 'Mit dem Auto', ask: 'Wie viele Kinder werden mit dem Auto gebracht?', calc: `${total} − ${kids[0]}`, wrong: [`${total} + ${kids[0]}`], why: 'Die anderen: alle minus die genannten.', unit: 'Kinder' },
      { title: 'Anteil', ask: 'Welcher Anteil ist das? Teil durch Ganzes, gekürzt.', calc: `${other}/${total}`, explain: `${M(fr(other, total))} = ${M(qH(q(other, total).red()))}`, needReduced: true, hint: `${other} von ${total}: ${other}/${total}, dann kürzen.` },
    ],
    sentence: v => `${v} der Klasse ${q(other, total).red().n === 1n ? 'wird' : 'werden'} mit dem Auto gebracht.`,
  }));
}

function text5(): Task | null {
  const k = R(0, 5);
  if (k === 0) {
    // Anteil vom Rest
    const [n1, d1] = properFrac([2, 3, 4, 5]), [n2, d2] = properFrac([2, 3, 4, 5]), base = d1 * d2, G = base * pick([2, 3, 4, 5]);
    if (G > 120 || G < 24) return null;
    const a1 = (G / d1) * n1, rest = G - a1, a2 = (rest / d2) * n2, end = rest - a2;
    if (end <= 0 || rest % d2 !== 0) return null;
    return wordTask({
      prompt: `Tim hat ${G} € gespart. Er gibt ${M(fr(n1, d1))} davon für Kinokarten aus. Vom <b>Rest</b> gibt er ${M(fr(n2, d2))} für ein Buch aus. Wie viel Geld bleibt ihm übrig?`,
      steps: [
        { title: 'Kino', ask: `Wie viel sind ${M(fr(n1, d1))} von ${G} €?`, calc: `${G} : ${d1} · ${n1}`, wrong: [`${G} : ${n1} · ${d1}`, `${G} − ${n1}`], why: 'Durch den Nenner teilen, mit dem Zähler mal.', unit: '€' },
        { title: 'Rest', ask: 'Wie viel Geld bleibt nach dem Kino?', calc: `${G} − ${a1}`, wrong: [`${G} + ${a1}`], why: 'Ausgeben heißt abziehen.', unit: '€' },
        { title: 'Buch', ask: `Wie viel sind ${M(fr(n2, d2))} vom Rest?`, calc: `${rest} : ${d2} · ${n2}`, wrong: [`${G} : ${d2} · ${n2}`, `${rest} : ${n2} · ${d2}`], why: `Jetzt ist der Rest von ${rest} € das Ganze, nicht mehr ${G} €.`, unit: '€' },
        { title: 'Übrig', ask: 'Wie viel bleibt am Ende?', calc: `${rest} − ${a2}`, wrong: [`${G} − ${a2}`], why: 'Vom Rest geht das Buch weg.', unit: '€' },
      ],
      unit: '€', sentence: v => `Tim bleiben ${v} übrig.`,
    });
  }
  if (k === 1) {
    // Verhältnis + Anteil
    const [x, y] = pick([[3, 4], [4, 3], [2, 3], [3, 2], [5, 3], [3, 5]] as [number, number][]), kk = R(2, 4), T = (x + y) * kk, M1 = x * kk;
    if (T > 32 || T < 15) return null;
    const [n, d] = properFrac([2, 3, 4, 5]);
    if (M1 % d !== 0) return null;
    return wordTask({
      prompt: `In der Klasse 6e sind ${T} Kinder. Das Verhältnis Mädchen zu Jungen ist ${x} : ${y}. ${M(fr(n, d))} der Mädchen spielen im Verein Fußball. Wie viele Mädchen spielen Fußball?`,
      steps: [
        { title: 'Teile', ask: 'Wie viele Teile sind es zusammen?', calc: `${x} + ${y}`, wrong: [`${x} · ${y}`], why: 'Mädchen-Teile und Jungen-Teile zusammen.', unit: 'Teile' },
        { title: 'Ein Teil', ask: 'Wie viele Kinder sind ein Teil?', calc: `${T} : ${x + y}`, wrong: [`${T} : ${x}`], why: 'Die ganze Klasse auf alle Teile verteilen.', unit: 'Kinder' },
        { title: 'Mädchen', ask: 'Wie viele Mädchen sind in der Klasse?', calc: `${kk} · ${x}`, wrong: [`${kk} · ${y}`], why: `Die Mädchen haben ${x} Teile.`, unit: 'Mädchen' },
        { title: 'Fußball', ask: `Wie viele sind ${M(fr(n, d))} der Mädchen?`, calc: `${M1} : ${d} · ${n}`, wrong: [`${T} : ${d} · ${n}`, `${M1} : ${n} · ${d}`], why: `Das Ganze sind jetzt nur die ${M1} Mädchen.`, unit: 'Mädchen' },
      ],
      unit: 'Mädchen', sentence: v => `${v} spielen Fußball.`,
    });
  }
  if (k === 2) {
    // Anteil zu Verhältnis
    const [n, d] = properFrac([3, 4, 5, 7, 8]), kk = R(2, 6), T = d * kk;
    if (T > 32 || T < 15 || 2 * n === d) return null;
    const Mn = n * kk, J = T - Mn;
    return wordTask({
      prompt: `In der Klasse 6f sind ${T} Kinder. ${M(fr(n, d))} davon sind Mädchen. Gib das Verhältnis Mädchen zu Jungen gekürzt an.<div class="math big">Mädchen : Jungen = ${n} : ?</div>`,
      steps: [
        { title: 'Mädchen', ask: `Wie viele Mädchen sind ${M(fr(n, d))} von ${T}?`, calc: `${T} : ${d} · ${n}`, wrong: [`${T} : ${n} · ${d}`], why: 'Durch den Nenner teilen, mit dem Zähler mal.', unit: 'Mädchen' },
        { title: 'Jungen', ask: 'Wie viele Jungen sind es?', calc: `${T} − ${Mn}`, wrong: [`${T} − ${n}`], why: 'Alle Kinder minus die Mädchen.', unit: 'Jungen' },
        { title: 'Kürzen', ask: `Mädchen : Jungen = ${Mn} : ${J}. Kürze durch ${kk}. Welche Zahl steht hinten?`, calc: `${J} : ${kk}`, wrong: [`${J} : ${n}`], why: `Beide Zahlen durch dieselbe Zahl teilen: ${Mn} : ${kk} = ${n}.`, unit: '' },
      ],
      sentence: v => `Das Verhältnis Mädchen zu Jungen ist ${n} : ${v}. Der Anteil ${M(fr(n, d))} vergleicht mit allen, das Verhältnis nur Mädchen mit Jungen.`,
    });
  }
  if (k === 3) {
    // Seil: Anteil abschneiden, Rest teilen
    const L = R(2, 8), [n, d] = properFrac([2, 4, 5, 10]), s = pick([2, 3, 4, 5, 6]);
    const cm = L * 100, cut = (cm / d) * n, rest = cm - cut;
    if (cm % d !== 0 || rest % s !== 0) return null;
    return wordTask({
      prompt: `Von einem ${L} m langen Seil schneidet Jana ${M(fr(n, d))} ab. Den Rest teilt sie in ${s} gleich lange Stücke. Wie lang ist ein Stück in cm?`,
      steps: [
        { title: 'Umrechnen', ask: `Wie viele cm sind ${L} m?`, calc: `${L} · 100`, wrong: [`${L} · 10`], why: '1 m = 100 cm.', unit: 'cm' },
        { title: 'Abgeschnitten', ask: `Wie viel sind ${M(fr(n, d))} von ${cm} cm?`, calc: `${cm} : ${d} · ${n}`, wrong: [`${cm} : ${n} · ${d}`], why: 'Durch den Nenner teilen, mit dem Zähler mal.', unit: 'cm' },
        { title: 'Rest', ask: 'Wie lang ist der Rest?', calc: `${cm} − ${cut}`, wrong: [`${cm} + ${cut}`], why: 'Das abgeschnittene Stück abziehen.', unit: 'cm' },
        { title: 'Ein Stück', ask: `Wie lang ist eins von ${s} Stücken?`, calc: `${rest} : ${s}`, wrong: [`${rest} · ${s}`, `${cm} : ${s}`], why: 'Nur der Rest wird verteilt.', unit: 'cm' },
      ],
      unit: 'cm', sentence: v => `Ein Stück ist ${v} lang.`,
    });
  }
  if (k === 4) {
    // Mischung korrigieren
    const y = R(4, 8), sir = pick([20, 30, 40, 50]), need = sir * y, have = need - pick([20, 30, 40, 50, 60]);
    if (have <= 0) return null;
    return wordTask({
      prompt: `Holundersaft mischt man aus Sirup und Wasser im Verhältnis 1 : ${y}. Lea hat schon ${sir} ml Sirup und ${have} ml Wasser in den Krug gegeben. Wie viel Wasser muss sie noch dazugießen?`,
      steps: [
        { title: 'Wasser nötig', ask: `Wie viel Wasser braucht man für ${sir} ml Sirup?`, calc: `${sir} · ${y}`, wrong: [`${sir} + ${y}`, `${sir} : ${y}`], why: `Auf 1 Teil Sirup kommen ${y} Teile Wasser.`, unit: 'ml' },
        { title: 'Fehlt noch', ask: 'Wie viel Wasser fehlt noch?', calc: `${need} − ${have}`, wrong: [`${need} + ${have}`], why: 'Nötig minus schon da.', unit: 'ml' },
      ],
      unit: 'ml', sentence: v => `Lea muss noch ${v} Wasser dazugießen.`,
    });
  }
  // Anteil des Rests, gekürzt
  const T = pick([24, 30, 36, 40]), [n, d] = properFrac([3, 4, 5, 6]);
  if (T % d !== 0) return null;
  const a = (T / d) * n, rest = T - a, b = R(2, rest - 2);
  const other = rest - b;
  if (ggt(other, T) === 1 || other <= 0) return null;
  return asFrac(wordTask({
    prompt: `Beim Schulfest gibt es ${T} Kuchenstücke. ${M(fr(n, d))} davon sind Schokoladenkuchen. Von den übrigen Stücken sind ${b} Apfelkuchen, der Rest ist Käsekuchen. Welcher Anteil aller Stücke ist Käsekuchen? Gib den Anteil gekürzt an.`,
    steps: [
      { title: 'Schokolade', ask: `Wie viele Stücke sind ${M(fr(n, d))} von ${T}?`, calc: `${T} : ${d} · ${n}`, wrong: [`${T} : ${n} · ${d}`], why: 'Durch den Nenner teilen, mit dem Zähler mal.', unit: 'Stücke' },
      { title: 'Übrige', ask: 'Wie viele Stücke sind übrig?', calc: `${T} − ${a}`, wrong: [`${T} + ${a}`], why: 'Alle minus Schokolade.', unit: 'Stücke' },
      { title: 'Käsekuchen', ask: 'Wie viele Stücke sind Käsekuchen?', calc: `${rest} − ${b}`, wrong: [`${T} − ${b}`], why: 'Von den übrigen die Apfelkuchen abziehen.', unit: 'Stücke' },
      { title: 'Anteil', ask: `Welcher Anteil <b>aller</b> ${T} Stücke ist das? Gekürzt.`, calc: `${other}/${T}`, explain: `${M(fr(other, T))} = ${M(qH(q(other, T).red()))}`, needReduced: true, hint: `Teil durch Ganzes: ${other}/${T}. Das Ganze sind alle ${T} Stücke, nicht nur die übrigen.` },
    ],
    sentence: v => `${v} aller Stücke sind Käsekuchen.`,
  }));
}

/* ======================================================================
   Das Thema
   ====================================================================== */
const ANTEIL: Topic = {
  id: 'anteil', klasse: 6, title: 'Anteile und Verhältnisse',
  short: 'Anteile von Größen berechnen, aufs Ganze schließen, Brüche als Quotienten und Verhältnisse.',
  exampleSol: () => {
    const sol = list([
      { rule: 'Ein Teil', lines: [`${M(fr(1, 4))} von 24 €: ${calcH('24 : 4', '€')}`] },
      { rule: '3 Teile', lines: [`${M(fr(3, 4))} von 24 €: ${calcH('6 · 3', '€')}`] },
    ], ev('24 : 4 · 3'), '18 €');
    return { prompt: `Wie viel sind ${M(fr(3, 4))} von 24 €?`, sol };
  },
  theory: `
    <h3>1. Anteile berechnen</h3>
    <p>Ein Bruch kann einen <b>Anteil</b> von einem Ganzen angeben. ${M(fr(3, 4))} von 24 € heißt: Teile 24 € in <b>4</b> gleiche Teile (der Nenner) und nimm <b>3</b> davon (der Zähler).</p>
    <p><b>Beispiel:</b> ${M(fr(1, 4))} von 24 € = ${M('24 : 4')} = 6 €. Also sind ${M(fr(3, 4))} von 24 € = ${M('6 · 3')} = 18 €.</p>
    <p><b>Beispiel mit Einheit:</b> ${M(fr(2, 5))} von 1 kg. Erst umrechnen: 1 kg = 1000 g. ${M('1000 : 5 · 2')} = 400 g.</p>
    <div class="merke"><span class="merke-l">Merke</span>Anteil berechnen: <b>durch den Nenner teilen, mit dem Zähler malnehmen.</b></div>
    <h3>2. Vom Anteil auf das Ganze schließen</h3>
    <p>Manchmal kennst du den Teil und suchst das Ganze: ${M(fr(2, 5))} der Klasse sind 12 Kinder. Wie viele Kinder hat die Klasse?</p>
    <p>12 Kinder sind <b>2</b> Teile. Ein Teil (${M(fr(1, 5))}) sind ${M('12 : 2')} = 6 Kinder. Das Ganze hat <b>5</b> Teile: ${M('6 · 5')} = 30 Kinder.</p>
    <div class="merke"><span class="merke-l">Merke</span>Vom Teil zum Ganzen: <b>durch den Zähler teilen, mit dem Nenner malnehmen.</b> Das Ganze ist immer größer als der Teil.</div>
    <h3>3. Echte und unechte Brüche</h3>
    <p>Bei einem <b>echten Bruch</b> ist der Zähler kleiner als der Nenner, zum Beispiel ${M(fr(3, 5))}. Er ist kleiner als 1.</p>
    <p>Bei einem <b>unechten Bruch</b> ist der Zähler gleich groß oder größer, zum Beispiel ${M(fr(5, 5))} oder ${M(fr(7, 3))}. Er ist 1 oder mehr. Man kann ihn als <b>gemischte Zahl</b> schreiben: ${M(`${fr(7, 3)} = ${mixedH(q(7, 3))}`)}, denn 3 passt 2-mal in 7 und es bleibt 1 übrig.</p>
    <div class="merke"><span class="merke-l">Merke</span>Echt: Zähler &lt; Nenner. Unecht: Zähler ≥ Nenner. ${M(`${fr(7, 7)} = 1`)} ist also unecht.</div>
    <h3>4. Brüche als Quotienten</h3>
    <p>Jeder Bruch ist eine Geteiltaufgabe: ${M(`3 : 4 = ${fr(3, 4)}`)} und ${M(`${fr(7, 3)} = 7 : 3`)}. Die Zahl, die geteilt wird, steht oben.</p>
    <p><b>Beispiel:</b> 3 m Band werden in 4 gleich lange Stücke geteilt. Ein Stück ist ${M(`3 m : 4 = ${fr(3, 4)} m`)}. In cm: 300 cm : 4 = 75 cm.</p>
    <p><b>Beispiel:</b> 5 Pizzen für 8 Kinder. Jedes Kind bekommt ${M(`5 : 8 = ${fr(5, 8)}`)} Pizza.</p>
    <div class="merke"><span class="merke-l">Merke</span>${M(`a : b = ${fracH('a', 'b')}`)}. Was verteilt wird, kommt in den Zähler. Worauf verteilt wird, in den Nenner.</div>
    <h3>5. Verhältnisse</h3>
    <p>Ein <b>Verhältnis</b> vergleicht zwei Teile miteinander. In der Klasse sind 12 Mädchen und 16 Jungen. Mädchen zu Jungen ist ${M('12 : 16')}. Wie einen Bruch kann man es <b>kürzen</b>: beide Zahlen durch 4, also ${M('3 : 4')}. Auf 3 Mädchen kommen 4 Jungen.</p>
    <p><b>Mit Verhältnissen rechnen:</b> Saft aus Sirup und Wasser im Verhältnis ${M('1 : 5')}. Für 30 ml Sirup brauchst du ${M('30 · 5')} = 150 ml Wasser.</p>
    <p><b>Aufteilen:</b> Anna und Ben teilen 25 Murmeln im Verhältnis ${M('2 : 3')}. Das sind ${M('2 + 3')} = 5 Teile. Ein Teil: ${M('25 : 5')} = 5 Murmeln. Ben bekommt ${M('5 · 3')} = 15 Murmeln.</p>
    <table class="stellen"><tr><th></th><th>Verhältnis</th><th>Anteil</th></tr>
      <tr><th>vergleicht</th><td>Teil zu Teil</td><td>Teil zum Ganzen</td></tr>
      <tr><th>12 Mädchen, 16 Jungen</th><td>${M('3 : 4')}</td><td>${M(`${fr(12, 28)} = ${fr(3, 7)}`)}</td></tr></table>
    <div class="merke"><span class="merke-l">Merke</span>Verhältnis ${M('3 : 4')} heißt <b>nicht</b> Anteil ${M(fr(3, 4))}! Für den Anteil brauchst du das Ganze: 3 + 4 = 7 Teile, also sind ${M(fr(3, 7))} der Klasse Mädchen.</div>`,
  gen(level) {
    if (level === 1) return pick<() => Task | null>([quotTask, divPick, () => anteilTask(1), () => anteilTask(1)])();
    if (level === 2) return pick<() => Task | null>([() => anteilTask(2), () => ganzesTask(2), () => ganzesTask(2), echtPick, echtWF, mixedTask, diagramTask, diagramTask])();
    return pick<() => Task | null>([verhKuerzen, verhTeil, verhGesamt, verhAnteil, verhVsAnteil, teilenTask, teilenTask, anteilEinheit, () => ganzesTask(3)])();
  },
  text: level => genFrom(() => (level === 4 ? text4() : text5()), t => !!t.guide?.every(s => s.answer.sign() > 0)),
};

export const ANTEIL_TOPICS: Topic[] = [ANTEIL];
