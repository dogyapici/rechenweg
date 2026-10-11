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
/** Namen für Textaufgaben, mit passenden Pronomen. */
const KIDS: [string, 'er' | 'sie'][] = [['Mia', 'sie'], ['Ben', 'er'], ['Lena', 'sie'], ['Tim', 'er'], ['Emre', 'er'], ['Sofia', 'sie'], ['Noah', 'er'], ['Lea', 'sie'], ['Jonas', 'er'], ['Aylin', 'sie']];
const kid = () => { const [n, p] = pick(KIDS); const m = p === 'er'; return { n, P: m ? 'Er' : 'Sie', p, sein: m ? 'sein' : 'ihr', ihm: m ? 'ihm' : 'ihr', gen: /[sxz]$/.test(n) ? `${n}’` : `${n}s` }; };
const FAM = ['Öz', 'Weber', 'Yilmaz', 'Schmidt', 'Kaya', 'Müller', 'Nguyen', 'Becker'];
/** Geldbetrag im Antwortsatz mit zwei Nachkommastellen: „2,1 €“ wird „2,10 €“. */
const cent = (v: string) => v.replace(/,(\d)(?!\d)/, ',$10');
type WT = ReturnType<typeof wordTask>;
type Gen = () => WT | null;

const ZAHL4: Gen[] = [
  () => {
    const c = [['Stuttgart', 632], ['Mannheim', 315], ['Karlsruhe', 308], ['Freiburg', 236], ['Heidelberg', 162], ['Ulm', 128]] as const;
    const x = pick([...c]), y = pick(c.filter(z => z !== x));
    const a = x[1] * 1000 + R(1, 9) * 100, b = y[1] * 1000 + R(1, 9) * 100;
    return wordTask({
      prompt: `${x[0]} hat etwa ${gz(a)} Einwohner, ${y[0]} etwa ${gz(b)}. Wie viele Einwohner haben beide Städte zusammen? Wie viele fehlen dann noch bis zu einer Million?`,
      steps: [
        { title: 'Zusammen', ask: 'Wie viele Einwohner haben beide Städte zusammen?', calc: `${a} + ${b}`, wrong: [`${a} − ${b}`], why: 'Zusammen heißt plus.', unit: 'Einwohner' },
        { title: 'Bis zur Million', ask: 'Wie viele fehlen bis 1 000 000?', calc: `1000000 − ${a + b}`, wrong: [`${a + b} − 1000000`], why: 'Was fehlt: große Zahl minus kleine Zahl.', unit: 'Einwohner' },
      ].filter(s => s.title === 'Zusammen' || a + b < 1e6),
      unit: 'Einwohner', sentence: v => (a + b < 1e6 ? `Bis zur Million fehlen noch ${v}.` : `Zusammen haben sie ${v}.`),
    });
  },
  () => {
    const d = R(11, 19) * 500 + pick([0, 250]), k = R(4, 9), all = k * d;
    return wordTask({
      prompt: `Eine Druckerei druckt jeden Tag ${gz(d)} Schulbücher. Wie viele Bücher sind es nach ${k} Tagen? Wie viele fehlen dann noch bis ${gz(100000)} Bücher?`,
      steps: [
        { title: `Nach ${k} Tagen`, ask: `Wie viele Bücher druckt sie in ${k} Tagen?`, calc: `${k} · ${d}`, wrong: [`${k} + ${d}`], why: 'Jeden Tag gleich viele: Anzahl der Tage mal Bücher pro Tag.', unit: 'Bücher' },
        { title: 'Was noch fehlt', ask: `Wie viele fehlen bis ${gz(100000)}?`, calc: `100000 − ${all}`, wrong: [`100000 + ${all}`], why: 'Was fehlt: Ziel minus schon gedruckt.', unit: 'Bücher' },
      ],
      unit: 'Bücher', sentence: v => `Bis ${gz(100000)} fehlen noch ${v}.`,
    });
  },
  () => {
    const f = pick(FAM), s = R(12, 95) * 1000 + R(1, 9) * 100, y = R(9, 18) * 1000 + R(0, 9) * 100, j = R(2, 5);
    return wordTask({
      prompt: `Der Tacho vom Auto der Familie ${f} zeigt ${gz(s)} km. Die Familie fährt jedes Jahr etwa ${gz(y)} km. Wie viele Kilometer zeigt der Tacho nach ${j} Jahren?`,
      steps: [
        { title: `In ${j} Jahren`, ask: `Wie viele km fährt die Familie in ${j} Jahren?`, calc: `${j} · ${y}`, wrong: [`${j} + ${y}`], why: 'Jedes Jahr gleich viel: Jahre mal km pro Jahr.', unit: 'km' },
        { title: 'Neuer Tachostand', ask: 'Was zeigt der Tacho dann?', calc: `${s} + ${j * y}`, wrong: [`${s} − ${j * y}`], why: 'Die neuen Kilometer kommen zum alten Stand dazu.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `Der Tacho zeigt dann ${v}.`,
    });
  },
  () => {
    const r = R(3, 8), per = R(2, 9) * 1000 + R(1, 9) * 100, aus = R(1, 9) * 100 + R(1, 9) * 10, rest = r * per, b = rest + aus;
    return wordTask({
      prompt: `Eine Stadtbücherei hat ${gz(b)} Bücher. ${gz(aus)} alte Bücher werden aussortiert. Die übrigen Bücher werden gleichmäßig auf ${r} Etagen verteilt. Wie viele Bücher stehen auf jeder Etage?`,
      steps: [
        { title: 'Übrige Bücher', ask: 'Wie viele Bücher bleiben übrig?', calc: `${b} − ${aus}`, wrong: [`${b} + ${aus}`], why: 'Aussortieren heißt wegnehmen: minus.', unit: 'Bücher' },
        { title: 'Pro Etage', ask: 'Wie viele Bücher kommen auf eine Etage?', calc: `${rest} : ${r}`, wrong: [`${rest} · ${r}`], why: 'Gleichmäßig verteilen heißt teilen.', unit: 'Bücher' },
      ],
      unit: 'Bücher', sentence: v => `Auf jeder Etage stehen ${v}.`,
    });
  },
  () => {
    const x = R(4000, 9999), y = R(4000, 9999), z = R(120, 2500);
    return wordTask({
      prompt: `Beim Domino-Tag stellt die Klasse 5a ${gz(x)} Steine auf, die Klasse 5b ${gz(y)} Steine. Dann wird der erste Stein angestoßen. ${gz(z)} Steine bleiben stehen. Wie viele Steine sind umgefallen?`,
      steps: [
        { title: 'Alle Steine', ask: 'Wie viele Steine stehen am Anfang?', calc: `${x} + ${y}`, wrong: [`${x} − ${y}`], why: 'Beide Klassen zusammen: plus.', unit: 'Steine' },
        { title: 'Umgefallen', ask: 'Wie viele Steine sind umgefallen?', calc: `${x + y} − ${z}`, wrong: [`${x + y} + ${z}`], why: 'Die stehen gebliebenen Steine ziehst du ab.', unit: 'Steine' },
      ],
      unit: 'Steine', sentence: v => `Es sind ${v} umgefallen.`,
    });
  },
];
const ZAHL5: Gen[] = [
  () => {
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
  () => {
    const k = R(2, 4), c = R(8, 15) * 1000, p = pick([35, 40, 45, 49, 55, 60]), K = R(3, 9) * 100000, all = k * c, ein = all * p;
    return wordTask({
      prompt: `Eine Band spielt an ${k} Abenden in einer großen Halle. Jeden Abend werden ${gz(c)} Karten verkauft. Eine Karte kostet ${p} €. Für Bühne, Technik und Personal bezahlt die Band ${gz(K)} €. Wie viel Geld bleibt übrig?`,
      steps: [
        { title: 'Alle Karten', ask: `Wie viele Karten werden an ${k} Abenden verkauft?`, calc: `${k} · ${c}`, wrong: [`${k} + ${c}`], why: 'Jeden Abend gleich viele: mal die Anzahl der Abende.', unit: 'Karten' },
        { title: 'Einnahmen', ask: 'Wie viel Geld bringen alle Karten?', calc: `${all} · ${p}`, wrong: [`${all} + ${p}`, `${all} : ${p}`], why: 'Anzahl der Karten mal Preis.', unit: '€' },
        { title: 'Übrig', ask: 'Wie viel bleibt nach den Kosten übrig?', calc: `${ein} − ${K}`, wrong: [`${ein} + ${K}`], why: 'Die Kosten werden abgezogen.', unit: '€' },
      ],
      unit: '€', sentence: v => `Es bleiben ${v} übrig.`,
    });
  },
  () => {
    const K = kid(), n = R(2, 5), part = R(5, 40) * 10000, rest = n * part, b = R(1, 9) * 100000, G = rest + b, sp = R(1, 9) * 1000;
    return wordTask({
      prompt: `${K.gen} Opa gewinnt im Lotto ${gz(G)} €. Er behält ${gz(b)} € selbst. Den Rest teilt er gerecht unter seinen ${n} Enkelkindern auf. Eins davon ist ${K.n}. ${K.P} spendet ${gz(sp)} € an ein Tierheim. Wie viel Geld bleibt ${K.n}?`,
      steps: [
        { title: 'Für die Enkel', ask: 'Wie viel Geld bekommen die Enkelkinder zusammen?', calc: `${G} − ${b}`, wrong: [`${G} + ${b}`], why: 'Was Opa behält, ziehst du ab.', unit: '€' },
        { title: 'Pro Enkelkind', ask: 'Wie viel bekommt jedes Enkelkind?', calc: `${rest} : ${n}`, wrong: [`${rest} · ${n}`], why: 'Gerecht aufteilen heißt teilen.', unit: '€' },
        { title: 'Nach der Spende', ask: `Wie viel bleibt ${K.n} nach der Spende?`, calc: `${part} − ${sp}`, wrong: [`${part} + ${sp}`], why: 'Die Spende geht weg: minus.', unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} bleiben ${v}.`,
    });
  },
  () => {
    const w = R(80, 120) * 1000 + R(1, 9) * 100, sa = R(50, 79) * 1000 + R(1, 9) * 100, so = R(30, 49) * 1000 + R(1, 9) * 100;
    return wordTask({
      prompt: `An einer Autobahn bei Stuttgart werden die Autos gezählt. An jedem Werktag von Montag bis Freitag fahren etwa ${gz(w)} Autos vorbei. Am Samstag sind es ${gz(sa)}, am Sonntag ${gz(so)}. Wie viele Autos sind es in der ganzen Woche?`,
      steps: [
        { title: 'Montag bis Freitag', ask: 'Wie viele Autos fahren an den 5 Werktagen vorbei?', calc: `5 · ${w}`, wrong: [`5 + ${w}`], why: 'Fünf Tage mit gleich vielen Autos: mal 5.', unit: 'Autos' },
        { title: 'Wochenende', ask: 'Wie viele Autos sind es am Wochenende?', calc: `${sa} + ${so}`, wrong: [`${sa} − ${so}`], why: 'Samstag und Sonntag zusammen: plus.', unit: 'Autos' },
        { title: 'Ganze Woche', ask: 'Wie viele Autos sind es in der ganzen Woche?', calc: `${5 * w} + ${sa + so}`, unit: 'Autos' },
      ],
      unit: 'Autos', sentence: v => `In der ganzen Woche fahren etwa ${v} vorbei.`,
    });
  },
  () => {
    const r = pick([100000, 125000, 150000, 200000, 250000]), H = R(8, 24), X = r * H, h0 = R(3, H - 3);
    if (X < 1500000 || X > 3500000) return null;
    return wordTask({
      prompt: `Das große Becken im Freibad fasst ${gz(X)} Liter Wasser. Im Mai wird es neu gefüllt. Eine Pumpe schafft ${gz(r)} Liter in einer Stunde. Sie läuft schon ${h0} Stunden. Wie viele Stunden muss sie noch laufen, bis das Becken voll ist?`,
      steps: [
        { title: 'Schon drin', ask: `Wie viele Liter sind nach ${h0} Stunden im Becken?`, calc: `${h0} · ${r}`, wrong: [`${h0} + ${r}`], why: 'Jede Stunde gleich viel: Stunden mal Liter pro Stunde.', unit: 'Liter' },
        { title: 'Fehlt noch', ask: 'Wie viele Liter fehlen noch?', calc: `${X} − ${h0 * r}`, wrong: [`${X} + ${h0 * r}`], why: 'Was fehlt: alles minus schon drin.', unit: 'Liter' },
        { title: 'Noch so lange', ask: 'Wie viele Stunden braucht die Pumpe dafür?', calc: `${X - h0 * r} : ${r}`, wrong: [`${X - h0 * r} · ${r}`], why: 'Wie oft passen die Liter einer Stunde hinein? Teilen.', unit: 'Stunden' },
      ],
      unit: 'Stunden', sentence: v => `Die Pumpe muss noch ${v} laufen.`,
    });
  },
];

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
  text: level => genFrom(() => pick(level === 4 ? ZAHL4 : ZAHL5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.isInt())),
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
/** Ein Rundungsschritt für Textaufgaben. */
const rStep = (title: string, n: number, p: number, unit = '') => { const r = rnd(n, p), u = unit ? ` ${unit}` : ''; return { title, ask: `Runde ${gz(n)}${u} auf ${PNAME[p]}.`, calc: String(r), explain: `${gz(n)}${u} ≈ ${gz(r)}${u}`, unit: unit || undefined }; };
const euro = (c: number) => (c / 100).toFixed(2).replace('.', ',');
const RUND4: Gen[] = [
  () => {
    const K = kid(), pr = [R(1, 9) * 100 + pick([95, 99, 49, 10, 89]), R(1, 9) * 100 + pick([95, 99, 20, 79]), R(1, 9) * 100 + pick([5, 15, 90])];
    const r = pr.map(c => Math.round(c / 100));
    return wordTask({
      prompt: `${K.n} kauft ein Heft für ${euro(pr[0])} €, einen Stift für ${euro(pr[1])} € und Kleber für ${euro(pr[2])} €. Überschlage: Wie viel muss ${K.p} ungefähr bezahlen? Runde dazu auf ganze Euro.`,
      steps: [
        ...pr.map((c, i) => ({ title: `${['Heft', 'Stift', 'Kleber'][i]} runden`, ask: `Runde ${euro(c)} € auf ganze Euro.`, calc: String(r[i]), explain: `${euro(c)} € ≈ ${r[i]} €`, unit: '€' })),
        { title: 'Überschlag', ask: 'Wie viel ist das ungefähr zusammen?', calc: `${r[0]} + ${r[1]} + ${r[2]}`, unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} muss ungefähr ${v} bezahlen.`,
    });
  },
  () => {
    const K = kid(), a = R(210, 980), b = R(1110, 2890);
    return wordTask({
      prompt: `${K.n} fährt mit dem Rad ${a} m bis zum Bäcker und dann noch ${gz(b)} m bis zur Schule. Überschlage die ganze Strecke. Runde dazu beide Zahlen auf Hunderter.`,
      steps: [
        rStep('Erstes Stück runden', a, 2, 'm'),
        rStep('Zweites Stück runden', b, 2, 'm'),
        { title: 'Überschlag', ask: 'Wie lang ist die Strecke ungefähr?', calc: `${rnd(a, 2)} + ${rnd(b, 2)}`, wrong: [`${rnd(b, 2)} − ${rnd(a, 2)}`], why: 'Die ganze Strecke: beide Stücke zusammen.', unit: 'm' },
      ],
      unit: 'm', sentence: v => `Die Strecke ist ungefähr ${v} lang.`,
    });
  },
  () => {
    const c = pick([['Stuttgart', 632], ['Mannheim', 315], ['Karlsruhe', 308], ['Freiburg', 236], ['Heidelberg', 162], ['Ulm', 128], ['Heilbronn', 127], ['Pforzheim', 126], ['Reutlingen', 117]] as const);
    const n = (c[1] + R(-3, 3)) * 1000 + R(1, 999);
    if (rnd(rnd(n, 3), 4) !== rnd(n, 4)) return null;
    return wordTask({
      prompt: `${c[0]} hat ${gz(n)} Einwohner. In der Zeitung soll eine runde Zahl stehen. Runde die Einwohnerzahl erst auf Tausender. Runde dann die Einwohnerzahl auf Zehntausender.`,
      steps: [rStep('Auf Tausender', n, 3), rStep('Auf Zehntausender', n, 4)],
      unit: 'Einwohner', sentence: v => `Auf Tausender gerundet sind es ${gz(rnd(n, 3))}, auf Zehntausender ${v} Einwohner.`,
    });
  },
  () => {
    const need = R(21, 69) * 100 + R(1, 99), r = rnd(need, 3);
    return wordTask({
      prompt: `Die Schule braucht im Monat ${gz(need)} Blatt Kopierpapier. In einer Packung sind 500 Blatt. Überschlage, wie viele Packungen die Schule ungefähr braucht. Runde dazu die Zahl der Blätter auf Tausender.`,
      steps: [
        rStep('Blätter runden', need, 3),
        { title: 'Packungen', ask: 'Wie viele Packungen sind das ungefähr?', calc: `${r} : 500`, wrong: [`${r} · 500`, `${r} − 500`], why: 'Wie oft passen 500 Blatt in die Menge? Teilen.', unit: 'Packungen' },
      ],
      unit: 'Packungen', sentence: v => `Die Schule braucht ungefähr ${v}.`,
    });
  },
  () => {
    const B = [['die Zugspitze', 2962], ['der Watzmann', 2713], ['der Feldberg', 1493], ['der Große Arber', 1456], ['der Belchen', 1414], ['die Hornisgrinde', 1164], ['der Brocken', 1141], ['die Wasserkuppe', 950]] as const;
    const x = pick([...B]), y = pick(B.filter(z => z[1] < x[1] - 200));
    if (!y) return null;
    const up = (s: string) => s[0].toUpperCase() + s.slice(1);
    return wordTask({
      prompt: `${up(x[0])} ist ${gz(x[1])} m hoch, ${y[0]} ${gz(y[1])} m. Überschlage: Um wie viele Meter ist ${x[0]} ungefähr höher? Runde dazu beide Höhen auf Hunderter.`,
      steps: [
        rStep('Erste Höhe runden', x[1], 2, 'm'),
        rStep('Zweite Höhe runden', y[1], 2, 'm'),
        { title: 'Unterschied', ask: 'Wie groß ist der Unterschied ungefähr?', calc: `${rnd(x[1], 2)} − ${rnd(y[1], 2)}`, wrong: [`${rnd(x[1], 2)} + ${rnd(y[1], 2)}`], why: 'Um wie viel höher: große Zahl minus kleine Zahl.', unit: 'm' },
      ],
      unit: 'm', sentence: v => `${up(x[0])} ist ungefähr ${v} höher.`,
    });
  },
  () => {
    const K = kid(), c = R(2, 9) * 100 + pick([85, 90, 95, 10, 20, 15, 30, 70]), w = R(8, 20), r = Math.round(c / 100);
    return wordTask({
      prompt: `${K.n} spart jede Woche ${euro(c)} €. Überschlage: Wie viel Geld hat ${K.p} ungefähr nach ${w} Wochen? Runde den Betrag dazu auf ganze Euro.`,
      steps: [
        { title: 'Betrag runden', ask: `Runde ${euro(c)} € auf ganze Euro.`, calc: String(r), explain: `${euro(c)} € ≈ ${r} €`, unit: '€' },
        { title: 'Überschlag', ask: `Wie viel ist das ungefähr nach ${w} Wochen?`, calc: `${r} · ${w}`, wrong: [`${r} + ${w}`], why: 'Jede Woche gleich viel: Betrag mal Anzahl der Wochen.', unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} hat ungefähr ${v}. Genau sind es ${euro(c * w)} €.`,
    });
  },
];
const RUND5: Gen[] = [
  () => {
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
  () => {
    const P = R(21, 49) * 100 + R(1, 99), k = R(2, 5), c = R(21, 59), rP = rnd(P, 3), rc = rnd(c, 1);
    if (c % 10 === 0) return null;
    return wordTask({
      prompt: `Eine Halle hat ${gz(P)} Plätze. Bei ${k} Konzerten ist sie ausverkauft. Eine Karte kostet ${c} €. Überschlage die Einnahmen. Runde die Plätze auf Tausender und den Preis auf Zehner.`,
      steps: [
        rStep('Plätze runden', P, 3),
        rStep('Preis runden', c, 1, '€'),
        { title: 'Alle Karten', ask: `Wie viele Karten sind es ungefähr bei ${k} Konzerten?`, calc: `${k} · ${rP}`, wrong: [`${k} + ${rP}`], why: 'Jedes Konzert gleich viele Plätze: mal die Anzahl der Konzerte.' },
        { title: 'Einnahmen', ask: 'Wie viel Geld ist das ungefähr?', calc: `${k * rP} · ${rc}`, wrong: [`${k * rP} + ${rc}`], why: 'Anzahl der Karten mal Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `Die Einnahmen sind ungefähr ${v}.`,
    });
  },
  () => {
    const K = kid(), a = R(110, 980), b = R(110, 980), c = R(110, 980), err = pick([-1, 1]) * pick([300, 400, 500]), res = a + b + c + err;
    if ([a, b, c].some(x => x % 100 === 0)) return null;
    if (res < 200) return null;
    return wordTask({
      prompt: `${K.n} hat ${M(`${a} + ${b} + ${c}`)} gerechnet und ${gz(res)} herausbekommen. Überschlage, ob das stimmen kann. Runde dazu alle Zahlen auf Hunderter.`,
      steps: [
        rStep('Erste Zahl runden', a, 2), rStep('Zweite Zahl runden', b, 2), rStep('Dritte Zahl runden', c, 2),
        { title: 'Überschlag', ask: 'Wie groß ist das Ergebnis ungefähr?', calc: `${rnd(a, 2)} + ${rnd(b, 2)} + ${rnd(c, 2)}` },
      ],
      sentence: v => `Der Überschlag ist ${v}. ${K.gen} Ergebnis ${gz(res)} liegt weit daneben. ${K.P} hat sich verrechnet. Richtig ist ${gz(a + b + c)}.`,
    });
  },
  () => {
    const n = R(21, 49), b = R(41, 79), a = R(210, 690), rn = rnd(n, 1), rb = rnd(b, 1), ra = rnd(a, 2);
    return wordTask({
      prompt: `Die Schulbücherei hat ${n} Regale. In jedem Regal stehen ${b} Bücher. Gerade sind ${a} Bücher ausgeliehen. Überschlage, wie viele Bücher noch in den Regalen stehen. Runde Regale und Bücher pro Regal auf Zehner, die ausgeliehenen Bücher auf Hunderter.`,
      steps: [
        rStep('Regale runden', n, 1), rStep('Bücher pro Regal runden', b, 1),
        { title: 'Alle Bücher', ask: 'Wie viele Bücher hat die Bücherei ungefähr?', calc: `${rn} · ${rb}`, wrong: [`${rn} + ${rb}`], why: 'Jedes Regal gleich viele: Regale mal Bücher pro Regal.', unit: 'Bücher' },
        rStep('Ausgeliehene runden', a, 2),
        { title: 'Noch da', ask: 'Wie viele Bücher stehen ungefähr noch in den Regalen?', calc: `${rn * rb} − ${ra}`, wrong: [`${rn * rb} + ${ra}`], why: 'Die ausgeliehenen Bücher fehlen: minus.', unit: 'Bücher' },
      ],
      unit: 'Bücher', sentence: v => `Es stehen ungefähr ${v} in den Regalen.`,
    });
  },
  () => {
    const f = pick(FAM), d = [R(121, 259), R(121, 259), R(121, 259)], r = d.map(x => Math.round(x / 10)), T = pick([60, 70, 80, 90]), s = r[0] + r[1] + r[2];
    if (T - s < 5 || d.some(x => x % 10 === 0)) return null;
    const k = (x: number) => dec1(x / 10);
    return wordTask({
      prompt: `Familie ${f} wandert drei Tage lang. Am ersten Tag schafft sie ${k(d[0])} km, am zweiten ${k(d[1])} km und am dritten ${k(d[2])} km. Insgesamt möchte sie ${T} km wandern. Überschlage: Wie viele km fehlen noch ungefähr? Runde dazu auf ganze km.`,
      steps: [
        ...d.map((x, i) => ({ title: `Tag ${i + 1} runden`, ask: `Runde ${k(x)} km auf ganze km.`, calc: String(r[i]), explain: `${k(x)} km ≈ ${r[i]} km`, unit: 'km' })),
        { title: 'Schon gewandert', ask: 'Wie viele km sind das ungefähr zusammen?', calc: `${r[0]} + ${r[1]} + ${r[2]}`, unit: 'km' },
        { title: 'Fehlt noch', ask: `Wie viele km fehlen ungefähr bis ${T} km?`, calc: `${T} − ${s}`, wrong: [`${T} + ${s}`], why: 'Was fehlt: Ziel minus schon geschafft.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `Es fehlen noch ungefähr ${v}.`,
    });
  },
];

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
  text: level => genFrom(() => pick(level === 4 ? RUND4 : RUND5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.isInt())),
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
const CUBES = [['Zuckerwürfeln', 'Zuckerwürfel'], ['Holzwürfeln', 'Holzwürfel'], ['Spielwürfeln', 'Spielwürfel'], ['Magnetwürfeln', 'Magnetwürfel']] as const;
const POT4: Gen[] = [
  () => {
    const K = kid(), n = R(3, 8), [dat, nom] = pick([...CUBES]);
    return wordTask({
      prompt: `${K.n} baut aus kleinen ${dat} einen großen Würfel. Er ist ${n} ${nom} lang, ${n} breit und ${n} hoch. Wie viele ${nom} braucht ${K.p}? (Das ist ${sup(n, 3)}.)`,
      steps: [
        { title: 'Eine Schicht', ask: `Wie viele ${nom} liegen in der untersten Schicht?`, calc: `${n} · ${n}`, wrong: [`${n} + ${n}`], why: 'Eine Schicht ist ein Quadrat: Länge mal Breite.' },
        { title: 'Alle Schichten', ask: `Es gibt ${n} Schichten übereinander. Wie viele ${nom} sind es insgesamt?`, calc: `${n * n} · ${n}`, wrong: [`${n * n} + ${n}`], why: 'Jede Schicht gleich viele: mal die Anzahl der Schichten.' },
      ],
      sentence: v => `${K.n} braucht ${v} ${nom}.`,
    });
  },
  () => {
    const f = pick(FAM), n = R(4, 12), p = R(2, 9);
    return wordTask({
      prompt: `Herr ${f} pflastert einen quadratischen Platz. Er legt ${n} Reihen mit je ${n} Platten. Eine Platte kostet ${p} €. Wie viel kosten alle Platten? (Die Zahl der Platten ist ${sup(n, 2)}.)`,
      steps: [
        { title: 'Platten', ask: 'Wie viele Platten braucht er?', calc: `${n} · ${n}`, wrong: [`${n} + ${n}`, n === 4 ? `2 · ${n}` : `4 · ${n}`], why: `${sup(n, 2)} heißt ${n} · ${n}: Reihen mal Platten pro Reihe.`, unit: 'Platten' },
        { title: 'Kosten', ask: 'Wie viel kosten alle Platten?', calc: `${n * n} · ${p}`, wrong: [`${n * n} + ${p}`], why: 'Anzahl mal Preis pro Platte.', unit: '€' },
      ],
      unit: '€', sentence: v => `Alle Platten kosten ${v}.`,
    });
  },
  () => {
    const n = R(6, 15), m = R(Math.ceil(n * n / 2), n * n - 3);
    return wordTask({
      prompt: `Für das Schulkonzert stellt der Hausmeister die Stühle in ${n} Reihen mit je ${n} Stühlen auf. Es kommen ${m} Gäste. Wie viele Stühle bleiben frei?`,
      steps: [
        { title: 'Alle Stühle', ask: 'Wie viele Stühle stehen da?', calc: `${n} · ${n}`, wrong: [`${n} + ${n}`, `2 · ${n}`], why: `Reihen mal Stühle pro Reihe: ${sup(n, 2)}.`, unit: 'Stühle' },
        { title: 'Frei', ask: 'Wie viele Stühle bleiben frei?', calc: `${n * n} − ${m}`, wrong: [`${n * n} + ${m}`], why: 'Die besetzten Stühle ziehst du ab.', unit: 'Stühle' },
      ],
      unit: 'Stühle', sentence: v => `Es bleiben ${v} frei.`,
    });
  },
  () => {
    const K = kid(), b = R(2, 6);
    return wordTask({
      prompt: `${K.n} schickt eine Nachricht an ${b} Freunde. Am nächsten Tag schickt jeder von ihnen die Nachricht an ${b} neue Kinder weiter. Am Tag danach machen die neuen Kinder das genauso. Wie viele Kinder bekommen die Nachricht am dritten Tag?`,
      steps: [
        { title: 'Zweiter Tag', ask: 'Wie viele Kinder bekommen die Nachricht am zweiten Tag?', calc: `${b} · ${b}`, wrong: [`${b} + ${b}`], why: `Jeder der ${b} Freunde schickt sie an ${b} Kinder: mal.`, unit: 'Kinder' },
        { title: 'Dritter Tag', ask: 'Wie viele Kinder bekommen sie am dritten Tag?', calc: `${b * b} · ${b}`, wrong: [`${b * b} + ${b}`], why: `Jedes Kind vom zweiten Tag schickt sie an ${b} neue Kinder.`, unit: 'Kinder' },
      ],
      unit: 'Kinder', sentence: v => `Am dritten Tag bekommen ${v} die Nachricht. Das ist ${sup(b, 3)}.`,
    });
  },
  () => {
    const K = kid(), n = R(5, 12), k = R(12, 40);
    return wordTask({
      prompt: `In ${K.gen} Rätselheft gibt es ${k} Gitterrätsel. Jedes Gitter ist ein Quadrat mit ${n} Reihen und ${n} Kästchen in jeder Reihe. Wie viele Kästchen sind es im ganzen Heft?`,
      steps: [
        { title: 'Ein Gitter', ask: 'Wie viele Kästchen hat ein Gitter?', calc: `${n} · ${n}`, wrong: [`${n} + ${n}`, `4 · ${n}`], why: `Ein Quadrat: ${n} · ${n} = ${sup(n, 2)}.`, unit: 'Kästchen' },
        { title: 'Ganzes Heft', ask: `Wie viele Kästchen haben alle ${k} Gitter?`, calc: `${n * n} · ${k}`, wrong: [`${n * n} + ${k}`], why: 'Jedes Gitter gleich viele: mal die Anzahl der Rätsel.', unit: 'Kästchen' },
      ],
      unit: 'Kästchen', sentence: v => `Im ganzen Heft sind es ${v}.`,
    });
  },
];
const POT5: Gen[] = [
  () => {
    const f = pick([2, 2, 3]), s = R(2, 15), h = f === 2 ? R(3, 5) : R(3, 4), w = f === 2 ? 'verdoppelt' : 'verdreifacht';
    const steps = Array.from({ length: h }, (_, i) => ({ title: `Nach ${i + 1} ${i ? 'Stunden' : 'Stunde'}`, ask: `Wie viele Bakterien sind es nach ${i + 1} ${i ? 'Stunden' : 'Stunde'}?`, calc: `${s * f ** i} · ${f}`, wrong: i === 0 ? [`${s * f ** i} + ${f}`] : undefined, why: `${f === 2 ? 'Verdoppeln' : 'Verdreifachen'} heißt mal ${f}.` }));
    return wordTask({
      prompt: `In einer Petrischale sind ${s} Bakterien. Jede Stunde ${w} sich ihre Anzahl. Wie viele Bakterien sind es nach ${h} Stunden?`,
      steps, term: `${s} · ${Array(h).fill(f).join(' · ')}`,
      sentence: v => `Nach ${h} Stunden sind es ${v} Bakterien. Kurz: ${s} · ${sup(f, h)}.`,
    });
  },
  () => {
    const K = kid(), s = R(1, 5), k = R(4, 6), g = Array.from({ length: k }, (_, i) => s * 2 ** i);
    return wordTask({
      prompt: `${K.n} legt auf das erste Feld eines Schachbretts ${s} ${s === 1 ? 'Reiskorn' : 'Reiskörner'}. Auf jedes weitere Feld legt ${K.p} doppelt so viele wie auf das Feld davor. Wie viele Reiskörner liegen auf den ersten ${k} Feldern zusammen?`,
      steps: [
        ...g.slice(1).map((x, i) => ({ title: `Feld ${i + 2}`, ask: `Wie viele Körner liegen auf Feld ${i + 2}?`, calc: `${g[i]} · 2`, wrong: i === 0 ? [`${g[i]} + 2`] : undefined, why: 'Doppelt so viele heißt mal 2.', unit: 'Körner' })),
        { title: 'Zusammen', ask: `Wie viele Körner liegen auf allen ${k} Feldern?`, calc: g.join(' + '), unit: 'Körner' },
      ],
      unit: 'Körner', sentence: v => `Auf den ersten ${k} Feldern liegen ${v}. Auf Feld ${k} allein sind es ${s} · ${sup(2, k - 1)} = ${g[k - 1]}.`,
    });
  },
  () => {
    const f = pick(FAM), a = R(8, 20), b = R(2, a - 4), p = R(3, 8);
    return wordTask({
      prompt: `Familie ${f} hat einen quadratischen Garten mit ${a} m Seitenlänge. In der Mitte liegt ein quadratisches Gemüsebeet mit ${b} m Seitenlänge. Der Rest bekommt Rollrasen. 1 m² Rollrasen kostet ${p} €. Wie viel kostet der Rasen?`,
      steps: [
        { title: 'Garten', ask: 'Wie groß ist der ganze Garten?', calc: `${a} · ${a}`, wrong: [`4 · ${a}`, `${a} + ${a}`], why: `Fläche vom Quadrat: Seite mal Seite, also ${sup(a, 2)}.`, unit: 'm²' },
        { title: 'Beet', ask: 'Wie groß ist das Beet?', calc: `${b} · ${b}`, wrong: [b === 4 ? `${b} + ${b}` : `4 · ${b}`], why: `Auch ein Quadrat: ${sup(b, 2)}.`, unit: 'm²' },
        { title: 'Rasenfläche', ask: 'Wie groß ist die Fläche für den Rasen?', calc: `${a * a} − ${b * b}`, wrong: [`${a * a} + ${b * b}`], why: 'Das Beet bekommt keinen Rasen: abziehen.', unit: 'm²' },
        { title: 'Kosten', ask: 'Wie viel kostet der Rasen?', calc: `${a * a - b * b} · ${p}`, wrong: [`${a * a - b * b} + ${p}`], why: 'Fläche mal Preis pro m².', unit: '€' },
      ],
      unit: '€', sentence: v => `Der Rasen kostet ${v}.`,
    });
  },
  () => {
    const b = R(3, 10), k = R(2, 9);
    return wordTask({
      prompt: `In einer Murmelfabrik kommen ${b} Murmeln in einen Beutel. ${b} Beutel kommen in eine Schachtel und ${b} Schachteln in einen Karton. Wie viele Murmeln sind in ${k} Kartons?`,
      steps: [
        { title: 'Eine Schachtel', ask: 'Wie viele Murmeln sind in einer Schachtel?', calc: `${b} · ${b}`, wrong: [`${b} + ${b}`], why: `${b} Beutel mit je ${b} Murmeln.`, unit: 'Murmeln' },
        { title: 'Ein Karton', ask: 'Wie viele Murmeln sind in einem Karton?', calc: `${b * b} · ${b}`, wrong: [`${b * b} + ${b}`], why: `${b} Schachteln mit je ${b * b} Murmeln. Das ist ${sup(b, 3)}.`, unit: 'Murmeln' },
        { title: `${k} Kartons`, ask: `Wie viele Murmeln sind in ${k} Kartons?`, calc: `${b ** 3} · ${k}`, wrong: [`${b ** 3} + ${k}`], why: 'Jeder Karton gleich viele: mal die Anzahl der Kartons.', unit: 'Murmeln' },
      ],
      unit: 'Murmeln', sentence: v => `In ${k} Kartons sind ${v}. Kurz: ${k} · ${sup(b, 3)}.`,
    });
  },
  () => {
    const K = kid(), n = R(3, 8), m = n - 2;
    return wordTask({
      prompt: `${K.n} klebt aus kleinen Holzwürfeln einen großen Würfel: ${n} Würfel lang, ${n} breit und ${n} hoch. Dann malt ${K.p} den großen Würfel von allen Seiten rot an, auch unten. Wie viele kleine Würfel haben Farbe abbekommen?`,
      steps: [
        { title: 'Alle Würfel', ask: 'Wie viele kleine Würfel sind es insgesamt?', calc: `${n} · ${n} · ${n}`, wrong: [`${n} · ${n}`, `${n} + ${n} + ${n}`], why: `Länge mal Breite mal Höhe: ${sup(n, 3)}.`, unit: 'Würfel' },
        { title: 'Innen: Kantenlänge', ask: 'Innen steckt ein kleinerer Würfel ohne Farbe. Wie viele Würfel ist er lang? Auf jeder Seite fällt eine Schicht weg.', calc: `${n} − 2`, wrong: [`${n} − 1`], why: 'Links und rechts fällt je eine Schicht weg, also 2.', unit: 'Würfel' },
        { title: 'Innen ohne Farbe', ask: 'Wie viele Würfel hat der innere Würfel?', calc: `${m} · ${m} · ${m}`, wrong: [`3 · ${m}`], why: `Wieder ein Würfel: ${sup(m, 3)}.`, unit: 'Würfel' },
        { title: 'Mit Farbe', ask: 'Wie viele kleine Würfel haben Farbe?', calc: `${n ** 3} − ${m ** 3}`, wrong: [`${n ** 3} + ${m ** 3}`], why: 'Alle minus die inneren ohne Farbe.', unit: 'Würfel' },
      ],
      unit: 'Würfel', sentence: v => `${v} haben Farbe abbekommen.`,
    });
  },
];
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
        const r = Math.random();
        if (r < 0.25) {
          const b = R(2, 12), e = R(2, 6);
          return task(`Schreibe als Potenz: ${M(expand(b, e))} = ${M(sup(b, '?' as unknown as number))}. Welche Zahl gehört oben hin?`, q(e),
            [{ rule: 'Faktoren zählen', lines: [`Die ${b} kommt ${e}-mal vor.`, `${expand(b, e)} = ${sup(b, e)}`] }],
            [{ title: 'Zählen', ask: `<p>Wie oft kommt die ${b} vor?</p>`, answer: q(e), hint: 'Zähle die Zahlen, nicht die Malpunkte.', explain: `${expand(b, e)} = ${sup(b, e)}` }], { placeholder: 'Exponent' });
        }
        if (r < 0.4) {
          const b = R(2, 12), e = R(2, 6), basis = Math.random() < 0.5, v = basis ? b : e;
          return task(`Wie heißt bei ${M(sup(b, e))} ${basis ? 'die <b>Basis</b>' : 'der <b>Exponent</b>'}?`, q(v),
            [{ rule: basis ? 'Basis' : 'Exponent', lines: [basis ? `Die Basis ist die untere, große Zahl. Sie wird malgenommen: ${b}.` : `Der Exponent ist die kleine Zahl oben. Er sagt, wie oft: ${e}.`, `${sup(b, e)} = ${expand(b, e)}`] }],
            [{ title: basis ? 'Basis' : 'Exponent', ask: `<p>${basis ? 'Die Basis ist die Zahl, die malgenommen wird. Sie steht unten.' : 'Der Exponent sagt, wie oft malgenommen wird. Er steht klein oben.'} Welche Zahl ist es bei ${sup(b, e)}?</p>`, answer: q(v), hint: basis ? 'Die große Zahl unten.' : 'Die kleine Zahl oben rechts.', explain: `${sup(b, e)} = ${expand(b, e)}` }],
            { placeholder: basis ? 'Basis' : 'Exponent', diag: x => (x.eq(q(basis ? e : b)) ? (basis ? 'Das ist der Exponent. Die Basis steht unten.' : 'Das ist die Basis. Der Exponent steht klein oben.') : null) });
        }
        if (r < 0.55) {
          const b = R(2, 12), sq = b * b;
          return task(`Welche Zahl ergibt mal sich selbst genommen ${M(String(sq))}? Also: ${M(`${sup('?' as unknown as number, 2)} = ${sq}`)}`, q(b),
            [{ rule: 'Quadratzahl', lines: [`${b} · ${b} = ${sq}, also ${sup(b, 2)} = ${sq}.`] }],
            [{ title: 'Probieren', ask: `<p>Welche Zahl mal sich selbst ergibt ${sq}? Probiere das kleine Einmaleins durch.</p>`, answer: q(b), hint: `Denk an die Quadratzahlen: 4, 9, 16, 25, 36, …`, explain: `${b} · ${b} = ${sq}` }],
            { placeholder: 'Zahl', diag: x => (x.eq(q(sq / 2)) ? `Das ist die Hälfte. Gesucht ist eine Zahl, die <b>mal sich selbst</b> ${sq} ergibt.` : null) });
        }
        if (r < 0.65) {
          const k = R(2, 6), n = 10 ** k;
          return task(`Schreibe ${M(gz(n))} als Zehnerpotenz: ${M(`${gz(n)} = ${sup(10, '?' as unknown as number)}`)}`, q(k),
            [{ rule: 'Nullen zählen', lines: [`${gz(n)} hat ${k} Nullen.`, `${gz(n)} = ${expand(10, k)} = ${sup(10, k)}`] }],
            [{ title: 'Nullen zählen', ask: `<p>Wie viele Nullen hat ${gz(n)}?</p>`, answer: q(k), hint: 'Bei Zehnerpotenzen sagt der Exponent, wie viele Nullen die Zahl hat.', explain: `${gz(n)} = ${sup(10, k)}` }],
            { placeholder: 'Exponent' });
        }
        const [b, e] = pick<[number, number]>([[R(2, 10), 2], [R(2, 10), 2], [R(2, 5), 3], [2, R(4, 5)], [3, 4], [10, R(2, 3)]]);
        return { ...potTask(b, e), diag: potDiag(b, e) };
      }
      if (level === 2) {
        const r = Math.random();
        if (r < 0.25) {
          const [b, e] = pick<[number, number]>([[2, R(3, 8)], [3, R(2, 5)], [4, R(2, 4)], [5, R(2, 4)], [10, R(2, 8)]]), n = b ** e;
          return task(`Schreibe ${M(gz(n))} als Potenz mit der Basis ${b}: ${M(`${gz(n)} = ${sup(b, '?' as unknown as number)}`)}`, q(e),
            [{ rule: 'Malnehmen, bis es passt', lines: [Array.from({ length: e }, (_, i) => gz(b ** (i + 1))).join(', '), `${expand(b, e)} = ${gz(n)}, also ${sup(b, e)}.`] }],
            [{ title: 'Wie oft?', ask: `<p>Nimm die ${b} immer wieder mal ${b}: ${b}, ${b * b}, ${b ** 3}, … Wie oft brauchst du die ${b}, bis du bei ${gz(n)} bist?</p>`, answer: q(e), hint: `Zähle mit: ${b} ist ${sup(b, 1)}, ${b * b} ist ${sup(b, 2)}.`, explain: `${expand(b, e)} = ${gz(n)}` }],
            { placeholder: 'Exponent' });
        }
        if (r < 0.45) {
          const a = R(2, 9), k = R(3, 8), n = a * 10 ** k;
          return task(`Schreibe ${M(gz(n))} mit einer Zehnerpotenz: ${M(`${gz(n)} = ${a} · ${sup(10, '?' as unknown as number)}`)}`, q(k),
            [{ rule: 'Nullen zählen', lines: [`${gz(n)} hat hinter der ${a} genau ${k} Nullen.`, `${gz(n)} = ${a} · ${gz(10 ** k)} = ${a} · ${sup(10, k)}`] }],
            [{ title: 'Nullen zählen', ask: `<p>Wie viele Nullen stehen hinter der ${a}?</p>`, answer: q(k), hint: 'Zähle die Nullen in den Dreiergruppen.', explain: `${gz(10 ** k)} = ${sup(10, k)}` }],
            { placeholder: 'Exponent' });
        }
        const [b, e] = pick<[number, number]>([[10, R(3, 9)], [R(11, 25), 2], [R(11, 25), 2], [R(2, 10), 3], [2, R(4, 8)], [3, R(3, 5)], [4, R(3, 4)], [5, R(3, 4)]]);
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
  text: level => genFrom(() => pick(level === 4 ? POT4 : POT5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.isInt())),
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
const PROP4: Gen[] = [
  () => {
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
  },
  () => {
    const one = R(8, 30), a = R(2, 6), b = R(5, 20);
    if (a === b) return null;
    return wordTask({
      prompt: `Der Drucker im Schulbüro druckt in ${a} Minuten ${one * a} Seiten. Wie viele Seiten druckt er in ${b} Minuten?`,
      steps: [
        { title: 'In 1 Minute', ask: 'Wie viele Seiten druckt er in 1 Minute?', calc: `${one * a} : ${a}`, wrong: [`${one * a} · ${a}`], why: 'Je länger, desto mehr Seiten: proportional. Auf 1 Minute teilen.', unit: 'Seiten' },
        { title: `In ${b} Minuten`, ask: `Wie viele Seiten sind es in ${b} Minuten?`, calc: `${one} · ${b}`, wrong: [`${one} : ${b}`], why: 'Dann mal die neue Zeit.', unit: 'Seiten' },
      ],
      unit: 'Seiten', sentence: v => `In ${b} Minuten druckt er ${v}.`,
    });
  },
  () => {
    const K = kid(), one = R(6, 12), a = R(2, 5), b = R(8, 15);
    if (one * b > 180) return null;
    return wordTask({
      prompt: `Aus dem Wasserhahn laufen in ${a} Minuten ${one * a} Liter Wasser. ${K.n} lässt die Badewanne ${b} Minuten lang volllaufen. Wie viele Liter Wasser sind dann in der Wanne?`,
      steps: [
        { title: 'In 1 Minute', ask: 'Wie viele Liter laufen in 1 Minute?', calc: `${one * a} : ${a}`, wrong: [`${one * a} · ${a}`], why: 'Proportional: erst auf 1 Minute teilen.', unit: 'Liter' },
        { title: `In ${b} Minuten`, ask: `Wie viele Liter sind es nach ${b} Minuten?`, calc: `${one} · ${b}`, wrong: [`${one} : ${b}`], why: 'Dann mal die Minuten.', unit: 'Liter' },
      ],
      unit: 'Liter', sentence: v => `In der Wanne sind dann ${v} Wasser.`,
    });
  },
  () => {
    const k = R(2, 6), t = R(3, 12) * 5, k2 = R(2, 10), all = k * t;
    if (k === k2 || all % k2) return null;
    return wordTask({
      prompt: `${k} Kinder rechen das Laub im Schulgarten zusammen. Sie brauchen dafür ${t} Minuten. Wie lange würden ${k2} Kinder brauchen, wenn alle gleich schnell arbeiten?`,
      steps: [
        { title: '1 Kind', ask: 'Wie lange bräuchte 1 Kind allein?', calc: `${t} · ${k}`, wrong: [`${t} : ${k}`], why: 'Je mehr Kinder, desto schneller: antiproportional. Ein Kind allein braucht länger, also mal.', unit: 'min' },
        { title: `${k2} Kinder`, ask: `Wie lange brauchen ${k2} Kinder?`, calc: `${all} : ${k2}`, wrong: [`${all} · ${k2}`], why: 'Mehr Kinder teilen sich die Arbeit: geteilt.', unit: 'min' },
      ],
      unit: 'min', sentence: v => `${k2} Kinder brauchen ${v}.`,
    });
  },
  () => {
    const K = kid(), v = R(10, 20), t = R(4, 12) * 5, v2 = R(10, 25), all = v * t;
    if (v === v2 || all % v2) return null;
    return wordTask({
      prompt: `${K.n} fährt mit dem Rad zum Baggersee. Mit ${v} km/h braucht ${K.p} ${t} Minuten. Wie lange braucht ${K.p} mit ${v2} km/h?`,
      steps: [
        { title: 'Mit 1 km/h', ask: 'Wie lange würde die Fahrt mit nur 1 km/h dauern?', calc: `${t} · ${v}`, wrong: [`${t} : ${v}`], why: 'Je schneller, desto kürzer die Zeit: antiproportional. Langsamer heißt länger, also mal.', unit: 'min' },
        { title: `Mit ${v2} km/h`, ask: `Wie lange dauert die Fahrt mit ${v2} km/h?`, calc: `${all} : ${v2}`, wrong: [`${all} · ${v2}`], why: 'Dann durch die neue Geschwindigkeit teilen.', unit: 'min' },
      ],
      unit: 'min', sentence: x => `Mit ${v2} km/h braucht ${K.n} ${x}.`,
    });
  },
  () => {
    const K = kid(), one = R(8, 12), a = R(2, 4), b = R(2, 6);
    if (a === b) return null;
    return wordTask({
      prompt: `${K.n} passt auf die Kinder der Nachbarn auf. Für ${a} Stunden bekommt ${K.p} ${one * a} €. Wie viel bekommt ${K.p} für ${b} Stunden?`,
      steps: [
        { title: 'Für 1 Stunde', ask: 'Wie viel Geld gibt es für 1 Stunde?', calc: `${one * a} : ${a}`, wrong: [`${one * a} · ${a}`], why: 'Proportional: auf 1 Stunde teilen.', unit: '€' },
        { title: `Für ${b} Stunden`, ask: `Wie viel gibt es für ${b} Stunden?`, calc: `${one} · ${b}`, wrong: [`${one} : ${b}`], why: 'Dann mal die Stunden.', unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} bekommt ${v}.`,
    });
  },
];
const PROP5: Gen[] = [
  () => {
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
  },
  () => {
    const l = pick([5, 6, 7, 8]), km = R(2, 9) * 50, pr = pick(['1,7', '1,8', '1,9']);
    return wordTask({
      prompt: `Ein Auto verbraucht ${l} Liter Benzin auf 100 km. Familie ${pick(FAM)} fährt ${km} km in den Urlaub. Ein Liter kostet ${pr} €. Wie viel kostet das Benzin?`,
      steps: [
        { title: 'Benzin für die Strecke', ask: `Wie viele Liter braucht das Auto für ${km} km?`, calc: `${l} : 100 · ${km}`, wrong: [`${l} · 100 : ${km}`], why: 'Proportional: erst auf 1 km (durch 100), dann mal die Kilometer.', unit: 'l' },
        { title: 'Kosten', ask: 'Wie viel kostet das Benzin?', calc: `${dec1((l * km) / 100)} · ${pr}`, unit: '€' },
      ],
      unit: '€', sentence: v => `Das Benzin kostet ${cent(v)}.`,
    });
  },
  () => {
    const K = kid(), cA = R(28, 40), cB = cA - R(2, 8), E = pick([30, 60]);
    return wordTask({
      prompt: `Im Supermarkt gibt es 6 Eier für ${euro(6 * cA)} € und 10 Eier für ${euro(10 * cB)} €. ${K.n} braucht für das Klassenfest ${E} Eier. Wie viel Geld spart ${K.p}, wenn ${K.p} Zehnerpackungen statt Sechserpackungen kauft?`,
      steps: [
        { title: 'Ein Ei (6er)', ask: 'Wie viel kostet ein Ei aus der Sechserpackung?', calc: `${euro(6 * cA)} : 6`, wrong: [`${euro(6 * cA)} · 6`], why: 'Auf 1 Ei umrechnen: durch die Anzahl teilen.', unit: '€' },
        { title: 'Ein Ei (10er)', ask: 'Wie viel kostet ein Ei aus der Zehnerpackung?', calc: `${euro(10 * cB)} : 10`, wrong: [`${euro(10 * cB)} · 10`], why: 'Auch hier durch die Anzahl teilen.', unit: '€' },
        { title: 'Ersparnis pro Ei', ask: 'Wie viel billiger ist ein Ei aus der Zehnerpackung?', calc: `${euro(cA)} − ${euro(cB)}`, wrong: [`${euro(cA)} + ${euro(cB)}`], why: 'Um wie viel billiger: Unterschied, also minus.', unit: '€' },
        { title: `Bei ${E} Eiern`, ask: `Wie viel spart ${K.p} bei ${E} Eiern?`, calc: `${euro(cA - cB)} · ${E}`, wrong: [`${euro(cA - cB)} : ${E}`], why: 'Bei jedem Ei spart man gleich viel: mal die Anzahl.', unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} spart ${cent(v)}.`,
    });
  },
  () => {
    const h = R(4, 8), s = R(1, 2), t = R(3, 9), all = h * t;
    if (all % (h - s)) return null;
    return wordTask({
      prompt: `Für das Schulfest wollen ${h} Eltern die Bühne aufbauen. Zusammen brauchen sie dafür ${t} Stunden. Leider ${s === 1 ? 'wird 1 Elternteil' : `werden ${s} Eltern`} krank. Wie lange brauchen die anderen, wenn alle gleich schnell arbeiten?`,
      steps: [
        { title: 'Helfer jetzt', ask: 'Wie viele Eltern helfen jetzt noch?', calc: `${h} − ${s}`, wrong: [`${h} + ${s}`], why: 'Die Kranken fallen weg: minus.', unit: 'Eltern' },
        { title: '1 Elternteil', ask: 'Wie lange bräuchte 1 Elternteil allein?', calc: `${t} · ${h}`, wrong: [`${t} : ${h}`], why: 'Antiproportional: Einer allein braucht länger, also mal.', unit: 'h' },
        { title: 'Mit weniger Helfern', ask: `Wie lange brauchen ${h - s} Eltern?`, calc: `${all} : ${h - s}`, wrong: [`${all} · ${h - s}`], why: 'Dann durch die neue Anzahl teilen.', unit: 'h' },
      ],
      unit: 'h', sentence: v => `Die anderen brauchen ${v}.`,
    });
  },
  () => {
    const K = kid(), per = pick([100, 125, 150]), p = pick([2, 4]), n = R(3, 12), pr = pick(['1,1', '1,2', '1,3', '1,4']);
    if (n === p) return null;
    return wordTask({
      prompt: `Für Pfannkuchen für ${p} Personen braucht man ${per * p} ml Milch. ${K.n} macht Pfannkuchen für ${n} Personen. Ein Liter Milch kostet ${pr} €. Wie viel kostet die Milch, die ${K.p} braucht?`,
      steps: [
        { title: 'Für 1 Person', ask: 'Wie viel Milch braucht man für 1 Person?', calc: `${per * p} : ${p}`, wrong: [`${per * p} · ${p}`], why: 'Proportional: auf 1 Person teilen.', unit: 'ml' },
        { title: `Für ${n} Personen`, ask: `Wie viel Milch braucht man für ${n} Personen?`, calc: `${per} · ${n}`, wrong: [`${per} : ${n}`], why: 'Dann mal die Anzahl der Personen.', unit: 'ml' },
        { title: 'Kosten', ask: 'Wie viel kostet diese Milch? (1 l = 1000 ml)', calc: `${per * n} : 1000 · ${pr}`, wrong: [`${per * n} · ${pr}`], why: 'Erst auf 1 ml teilen (durch 1000), dann mal den Literpreis.', unit: '€' },
      ],
      unit: '€', sentence: v => `Die Milch kostet ${cent(v)}.`,
    });
  },
  () => {
    const K = kid(), one = R(8, 13), a = R(2, 4), h = [R(1, 4), R(1, 4), R(1, 4)], H = h[0] + h[1] + h[2];
    return wordTask({
      prompt: `${K.n} trägt Prospekte aus. Für ${a} Stunden bekommt ${K.p} ${one * a} €. Diese Woche arbeitet ${K.p} am Montag ${h[0]} h, am Mittwoch ${h[1]} h und am Samstag ${h[2]} h. Wie viel verdient ${K.p} in dieser Woche?`,
      steps: [
        { title: 'Für 1 Stunde', ask: 'Wie viel bekommt man für 1 Stunde?', calc: `${one * a} : ${a}`, wrong: [`${one * a} · ${a}`], why: 'Proportional: auf 1 Stunde teilen.', unit: '€' },
        { title: 'Stunden', ask: `Wie viele Stunden arbeitet ${K.p} zusammen?`, calc: `${h[0]} + ${h[1]} + ${h[2]}`, unit: 'h' },
        { title: 'Verdienst', ask: `Wie viel verdient ${K.p} in ${H} Stunden?`, calc: `${one} · ${H}`, wrong: [`${one} + ${H}`], why: 'Lohn für 1 Stunde mal Anzahl der Stunden.', unit: '€' },
      ],
      unit: '€', sentence: v => `${K.n} verdient ${v}.`,
    });
  },
];
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
  text: level => genFrom(() => pick(level === 4 ? PROP4 : PROP5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating() && s.answer.mul(q(100)).isInt())),
};

/* ---------- Maßstab ---------- */
const lenH = (cm: Q): { v: Q; u: string } => (cm.lt(q(100)) ? { v: cm, u: 'cm' } : cm.lt(q(100000)) ? { v: cm.div(q(100)), u: 'm' } : { v: cm.div(q(100000)), u: 'km' });
function massTask(level: number): Task | null {
  return genFrom(() => {
    if (level === 1 || (level === 2 && Math.random() < 0.5)) {
      const m = level === 1 ? pick([10, 20, 25, 50, 100, 200]) : pick([1000, 5000, 10000, 25000, 50000, 100000]);
      const cm = level === 1 ? R(2, 20) : R(2, 12) + pick([0, 0.5]);
      const real = q(cm * 10, 10).mul(q(m)), out = lenH(real), f = out.u === 'm' ? 100 : out.u === 'km' ? 100000 : 1;
      const cH = dH(q(cm * 10, 10));
      const t: Task = { prompt: `Maßstab ${M(`1 : ${gz(m)}`)}. Auf ${m <= 1000 ? 'dem Plan' : 'der Karte'} ist eine Strecke ${M(`${cH} cm`)} lang. Wie lang ist sie in Wirklichkeit (in ${out.u})?`, answer: out.v, placeholder: `Antwort in ${out.u}`,
        sol: list([{ rule: 'Maßstab lesen', lines: [`1 : ${gz(m)} heißt: 1 cm auf ${m <= 1000 ? 'dem Plan' : 'der Karte'} sind ${gz(m)} cm in Wirklichkeit.`] }, { rule: 'Mal den Maßstab', lines: [`${cH} cm · ${gz(m)} = ${gz(Number(real.n))} cm`] }, ...(f > 1 ? [{ rule: `In ${out.u} umrechnen`, lines: [`${gz(Number(real.n))} cm : ${gz(f)} = ${dH(out.v)} ${out.u}`] }] : [])], out.v, `${dH(out.v)} ${out.u}`),
        guide: [
          { title: 'Mal den Maßstab', ask: `<p>1 cm sind ${gz(m)} cm in Wirklichkeit. Wie viele cm sind dann ${cH} cm?</p><div class="math big">${cH} · ${gz(m)} = ?</div>`, answer: real, hint: 'Rechne die Länge mal die Zahl hinter dem Doppelpunkt.', explain: `${gz(Number(real.n))} cm`, placeholder: 'Antwort in cm' },
          ...(f > 1 ? [{ title: `In ${out.u} umrechnen`, ask: `<p>1 ${out.u} = ${gz(f)} cm. Wie viele ${out.u} sind ${gz(Number(real.n))} cm?</p>`, answer: out.v, hint: `Teile durch ${gz(f)}.`, explain: `${dH(out.v)} ${out.u}`, placeholder: `Antwort in ${out.u}` }] : []),
        ],
        diag: v => (v.eq(real) && f > 1 ? `Die Zahl stimmt in cm. Gefragt ist aber in <b>${out.u}</b>.` : null) };
      return t;
    }
    if (level === 2) {
      const m = pick([10000, 20000, 25000, 50000, 100000]), cm = q(R(2, 24), 2), realQ = cm.mul(q(m)), kmQ = realQ.div(q(100000));
      if (!realQ.isInt() || !kmQ.mul(q(10)).isInt()) return null;
      const real = Number(realQ.n), kmH = dH(kmQ);
      return { prompt: `Auf einer Karte mit Maßstab ${M(`1 : ${gz(m)}`)} soll ein Weg eingezeichnet werden, der in Wirklichkeit ${M(`${kmH} km`)} lang ist. Wie lang wird er auf der Karte (in cm)?`, answer: cm, placeholder: 'Antwort in cm',
        sol: list([{ rule: 'In cm umrechnen', lines: [`${kmH} km = ${gz(real)} cm`] }, { rule: 'Durch den Maßstab', lines: [`${gz(real)} : ${gz(m)} = ${dH(cm)} cm`] }], cm, `${dH(cm)} cm`),
        guide: [
          { title: 'In cm umrechnen', ask: `<p>1 km = 100&#8239;000 cm. Wie viele cm sind ${kmH} km?</p>`, answer: realQ, hint: 'Mal 100 000.', explain: `${gz(real)} cm`, placeholder: 'Antwort in cm' },
          { title: 'Durch den Maßstab', ask: `<p>Auf der Karte ist alles ${gz(m)}-mal kleiner. Wie viele cm sind es auf der Karte?</p><div class="math big">${gz(real)} : ${gz(m)} = ?</div>`, answer: cm, hint: 'Von Wirklichkeit zur Karte: geteilt.', explain: `${dH(cm)} cm`, placeholder: 'Antwort in cm' },
        ],
        diag: v => (v.eq(kmQ) ? 'Das ist die Länge in km. Rechne erst in cm um und teile dann durch den Maßstab.' : null) };
    }
    if (Math.random() < 0.35) {
      // Vergrößerung im Biobuch
      const T = pick([['Ameise', 5, 10, [5, 10]], ['Marienkäfer', 6, 8, [5, 10]], ['Biene', 12, 15, [2, 5]], ['Mücke', 5, 7, [10]], ['Floh', 2, 3, [20, 50]], ['Spinne', 8, 12, [5]]] as const);
      const real = R(T[1], T[2]), m = pick([...T[3]]), img = real * m, cmH = dec1(img / 10);
      if (img > 200) return null;
      const der = T[0] === 'Marienkäfer' || T[0] === 'Floh' ? 'ein' : 'eine', ist = T[0] === 'Marienkäfer' || T[0] === 'Floh' ? 'er' : 'sie';
      return { prompt: `Im Biobuch ist ${der} ${T[0]} im Maßstab ${M(`${m} : 1`)} abgebildet. Auf dem Bild ist ${ist} ${M(`${cmH} cm`)} lang. Wie lang ist ${ist} in Wirklichkeit (in mm)?`, answer: q(real), placeholder: 'Antwort in mm',
        sol: list([{ rule: 'In mm umrechnen', lines: [`${cmH} cm = ${img} mm`] }, { rule: 'Vergrößerung', lines: [`${m} : 1 heißt: Das Bild ist ${m}-mal so groß wie in Wirklichkeit.`, `${img} mm : ${m} = ${real} mm`] }], q(real), `${real} mm`),
        guide: [
          { title: 'In mm umrechnen', ask: `<p>1 cm = 10 mm. Wie viele mm sind ${cmH} cm?</p>`, answer: q(img), hint: 'Mal 10.', explain: `${cmH} cm = ${img} mm`, placeholder: 'Antwort in mm' },
          { title: 'Durch den Maßstab', choose: { ask: `Was bedeutet ${m} : 1?`, options: opts('Das Bild ist vergrößert.', ['Das Bild ist verkleinert.', 'Das Bild ist genauso groß.']), why: `Die große Zahl steht vorne: ${m} mm auf dem Bild sind 1 mm in Wirklichkeit.` }, ask: `<p>Das Bild ist ${m}-mal so groß. Wie lang ist das Tier wirklich?</p><div class="math big">${img} : ${m} = ?</div>`, answer: q(real), hint: 'Vom vergrößerten Bild zur Wirklichkeit: geteilt.', explain: `${real} mm`, placeholder: 'Antwort in mm' },
        ],
        diag: v => (v.eq(q(img * m)) ? `Das Bild ist <b>vergrößert</b>. In Wirklichkeit ist das Tier kleiner, also teilst du durch ${m}.` : v.eq(q(img)) ? 'Das ist die Länge auf dem Bild in mm. Teile noch durch den Maßstab.' : null) };
    }
    const m = pick([5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000]), cm = R(2, 12), real = cm * m, out = lenH(q(real));
    return { prompt: `Auf einer Karte sind ${M(`${cm} cm`)} in Wirklichkeit ${M(`${dH(out.v)} ${out.u}`)}. Welchen Maßstab hat die Karte? Gib die Zahl hinter ${M('1 :')} an.`, answer: q(m), placeholder: '1 : …',
      sol: list([{ rule: 'Gleiche Einheit', lines: [`${dH(out.v)} ${out.u} = ${gz(real)} cm`] }, { rule: 'Auf 1 cm', lines: [`${gz(real)} : ${cm} = ${gz(m)}`, `Der Maßstab ist 1 : ${gz(m)}.`] }], q(m), `1 : ${gz(m)}`),
      guide: [
        { title: 'Gleiche Einheit', ask: `<p>Wie viele cm sind ${dH(out.v)} ${out.u}?</p>`, answer: q(real), hint: out.u === 'km' ? '1 km = 100 000 cm.' : '1 m = 100 cm.', explain: `${gz(real)} cm`, placeholder: 'Antwort in cm' },
        { title: 'Auf 1 cm', ask: `<p>${cm} cm auf der Karte sind ${gz(real)} cm. Wie viel ist dann 1 cm auf der Karte?</p><div class="math big">${gz(real)} : ${cm} = ?</div>`, answer: q(m), hint: `Teile durch ${cm}.`, explain: `1 cm → ${gz(m)} cm, also 1 : ${gz(m)}`, placeholder: 'Zahl' },
      ] };
  }, t => t.answer.sign() > 0 && t.answer.terminating() && t.guide!.every(s => s.answer.terminating()));
}
/** Kommazahl für Rechnungen und Texte, z. B. 2,5 */
const qd = (v: Q) => dH(v);
const MASS4: Gen[] = [
  () => {
    const K = kid(), m = pick([25000, 50000]), a = R(2, 9), b = R(2, 9), s = a + b;
    return wordTask({
      prompt: `Auf der Wanderkarte (Maßstab 1 : ${gz(m)}) misst ${K.n} zwei Wegstücke: ${a} cm bis zur Hütte und ${b} cm von der Hütte zum Gipfel. Wie viele Kilometer ist der Weg in Wirklichkeit lang?`,
      steps: [
        { title: 'Auf der Karte', ask: 'Wie lang ist der ganze Weg auf der Karte?', calc: `${a} + ${b}`, unit: 'cm' },
        { title: 'In Wirklichkeit in cm', ask: 'Wie viele cm sind das in Wirklichkeit?', calc: `${s} · ${m}`, wrong: [`${s} : ${m}`], why: 'Karte → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
        { title: 'In km', ask: 'Wie viele km sind das? (1 km = 100 000 cm)', calc: `${s * m} : 100000`, wrong: [`${s * m} : 1000`], why: '1 km sind 100 000 cm.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `Der Weg ist ${v} lang.`,
    });
  },
  () => {
    const K = kid(), m = pick([25000, 50000]), cm = q(R(4, 24), 2), km = cm.mul(q(m)).div(q(100000));
    if (!km.mul(q(10)).isInt()) return null;
    const real = Number(km.mul(q(100000)).n);
    return wordTask({
      prompt: `${K.n} plant eine Radtour und will den Weg in die Karte einzeichnen. Die Karte hat den Maßstab 1 : ${gz(m)}. In Wirklichkeit ist der Weg ${qd(km)} km lang. Wie lang wird der Strich auf der Karte?`,
      steps: [
        { title: 'In cm umrechnen', ask: `Wie viele cm sind ${qd(km)} km? (1 km = 100 000 cm)`, calc: `${qd(km)} · 100000`, wrong: [`${qd(km)} · 1000`], why: '1 km sind 100 000 cm.', unit: 'cm' },
        { title: 'Auf der Karte', ask: 'Wie lang ist der Weg auf der Karte?', calc: `${real} : ${m}`, wrong: [`${real} · ${m}`], why: 'Wirklichkeit → Karte: durch den Maßstab teilen.', unit: 'cm' },
      ],
      unit: 'cm', sentence: v => `Der Strich auf der Karte ist ${v} lang.`,
    });
  },
  () => {
    const K = kid(), m = pick([5000, 10000, 20000]), cm = R(3, 15), real = cm * m;
    return wordTask({
      prompt: `Auf dem Stadtplan (Maßstab 1 : ${gz(m)}) ist ${K.gen} Schulweg ${cm} cm lang. ${K.P} geht morgens hin und mittags wieder zurück. Wie viele Meter läuft ${K.p} an einem Schultag?`,
      steps: [
        { title: 'In Wirklichkeit in cm', ask: 'Wie lang ist der Schulweg in Wirklichkeit in cm?', calc: `${cm} · ${m}`, wrong: [`${cm} : ${m}`], why: 'Plan → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
        { title: 'In m', ask: 'Wie viele Meter sind das? (1 m = 100 cm)', calc: `${real} : 100`, wrong: [`${real} : 1000`], why: '1 m sind 100 cm.', unit: 'm' },
        { title: 'Hin und zurück', ask: 'Wie viele Meter sind es hin und zurück?', calc: `${real / 100} · 2`, wrong: [`${real / 100} + 2`], why: 'Den Weg zweimal: mal 2.', unit: 'm' },
      ],
      unit: 'm', sentence: v => `${K.n} läuft an einem Schultag ${v}.`,
    });
  },
  () => {
    const K = kid(), [s, lo, hi] = pick([[18, 20, 28], [24, 15, 21], [43, 9, 11]] as const), l = R(lo, hi), real = l * s;
    if (real < 350 || real > 520) return null;
    return wordTask({
      prompt: `${K.n} hat ein Modellauto im Maßstab 1 : ${s}. Das Modell ist ${l} cm lang. Wie lang ist das echte Auto in Metern?`,
      steps: [
        { title: 'Echt in cm', ask: 'Wie lang ist das echte Auto in cm?', calc: `${l} · ${s}`, wrong: [`${l} : ${s}`, `${l} + ${s}`], why: `Das echte Auto ist ${s}-mal so lang: mal ${s}.`, unit: 'cm' },
        { title: 'In m', ask: 'Wie viele Meter sind das?', calc: `${real} : 100`, wrong: [`${real} : 10`], why: '1 m sind 100 cm.', unit: 'm' },
      ],
      unit: 'm', sentence: v => `Das echte Auto ist ${v} lang.`,
    });
  },
  () => {
    const [x, y, km] = pick([['Mannheim', 'Heidelberg', 20], ['Karlsruhe', 'Pforzheim', 25], ['Stuttgart', 'Tübingen', 30], ['Stuttgart', 'Heilbronn', 40], ['Freiburg', 'Basel', 50], ['Stuttgart', 'Karlsruhe', 60], ['Stuttgart', 'Ulm', 70]] as const);
    const m = pick([200000, 250000, 500000]), real = km * 100000, cm = q(real, m);
    if (q(30).lt(cm) || !cm.mul(q(10)).isInt()) return null;
    return wordTask({
      prompt: `${x} und ${y} liegen in Luftlinie etwa ${km} km auseinander. Wie weit sind die beiden Städte auf einer Landkarte mit dem Maßstab 1 : ${gz(m)} voneinander entfernt?`,
      steps: [
        { title: 'In cm umrechnen', ask: `Wie viele cm sind ${km} km?`, calc: `${km} · 100000`, wrong: [`${km} · 1000`], why: '1 km sind 100 000 cm.', unit: 'cm' },
        { title: 'Auf der Karte', ask: 'Wie viele cm sind es auf der Karte?', calc: `${real} : ${m}`, wrong: [`${real} · ${m}`], why: 'Wirklichkeit → Karte: durch den Maßstab teilen.', unit: 'cm' },
      ],
      unit: 'cm', sentence: v => `Auf der Karte sind es ${v}.`,
    });
  },
];
const MASS5: Gen[] = [
  () => {
    const K = kid(), a = R(6, 12), b = R(4, 10);
    return wordTask({
      prompt: `Auf dem Bauplan (Maßstab 1 : 50) ist ${K.gen} Zimmer ${a} cm lang und ${b} cm breit. Wie groß ist die Fläche des Zimmers in Wirklichkeit in m²?`,
      steps: [
        { title: 'Länge in Wirklichkeit', ask: `Wie lang ist das Zimmer in Wirklichkeit? Rechne erst in cm, dann in m.`, calc: `${a} · 50 : 100`, wrong: [`${a} : 50`], why: 'Plan → Wirklichkeit: mal 50. Dann durch 100 für Meter.', unit: 'm' },
        { title: 'Breite in Wirklichkeit', ask: 'Wie breit ist das Zimmer in Wirklichkeit?', calc: `${b} · 50 : 100`, unit: 'm' },
        { title: 'Fläche', ask: 'Wie groß ist die Fläche?', calc: `${dec1((a * 50) / 100)} · ${dec1((b * 50) / 100)}`, wrong: [`2 · ${dec1((a * 50) / 100)} + 2 · ${dec1((b * 50) / 100)}`], why: 'Fläche vom Rechteck: Länge mal Breite.', unit: 'm²' },
      ],
      unit: 'm²', sentence: v => `Das Zimmer hat ${v} Fläche.`,
    });
  },
  () => {
    const f = pick(FAM), m = pick([25000, 50000]), km = R(2, m === 25000 ? 6 : 10), cm = (km * 100000) / m, t = pick([12, 15, 20]);
    return wordTask({
      prompt: `Familie ${f} plant eine Wanderung. Auf der Karte (Maßstab 1 : ${gz(m)}) ist der Weg ${cm} cm lang. Für 1 km braucht die Familie etwa ${t} Minuten. Wie lange sind sie unterwegs?`,
      steps: [
        { title: 'In Wirklichkeit in cm', ask: 'Wie lang ist der Weg in Wirklichkeit in cm?', calc: `${cm} · ${m}`, wrong: [`${cm} : ${m}`], why: 'Karte → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
        { title: 'In km', ask: 'Wie viele km sind das?', calc: `${km * 100000} : 100000`, wrong: [`${km * 100000} : 1000`], why: '1 km sind 100 000 cm.', unit: 'km' },
        { title: 'Zeit', ask: `Wie viele Minuten brauchen sie für ${km} km?`, calc: `${km} · ${t}`, wrong: [`${km} + ${t}`, `${t} : ${km}`], why: `Für jeden km ${t} Minuten: mal.`, unit: 'min' },
      ],
      unit: 'min', sentence: v => `Sie sind ${v} unterwegs.`,
    });
  },
  () => {
    const s = pick([200, 500]), a = R(4, 12), b = R(3, 10), p = R(8, 25), L = (a * s) / 100, W = (b * s) / 100;
    if (a === b) return null;
    return wordTask({
      prompt: `Auf dem Plan (Maßstab 1 : ${s}) ist ein rechteckiges Grundstück ${a} cm lang und ${b} cm breit. Es soll rundherum einen Zaun bekommen. Ein Meter Zaun kostet ${p} €. Wie viel kostet der Zaun?`,
      steps: [
        { title: 'Länge', ask: 'Wie lang ist das Grundstück in Wirklichkeit in m?', calc: `${a} · ${s} : 100`, wrong: [`${a} : ${s}`], why: `Plan → Wirklichkeit: mal ${s}, dann durch 100 für Meter.`, unit: 'm' },
        { title: 'Breite', ask: 'Wie breit ist es in Wirklichkeit in m?', calc: `${b} · ${s} : 100`, unit: 'm' },
        { title: 'Umfang', ask: 'Wie lang wird der Zaun?', calc: `2 · ${dec1(L)} + 2 · ${dec1(W)}`, wrong: [`${dec1(L)} · ${dec1(W)}`, `${dec1(L)} + ${dec1(W)}`], why: 'Rundherum: alle vier Seiten zusammen.', unit: 'm' },
        { title: 'Kosten', ask: 'Wie viel kostet der Zaun?', calc: `${dec1(2 * L + 2 * W)} · ${p}`, wrong: [`${dec1(2 * L + 2 * W)} + ${p}`], why: 'Meter mal Preis pro Meter.', unit: '€' },
      ],
      unit: '€', sentence: v => `Der Zaun kostet ${v}.`,
    });
  },
  () => {
    const K = kid(), m2 = pick([50000, 100000]), cm1 = R(4, 20), real = cm1 * 25000, cm2 = q(real, m2);
    if (!cm2.mul(q(10)).isInt()) return null;
    return wordTask({
      prompt: `Auf ${K.gen} Wanderkarte (Maßstab 1 : 25 000) ist ein Weg ${cm1} cm lang. Wie lang ist derselbe Weg auf einer Radkarte mit dem Maßstab 1 : ${gz(m2)}?`,
      steps: [
        { title: 'In Wirklichkeit in cm', ask: 'Wie lang ist der Weg in Wirklichkeit in cm?', calc: `${cm1} · 25000`, wrong: [`${cm1} : 25000`], why: 'Karte → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
        { title: 'In km', ask: 'Wie viele km sind das?', calc: `${real} : 100000`, wrong: [`${real} : 1000`], why: '1 km sind 100 000 cm.', unit: 'km' },
        { title: 'Auf der Radkarte', ask: 'Wie lang ist der Weg auf der Radkarte?', calc: `${real} : ${m2}`, wrong: [`${real} · ${m2}`, `${cm1} · ${m2 / 25000}`], why: 'Wirklichkeit → Karte: durch den neuen Maßstab teilen.', unit: 'cm' },
      ],
      unit: 'cm', sentence: v => `Auf der Radkarte ist der Weg ${v} lang.`,
    });
  },
  () => {
    const K = kid(), s = pick([200, 500]), L = R(8, 20) * 5, W = R(4, 10) * 5, h = R(8, 20);
    if (W >= L) return null;
    const l = q(L * 100, s), w = q(W * 100, s);
    return wordTask({
      prompt: `${K.n} baut für ein Schulprojekt ein Modell der Schule im Maßstab 1 : ${s}. Das echte Schulhaus ist ${L} m lang, ${W} m breit und ${h} m hoch. Wie groß wird die Grundfläche des Modells in cm²?`,
      steps: [
        { title: 'Länge im Modell', ask: 'Wie lang wird das Modell in cm? (1 m = 100 cm)', calc: `${L} · 100 : ${s}`, wrong: [`${L} · ${s}`, `${L} : ${s}`], why: `Erst in cm umrechnen, dann durch ${s} teilen: Wirklichkeit → Modell.`, unit: 'cm' },
        { title: 'Breite im Modell', ask: 'Wie breit wird das Modell in cm?', calc: `${W} · 100 : ${s}`, unit: 'cm' },
        { title: 'Grundfläche', ask: 'Wie groß ist die Grundfläche des Modells?', calc: `${qd(l)} · ${qd(w)}`, wrong: [`2 · ${qd(l)} + 2 · ${qd(w)}`], why: 'Fläche vom Rechteck: Länge mal Breite. Die Höhe brauchst du dafür nicht.', unit: 'cm²' },
      ],
      unit: 'cm²', sentence: v => `Die Grundfläche des Modells ist ${v} groß.`,
    });
  },
  () => {
    const K = kid(), s = pick([2000, 5000]), cm = R(15, 40), n = R(2, 5), real = (cm * s) / 100;
    if (real * n > 6000 || (real * n) % 100) return null;
    return wordTask({
      prompt: `Auf dem Plan vom Stadtpark (Maßstab 1 : ${gz(s)}) ist der Rundweg um den See ${cm} cm lang. ${K.n} joggt ${n} Runden. Wie viele Kilometer läuft ${K.p}?`,
      steps: [
        { title: 'Eine Runde in cm', ask: 'Wie lang ist eine Runde in Wirklichkeit in cm?', calc: `${cm} · ${s}`, wrong: [`${cm} : ${s}`], why: 'Plan → Wirklichkeit: mal den Maßstab.', unit: 'cm' },
        { title: 'Eine Runde in m', ask: 'Wie viele Meter sind das?', calc: `${cm * s} : 100`, wrong: [`${cm * s} : 1000`], why: '1 m sind 100 cm.', unit: 'm' },
        { title: `${n} Runden`, ask: `Wie viele Meter sind ${n} Runden?`, calc: `${real} · ${n}`, wrong: [`${real} + ${n}`], why: 'Jede Runde gleich lang: mal die Anzahl der Runden.', unit: 'm' },
        { title: 'In km', ask: 'Wie viele km sind das? (1 km = 1000 m)', calc: `${real * n} : 1000`, wrong: [`${real * n} : 100`], why: '1 km sind 1000 m.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `${K.n} läuft ${v}.`,
    });
  },
];
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
  text: level => genFrom(() => pick(level === 4 ? MASS4 : MASS5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating())),
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
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
/** Werte mit vorgegebenem Mittelwert: die letzte Zahl gleicht aus. */
function withMean(k: number, mean: number, spread: number, lo: number): number[] | null {
  const v = Array.from({ length: k - 1 }, () => R(Math.max(lo, mean - spread), mean + spread)), last = mean * k - v.reduce((a, b) => a + b, 0);
  if (last < lo || Math.abs(last - mean) > spread + 2) return null;
  v.push(last); return v.sort(() => Math.random() - 0.5);
}
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
const DATEN4: Gen[] = [
  () => {
    const K = kid(), g = Array.from({ length: 4 }, () => R(1, 4)), s = sum(g), f = pick(['Mathe', 'Deutsch', 'Englisch', 'Bio']);
    return wordTask({
      prompt: `${K.n} hat in ${f} diese Noten geschrieben: ${g.join(', ')}. Welche Durchschnittsnote hat ${K.p}?`,
      steps: [
        { title: 'Summe', ask: 'Wie groß ist die Summe aller Noten?', calc: g.join(' + ') },
        { title: 'Durchschnitt', ask: 'Wie groß ist der Durchschnitt?', calc: `${s} : 4`, wrong: [`${s} · 4`, `${s} : 2`], why: 'Summe geteilt durch die Anzahl der Noten.' },
      ],
      sentence: v => `${K.gen} Durchschnittsnote ist ${v}.`,
    });
  },
  () => {
    const v = DAYS.map(() => R(2, 8) * 5), s = sum(v);
    return wordTask({
      prompt: `Das Diagramm zeigt, wie viele Brezeln der Schulkiosk in einer Woche verkauft hat. Wie viele Brezeln hat er im Durchschnitt pro Tag verkauft?${barSVG(DAYS, v, 'Brezeln')}`,
      steps: [
        { title: 'Alle Brezeln', ask: 'Lies alle Säulen ab. Wie viele Brezeln sind es zusammen?', calc: v.join(' + '), unit: 'Brezeln' },
        { title: 'Durchschnitt', ask: 'Wie viele sind es im Durchschnitt pro Tag?', calc: `${s} : 5`, wrong: [`${s} · 5`, `${s} : 7`], why: 'Summe durch die Anzahl der Tage. Der Kiosk hat nur an 5 Schultagen offen.', unit: 'Brezeln' },
      ],
      unit: 'Brezeln', sentence: x => `Im Durchschnitt hat der Kiosk ${x} pro Tag verkauft.`,
    });
  },
  () => {
    const K = kid(), a = R(3, 8), r = R(1, 4), b = R(1, 3), s = R(1, 4), A = 5 * a + r, L = 5 * b + s;
    return wordTask({
      prompt: `${K.n} zählt eine Viertelstunde lang die Fahrzeuge vor der Schule. ${K.P} macht eine Strichliste. Wie viele Autos mehr als Lkw sind vorbeigefahren?<p>Autos:</p>${tallySVG(A)}<p>Lkw:</p>${tallySVG(L)}`,
      steps: [
        { title: 'Autos', ask: 'Wie viele Autos sind es? Ein Bündel sind 5 Striche.', calc: `${a} · 5 + ${r}`, wrong: [`${a} + ${r}`, `${a} · 4 + ${r}`], why: 'Bündel mal 5, dann die einzelnen Striche dazu.', unit: 'Autos' },
        { title: 'Lkw', ask: 'Wie viele Lkw sind es?', calc: `${b} · 5 + ${s}`, unit: 'Lkw' },
        { title: 'Unterschied', ask: 'Wie viele Autos mehr als Lkw?', calc: `${A} − ${L}`, wrong: [`${A} + ${L}`], why: 'Wie viel mehr: minus.', unit: 'Autos' },
      ],
      unit: 'Autos', sentence: x => `Es sind ${x} mehr als Lkw vorbeigefahren.`,
    });
  },
  () => {
    const kids = [...KIDS].sort(() => Math.random() - 0.5).slice(0, 5).map(k => k[0]), w = kids.map(() => R(250, 420));
    const mx = Math.max(...w), mn = Math.min(...w);
    if (new Set(w).size < 5) return null;
    return wordTask({
      prompt: `Beim Weitsprung messen fünf Kinder ihre Weiten (in cm): ${kids.map((k, i) => `${k} ${w[i]}`).join(', ')}. Wie groß ist die <b>Spannweite</b>?`,
      steps: [
        { title: 'Weitester Sprung', ask: 'Welcher Sprung ist der weiteste?', calc: String(mx), explain: `${kids[w.indexOf(mx)]}: ${mx} cm`, unit: 'cm' },
        { title: 'Kürzester Sprung', ask: 'Welcher Sprung ist der kürzeste?', calc: String(mn), explain: `${kids[w.indexOf(mn)]}: ${mn} cm`, unit: 'cm' },
        { title: 'Spannweite', ask: 'Wie groß ist die Spannweite?', calc: `${mx} − ${mn}`, wrong: [`${mx} + ${mn}`], why: 'Spannweite: größter minus kleinster Wert.', unit: 'cm' },
      ],
      unit: 'cm', sentence: x => `Die Spannweite ist ${x}.`,
    });
  },
  () => {
    const K = kid(), m = R(12, 22), v = withMean(6, m, 6, 5);
    if (!v) return null;
    return wordTask({
      prompt: `${K.n} fragt fünf Freunde, wie viel Taschengeld sie im Monat bekommen. Zusammen mit ${K.gen} eigenem Taschengeld sind es diese Beträge (in €): ${v.join('; ')}. Wie viel Taschengeld bekommen die sechs Kinder im Durchschnitt?`,
      steps: [
        { title: 'Summe', ask: 'Wie viel Geld ist das zusammen?', calc: v.join(' + '), unit: '€' },
        { title: 'Mittelwert', ask: 'Wie viel ist es im Durchschnitt?', calc: `${sum(v)} : 6`, wrong: [`${sum(v)} : 5`, `${sum(v)} · 6`], why: `Es sind 6 Kinder: ${K.n} und fünf andere. Also durch 6 teilen.`, unit: '€' },
      ],
      unit: '€', sentence: x => `Im Durchschnitt bekommen sie ${x} Taschengeld.`,
    });
  },
];
const DATEN5: Gen[] = [
  () => {
    const K = kid(), k = 5, mean = R(10, 15), v = Array.from({ length: k - 1 }, () => R(mean - 3, mean + 3)), s = sum(v), need = mean * k - s;
    if (need < 5 || need > 25) return null;
    return wordTask({
      prompt: `${K.n} läuft fünfmal um den Sportplatz und misst jedes Mal die Zeit. Die ersten vier Runden dauern ${v.join(', ')} Minuten. Wie lange darf die fünfte Runde dauern, damit der Mittelwert genau ${mean} Minuten ist?`,
      steps: [
        { title: 'Summe für den Mittelwert', ask: `Wie viele Minuten müssen alle fünf Runden zusammen sein, damit der Mittelwert ${mean} ist?`, calc: `${mean} · ${k}`, wrong: [`${mean} : ${k}`], why: 'Mittelwert mal Anzahl ergibt die Summe.', unit: 'min' },
        { title: 'Schon gelaufen', ask: `Wie viele Minuten hat ${K.p} in den ersten vier Runden gebraucht?`, calc: v.join(' + '), unit: 'min' },
        { title: 'Fünfte Runde', ask: 'Wie lange darf die fünfte Runde dauern?', calc: `${mean * k} − ${s}`, unit: 'min' },
      ],
      unit: 'min', sentence: v2 => `Die fünfte Runde darf ${v2} dauern.`,
    });
  },
  () => {
    const m1 = R(140, 160), h = R(150, 178), s = 4 * m1 + h;
    if (s % 5 || h === m1) return null;
    return wordTask({
      prompt: `Die vier Kinder einer Basketballgruppe sind im Durchschnitt ${m1} cm groß. Dann kommt ein fünftes Kind dazu. Es ist ${h} cm groß. Wie groß sind die fünf Kinder jetzt im Durchschnitt?`,
      steps: [
        { title: 'Summe der vier', ask: 'Wie viele cm sind die vier Kinder zusammen?', calc: `4 · ${m1}`, wrong: [`4 + ${m1}`, `${m1} : 4`], why: 'Mittelwert mal Anzahl ergibt die Summe.', unit: 'cm' },
        { title: 'Mit dem neuen Kind', ask: 'Wie viele cm sind alle fünf zusammen?', calc: `${4 * m1} + ${h}`, unit: 'cm' },
        { title: 'Neuer Mittelwert', ask: 'Wie groß ist der neue Mittelwert?', calc: `${s} : 5`, wrong: [`${s} : 4`, `(${m1} + ${h}) : 2`], why: 'Jetzt sind es 5 Kinder: durch 5 teilen.', unit: 'cm' },
      ],
      unit: 'cm', sentence: v => `Jetzt sind die Kinder im Durchschnitt ${v} groß.`,
    });
  },
  () => {
    const v = DAYS.map(() => R(2, 8) * 5), s = sum(v), p = pick([2, 3]);
    return wordTask({
      prompt: `Beim Waffelverkauf der Klasse 6a gibt es eine Woche lang Waffeln. Das Diagramm zeigt, wie viele an jedem Tag verkauft wurden. Eine Waffel kostet ${p} €. Wie viele Waffeln wurden im Durchschnitt pro Tag verkauft? Wie viel Geld hat die Klasse in der Woche eingenommen?${barSVG(DAYS, v, 'Waffeln')}`,
      steps: [
        { title: 'Alle Waffeln', ask: 'Lies alle Säulen ab. Wie viele Waffeln sind es zusammen?', calc: v.join(' + '), unit: 'Waffeln' },
        { title: 'Durchschnitt', ask: 'Wie viele Waffeln sind es im Durchschnitt pro Tag?', calc: `${s} : 5`, wrong: [`${s} · 5`], why: 'Summe durch die Anzahl der Tage.', unit: 'Waffeln' },
        { title: 'Einnahmen', ask: 'Wie viel Geld hat die Klasse eingenommen?', calc: `${s} · ${p}`, wrong: [`${s / 5} · ${p}`, `${s} + ${p}`], why: 'Alle verkauften Waffeln mal Preis, nicht nur die eines Tages.', unit: '€' },
      ],
      unit: '€', sentence: x => `Im Durchschnitt wurden ${s / 5} Waffeln pro Tag verkauft. Die Klasse hat ${x} eingenommen.`,
    });
  },
  () => {
    const mA = R(8, 15), mB = R(8, 15), A = withMean(3, mA, 4, 2), B = withMean(4, mB, 4, 2);
    if (!A || !B || Math.abs(mA - mB) < 2) return null;
    const [hi, lo, nh] = mA > mB ? [mA, mB, 'A'] : [mB, mA, 'B'];
    return wordTask({
      prompt: `Beim Korbwurf-Training treffen die Kinder von Team A ${A.join(', ')} Körbe. Die Kinder von Team B treffen ${B.join(', ')} Körbe. Welches Team trifft im Durchschnitt besser? Um wie viele Körbe pro Kind?`,
      steps: [
        { title: 'Mittelwert Team A', ask: 'Wie viele Körbe trifft ein Kind von Team A im Durchschnitt?', calc: `(${A.join(' + ')}) : 3`, wrong: [`(${A.join(' + ')}) : 4`], why: 'Team A hat 3 Kinder: Summe durch 3.', unit: 'Körbe' },
        { title: 'Mittelwert Team B', ask: 'Wie viele Körbe trifft ein Kind von Team B im Durchschnitt?', calc: `(${B.join(' + ')}) : 4`, wrong: [`(${B.join(' + ')}) : 3`], why: 'Team B hat 4 Kinder: Summe durch 4.', unit: 'Körbe' },
        { title: 'Unterschied', ask: 'Um wie viele Körbe ist das bessere Team im Durchschnitt besser?', calc: `${hi} − ${lo}`, wrong: [`${hi} + ${lo}`], why: 'Größerer Mittelwert minus kleinerer.', unit: 'Körbe' },
      ],
      unit: 'Körbe', sentence: x => `Team ${nh} trifft im Durchschnitt besser, und zwar um ${x} pro Kind.`,
    });
  },
  () => {
    const K = kid(), m = pick([10, 15, 20, 25, 30]), v = withMean(5, (7 * m) / 5, 10, 5);
    if (!v) return null;
    const s = sum(v);
    return wordTask({
      prompt: `${K.n} liest an den Schultagen dieser Woche so viele Minuten: ${DAYS.map((d, i) => `${d} ${v[i]}`).join(', ')}. Am Wochenende liest ${K.p} gar nicht. Wie viele Minuten liest ${K.p} im Durchschnitt pro Tag, wenn man die ganze Woche mit 7 Tagen nimmt?`,
      steps: [
        { title: 'Summe', ask: `Wie viele Minuten liest ${K.p} in der Woche zusammen?`, calc: v.join(' + '), unit: 'min' },
        { title: 'Pro Schultag', ask: 'Wie viele Minuten sind es im Durchschnitt pro Schultag?', calc: `${s} : 5`, wrong: [`${s} : 7`], why: 'Es gibt 5 Schultage.', unit: 'min' },
        { title: 'Pro Tag der Woche', ask: 'Und im Durchschnitt pro Tag der ganzen Woche?', calc: `${s} : 7`, wrong: [`${s} : 5`], why: 'Die Woche hat 7 Tage. Die Tage mit 0 Minuten zählen mit.', unit: 'min' },
      ],
      unit: 'min', sentence: x => `Pro Schultag sind es ${s / 5} min, auf die ganze Woche gerechnet ${x} pro Tag.`,
    });
  },
];
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
  text: level => genFrom(() => pick(level === 4 ? DATEN4 : DATEN5)(), t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating())),
};

export const ZAHL_TOPICS: Topic[] = [ZAHL, RUND, POT, PROP, MASS, DATEN];
