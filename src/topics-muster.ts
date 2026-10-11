/* ===== Klasse 5/6: Teilbarkeit und Primfaktoren, Häufigkeiten und Diagramme, Zahlenrätsel und Folgen ===== */
import type { GuideChoice, GuideStep, WordStep } from './guide.js';
import { wordTask } from './guide.js';
import { q, qH, type Q, type ListSolution } from './engine/index.js';
import { B, M, R, genFrom, list, pick, type Task, type Topic } from './gen.js';

/* ---------- Gemeinsame Helfer ---------- */
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const dH = (v: Q) => qH(v, true);
const dec = (n: number) => String(n).replace('.', ',');
const uniq = <T,>(a: T[]): T[] => [...new Set(a)];
type Steps = ListSolution['steps'];
interface Choice { html: string; why?: string }

/** Auswahl-Frage für „Gemeinsam lösen“: richtige Option plus falsche, gemischt, ohne doppelte. */
function gc(ask: string, right: string, wrong: string[], why: string): GuideChoice {
  const w = uniq(wrong).filter(x => x !== right);
  return { ask, options: shuffle([{ html: right, ok: true }, ...w.map(html => ({ html, ok: false }))]), why };
}

/** Auswahl-Aufgabe mit dem Widget `pick`. Antwort = Nummer der richtigen Option. Falsche Optionen erklären im `diag`, was schiefging. */
function pickTask(prompt: string, right: string, wrong: Choice[], steps: Steps, guide: GuideStep[], o: { word?: boolean } = {}): Task {
  const seen = new Set([right]);
  const ws = wrong.filter(w => (seen.has(w.html) ? false : (seen.add(w.html), true)));
  const all = shuffle([{ html: right, ok: true, why: undefined as string | undefined }, ...ws.map(w => ({ html: w.html, ok: false, why: w.why }))]);
  const answer = q(all.findIndex(x => x.ok) + 1);
  return {
    prompt, answer, widget: { kind: 'pick', options: all.map(x => x.html) }, placeholder: 'Auswahl',
    sol: list(steps, answer, right), guide,
    diag: v => all[Number(v.n) - 1]?.why ?? null,
    ...(o.word ? { word: true, plain: prompt } : {}),
  };
}
/** Ja/Nein-Frage, die Reihenfolge bleibt immer Ja, Nein. */
function ynTask(prompt: string, yes: boolean, steps: Steps, guide: GuideStep[], wrongWhy: string): Task {
  const answer = q(yes ? 1 : 2);
  return { prompt, answer, widget: { kind: 'pick', options: ['Ja', 'Nein'] }, placeholder: 'Auswahl', sol: list(steps, answer, yes ? 'Ja' : 'Nein'), guide, diag: v => (v.eq(answer) ? null : wrongWhy) };
}
const table = (rows: [string, (string | number)[]][]) => `<table class="stellen">${rows.map(([h, c]) => `<tr><th>${h}</th>${c.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
const merke = (items: string[]) => `<div class="merke"><span class="merke-l">Merke</span><ol>${items.map(i => `<li>${i}</li>`).join('')}</ol></div>`;

/* =================================================================== */
/* ---------- 1. Teilbarkeit und Primfaktoren ---------- */
/* =================================================================== */
const isPrime = (n: number) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const spf = (n: number) => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return i; return n; };
const factors = (n: number): number[] => { const f: number[] = []; let m = n; while (m > 1) { const p = spf(m); f.push(p); m /= p; } return f; };
const digits = (n: number) => String(n).split('').map(Number);
const qsum = (n: number) => digits(n).reduce((a, b) => a + b, 0);
const mulH = (f: number[]) => f.join(' · ');
const powH = (f: number[]) => uniq(f).map(p => { const k = f.filter(x => x === p).length; return k > 1 ? `${p}<sup>${k}</sup>` : String(p); }).join(' · ');
const prod = (f: number[]) => f.reduce((a, b) => a * b, 1);

function ladder(n: number) {
  const f = factors(n), rows: { cur: number; p: number; next: number }[] = [];
  let cur = n;
  for (let i = 0; i < f.length - 1; i++) { rows.push({ cur, p: f[i], next: cur / f[i] }); cur /= f[i]; }
  return { f, rows };
}
function ladderGuide(n: number): GuideStep[] {
  const { rows } = ladder(n);
  return rows.map((r, i) => ({
    title: `Teilen, Schritt ${i + 1}`,
    ask: `<p>Suche den <b>kleinsten Primfaktor</b> von ${B(String(r.cur))} und teile dadurch. Was kommt heraus?</p>`,
    answer: q(r.next), hint: 'Probiere zuerst 2, dann 3, dann 5, dann 7.', placeholder: 'Ergebnis',
    explain: `${M(`${r.cur} : ${r.p} = ${r.next}`)}${i === rows.length - 1 ? `<br>${r.next} ist eine Primzahl. Fertig!` : ''}`,
  }));
}
function ladderSteps(n: number): Steps {
  const { f, rows } = ladder(n);
  return [
    { rule: 'Immer durch den kleinsten Primfaktor teilen', lines: [...rows.map(r => `${r.cur} : ${r.p} = ${r.next}`), `${f[f.length - 1]} ist eine Primzahl. Fertig.`] },
    { rule: 'Primfaktoren aufschreiben', lines: [`${n} = ${mulH(f)} = ${powH(f)}`] },
  ];
}
const RULE: Record<number, string> = {
  2: 'Eine Zahl ist durch 2 teilbar, wenn ihre Endziffer gerade ist (0, 2, 4, 6 oder 8).',
  5: 'Eine Zahl ist durch 5 teilbar, wenn ihre Endziffer 0 oder 5 ist.',
  10: 'Eine Zahl ist durch 10 teilbar, wenn ihre Endziffer 0 ist.',
};
const endOk = (d: number, e: number) => (d === 2 ? e % 2 === 0 : d === 5 ? e % 5 === 0 : e === 0);

