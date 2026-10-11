/* ===== Klasse 5/6: große Zahlen, Runden, Potenzen, Zuordnungen, Maßstab, Daten ===== */
import { heftDreisatz } from './heft.js';
import type { GuideChoice, GuideStep } from './guide.js';
import { autoGuide, wordTask } from './guide.js';
import { q, qH, type Q, type ExprSolution, type ListSolution } from './engine/index.js';
import { B, M, R, exprTask, genFrom, list, pick, type Task, type Topic } from './gen.js';

/** Große Zahl mit schmalen Leerzeichen in Dreiergruppen: 4 382 615 */
export const gz = (n: number | bigint) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '&#8239;');
const dH = (v: Q) => qH(v, true);
const eur = (v: Q) => (v.isInt() ? dH(v) : (Number(v.n) / Number(v.d)).toFixed(2).replace('.', ','));
const dec1 = (n: number) => String(n).replace('.', ',');
const opts = (right: string, wrong: string[]) => [{ html: right, ok: true }, ...wrong.filter(w => w !== right).map(w => ({ html: w, ok: false }))];
function task(prompt: string, answer: Q, steps: ListSolution['steps'], guide: GuideStep[], o: Partial<Task> = {}): Task {
  return { prompt, answer, sol: list(steps, answer, o.placeholder?.startsWith('Antwort in ') ? `${dH(answer)} ${o.placeholder.slice(11)}` : dH(answer)), guide, placeholder: 'Deine Lösung', ...o };
}
function withFirst(t: Task & { sol: ExprSolution }, extra: Partial<GuideStep>): Task {
  const g = autoGuide(t.sol); g[0] = { ...g[0], ...extra }; return { ...t, guide: g };
}