function endTask(): Task {
  const d = pick([2, 5, 10]), yes = Math.random() < 0.5;
  let n = R(12, 9999);
  while ((n % d === 0) !== yes) n = R(12, 9999);
  const e = n % 10, res = `Die Endziffer ist ${e}. Also ist ${n} ${yes ? '' : 'nicht '}durch ${d} teilbar.`;
  return ynTask(`Ist ${M(String(n))} durch ${B(String(d))} teilbar?`, yes,
    [{ rule: 'Regel', lines: [RULE[d]] }, { rule: 'Endziffer ansehen', lines: [res] }],
    [{ title: 'Endziffer', ask: `<p>Bei der Teilbarkeit durch ${d} kommt es nur auf die <b>letzte Ziffer</b> an. Welche Ziffer steht bei ${B(String(n))} ganz hinten?</p>`, answer: q(e), hint: 'Die Endziffer ist die Einerziffer.', explain: `${RULE[d]}<br>${res}`, placeholder: 'Ziffer' }],
    `Schau nur auf die letzte Ziffer: ${e}. ${RULE[d]}`);
}
const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const TRICKY = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93];
function primYN(): Task {
  const prime = Math.random() < 0.5, n = prime ? pick(PRIMES) : pick(TRICKY), p = spf(n);
  const k = pick([3, 7, 11].filter(x => n % x !== 0 && x !== n));
  const odd = { html: `Ja. ${n} ist ungerade, und ungerade Zahlen sind Primzahlen.`, why: 'Nicht jede ungerade Zahl ist eine Primzahl: 9 = 3 · 3 ist ungerade.' };
  const no2 = { html: `Ja. ${n} ist nicht durch 2 und nicht durch 5 teilbar.`, why: 'Das reicht nicht. Du musst auch 3, 7, 11 … prüfen.' };
  const byK = { html: `Nein. ${n} ist durch ${k} teilbar.`, why: `Rechne nach: Bei ${n} : ${k} bleibt ein Rest.` };
  const steps: Steps = prime
    ? [{ rule: 'Teiler suchen', lines: [`${n} ist nicht durch 2, 3, 5 oder 7 teilbar.`, `${n} hat nur die Teiler 1 und ${n}. Also ist ${n} eine Primzahl.`] }]
    : [{ rule: 'Teiler suchen', lines: [`${n} = ${p} · ${n / p}`, `${n} hat also mehr als zwei Teiler und ist keine Primzahl.`] }];
  const guide: GuideStep[] = [{ title: 'Kleinster Teiler', ask: `<p>Durch welche kleinste Zahl (außer 1) ist ${B(String(n))} teilbar? Probiere 2, 3, 5, 7 …</p>`, answer: q(p), hint: 'Teste mit den Teilbarkeitsregeln. Bei 3 hilft die Quersumme.', explain: prime ? `Nur durch ${n} selbst. ${n} ist eine Primzahl.` : `${n} = ${p} · ${n / p}. Also ist ${n} keine Primzahl.`, placeholder: 'kleinster Teiler' }];
  return prime
    ? pickTask(`Ist ${M(String(n))} eine Primzahl? Wähle die Antwort mit der richtigen Begründung.`, `Ja. ${n} hat nur die Teiler 1 und ${n}.`, [odd, no2, byK], steps, guide)
    : pickTask(`Ist ${M(String(n))} eine Primzahl? Wähle die Antwort mit der richtigen Begründung.`, `Nein. ${n} = ${p} · ${n / p}.`, [odd, no2, byK], steps, guide);
}
function q39Task(): Task {
  const d = pick([3, 9]), yes = Math.random() < 0.5, trap = d === 9 && !yes && Math.random() < 0.6;
  let n = R(100, 9999);
  while ((n % d === 0) !== yes || (trap && n % 3 !== 0)) n = R(100, 9999);
  const s = qsum(n), ok = s % d === 0;
  const res = `Die Quersumme ${s} ist ${ok ? '' : 'nicht '}durch ${d} teilbar. Also ist ${n} ${ok ? '' : 'nicht '}durch ${d} teilbar.`;
  return ynTask(`Ist ${M(String(n))} durch ${B(String(d))} teilbar?`, yes,
    [{ rule: 'Quersumme', lines: [`${digits(n).join(' + ')} = ${s}`] }, { rule: `Teilbar durch ${d}?`, lines: [res] }],
    [{ title: 'Quersumme', ask: `<p>Bei ${d} hilft die <b>Quersumme</b>: Addiere alle Ziffern.</p><div class="math big">${digits(n).join(' + ')} = ?</div>`, answer: q(s), hint: 'Zähle die Ziffern einzeln zusammen.', explain: `${digits(n).join(' + ')} = ${s}<br>${res}` }],
    d === 9 && s % 3 === 0 && !ok ? `Die Quersumme ${s} ist durch 3 teilbar, aber nicht durch 9.` : `Rechne die Quersumme: ${s}. Ist sie durch ${d} teilbar?`);
}
function by4Task(): Task {
  const yes = Math.random() < 0.5;
  let n = R(100, 9999);
  while ((n % 4 === 0) !== yes || n % 100 < 10 || (!yes && Math.random() < 0.6 && n % 2 === 1)) n = R(100, 9999);
  const L = n % 100, res = `${L} ist ${yes ? '' : 'nicht '}durch 4 teilbar. Also ist ${n} ${yes ? '' : 'nicht '}durch 4 teilbar.`;
  return ynTask(`Ist ${M(String(n))} durch ${B('4')} teilbar?`, yes,
    [{ rule: 'Regel', lines: ['Eine Zahl ist durch 4 teilbar, wenn die Zahl aus ihren letzten zwei Ziffern durch 4 teilbar ist.'] }, { rule: 'Letzte zwei Ziffern', lines: [res] }],
    [{ title: 'Letzte zwei Ziffern', ask: `<p>Bei 4 kommt es auf die <b>letzten zwei Ziffern</b> an. Welche Zahl bilden sie bei ${B(String(n))}?</p>`, answer: q(L), hint: 'Zehner- und Einerziffer zusammen.', explain: res, placeholder: 'Zahl' }],
    n % 2 === 0 && !yes ? `${n} ist gerade, also durch 2 teilbar. Für 4 prüfst du aber die letzten zwei Ziffern: ${L}.` : `Prüfe die Zahl aus den letzten zwei Ziffern: ${L}.`);
}
function by6Task(): Task {
  const kind = R(0, 2); // 0: beides, 1: nur durch 2, 2: nur durch 3 (Falle)
  let n = R(100, 999);
  const fits = (m: number) => (kind === 0 ? m % 6 === 0 : kind === 1 ? m % 2 === 0 && m % 3 !== 0 : m % 2 === 1 && m % 3 === 0);
  while (!fits(n)) n = R(100, 999);
  const s = qsum(n), yes = kind === 0, e = n % 10;
  const two = `Endziffer ${e}: ${e % 2 === 0 ? 'gerade, also durch 2 teilbar' : 'ungerade, also nicht durch 2 teilbar'}.`;
  const three = `Quersumme ${s}: ${s % 3 === 0 ? 'durch 3 teilbar' : 'nicht durch 3 teilbar'}.`;
  return ynTask(`Ist ${M(String(n))} durch ${B('6')} teilbar?`, yes,
    [{ rule: 'Regel', lines: ['Eine Zahl ist durch 6 teilbar, wenn sie durch 2 <b>und</b> durch 3 teilbar ist.'] }, { rule: 'Prüfen', lines: [two, three, yes ? `Beides stimmt, also ist ${n} durch 6 teilbar.` : `Nicht beides stimmt, also ist ${n} nicht durch 6 teilbar.`] }],
    [
      { title: 'Durch 2?', ask: `<p>6 = 2 · 3. Prüfe zuerst 2: Welche Endziffer hat ${B(String(n))}?</p>`, answer: q(e), explain: two, hint: 'Die letzte Ziffer.', placeholder: 'Ziffer' },
      { title: 'Durch 3?', ask: `<p>Jetzt 3: Wie groß ist die Quersumme von ${B(String(n))}?</p>`, answer: q(s), explain: `${three}<br>${yes ? `Beides stimmt: ${n} ist durch 6 teilbar.` : `Es muss beides stimmen. Also ist ${n} nicht durch 6 teilbar.`}`, hint: 'Alle Ziffern addieren.' },
    ],
    kind === 2 ? `${n} ist zwar durch 3 teilbar, aber ungerade. Für 6 muss die Zahl durch 2 <b>und</b> durch 3 teilbar sein.` : kind === 1 ? `${n} ist gerade, aber die Quersumme ${s} ist nicht durch 3 teilbar.` : `${n} ist gerade und die Quersumme ${s} ist durch 3 teilbar.`);
}
const setH = (s: number[]) => (s.length === 1 ? `nur durch ${s[0]}` : `durch ${s.slice(0, -1).join(', ')} und ${s[s.length - 1]}`);
function comboTask(): Task | null {
  const S = [2, 3, 4, 5, 9], n = pick([6, 10, 12, 15, 18, 20, 30, 36, 45, 60, 90]) * R(2, 30);
  if (n < 100 || n > 1999 || n % 100 < 10) return null;
  const right = S.filter(d => n % d === 0);
  if (!right.length) return null;
  const tog = (d: number) => (right.includes(d) ? right.filter(x => x !== d) : [...right, d].sort((a, b) => a - b));
  const prio = [...(n % 2 === 0 && n % 4 ? [4] : []), ...(n % 3 === 0 && n % 9 ? [9] : []), ...(n % 9 === 0 ? [9] : [])];
  const order = uniq([...prio, ...shuffle(S)]).filter(d => tog(d).length > 0).slice(0, 3);
  const why = (d: number) => (right.includes(d) ? `${n} ist auch durch ${d} teilbar. Prüfe noch einmal.` : d === 4 ? `${n} ist gerade, aber die letzten zwei Ziffern ${n % 100} sind nicht durch 4 teilbar.` : d === 9 ? `Die Quersumme ${qsum(n)} ist nicht durch 9 teilbar.` : `${n} ist nicht durch ${d} teilbar.`);
  const e = n % 10, L = n % 100, s = qsum(n);
  return pickTask(`Durch welche der Zahlen ${M('2, 3, 4, 5, 9')} ist ${M(String(n))} teilbar? Wähle die Antwort, die <b>genau alle</b> passenden Zahlen nennt.`, `${n} ist ${setH(right)} teilbar.`,
    order.map(d => ({ html: `${n} ist ${setH(tog(d))} teilbar.`, why: why(d) })),
    [{ rule: 'Regeln anwenden', lines: [`Endziffer ${e}: ${e % 2 === 0 ? '' : 'nicht '}durch 2, ${e % 5 === 0 ? '' : 'nicht '}durch 5.`, `Letzte zwei Ziffern ${L}: ${L % 4 === 0 ? '' : 'nicht '}durch 4.`, `Quersumme ${s}: ${s % 3 === 0 ? '' : 'nicht '}durch 3, ${s % 9 === 0 ? '' : 'nicht '}durch 9.`] }, { rule: 'Ergebnis', lines: [`${n} ist ${setH(right)} teilbar.`] }],
    [
      { title: 'Endziffer', ask: `<p>Für 2 und 5 schaust du auf die Endziffer. Welche ist es bei ${B(String(n))}?</p>`, answer: q(e), explain: `${e}: ${e % 2 === 0 ? '' : 'nicht '}durch 2, ${e % 5 === 0 ? '' : 'nicht '}durch 5 teilbar.`, placeholder: 'Ziffer' },
      { title: 'Letzte zwei Ziffern', ask: '<p>Für 4: Welche Zahl bilden die letzten zwei Ziffern?</p>', answer: q(L), explain: `${L} ist ${L % 4 === 0 ? '' : 'nicht '}durch 4 teilbar.`, placeholder: 'Zahl' },
      { title: 'Quersumme', ask: '<p>Für 3 und 9: Wie groß ist die Quersumme?</p>', answer: q(s), explain: `${s}: ${s % 3 === 0 ? '' : 'nicht '}durch 3, ${s % 9 === 0 ? '' : 'nicht '}durch 9 teilbar.`, hint: 'Alle Ziffern addieren.' },
    ]);
}
function randFactors(): number[] | null {
  const f = Array.from({ length: R(3, 5) }, () => pick([2, 2, 2, 3, 3, 5, 7, 11])).sort((a, b) => a - b), n = prod(f);
  return n >= 24 && n <= 600 ? f : null;
}
function zerlegPick(): Task | null {
  const f = randFactors(); if (!f) return null;
  const n = prod(f), i = R(0, f.length - 2), j = R(0, f.length - 1);
  const merged = [...f.slice(0, i), f[i] * f[i + 1], ...f.slice(i + 2)];
  const rep = [...f]; rep[j] = pick([2, 3, 5, 7].filter(p => p !== f[j])); rep.sort((a, b) => a - b);
  const drop = f.filter((_, k) => k !== j);
  const wrongP = (a: number[]): Choice => ({ html: M(mulH(a)), why: `Rechne nach: ${mulH(a)} = ${prod(a)} und nicht ${n}.` });
  return pickTask(`Welche Zeile ist die <b>Primfaktorzerlegung</b> von ${M(String(n))}?`, M(mulH(f)),
    [{ html: M(mulH(merged)), why: `Das Produkt stimmt, aber ${f[i] * f[i + 1]} ist keine Primzahl. Zerlege weiter: ${f[i] * f[i + 1]} = ${f[i]} · ${f[i + 1]}.` }, wrongP(rep), wrongP(drop)],
    ladderSteps(n), ladderGuide(n));
}
function countTask(): Task | null {
  const f = randFactors(); if (!f) return null;
  const n = prod(f), u = uniq(f).length;
  return { prompt: `Zerlege ${M(String(n))} in Primfaktoren. Aus wie vielen Primfaktoren besteht die Zerlegung? Gleiche Faktoren zählen mehrfach.`, answer: q(f.length), placeholder: 'Anzahl',
    sol: list([...ladderSteps(n), { rule: 'Zählen', lines: [`${mulH(f)}: Das sind ${f.length} Primfaktoren.`] }], q(f.length)),
    guide: [...ladderGuide(n), { title: 'Zählen', ask: '<p>Die Primfaktoren sind alle Zahlen, durch die du geteilt hast, und die letzte Primzahl. Wie viele sind es?</p>', answer: q(f.length), explain: `${n} = ${mulH(f)}: ${f.length} Primfaktoren`, hint: 'Gleiche Zahlen zählen mehrfach.' }],
    diag: v => (u !== f.length && v.eq(q(u)) ? `Du hast gleiche Faktoren nur einmal gezählt. ${n} = ${mulH(f)}.` : null) };
}
function powTask(): Task | null {
  const f = randFactors(); if (!f) return null;
  const n = prod(f), rep = uniq(f).filter(p => f.filter(x => x === p).length > 1);
  if (!rep.length) return null;
  const p = pick(rep), k = f.filter(x => x === p).length;
  if (Math.random() < 0.5) {
    const shown = uniq(f).map(b => { const e = f.filter(x => x === b).length; return b === p ? `${b}<sup>□</sup>` : e > 1 ? `${b}<sup>${e}</sup>` : String(b); }).join(' · ');
    return { prompt: `Ergänze die Potenzschreibweise: ${M(`${n} = ${shown}`)}`, answer: q(k), placeholder: 'Hochzahl',
      sol: list(ladderSteps(n), q(k), `${n} = ${powH(f)}`),
      guide: [...ladderGuide(n), { title: 'Hochzahl', ask: `<p>Schreibe alle Primfaktoren auf: ${M(mulH(f))}. Wie oft kommt die ${B(String(p))} vor?</p>`, answer: q(k), explain: `${p} kommt ${k}-mal vor: ${M(`${p}<sup>${k}</sup>`)}`, hint: 'Die Hochzahl sagt, wie oft der Faktor vorkommt.' }],
      diag: v => (v.eq(q(p)) ? `Gefragt ist die Hochzahl: Wie oft kommt die ${p} vor?` : null) };
  }
  const bases = uniq(f), cnt = bases.map(b => f.filter(x => x === b).length);
  const wrong: Choice[] = [];
  if (bases.length > 1) {
    const a = bases.findIndex((_, i) => cnt[i] !== cnt[(i + 1) % bases.length]);
    if (a >= 0) { const b = (a + 1) % bases.length, c2 = [...cnt]; [c2[a], c2[b]] = [c2[b], c2[a]]; wrong.push({ html: M(bases.map((x, i) => (c2[i] > 1 ? `${x}<sup>${c2[i]}</sup>` : String(x))).join(' · ')), why: 'Die Hochzahlen sind vertauscht. Zähle für jede Primzahl einzeln, wie oft sie vorkommt.' }); }
  }
  const i0 = bases.indexOf(p), c3 = [...cnt]; c3[i0]++;
  wrong.push({ html: M(bases.map((x, i) => (c3[i] > 1 ? `${x}<sup>${c3[i]}</sup>` : String(x))).join(' · ')), why: `Zähle noch einmal: Die ${p} kommt ${k}-mal vor.` });
  wrong.push({ html: M(bases.map((x, i) => String(x ** cnt[i])).join(' · ')), why: `Das Produkt stimmt, aber ${p ** k} ist keine Primzahl. In der Potenzschreibweise stehen Primzahlen mit Hochzahl.` });
  const c4 = cnt.map(c => (c > 1 ? c - 1 : c));
  wrong.push({ html: M(bases.map((x, i) => (c4[i] > 1 ? `${x}<sup>${c4[i]}</sup>` : String(x))).join(' · ')), why: 'Hier fehlt ein Faktor. Zähle jede Primzahl genau.' });
  return pickTask(`Welche Zeile zeigt ${M(String(n))} richtig in <b>Potenzschreibweise</b>?`, M(powH(f)), wrong.slice(0, 3), ladderSteps(n), ladderGuide(n));
}
const CLAIM_T: [number, number][] = [[9, 3], [10, 5], [6, 3], [6, 2], [8, 4], [10, 2], [12, 4]];
const CLAIM_F: [number, number][] = [[3, 9], [4, 8], [2, 6], [5, 10], [2, 4], [3, 6]];
const NAMES = ['Mia', 'Ben', 'Lina', 'Noah', 'Emma', 'Paul', 'Sara', 'Jonas'];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
function claimTask(): Task {
  const ok = Math.random() < 0.5, [a, b] = pick(ok ? CLAIM_T : CLAIM_F), who = pick(NAMES), l = (a * b) / gcd(a, b);
  const claim = `Jede Zahl, die durch ${a} teilbar ist, ist auch durch ${b} teilbar.`;
  const prompt = `${who} behauptet: „${claim}“ Stimmt das? Wähle die Antwort mit der richtigen Begründung.`;
  const d = l * R(2, Math.max(2, Math.floor(90 / l)));
  if (ok) {
    const k = a / b, e = pick([1, 2, 3, 4, 5, 6, 7].map(m => b * m).filter(x => x % a !== 0 && x > 2));
    return pickTask(prompt, `Wahr. ${a} = ${k} · ${b}, also ist jedes Vielfache von ${a} auch ein Vielfaches von ${b}.`, [
      { html: `Falsch. ${e} ist durch ${b} teilbar, aber nicht durch ${a}.`, why: `Das ist die umgekehrte Richtung. In der Behauptung geht es um Zahlen, die durch ${a} teilbar sind.` },
      { html: `Falsch. ${d} ist durch ${a} teilbar, aber nicht durch ${b}.`, why: `Prüfe: ${d} : ${b} = ${d / b}. Das geht auf.` },
      { html: `Wahr, weil ${a} größer ist als ${b}.`, why: 'Größer reicht nicht. 9 ist größer als 4, aber 9 ist nicht durch 4 teilbar.' },
    ], [{ rule: 'Begründen', lines: [`${a} = ${k} · ${b}`, `Jede Zahl, die durch ${a} teilbar ist, ist ein Vielfaches von ${a} und damit auch von ${b}.`, 'Die Behauptung ist wahr.'] }], [
      { title: 'Passt b in a?', ask: `<p>Rechne ${M(`${a} : ${b}`)}.</p>`, answer: q(k), explain: `${a} = ${k} · ${b}. Jedes Vielfache von ${a} ist also auch ein Vielfaches von ${b}.`, hint: `Wie oft passt ${b} in ${a}?` },
      { title: 'Beispiel prüfen', ask: `<p>${d} ist durch ${a} teilbar. Rechne ${M(`${d} : ${b}`)}.</p>`, answer: q(d / b), explain: `${d} : ${b} = ${d / b}. Es geht auf, so wie bei jeder Zahl aus der ${a}er-Reihe.` },
    ], { word: true });
  }
  const c = pick([2, 3, 4, 5, 6, 7, 8, 9].map(m => a * m).filter(x => x % b !== 0));
  const wrong: Choice[] = [
    { html: `Falsch. ${d} ist durch ${a} teilbar, aber nicht durch ${b}.`, why: `${d} : ${b} = ${d / b}. ${d} ist also doch durch ${b} teilbar und kein Gegenbeispiel.` },
    { html: `Wahr. ${d} ist zum Beispiel durch ${a} und durch ${b} teilbar.`, why: 'Ein Beispiel zeigt nicht, dass es immer stimmt. Ein Gegenbeispiel reicht aber, um eine Behauptung zu widerlegen.' },
  ];
  if (b % a === 0) wrong.push({ html: `Wahr. ${b} ist ein Vielfaches von ${a}.`, why: `Andersherum wäre es richtig: Jede Zahl, die durch ${b} teilbar ist, ist durch ${a} teilbar.` });
  return pickTask(prompt, `Falsch. ${c} ist durch ${a} teilbar, aber nicht durch ${b}.`, wrong,
    [{ rule: 'Gegenbeispiel', lines: [`${c} : ${a} = ${c / a}, aber ${c} : ${b} = ${Math.floor(c / b)} Rest ${c % b}.`, 'Ein Gegenbeispiel reicht: Die Behauptung ist falsch.'] }], [
      { title: 'Durch a?', ask: `<p>Prüfe die Zahl ${B(String(c))}. Rechne ${M(`${c} : ${a}`)}.</p>`, answer: q(c / a), explain: `${c} : ${a} = ${c / a}. ${c} ist durch ${a} teilbar.` },
      { title: 'Durch b?', ask: `<p>Teile ${c} durch ${b}. Welcher Rest bleibt?</p>`, answer: q(c % b), explain: `${c} : ${b} = ${Math.floor(c / b)} Rest ${c % b}. ${c} ist also nicht durch ${b} teilbar. Das ist ein Gegenbeispiel.`, hint: `Wie viel bleibt übrig, wenn du ${b}er-Päckchen machst?`, placeholder: 'Rest' },
    ], { word: true });
}
function primText(level: number): Task | null {
  return genFrom<Task>(() => {
    const r = Math.random();
    if (level === 4) {
      if (r < 0.35) {
        const n = R(18, 40), sizes = [3, 4, 5, 6], ok = sizes.filter(s => n % s === 0);
        if (ok.length !== 1) return null;
        const g = ok[0], w = pick(sizes.filter(s => s !== g)), rest = n % w;
        return wordTask({
          prompt: `Die Klasse 5c hat ${n} Kinder. Für ein Spiel sollen gleich große Gruppen mit 3, 4, 5 oder 6 Kindern entstehen, und niemand darf übrig bleiben. Wie viele Gruppen gibt es dann?`,
          steps: [
            { title: `Probiere ${w}er-Gruppen`, ask: `Probiere Gruppen mit ${w} Kindern. Wie viele Kinder bleiben übrig?`, calc: `${n} − ${n - rest}`, explain: `${n} : ${w} = ${Math.floor(n / w)} Rest ${rest}. Das geht nicht.`, hint: `Wie viele ${w}er passen in ${n}? Der Rest bleibt übrig.`, unit: 'Kinder' },
            { title: 'Passende Gruppengröße', ask: 'Bei welcher Gruppengröße bleibt niemand übrig? Rechne aus, wie viele Gruppen es gibt.', calc: `${n} : ${g}`, wrong: sizes.filter(s => s !== g).map(s => `${n} : ${s}`), why: `${n} ist durch ${g} teilbar. Bei den anderen Größen bleibt ein Rest.` },
          ],
          sentence: v => `Es gibt ${v} Gruppen mit je ${g} Kindern.`,
        });
      }
      if (r < 0.7) {
        const c = pick([6, 9]), n = c * R(15, 110);
        if (n < 100 || n > 999) return null;
        const s = qsum(n);
        return wordTask({
          prompt: `Auf dem Hof von Familie Berger wurden ${n} Eier gesammelt. Sie kommen in Kartons zu je ${c} Eiern. Prüfe zuerst mit der Quersumme, ob kein Ei übrig bleibt. Wie viele Kartons werden voll?`,
          steps: [
            { title: 'Quersumme', ask: `Berechne die Quersumme von ${n}.`, calc: digits(n).join(' + '), explain: `${digits(n).join(' + ')} = ${s}. ${s} ist durch ${c === 6 ? 3 : 9} teilbar${c === 6 ? ` und ${n} ist gerade` : ''}. Also ist ${n} durch ${c} teilbar.` },
            { title: 'Kartons', ask: 'Wie viele Kartons werden voll?', calc: `${n} : ${c}`, wrong: [`${n} · ${c}`, `${n} − ${c}`], why: `Wie oft passen ${c} Eier in ${n}? Das ist eine Division.` },
          ],
          sentence: v => `Es werden ${v} Kartons voll, und kein Ei bleibt übrig.`,
        });
      }
      return claimTask();
    }
    if (r < 0.35) return claimTask();
    if (r < 0.7) {
      const k = R(3, 12), n = 24 * k, s = qsum(n);
      return wordTask({
        prompt: `Eine Hühnerfarm hat ${n} Eier. Sie werden in Kartons zu je 6 Eiern gepackt. Je 4 Kartons kommen in eine Kiste. Wie viele Kisten werden voll? Prüfe zuerst, ob beim Packen kein Ei übrig bleibt.`,
        steps: [
          { title: 'Quersumme', ask: `Berechne die Quersumme von ${n}.`, calc: digits(n).join(' + '), explain: `Quersumme ${s}: durch 3 teilbar. ${n} ist gerade. Also ist ${n} durch 6 teilbar.` },
          { title: 'Kartons', ask: 'Wie viele Kartons werden gefüllt?', calc: `${n} : 6`, wrong: [`${n} : 4`, `${n} · 6`], why: 'Erst in 6er-Kartons packen.' },
          { title: 'Kisten', ask: 'Wie viele Kisten werden voll?', calc: `${n / 6} : 4`, wrong: [`${n} : 4`, `${n / 6} · 4`], why: 'Je 4 Kartons in eine Kiste.' },
        ],
        sentence: v => `Es werden ${v} Kisten voll.`, term: `${n} : 6 : 4`,
      });
    }
    const f = Array.from({ length: 4 }, () => pick([2, 2, 3, 3, 5, 7])).sort((a, b) => a - b), n = prod(f);
    if (n > 500) return null;
    const p1 = f[0] * f[1], p2 = p1 * f[2];
    return wordTask({
      prompt: `Rätsel: „Ich bin eine Zahl. Meine Primfaktoren sind ${f.slice(0, 3).join(', ')} und ${f[3]}.“ Welche Zahl ist gemeint? Rechne Schritt für Schritt.`,
      steps: [
        { title: 'Die ersten zwei', ask: `Rechne ${f[0]} · ${f[1]}.`, calc: `${f[0]} · ${f[1]}`, wrong: [`${f[0]} + ${f[1]}`], why: 'Die Primfaktoren werden multipliziert.' },
        { title: 'Den dritten dazu', ask: `Multipliziere mit ${f[2]}.`, calc: `${p1} · ${f[2]}` },
        { title: 'Den vierten dazu', ask: `Multipliziere mit ${f[3]}.`, calc: `${p2} · ${f[3]}` },
      ],
      sentence: v => `Die Zahl ist ${v} = ${powH(f)}.`, term: mulH(f),
    });
  }, t => !t.guide || t.guide.every(s => s.answer.sign() > 0));
}
const PRIM: Topic = {
  id: 'prim', klasse: 5, title: 'Teilbarkeit und Primfaktoren', short: 'Teilbarkeitsregeln anwenden und Zahlen in Primfaktoren zerlegen.',
  exampleSol: () => ({ prompt: 'Zerlege 360 in Primfaktoren und schreibe sie als Potenzen.', sol: list(ladderSteps(360), q(360), `360 = ${powH(factors(360))}`) }),
  theory: `
    <p>Mit den <b>Teilbarkeitsregeln</b> siehst du ohne Rechnen, ob eine Division aufgeht:</p>
    ${table([['durch 2', ['Endziffer 0, 2, 4, 6 oder 8']], ['durch 5', ['Endziffer 0 oder 5']], ['durch 10', ['Endziffer 0']], ['durch 4', ['die letzten zwei Ziffern bilden eine Zahl, die durch 4 teilbar ist']], ['durch 3', ['die Quersumme ist durch 3 teilbar']], ['durch 9', ['die Quersumme ist durch 9 teilbar']], ['durch 6', ['durch 2 und durch 3 teilbar']]])}
    <p>Beispiel: ${M('4 518')} hat die Quersumme ${M('4 + 5 + 1 + 8 = 18')}. 18 ist durch 9 teilbar, also ist 4 518 durch 9 teilbar. Die letzten zwei Ziffern sind 18, und 18 ist nicht durch 4 teilbar. Also ist 4 518 nicht durch 4 teilbar.</p>
    <p>Eine <b>Primzahl</b> hat genau zwei Teiler: 1 und sich selbst. Jede andere Zahl größer als 1 kannst du als Produkt von Primzahlen schreiben. Das ist die <b>Primfaktorzerlegung</b>. Du teilst immer wieder durch den kleinsten Primfaktor:</p>
    ${table([['Zahl', [360, 180, 90, 45, 15, 5]], ['geteilt durch', [2, 2, 2, 3, 3, '5 ist Primzahl']]])}
    <p>Also ist ${M('360 = 2 · 2 · 2 · 3 · 3 · 5')}. Kürzer mit Potenzen: ${M('360 = 2<sup>3</sup> · 3<sup>2</sup> · 5')}. Die Hochzahl sagt, wie oft der Faktor vorkommt.</p>
    ${merke(['Endziffer für 2, 5 und 10. Letzte zwei Ziffern für 4. Quersumme für 3 und 9.', 'Durch 6 teilbar heißt: durch 2 <b>und</b> durch 3 teilbar.', 'In der Primfaktorzerlegung stehen nur Primzahlen. 4 · 3 · 5 ist keine, weil 4 = 2 · 2.'])}`,
  gen(level: number) {
    return genFrom<Task>(() => {
      if (level === 1) return Math.random() < 0.6 ? endTask() : primYN();
      if (level === 2) { const r = Math.random(); return r < 0.3 ? q39Task() : r < 0.5 ? by4Task() : r < 0.7 ? by6Task() : comboTask(); }
      const r = Math.random(); return r < 0.4 ? zerlegPick() : r < 0.65 ? countTask() : powTask();
    }, t => !!t);
  },
  text: primText,
};