/* ---------- Große Zahlen ---------- */
const PLACES = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender', 'Millionen', 'Zehnmillionen', 'Hundertmillionen'];
const UNITS = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
const w100 = (n: number) => (n < 10 ? UNITS[n] : n < 20 ? TEENS[n - 10] : (n % 10 ? UNITS[n % 10] + 'und' : '') + TENS[Math.floor(n / 10)]);
const w1000 = (n: number, last: boolean) => { const h = Math.floor(n / 100), r = n % 100; return (h ? UNITS[h] + 'hundert' : '') + (r === 1 ? (last ? 'eins' : 'ein') : r ? w100(r) : ''); };
/** Zahlwort, z. B. 2304050 → „zwei Millionen dreihundertviertausendfünfzig“ */
export function numWord(n: number): string {
  if (n === 0) return 'null';
  const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, r = n % 1000;
  const mio = m ? (m === 1 ? 'eine Million' : `${w1000(m, false)} Millionen`) : '';
  const rest = (t ? (t === 1 ? 'eintausend' : w1000(t, false) + 'tausend') : '') + (r ? w1000(r, true) : '');
  return [mio, rest].filter(Boolean).join(' ');
}
function stelleTask(): Task {
  const n = R(10000, 9999999), s = String(n), k = R(0, s.length - 1), d = Number(s[s.length - 1 - k]);
  const shown = s.split('').map((c, i) => (s.length - 1 - i === k ? `<mark>${c}</mark>` : c)).join('').replace(/\B(?=(\d{3})+(?!\d))/g, '&#8239;');
  return task(`Welche Ziffer steht in ${M(gz(n))} an der <b>${PLACES[k]}stelle</b>?`, q(d),
    [{ rule: 'Von rechts zählen', lines: [`Von rechts: ${PLACES.slice(0, s.length).map((p, i) => `${p} ${s[s.length - 1 - i]}`).slice(0, k + 1).join(', ')}`] }, { rule: 'Die Ziffer', lines: [`${M(shown)}: An der ${PLACES[k]}stelle steht die <b>${d}</b>.`] }],
    [{ title: 'Stelle finden', ask: `<p>Die Stellen von rechts: Einer, Zehner, Hunderter, Tausender, … Die wievielte Ziffer von rechts ist die ${PLACES[k]}stelle?</p>`, answer: q(k + 1), hint: 'Einer ist die 1., Zehner die 2., Hunderter die 3. Stelle von rechts.', explain: `Die ${PLACES[k]}stelle ist die ${k + 1}. Stelle von rechts.`, placeholder: 'Nummer' },
     { title: 'Ziffer ablesen', ask: `<p>Welche Ziffer steht in ${B(gz(n))} an der ${k + 1}. Stelle von rechts?</p>`, answer: q(d), hint: 'Zähle von rechts ab.', explain: M(shown) }], { placeholder: 'Ziffer' });
}
function wortTask(level: number): Task {
  const n = level === 1 ? R(1, 99) * 1000 + R(0, 999) : R(1, 9) * 1e6 + R(0, 999) * 1000 + R(0, 999);
  const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, r = n % 1000;
  const g: GuideStep[] = [];
  if (m) g.push({ title: 'Millionen', ask: `<p>Wie viele Millionen sind es?</p>`, answer: q(m), hint: 'Schau, was vor „Million“ steht.', explain: `${m} Millionen = ${gz(m * 1e6)}` });
  g.push({ title: 'Tausender', ask: `<p>Was steht vor „tausend“? Wie viele Tausender sind es?</p>`, answer: q(t), hint: 'Alles zwischen „Million(en)“ und „tausend“.', explain: `${t} Tausend` });
  g.push({ title: 'Zusammensetzen', ask: `<p>Schreib die ganze Zahl in die Stellentafel. Denk an die Nullen, wenn eine Stelle leer ist.</p>`, answer: q(n), hint: 'Jede Dreiergruppe hat genau drei Ziffern, fülle mit Nullen auf.', explain: `${numWord(n)} = ${gz(n)}` });
  return task(`Schreibe als Zahl: <b>${numWord(n)}</b>`, q(n),
    [{ rule: 'In Dreiergruppen zerlegen', lines: [m ? `Millionen: ${m}` : '', `Tausender: ${String(t).padStart(m ? 3 : 1, '0')}`, `Rest: ${String(r).padStart(3, '0')}`].filter(Boolean) }, { rule: 'Zahl', lines: [gz(n)] }],
    g, { placeholder: 'Zahl', plain: numWord(n), diag: v => (v.n === BigInt(String(n).replace(/0/g, '')) ? 'Da fehlen <b>Nullen</b>. Jede Dreiergruppe (Millionen, Tausender, Rest) braucht drei Ziffern.' : null) });
}
const ZAHL: Topic = {
  id: 'zahl', klasse: 5, title: 'Große Zahlen und Stellenwerte', short: 'Millionen lesen und schreiben, Stellenwerttafel und mit großen Zahlen rechnen.',
  exampleSol: () => { const t = wortTask(2); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Große Zahlen liest du leichter, wenn du sie von rechts in <b>Dreiergruppen</b> teilst: ${M(gz(4382615))}. Die erste Gruppe von rechts sind die <b>Einer</b>, dann kommen die <b>Tausender</b>, dann die <b>Millionen</b>.</p>
    <table class="stellen"><tr><th colspan="3">Millionen</th><th colspan="3">Tausender</th><th colspan="3">Einer</th></tr><tr><th>H</th><th>Z</th><th>E</th><th>H</th><th>Z</th><th>E</th><th>H</th><th>Z</th><th>E</th></tr><tr><td></td><td></td><td>4</td><td>3</td><td>8</td><td>2</td><td>6</td><td>1</td><td>5</td></tr></table>
    <p>Gesprochen: <b>vier Millionen dreihundertzweiundachtzigtausendsechshundertfünfzehn</b>.</p>
    <p>1 Tausend = 1000 · 1 Million = 1000 Tausend = ${M(gz(1000000))} · 1 Milliarde = 1000 Millionen.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Von rechts in Dreiergruppen teilen.</li><li>Jede Gruppe hat genau drei Stellen. Fehlt etwas, schreibst du eine 0.</li><li>Rechne mit großen Zahlen wie mit kleinen: Stelle unter Stelle.</li></ol></div>`,
  gen(level) {
    if (level === 1) return Math.random() < 0.5 ? stelleTask() : wortTask(1);
    if (level === 2) return Math.random() < 0.4 ? stelleTask() : wortTask(2);
    return genFrom(() => {
      const k = R(0, 2);
      if (k === 0) { const n = R(1, 9) * 10 ** R(4, 6) - 1; const t = exprTask(`${n} + 1`, { placeholder: 'Zahl' }); t.prompt = `Wie heißt der <b>Nachfolger</b> von ${M(gz(n))}?`; return t; }
      const a = R(2, 9) * 1e6 + R(1, 9) * 1e5, b = R(1, 9) * 1e5 + R(1, 9) * 1e4;
      const s = k === 1 ? `${a} − ${b}` : `${a} + ${b}`;
      const t = exprTask(s, { placeholder: 'Zahl' });
      t.prompt = k === 1 ? `Um wie viel ist ${M(gz(a))} größer als ${M(gz(b))}?` : `Berechne: ${M(`${gz(a)} + ${gz(b)}`)}`;
      return withFirst(t, { hint: 'Schreib die Zahlen stellengerecht untereinander: Einer unter Einer, Tausender unter Tausender.' });
    }, t => t.answer.sign() > 0);
  },
  text: level => {
    const c = [['Stuttgart', 632], ['Mannheim', 315], ['Karlsruhe', 308], ['Freiburg', 236], ['Heidelberg', 162], ['Ulm', 128]] as const;
    const x = pick([...c]), y = pick(c.filter(z => z !== x));
    const a = x[1] * 1000 + R(1, 9) * 100, b = y[1] * 1000 + R(1, 9) * 100;
    if (level === 4) return wordTask({
      prompt: `${x[0]} hat etwa ${gz(a)} Einwohner, ${y[0]} etwa ${gz(b)}. Wie viele Einwohner haben beide Städte zusammen? Wie viele fehlen dann noch bis zu einer Million?`,
      steps: [
        { title: 'Zusammen', ask: 'Wie viele Einwohner haben beide Städte zusammen?', calc: `${a} + ${b}`, wrong: [`${a} − ${b}`], why: 'Zusammen heißt plus.', unit: 'Einwohner' },
        { title: 'Bis zur Million', ask: 'Wie viele fehlen bis 1 000 000?', calc: `1000000 − ${a + b}`, wrong: [`${a + b} − 1000000`], why: 'Was fehlt: große Zahl minus kleine Zahl.', unit: 'Einwohner' },
      ].filter(s => s.title === 'Zusammen' || a + b < 1e6),
      unit: 'Einwohner', sentence: v => (a + b < 1e6 ? `Bis zur Million fehlen noch ${v}.` : `Zusammen haben sie ${v}.`),
    });
    const p = R(30, 80) * 1000 + R(1, 999), k = R(4, 9), z = 1000 * R(2, 9);
    return wordTask({
      prompt: `Ein Stadion hat ${gz(p)} Plätze. Bei ${k} Spielen ist es ausverkauft, bei einem weiteren Spiel bleiben ${gz(z)} Plätze leer. Wie viele Zuschauer waren es bei allen Spielen zusammen?`,
      steps: [
        { title: 'Ausverkaufte Spiele', ask: `Wie viele Zuschauer waren es bei den ${k} ausverkauften Spielen?`, calc: `${k} · ${p}`, wrong: [`${k} + ${p}`], unit: 'Zuschauer' },
        { title: 'Das andere Spiel', ask: 'Wie viele Zuschauer waren beim anderen Spiel da?', calc: `${p} − ${z}`, wrong: [`${p} + ${z}`], why: 'Die leeren Plätze ziehst du ab.', unit: 'Zuschauer' },
        { title: 'Alle zusammen', ask: 'Wie viele Zuschauer waren es insgesamt?', calc: `${k * p} + ${p - z}`, unit: 'Zuschauer' },
      ],
      unit: 'Zuschauer', sentence: v => `Insgesamt waren es ${v}.`,
    });
  },
};

/* ---------- Runden und Überschlagen ---------- */
const PNAME = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender'];
const rnd = (n: number, p: number) => Math.round(n / 10 ** p) * 10 ** p;
function rundTask(n: number, p: number): Task {
  const r = rnd(n, p), d = Math.floor(n / 10 ** (p - 1)) % 10, up = d >= 5;
  const c: GuideChoice = { ask: 'Rundest du auf oder ab?', options: opts(up ? 'aufrunden' : 'abrunden', [up ? 'abrunden' : 'aufrunden']), why: `Die Ziffer rechts daneben ist ${d}. Bei 0 bis 4 rundest du ab, bei 5 bis 9 auf.` };
  return task(`Runde ${M(gz(n))} auf <b>${PNAME[p]}</b>.`, q(r),
    [{ rule: 'Die entscheidende Ziffer', lines: [`Rechts neben der ${PNAME[p]}stelle steht die ${d}.`] }, { rule: up ? 'Aufrunden' : 'Abrunden', lines: [`${d} ist ${up ? '5 oder mehr: aufrunden' : 'kleiner als 5: abrunden'}.`, `${gz(n)} ≈ ${gz(r)}`] }],
    [{ title: 'Entscheidende Ziffer', ask: `<p>Welche Ziffer steht in ${B(gz(n))} rechts neben der ${PNAME[p]}stelle?</p>`, answer: q(d), hint: `Die ${PNAME[p]}stelle ist die ${p + 1}. Stelle von rechts. Schau eine Stelle weiter rechts.`, explain: `Dort steht die ${d}.`, placeholder: 'Ziffer' },
     { title: up ? 'Aufrunden' : 'Abrunden', choose: c, ask: `<p>Wie heißt die gerundete Zahl? Hinter der ${PNAME[p]}stelle werden alle Ziffern zu 0.</p>`, answer: q(r), hint: up ? `Die ${PNAME[p]}ziffer wird um 1 größer.` : `Die ${PNAME[p]}ziffer bleibt gleich.`, explain: `${gz(n)} ≈ ${gz(r)}`, placeholder: 'gerundete Zahl' }],
    { placeholder: 'gerundete Zahl', diag: v => (v.eq(q(up ? r - 10 ** p : r + 10 ** p)) ? `Fast! Schau noch einmal auf die Ziffer rechts daneben: ${d}. ${up ? 'Ab 5 rundest du auf.' : 'Unter 5 rundest du ab.'}` : null) });
}
function rundDec(x: Q, k: number): Task {
  const f = 10 ** k, n = Number(x.mul(q(f * 10)).n) / Number(x.mul(q(f * 10)).d), d = Math.floor(n) % 10, r = q(Math.round(n / 10), f), up = d >= 5;
  const pn = k === 1 ? 'Zehntel' : 'Hundertstel';
  return task(`Runde ${M(dH(x))} auf <b>${pn}</b> (${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach dem Komma).`, r,
    [{ rule: 'Die entscheidende Ziffer', lines: [`Die ${k + 1}. Stelle nach dem Komma ist eine ${d}.`] }, { rule: up ? 'Aufrunden' : 'Abrunden', lines: [`${dH(x)} ≈ ${dH(r)}`] }],
    [{ title: 'Entscheidende Ziffer', ask: `<p>Welche Ziffer steht an der ${k + 1}. Stelle nach dem Komma?</p>`, answer: q(d), hint: 'Zähle die Stellen nach dem Komma.', explain: `Dort steht die ${d}.`, placeholder: 'Ziffer' },
     { title: up ? 'Aufrunden' : 'Abrunden', choose: { ask: 'Rundest du auf oder ab?', options: opts(up ? 'aufrunden' : 'abrunden', [up ? 'abrunden' : 'aufrunden']), why: `Die Ziffer ist ${d}: ${up ? '5 bis 9, aufrunden' : '0 bis 4, abrunden'}.` }, ask: `<p>Wie heißt die gerundete Zahl?</p>`, answer: r, hint: 'Alles hinter der Rundungsstelle fällt weg.', explain: `${dH(x)} ≈ ${dH(r)}` }],
    { placeholder: 'gerundete Zahl' });
}
function ueberTask(): Task {
  const op = pick(['+', '−', '·']);
  let a: number, b: number, pa: number, pb: number;
  if (op === '·') { a = R(12, 98); b = R(12, 98); pa = 1; pb = 1; } else { a = R(120, 980); b = R(110, 890); pa = 2; pb = 2; if (op === '−' && b > a) [a, b] = [b, a]; }
  const ra = rnd(a, pa), rb = rnd(b, pb), calc = op === '·' ? `${ra} · ${rb}` : `${ra} ${op} ${rb}`;
  const exact = op === '+' ? a + b : op === '−' ? a - b : a * b;
  const t = exprTask(calc, { placeholder: 'Überschlag' });
  const g: GuideStep[] = [
    { title: `${a} runden`, ask: `<p>Runde ${B(String(a))} auf ${PNAME[pa]}.</p>`, answer: q(ra), hint: 'Schau auf die Ziffer rechts neben der Rundungsstelle.', explain: `${a} ≈ ${ra}` },
    { title: `${b} runden`, ask: `<p>Runde ${B(String(b))} auf ${PNAME[pb]}.</p>`, answer: q(rb), hint: 'Schau auf die Ziffer rechts neben der Rundungsstelle.', explain: `${b} ≈ ${rb}` },
    ...autoGuide(t.sol),
  ];
  return { ...t, prompt: `Überschlage: ${M(`${a} ${op} ${b}`)}. Runde dafür beide Zahlen auf ${PNAME[pa]}.`, plain: `Überschlag ${a} ${op} ${b}`, guide: g,
    sol: { kind: 'list', steps: [{ rule: 'Runden', lines: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`] }, { rule: 'Mit den runden Zahlen rechnen', lines: [`${calc} = ${gz(Number(t.answer.n))}`] }], result: t.answer, resultHTML: gz(Number(t.answer.n)), extra: [`Genau wäre es ${gz(exact)}. Der Überschlag liegt nah dran, so kannst du dein Ergebnis prüfen.`] },
    diag: v => (v.eq(q(exact)) ? 'Das ist das <b>genaue</b> Ergebnis. Beim Überschlag rundest du die Zahlen zuerst und rechnest dann mit den runden Zahlen.' : null) };
}
const RUND: Topic = {
  id: 'rund', klasse: 5, title: 'Runden und Überschlagen', short: 'Zahlen sinnvoll runden und Ergebnisse schnell abschätzen.',
  exampleSol: () => { const t = rundTask(4372, 2); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Beim <b>Runden</b> machst du eine Zahl einfacher. Du schaust nur auf <b>eine</b> Ziffer: die rechts neben der Stelle, auf die du rundest.</p>
    <ul><li>Ist sie <b>0, 1, 2, 3 oder 4</b>: <b>abrunden</b>. Die Rundungsstelle bleibt.</li><li>Ist sie <b>5, 6, 7, 8 oder 9</b>: <b>aufrunden</b>. Die Rundungsstelle wird um 1 größer.</li></ul>
    <p>Alles rechts von der Rundungsstelle wird 0. Beispiel auf Hunderter: ${M('4<mark>3</mark>72 ≈ 4400')}, denn rechts neben der 3 steht eine 7.</p>
    <p>Das Zeichen <b>≈</b> heißt „ungefähr gleich“.</p>
    <p>Beim <b>Überschlagen</b> rundest du alle Zahlen und rechnest mit den runden Zahlen. So weißt du schnell, ob ein Ergebnis ungefähr stimmen kann: ${M('487 + 312 ≈ 500 + 300 = 800')}.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Nur die Ziffer rechts neben der Rundungsstelle entscheidet.</li><li>0 bis 4 abrunden, 5 bis 9 aufrunden.</li><li>Überschlag: erst runden, dann rechnen.</li></ol></div>`,
  gen(level) {
    if (level === 1) return rundTask(R(1000, 99999), pick([1, 2]));
    if (level === 2) return Math.random() < 0.6 ? rundTask(R(10000, 9999999), pick([3, 4, 5])) : rundDec(q(R(1001, 99999), pick([100, 1000])), pick([1, 2]));
    return Math.random() < 0.6 ? ueberTask() : rundDec(q(R(10001, 999999), 1000), pick([1, 2]));
  },
  text: level => {
    if (level === 4) {
      const pr = [R(1, 9) * 100 + pick([95, 99, 49, 10, 89]), R(1, 9) * 100 + pick([95, 99, 20, 79]), R(1, 9) * 100 + pick([5, 15, 90])];
      const r = pr.map(c => Math.round(c / 100)), e = (c: number) => (c / 100).toFixed(2).replace('.', ',');
      return wordTask({
        prompt: `Lea kauft ein Heft für ${e(pr[0])} €, einen Stift für ${e(pr[1])} € und Kleber für ${e(pr[2])} €. Überschlage: Wie viel muss sie ungefähr bezahlen? Runde dazu auf ganze Euro.`,
        steps: [
          ...pr.map((c, i) => ({ title: `${['Heft', 'Stift', 'Kleber'][i]} runden`, ask: `Runde ${e(c)} € auf ganze Euro.`, calc: String(r[i]), explain: `${e(c)} € ≈ ${r[i]} €`, unit: '€' })),
          { title: 'Überschlag', ask: 'Wie viel ist das ungefähr zusammen?', calc: `${r[0]} + ${r[1]} + ${r[2]}`, unit: '€' },
        ].filter(s => !(s.calc === '0')),
        unit: '€', sentence: v => `Lea muss ungefähr ${v} bezahlen.`,
      });
    }
    const n = R(21, 34), p = R(141, 249), rn = rnd(n, 1), rp = rnd(p, 2);
    return wordTask({
      prompt: `Für die Klassenfahrt zahlen ${n} Kinder je ${p} €. Die Lehrerin will schnell wissen, wie viel Geld das ungefähr ist. Überschlage (Anzahl auf Zehner, Preis auf Hunderter runden).`,
      steps: [
        { title: 'Anzahl runden', ask: `Runde ${n} auf Zehner.`, calc: String(rn), explain: `${n} ≈ ${rn}` },
        { title: 'Preis runden', ask: `Runde ${p} € auf Hunderter.`, calc: String(rp), explain: `${p} € ≈ ${rp} €`, unit: '€' },
        { title: 'Überschlag', ask: 'Wie viel Geld ist das ungefähr?', calc: `${rn} · ${rp}`, wrong: [`${rn} + ${rp}`], why: 'Jedes Kind zahlt gleich viel: Anzahl mal Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `Es sind ungefähr ${v}. Genau sind es ${gz(n * p)} €.`,
    });
  },
};

/* ---------- Potenzen ---------- */
const sup = (b: number, e: number) => `${b}<sup>${e}</sup>`;
const expand = (b: number, e: number) => Array(e).fill(b).join(' · ');
function potTask(b: number, e: number): Task {
  const t = exprTask(expand(b, e), { placeholder: 'Ergebnis' });
  t.prompt = `Berechne: ${M(sup(b, e))}`; t.plain = `${b} hoch ${e}`;
  return withFirst(t, { hint: `${sup(b, e)} heißt: ${e}-mal die ${b} malnehmen, also ${expand(b, e)}.` , ask: `<p>${sup(b, e)} = ${expand(b, e)}. Rechne Schritt für Schritt.</p>${autoGuide(t.sol)[0].ask}` });
}
function potDiag(b: number, e: number) { return (v: Q) => (v.eq(q(b * e)) ? `Achtung: ${sup(b, e)} ist nicht ${b} · ${e}, sondern ${expand(b, e)}.` : null); }
const POT: Topic = {
  id: 'pot', klasse: 5, title: 'Potenzen', short: 'Kurzschrift für Malaufgaben mit gleichen Zahlen: 2³, 10⁶ und Quadratzahlen.',
  example: '2 · 2 · 2 + 3 · 3',
  theory: `
    <p>Wenn du dieselbe Zahl mehrmals malnimmst, kannst du das kurz als <b>Potenz</b> schreiben: ${M(`2 · 2 · 2 = ${sup(2, 3)}`)}. Gesprochen: „2 hoch 3“.</p>
    <p>Die untere Zahl heißt <b>Basis</b>: Sie wird malgenommen. Die kleine obere Zahl heißt <b>Exponent</b>: Sie sagt, wie oft.</p>
    <p>${M(`${sup(5, 2)} = 5 · 5 = 25`)} heißt auch „5 zum Quadrat“. Das sind die <b>Quadratzahlen</b>: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, …</p>
    <p><b>Zehnerpotenzen</b> sind praktisch für große Zahlen: ${M(`${sup(10, 3)} = 1000`)}, ${M(`${sup(10, 6)} = ${gz(1000000)}`)}. Der Exponent sagt, wie viele Nullen.</p>
    <p>Beim Rechnen gilt: <b>Potenz vor Punkt vor Strich</b>. ${M(`3 + ${sup(2, 3)} = 3 + 8 = 11`)}</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>${sup(2, 3)} = 2 · 2 · 2, nicht 2 · 3!</li><li>Bei Zehnerpotenzen zählt der Exponent die Nullen.</li><li>Potenzen zuerst, dann Punkt, dann Strich.</li></ol></div>`,
  gen(level) {
    return genFrom(() => {
      if (level === 1) {
        if (Math.random() < 0.3) {
          const b = R(2, 9), e = R(2, 5);
          return task(`Schreibe als Potenz: ${M(expand(b, e))} = ${M(sup(b, '?' as unknown as number))}. Welche Zahl gehört oben hin?`, q(e),
            [{ rule: 'Faktoren zählen', lines: [`Die ${b} kommt ${e}-mal vor.`, `${expand(b, e)} = ${sup(b, e)}`] }],
            [{ title: 'Zählen', ask: `<p>Wie oft kommt die ${b} vor?</p>`, answer: q(e), hint: 'Zähle die Zahlen, nicht die Malpunkte.', explain: `${expand(b, e)} = ${sup(b, e)}` }], { placeholder: 'Exponent' });
        }
        const b = R(2, 6), e = b <= 3 ? R(2, 4) : 2;
        return { ...potTask(b, e), diag: potDiag(b, e) };
      }
      if (level === 2) {
        const k = R(0, 2);
        const [b, e] = k === 0 ? [10, R(3, 7)] : k === 1 ? [R(11, 20), 2] : [pick([2, 3, 4, 5]), R(3, 5)];
        return { ...potTask(b, e), diag: potDiag(b, e) };
      }
      const a = R(2, 5), e = a <= 3 ? R(2, 4) : 2, c = R(2, 9), d = R(2, 4);
      const forms = [[`${sup(a, e)} + ${sup(c, 2)}`, `(${expand(a, e)}) + (${expand(c, 2)})`], [`${d} · ${sup(a, e)}`, `${d} · (${expand(a, e)})`], [`${sup(c, 2)} − ${sup(a, e)}`, `(${expand(c, 2)}) − (${expand(a, e)})`], [`${c} + ${d} · ${sup(a, e)}`, `${c} + ${d} · (${expand(a, e)})`]];
      const [shown, calc] = pick(forms);
      const t = exprTask(calc, { placeholder: 'Ergebnis' });
      t.prompt = `Berechne: ${M(shown)}`; t.plain = shown.replace(/<sup>(\d)<\/sup>/g, '^$1');
      return withFirst(t, { hint: 'Potenz vor Punkt vor Strich: Rechne zuerst die Potenzen aus.' });
    }, t => t.answer.sign() > 0 && t.answer.isInt());
  },
  text: level => {
    if (level === 4) {
      const n = R(3, 6);
      return wordTask({
        prompt: `Mia baut aus kleinen Zuckerwürfeln einen großen Würfel. Er ist ${n} Zuckerwürfel lang, ${n} breit und ${n} hoch. Wie viele Zuckerwürfel braucht sie? (Das ist ${n}<sup>3</sup>.)`,
        steps: [
          { title: 'Eine Schicht', ask: 'Wie viele Zuckerwürfel liegen in der untersten Schicht?', calc: `${n} · ${n}`, wrong: [`${n} + ${n}`], why: 'Eine Schicht ist ein Quadrat: Länge mal Breite.' },
          { title: 'Alle Schichten', ask: `Es gibt ${n} Schichten übereinander. Wie viele Zuckerwürfel sind es insgesamt?`, calc: `${n * n} · ${n}`, wrong: [`${n * n} + ${n}`], why: 'Jede Schicht gleich viele: mal die Anzahl der Schichten.' },
        ],
        unit: 'Zuckerwürfel', sentence: v => `Mia braucht ${v} Zuckerwürfel.`.replace(' Zuckerwürfel Zuckerwürfel', ' Zuckerwürfel'),
      });
    }
    const s = R(2, 9), h = R(3, 5);
    const steps = Array.from({ length: h }, (_, i) => ({ title: `Nach ${i + 1} ${i ? 'Stunden' : 'Stunde'}`, ask: `Wie viele Bakterien sind es nach ${i + 1} ${i ? 'Stunden' : 'Stunde'}?`, calc: `${s * 2 ** i} · 2`, wrong: i === 0 ? [`${s * 2 ** i} + 2`] : undefined, why: 'Verdoppeln heißt mal 2.' }));
    return wordTask({
      prompt: `In einer Petrischale sind ${s} Bakterien. Jede Stunde verdoppelt sich ihre Anzahl. Wie viele Bakterien sind es nach ${h} Stunden?`,
      steps, term: `${s} · ${Array(h).fill(2).join(' · ')}`,
      unit: 'Bakterien', sentence: v => `Nach ${h} Stunden sind es ${v}. Kurz: ${s} · 2<sup>${h}</sup>.`.replace(' Bakterien Bakterien', ' Bakterien'),
    });
  },
};

/* ---------- Proportional und antiproportional ---------- */
interface Ctx { a: number; b: number; ya: Q; anti: boolean; x: string; y: string; xu: string; yu: string }
function dreisatz(c: Ctx, story: string): Task {
  const one = c.anti ? c.ya.mul(q(c.a)) : c.ya.div(q(c.a));
  const yb = c.anti ? one.div(q(c.b)) : one.mul(q(c.b));
  const ch: GuideChoice = { ask: `Wie hängen ${c.x} und ${c.y} zusammen?`, options: opts(c.anti ? 'je mehr, desto weniger (antiproportional)' : 'je mehr, desto mehr (proportional)', [c.anti ? 'je mehr, desto mehr (proportional)' : 'je mehr, desto weniger (antiproportional)']), why: c.anti ? `Mehr ${c.x} schaffen es schneller: Die ${c.y} werden weniger.` : `Doppelt so viele ${c.x} kosten doppelt so viel.` };
  const g: GuideStep[] = [
    { title: `Auf 1 ${c.xu} umrechnen`, choose: ch, ask: `<p>Wie viel ${c.anti ? `wäre es bei nur 1 ${c.xu}` : `ist es für 1 ${c.xu}`}?</p><div class="math big">${dH(c.ya)} ${c.anti ? '·' : ':'} ${c.a} = ?</div>`, answer: one, hint: c.anti ? 'Bei antiproportional ist das Produkt immer gleich: Rechne mal.' : 'Bei proportional teilst du durch die Anzahl.', explain: `1 ${c.xu}: ${dH(one)} ${c.yu}`, placeholder: `Antwort in ${c.yu}` },
    { title: `Auf ${c.b} ${c.xu} umrechnen`, ask: `<p>Und für ${c.b} ${c.xu}?</p><div class="math big">${dH(one)} ${c.anti ? ':' : '·'} ${c.b} = ?</div>`, answer: yb, hint: c.anti ? 'Jetzt teilst du durch die neue Anzahl.' : 'Jetzt nimmst du mal die neue Anzahl.', explain: `${c.b} ${c.xu}: ${dH(yb)} ${c.yu}`, placeholder: `Antwort in ${c.yu}` },
  ];
  return { prompt: story, plain: story, answer: yb, guide: g, placeholder: `Antwort in ${c.yu}`,
    heft: heftDreisatz({ a: String(c.a), b: String(c.b), ya: `${dH(c.ya)} ${c.yu}`, y1: `${dH(one)} ${c.yu}`, yb: `${dH(yb)} ${c.yu}`, x: c.x, y: c.y, anti: c.anti }),
    sol: list([{ rule: c.anti ? 'Antiproportional erkennen' : 'Proportional erkennen', lines: [ch.why] },
      { rule: 'Dreisatz', lines: [`${c.a} ${c.xu} → ${dH(c.ya)} ${c.yu}`, `1 ${c.xu} → ${dH(one)} ${c.yu} (${c.anti ? `mal ${c.a}` : `geteilt durch ${c.a}`})`, `${c.b} ${c.xu} → ${dH(yb)} ${c.yu} (${c.anti ? `geteilt durch ${c.b}` : `mal ${c.b}`})`] }], yb, `${dH(yb)} ${c.yu}`),
    diag: v => { const wrong = c.anti ? c.ya.div(q(c.a)).mul(q(c.b)) : c.ya.mul(q(c.a)).div(q(c.b)); return v.eq(wrong) ? (c.anti ? 'Das wäre richtig, wenn es proportional wäre. Hier gilt aber: je mehr, desto <b>weniger</b>.' : 'Das wäre richtig, wenn es antiproportional wäre. Hier gilt: je mehr, desto <b>mehr</b>.') : null; } };
}
// Jede Geschichte hat realistische Werte für eine Einheit (one) und sagt, ob nur ganze Zahlen Sinn ergeben.
interface Story { x: string; xu: string; y: string; yu: string; one: (level: number) => Q; int?: boolean; s: (a: number, b: number, y: string) => string }
const cents = (lo: number, hi: number, step: number) => q(R(lo / step, hi / step) * step, 100);
const PROP_STORIES: Story[] = [
  { x: 'Hefte', xu: 'Hefte', y: 'Preis', yu: '€', one: l => l === 1 ? q(R(1, 3)) : cents(40, 250, 5), s: (a, b, y) => `${a} Hefte kosten ${y} €. Wie viel kosten ${b} Hefte?` },
  { x: 'Brötchen', xu: 'Brötchen', y: 'Preis', yu: '€', one: () => cents(30, 90, 5), s: (a, b, y) => `${a} Brötchen kosten ${y} €. Wie viel kosten ${b} Brötchen?` },
  { x: 'Eintrittskarten', xu: 'Karten', y: 'Preis', yu: '€', one: l => l === 1 ? q(R(4, 12)) : cents(450, 1250, 50), s: (a, b, y) => `${a} Eintrittskarten fürs Kino kosten ${y} €. Wie viel kosten ${b} Karten?` },
  { x: 'Stunden', xu: 'h', y: 'Strecke', yu: 'km', one: l => l === 1 ? q(R(12, 20)) : q(R(24, 40), 2), s: (a, b, y) => `Eine Radfahrerin fährt gleichmäßig. In ${a} Stunden schafft sie ${y} km. Wie weit kommt sie in ${b} Stunden?` },
  { x: 'Kilogramm', xu: 'kg', y: 'Preis', yu: '€', one: l => l === 1 ? q(R(2, 4)) : cents(150, 450, 10), s: (a, b, y) => `${a} kg Äpfel kosten ${y} €. Wie viel kosten ${b} kg?` },
];
const ANTI_STORIES: Story[] = [
  { x: 'Pumpen', xu: 'Pumpe', y: 'Stunden', yu: 'h', one: () => q(R(6, 24) * 2), s: (a, b, y) => `${a} gleiche Pumpen leeren ein Becken in ${y} Stunden. Wie lange brauchen ${b} Pumpen?` },
  { x: 'Kinder', xu: 'Kind', y: 'Gummibärchen pro Kind', yu: 'Stück', int: true, one: () => q(R(6, 20) * 12), s: (a, b, y) => `Eine Tüte Gummibärchen reicht für ${a} Kinder, wenn jedes ${y} Stück bekommt. Wie viele bekommt jedes, wenn ${b} Kinder teilen?` },
  { x: 'Maler', xu: 'Maler', y: 'Tage', yu: 'Tage', int: true, one: () => q(R(4, 15) * 12), s: (a, b, y) => `${a} Maler streichen ein Haus in ${y} Tagen. Wie lange brauchen ${b} Maler?` },
];
function propGen(level: number): Task | null {
  let st: Story = PROP_STORIES[0];
  return genFrom(() => {
    const anti = level === 3 && Math.random() < 0.6;
    st = pick(anti ? ANTI_STORIES : PROP_STORIES);
    const a = R(2, anti ? 6 : 8), b = R(2, anti ? 8 : 12);
    if (a === b) return null;
    const one = st.one(level);
    const ya = anti ? one.div(q(a)) : one.mul(q(a));
    if (st.int && !ya.isInt()) return null;
    return dreisatz({ a, b, ya, anti, x: st.x, y: st.y, xu: st.xu, yu: st.yu }, st.s(a, b, st.yu === '€' ? eur(ya) : dH(ya)));
  }, t => t.answer.sign() > 0 && t.answer.terminating() && t.guide!.every(s => s.answer.terminating() && (s.answer.mul(q(100)).isInt())) && (!st.int || t.guide!.every(s => s.answer.isInt())) && (level > 1 || t.guide!.every(s => s.answer.isInt())));
}
const PROP: Topic = {
  id: 'prop', klasse: 6, title: 'Proportional und antiproportional', short: 'Dreisatz: je mehr, desto mehr oder je mehr, desto weniger.',
  exampleSol: () => { const t = dreisatz({ a: 3, b: 5, ya: q(6), anti: false, x: 'Hefte', y: 'Preis', xu: 'Hefte', yu: '€' }, '3 Hefte kosten 6 €. Wie viel kosten 5 Hefte?'); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p><b>Proportional</b> heißt: <b>je mehr, desto mehr</b>, und zwar gleichmäßig. Doppelt so viele Hefte kosten doppelt so viel.</p>
    <p><b>Antiproportional</b> heißt: <b>je mehr, desto weniger</b>. Doppelt so viele Pumpen brauchen nur halb so lange.</p>
    <p>Beide löst du mit dem <b>Dreisatz</b>: Erst rechnest du auf <b>1</b> um, dann auf die gesuchte Anzahl.</p>
    <table class="stellen"><tr><th></th><th>proportional</th><th>antiproportional</th></tr>
      <tr><th>gegeben</th><td>3 Hefte → 6 €</td><td>4 Pumpen → 6 h</td></tr>
      <tr><th>auf 1</th><td>1 Heft → 6 : 3 = 2 €</td><td>1 Pumpe → 6 · 4 = 24 h</td></tr>
      <tr><th>gesucht</th><td>5 Hefte → 2 · 5 = 10 €</td><td>3 Pumpen → 24 : 3 = 8 h</td></tr></table>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Erst fragen: je mehr, desto mehr oder desto weniger?</li><li>Proportional: auf 1 teilen, dann mal.</li><li>Antiproportional: auf 1 mal, dann teilen.</li></ol></div>`,
  gen: propGen,
  text: level => genFrom(() => {
    if (level === 4) {
      const p = pick([2, 4, 5]), m = R(2, 8) * 25 * p, n = R(3, 10);
      if (n === p) return null;
      return wordTask({
        prompt: `Für einen Kuchen für ${p} Personen braucht man ${m} g Mehl. Wie viel Mehl braucht man für ${n} Personen?`,
        steps: [
          { title: 'Für 1 Person', ask: 'Wie viel Mehl braucht man für 1 Person?', calc: `${m} : ${p}`, wrong: [`${m} · ${p}`], why: 'Proportional: auf 1 teilen.', unit: 'g' },
          { title: `Für ${n} Personen`, ask: `Wie viel Mehl braucht man für ${n} Personen?`, calc: `${m / p} · ${n}`, wrong: [`${m / p} : ${n}`], why: 'Dann mal die neue Anzahl.', unit: 'g' },
        ],
        unit: 'g', sentence: v => `Für ${n} Personen braucht man ${v} Mehl.`,
      });
    }
    if (Math.random() < 0.5) {
      const h = R(6, 16), d = pick([10, 12, 15, 20, 24]), more = R(2, 6), all = h * d;
      if (all % (h + more)) return null;
      return wordTask({
        prompt: `Das Futter im Tierheim reicht für ${h} Hasen ${d} Tage. Dann kommen ${more} Hasen dazu. Wie viele Tage reicht das Futter jetzt?`,
        steps: [
          { title: 'Hasen jetzt', ask: 'Wie viele Hasen sind es jetzt?', calc: `${h} + ${more}`, unit: 'Hasen' },
          { title: 'Für 1 Hasen', ask: 'Wie viele Tage würde das Futter für nur 1 Hasen reichen?', calc: `${h} · ${d}`, wrong: [`${d} : ${h}`], why: 'Antiproportional: Weniger Hasen, länger reicht es. Auf 1 rechnest du mal.', unit: 'Tage' },
          { title: 'Für alle Hasen', ask: `Wie viele Tage reicht es für ${h + more} Hasen?`, calc: `${all} : ${h + more}`, wrong: [`${all} · ${h + more}`], why: 'Dann teilst du durch die neue Anzahl.', unit: 'Tage' },
        ],
        unit: 'Tage', sentence: v => `Das Futter reicht jetzt ${v}.`,
      });
    }
    const l = pick([5, 6, 7, 8]), km = R(2, 9) * 50, pr = pick(['1,7', '1,8', '1,9']);
    return wordTask({
      prompt: `Ein Auto verbraucht ${l} Liter Benzin auf 100 km. Familie Öz fährt ${km} km in den Urlaub. Ein Liter kostet ${pr} €. Wie viel kostet das Benzin?`,
      steps: [
        { title: 'Benzin für die Strecke', ask: `Wie viele Liter braucht das Auto für ${km} km?`, calc: `${l} : 100 · ${km}`, wrong: [`${l} · 100 : ${km}`], why: 'Proportional: erst auf 1 km (durch 100), dann mal die Kilometer.', unit: 'l' },
        { title: 'Kosten', ask: 'Wie viel kostet das Benzin?', calc: `${(l * km) / 100} · ${pr}`, unit: '€' },
      ],
      unit: '€', sentence: v => `Das Benzin kostet ${v}.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating() && s.answer.mul(q(100)).isInt())),
};

/* ---------- Maßstab ---------- */
const lenH = (cm: Q): { v: Q; u: string } => (cm.lt(q(100)) ? { v: cm, u: 'cm' } : cm.lt(q(100000)) ? { v: cm.div(q(100)), u: 'm' } : { v: cm.div(q(100000)), u: 'km' });
function massTask(level: number): Task | null {
  return genFrom(() => {
    if (level === 1 || (level === 2 && Math.random() < 0.5)) {
      const m = level === 1 ? pick([10, 50, 100]) : pick([1000, 25000, 50000, 100000]);
      const cm = level === 1 ? R(2, 12) : R(2, 9) + pick([0, 0.5]);
      const real = q(cm * 10, 10).mul(q(m)), out = lenH(real), f = out.u === 'm' ? 100 : out.u === 'km' ? 100000 : 1;
      const cH = dH(q(cm * 10, 10));
      const t: Task = { prompt: `Maßstab ${M(`1 : ${gz(m)}`)}. Auf ${m <= 100 ? 'dem Plan' : 'der Karte'} ist eine Strecke ${M(`${cH} cm`)} lang. Wie lang ist sie in Wirklichkeit (in ${out.u})?`, answer: out.v, placeholder: `Antwort in ${out.u}`,
        sol: list([{ rule: 'Maßstab lesen', lines: [`1 : ${gz(m)} heißt: 1 cm auf ${m <= 100 ? 'dem Plan' : 'der Karte'} sind ${gz(m)} cm in Wirklichkeit.`] }, { rule: 'Mal den Maßstab', lines: [`${cH} cm · ${gz(m)} = ${gz(Number(real.n))} cm`] }, ...(f > 1 ? [{ rule: `In ${out.u} umrechnen`, lines: [`${gz(Number(real.n))} cm : ${gz(f)} = ${dH(out.v)} ${out.u}`] }] : [])], out.v, `${dH(out.v)} ${out.u}`),
        guide: [
          { title: 'Mal den Maßstab', ask: `<p>1 cm sind ${gz(m)} cm in Wirklichkeit. Wie viele cm sind dann ${cH} cm?</p><div class="math big">${cH} · ${gz(m)} = ?</div>`, answer: real, hint: 'Rechne die Länge mal die Zahl hinter dem Doppelpunkt.', explain: `${gz(Number(real.n))} cm`, placeholder: 'Antwort in cm' },
          ...(f > 1 ? [{ title: `In ${out.u} umrechnen`, ask: `<p>1 ${out.u} = ${gz(f)} cm. Wie viele ${out.u} sind ${gz(Number(real.n))} cm?</p>`, answer: out.v, hint: `Teile durch ${gz(f)}.`, explain: `${dH(out.v)} ${out.u}`, placeholder: `Antwort in ${out.u}` }] : []),
        ],
        diag: v => (v.eq(real) && f > 1 ? `Die Zahl stimmt in cm. Gefragt ist aber in <b>${out.u}</b>.` : null) };
      return t;
    }
    if (level === 2) {
      const m = pick([25000, 50000, 100000]), km = R(1, 8) / 2 * (m / 25000), cm = q(km * 100000).div(q(m));
      return { prompt: `Auf einer Karte mit Maßstab ${M(`1 : ${gz(m)}`)} soll ein Weg eingezeichnet werden, der in Wirklichkeit ${M(`${dH(q(km * 2, 2))} km`)} lang ist. Wie lang wird er auf der Karte (in cm)?`, answer: cm, placeholder: 'Antwort in cm',
        sol: list([{ rule: 'In cm umrechnen', lines: [`${dH(q(km * 2, 2))} km = ${gz(km * 100000)} cm`] }, { rule: 'Durch den Maßstab', lines: [`${gz(km * 100000)} : ${gz(m)} = ${dH(cm)} cm`] }], cm, `${dH(cm)} cm`),
        guide: [
          { title: 'In cm umrechnen', ask: `<p>1 km = 100&#8239;000 cm. Wie viele cm sind ${dH(q(km * 2, 2))} km?</p>`, answer: q(km * 100000), hint: 'Mal 100 000.', explain: `${gz(km * 100000)} cm`, placeholder: 'Antwort in cm' },
          { title: 'Durch den Maßstab', ask: `<p>Auf der Karte ist alles ${gz(m)}-mal kleiner. Wie viele cm sind es auf der Karte?</p><div class="math big">${gz(km * 100000)} : ${gz(m)} = ?</div>`, answer: cm, hint: 'Von Wirklichkeit zur Karte: geteilt.', explain: `${dH(cm)} cm`, placeholder: 'Antwort in cm' },
        ] };
    }
    const m = pick([10000, 20000, 25000, 50000, 100000]), cm = R(2, 8), real = cm * m, out = lenH(q(real));
    return { prompt: `Auf einer Karte sind ${M(`${cm} cm`)} in Wirklichkeit ${M(`${dH(out.v)} ${out.u}`)}. Welchen Maßstab hat die Karte? Gib die Zahl hinter ${M('1 :')} an.`, answer: q(m), placeholder: '1 : …',
      sol: list([{ rule: 'Gleiche Einheit', lines: [`${dH(out.v)} ${out.u} = ${gz(real)} cm`] }, { rule: 'Auf 1 cm', lines: [`${gz(real)} : ${cm} = ${gz(m)}`, `Der Maßstab ist 1 : ${gz(m)}.`] }], q(m), `1 : ${gz(m)}`),
      guide: [
        { title: 'Gleiche Einheit', ask: `<p>Wie viele cm sind ${dH(out.v)} ${out.u}?</p>`, answer: q(real), hint: out.u === 'km' ? '1 km = 100 000 cm.' : '1 m = 100 cm.', explain: `${gz(real)} cm`, placeholder: 'Antwort in cm' },
        { title: 'Auf 1 cm', ask: `<p>${cm} cm auf der Karte sind ${gz(real)} cm. Wie viel ist dann 1 cm auf der Karte?</p><div class="math big">${gz(real)} : ${cm} = ?</div>`, answer: q(m), hint: `Teile durch ${cm}.`, explain: `1 cm → ${gz(m)} cm, also 1 : ${gz(m)}`, placeholder: 'Zahl' },
      ] };
  }, t => t.answer.sign() > 0 && t.answer.terminating() && t.guide!.every(s => s.answer.terminating()));
}
const MASS: Topic = {
  id: 'mass', klasse: 6, title: 'Maßstab', short: 'Karten und Baupläne lesen: Wie lang ist es in Wirklichkeit?',
  exampleSol: () => { const t = massTask(1)!; return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Karten und Baupläne sind <b>verkleinert</b>. Der <b>Maßstab</b> sagt, wie stark. ${M('1 : 100')} heißt: <b>1 cm</b> auf dem Plan sind <b>100 cm</b> in Wirklichkeit.</p>
    <p><b>Vom Plan zur Wirklichkeit:</b> mal die Zahl hinter dem Doppelpunkt. ${M('4 cm · 100 = 400 cm = 4 m')}</p>
    <p><b>Von der Wirklichkeit zum Plan:</b> geteilt. Bei ${M(`1 : ${gz(25000)}`)} sind 1 km = 100&#8239;000 cm auf der Karte ${M(`100${'&#8239;'}000 : 25${'&#8239;'}000 = 4 cm`)}.</p>
    <p>Bei ${M('10 : 1')} ist es umgekehrt: Das Bild ist <b>vergrößert</b>, zum Beispiel bei einer Ameise im Biobuch.</p>
    <table class="stellen"><tr><th>Maßstab</th><th>1 cm auf der Karte</th></tr><tr><td>1 : 25&#8239;000</td><td>250 m</td></tr><tr><td>1 : 50&#8239;000</td><td>500 m</td></tr><tr><td>1 : 100&#8239;000</td><td>1 km</td></tr></table>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Karte → Wirklichkeit: mal.</li><li>Wirklichkeit → Karte: geteilt.</li><li>Vorher alles in cm umrechnen. 1 m = 100 cm, 1 km = 100 000 cm.</li></ol></div>`,
  gen: massTask,
  text: level => genFrom(() => {
    if (level === 4) {
      const m = pick([25000, 50000]), a = R(2, 7), b = R(2, 7), s = a + b, km = q(s * m, 100000);
      return wordTask({
        prompt: `Auf der Wanderkarte (Maßstab 1 : ${gz(m)}) misst Paul zwei Wegstücke: ${a} cm bis zur Hütte und ${b} cm von der Hütte zum Gipfel. Wie viele Kilometer ist der Weg in Wirklichkeit lang?`,
        steps: [
          { title: 'Auf der Karte', ask: 'Wie lang ist der ganze Weg auf der Karte?', calc: `${a} + ${b}`, unit: 'cm' },
          { title: 'In Wirklichkeit in cm', ask: 'Wie viele cm sind das in Wirklichkeit?', calc: `${s} · ${m}`, wrong: [`${s} : ${m}`], why: 'Karte → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
          { title: 'In km', ask: 'Wie viele km sind das? (1 km = 100 000 cm)', calc: `${s * m} : 100000`, wrong: [`${s * m} : 1000`], why: '1 km sind 100 000 cm.', unit: 'km' },
        ],
        unit: 'km', sentence: v => `Der Weg ist ${v} lang.`,
      });
    }
    const a = R(6, 12), b = R(4, 10);
    return wordTask({
      prompt: `Auf dem Bauplan (Maßstab 1 : 50) ist Leos Zimmer ${a} cm lang und ${b} cm breit. Wie groß ist die Fläche des Zimmers in Wirklichkeit in m²?`,
      steps: [
        { title: 'Länge in Wirklichkeit', ask: `Wie lang ist das Zimmer in Wirklichkeit? Rechne erst in cm, dann in m.`, calc: `${a} · 50 : 100`, wrong: [`${a} : 50`], why: 'Plan → Wirklichkeit: mal 50. Dann durch 100 für Meter.', unit: 'm' },
        { title: 'Breite in Wirklichkeit', ask: 'Wie breit ist das Zimmer in Wirklichkeit?', calc: `${b} · 50 : 100`, unit: 'm' },
        { title: 'Fläche', ask: 'Wie groß ist die Fläche?', calc: `${dec1((a * 50) / 100)} · ${dec1((b * 50) / 100)}`, wrong: [`2 · ${dec1((a * 50) / 100)} + 2 · ${dec1((b * 50) / 100)}`], why: 'Fläche vom Rechteck: Länge mal Breite.', unit: 'm²' },
      ],
      unit: 'm²', sentence: v => `Das Zimmer hat ${v} Fläche.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating())),
};

/* ---------- Daten, Diagramme und Mittelwert ---------- */
const SPORT = ['Fußball', 'Schwimmen', 'Tanzen', 'Reiten', 'Basketball', 'Turnen'];
function barSVG(labels: string[], vals: number[], unit: string): string {
  const max = Math.max(...vals), step = max > 20 ? 5 : 2, top = Math.ceil(max / step) * step, H = 150, bw = 220 / labels.length;
  let g = '';
  for (let v = 0; v <= top; v += step) { const y = 22 + H - (v / top) * H; g += `<line class="gl" x1="40" y1="${y}" x2="270" y2="${y}" /><text class="tk" x="34" y="${y + 4}" text-anchor="end">${v}</text>`; }
  const bars = vals.map((v, i) => { const h = (v / top) * H, x = 48 + i * bw; return `<rect class="bar-r" x="${x}" y="${22 + H - h}" width="${bw - 10}" height="${h}" /><text class="tk" x="${x + (bw - 10) / 2}" y="${H + 38}" text-anchor="middle">${labels[i].length > 7 ? labels[i].slice(0, 6) + '.' : labels[i]}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 280 ${H + 46}" role="img" aria-label="Säulendiagramm ${unit}: ${labels.map((l, i) => `${l} ${vals[i]}`).join(', ')}">${g}${bars}<text class="tk" x="40" y="10" text-anchor="end">${unit}</text></svg>`;
}
function tallySVG(n: number): string {
  let s = '', x = 6;
  for (let k = 0; k < n; k += 5) {
    const m = Math.min(5, n - k);
    for (let i = 0; i < Math.min(4, m); i++) s += `<line class="tally" x1="${x + i * 9}" y1="6" x2="${x + i * 9}" y2="40" />`;
    if (m === 5) s += `<line class="tally" x1="${x - 4}" y1="34" x2="${x + 31}" y2="12" />`;
    x += 46;
  }
  return `<svg class="chart tally-s" viewBox="0 0 ${x} 46" role="img" aria-label="Strichliste">${s}</svg>`;
}
function datenGen(level: number): Task | null {
  return genFrom(() => {
    const n = level === 1 ? 4 : 5, labels = [...SPORT].sort(() => Math.random() - 0.5).slice(0, n), step = level === 1 ? 2 : 1;
    const vals = labels.map(() => R(1, level === 1 ? 10 : 14) * step);
    const chart = barSVG(labels, vals, 'Kinder');
    if (level === 1) {
      if (Math.random() < 0.3) { const k = R(6, 23); return { prompt: `In der Pause zählt Ben, wie viele Kinder Fußball spielen. Wie viele Kinder sind es?${tallySVG(k)}`, answer: q(k), placeholder: 'Anzahl', sol: list([{ rule: 'Fünferbündel zählen', lines: [`${Math.floor(k / 5)} Bündel zu je 5 = ${5 * Math.floor(k / 5)}`, `dazu ${k % 5} einzelne Striche`, `${5 * Math.floor(k / 5)} + ${k % 5} = ${k}`] }], q(k)),
        guide: [{ title: 'Bündel', ask: '<p>Ein Bündel mit Querstrich sind 5. Wie viele ganze Bündel siehst du?</p>', answer: q(Math.floor(k / 5)), explain: `${Math.floor(k / 5)} · 5 = ${5 * Math.floor(k / 5)}`, hint: 'Zähle die durchgestrichenen Gruppen.' }, { title: 'Zusammen', ask: `<p>Dazu kommen die einzelnen Striche. Wie viele sind es insgesamt?</p>`, answer: q(k), explain: `${5 * Math.floor(k / 5)} + ${k % 5} = ${k}`, hint: 'Bündel mal 5, plus die einzelnen.' }] }; }
      const i = R(0, n - 1);
      return { prompt: `Die Klasse 5b hat abgestimmt: Welcher Sport gefällt dir am besten? Wie viele Kinder haben <b>${labels[i]}</b> gewählt?${chart}`, answer: q(vals[i]), placeholder: 'Anzahl',
        sol: list([{ rule: 'Ablesen', lines: [`Die Säule bei ${labels[i]} geht bis ${vals[i]}.`] }], q(vals[i])),
        guide: [{ title: 'Ablesen', ask: `<p>Fahr mit dem Finger von der Säule ${labels[i]} oben waagerecht nach links. Bei welcher Zahl landest du?</p>`, answer: q(vals[i]), hint: 'Die Linien helfen dir. Zwischen zwei beschrifteten Linien liegt die Mitte.', explain: `${labels[i]}: ${vals[i]} Kinder` }] };
    }
    if (level === 2) {
      const i = R(0, n - 1), j = R(0, n - 1);
      if (i === j || vals[i] === vals[j]) return null;
      const [a, b] = vals[i] > vals[j] ? [i, j] : [j, i];
      if (Math.random() < 0.5) { const t = exprTask(`${vals[a]} − ${vals[b]}`, { placeholder: 'Anzahl' }); t.prompt = `Wie viele Kinder mehr haben <b>${labels[a]}</b> gewählt als <b>${labels[b]}</b>?${chart}`;
        t.guide = [{ title: labels[a], ask: `<p>Lies ab: Wie viele haben ${labels[a]} gewählt?</p>`, answer: q(vals[a]), explain: String(vals[a]), hint: 'Säule oben, waagerecht nach links.' }, { title: labels[b], ask: `<p>Wie viele haben ${labels[b]} gewählt?</p>`, answer: q(vals[b]), explain: String(vals[b]) }, { title: 'Unterschied', ask: `<div class="math big">${vals[a]} − ${vals[b]} = ?</div>`, answer: t.answer, explain: `${vals[a]} − ${vals[b]} = ${vals[a] - vals[b]}`, hint: 'Wie viel mehr: minus.' }]; return t; }
      const t = exprTask(vals.join(' + '), { placeholder: 'Anzahl' }); t.prompt = `Wie viele Kinder haben insgesamt abgestimmt?${chart}`;
      return withFirst(t, { hint: 'Lies alle Säulen ab und addiere sie.' });
    }
    if (Math.random() < 0.3) {
      const v = Array.from({ length: R(5, 7) }, () => R(2, 30)), mx = Math.max(...v), mn = Math.min(...v);
      const t = exprTask(`${mx} − ${mn}`, { placeholder: 'Spannweite' });
      t.prompt = `Ein Wetterforscher misst eine Woche lang die Temperatur am Mittag (in °C): ${M(v.join('; '))}. Wie groß ist die <b>Spannweite</b> (größter minus kleinster Wert)?`;
      t.guide = [{ title: 'Größter Wert', ask: '<p>Welcher Wert ist der größte?</p>', answer: q(mx), explain: String(mx), hint: 'Geh alle Zahlen durch.' }, { title: 'Kleinster Wert', ask: '<p>Welcher ist der kleinste?</p>', answer: q(mn), explain: String(mn) }, { title: 'Spannweite', ask: `<div class="math big">${mx} − ${mn} = ?</div>`, answer: q(mx - mn), explain: `${mx - mn} °C`, hint: 'Größter minus kleinster.' }];
      return t;
    }
    const k = R(4, 6), mean = R(3, 20), v = Array.from({ length: k - 1 }, () => R(Math.max(1, mean - 6), mean + 6)), last = mean * k - v.reduce((a, b) => a + b, 0);
    if (last < 1) return null;
    v.push(last); v.sort(() => Math.random() - 0.5);
    const t = exprTask(`(${v.join(' + ')}) : ${k}`, { placeholder: 'Mittelwert' });
    t.prompt = `${k} Kinder zählen, wie viele Bücher sie in den Ferien gelesen haben: ${M(v.join('; '))}. Berechne den <b>Mittelwert</b> (Durchschnitt).`;
    t.diag = x => (x.eq(q(v.reduce((a, b) => a + b, 0))) ? `Das ist die Summe. Für den Mittelwert teilst du noch durch die Anzahl (${k}).` : null);
    return withFirst(t, { hint: 'Mittelwert: alle Werte addieren, dann durch die Anzahl der Werte teilen.' });
  }, t => t.answer.sign() > 0 && t.answer.isInt());
}
const DATEN: Topic = {
  id: 'daten', klasse: 5, title: 'Daten, Diagramme und Mittelwert', short: 'Strichlisten, Säulendiagramme lesen und den Durchschnitt berechnen.',
  exampleSol: () => { const t = datenGen(3)!; return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Wenn du etwas zählst, hilft eine <b>Strichliste</b>. Jeder fünfte Strich geht quer durch die vier davor. So zählst du schnell in Fünferbündeln.${tallySVG(12)}</p>
    <p>In einem <b>Säulendiagramm</b> zeigt die Höhe jeder Säule, wie viel es ist. Du liest ab, indem du von der Säule oben waagerecht zur Zahl links gehst.${barSVG(['Fußball', 'Tanzen', 'Reiten'], [8, 5, 3], 'Kinder')}</p>
    <p>Der <b>Mittelwert</b> (Durchschnitt) sagt, wie viel es wäre, wenn alle gleich viel hätten. Du addierst alle Werte und teilst durch die Anzahl: ${M('(3 + 5 + 4) : 3 = 12 : 3 = 4')}.</p>
    <p>Die <b>Spannweite</b> ist der Abstand zwischen dem größten und dem kleinsten Wert.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Strichliste: in Fünferbündeln zählen.</li><li>Mittelwert = Summe : Anzahl.</li><li>Spannweite = größter Wert − kleinster Wert.</li></ol></div>`,
  gen: datenGen,
  text: level => genFrom(() => {
    if (level === 4) {
      const g = Array.from({ length: 4 }, () => R(1, 4)), s = g.reduce((a, b) => a + b, 0);
      return wordTask({
        prompt: `Tim hat in Mathe diese Noten geschrieben: ${g.join(', ')}. Welche Durchschnittsnote hat er?`,
        steps: [
          { title: 'Summe', ask: 'Wie groß ist die Summe aller Noten?', calc: g.join(' + ') },
          { title: 'Durchschnitt', ask: 'Wie groß ist der Durchschnitt?', calc: `${s} : 4`, wrong: [`${s} · 4`, `${s} : 2`], why: 'Summe geteilt durch die Anzahl der Noten.' },
        ],
        sentence: v => `Tims Durchschnittsnote ist ${v}.`,
      });
    }
    const k = 5, mean = R(10, 15), v = Array.from({ length: k - 1 }, () => R(mean - 3, mean + 3)), s = v.reduce((a, b) => a + b, 0), need = mean * k - s;
    if (need < 5 || need > 25) return null;
    return wordTask({
      prompt: `Lea läuft fünfmal um den Sportplatz und misst jedes Mal die Zeit. Die ersten vier Runden dauern ${v.join(', ')} Minuten. Wie lange darf die fünfte Runde dauern, damit der Mittelwert genau ${mean} Minuten ist?`,
      steps: [
        { title: 'Summe für den Mittelwert', ask: `Wie viele Minuten müssen alle fünf Runden zusammen sein, damit der Mittelwert ${mean} ist?`, calc: `${mean} · ${k}`, wrong: [`${mean} : ${k}`], why: 'Mittelwert mal Anzahl ergibt die Summe.', unit: 'min' },
        { title: 'Schon gelaufen', ask: 'Wie viele Minuten hat sie in den ersten vier Runden gebraucht?', calc: v.join(' + '), unit: 'min' },
        { title: 'Fünfte Runde', ask: 'Wie lange darf die fünfte Runde dauern?', calc: `${mean * k} − ${s}`, unit: 'min' },
      ],
      unit: 'min', sentence: v2 => `Die fünfte Runde darf ${v2} dauern.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating())),
};

export const ZAHL_TOPICS: Topic[] = [ZAHL, RUND, POT, PROP, MASS, DATEN];