/* =================================================================== */
/* ---------- 2. Häufigkeiten und Diagramme ---------- */
/* =================================================================== */
const COLORS = ['rot', 'blau', 'grün', 'gelb', 'lila'];
const TIERE = ['Hund', 'Katze', 'Hase', 'Pferd', 'Vogel', 'Fisch'];
const SPORTS = ['Fußball', 'Schwimmen', 'Tanzen', 'Reiten', 'Turnen', 'Tennis'];
const WEG = ['Rad', 'Bus', 'Auto', 'zu Fuß'];
const PAUSE = ['Apfel', 'Brezel', 'Brot', 'Müsli'];

function barsSVG(labels: string[], vals: number[], unit: string, start = 0, stepIn?: number): string {
  const max = Math.max(...vals), range = max - start;
  const step = stepIn ?? (range > 60 ? 10 : range > 24 ? 5 : range > 12 ? 2 : 1), top = start + Math.ceil(range / step) * step, H = 150, bw = 220 / labels.length;
  const y = (v: number) => 22 + H - ((v - start) / (top - start)) * H;
  let g = '';
  for (let v = start; v <= top; v += step) g += `<line class="gl" x1="40" y1="${y(v)}" x2="270" y2="${y(v)}" /><text class="tk" x="34" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const bars = vals.map((v, i) => { const x = 48 + i * bw; return `<rect class="bar-r" x="${x}" y="${y(v)}" width="${bw - 10}" height="${22 + H - y(v)}" /><text class="tk" x="${x + (bw - 10) / 2}" y="${H + 38}" text-anchor="middle">${labels[i].length > 7 ? labels[i].slice(0, 6) + '.' : labels[i]}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 280 ${H + 46}" role="img" aria-label="Säulendiagramm ${unit}${start ? `, die Achse beginnt bei ${start}` : ''}: ${labels.map((l, i) => `${l} ${vals[i]}`).join(', ')}">${g}${bars}<text class="tk" x="40" y="10" text-anchor="end">${unit}</text></svg>`;
}
const OP = [1, 0.6, 0.35, 0.15];
/** Streifendiagramm: 20 Kästchen zu je 5 %. */
function stripSVG(labels: string[], pct: number[]): string {
  const x0 = 10, W = 280, cw = W / 20;
  let x = x0, seg = '', lab = '';
  pct.forEach((p, i) => { const w = (p / 100) * W; seg += `<rect class="bar-r" x="${x}" y="16" width="${w}" height="34" fill-opacity="${OP[i]}" />`; lab += `<text class="tk" x="${x + w / 2}" y="66" text-anchor="middle">${labels[i]}</text>`; x += w; });
  let grid = '';
  for (let k = 0; k <= 20; k++) grid += `<line class="gl" x1="${x0 + k * cw}" y1="16" x2="${x0 + k * cw}" y2="50" />`;
  grid += `<line class="gl" x1="${x0}" y1="16" x2="${x0 + W}" y2="16" /><line class="gl" x1="${x0}" y1="50" x2="${x0 + W}" y2="50" />`;
  const ticks = [0, 50, 100].map(v => `<text class="tk" x="${x0 + (v / 100) * W}" y="11" text-anchor="middle">${v} %</text>`).join('');
  return `<svg class="chart" viewBox="0 0 300 74" role="img" aria-label="Streifendiagramm mit 20 Kästchen zu je 5 Prozent: ${labels.map((l, i) => `${l} ${pct[i] / 5} Kästchen`).join(', ')}">${seg}${grid}${ticks}${lab}</svg>`;
}
/** Kreisdiagramm in Achteln. */
function circleSVG(labels: string[], eighths: number[]): string {
  const cx = 120, cy = 105, r = 75, P = (a: number, rr = r) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  let a = -Math.PI / 2, seg = '', lab = '';
  eighths.forEach((m, i) => {
    const b = a + (m / 8) * 2 * Math.PI, [x0, y0] = P(a), [x1, y1] = P(b), [lx, ly] = P((a + b) / 2, r + 16);
    seg += `<path class="bar-r" fill-opacity="${OP[i]}" d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${m > 4 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" />`;
    lab += `<text class="tk" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle'}">${labels[i]}</text>`;
    a = b;
  });
  let grid = `<circle class="gl" cx="${cx}" cy="${cy}" r="${r}" fill="none" />`;
  for (let k = 0; k < 8; k++) { const [x, y] = P(-Math.PI / 2 + (k * Math.PI) / 4); grid += `<line class="gl" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`; }
  return `<svg class="chart" viewBox="-40 0 320 210" role="img" aria-label="Kreisdiagramm in 8 gleichen Teilen: ${labels.map((l, i) => `${l} ${eighths[i]} Achtel`).join(', ')}">${seg}${grid}${lab}</svg>`;
}
/** Zahl `total` zufällig auf k Teile verteilen, jedes Teil mindestens `min`. */
function split(total: number, k: number, min = 1, step = 1): number[] | null {
  const free = total / step - k * (min / step);
  if (free < 0 || !Number.isInteger(free)) return null;
  const cuts = Array.from({ length: k - 1 }, () => R(0, free)).sort((a, b) => a - b), out: number[] = [];
  let prev = 0;
  for (const c of [...cuts, free]) { out.push((c - prev) * step + min); prev = c; }
  return out;
}
const freqTable = (head: string, labels: string[], vals: number[]) => table([[head, labels], ['Anzahl', vals]]);

function urlisteTask(): Task | null {
  const k = R(3, 4), labels = shuffle(COLORS).slice(0, k), vals = labels.map(() => R(1, 6)), raw = shuffle(labels.flatMap((l, i) => Array(vals[i]).fill(l)));
  if (raw.length < 10) return null;
  const listH = `<p><i>${raw.join(', ')}</i></p>`;
  if (Math.random() < 0.35) {
    const mx = Math.max(...vals); if (vals.filter(v => v === mx).length > 1) return null;
    const i = vals.indexOf(mx);
    return pickTask(`Die Kinder der 5a nennen ihre Lieblingsfarbe:${listH}Welche Farbe kommt am <b>häufigsten</b> vor?`, labels[i], labels.filter((_, j) => j !== i).map(l => ({ html: l, why: `Zähle noch einmal: ${l} kommt ${vals[labels.indexOf(l)]}-mal vor, ${labels[i]} ${mx}-mal.` })),
      [{ rule: 'Auszählen', lines: labels.map((l, j) => `${l}: ${vals[j]}`) }, { rule: 'Vergleichen', lines: [`Am häufigsten: ${labels[i]} (${mx}-mal).`] }],
      [{ title: 'Auszählen', ask: `<p>Mach eine Strichliste. Wie oft kommt ${B(labels[i])} vor?</p>`, answer: q(mx), explain: `${labels[i]}: ${mx}-mal. Vergleiche mit den anderen Farben.`, hint: 'Streiche jedes Wort ab, das du gezählt hast.', placeholder: 'Anzahl' }]);
  }
  const i = R(0, k - 1);
  return { prompt: `Die Kinder der 5a nennen ihre Lieblingsfarbe:${listH}Wie oft kommt ${B(labels[i])} vor?`, answer: q(vals[i]), placeholder: 'Anzahl',
    sol: list([{ rule: 'Auszählen', lines: [`${labels[i]} kommt ${vals[i]}-mal vor.`, `Zum Vergleich: ${labels.map((l, j) => `${l} ${vals[j]}`).join(', ')}. Zusammen ${raw.length} Kinder.`] }], q(vals[i])),
    guide: [{ title: 'Strichliste', ask: `<p>Geh die Liste von vorne durch und mach für jedes ${B(labels[i])} einen Strich. Wie viele Striche sind es?</p>`, answer: q(vals[i]), explain: `${labels[i]}: ${vals[i]}-mal`, hint: 'Streiche jedes Wort ab, das du gezählt hast.', placeholder: 'Anzahl' }],
    diag: v => (v.eq(q(raw.length)) ? 'Das sind alle Kinder zusammen. Zähle nur die eine Farbe.' : null) };
}
function barWidgetTask(): Task | null {
  const k = R(4, 5), labels = shuffle(Math.random() < 0.5 ? TIERE : SPORTS).slice(0, k), step = pick([1, 2]), vals = labels.map(() => R(1, step === 1 ? 10 : 8) * step), i = R(0, k - 1);
  const top = Math.ceil(Math.max(...vals) / step) * step + step;
  const shown = labels.map(l => (l.length > 7 ? l.slice(0, 6) + '.' : l));
  return { prompt: `Die Klasse 6b hat eine Umfrage gemacht:${freqTable('', shown, vals)}Im Säulendiagramm fehlt die Säule für ${B(labels[i])}. Zieh sie auf die richtige Höhe.`, answer: q(vals[i]), placeholder: 'Säule',
    widget: { kind: 'bar', labels: shown, vals: vals.map((v, j) => (j === i ? null : v)), top, step, unit: 'Kinder' },
    sol: list([{ rule: 'In der Tabelle ablesen', lines: [`${labels[i]}: ${vals[i]} Kinder`] }, { rule: 'Säule zeichnen', lines: [`Die Säule für ${labels[i]} geht bis ${vals[i]}.${step === 2 ? ' Eine Linie im Diagramm sind 2 Kinder.' : ''}`] }], q(vals[i]), `${vals[i]} Kinder`),
    guide: [{ title: 'Ablesen', ask: `<p>Wie viele Kinder stehen in der Tabelle bei ${B(labels[i])}?</p>`, answer: q(vals[i]), explain: `${vals[i]} Kinder. Zieh die Säule bis zur Linie ${vals[i]}.`, hint: 'Suche die Spalte in der Tabelle.', placeholder: 'Anzahl' }] };
}
function relTask(): Task | null {
  const k = R(3, 4), total = pick([12, 16, 18, 20, 24, 25, 30, 32]), vals = split(total, k, 1); if (!vals) return null;
  const labels = shuffle(TIERE).slice(0, k), i = R(0, k - 1), c = vals[i], v = q(c, total).red();
  if (v.isInt() || v.d === BigInt(total)) return null; // soll kürzbar sein
  return { prompt: `Die Kinder der 6a haben ihr Lieblingstier genannt:${freqTable('Tier', labels, vals)}Wie groß ist die <b>relative Häufigkeit</b> von ${B(labels[i])}? Gib sie als gekürzten Bruch an.`, answer: v, needReduced: true, form: 'frac', placeholder: 'z. B. 2/5',
    sol: list([{ rule: 'Gesamtzahl', lines: [`${vals.join(' + ')} = ${total}`] }, { rule: 'Relative Häufigkeit', lines: [`Anzahl : Gesamtzahl = ${qH(q(c, total))} = ${qH(v)}`] }], v),
    guide: [
      { title: 'Gesamtzahl', ask: '<p>Wie viele Kinder haben insgesamt geantwortet?</p>', answer: q(total), explain: `${vals.join(' + ')} = ${total}`, hint: 'Addiere alle Anzahlen.' },
      { title: 'Bruch bilden und kürzen', ask: `<p>Relative Häufigkeit = Anzahl : Gesamtzahl. Schreibe ${c} von ${total} als Bruch und kürze vollständig.</p>`, answer: v, needReduced: true, explain: `${M(`${qH(q(c, total))} = ${qH(v)}`)}`, hint: `Zähler ${c}, Nenner ${total}. Dann kürzen.`, placeholder: 'z. B. 2/5' },
    ],
    diag: x => (x.eq(q(total, c)) ? 'Zähler und Nenner sind vertauscht. Oben steht die Anzahl, unten die Gesamtzahl.' : x.eq(q(c)) ? 'Das ist die absolute Häufigkeit. Teile noch durch die Gesamtzahl.' : null) };
}
function pctTask(): Task | null {
  const k = R(3, 4), total = pick([20, 25, 50]), vals = split(total, k, 1); if (!vals) return null;
  const labels = shuffle(SPORTS).slice(0, k), i = R(0, k - 1), c = vals[i], p = (c * 100) / total, f = 100 / total;
  return { prompt: `${total} Kinder haben ihren Lieblingssport genannt:${freqTable('Sport', labels, vals)}Wie viel Prozent der Kinder haben ${B(labels[i])} gewählt?`, answer: q(p), placeholder: 'Antwort in %',
    sol: list([{ rule: 'Relative Häufigkeit', lines: [`${qH(q(c, total))}`] }, { rule: 'Auf Hundertstel erweitern', lines: [`${qH(q(c, total))} = ${qH(q(c * f, 100))} = ${p} %`] }], q(p), `${p} %`),
    guide: [
      { title: 'Erweitern', ask: `<p>Der Anteil ist ${M(qH(q(c, total)))}. Mit welcher Zahl erweiterst du, damit unten 100 steht?</p>`, answer: q(f), explain: `${total} · ${f} = 100`, hint: `${total} · ? = 100` },
      { title: 'Prozent', ask: `<p>${M(`${qH(q(c, total))} = ${qH(q(c * f, 100))}`)} Wie viel Prozent sind das?</p>`, answer: q(p), explain: `${p} Hundertstel sind ${p} %.`, hint: 'Prozent heißt Hundertstel.', placeholder: 'Antwort in %' },
    ],
    diag: x => (x.eq(q(c, total)) ? 'Das ist der Anteil als Zahl. Für Prozent rechnest du mal 100.' : x.eq(q(c)) ? 'Das ist die Anzahl. Gefragt ist der Anteil in Prozent.' : null) };
}
function statementTask(): Task | null {
  const k = 4, labels = shuffle(SPORTS).slice(0, k), vals = labels.map(() => R(2, 14)), S = vals.reduce((a, b) => a + b, 0);
  if (uniq(vals).length < k) return null;
  const mx = Math.max(...vals), mn = Math.min(...vals), iMax = vals.indexOf(mx), iMin = vals.indexOf(mn);
  const st: { t: string; ok: boolean }[] = [];
  labels.forEach((l, i) => {
    st.push({ t: `${B(l)} wurde am häufigsten gewählt.`, ok: i === iMax });
    st.push({ t: `${B(l)} wurde am seltensten gewählt.`, ok: i === iMin });
    labels.forEach((m, j) => {
      if (i === j) return;
      if (vals[i] > vals[j]) { const d = vals[i] - vals[j]; st.push({ t: `Für ${B(l)} haben ${d} Kinder mehr gestimmt als für ${B(m)}.`, ok: true }); st.push({ t: `Für ${B(l)} haben ${d + pick([1, 2])} Kinder mehr gestimmt als für ${B(m)}.`, ok: false }); st.push({ t: `Für ${B(m)} haben ${d} Kinder mehr gestimmt als für ${B(l)}.`, ok: false }); }
      if (vals[i] === 2 * vals[j]) st.push({ t: `${B(l)} wurde doppelt so oft gewählt wie ${B(m)}.`, ok: true });
      else if (vals[i] > vals[j]) st.push({ t: `${B(l)} wurde doppelt so oft gewählt wie ${B(m)}.`, ok: false });
    });
  });
  st.push({ t: `Insgesamt haben ${S} Kinder abgestimmt.`, ok: true }, { t: `Insgesamt haben ${S + pick([-2, -1, 1, 2])} Kinder abgestimmt.`, ok: false }, { t: `Insgesamt haben ${S - mn} Kinder abgestimmt.`, ok: false });
  const trues = st.filter(s => s.ok), falses = uniq(st.filter(s => !s.ok).map(s => s.t));
  const right = pick(trues).t, wrong = shuffle(falses).slice(0, 3);
  return pickTask(`Die Klasse 6c hat abgestimmt: Welcher Sport gefällt dir am besten?${barsSVG(labels, vals, 'Kinder')}Welche Aussage passt zum Diagramm?`, right, wrong.map(w => ({ html: w, why: 'Lies die Werte noch einmal genau ab und rechne nach.' })),
    [{ rule: 'Ablesen', lines: [labels.map((l, i) => `${l}: ${vals[i]}`).join(', '), `Zusammen: ${vals.join(' + ')} = ${S}`] }, { rule: 'Prüfen', lines: [`Richtig ist: ${right}`] }],
    [
      { title: 'Höchste Säule', ask: '<p>Wie hoch ist die höchste Säule?</p>', answer: q(mx), explain: `${labels[iMax]}: ${mx} Kinder`, hint: 'Von der Säule oben waagerecht nach links.' },
      { title: 'Niedrigste Säule', ask: '<p>Wie hoch ist die niedrigste Säule?</p>', answer: q(mn), explain: `${labels[iMin]}: ${mn} Kinder` },
      { title: 'Alle zusammen', ask: '<p>Wie viele Kinder haben insgesamt abgestimmt?</p>', answer: q(S), explain: `${vals.join(' + ')} = ${S}. Prüfe jetzt jede Aussage mit deinen Werten.`, hint: 'Addiere alle Säulen.' },
    ]);
}
function trickTask(): Task | null {
  const a = pick([20, 30, 40, 50, 60, 80]), r = pick([q(5, 4), q(3, 2), q(2)]), bQ = q(a).mul(r);
  if (!bQ.isInt()) return null;
  const b = Number(bQ.n), starts: number[] = [];
  for (let s = 5; s < a; s += 5) { const vis = (b - s) / (a - s); if (Number.isInteger(vis) && vis >= 3 && vis <= 6) starts.push(s); }
  if (!starts.length) return null;
  const s = pick(starts), vis = (b - s) / (a - s), step = (b - s) / 5 <= 10 ? 5 : 10;
  if (s % step) return null;
  const yrs = ['2023', '2024'], chart = barsSVG(yrs, [a, b], 'Mitglieder', s, step), rH = dH(r);
  const pre = `Der Sportverein zeigt in seiner Zeitung, wie viele Mitglieder er hat:${chart}`;
  const steps: Steps = [{ rule: 'Achse prüfen', lines: [`Die Achse beginnt bei ${s}, nicht bei 0.`, `Die Säule für 2024 ist ${vis}-mal so hoch wie die für 2023.`] }, { rule: 'Wirklich vergleichen', lines: [`${b} : ${a} = ${rH}`, `Es sind wirklich nur ${rH}-mal so viele Mitglieder.`] }];
  if (Math.random() < 0.5) {
    return pickTask(`${pre}Die Säule für 2024 sieht viel größer aus. <b>Warum täuscht das Diagramm?</b>`, `Die Achse beginnt bei ${s} und nicht bei 0. Dadurch sieht der Unterschied viel größer aus.`, [
      { html: `Es täuscht nicht. 2024 gibt es wirklich ${vis}-mal so viele Mitglieder.`, why: `Lies die Werte ab: ${a} und ${b}. ${b} ist nicht das ${vis}-Fache von ${a}.` },
      { html: 'Die Säulen sind zu schmal gezeichnet.', why: 'Die Breite ist egal. Es geht um die Höhe und darum, wo die Achse beginnt.' },
      { html: 'Die Jahre sind falsch herum aufgeschrieben.', why: 'Die Reihenfolge stimmt. Schau dir die Zahlen an der Achse an.' },
    ], steps, [
      { title: 'Achse ansehen', ask: '<p>Bei welcher Zahl beginnt die senkrechte Achse ganz unten?</p>', answer: q(s), explain: `Sie beginnt bei ${s}. Der Teil von 0 bis ${s} ist abgeschnitten.`, hint: 'Schau auf die unterste Zahl links.' },
      { title: 'Wirklicher Wert', ask: '<p>Wie viele Mitglieder hatte der Verein 2024?</p>', answer: q(b), explain: `2024: ${b}, 2023: ${a}. Das ist kein ${vis}-Faches.` },
    ]);
  }
  const cands = uniq([String(vis), '2', '3', dec(Number(r.n) / Number(r.d) + 1), String(vis + 1)]).filter(x => x !== rH).slice(0, 3);
  return pickTask(`${pre}Die Säule für 2024 ist ${vis}-mal so hoch wie die für 2023. <b>Wievielmal so viele Mitglieder</b> sind es 2024 wirklich?`, `${rH}-mal so viele`, cands.map(c => ({ html: `${c}-mal so viele`, why: c === String(vis) ? `So sieht es nur aus, weil die Achse bei ${s} beginnt. Rechne mit den echten Werten: ${b} : ${a}.` : `Rechne mit den echten Werten: ${b} : ${a}.` })), steps, [
    { title: '2023', ask: '<p>Wie viele Mitglieder waren es 2023?</p>', answer: q(a), explain: `${a} Mitglieder` },
    { title: '2024', ask: '<p>Wie viele Mitglieder waren es 2024?</p>', answer: q(b), explain: `${b} Mitglieder` },
    { title: 'Teilen', ask: `<p>Wievielmal so viel ist ${b} wie ${a}?</p><div class="math big">${b} : ${a} = ?</div>`, answer: r, explain: `${b} : ${a} = ${rH}`, hint: 'Teile den größeren Wert durch den kleineren.' },
  ]);
}
const pctOk = (k: number, n: number) => Number.isInteger((k * 100) / n);
function compareTask(): Task | null {
  const n1 = pick([20, 25, 30]), n2 = pick([20, 25, 30]), k1 = R(3, n1 - 3), k2 = R(3, n2 - 3);
  if (!pctOk(k1, n1) || !pctOk(k2, n2) || n1 === n2) return null;
  const p1 = (k1 * 100) / n1, p2 = (k2 * 100) / n2;
  if (Math.abs(p1 - p2) > 25) return null;
  if (p1 !== p2 && (k1 > k2) === (p1 > p2) && Math.random() < 0.7) return null; // meist eine Falle: mehr Kinder, aber kleinerer Anteil
  const thing = pick(['ein Haustier', 'ein Musikinstrument', 'ein eigenes Handy']), ri = p1 > p2 ? 0 : p1 < p2 ? 1 : 2;
  const L = ['In der 6a ist der Anteil größer.', 'In der 6b ist der Anteil größer.', 'Der Anteil ist in beiden Klassen gleich groß.'];
  const trapWhy = 'Vergleiche die Anteile, nicht die Anzahlen. Die Klassen sind verschieden groß.';
  return pickTask(`In der 6a haben ${k1} von ${n1} Kindern ${thing}. In der 6b sind es ${k2} von ${n2} Kindern. In welcher Klasse ist der <b>Anteil</b> größer?`, L[ri], L.filter((_, i) => i !== ri).map(h => ({ html: h, why: trapWhy })),
    [{ rule: 'Anteile in Prozent', lines: [`6a: ${qH(q(k1, n1))} = ${p1} %`, `6b: ${qH(q(k2, n2))} = ${p2} %`] }, { rule: 'Vergleichen', lines: [L[ri]] }],
    [
      { title: 'Anteil 6a', ask: `<p>Wie viel Prozent sind ${k1} von ${n1}?</p>`, answer: q(p1), explain: `${qH(q(k1, n1))} = ${qH(q((k1 * 100) / n1, 100))} = ${p1} %`, hint: `Erweitere ${qH(q(k1, n1))} so, dass unten 100 steht.`, placeholder: 'Antwort in %' },
      { title: 'Anteil 6b', ask: `<p>Wie viel Prozent sind ${k2} von ${n2}?</p>`, answer: q(p2), explain: `${qH(q(k2, n2))} = ${qH(q((k2 * 100) / n2, 100))} = ${p2} %`, placeholder: 'Antwort in %' },
    ]);
}
function stripTask(): Task | null {
  if (Math.random() < 0.5) {
    const k = R(3, 4), pct = split(100, k, 15, 5); if (!pct) return null;
    const labels = WEG.slice(0, k), i = R(0, k - 1), cells = pct[i] / 5, N = pick([0, 20, 40, 60]);
    const base = `Das Streifendiagramm zeigt, wie die Kinder der 6a zur Schule kommen. Ein Kästchen sind 5 %.${stripSVG(labels, pct)}`;
    const g: GuideStep[] = [
      { title: 'Kästchen zählen', ask: `<p>Wie viele Kästchen gehören zu ${B(labels[i])}?</p>`, answer: q(cells), explain: `${cells} Kästchen`, hint: 'Zähle die Kästchen im Abschnitt.' },
      { title: 'In Prozent', ask: `<p>Ein Kästchen sind 5 %. Wie viel Prozent sind ${cells} Kästchen?</p>`, answer: q(pct[i]), explain: `${cells} · 5 % = ${pct[i]} %`, placeholder: 'Antwort in %' },
    ];
    const how = labels[i] === 'zu Fuß' ? 'zu Fuß' : `mit dem ${labels[i]}`;
    if (!N) return { prompt: `${base}Wie viel Prozent der Kinder kommen ${how}?`, answer: q(pct[i]), placeholder: 'Antwort in %',
      sol: list([{ rule: 'Ablesen', lines: [`${labels[i]}: ${cells} Kästchen`, `${cells} · 5 % = ${pct[i]} %`] }], q(pct[i]), `${pct[i]} %`), guide: g,
      diag: x => (x.eq(q(cells)) ? 'Das ist die Zahl der Kästchen. Ein Kästchen sind 5 %.' : null) };
    const c = (pct[i] * N) / 100;
    if (!Number.isInteger(c)) return null;
    return { prompt: `${base}In der 6a sind ${N} Kinder. Wie viele Kinder kommen ${how}?`, answer: q(c), placeholder: 'Anzahl',
      sol: list([{ rule: 'Ablesen', lines: [`${labels[i]}: ${cells} Kästchen = ${pct[i]} %`] }, { rule: 'Anzahl', lines: [`${pct[i]} % von ${N} = ${N} : 100 · ${pct[i]} = ${c}`] }], q(c), `${c} Kinder`),
      guide: [...g, { title: 'Anzahl', ask: `<p>Wie viele Kinder sind ${pct[i]} % von ${N}?</p><div class="math big">${N} : 100 · ${pct[i]} = ?</div>`, answer: q(c), explain: `${c} Kinder`, hint: `1 % von ${N} ist ${dec(N / 100)}.`, placeholder: 'Anzahl' }],
      diag: x => (x.eq(q(pct[i])) ? `${pct[i]} ist der Anteil in Prozent. Gefragt ist die Anzahl der Kinder.` : null) };
  }
  const e = split(8, 3, 1); if (!e) return null;
  const labels = PAUSE.slice(0, 3), i = R(0, 2), v = q(e[i], 8).red();
  return { prompt: `Das Kreisdiagramm zeigt, was die Kinder der 5b in der Pause essen.${circleSVG(labels, e)}Welcher Anteil der Kinder isst ${B(({ Apfel: 'einen Apfel', Brezel: 'eine Brezel', Brot: 'ein Brot', Müsli: 'Müsli' } as Record<string, string>)[labels[i]])}? Gib den Anteil als gekürzten Bruch an.`, answer: v, needReduced: true, form: 'frac', placeholder: 'z. B. 3/8',
    sol: list([{ rule: 'Teile zählen', lines: ['Der Kreis ist in 8 gleiche Teile geteilt.', `${labels[i]}: ${e[i]} Teile, also ${qH(q(e[i], 8))}${v.d !== 8n ? ` = ${qH(v)}` : ''}`] }], v),
    guide: [
      { title: 'Teile im Kreis', ask: '<p>In wie viele gleiche Teile ist der ganze Kreis geteilt?</p>', answer: q(8), explain: 'In 8 Teile: Achtel.', hint: 'Zähle alle Stücke, auch die der anderen.' },
      { title: 'Teile zählen', ask: `<p>Wie viele Achtel gehören zu ${B(labels[i])}?</p>`, answer: q(e[i]), explain: `${e[i]} Achtel` },
      { title: 'Als Bruch', ask: `<p>Schreibe ${e[i]} Achtel als Bruch und kürze, wenn es geht.</p>`, answer: v, needReduced: true, explain: `${M(`${qH(q(e[i], 8))}${v.d !== 8n ? ` = ${qH(v)}` : ''}`)}`, placeholder: 'z. B. 3/8' },
    ],
    diag: x => (x.eq(q(e[i])) ? 'Das ist die Zahl der Teile. Schreibe den Anteil als Bruch: Teile durch 8.' : null) };
}
function haeufGen(level: number): Task | null {
  return genFrom<Task>(() => {
    const r = Math.random();
    if (level === 1) return r < 0.5 ? urlisteTask() : barWidgetTask();
    if (level === 2) return r < 0.35 ? relTask() : r < 0.7 ? pctTask() : statementTask();
    return r < 0.35 ? trickTask() : r < 0.65 ? compareTask() : stripTask();
  }, t => !!t);
}
function haeufText(level: number): Task | null {
  return genFrom(() => {
    const r = Math.random(), n = pick([20, 25, 50]);
    if (level === 4) {
      if (r < 0.5) {
        const vals = split(n, 4, 2); if (!vals) return null;
        const i = R(0, 3), labels = ['mit dem Rad', 'mit dem Bus', 'mit dem Auto', 'zu Fuß'];
        return wordTask({
          prompt: `${n === 50 ? 'In den beiden 6. Klassen' : 'In der Klasse 6b'} wurde gefragt, wie die Kinder zur Schule kommen. ${vals[0]} kommen mit dem Rad, ${vals[1]} mit dem Bus, ${vals[2]} mit dem Auto und ${vals[3]} zu Fuß. Wie viel Prozent der Kinder kommen ${labels[i]}?`,
          steps: [
            { title: 'Alle Kinder', ask: 'Wie viele Kinder wurden gefragt?', calc: vals.join(' + '), unit: 'Kinder' },
            { title: 'Anteil in Prozent', ask: `Wie viel Prozent sind ${vals[i]} von ${n}?`, calc: `${vals[i]} : ${n} · 100`, wrong: [`${n} : ${vals[i]} · 100`, `${vals[i]} · ${n} : 100`], why: 'Anteil = Anzahl : Gesamtzahl. Mal 100 ergibt Prozent.', unit: '%' },
          ],
          unit: '%', sentence: v => `${v} der Kinder kommen ${labels[i]}.`,
        });
      }
      const p = pick([20, 30, 40, 60, 12, 24, 36, 44, 48]), c = (p * n) / 100;
      if (!Number.isInteger(c) || c < 2) return null;
      const thing = pick(['spielen ein Instrument', 'haben ein Haustier', 'sind im Sportverein']);
      return wordTask({
        prompt: `Bei einer Umfrage ${n === 50 ? 'in den 6. Klassen' : 'in der Klasse 6c'} mit ${n} Kindern kam heraus: ${p} % ${thing}. Wie viele Kinder sind das?`,
        steps: [
          { title: '1 Prozent', ask: `Wie viele Kinder sind 1 % von ${n}?`, calc: `${n} : 100`, wrong: [`${n} · 100`], why: '1 % ist ein Hundertstel: durch 100 teilen.', unit: 'Kinder' },
          { title: `${p} Prozent`, ask: `Wie viele Kinder sind ${p} %?`, calc: `${dec(n / 100)} · ${p}`, unit: 'Kinder' },
        ],
        unit: 'Kinder', sentence: v => `${v} ${thing}.`,
      });
    }
    if (r < 0.5) {
      const n1 = pick([20, 25]), n2 = n1 === 20 ? 25 : 20, k1 = R(4, n1 - 4), k2 = R(4, n2 - 4), p1 = (k1 * 100) / n1, p2 = (k2 * 100) / n2;
      if (p1 === p2) return null;
      const [hi, lo] = p1 > p2 ? ['6a', '6b'] : ['6b', '6a'];
      return wordTask({
        prompt: `Die Klassen 6a und 6b wurden gefragt, ob sie in der Mittagspause in die Mensa gehen. In der 6a sagen ${k1} von ${n1} Kindern ja, in der 6b ${k2} von ${n2} Kindern. In welcher Klasse ist der Anteil größer, und um wie viele Prozentpunkte?`,
        steps: [
          { title: 'Anteil 6a', ask: 'Wie viel Prozent sind es in der 6a?', calc: `${k1} : ${n1} · 100`, wrong: [`${n1} : ${k1} · 100`], why: 'Anzahl : Gesamtzahl, dann mal 100.', unit: '%' },
          { title: 'Anteil 6b', ask: 'Wie viel Prozent sind es in der 6b?', calc: `${k2} : ${n2} · 100`, unit: '%' },
          { title: 'Unterschied', ask: 'Um wie viele Prozentpunkte ist der größere Anteil größer?', calc: `${Math.max(p1, p2)} − ${Math.min(p1, p2)}` },
        ],
        sentence: v => `In der ${hi} ist der Anteil größer, und zwar um ${v} Prozentpunkte.`,
      });
    }
    const a = R(3, n / 2), b = R(3, n / 2), rest = n - a - b;
    if (rest < 2 || !pctOk(rest, n)) return null;
    return wordTask({
      prompt: `In einer Umfrage unter ${n} Kindern geben ${a} Kinder an, dass sie am liebsten lesen, und ${b}, dass sie am liebsten Sport machen. Alle anderen spielen am liebsten draußen. Wie viel Prozent der Kinder spielen am liebsten draußen?`,
      steps: [
        { title: 'Lesen und Sport', ask: 'Wie viele Kinder lesen oder machen Sport?', calc: `${a} + ${b}`, unit: 'Kinder' },
        { title: 'Draußen', ask: 'Wie viele Kinder spielen am liebsten draußen?', calc: `${n} − ${a + b}`, wrong: [`${n} + ${a + b}`], why: 'Der Rest: alle minus die anderen.', unit: 'Kinder' },
        { title: 'In Prozent', ask: `Wie viel Prozent sind ${rest} von ${n}?`, calc: `${rest} : ${n} · 100`, wrong: [`${n} : ${rest} · 100`], why: 'Anzahl : Gesamtzahl, dann mal 100.', unit: '%' },
      ],
      unit: '%', sentence: v => `${v} der Kinder spielen am liebsten draußen.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0 && s.answer.isInt()));
}
const HAEUF: Topic = {
  id: 'haeuf', klasse: 6, title: 'Häufigkeiten und Diagramme', short: 'Daten auszählen, relative Häufigkeiten berechnen und Diagramme kritisch lesen.',
  exampleSol: () => ({ prompt: 'In der 6a haben 6 von 25 Kindern ein Haustier. Wie groß ist die relative Häufigkeit in Prozent?', sol: list([{ rule: 'Relative Häufigkeit', lines: [`Anzahl : Gesamtzahl = ${qH(q(6, 25))}`] }, { rule: 'Auf Hundertstel erweitern', lines: [`${qH(q(6, 25))} = ${qH(q(24, 100))} = 24 %`] }], q(24), '24 %') }),
  theory: `
    <p>Bei einer Umfrage schreibst du zuerst alle Antworten auf. Das ist die <b>Urliste</b>, zum Beispiel <i>rot, blau, rot, grün, blau, rot</i>. Dann zählst du aus: rot kommt 3-mal vor. Das ist die <b>absolute Häufigkeit</b>.</p>
    <p>Die <b>relative Häufigkeit</b> ist der Anteil an allen: ${M('Anzahl : Gesamtzahl')}. Bei 3 von 6 ist das ${M(qH(q(3, 6)) + ' = ' + qH(q(1, 2)))}, also 50 %. Mit relativen Häufigkeiten kannst du verschieden große Gruppen vergleichen.</p>
    <p>${M('12 von 30')} ist ${M('40 %')}, ${M('10 von 20')} ist ${M('50 %')}. Obwohl 12 mehr ist als 10, ist der Anteil bei 10 von 20 größer.</p>
    <p>Anteile zeigt man gern im <b>Streifendiagramm</b> oder im <b>Kreisdiagramm</b>. Hier ist ein Kästchen 5 %:${stripSVG(['Rad', 'Bus', 'zu Fuß'], [40, 35, 25])}</p>
    <p><b>Vorsicht bei Diagrammen:</b> Beginnt die Achse nicht bei 0, sehen Unterschiede viel größer aus, als sie sind. Hier sieht 60 dreimal so groß aus wie 40, ist aber nur 1,5-mal so groß:${barsSVG(['2023', '2024'], [40, 60], 'Mitglieder', 30, 5)}</p>
    ${merke(['Relative Häufigkeit = Anzahl : Gesamtzahl.', 'In Prozent: auf Hundertstel erweitern. 6/25 = 24/100 = 24 %.', 'Bei Diagrammen immer prüfen: Wo beginnt die Achse?'])}`,
  gen: haeufGen,
  text: haeufText,
};

/* =================================================================== */
/* ---------- 3. Zahlenrätsel, Folgen und Tabellen ---------- */
/* =================================================================== */
const BOX = '□';
type OpK = '+' | '-' | '*' | ':';
interface Op { k: OpK; a: number }
const SYM: Record<OpK, string> = { '+': '+', '-': '−', '*': '·', ':': ':' };
const INV: Record<OpK, OpK> = { '+': '-', '-': '+', '*': ':', ':': '*' };
const ap = (x: number, o: Op) => (o.k === '+' ? x + o.a : o.k === '-' ? x - o.a : o.k === '*' ? x * o.a : x / o.a);
const inv = (y: number, o: Op) => ap(y, { k: INV[o.k], a: o.a });
const okInt = (v: number) => Number.isInteger(v) && v > 0;

function boxTask(): Task | null {
  const k = pick<OpK>(['+', '-', '*', ':']), a = k === '*' || k === ':' ? R(2, 9) : R(5, 40), x = k === ':' ? a * R(2, 9) : R(3, 60);
  const b = ap(x, { k, a }); if (!okInt(b)) return null;
  const eqH = k === '+' && Math.random() < 0.5 ? `${a} + ${BOX} = ${b}` : `${BOX} ${SYM[k]} ${a} = ${b}`;
  const invH = `${b} ${SYM[INV[k]]} ${a}`, wrongV = ap(b, { k, a });
  return { prompt: `Welche Zahl gehört in das Kästchen? ${M(eqH)}`, answer: q(x), placeholder: 'Zahl',
    sol: list([{ rule: 'Umkehraufgabe', lines: [`${invH} = ${x}`] }, { rule: 'Probe', lines: [eqH.replace(BOX, String(x)).replace(/= \d+$/, `= ${b}`) + ' ✓'] }], q(x)),
    guide: [{ title: 'Umkehraufgabe', choose: gc('Mit welcher Rechnung findest du die Zahl?', M(invH), [M(`${b} ${SYM[k]} ${a}`)], `Die Umkehraufgabe von ${SYM[k]} ist ${SYM[INV[k]]}.`), ask: `<div class="math big">${invH} = ?</div>`, answer: q(x), explain: `${invH} = ${x}. Probe: ${eqH.replace(BOX, String(x))}`, hint: `Rechne rückwärts: ${SYM[k]} wird zu ${SYM[INV[k]]}.` }],
    diag: v => (Number.isInteger(wrongV) && v.eq(q(wrongV)) ? `Mach die Probe. Du musst die Umkehraufgabe rechnen: ${SYM[INV[k]]} statt ${SYM[k]}.` : null) };
}
const seqH = (s: number[]) => M(`${s.join(', ')}, …`);
function seqArith(): Task | null {
  const d = pick([2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 15, 25]) * (Math.random() < 0.3 ? -1 : 1), a0 = d > 0 ? R(1, 30) : R(60, 120), s = [0, 1, 2, 3].map(i => a0 + i * d), nx = a0 + 4 * d;
  if (nx <= 0) return null;
  const up = d > 0, ad = Math.abs(d);
  return { prompt: `Setze die Folge fort. Welche Zahl kommt als Nächstes? ${seqH(s)}`, answer: q(nx), placeholder: 'Zahl',
    sol: list([{ rule: 'Regel finden', lines: [`Jedes Mal ${up ? '+' : '−'} ${ad}.`] }, { rule: 'Fortsetzen', lines: [`${s[3]} ${up ? '+' : '−'} ${ad} = ${nx}`] }], q(nx)),
    guide: [
      { title: 'Regel finden', ask: `<p>Um wie viel wird die Folge jedes Mal ${up ? 'größer' : 'kleiner'}?</p>`, answer: q(ad), explain: `Jedes Mal ${up ? '+' : '−'} ${ad}.`, hint: `Rechne ${up ? `${s[1]} − ${s[0]}` : `${s[0]} − ${s[1]}`}.` },
      { title: 'Fortsetzen', ask: `<div class="math big">${s[3]} ${up ? '+' : '−'} ${ad} = ?</div>`, answer: q(nx), explain: `${nx}` },
    ] };
}
const PHR: Record<OpK, (a: number, first: boolean) => string> = {
  '+': a => `addiere ${a}`, '-': a => `ziehe ${a} ab`,
  '*': (a, f) => `multipliziere ${f ? 'sie' : 'das Ergebnis'} mit ${a}`, ':': (a, f) => `teile ${f ? 'sie' : 'das Ergebnis'} durch ${a}`,
};
function thinkOps(n: number): { x: number; ops: Op[]; res: number } | null {
  const x = R(2, 15), ops: Op[] = [];
  const kinds: OpK[] = n === 2 ? shuffle([pick<OpK>(['*', '*', ':']), pick<OpK>(['+', '-'])]) : [pick<OpK>(['*', '+']), pick<OpK>(['+', '-', '*']), pick<OpK>(['*', '+', '-'])];
  let cur = x;
  for (const k of kinds) {
    const divs = [2, 3, 4, 5].filter(d => cur % d === 0);
    const a = k === '*' ? R(2, 6) : k === ':' ? (divs.length ? pick(divs) : 0) : R(2, 20);
    if (!a) return null;
    const o = { k, a }, nx = ap(cur, o); if (!okInt(nx)) return null;
    ops.push(o); cur = nx;
  }
  if (cur > 300 || ops.some((o, i) => i > 0 && o.k === ops[i - 1].k)) return null;
  return { x, ops, res: cur };
}
function thinkTask(n: number, word: boolean): Task | null {
  const t = thinkOps(n); if (!t) return null;
  const { ops, res } = t, phr = ops.map((o, i) => PHR[o.k](o.a, i === 0));
  const story = `„Ich denke mir eine Zahl, ${phr.slice(0, -1).join(', ')} und ${phr[phr.length - 1]}. Ich erhalte ${res}.“`;
  const steps: WordStep[] = [];
  let cur = res;
  [...ops].reverse().forEach((o, i) => {
    const nx = inv(cur, o), first = i === 0;
    const wrong = [`${cur} ${SYM[o.k]} ${o.a}`, ...(first && ops.length > 1 && ops[0].a !== o.a ? [`${cur} ${SYM[INV[ops[0].k]]} ${ops[0].a}`] : [])].filter(w => okInt(eval0(w)));
    steps.push({ title: `${SYM[o.k]} ${o.a} rückgängig`, ask: `Mach den Schritt „${PHR[o.k](o.a, false).replace('das Ergebnis ', '')}“ rückgängig. Was kommt heraus?`, calc: `${cur} ${SYM[INV[o.k]]} ${o.a}`,
      ...(wrong.length ? { wrong, why: `Rückwärts rechnen: Den letzten Schritt machst du zuerst rückgängig, mit der Umkehraufgabe. ${SYM[o.k]} wird zu ${SYM[INV[o.k]]}.` } : {}),
      hint: 'Rückwärts: vom Ergebnis aus, den letzten Schritt zuerst.' });
    cur = nx;
  });
  const [who, pr] = pick([['Mia', 'sie'], ['Ben', 'er'], ['Lina', 'sie'], ['Noah', 'er'], ['Emma', 'sie'], ['Paul', 'er']]);
  const chain = [t.x, ...ops.map((_, i) => ops.slice(0, i + 1).reduce(ap, t.x))].join(' → ');
  const w = wordTask({ prompt: `${who} sagt: ${story} Welche Zahl hat ${pr} sich gedacht?`, steps, sentence: v => `Die gedachte Zahl ist ${v}. Probe: ${chain} ✓` });
  return word ? w : { ...w, word: undefined };
}
function eval0(s: string): number { const m = s.match(/^(\d+) (\S) (\d+)$/); if (!m) return NaN; const a = +m[1], b = +m[3]; return m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '·' ? a * b : a / b; }
function seqMul(): Task | null {
  if (Math.random() < 0.5) {
    const r = pick([2, 2, 3, 10]), a0 = r === 10 ? R(1, 9) : R(1, 6), s = [0, 1, 2, 3].map(i => a0 * r ** i), nx = a0 * r ** 4;
    if (nx > 2000) return null;
    return { prompt: `Setze die Folge fort. Welche Zahl kommt als Nächstes? ${seqH(s)}`, answer: q(nx), placeholder: 'Zahl',
      sol: list([{ rule: 'Regel finden', lines: [`Jedes Mal · ${r}.`] }, { rule: 'Fortsetzen', lines: [`${s[3]} · ${r} = ${nx}`] }], q(nx)),
      guide: [
        { title: 'Regel finden', ask: `<p>Hier kommt nicht immer gleich viel dazu. Mit welcher Zahl wird jedes Mal <b>malgenommen</b>?</p>`, answer: q(r), explain: `${s[0]} · ${r} = ${s[1]}, ${s[1]} · ${r} = ${s[2]} …`, hint: `Rechne ${s[2]} : ${s[1]}.` },
        { title: 'Fortsetzen', ask: `<div class="math big">${s[3]} · ${r} = ?</div>`, answer: q(nx), explain: String(nx) },
      ],
      diag: v => (v.eq(q(s[3] + (s[3] - s[2]))) ? 'Die Unterschiede sind nicht immer gleich. Prüfe, ob jedes Mal malgenommen wird.' : null) };
  }
  const p = R(3, 9), m = R(1, p - 1), a0 = R(1, 20), s = [a0];
  for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? p : -m));
  const nx = s[5] - m; // der letzte Schritt war + p, jetzt kommt − m
  return { prompt: `Setze die Folge fort. Welche Zahl kommt als Nächstes? ${seqH(s)}`, answer: q(nx), placeholder: 'Zahl',
    sol: list([{ rule: 'Regel finden', lines: [`Abwechselnd + ${p} und − ${m}.`] }, { rule: 'Fortsetzen', lines: [`Nach + ${p} kommt wieder − ${m}: ${s[5]} − ${m} = ${nx}`] }], q(nx)),
    guide: [
      { title: 'Erster Schritt', ask: `<p>Um wie viel wird die Folge von ${s[0]} zu ${s[1]} größer?</p>`, answer: q(p), explain: `+ ${p}` },
      { title: 'Zweiter Schritt', ask: `<p>Um wie viel wird sie von ${s[1]} zu ${s[2]} kleiner?</p>`, answer: q(m), explain: `− ${m}. Die Folge geht abwechselnd + ${p} und − ${m}.` },
      { title: 'Fortsetzen', ask: `<p>Der letzte Schritt war + ${p}. Jetzt kommt wieder − ${m}.</p><div class="math big">${s[5]} − ${m} = ?</div>`, answer: q(nx), explain: String(nx) },
    ],
    diag: v => (v.eq(q(s[5] + p)) ? `Abwechselnd! Nach + ${p} kommt wieder − ${m}.` : null) };
}
const CTX = [
  { x: 'Anzahl Hefte', y: 'Preis in €', ks: [2, 3, 1.5, 2.5], one: '1 Heft' },
  { x: 'Zeit in h', y: 'Strecke in km', ks: [4, 5, 12, 15], one: '1 Stunde' },
  { x: 'Anzahl Brötchen', y: 'Preis in €', ks: [0.5, 1.5, 2], one: '1 Brötchen' },
  { x: 'Anzahl Packungen', y: 'Anzahl Stifte', ks: [6, 8, 12], one: '1 Packung' },
];
function tableTask(): Task | null {
  const c = pick(CTX), k = pick(c.ks), xs = shuffle([2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort((a, b) => a - b), ys = xs.map(x => q(Math.round(k * 10) * x, 10).red());
  const mi = R(1, 3), given = pick([0, 1, 2, 3].filter(i => i !== mi)), kq = q(Math.round(k * 10), 10).red();
  const cells = ys.map((y, i) => (i === mi ? '?' : dH(y)));
  return { prompt: `Die Tabelle gehört zu einer <b>proportionalen</b> Zuordnung. Welcher Wert gehört an die Stelle mit dem Fragezeichen?${table([[c.x, xs], [c.y, cells]])}`, answer: ys[mi], placeholder: 'Zahl',
    sol: list([{ rule: 'Auf 1 zurückrechnen', lines: [`${dH(ys[given])} : ${xs[given]} = ${dH(kq)}`] }, { rule: 'Hochrechnen', lines: [`${dH(kq)} · ${xs[mi]} = ${dH(ys[mi])}`] }], ys[mi]),
    guide: [
      { title: `Für ${c.one}`, ask: `<p>Rechne auf ${c.one} zurück: ${M(`${dH(ys[given])} : ${xs[given]} = ?`)}</p>`, answer: kq, explain: `Für ${c.one}: ${dH(kq)}`, hint: 'Bei einer proportionalen Zuordnung teilst du beide Werte durch dieselbe Zahl.' },
      { title: 'Hochrechnen', ask: `<p>Jetzt mal ${xs[mi]}: ${M(`${dH(kq)} · ${xs[mi]} = ?`)}</p>`, answer: ys[mi], explain: dH(ys[mi]) },
    ] };
}
function bracketTask(): Task | null {
  const form = R(0, 3), x = R(6, 30), a = R(2, 9), b = R(2, 6);
  let eqH = '', c = 0, outer: Op, inner: Op;
  if (form === 0) { inner = { k: '-', a }; outer = { k: '*', a: b }; }
  else if (form === 1) { inner = { k: '+', a }; outer = { k: '*', a: b }; }
  else if (form === 2) { inner = { k: '+', a }; outer = { k: ':', a: b }; }
  else { inner = { k: '-', a }; outer = { k: ':', a: b }; }
  const mid = ap(x, inner); if (!okInt(mid)) return null;
  c = ap(mid, outer); if (!okInt(c)) return null;
  eqH = `(${BOX} ${SYM[inner.k]} ${a}) ${SYM[outer.k]} ${b} = ${c}`;
  const s1 = `${c} ${SYM[INV[outer.k]]} ${b}`, s2 = `${mid} ${SYM[INV[inner.k]]} ${a}`, wrongFirst = `${c} ${SYM[INV[inner.k]]} ${a}`;
  const alt = inv(inv(c, inner), outer);
  return { prompt: `Welche Zahl gehört in das Kästchen? ${M(eqH)}`, answer: q(x), placeholder: 'Zahl',
    sol: list([{ rule: 'Außen zuerst rückgängig', lines: [`${s1} = ${mid}`, `Die Klammer ergibt also ${mid}.`] }, { rule: 'Dann die Klammer', lines: [`${s2} = ${x}`] }, { rule: 'Probe', lines: [`(${x} ${SYM[inner.k]} ${a}) ${SYM[outer.k]} ${b} = ${mid} ${SYM[outer.k]} ${b} = ${c} ✓`] }], q(x)),
    guide: [
      { title: 'Außen zuerst', choose: gc('Was machst du zuerst rückgängig?', M(s1), [M(wrongFirst), M(`${c} ${SYM[outer.k]} ${b}`)], `Zuletzt wurde ${SYM[outer.k]} ${b} gerechnet. Rückwärts machst du das zuerst rückgängig.`), ask: `<p>Die ganze Klammer ${SYM[outer.k]} ${b} ergibt ${c}. Wie viel ergibt die Klammer?</p><div class="math big">${s1} = ?</div>`, answer: q(mid), explain: `Die Klammer ergibt ${mid}: ${M(`${BOX} ${SYM[inner.k]} ${a} = ${mid}`)}`, hint: 'Rechne rückwärts mit der Umkehraufgabe.' },
      { title: 'Dann die Klammer', ask: `<p>${M(`${BOX} ${SYM[inner.k]} ${a} = ${mid}`)}</p><div class="math big">${s2} = ?</div>`, answer: q(x), explain: `${x}. Probe: (${x} ${SYM[inner.k]} ${a}) ${SYM[outer.k]} ${b} = ${c}`, hint: `${SYM[inner.k]} wird zu ${SYM[INV[inner.k]]}.` },
    ],
    diag: v => (Number.isInteger(alt) && v.eq(q(alt)) ? 'Falsche Reihenfolge. Rückwärts machst du zuerst den Schritt außerhalb der Klammer rückgängig.' : v.eq(q(mid)) ? `${mid} ist der Wert der Klammer. Rechne noch den Schritt in der Klammer rückgängig.` : null) };
}
function propCheck(): Task | null {
  const c = pick(CTX), prop = Math.random() < 0.5;
  let xs: number[], ys: Q[];
  const k = q(Math.round(pick(c.ks) * 10), 10).red();
  if (prop) { xs = shuffle([1, 2, 4, 5, 8, 10]).slice(0, 3).sort((a, b) => a - b); ys = xs.map(x => k.mul(q(x))); }
  else {
    const x0 = pick([1, 2]), d = pick([1, 2]), cc = q(pick([1, 2, 3]));
    xs = [x0, x0 + d, x0 + 2 * d];
    ys = xs.map(x => k.mul(q(x)).add(cc));
  }
  const qs = xs.map((x, i) => ys[i].div(q(x)));
  if (qs.some(v => !v.terminating())) return null;
  const qH3 = qs.map(dH), steps: Steps = [{ rule: 'Quotienten berechnen', lines: xs.map((x, i) => `${dH(ys[i])} : ${x} = ${qH3[i]}`) }, { rule: 'Entscheiden', lines: [prop ? `Alle Quotienten sind gleich (${qH3[0]}). Die Zuordnung ist proportional.` : 'Die Quotienten sind verschieden. Die Zuordnung ist nicht proportional.'] }];
  const guide: GuideStep[] = xs.map((x, i) => ({ title: `Quotient ${i + 1}`, ask: `<p>Teile den unteren Wert durch den oberen: ${M(`${dH(ys[i])} : ${x} = ?`)}</p>`, answer: qs[i], explain: qH3[i], hint: 'Unten geteilt durch oben.' }));
  const grow = { html: 'Ja, denn beide Werte werden größer.', why: 'Das reicht nicht. Auch bei nicht proportionalen Zuordnungen können beide Werte wachsen. Prüfe die Quotienten.' };
  const prompt = `Ist die Zuordnung in der Tabelle <b>proportional</b>? Wähle die Antwort mit der richtigen Begründung.${table([[c.x, xs], [c.y, ys.map(dH)]])}`;
  if (prop) return pickTask(prompt, `Ja, denn unten : oben ergibt immer ${qH3[0]}.`, [grow, { html: 'Nein, denn die Werte unten wachsen nicht immer um gleich viel.', why: 'Oben wachsen die Werte auch nicht gleichmäßig. Prüfe lieber die Quotienten: Sie sind alle gleich.' }, { html: `Nein, denn ${dH(ys[0])} : ${xs[0]} ist nicht gleich ${dH(ys[2])} : ${xs[2]}.`, why: `Rechne nach: Beide Quotienten sind ${qH3[0]}.` }], steps, guide);
  return pickTask(prompt, `Nein, denn ${dH(ys[0])} : ${xs[0]} = ${qH3[0]}, aber ${dH(ys[1])} : ${xs[1]} = ${qH3[1]}.`, [grow, { html: 'Ja, denn die Werte unten wachsen immer um gleich viel.', why: 'Gleichmäßig wachsen reicht nicht. Bei proportional muss zum Doppelten auch das Doppelte gehören. Prüfe die Quotienten.' }, { html: `Ja, denn unten : oben ergibt immer ${qH3[0]}.`, why: `Rechne nach: ${dH(ys[1])} : ${xs[1]} = ${qH3[1]}.` }], steps, guide);
}
function seqGrow(): Task | null {
  const a0 = R(1, 10), d0 = R(1, 3), e = pick([1, 1, 2]), s = [a0];
  for (let i = 1; i < 5; i++) s.push(s[i - 1] + d0 + (i - 1) * e);
  const dl = d0 + 3 * e, dn = dl + e, nx = s[4] + dn;
  return { prompt: `Setze die Folge fort. Welche Zahl kommt als Nächstes? ${seqH(s)}`, answer: q(nx), placeholder: 'Zahl',
    sol: list([{ rule: 'Unterschiede', lines: [s.slice(1).map((v, i) => `+${v - s[i]}`).join(', '), `Die Unterschiede wachsen jedes Mal um ${e}.`] }, { rule: 'Fortsetzen', lines: [`${s[4]} + ${dn} = ${nx}`] }], q(nx)),
    guide: [
      { title: 'Letzter Unterschied', ask: `<p>Um wie viel wächst die Folge von ${s[3]} zu ${s[4]}?</p>`, answer: q(dl), explain: `Die Unterschiede sind ${s.slice(1).map((v, i) => v - s[i]).join(', ')}. Sie wachsen jedes Mal um ${e}.`, hint: `${s[4]} − ${s[3]}` },
      { title: 'Nächster Unterschied', ask: '<p>Wie groß ist dann der nächste Unterschied?</p>', answer: q(dn), explain: `${dl} + ${e} = ${dn}` },
      { title: 'Fortsetzen', ask: `<div class="math big">${s[4]} + ${dn} = ?</div>`, answer: q(nx), explain: String(nx) },
    ],
    diag: v => (v.eq(q(s[4] + dl)) ? 'Die Unterschiede bleiben nicht gleich, sie wachsen. Schreib sie auf!' : null) };
}
/** Streichholzmuster: Quadrate (3n + 1) oder Dreiecke (2n + 1) in einer Reihe. */
function sticksSVG(kind: 'sq' | 'tri', upTo = 3): string {
  const s = 22, gap = 26;
  let g = '', x0 = 8;
  for (let n = 1; n <= upTo; n++) {
    const L = (x1: number, y1: number, x2: number, y2: number) => `<line class="ray" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    let w = 0;
    if (kind === 'sq') {
      for (let i = 0; i < n; i++) g += L(x0 + i * s, 20, x0 + (i + 1) * s, 20) + L(x0 + i * s, 20 + s, x0 + (i + 1) * s, 20 + s);
      for (let i = 0; i <= n; i++) g += L(x0 + i * s, 20, x0 + i * s, 20 + s);
      w = n * s;
    } else {
      const P = (i: number) => [x0 + (i * s) / 2, i % 2 ? 20 : 20 + s];
      for (let i = 0; i <= n; i++) { const [a, b] = P(i), [c, d] = P(i + 1); g += L(a, b, c, d); }
      for (let i = 0; i + 2 <= n + 1; i++) { const [a, b] = P(i), [c, d] = P(i + 2); g += L(a, b, c, d); }
      w = ((n + 1) * s) / 2;
    }
    g += `<text class="tk" x="${x0 + w / 2}" y="${36 + s}" text-anchor="middle">Figur ${n}</text>`;
    x0 += w + gap;
  }
  return `<svg class="fig" viewBox="0 0 ${x0} ${44 + s}" role="img" aria-label="Streichholzmuster: Figur 1 bis ${upTo} aus ${kind === 'sq' ? 'Quadraten' : 'Dreiecken'} in einer Reihe">${g}</svg>`;
}
const STICK = { sq: { a: 3, b: 1, what: 'Quadraten' }, tri: { a: 2, b: 1, what: 'Dreiecken' } } as const;
function raetselText(level: number): Task | null {
  return genFrom<Task>(() => {
    const r = Math.random();
    if (r < 0.3) {
      if (level === 4) {
        const y = R(5, 14), d = R(2, 6), S = 2 * y + d, [o, j] = pick([['Lena', 'ihr Bruder Tim'], ['Jonas', 'seine Schwester Ella'], ['Mia', 'ihre Cousine Lou']]);
        return wordTask({
          prompt: `${o} und ${j} sind zusammen ${S} Jahre alt. ${o} ist ${d} Jahre älter. Wie alt ist ${o}?`,
          steps: [
            { title: 'Unterschied abziehen', ask: `Nimm den Altersunterschied weg. Dann wären beide gleich alt. Wie viele Jahre bleiben zusammen übrig?`, calc: `${S} − ${d}`, wrong: [`${S} + ${d}`], why: `Ohne die ${d} Jahre Vorsprung sind beide gleich alt.`, unit: 'Jahre' },
            { title: 'Der Jüngere', ask: `Wie alt ist ${j.split(' ').pop()}?`, calc: `${S - d} : 2`, wrong: [`${S} : 2`], why: 'Jetzt sind beide gleich alt: in zwei gleiche Teile teilen.', unit: 'Jahre' },
            { title: 'Der Ältere', ask: `Wie alt ist ${o}?`, calc: `${y} + ${d}`, unit: 'Jahre' },
          ],
          unit: 'Jahre', sentence: v => `${o} ist ${v} alt. Probe: ${y + d} + ${y} = ${S} ✓`,
        });
      }
      const y = R(3, 10), d = R(2, 4), S = 3 * y + 3 * d;
      return wordTask({
        prompt: `Drei Geschwister sind zusammen ${S} Jahre alt. Jedes Kind ist ${d} Jahre älter als das nächstjüngere. Wie alt ist das älteste Kind?`,
        steps: [
          { title: 'Vorsprung', ask: `Das mittlere Kind hat ${d} Jahre Vorsprung vor dem jüngsten, das älteste ${2 * d} Jahre. Wie viele Jahre Vorsprung sind das zusammen?`, calc: `${d} + ${2 * d}`, unit: 'Jahre' },
          { title: 'Vorsprung abziehen', ask: 'Nimm den Vorsprung weg. Wie viele Jahre bleiben, wenn alle so alt wären wie das jüngste?', calc: `${S} − ${3 * d}`, wrong: [`${S} − ${d}`], why: 'Der ganze Vorsprung muss weg.', unit: 'Jahre' },
          { title: 'Das jüngste', ask: 'Wie alt ist das jüngste Kind?', calc: `${S - 3 * d} : 3`, wrong: [`${S - 3 * d} : 2`], why: 'Drei gleich alte Kinder: durch 3 teilen.', unit: 'Jahre' },
          { title: 'Das älteste', ask: 'Wie alt ist das älteste Kind?', calc: `${y} + ${2 * d}`, wrong: [`${y} + ${d}`], why: `Das älteste hat ${2 * d} Jahre Vorsprung.`, unit: 'Jahre' },
        ],
        unit: 'Jahre', sentence: v => `Das älteste Kind ist ${v} alt. Probe: ${y} + ${y + d} + ${y + 2 * d} = ${S} ✓`,
      });
    }
    const kind = pick<'sq' | 'tri'>(['sq', 'tri']), { a, b, what } = STICK[kind], f = [1, 2, 3].map(n => a * n + b);
    const pre = `Ein Muster aus Streichhölzern mit ${what} in einer Reihe:${sticksSVG(kind)}Figur 1 braucht ${f[0]}, Figur 2 braucht ${f[1]} und Figur 3 braucht ${f[2]} Hölzer.`;
    if (r < 0.6 || (level === 4 && r < 0.8)) {
      const n = R(8, 20);
      return wordTask({
        prompt: `${pre} Wie viele Hölzer braucht Figur ${n}?`,
        steps: [
          { title: 'Was kommt dazu?', ask: 'Wie viele Hölzer kommen von einer Figur zur nächsten dazu?', calc: `${f[1]} − ${f[0]}` },
          { title: 'Wie oft?', ask: `Wie oft kommen von Figur 1 bis Figur ${n} Hölzer dazu?`, calc: `${n} − 1`, wrong: [`${n} + 1`], why: `Von Figur 1 bis Figur ${n} sind es ${n - 1} Schritte.` },
          { title: `Figur ${n}`, ask: `Wie viele Hölzer braucht Figur ${n}?`, calc: `${f[0]} + ${n - 1} · ${a}`, wrong: [`${n} · ${f[0]}`], why: `Figur 1 hat ${f[0]} Hölzer. Bei jedem Schritt kommen ${a} dazu.` },
        ],
        sentence: v => `Figur ${n} braucht ${v} Hölzer. Das passt zur Regel ${a} · ${n} + ${b}.`,
      });
    }
    if (level === 5 && r < 0.8) {
      const n = R(12, 30), H = a * n + b;
      return wordTask({
        prompt: `${pre} Figur <i>n</i> braucht ${a} · <i>n</i> + ${b} Hölzer. Welche Figur braucht genau ${H} Hölzer?`,
        steps: [
          { title: `${b} wegnehmen`, ask: `Rechne rückwärts. Zieh zuerst das eine Extra-Holz ab.`, calc: `${H} − ${b}`, wrong: [`${H} : ${a}`], why: `Zuletzt wurde + ${b} gerechnet. Das machst du zuerst rückgängig.` },
          { title: `Durch ${a}`, ask: 'Welche Figur ist es?', calc: `${H - b} : ${a}`, wrong: [`${H - b} · ${a}`], why: `· ${a} machst du mit : ${a} rückgängig.` },
        ],
        sentence: v => `Figur ${v} braucht ${H} Hölzer. Probe: ${a} · ${n} + ${b} = ${H} ✓`,
      });
    }
    const ok = `Figur <i>n</i> braucht ${a} · <i>n</i> + ${b} Hölzer.`;
    const cand: Choice[] = [
      { html: `Figur <i>n</i> braucht ${a + b} · <i>n</i> Hölzer.`, why: `Prüfe Figur 2: ${a + b} · 2 = ${2 * (a + b)}, es sind aber ${f[1]}.` },
      { html: `Figur <i>n</i> braucht <i>n</i> + ${a} Hölzer.`, why: `Prüfe Figur 1: 1 + ${a} = ${1 + a}, es sind aber ${f[0]}.` },
      { html: `Figur <i>n</i> braucht ${a} · <i>n</i> Hölzer.`, why: `Prüfe Figur 1: ${a} · 1 = ${a}, es sind aber ${f[0]}. Es fehlt das Extra-Holz.` },
    ];
    return pickTask(`${pre} Welche Regel beschreibt das Muster?`, ok, cand, [{ rule: 'Muster beschreiben', lines: [`Pro Figur kommen ${a} Hölzer dazu, dazu kommt 1 Holz am Anfang.`, `Figur 1: ${a} · 1 + ${b} = ${f[0]}, Figur 2: ${a} · 2 + ${b} = ${f[1]}, Figur 3: ${a} · 3 + ${b} = ${f[2]}`] }], [
      { title: 'Was kommt dazu?', ask: '<p>Wie viele Hölzer kommen von einer Figur zur nächsten dazu?</p>', answer: q(a), explain: `${f[1]} − ${f[0]} = ${a}. Also steht ${a} · <i>n</i> in der Regel.` },
      { title: 'Regel prüfen', ask: `<p>Prüfe die Regel mit Figur 3: ${M(`${a} · 3 + ${b} = ?`)}</p>`, answer: q(f[2]), explain: `${f[2]}. Das passt zu Figur 3. Prüfe jede Regel genauso.` },
    ], { word: true });
  }, t => !t.guide || t.guide.every(s => s.answer.sign() > 0));
}
const RAETSEL: Topic = {
  id: 'raetsel', klasse: 5, title: 'Zahlenrätsel, Folgen und Tabellen', short: 'Rätsel durch Probieren und Rückwärtsrechnen lösen, Folgen fortsetzen und Tabellen ergänzen.',
  exampleSol: () => ({ prompt: 'Ich denke mir eine Zahl, multipliziere sie mit 4 und addiere 7. Ich erhalte 43. Welche Zahl ist es?', sol: list([{ rule: '+ 7 rückgängig', lines: ['43 − 7 = 36'] }, { rule: '· 4 rückgängig', lines: ['36 : 4 = 9'] }, { rule: 'Probe', lines: ['9 · 4 + 7 = 36 + 7 = 43 ✓'] }], q(9)) }),
  theory: `
    <p>Bei einem <b>Zahlenrätsel</b> fehlt eine Zahl. Bei ${M(`${BOX} + 17 = 45`)} hilft die <b>Umkehraufgabe</b>: ${M('45 − 17 = 28')}. Plus wird zu Minus, Mal wird zu Geteilt und umgekehrt.</p>
    <p>Bei mehreren Schritten rechnest du <b>rückwärts</b>: Den letzten Schritt machst du zuerst rückgängig.</p>
    ${table([['vorwärts', ['Zahl', '· 4', '+ 7', '= 43']], ['rückwärts', ['9', ': 4', '− 7', '43']]])}
    <p>Also ist die Zahl 9. Mach immer die <b>Probe</b>: ${M('9 · 4 + 7 = 43')} ✓. Du kannst auch <b>probieren</b>: Setze eine Zahl ein und schau, ob das Ergebnis zu groß oder zu klein ist.</p>
    <p>Bei einer <b>Folge</b> suchst du die Regel: ${M('3, 7, 11, 15')} wächst immer um 4. ${M('2, 4, 8, 16')} wird immer verdoppelt. Bei ${M('1, 2, 4, 7, 11')} wachsen die Unterschiede: +1, +2, +3, +4.</p>
    <p>Eine Zuordnung ist <b>proportional</b>, wenn ${M('unten : oben')} immer dieselbe Zahl ergibt. Beide Werte werden größer reicht nicht!</p>
    ${merke(['Umkehraufgabe: + ↔ −, · ↔ :.', 'Rückwärts rechnen: den letzten Schritt zuerst rückgängig machen.', 'Folgen: Unterschiede oder Faktoren aufschreiben.', 'Immer die Probe machen.'])}`,
  gen(level: number) {
    return genFrom<Task>(() => {
      const r = Math.random();
      if (level === 1) return r < 0.55 ? boxTask() : seqArith();
      if (level === 2) return r < 0.4 ? thinkTask(2, false) : r < 0.7 ? seqMul() : tableTask();
      return r < 0.4 ? bracketTask() : r < 0.7 ? propCheck() : seqGrow();
    }, t => !!t && t.answer.sign() > 0);
  },
  text: level => (level === 5 && Math.random() < 0.25 ? genFrom<Task>(() => thinkTask(3, true), t => !!t) : raetselText(level)),
};

export const MUSTER_TOPICS: Topic[] = [PRIM, HAEUF, RAETSEL];
