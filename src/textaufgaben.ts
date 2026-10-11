/* ===== Textaufgaben für Stufe 4 (zwei Schritte) und Stufe 5 (Profi, mehrere Schritte) ===== */
import { MathError, q, gcd, lcm, type Q } from './engine/index.js';
import { wordTask, type GuideStep } from './guide.js';
import { ggtTask, kgvTask } from './topics.js';

type Word = Omit<ReturnType<typeof wordTask>, 'heft'> & { heft?: ReturnType<typeof wordTask>['heft'] };
const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const G = (a: number, b: number) => Number(gcd(BigInt(a), BigInt(b)));
const L = (a: number, b: number) => Number(lcm(BigInt(a), BigInt(b)));
const eur = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
const dec = (x: Q) => x.toDec();
const fr = (n: number, d: number) => `${n}/${d}`;

/** Erzeugt so lange, bis die Zahlen schön sind (ganzzahlig, positiv, nicht zu groß). */
function tryGen(make: () => Word | null, ok: (t: Word) => boolean = () => true): Word | null {
  for (let i = 0; i < 300; i++) {
    try { const t = make(); if (t && ok(t) && t.guide.every(s => s.answer.sign() > 0)) return t; }
    catch (e) { if (!(e instanceof MathError)) throw e; }
  }
  return null;
}
const nice = (t: Word) => t.guide.every(s => s.answer.isInt());
const money = (t: Word) => t.guide.every(s => s.answer.terminating() && s.answer.mul(q(100)).isInt());

/* ----- Kleine Helfer für die Geschichten (pvs, kuerzen, bradd, brmul, dez, proz) ----- */
type Story = () => Word | null;
type WStep = Parameters<typeof wordTask>[0]['steps'][number];
const KIDS: [string, boolean][] = [['Mia', false], ['Ben', true], ['Lena', false], ['Tim', true], ['Emre', true], ['Sofia', false], ['Noah', true], ['Lea', false], ['Jonas', true], ['Aylin', false], ['Paul', true], ['Hanna', false], ['Luca', true], ['Elif', false], ['Finn', true], ['Ida', false]];
/** Ein Kind mit passenden Fürwörtern (er/sie, ihm/ihr, sein/ihr). */
const kid = () => {
  const [n, m] = pick(KIDS);
  return { n, er: m ? 'er' : 'sie', Er: m ? 'Er' : 'Sie', ihm: m ? 'ihm' : 'ihr', Sein: m ? 'Sein' : 'Ihr', seinem: m ? 'seinem' : 'ihrem' };
};
const klasse = () => pick(['5a', '5b', '5c', '6a', '6b', '6c']);
/** Meter als Kilometer mit Komma, z. B. 2450 → „2,45“. */
const km = (m: number) => String(m / 1000).replace('.', ',');
const kommaZahl = (x: number) => String(x).replace('.', ',');
/** Bruch aufstellen (ungekürzt auswählen) und dann vollständig kürzen. */
const bruchSchritte = (m: number, d: number, wrong: string[], explain: string): WStep[] => [
  { title: 'Bruch aufstellen', ask: 'Schreibe den Anteil als Bruch, noch ungekürzt.', calc: fr(m, d), pick: { ask: 'Welcher Bruch beschreibt den Anteil?', right: fr(m, d), wrong: wrong.filter((w, i, a) => w !== fr(m, d) && a.indexOf(w) === i) }, why: 'Oben steht der Teil, unten das Ganze.', explain },
  { title: 'Kürzen', ask: `Kürze ${fr(m, d)} vollständig.`, calc: fr(m, d), hint: `Der größte gemeinsame Teiler von ${m} und ${d} ist ${G(m, d)}.`, needReduced: true },
];
const prozentSchritt = (g: number | string, p: number, title: string, ask: string, unit: string): WStep => ({ title, ask, calc: `${g} · ${p} : 100`, wrong: [`${g} · ${p}`, `${g} : ${p}`], why: 'Prozentwert = Grundwert · p : 100.', unit });

/* ----- Punkt vor Strich ----- */
const PVS4: Story[] = [
  () => {
    const a = R(2, 6), b = R(2, 5), c = R(1, 4);
    return wordTask({
      prompt: `Lena kauft ${a} Hefte zu je ${b} € und einen Stift für ${c} €. Wie viel bezahlt sie insgesamt?`,
      steps: [
        { title: 'Preis für die Hefte', ask: `Wie viel kosten die ${a} Hefte zusammen?`, calc: `${a} · ${b}`, wrong: [`${a} + ${b}`, `${a} · ${c}`], why: 'Mehrere gleiche Dinge: Anzahl mal Preis.', unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel bezahlt Lena insgesamt?', calc: `${a * b} + ${c}`, wrong: [`${a * b} − ${c}`], why: 'Der Stift kommt dazu, also plus.', unit: '€' },
      ],
      term: `${c} + ${a} · ${b}`, unit: '€', sentence: v => `Lena bezahlt insgesamt ${v}.`,
    });
  },
  () => {
    const a = R(5, 12), b = R(2, 4), c = R(2, a * b - 2);
    return wordTask({
      prompt: `Ein Bus hat ${a} Sitzreihen mit je ${b} Plätzen. ${c} Plätze sind noch frei. Wie viele Plätze sind besetzt?`,
      steps: [
        { title: 'Alle Plätze', ask: 'Wie viele Plätze hat der Bus insgesamt?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Reihen mal Plätze pro Reihe.', unit: 'Plätze' },
        { title: 'Besetzte Plätze', ask: 'Wie viele Plätze sind besetzt?', calc: `${a * b} − ${c}`, wrong: [`${a * b} + ${c}`], why: 'Die freien Plätze ziehst du ab.', unit: 'Plätze' },
      ],
      term: `${a} · ${b} − ${c}`, unit: 'Plätze', sentence: v => `Im Bus sind ${v} besetzt.`,
    });
  },
  () => {
    const k = kid(), s = R(10, 40), w = R(2, 6), n = R(3, 10);
    return wordTask({
      prompt: `${k.n} hat schon ${s} € gespart. Ab jetzt legt ${k.er} jede Woche ${w} € dazu. Wie viel Geld hat ${k.n} nach ${n} Wochen?`,
      steps: [
        { title: 'Neues Geld', ask: `Wie viel Geld kommt in ${n} Wochen dazu?`, calc: `${n} · ${w}`, wrong: [`${n} + ${w}`, `${s} · ${w}`], why: 'Jede Woche gleich viel: Wochen mal Betrag.', unit: '€' },
        { title: 'Alles zusammen', ask: `Wie viel Geld hat ${k.n} dann?`, calc: `${s} + ${n * w}`, wrong: [`${s} · ${n * w}`], why: 'Das neue Geld kommt zum gesparten Geld dazu.', unit: '€' },
      ],
      term: `${s} + ${n} · ${w}`, unit: '€', sentence: v => `${k.n} hat nach ${n} Wochen ${v}.`,
    });
  },
  () => {
    const k = kid(), m = pick([30, 40, 50, 60, 80]), a = R(2, 4), b = R(6, 15);
    if (a * b >= m) return null;
    return wordTask({
      prompt: `${k.n} hat ${m} €. ${k.Er} kauft ${a} T-Shirts zu je ${b} €. Wie viel Geld bleibt ${k.ihm}?`,
      steps: [
        { title: 'Preis für die T-Shirts', ask: `Wie viel kosten die ${a} T-Shirts?`, calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Mehrere gleiche Dinge: Anzahl mal Preis.', unit: '€' },
        { title: 'Was übrig bleibt', ask: `Wie viel Geld bleibt ${k.n}?`, calc: `${m} − ${a * b}`, wrong: [`${m} + ${a * b}`], why: 'Das ausgegebene Geld ist weg: minus.', unit: '€' },
      ],
      term: `${m} − ${a} · ${b}`, unit: '€', sentence: v => `${k.n} bleiben ${v}.`,
    });
  },
  () => {
    const k = kid(), a = R(2, 5), b = pick([200, 400]), c = pick([50, 100, 150, 250, 300, 350]);
    return wordTask({
      prompt: `Beim Sportfest läuft ${k.n} ${a} Runden um den Sportplatz. Eine Runde ist ${b} m lang. Danach läuft ${k.er} noch ${c} m bis zum Zelt. Wie viele Meter läuft ${k.n} insgesamt?`,
      steps: [
        { title: 'Die Runden', ask: `Wie viele Meter sind ${a} Runden?`, calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Jede Runde ist gleich lang: Runden mal Länge.', unit: 'm' },
        { title: 'Ganze Strecke', ask: 'Wie viele Meter sind es insgesamt?', calc: `${a * b} + ${c}`, wrong: [`${a * b} − ${c}`], why: 'Das letzte Stück kommt dazu.', unit: 'm' },
      ],
      term: `${a} · ${b} + ${c}`, unit: 'm', sentence: v => `${k.n} läuft insgesamt ${v}.`,
    });
  },
  () => {
    const k = kid(), f = R(2, 5), n = f + 1, per = R(5, 9), P = n * per, d = R(1, 3);
    return wordTask({
      prompt: `${k.n} bestellt mit ${f} Freunden Pizza für zusammen ${P} €. Sie teilen den Preis gerecht. Dazu kauft jedes Kind noch ein Getränk für ${d} €. Wie viel zahlt jedes Kind insgesamt?`,
      steps: [
        { title: 'Pizza pro Kind', ask: 'Wie viel kostet die Pizza für jedes Kind?', calc: `${P} : ${n}`, wrong: [`${P} : ${f}`, `${P} · ${n}`], why: `Es sind ${n} Kinder, denn ${k.n} zählt mit.`, hint: `Vergiss ${k.n} nicht.`, unit: '€' },
        { title: 'Mit Getränk', ask: 'Wie viel zahlt jedes Kind insgesamt?', calc: `${per} + ${d}`, wrong: [`${per} · ${d}`], why: 'Das Getränk kommt dazu: plus.', unit: '€' },
      ],
      term: `${P} : ${n} + ${d}`, unit: '€', sentence: v => `Jedes Kind zahlt ${v}.`,
    });
  },
  () => {
    const k = kid(), a = R(2, 5), c = R(3, 15);
    return wordTask({
      prompt: `${k.n} backt für das Schulfest ${a} Bleche Muffins. Auf jedem Blech sind 12 Muffins. ${c} Muffins isst die Familie gleich selbst. Wie viele Muffins bleiben für das Schulfest?`,
      steps: [
        { title: 'Alle Muffins', ask: 'Wie viele Muffins sind es insgesamt?', calc: `${a} · 12`, wrong: [`${a} + 12`], why: 'Bleche mal Muffins pro Blech.', unit: 'Muffins' },
        { title: 'Für das Schulfest', ask: 'Wie viele Muffins bleiben übrig?', calc: `${a * 12} − ${c}`, wrong: [`${a * 12} + ${c}`], why: 'Die gegessenen Muffins ziehst du ab.', unit: 'Muffins' },
      ],
      term: `${a} · 12 − ${c}`, unit: 'Muffins', sentence: v => `Für das Schulfest bleiben ${v}.`,
    });
  },
];
const PVS5: Story[] = [
  () => {
    const a = R(2, 5), b = R(1, 3), c = R(2, 4), d = R(2, 3), m = pick([20, 30, 50]);
    return wordTask({
      prompt: `Tim hat ${m} €. Er kauft ${a} Kugeln Eis zu je ${b} € und ${c} Getränke zu je ${d} €. Wie viel Geld bleibt ihm übrig?`,
      steps: [
        { title: 'Preis für das Eis', ask: 'Wie viel kostet das Eis?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], unit: '€' },
        { title: 'Preis für die Getränke', ask: 'Wie viel kosten die Getränke?', calc: `${c} · ${d}`, wrong: [`${c} + ${d}`], unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel muss Tim insgesamt bezahlen?', calc: `${a * b} + ${c * d}`, unit: '€' },
        { title: 'Was übrig bleibt', ask: 'Wie viel Geld bleibt Tim?', calc: `${m} − ${a * b + c * d}`, wrong: [`${m} + ${a * b + c * d}`], why: 'Was er ausgibt, ist danach weg: minus.', unit: '€' },
      ],
      term: `${m} − (${a} · ${b} + ${c} · ${d})`, unit: '€', sentence: v => `Tim bleiben ${v}.`,
    });
  },
  () => {
    const n = R(20, 28), e = R(3, 8), k = R(5, 12), B = n * k;
    return wordTask({
      prompt: `${n} Kinder machen einen Ausflug in den Zoo. Der Eintritt kostet ${e} € pro Kind. Der Bus kostet zusammen ${B} €. Alle Kosten werden gerecht geteilt. Wie viel zahlt jedes Kind?`,
      steps: [
        { title: 'Eintritt für alle', ask: 'Wie viel kostet der Eintritt für alle Kinder zusammen?', calc: `${n} · ${e}`, wrong: [`${n} + ${e}`], unit: '€' },
        { title: 'Gesamtkosten', ask: 'Wie viel kostet der Ausflug insgesamt?', calc: `${n * e} + ${B}`, unit: '€' },
        { title: 'Pro Kind', ask: 'Wie viel zahlt jedes Kind?', calc: `${n * e + B} : ${n}`, wrong: [`${n * e + B} · ${n}`, `${n * e + B} − ${n}`], why: 'Gerecht teilen heißt: durch die Anzahl der Kinder teilen.', unit: '€' },
      ],
      term: `(${n} · ${e} + ${B}) : ${n}`, unit: '€', sentence: v => `Jedes Kind zahlt ${v}.`,
    });
  },
  () => {
    const k = kid(), e1 = R(8, 12), e2 = R(5, 7), nk = R(2, 4), p = R(4, 8);
    return wordTask({
      prompt: `Die Familie von ${k.n} geht ins Kino: 2 Erwachsene und ${nk} Kinder. Eine Karte für Erwachsene kostet ${e1} €, eine Kinderkarte ${e2} €. Dazu kauft die Familie eine große Tüte Popcorn für ${p} €. Wie viel bezahlt die Familie insgesamt?`,
      steps: [
        { title: 'Karten für Erwachsene', ask: 'Wie viel kosten die 2 Karten für Erwachsene?', calc: `2 · ${e1}`, wrong: [`2 + ${e1}`], unit: '€' },
        { title: 'Kinderkarten', ask: `Wie viel kosten die ${nk} Kinderkarten?`, calc: `${nk} · ${e2}`, wrong: [`${nk} + ${e2}`], unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel bezahlt die Familie mit dem Popcorn?', calc: `${2 * e1} + ${nk * e2} + ${p}`, wrong: [`${2 * e1} + ${nk * e2} − ${p}`], why: 'Das Popcorn kommt dazu: plus.', unit: '€' },
      ],
      term: `2 · ${e1} + ${nk} · ${e2} + ${p}`, unit: '€', sentence: v => `Die Familie bezahlt insgesamt ${v}.`,
    });
  },
  () => {
    const k = kid(), s = R(20, 60), a = R(3, 6), b = pick([5, 6, 8, 10]), c = R(5, 15);
    return wordTask({
      prompt: `${k.n} sammelt Sticker und hat schon ${s} Stück. ${k.Er} kauft ${a} Päckchen mit je ${b} Stickern. ${c} Sticker sind doppelt, die verschenkt ${k.er}. Wie viele Sticker hat ${k.n} jetzt?`,
      steps: [
        { title: 'Neue Sticker', ask: `Wie viele Sticker sind in den ${a} Päckchen?`, calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Päckchen mal Sticker pro Päckchen.', unit: 'Sticker' },
        { title: 'Alle Sticker', ask: `Wie viele Sticker hat ${k.n} mit den neuen?`, calc: `${s} + ${a * b}`, unit: 'Sticker' },
        { title: 'Nach dem Verschenken', ask: 'Wie viele Sticker bleiben?', calc: `${s + a * b} − ${c}`, wrong: [`${s + a * b} + ${c}`], why: 'Verschenkte Sticker sind weg: minus.', unit: 'Sticker' },
      ],
      term: `${s} + ${a} · ${b} − ${c}`, unit: 'Sticker', sentence: v => `${k.n} hat jetzt ${v}.`,
    });
  },
  () => {
    const k = kid(), h = 5 * R(8, 18), g = pick([20, 25, 30, 40, 50]), w = pick([5, 10, 15]), n = R(4, 10), P = h + g + w * n;
    return wordTask({
      prompt: `${k.n} möchte ein Fahrrad für ${P} € kaufen. ${k.Er} hat schon ${h} € gespart. Oma schenkt ${k.ihm} ${g} €. Den Rest spart ${k.er} mit ${w} € pro Woche. Wie viele Wochen muss ${k.n} noch sparen?`,
      steps: [
        { title: 'Geld, das schon da ist', ask: `Wie viel Geld hat ${k.n} mit dem Geschenk?`, calc: `${h} + ${g}`, wrong: [`${h} − ${g}`], unit: '€' },
        { title: 'Was noch fehlt', ask: 'Wie viel Geld fehlt noch?', calc: `${P} − ${h + g}`, wrong: [`${P} + ${h + g}`], why: 'Preis minus das Geld, das schon da ist.', unit: '€' },
        { title: 'Anzahl der Wochen', ask: 'Wie viele Wochen muss noch gespart werden?', calc: `${P - h - g} : ${w}`, wrong: [`${P - h - g} · ${w}`, `${P - h - g} − ${w}`], why: `Wie oft passen ${w} € in den Rest? Das ist geteilt.`, unit: 'Wochen' },
      ],
      term: `(${P} − ${h} − ${g}) : ${w}`, unit: 'Wochen', sentence: v => `${k.n} muss noch ${v} sparen.`,
    });
  },
  () => {
    const t = pick([4, 5, 6]), k = R(24, 29), x = R(2, 9), da = 3 * k - x;
    if (da % t) return null;
    return wordTask({
      prompt: `Beim Sporttag machen die Klassen 5a, 5b und 5c mit. Jede Klasse hat ${k} Kinder. ${x} Kinder sind krank und fehlen. Die anderen bilden Mannschaften mit je ${t} Kindern. Wie viele Mannschaften gibt es?`,
      steps: [
        { title: 'Alle Kinder', ask: 'Wie viele Kinder sind in den drei Klassen?', calc: `3 · ${k}`, wrong: [`3 + ${k}`], why: 'Drei Klassen, jede gleich groß: mal.', unit: 'Kinder' },
        { title: 'Kinder beim Sporttag', ask: 'Wie viele Kinder sind da?', calc: `${3 * k} − ${x}`, wrong: [`${3 * k} + ${x}`], why: 'Die kranken Kinder fehlen: minus.', unit: 'Kinder' },
        { title: 'Mannschaften', ask: 'Wie viele Mannschaften gibt es?', calc: `${da} : ${t}`, wrong: [`${da} · ${t}`, `${da} − ${t}`], why: `Immer ${t} Kinder bilden eine Mannschaft: geteilt.`, unit: 'Mannschaften' },
      ],
      term: `(3 · ${k} − ${x}) : ${t}`, unit: 'Mannschaften', sentence: v => `Es gibt ${v}.`,
    });
  },
  () => {
    const k = kid(), a = R(4, 10), b = R(1, 3), c = R(2, 6), d = R(3, 6), m = pick([5, 8, 10, 12]), e = a * b + c * d;
    return wordTask({
      prompt: `${k.n} verkauft auf dem Flohmarkt ${a} Bücher zu je ${b} € und ${c} Spiele zu je ${d} €. Der Platz für den Stand kostet ${m} €. Wie viel Geld verdient ${k.n} am Ende wirklich?`,
      steps: [
        { title: 'Geld für die Bücher', ask: 'Wie viel bringen die Bücher?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], unit: '€' },
        { title: 'Geld für die Spiele', ask: 'Wie viel bringen die Spiele?', calc: `${c} · ${d}`, wrong: [`${c} + ${d}`], unit: '€' },
        { title: 'Einnahmen', ask: 'Wie viel Geld nimmt der Stand zusammen ein?', calc: `${a * b} + ${c * d}`, unit: '€' },
        { title: 'Was übrig bleibt', ask: 'Wie viel bleibt nach der Platzmiete?', calc: `${e} − ${m}`, wrong: [`${e} + ${m}`], why: 'Die Miete für den Stand geht wieder weg: minus.', unit: '€' },
      ],
      term: `${a} · ${b} + ${c} · ${d} − ${m}`, unit: '€', sentence: v => `${k.n} verdient ${v}.`,
    });
  },
];

/* ----- Brüche kürzen ----- */
const KUERZEN4: Story[] = [
  () => {
    const d = R(20, 32), n = R(4, d - 4), g = G(n, d);
    if (g === 1) return null;
    return wordTask({
      prompt: `In einer Klasse sind ${d} Kinder. ${n} davon haben ein Haustier. Welcher Anteil der Klasse hat ein Haustier? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Bruch aufstellen', ask: 'Schreibe den Anteil als Bruch, noch ungekürzt.', calc: fr(n, d), pick: { ask: 'Welcher Bruch beschreibt den Anteil?', right: fr(n, d), wrong: [fr(d, n), fr(n, d - n)] }, why: 'Oben steht der Teil, unten das Ganze.', explain: `Teil durch Ganzes: ${n} von ${d} Kindern.` },
        { title: 'Kürzen', ask: `Kürze ${fr(n, d)} vollständig.`, calc: fr(n, d), hint: `Der größte gemeinsame Teiler von ${n} und ${d} ist ${g}.`, needReduced: true },
      ],
      sentence: v => `${v} der Klasse hat ein Haustier.`,
    });
  },
  () => {
    const k = kid(), d = pick([12, 15, 18, 20, 24, 30]), n = R(2, d - 2);
    if (G(n, d) === 1) return null;
    return wordTask({
      prompt: `Eine Tafel Schokolade hat ${d} Stücke. ${k.n} isst ${n} Stücke davon. Welcher Anteil der Tafel ist das? Gib den Bruch vollständig gekürzt an.`,
      steps: bruchSchritte(n, d, [fr(d, n), fr(n, d - n)], `Teil durch Ganzes: ${n} von ${d} Stücken.`),
      sentence: v => `${k.n} isst ${v} der Tafel.`,
    });
  },
  () => {
    const k = kid(), n = 5 * R(1, 11), inst = pick(['Klavier', 'Gitarre', 'Flöte']);
    return wordTask({
      prompt: `${k.n} übt ${n} Minuten ${inst}. Eine Stunde hat 60 Minuten. Welcher Anteil einer Stunde ist das? Gib den Bruch vollständig gekürzt an.`,
      steps: bruchSchritte(n, 60, [fr(60, n), fr(n, 100)], `Teil durch Ganzes: ${n} von 60 Minuten.`),
      sentence: v => `${k.n} übt ${v} Stunde ${inst}.`,
    });
  },
  () => {
    const k = kid(), d = R(10, 30), n = R(3, d - 2);
    if (G(n, d) === 1) return null;
    return wordTask({
      prompt: `${k.n} schießt beim Training ${d}-mal aufs Tor. ${n}-mal trifft ${k.er}. Welcher Anteil der Schüsse sind Treffer? Gib den Bruch vollständig gekürzt an.`,
      steps: bruchSchritte(n, d, [fr(d, n), fr(n, d - n)], `Teil durch Ganzes: ${n} von ${d} Schüssen.`),
      sentence: v => `${v} der Schüsse sind Treffer.`,
    });
  },
  () => {
    const d = R(20, 48), n = R(4, Math.floor(d / 2)), f = pick(['rot', 'grün', 'gelb', 'weiß']);
    if (G(n, d) === 1) return null;
    return wordTask({
      prompt: `In einer Tüte sind ${d} Gummibärchen. ${n} davon sind ${f}. Welcher Anteil der Gummibärchen ist ${f}? Gib den Bruch vollständig gekürzt an.`,
      steps: bruchSchritte(n, d, [fr(d, n), fr(n, d - n)], `Teil durch Ganzes: ${n} von ${d} Gummibärchen.`),
      sentence: v => `${v} der Gummibärchen sind ${f}.`,
    });
  },
  () => {
    const k = kid(), d = pick([80, 96, 100, 120, 144, 150, 160, 180, 200, 240]), r = pick([2, 3, 4, 5, 6, 8, 10, 12].filter(x => d % x === 0)), n = (d / r) * R(1, r - 1);
    return wordTask({
      prompt: `${k.n} liest ein Buch mit ${d} Seiten. ${k.Er} hat schon ${n} Seiten gelesen. Welcher Anteil des Buches ist das? Gib den Bruch vollständig gekürzt an.`,
      steps: bruchSchritte(n, d, [fr(d, n), fr(n, d - n)], `Teil durch Ganzes: ${n} von ${d} Seiten.`),
      sentence: v => `${k.n} hat ${v} des Buches gelesen.`,
    });
  },
];
const KUERZEN5: Story[] = [
  () => {
    const d = R(24, 60), n = R(4, d - 6), m = d - n, g = G(m, d);
    if (g === 1) return null;
    return wordTask({
      prompt: `Bei einer Tombola gibt es ${d} Lose. ${n} davon sind Gewinne, der Rest sind Nieten. Welcher Anteil der Lose sind Nieten? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Nieten zählen', ask: 'Wie viele Lose sind Nieten?', calc: `${d} − ${n}`, wrong: [`${d} + ${n}`], why: 'Alle Lose ohne die Gewinne.' },
        { title: 'Bruch aufstellen', ask: 'Schreibe den Anteil der Nieten als Bruch, noch ungekürzt.', calc: fr(m, d), pick: { ask: 'Welcher Bruch passt?', right: fr(m, d), wrong: [fr(n, d), fr(m, n)] }, why: 'Teil (Nieten) durch Ganzes (alle Lose).', explain: `${m} von ${d} Losen sind Nieten.` },
        { title: 'Kürzen', ask: `Kürze ${fr(m, d)} vollständig.`, calc: fr(m, d), hint: `Der größte gemeinsame Teiler von ${m} und ${d} ist ${g}.`, needReduced: true },
      ],
      sentence: v => `${v} der Lose sind Nieten.`,
    });
  },
  () => {
    const a = R(8, 16), b = R(8, 16), d = a + b, c = klasse();
    if (G(a, d) === 1) return null;
    return wordTask({
      prompt: `In der Klasse ${c} sind ${a} Mädchen und ${b} Jungen. Welcher Anteil der Klasse sind Mädchen? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Alle Kinder', ask: 'Wie viele Kinder sind in der Klasse?', calc: `${a} + ${b}`, wrong: [`${a} · ${b}`], why: 'Mädchen und Jungen zusammen sind die ganze Klasse.', unit: 'Kinder' },
        ...bruchSchritte(a, d, [fr(a, b), fr(b, d)], `${a} von ${d} Kindern sind Mädchen.`),
      ],
      sentence: v => `${v} der Klasse sind Mädchen.`,
    });
  },
  () => {
    const k = kid(), d = R(18, 34), w = R(5, d - 8), u = R(2, 6), l = d - w - u;
    if (l < 2 || G(l, d) === 1) return null;
    return wordTask({
      prompt: `Der Fußballverein von ${k.n} hat in dieser Saison ${d} Spiele gespielt. ${w} Spiele hat er gewonnen, ${u} Spiele endeten unentschieden. Die anderen Spiele hat er verloren. Welcher Anteil der Spiele wurde verloren? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Nicht verloren', ask: 'Wie viele Spiele wurden gewonnen oder endeten unentschieden?', calc: `${w} + ${u}`, wrong: [`${w} · ${u}`], why: 'Erst zählst du alle Spiele, die nicht verloren wurden.', unit: 'Spiele' },
        { title: 'Verlorene Spiele', ask: 'Wie viele Spiele wurden verloren?', calc: `${d} − ${w + u}`, wrong: [`${d} + ${w + u}`], why: 'Alle Spiele ohne die gewonnenen und unentschiedenen.', unit: 'Spiele' },
        ...bruchSchritte(l, d, [fr(w, d), fr(l, w + u)], `${l} von ${d} Spielen wurden verloren.`),
      ],
      sentence: v => `${v} der Spiele wurden verloren.`,
    });
  },
  () => {
    const k = kid(), s = R(8, 10), sc = R(5, 8), r = 24 - s - sc;
    if (G(r, 24) === 1) return null;
    return wordTask({
      prompt: `Ein Tag hat 24 Stunden. ${k.n} schläft ${s} Stunden. ${sc} Stunden ist ${k.er} in der Schule oder auf dem Schulweg. Welcher Anteil des Tages bleibt für alles andere? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Schlaf und Schule', ask: 'Wie viele Stunden sind Schlaf und Schule zusammen?', calc: `${s} + ${sc}`, wrong: [`${s} · ${sc}`], unit: 'h' },
        { title: 'Freie Stunden', ask: 'Wie viele Stunden bleiben übrig?', calc: `24 − ${s + sc}`, wrong: [`24 + ${s + sc}`], why: 'Der ganze Tag ohne Schlaf und Schule.', unit: 'h' },
        ...bruchSchritte(r, 24, [fr(24, r), fr(r, s + sc)], `${r} von 24 Stunden bleiben übrig.`),
      ],
      sentence: v => `Für alles andere bleibt ${v} des Tages.`,
    });
  },
  () => {
    const a = R(2, 5), per = pick([10, 12, 15, 20]), d = a * per, f = R(3, Math.floor(d / 3));
    if (G(f, d) === 1) return null;
    return wordTask({
      prompt: `Ein Obsthändler hat ${a} Kisten mit je ${per} Äpfeln. ${f} Äpfel sind faul. Welcher Anteil der Äpfel ist faul? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Alle Äpfel', ask: 'Wie viele Äpfel sind es insgesamt?', calc: `${a} · ${per}`, wrong: [`${a} + ${per}`], why: 'Kisten mal Äpfel pro Kiste.', unit: 'Äpfel' },
        ...bruchSchritte(f, d, [fr(f, per), fr(d, f)], `${f} von ${d} Äpfeln sind faul.`),
      ],
      sentence: v => `${v} der Äpfel sind faul.`,
    });
  },
  () => {
    const r = R(8, 14), d = 4 * r, b = R(Math.ceil(d / 3), d - 3), f = d - b;
    if (G(f, d) === 1) return null;
    return wordTask({
      prompt: `Ein Reisebus hat ${r} Sitzreihen mit je 4 Plätzen. ${b} Plätze sind besetzt. Welcher Anteil der Plätze ist noch frei? Gib den Bruch vollständig gekürzt an.`,
      steps: [
        { title: 'Alle Plätze', ask: 'Wie viele Plätze hat der Bus?', calc: `${r} · 4`, wrong: [`${r} + 4`], why: 'Reihen mal Plätze pro Reihe.', unit: 'Plätze' },
        { title: 'Freie Plätze', ask: 'Wie viele Plätze sind frei?', calc: `${d} − ${b}`, wrong: [`${d} + ${b}`], why: 'Alle Plätze ohne die besetzten.', unit: 'Plätze' },
        ...bruchSchritte(f, d, [fr(b, d), fr(f, b)], `${f} von ${d} Plätzen sind frei.`),
      ],
      sentence: v => `${v} der Plätze sind noch frei.`,
    });
  },
];

/* ----- Brüche addieren ----- */
interface BrAdd { a: number; b: number; c: number; d: number; s: Q; hn: WStep }
const plus = (f: BrAdd, ask: string, unit?: string): WStep => ({ title: 'Zusammenzählen', ask, calc: `${fr(f.a, f.b)} + ${fr(f.c, f.d)}`, wrong: [`${fr(f.a, f.b)} − ${fr(f.c, f.d)}`, `${fr(f.a, f.b)} · ${fr(f.c, f.d)}`], why: 'Zusammen heißt plus.', unit, needReduced: true });
const rest = (f: BrAdd): WStep => ({ title: 'Was übrig ist', ask: 'Wie viel ist noch übrig? Das Ganze ist 1.', calc: `1 − ${f.s.txt()}`, wrong: [`1 + ${f.s.txt()}`], why: 'Vom Ganzen (1) ziehst du ab, was weg ist.', needReduced: true });
const BRADD4: ((f: BrAdd) => Word)[] = [
  f => wordTask({
    prompt: `Mia isst ${fr(f.a, f.b)} einer Pizza, Ben isst ${fr(f.c, f.d)} davon. Wie viel von der Pizza haben die beiden zusammen gegessen?`,
    steps: [f.hn, plus(f, 'Wie viel haben beide zusammen gegessen? Kürze, wenn es geht.')],
    sentence: v => `Zusammen haben sie ${v} der Pizza gegessen.`,
  }),
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} trinkt am Morgen ${fr(f.a, f.b)} Liter Saft und am Nachmittag ${fr(f.c, f.d)} Liter. Wie viele Liter trinkt ${k.er} insgesamt?`,
    steps: [f.hn, plus(f, `Wie viele Liter trinkt ${k.n} zusammen? Kürze, wenn es geht.`, 'l')],
    unit: 'l', sentence: v => `${k.n} trinkt insgesamt ${v} Saft.`,
  }); },
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} geht zuerst ${fr(f.a, f.b)} km bis zum Bäcker. Dann geht ${k.er} noch ${fr(f.c, f.d)} km bis zur Schule. Wie lang ist der ganze Weg?`,
    steps: [f.hn, plus(f, 'Wie lang ist der ganze Weg? Kürze, wenn es geht.', 'km')],
    unit: 'km', sentence: v => `Der ganze Weg ist ${v} lang.`,
  }); },
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} übt ${fr(f.a, f.b)} Stunde Gitarre und danach ${fr(f.c, f.d)} Stunde für die Mathearbeit. Wie lange übt ${k.er} insgesamt? Gib das Ergebnis als Bruchteil einer Stunde an.`,
    steps: [f.hn, plus(f, `Wie lange übt ${k.n} zusammen? Kürze, wenn es geht.`)],
    sentence: v => `${k.n} übt insgesamt ${v} Stunde.`,
  }); },
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} backt einen Kuchen und Kekse. Für den Kuchen braucht ${k.er} ${fr(f.a, f.b)} kg Mehl, für die Kekse ${fr(f.c, f.d)} kg. Wie viel Mehl braucht ${k.er} insgesamt?`,
    steps: [f.hn, plus(f, 'Wie viel Mehl ist das zusammen? Kürze, wenn es geht.', 'kg')],
    unit: 'kg', sentence: v => `${k.n} braucht ${v} Mehl.`,
  }); },
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} hilft beim Streichen des Gartenzauns. Am Samstag schafft ${k.er} ${fr(f.a, f.b)} des Zauns, am Sonntag noch ${fr(f.c, f.d)}. Welchen Teil des Zauns hat ${k.n} schon gestrichen?`,
    steps: [f.hn, plus(f, 'Welcher Teil ist an beiden Tagen zusammen gestrichen? Kürze, wenn es geht.')],
    sentence: v => `${k.n} hat schon ${v} des Zauns gestrichen.`,
  }); },
];
const BRADD5: ((f: BrAdd) => Word)[] = [
  f => wordTask({
    prompt: `Ein Kuchen wird verteilt. Oma bekommt ${fr(f.a, f.b)} davon, Opa ${fr(f.c, f.d)}. Wie viel vom Kuchen ist danach noch übrig?`,
    steps: [
      f.hn,
      { title: 'Verteilter Teil', ask: 'Wie viel vom Kuchen wurde zusammen verteilt? Kürze, wenn es geht.', calc: `${fr(f.a, f.b)} + ${fr(f.c, f.d)}`, wrong: [`${fr(f.a, f.b)} − ${fr(f.c, f.d)}`], needReduced: true },
      { title: 'Was übrig ist', ask: 'Wie viel ist noch übrig? Der ganze Kuchen ist 1.', calc: `1 − ${f.s.txt()}`, wrong: [`1 + ${f.s.txt()}`], why: 'Vom Ganzen (1) ziehst du ab, was weg ist.', needReduced: true },
    ],
    sentence: v => `Es ist noch ${v} vom Kuchen übrig.`,
  }),
  f => { const k = kid(); return wordTask({
    prompt: `${k.n} gibt ${fr(f.a, f.b)} des Taschengelds für ein Buch aus und ${fr(f.c, f.d)} für Süßigkeiten. Welcher Teil des Taschengelds bleibt übrig?`,
    steps: [f.hn, plus(f, 'Welcher Teil wurde zusammen ausgegeben? Kürze, wenn es geht.'), rest(f)],
    sentence: v => `Es bleibt ${v} des Taschengelds übrig.`,
  }); },
  f => wordTask({
    prompt: `In der Klasse ${klasse()} kommen ${fr(f.a, f.b)} der Kinder mit dem Rad zur Schule und ${fr(f.c, f.d)} mit dem Bus. Die anderen gehen zu Fuß. Welcher Anteil der Klasse geht zu Fuß?`,
    steps: [f.hn, plus(f, 'Welcher Anteil kommt mit Rad oder Bus? Kürze, wenn es geht.'), rest(f)],
    sentence: v => `${v} der Klasse geht zu Fuß.`,
  }),
  f => { const k = kid(); return wordTask({
    prompt: `Die Familie von ${k.n} wandert auf einen Berg. Bis zur ersten Pause schafft sie ${fr(f.a, f.b)} des Weges, danach noch ${fr(f.c, f.d)}. Dann gibt es ein Picknick. Welcher Teil des Weges fehlt noch bis zum Gipfel?`,
    steps: [f.hn, plus(f, 'Welcher Teil des Weges ist schon geschafft? Kürze, wenn es geht.'), rest(f)],
    sentence: v => `Bis zum Gipfel fehlt noch ${v} des Weges.`,
  }); },
  f => { const k = kid(); return wordTask({
    prompt: `Das Tablet von ${k.n} ist voll geladen. Ein Film verbraucht ${fr(f.a, f.b)} des Akkus, ein Spiel danach noch ${fr(f.c, f.d)}. Welcher Teil des Akkus ist noch übrig?`,
    steps: [f.hn, plus(f, 'Welcher Teil des Akkus wurde zusammen verbraucht? Kürze, wenn es geht.'), rest(f)],
    sentence: v => `Es ist noch ${v} des Akkus übrig.`,
  }); },
  f => wordTask({
    prompt: `Opa teilt sein Beet auf. Auf ${fr(f.a, f.b)} pflanzt er Tomaten, auf ${fr(f.c, f.d)} Salat. Auf den Rest kommen Kräuter. Welcher Teil des Beetes ist für die Kräuter?`,
    steps: [f.hn, plus(f, 'Welcher Teil ist für Tomaten und Salat? Kürze, wenn es geht.'), rest(f)],
    sentence: v => `${v} des Beetes ist für die Kräuter.`,
  }),
];

/* ----- Brüche multiplizieren und dividieren ----- */
const BRMUL4: Story[] = [
  () => {
    const [a, b] = pick([[3, 4], [2, 3], [1, 2], [3, 8], [2, 5]]), k = R(2, 5);
    return wordTask({
      prompt: `Für ein Rezept brauchst du ${fr(a, b)} Liter Milch. Du willst die ${k}-fache Menge backen. Wie viele Liter Milch brauchst du?`,
      steps: [{ title: 'Rechnen', ask: 'Wie viele Liter Milch brauchst du? Kürze, wenn es geht.', calc: `${fr(a, b)} · ${k}`, wrong: [`${fr(a, b)} + ${k}`, `${fr(a, b)} : ${k}`], why: 'Die k-fache Menge heißt: mal k.', unit: 'l', needReduced: true }],
      sentence: v => `Du brauchst ${v} Milch.`,
    });
  },
  () => {
    const N = R(2, 6), k = pick([2, 3, 4, 5]);
    return wordTask({
      prompt: `Du hast ${N} Liter Saft. Du füllst ihn in Gläser, in die jeweils ${fr(1, k)} Liter passt. Wie viele Gläser kannst du füllen?`,
      steps: [{ title: 'Rechnen', ask: 'Wie viele Gläser werden voll?', calc: `${N} : ${fr(1, k)}`, wrong: [`${N} · ${fr(1, k)}`, `${N} − ${fr(1, k)}`], why: 'Wie oft passt ein Glas in den Saft? Das ist eine Geteilt-Aufgabe.', hint: 'Durch einen Bruch teilen heißt: mit dem Kehrwert malnehmen.' }],
      sentence: v => `Du kannst ${v} Gläser füllen.`,
    });
  },
  () => {
    const k = kid(), [a, b] = pick([[3, 8], [1, 4], [1, 2], [1, 3], [2, 5], [1, 5], [1, 6]]), n = R(2, 4), t = q(a, b).mul(q(n)), m = Math.ceil(a * n / b) + R(0, 1);
    if (m > 3) return null;
    return wordTask({
      prompt: `Für eine Portion Pfannkuchen-Teig braucht man ${fr(a, b)} Liter Milch. ${k.n} macht ${n} Portionen. Im Kühlschrank stehen ${m} Liter Milch. Wie viel Milch bleibt übrig?`,
      steps: [
        { title: 'Milch für den Teig', ask: `Wie viele Liter Milch braucht ${k.n}? Kürze, wenn es geht.`, calc: `${fr(a, b)} · ${n}`, wrong: [`${fr(a, b)} + ${n}`, `${fr(a, b)} : ${n}`], why: 'Mehrere gleiche Portionen: mal.', unit: 'l', needReduced: true },
        { title: 'Was übrig bleibt', ask: 'Wie viel Milch bleibt übrig? Kürze, wenn es geht.', calc: `${m} − ${t.txt()}`, wrong: [`${m} + ${t.txt()}`], why: 'Die Milch für den Teig ist weg: minus.', unit: 'l', needReduced: true },
      ],
      unit: 'l', sentence: v => `Im Kühlschrank sind danach noch ${v} Milch.`,
    });
  },
  () => {
    const [a, b] = pick([[3, 4], [2, 3], [4, 5], [5, 6], [1, 2]]), [c, d] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]]), N = R(20, 30), cl = klasse();
    if ((N * a) % b) return null;
    const n1 = (N * a) / b;
    if ((n1 * c) % d) return null;
    return wordTask({
      prompt: `In der Klasse ${cl} sind ${N} Kinder. ${fr(a, b)} davon haben ein Fahrrad. Von diesen Kindern fahren ${fr(c, d)} jeden Tag mit dem Rad zur Schule. Wie viele Kinder fahren mit dem Rad zur Schule?`,
      steps: [
        { title: 'Kinder mit Fahrrad', ask: `Wie viele Kinder sind ${fr(a, b)} von ${N}?`, calc: `${N} · ${fr(a, b)}`, wrong: [`${N} : ${fr(a, b)}`, `${N} + ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: 'Kinder' },
        { title: 'Mit dem Rad zur Schule', ask: `Wie viele Kinder sind ${fr(c, d)} von ${n1}?`, calc: `${n1} · ${fr(c, d)}`, wrong: [`${N} · ${fr(c, d)}`], why: `Der zweite Bruch gehört nur zu den ${n1} Kindern mit Fahrrad.`, unit: 'Kinder' },
      ],
      term: `${N} · ${fr(a, b)} · ${fr(c, d)}`, unit: 'Kinder', sentence: v => `${v} fahren mit dem Rad zur Schule.`,
    });
  },
  () => {
    const k = kid(), [a, b] = pick([[3, 4], [1, 2], [2, 3]]), n = R(2, 6), g = pick([4, 5, 6, 8]), t = q(a, b).mul(q(n));
    if (!t.div(q(1, g)).isInt()) return null;
    return wordTask({
      prompt: `${k.n} hat ${n} Flaschen mit je ${fr(a, b)} Liter Saft. ${k.Er} füllt den Saft in Gläser. In jedes Glas passt ${fr(1, g)} Liter. Wie viele Gläser kann ${k.n} füllen?`,
      steps: [
        { title: 'Saft insgesamt', ask: 'Wie viele Liter Saft sind es insgesamt? Kürze, wenn es geht.', calc: `${n} · ${fr(a, b)}`, wrong: [`${n} + ${fr(a, b)}`], why: 'Mehrere gleiche Flaschen: mal.', unit: 'l', needReduced: true },
        { title: 'Gläser füllen', ask: 'Wie viele Gläser werden voll?', calc: `${t.txt()} : ${fr(1, g)}`, wrong: [`${t.txt()} · ${fr(1, g)}`], why: 'Wie oft passt ein Glas in den Saft? Das ist geteilt.', hint: 'Durch einen Bruch teilen heißt: mit dem Kehrwert malnehmen.', unit: 'Gläser' },
      ],
      unit: 'Gläser', sentence: v => `${k.n} kann ${v} füllen.`,
    });
  },
  () => {
    const k = kid(), [a, b] = pick([[1, 2], [3, 4], [1, 4], [2, 3], [1, 3]]), [c, d] = pick([[1, 2], [1, 4], [3, 4], [1, 3]]), n = R(3, 5), t = q(a, b).mul(q(n));
    return wordTask({
      prompt: `An ${n} Tagen macht ${k.n} jeweils ${fr(a, b)} Stunde Hausaufgaben. Am Samstag lernt ${k.er} noch ${fr(c, d)} Stunde für einen Test. Wie viele Stunden lernt ${k.n} in dieser Woche?`,
      steps: [
        { title: 'Die Schultage', ask: `Wie viele Stunden sind ${n} mal ${fr(a, b)} Stunde? Kürze, wenn es geht.`, calc: `${n} · ${fr(a, b)}`, wrong: [`${n} + ${fr(a, b)}`], why: 'Jeden Tag gleich lang: mal.', unit: 'h', needReduced: true },
        { title: 'Mit dem Samstag', ask: 'Wie viele Stunden sind es mit dem Samstag? Kürze, wenn es geht.', calc: `${t.txt()} + ${fr(c, d)}`, wrong: [`${t.txt()} · ${fr(c, d)}`], why: 'Die Zeit am Samstag kommt dazu: plus.', unit: 'h', needReduced: true },
      ],
      unit: 'h', sentence: v => `${k.n} lernt in dieser Woche ${v}.`,
    });
  },
  () => {
    const k = kid(), [a, b] = pick([[3, 4], [2, 3], [4, 5], [1, 2]]), P = R(8, 30), n = R(2, 4);
    if (P % b) return null;
    const np = (P * a) / b;
    return wordTask({
      prompt: `Ein Buch kostet ${P} €. Im Angebot kostet es nur noch ${fr(a, b)} vom alten Preis. ${k.n} kauft ${n} Bücher im Angebot. Wie viel bezahlt ${k.er}?`,
      steps: [
        { title: 'Angebotspreis', ask: `Wie viel sind ${fr(a, b)} von ${P} €?`, calc: `${P} · ${fr(a, b)}`, wrong: [`${P} : ${fr(a, b)}`, `${P} − ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: '€' },
        { title: 'Alle Bücher', ask: `Wie viel kosten ${n} Bücher im Angebot?`, calc: `${np} · ${n}`, wrong: [`${np} + ${n}`, `${P} · ${n}`], why: 'Mehrere Bücher zum Angebotspreis: mal.', unit: '€' },
      ],
      term: `${P} · ${fr(a, b)} · ${n}`, unit: '€', sentence: v => `${k.n} bezahlt ${v}.`,
    });
  },
];
const BRMUL5: Story[] = [
  () => {
    const [a, b] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [1, 3], [1, 4], [4, 5], [3, 8], [5, 8]]), S = b * R(2, 10);
    if (S > 60) return null;
    return wordTask({
      prompt: `Paul wohnt ${S} km von seiner Oma entfernt. ${fr(a, b)} der Strecke fährt er mit dem Bus, den Rest fährt er mit dem Rad. Wie viele Kilometer fährt er mit dem Rad?`,
      steps: [
        { title: 'Strecke mit dem Bus', ask: `Wie viele Kilometer sind ${fr(a, b)} von ${S} km?`, calc: `${S} · ${fr(a, b)}`, wrong: [`${S} : ${fr(a, b)}`, `${S} + ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: 'km' },
        { title: 'Strecke mit dem Rad', ask: 'Wie viele Kilometer bleiben für das Rad?', calc: `${S} − ${(S * a) / b}`, wrong: [`${S} + ${(S * a) / b}`], why: 'Der Rest ist die ganze Strecke ohne den Bus-Teil.', unit: 'km' },
      ],
      term: `${S} − ${S} · ${fr(a, b)}`, unit: 'km', sentence: v => `Paul fährt ${v} mit dem Rad.`,
    });
  },
  () => {
    const b = pick([3, 4, 5, 6, 8, 10]), d = pick([3, 4, 5, 6, 8, 10].filter(x => x !== b)), T = L(b, d) * R(1, 12), cl = klasse();
    if (T < 40 || T > 300) return null;
    const x = T / b, y = T / d;
    return wordTask({
      prompt: `In der Klassenkasse der ${cl} sind ${T} €. ${fr(1, b)} davon gibt die Klasse für einen Ausflug aus, ${fr(1, d)} für Bastelmaterial. Wie viel Geld bleibt in der Kasse?`,
      steps: [
        { title: 'Geld für den Ausflug', ask: `Wie viel sind ${fr(1, b)} von ${T} €?`, calc: `${T} · ${fr(1, b)}`, wrong: [`${T} : ${fr(1, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: '€' },
        { title: 'Geld für Bastelmaterial', ask: `Wie viel sind ${fr(1, d)} von ${T} €?`, calc: `${T} · ${fr(1, d)}`, wrong: [`${T} : ${fr(1, d)}`], unit: '€' },
        { title: 'Ausgaben zusammen', ask: 'Wie viel gibt die Klasse insgesamt aus?', calc: `${x} + ${y}`, unit: '€' },
        { title: 'Was übrig bleibt', ask: 'Wie viel bleibt in der Kasse?', calc: `${T} − ${x + y}`, wrong: [`${T} + ${x + y}`], why: 'Das ausgegebene Geld ist weg: minus.', unit: '€' },
      ],
      term: `${T} − ${T} · ${fr(1, b)} − ${T} · ${fr(1, d)}`, unit: '€', sentence: v => `In der Kasse bleiben ${v}.`,
    });
  },
  () => {
    const k = kid(), it = pick(['Sticker', 'Murmeln', 'Sammelkarten']), [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5]]), [c, d] = pick([[1, 2], [1, 3], [1, 4], [1, 6], [2, 3]]), N = R(20, 60);
    if (N % b) return null;
    const x = (N * a) / b, r1 = N - x;
    if ((r1 * c) % d) return null;
    const y = (r1 * c) / d;
    return wordTask({
      prompt: `${k.n} hat ${N} ${it}. ${fr(a, b)} davon schenkt ${k.er} ${k.seinem} Bruder. Von den übrigen ${it} gibt ${k.er} ${fr(c, d)} an eine Freundin. Wie viele ${it} hat ${k.n} noch?`,
      steps: [
        { title: 'Für den Bruder', ask: `Wie viele sind ${fr(a, b)} von ${N}?`, calc: `${N} · ${fr(a, b)}`, wrong: [`${N} : ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: it },
        { title: 'Was übrig ist', ask: 'Wie viele bleiben nach dem Geschenk für den Bruder?', calc: `${N} − ${x}`, wrong: [`${N} + ${x}`], unit: it },
        { title: 'Für die Freundin', ask: `Wie viele sind ${fr(c, d)} vom Rest?`, calc: `${r1} · ${fr(c, d)}`, wrong: [`${N} · ${fr(c, d)}`], why: 'Der zweite Bruch bezieht sich nur auf den Rest.', unit: it },
        { title: 'Am Ende', ask: `Wie viele ${it} hat ${k.n} noch?`, calc: `${r1} − ${y}`, wrong: [`${r1} + ${y}`], unit: it },
      ],
      unit: it, sentence: v => `${k.n} hat noch ${v}.`,
    });
  },
  () => {
    const k = kid(), P = pick([2, 4]), f = R(2, 4), T = P * f, [a, b] = pick([[1, 2], [3, 4], [1, 4]]), [c, d] = pick([[1, 8], [1, 4], [1, 5]]);
    const n1 = q(a, b).mul(q(f)), n2 = q(c, d).mul(q(f));
    return wordTask({
      prompt: `Ein Rezept für Nudelauflauf für ${P} Personen braucht ${fr(a, b)} kg Nudeln und ${fr(c, d)} kg Käse. ${k.n} kocht für ${T} Personen. Wie viele Kilogramm Nudeln und Käse braucht ${k.er} zusammen?`,
      steps: [
        { title: 'Wievielfache Menge', ask: `Wie oft passen ${P} Personen in ${T} Personen?`, calc: `${T} : ${P}`, wrong: [`${T} − ${P}`], why: 'So oft musst du das Rezept nehmen.' },
        { title: 'Nudeln', ask: 'Wie viele Kilogramm Nudeln braucht man? Kürze, wenn es geht.', calc: `${fr(a, b)} · ${f}`, wrong: [`${fr(a, b)} + ${f}`], why: `Die ${f}-fache Menge heißt: mal ${f}.`, unit: 'kg', needReduced: true },
        { title: 'Käse', ask: 'Wie viele Kilogramm Käse braucht man? Kürze, wenn es geht.', calc: `${fr(c, d)} · ${f}`, wrong: [`${fr(c, d)} + ${f}`], unit: 'kg', needReduced: true },
        { title: 'Zusammen', ask: 'Wie viele Kilogramm sind Nudeln und Käse zusammen? Kürze, wenn es geht.', calc: `${n1.txt()} + ${n2.txt()}`, unit: 'kg', needReduced: true },
      ],
      unit: 'kg', sentence: v => `${k.n} braucht zusammen ${v} Nudeln und Käse.`,
    });
  },
  () => {
    const k = kid(), a = R(2, 6), b = R(2, 6), g = pick([4, 8]), x = q(3, 4).mul(q(a)), y = q(1, 2).mul(q(b)), s = x.add(y);
    return wordTask({
      prompt: `Für das Klassenfest gibt es ${a} Flaschen Apfelsaft mit je ${fr(3, 4)} Liter und ${b} Flaschen Orangensaft mit je ${fr(1, 2)} Liter. ${k.n} füllt den Saft in Becher. In einen Becher passen ${fr(1, g)} Liter. Wie viele Becher kann ${k.n} füllen?`,
      steps: [
        { title: 'Apfelsaft', ask: 'Wie viele Liter Apfelsaft sind es? Kürze, wenn es geht.', calc: `${a} · ${fr(3, 4)}`, wrong: [`${a} + ${fr(3, 4)}`], unit: 'l', needReduced: true },
        { title: 'Orangensaft', ask: 'Wie viele Liter Orangensaft sind es? Kürze, wenn es geht.', calc: `${b} · ${fr(1, 2)}`, wrong: [`${b} + ${fr(1, 2)}`], unit: 'l', needReduced: true },
        { title: 'Saft zusammen', ask: 'Wie viele Liter Saft sind es zusammen? Kürze, wenn es geht.', calc: `${x.txt()} + ${y.txt()}`, unit: 'l', needReduced: true },
        { title: 'Becher füllen', ask: 'Wie viele Becher werden voll?', calc: `${s.txt()} : ${fr(1, g)}`, wrong: [`${s.txt()} · ${fr(1, g)}`], why: 'Wie oft passt ein Becher in den Saft? Das ist geteilt.', hint: 'Durch einen Bruch teilen heißt: mit dem Kehrwert malnehmen.', unit: 'Becher' },
      ],
      unit: 'Becher', sentence: v => `${k.n} kann ${v} füllen.`,
    });
  },
  () => {
    const k = kid(), w = pick([4, 5, 6, 8, 10, 12]), [a, b] = pick([[1, 2], [3, 4], [1, 4], [2, 3], [1, 3], [2, 5], [3, 5]]), n = R(4, 10), price = pick([25, 30, 35, 40, 45, 50, 60]);
    if ((w * a) % b) return null;
    const pw = (w * a) / b, tot = pw * n;
    return wordTask({
      prompt: `${k.n} bekommt jede Woche ${w} € Taschengeld. ${fr(a, b)} davon spart ${k.er}. ${k.Er} möchte sich ein Spiel für ${price} € kaufen. Wie viel Geld fehlt ${k.ihm} nach ${n} Wochen noch?`,
      steps: [
        { title: 'Pro Woche gespart', ask: `Wie viel sind ${fr(a, b)} von ${w} €?`, calc: `${w} · ${fr(a, b)}`, wrong: [`${w} : ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: '€' },
        { title: `Nach ${n} Wochen`, ask: `Wie viel hat ${k.n} nach ${n} Wochen gespart?`, calc: `${pw} · ${n}`, wrong: [`${pw} + ${n}`], unit: '€' },
        { title: 'Was noch fehlt', ask: 'Wie viel Geld fehlt noch für das Spiel?', calc: `${price} − ${tot}`, wrong: [`${price} + ${tot}`], why: 'Preis minus das gesparte Geld.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} fehlen noch ${v}.`,
    });
  },
];

/* ----- Dezimalzahlen ----- */
const DEZ4: Story[] = [
  () => {
    const p1 = R(105, 499), p2 = R(105, 499), pay = p1 + p2 < 500 ? 5 : 10;
    return wordTask({
      prompt: `Du kaufst ein Brot für ${eur(p1)} € und Milch für ${eur(p2)} €. Du bezahlst mit einem ${pay}-€-Schein. Wie viel Rückgeld bekommst du?`,
      steps: [
        { title: 'Alles zusammen', ask: 'Wie viel kostet der Einkauf?', calc: `${eur(p1)} + ${eur(p2)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
        { title: 'Rückgeld', ask: 'Wie viel Rückgeld bekommst du?', calc: `${pay} − ${eur(p1 + p2)}`, wrong: [`${pay} + ${eur(p1 + p2)}`], why: 'Rückgeld = bezahlt minus Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `Du bekommst ${v} zurück.`,
    });
  },
  () => {
    const k = kid(), n = R(3, 8), p = R(25, 65), t = n * p, pay = t < 200 ? 2 : t < 500 ? 5 : 10;
    return wordTask({
      prompt: `${k.n} kauft beim Bäcker ${n} Brötchen zu je ${eur(p)} €. ${k.Er} bezahlt mit ${pay === 2 ? 'einer 2-€-Münze' : `einem ${pay}-€-Schein`}. Wie viel Rückgeld bekommt ${k.er}?`,
      steps: [
        { title: 'Preis für die Brötchen', ask: 'Wie viel kosten die Brötchen?', calc: `${n} · ${eur(p)}`, wrong: [`${n} + ${eur(p)}`], why: 'Mehrere gleiche Dinge: Anzahl mal Preis.', unit: '€' },
        { title: 'Rückgeld', ask: 'Wie viel Rückgeld gibt es?', calc: `${pay} − ${eur(t)}`, wrong: [`${pay} + ${eur(t)}`], why: 'Rückgeld = bezahlt minus Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bekommt ${v} zurück.`,
    });
  },
  () => {
    const k = kid(), h = R(128, 152), g = R(3, 9), F = R(170, 195);
    return wordTask({
      prompt: `${k.n} ist ${eur(h)} m groß. In einem Jahr wächst ${k.er} um ${eur(g)} m. Der Vater von ${k.n} ist ${eur(F)} m groß. Wie viel kleiner als der Vater ist ${k.n} nach einem Jahr?`,
      steps: [
        { title: 'Größe nach einem Jahr', ask: `Wie groß ist ${k.n} nach einem Jahr?`, calc: `${eur(h)} + ${eur(g)}`, wrong: [`${eur(h)} − ${eur(g)}`], why: 'Wer wächst, wird größer: plus.', hint: 'Komma unter Komma schreiben.', unit: 'm' },
        { title: 'Unterschied', ask: 'Wie groß ist der Unterschied zum Vater?', calc: `${eur(F)} − ${eur(h + g)}`, wrong: [`${eur(F)} + ${eur(h + g)}`], why: 'Den Unterschied findest du mit minus.', unit: 'm' },
      ],
      unit: 'm', sentence: v => `${k.n} ist dann noch ${v} kleiner als der Vater.`,
    });
  },
  () => {
    const k = kid(), a = 100 * R(8, 35), b = 50 * R(10, 60);
    return wordTask({
      prompt: `${k.n} fährt mit dem Rad ${km(a)} km zur Schule. Nach der Schule fährt ${k.er} ${km(b)} km weiter zum Training. Am Abend fährt ${k.er} den ganzen Weg wieder zurück. Wie viele Kilometer fährt ${k.n} an diesem Tag?`,
      steps: [
        { title: 'Hinweg', ask: 'Wie lang ist der Weg bis zum Training?', calc: `${km(a)} + ${km(b)}`, hint: 'Komma unter Komma schreiben.', unit: 'km' },
        { title: 'Hin und zurück', ask: 'Wie viele Kilometer sind es hin und zurück?', calc: `${km(a + b)} · 2`, wrong: [`${km(a + b)} + 2`], why: 'Hin und zurück ist der Weg zweimal.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `${k.n} fährt an diesem Tag ${v}.`,
    });
  },
  () => {
    const k = kid(), s = R(500, 2500), g = 50 * R(4, 20), p = R(300, s + g - 50);
    return wordTask({
      prompt: `Im Sparschwein von ${k.n} sind ${eur(s)} €. Oma schenkt ${k.ihm} ${eur(g)} €. Dann kauft ${k.n} ein Buch für ${eur(p)} €. Wie viel Geld hat ${k.n} jetzt noch?`,
      steps: [
        { title: 'Mit dem Geschenk', ask: 'Wie viel Geld ist es mit dem Geschenk von Oma?', calc: `${eur(s)} + ${eur(g)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
        { title: 'Nach dem Kauf', ask: 'Wie viel Geld bleibt nach dem Kauf?', calc: `${eur(s + g)} − ${eur(p)}`, wrong: [`${eur(s + g)} + ${eur(p)}`], why: 'Das Geld für das Buch ist weg: minus.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} hat jetzt noch ${v}.`,
    });
  },
  () => {
    const k = kid(), p = R(149, 399), n = R(2, 4), m = R(149, 349), fruit = pick(['Äpfel', 'Birnen', 'Tomaten']), extra = pick(['eine Melone', 'eine Ananas', 'einen Salat']);
    return wordTask({
      prompt: `1 kg ${fruit} kostet ${eur(p)} €. ${k.n} kauft ${n} kg ${fruit} und ${extra} für ${eur(m)} €. Wie viel bezahlt ${k.er} insgesamt?`,
      steps: [
        { title: `Preis für die ${fruit}`, ask: `Wie viel kosten ${n} kg ${fruit}?`, calc: `${n} · ${eur(p)}`, wrong: [`${n} + ${eur(p)}`], why: 'Kilogramm mal Preis pro Kilogramm.', unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel kostet alles zusammen?', calc: `${eur(n * p)} + ${eur(m)}`, wrong: [`${eur(n * p)} − ${eur(m)}`], hint: 'Komma unter Komma schreiben.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bezahlt insgesamt ${v}.`,
    });
  },
];
const DEZ5: Story[] = [
  () => {
    const a = R(2, 4), x = R(55, 249), b = R(2, 3), y = R(35, 149), sum = a * x + b * y;
    if (sum >= 1000) return null;
    return wordTask({
      prompt: `Für die Schule kaufst du ${a} Hefte zu je ${eur(x)} € und ${b} Stifte zu je ${eur(y)} €. Du bezahlst mit 10 €. Wie viel Rückgeld bekommst du?`,
      steps: [
        { title: 'Preis für die Hefte', ask: 'Wie viel kosten die Hefte?', calc: `${a} · ${eur(x)}`, wrong: [`${a} + ${eur(x)}`], unit: '€' },
        { title: 'Preis für die Stifte', ask: 'Wie viel kosten die Stifte?', calc: `${b} · ${eur(y)}`, wrong: [`${b} + ${eur(y)}`], unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel kostet alles zusammen?', calc: `${eur(a * x)} + ${eur(b * y)}`, unit: '€' },
        { title: 'Rückgeld', ask: 'Wie viel Rückgeld bekommst du?', calc: `10 − ${eur(sum)}`, wrong: [`10 + ${eur(sum)}`], unit: '€' },
      ],
      unit: '€', sentence: v => `Du bekommst ${v} zurück.`,
    });
  },
  () => {
    const k = kid(), a = R(2, 4), x = R(99, 199), b = R(2, 5), y = R(79, 149), z = R(99, 249), sum = a * x + b * y + z, pay = sum < 1000 ? 10 : 20;
    return wordTask({
      prompt: `${k.n} kauft für das Klassenfest ein: ${a} Packungen Saft zu je ${eur(x)} €, ${b} Tüten Chips zu je ${eur(y)} € und Becher für ${eur(z)} €. ${k.Er} bezahlt mit einem ${pay}-€-Schein. Wie viel Rückgeld bekommt ${k.er}?`,
      steps: [
        { title: 'Preis für den Saft', ask: 'Wie viel kostet der Saft?', calc: `${a} · ${eur(x)}`, wrong: [`${a} + ${eur(x)}`], unit: '€' },
        { title: 'Preis für die Chips', ask: 'Wie viel kosten die Chips?', calc: `${b} · ${eur(y)}`, wrong: [`${b} + ${eur(y)}`], unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel kostet der ganze Einkauf?', calc: `${eur(a * x)} + ${eur(b * y)} + ${eur(z)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
        { title: 'Rückgeld', ask: 'Wie viel Rückgeld gibt es?', calc: `${pay} − ${eur(sum)}`, wrong: [`${pay} + ${eur(sum)}`], why: 'Rückgeld = bezahlt minus Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bekommt ${v} zurück.`,
    });
  },
  () => {
    const fam = pick(['Yilmaz', 'Müller', 'Schneider', 'Nowak', 'Weber', 'Becker']), e1 = 100 * R(8, 11) + pick([0, 50]), e2 = 100 * R(5, 7) + pick([0, 50]), nk = R(2, 3), gut = pick([5, 10]);
    return wordTask({
      prompt: `Familie ${fam} geht ins Kino: 2 Erwachsene und ${nk} Kinder. Eine Karte für Erwachsene kostet ${eur(e1)} €, eine Kinderkarte ${eur(e2)} €. Die Familie hat einen Gutschein über ${gut} €. Wie viel muss sie noch bezahlen?`,
      steps: [
        { title: 'Karten für Erwachsene', ask: 'Wie viel kosten die 2 Karten für Erwachsene?', calc: `2 · ${eur(e1)}`, wrong: [`2 + ${eur(e1)}`], unit: '€' },
        { title: 'Kinderkarten', ask: `Wie viel kosten die ${nk} Kinderkarten?`, calc: `${nk} · ${eur(e2)}`, wrong: [`${nk} + ${eur(e2)}`], unit: '€' },
        { title: 'Alle Karten', ask: 'Wie viel kosten alle Karten zusammen?', calc: `${eur(2 * e1)} + ${eur(nk * e2)}`, unit: '€' },
        { title: 'Mit Gutschein', ask: 'Wie viel muss die Familie mit dem Gutschein noch bezahlen?', calc: `${eur(2 * e1 + nk * e2)} − ${gut}`, wrong: [`${eur(2 * e1 + nk * e2)} + ${gut}`], why: 'Der Gutschein wird abgezogen.', unit: '€' },
      ],
      unit: '€', sentence: v => `Familie ${fam} muss noch ${v} bezahlen.`,
    });
  },
  () => {
    const k = kid(), a = pick([1.5, 2, 2.5]), p = R(180, 420), b = pick([0.5, 1, 1.5]), p2 = R(250, 550), fa = pick(['Äpfel', 'Kartoffeln', 'Birnen']), fb = pick(['Trauben', 'Kirschen', 'Erdbeeren']);
    const x = a * p, y = b * p2, pay = x + y < 1000 ? 10 : 20;
    if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
    return wordTask({
      prompt: `Auf dem Markt kauft ${k.n} ${kommaZahl(a)} kg ${fa} für ${eur(p)} € pro kg und ${kommaZahl(b)} kg ${fb} für ${eur(p2)} € pro kg. ${k.Er} bezahlt mit einem ${pay}-€-Schein. Wie viel Rückgeld bekommt ${k.er}?`,
      steps: [
        { title: `Preis für die ${fa}`, ask: `Wie viel kosten ${kommaZahl(a)} kg ${fa}?`, calc: `${kommaZahl(a)} · ${eur(p)}`, wrong: [`${kommaZahl(a)} + ${eur(p)}`], why: 'Kilogramm mal Preis pro Kilogramm.', unit: '€' },
        { title: `Preis für die ${fb}`, ask: `Wie viel kosten ${kommaZahl(b)} kg ${fb}?`, calc: `${kommaZahl(b)} · ${eur(p2)}`, wrong: [`${kommaZahl(b)} + ${eur(p2)}`], unit: '€' },
        { title: 'Alles zusammen', ask: 'Wie viel kostet der Einkauf?', calc: `${eur(x)} + ${eur(y)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
        { title: 'Rückgeld', ask: 'Wie viel Rückgeld gibt es?', calc: `${pay} − ${eur(x + y)}`, wrong: [`${pay} + ${eur(x + y)}`], why: 'Rückgeld = bezahlt minus Preis.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bekommt ${v} zurück.`,
    });
  },
  () => {
    const k = kid(), mo = 100 * R(15, 30), mi = 50 * R(20, 60), Z = pick([12, 15]), tot = 3 * mo + mi;
    return wordTask({
      prompt: `${k.n} trainiert für einen Lauf. Am Montag läuft ${k.er} ${km(mo)} km, am Mittwoch ${km(mi)} km. Am Freitag läuft ${k.er} doppelt so weit wie am Montag. ${k.Sein} Ziel sind ${Z} km in der Woche. Wie viele Kilometer fehlen noch?`,
      steps: [
        { title: 'Freitag', ask: `Wie weit läuft ${k.n} am Freitag?`, calc: `${km(mo)} · 2`, wrong: [`${km(mo)} + 2`], why: 'Doppelt so weit heißt: mal 2.', unit: 'km' },
        { title: 'Die ganze Woche', ask: 'Wie viele Kilometer sind es an allen drei Tagen?', calc: `${km(mo)} + ${km(mi)} + ${km(2 * mo)}`, hint: 'Komma unter Komma schreiben.', unit: 'km' },
        { title: 'Was noch fehlt', ask: 'Wie viele Kilometer fehlen bis zum Ziel?', calc: `${Z} − ${km(tot)}`, wrong: [`${Z} + ${km(tot)}`], why: 'Ziel minus die gelaufene Strecke.', unit: 'km' },
      ],
      unit: 'km', sentence: v => `Bis zum Ziel fehlen noch ${v}.`,
    });
  },
  () => {
    const k = kid(), w = pick([250, 300, 350, 400, 450, 500]), p1 = R(499, 999), p2 = R(150, 350);
    if (p1 + p2 >= 4 * w) return null;
    return wordTask({
      prompt: `${k.n} bekommt 4 Wochen lang je ${eur(w)} € Taschengeld. Davon kauft ${k.er} ein Buch für ${eur(p1)} € und eine Zeitschrift für ${eur(p2)} €. Wie viel Geld bleibt ${k.ihm}?`,
      steps: [
        { title: 'Taschengeld für 4 Wochen', ask: 'Wie viel Taschengeld ist das zusammen?', calc: `4 · ${eur(w)}`, wrong: [`4 + ${eur(w)}`], unit: '€' },
        { title: 'Ausgaben', ask: 'Wie viel kosten Buch und Zeitschrift zusammen?', calc: `${eur(p1)} + ${eur(p2)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
        { title: 'Was übrig bleibt', ask: 'Wie viel Geld bleibt übrig?', calc: `${eur(4 * w)} − ${eur(p1 + p2)}`, wrong: [`${eur(4 * w)} + ${eur(p1 + p2)}`], why: 'Das ausgegebene Geld ist weg: minus.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bleiben ${v}.`,
    });
  },
];

/* ----- Prozent ----- */
const PROZ4: Story[] = [
  () => {
    const Gw = pick([20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 160, 180, 200, 240, 250, 300]), p = pick([10, 20, 25, 30, 40, 50]), one = q(Gw).div(q(100)), W = one.mul(q(p));
    return wordTask({
      prompt: `Eine Jacke kostet ${Gw} €. Im Sommerschlussverkauf gibt es ${p} % Rabatt. Wie viel kostet die Jacke jetzt?`,
      steps: [
        { title: 'Erst 1 % ausrechnen', ask: `Wie viel Euro ist 1 % von ${Gw} €?`, calc: `${Gw} : 100`, wrong: [`${Gw} · 100`], why: '100 % sind der ganze Preis. Für 1 % teilst du durch 100.', unit: '€' },
        { title: `Dann ${p} % ausrechnen`, ask: `Wie viel Euro Rabatt sind ${p} %?`, calc: `${p} · ${dec(one)}`, wrong: [`${p} + ${dec(one)}`], unit: '€' },
        { title: 'Neuer Preis', ask: 'Wie viel kostet die Jacke jetzt?', calc: `${Gw} − ${dec(W)}`, wrong: [`${Gw} + ${dec(W)}`], why: 'Rabatt wird abgezogen.', unit: '€' },
      ],
      unit: '€', sentence: v => `Die Jacke kostet jetzt ${v}.`,
    });
  },
  () => {
    const N = pick([20, 24, 25, 28, 30, 32]), p = pick([10, 20, 25, 30, 40, 50, 60, 75]), x = (N * p) / 100;
    if (!Number.isInteger(x)) return null;
    return wordTask({
      prompt: `In der Klasse ${klasse()} sind ${N} Kinder. ${p} % davon fahren mit dem Bus zur Schule. Wie viele Kinder fahren nicht mit dem Bus?`,
      steps: [
        prozentSchritt(N, p, 'Kinder im Bus', `Wie viele Kinder sind ${p} % von ${N}?`, 'Kinder'),
        { title: 'Nicht mit dem Bus', ask: 'Wie viele Kinder fahren nicht mit dem Bus?', calc: `${N} − ${x}`, wrong: [`${N} + ${x}`], why: 'Alle Kinder ohne die Bus-Kinder.', unit: 'Kinder' },
      ],
      unit: 'Kinder', sentence: v => `${v} fahren nicht mit dem Bus.`,
    });
  },
  () => {
    const k = kid(), T = pick([10, 15, 20, 25, 30, 40]), p = pick([10, 20, 25, 50]), x = q(T * p, 100);
    return wordTask({
      prompt: `${k.n} bekommt ${T} € Taschengeld im Monat. Zum Geburtstag erhöhen die Eltern das Taschengeld um ${p} %. Wie viel Taschengeld bekommt ${k.n} jetzt?`,
      steps: [
        prozentSchritt(T, p, 'Erhöhung', `Um wie viel Euro steigt das Taschengeld? (${p} % von ${T} €)`, '€'),
        { title: 'Neues Taschengeld', ask: 'Wie viel Taschengeld gibt es jetzt?', calc: `${T} + ${dec(x)}`, wrong: [`${T} − ${dec(x)}`], why: 'Eine Erhöhung kommt dazu: plus.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bekommt jetzt ${v}.`,
    });
  },
  () => {
    const g = pick([250, 375, 400, 500, 750, 1000]), p = pick([10, 20, 25, 30, 50]), x = (g * p) / 100, w = pick(['Müsli', 'Haferflocken', 'Nudeln']);
    if (!Number.isInteger(x)) return null;
    return wordTask({
      prompt: `Eine Packung ${w} enthält normalerweise ${g} g. Jetzt gibt es ${p} % mehr Inhalt gratis. Wie viel Gramm sind jetzt in der Packung?`,
      steps: [
        prozentSchritt(g, p, 'Extra-Inhalt', `Wie viel Gramm sind ${p} % von ${g} g?`, 'g'),
        { title: 'Neuer Inhalt', ask: 'Wie viel Gramm sind jetzt in der Packung?', calc: `${g} + ${x}`, wrong: [`${g} − ${x}`], why: 'Der Extra-Inhalt kommt dazu: plus.', unit: 'g' },
      ],
      unit: 'g', sentence: v => `Jetzt sind ${v} in der Packung.`,
    });
  },
  () => {
    const S = pick([400, 500, 600, 800, 1000, 1200]), p = pick([60, 70, 75, 80, 85, 90, 95]), x = (S * p) / 100, ev = pick(['das Konzert', 'die Zaubershow', 'das Musical']);
    return wordTask({
      prompt: `Eine Halle hat ${S} Plätze. Für ${ev} sind schon ${p} % der Karten verkauft. Wie viele Karten gibt es noch?`,
      steps: [
        prozentSchritt(S, p, 'Verkaufte Karten', `Wie viele Karten sind ${p} % von ${S}?`, 'Karten'),
        { title: 'Freie Karten', ask: 'Wie viele Karten gibt es noch?', calc: `${S} − ${x}`, wrong: [`${S} + ${x}`], why: 'Alle Plätze ohne die verkauften Karten.', unit: 'Karten' },
      ],
      unit: 'Karten', sentence: v => `Es gibt noch ${v}.`,
    });
  },
  () => {
    const k = kid(), K = pick([100, 150, 200, 250, 300, 400, 500]), p = pick([1, 2, 3]), x = q(K * p, 100);
    return wordTask({
      prompt: `${k.n} hat ${K} € auf dem Sparbuch. Nach einem Jahr bekommt ${k.er} ${p} % Zinsen dazu. Wie viel Geld ist dann auf dem Sparbuch?`,
      steps: [
        prozentSchritt(K, p, 'Zinsen', `Wie viel Euro sind ${p} % von ${K} €?`, '€'),
        { title: 'Neuer Betrag', ask: 'Wie viel Geld ist dann auf dem Sparbuch?', calc: `${K} + ${dec(x)}`, wrong: [`${K} − ${dec(x)}`], why: 'Die Zinsen kommen dazu: plus.', unit: '€' },
      ],
      unit: '€', sentence: v => `Auf dem Sparbuch sind dann ${v}.`,
    });
  },
];
const PROZ5: Story[] = [
  () => {
    const Gw = pick([80, 100, 120, 150, 160, 200, 240, 250, 300, 400]), p = pick([5, 10, 20, 25, 50]), r = pick([10, 20, 25]);
    const up = q(Gw).mul(q(p)).div(q(100)), N = q(Gw).add(up), down = N.mul(q(r)).div(q(100));
    return wordTask({
      prompt: `Ein Fahrrad kostet ${Gw} €. Der Preis steigt um ${p} %. Später gibt es auf den neuen Preis ${r} % Rabatt. Was kostet das Fahrrad am Ende?`,
      steps: [
        { title: 'Preiserhöhung', ask: `Um wie viel Euro steigt der Preis? (${p} % von ${Gw} €)`, calc: `${Gw} · ${p} : 100`, wrong: [`${Gw} · ${p}`, `${Gw} : ${p}`], why: 'Prozentwert = Grundwert · p : 100.', unit: '€' },
        { title: 'Neuer Preis', ask: 'Wie viel kostet das Fahrrad nach der Erhöhung?', calc: `${Gw} + ${dec(up)}`, unit: '€' },
        { title: 'Rabatt', ask: `Wie viel Euro sind ${r} % vom neuen Preis?`, calc: `${dec(N)} · ${r} : 100`, wrong: [`${Gw} · ${r} : 100`], why: 'Der Rabatt bezieht sich auf den neuen Preis.', unit: '€' },
        { title: 'Endpreis', ask: 'Was kostet das Fahrrad am Ende?', calc: `${dec(N)} − ${dec(down)}`, unit: '€' },
      ],
      unit: '€', sentence: v => `Das Fahrrad kostet am Ende ${v}.`,
    });
  },
  () => {
    const N = pick([20, 24, 25, 28, 30, 32]), p1 = pick([10, 20, 25, 30, 40, 50]), p2 = pick([10, 20, 25, 30, 40]), x = (N * p1) / 100, y = (N * p2) / 100;
    if (p1 === p2 || p1 + p2 >= 100 || !Number.isInteger(x) || !Number.isInteger(y)) return null;
    return wordTask({
      prompt: `In der Klasse ${klasse()} sind ${N} Kinder. ${p1} % spielen in einem Fußballverein, ${p2} % gehen zum Schwimmen. Die anderen machen keinen Vereinssport. Wie viele Kinder machen keinen Vereinssport?`,
      steps: [
        prozentSchritt(N, p1, 'Fußball', `Wie viele Kinder sind ${p1} % von ${N}?`, 'Kinder'),
        prozentSchritt(N, p2, 'Schwimmen', `Wie viele Kinder sind ${p2} % von ${N}?`, 'Kinder'),
        { title: 'Mit Vereinssport', ask: 'Wie viele Kinder machen Vereinssport?', calc: `${x} + ${y}`, unit: 'Kinder' },
        { title: 'Ohne Vereinssport', ask: 'Wie viele Kinder machen keinen Vereinssport?', calc: `${N} − ${x + y}`, wrong: [`${N} + ${x + y}`], why: 'Alle Kinder ohne die Kinder im Verein.', unit: 'Kinder' },
      ],
      unit: 'Kinder', sentence: v => `${v} machen keinen Vereinssport.`,
    });
  },
  () => {
    const k = kid(), h = R(25, 45), t = R(8, 20), r = pick([10, 20, 25, 30]), s = h + t, x = q(s * r, 100);
    return wordTask({
      prompt: `${k.n} kauft eine Hose für ${h} € und ein T-Shirt für ${t} €. An der Kasse gibt es auf alles ${r} % Rabatt. Wie viel bezahlt ${k.n}?`,
      steps: [
        { title: 'Preis ohne Rabatt', ask: 'Wie viel kosten Hose und T-Shirt zusammen?', calc: `${h} + ${t}`, unit: '€' },
        prozentSchritt(s, r, 'Rabatt', `Wie viel Euro sind ${r} % von ${s} €?`, '€'),
        { title: 'Neuer Preis', ask: `Wie viel bezahlt ${k.n}?`, calc: `${s} − ${dec(x)}`, wrong: [`${s} + ${dec(x)}`], why: 'Rabatt wird abgezogen.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} bezahlt ${v}.`,
    });
  },
  () => {
    const C = pick([150, 160, 180, 200, 220, 240, 250, 280, 300]), a = pick([10, 20, 25, 30]), n = pick([2, 3, 4, 5]), x = q(C * a, 100), r = q(C).sub(x);
    return wordTask({
      prompt: `Die Klassenfahrt kostet ${C} € pro Kind. ${a} % davon zahlt man gleich als Anzahlung. Den Rest zahlt man in ${n} gleichen Raten. Wie viel Euro ist eine Rate?`,
      steps: [
        prozentSchritt(C, a, 'Anzahlung', `Wie viel Euro sind ${a} % von ${C} €?`, '€'),
        { title: 'Rest', ask: 'Wie viel Euro bleiben nach der Anzahlung?', calc: `${C} − ${dec(x)}`, wrong: [`${C} + ${dec(x)}`], why: 'Die Anzahlung ist schon bezahlt: minus.', unit: '€' },
        { title: 'Eine Rate', ask: 'Wie viel Euro ist eine Rate?', calc: `${dec(r)} : ${n}`, wrong: [`${dec(r)} · ${n}`], why: `Der Rest wird in ${n} gleiche Teile geteilt.`, unit: '€' },
      ],
      unit: '€', sentence: v => `Eine Rate ist ${v}.`,
    });
  },
  () => {
    const k = kid(), V = pick([400, 500, 600, 800, 1000, 1200]), p = pick([50, 60, 70, 75, 80, 90]), f = (V * p) / 100;
    if (!Number.isInteger(f) || V - f < 40) return null;
    const A = 10 * R(2, Math.floor((V - f) / 10) - 1);
    return wordTask({
      prompt: `Ein Planschbecken fasst ${V} Liter Wasser. Es ist zu ${p} % gefüllt. ${k.n} füllt mit dem Gartenschlauch noch ${A} Liter nach. Wie viele Liter fehlen noch, bis das Becken voll ist?`,
      steps: [
        prozentSchritt(V, p, 'Wasser im Becken', `Wie viele Liter sind ${p} % von ${V} Litern?`, 'l'),
        { title: 'Nach dem Nachfüllen', ask: 'Wie viele Liter sind nach dem Nachfüllen im Becken?', calc: `${f} + ${A}`, unit: 'l' },
        { title: 'Was noch fehlt', ask: 'Wie viele Liter fehlen noch?', calc: `${V} − ${f + A}`, wrong: [`${V} + ${f + A}`], why: 'Ganzes Becken minus das Wasser, das schon drin ist.', unit: 'l' },
      ],
      unit: 'l', sentence: v => `Es fehlen noch ${v}.`,
    });
  },
  () => {
    const k = kid(), P = pick([20, 30, 40, 50, 60, 70]), r = pick([10, 20, 25, 50]), g = pick([5, 10]), x = q(P * r, 100), n = q(P).sub(x);
    return wordTask({
      prompt: `Ein Videospiel kostet ${P} €. Heute gibt es ${r} % Rabatt. ${k.n} hat außerdem einen Gutschein über ${g} €. Wie viel muss ${k.n} noch bezahlen?`,
      steps: [
        prozentSchritt(P, r, 'Rabatt', `Wie viel Euro sind ${r} % von ${P} €?`, '€'),
        { title: 'Preis mit Rabatt', ask: 'Wie viel kostet das Spiel mit Rabatt?', calc: `${P} − ${dec(x)}`, wrong: [`${P} + ${dec(x)}`], why: 'Rabatt wird abgezogen.', unit: '€' },
        { title: 'Mit Gutschein', ask: 'Wie viel muss noch bezahlt werden?', calc: `${dec(n)} − ${g}`, wrong: [`${dec(n)} + ${g}`], why: 'Der Gutschein wird auch abgezogen.', unit: '€' },
      ],
      unit: '€', sentence: v => `${k.n} muss noch ${v} bezahlen.`,
    });
  },
];

export const TEXT: Record<string, (level: number) => Word | null> = {
  pvs: level => tryGen(() => pick(level === 4 ? PVS4 : PVS5)(), nice),

  kuerzen: level => tryGen(() => pick(level === 4 ? KUERZEN4 : KUERZEN5)()),

  bradd: level => tryGen(() => {
    const D = [2, 3, 4, 5, 6, 8, 10, 12];
    const b = pick(D), d = pick(D.filter(x => x !== b)), a = R(1, b - 1), c = R(1, d - 1);
    if (G(a, b) !== 1 || G(c, d) !== 1 || a * d + c * b >= b * d) return null;
    const H = L(b, d);
    if (H > 24) return null;
    const hn = { title: 'Hauptnenner finden', ask: `Welcher Hauptnenner passt für die Nenner ${b} und ${d}? Nimm den kleinsten.`, calc: String(H), hint: `Die kleinste Zahl, in der ${b} und ${d} beide aufgehen.`, explain: `${H} ist die kleinste Zahl, die durch ${b} und durch ${d} teilbar ist.` };
    return pick(level === 4 ? BRADD4 : BRADD5)({ a, b, c, d, s: q(a, b).add(q(c, d)), hn });
  }),

  brmul: level => tryGen(() => pick(level === 4 ? BRMUL4 : BRMUL5)(), nice2),

  dez: level => tryGen(() => pick(level === 4 ? DEZ4 : DEZ5)(), money),

  proz: level => tryGen(() => pick(level === 4 ? PROZ4 : PROZ5)(), money),

  gl: level => tryGen(() => {
    if (level === 4) {
      const x = R(2, 12), a = R(2, 9), b = R(1, 20), c = a * x + b;
      return wordTask({
        prompt: `Zahlenrätsel: Ich denke mir eine Zahl. Ich nehme sie mal ${a} und zähle dann ${b} dazu. Heraus kommt ${c}. Welche Zahl habe ich mir gedacht?`,
        steps: [
          { title: 'Gleichung aufstellen und umformen', pick: { ask: 'Welche Gleichung passt zum Rätsel? Die gedachte Zahl ist x.', right: `${a}x + ${b} = ${c}`, wrong: [`${a}(x + ${b}) = ${c}`, `x + ${a} + ${b} = ${c}`] }, why: '„mal 3“ heißt 3x, „dazu“ heißt plus.', ask: `Rechne auf beiden Seiten − ${b}. Welche Zahl steht dann rechts?`, calc: `${c} − ${b}` },
          { title: 'x allein stellen', ask: `Jetzt steht da ${a}x = ${c - b}. Teile beide Seiten durch ${a}. Was ist x?`, calc: `${c - b} : ${a}` },
        ],
        sentence: v => `Die gedachte Zahl ist ${v}.`,
      });
    }
    const x = R(3, 12), k = R(2, 4), s = (k + 1) * x;
    return wordTask({
      prompt: `Anna ist ${k}-mal so alt wie ihr kleiner Bruder. Zusammen sind sie ${s} Jahre alt. Wie alt ist Anna?`,
      steps: [
        { title: 'Gleichung aufstellen', pick: { ask: 'Der Bruder ist x Jahre alt. Welche Gleichung passt?', right: `x + ${k}x = ${s}`, wrong: [`x + ${k} = ${s}`, `${k}x = ${s}`] }, why: 'Anna ist k-mal so alt: kx. Zusammen: x + kx.', ask: 'Fasse zusammen: Wie viele x sind x + ' + k + 'x?', calc: `1 + ${k}` },
        { title: 'Alter des Bruders', ask: `Jetzt steht da ${k + 1}x = ${s}. Was ist x?`, calc: `${s} : ${k + 1}`, unit: 'Jahre' },
        { title: 'Alter von Anna', ask: 'Wie alt ist Anna?', calc: `${k} · ${x}`, wrong: [`${k} + ${x}`], why: 'Anna ist k-mal so alt wie der Bruder.', unit: 'Jahre' },
      ],
      unit: 'Jahre', sentence: v => `Anna ist ${v} alt.`,
    });
  }, nice),
  teil: level => {
    for (let i = 0; i < 300; i++) {
      if (Math.random() < 0.5) {
        const g = pick([5, 6, 8, 10, 12, 15, 20, 25]), a = g * R(2, 9), b = g * R(2, 9);
        if (a === b || G(a, b) !== g) continue;
        const t = ggtTask(a, b), n = a / g + b / g;
        const guide: GuideStep[] = [...t.guide!];
        let prompt = `Mia hat zwei Bänder: eins ist ${a} cm lang, das andere ${b} cm. Sie will beide in gleich lange Stücke schneiden, ohne dass etwas übrig bleibt. Die Stücke sollen so lang wie möglich sein. Wie lang wird ein Stück?`;
        const steps = [{ rule: 'Was ist gesucht?', lines: ['Die Stücklänge muss in beide Bänder genau hineinpassen, also beide Längen teilen. „So lang wie möglich“ heißt: der <b>größte</b> gemeinsame Teiler.'] }, ...(t.sol as { steps: { rule: string; lines: string[] }[] }).steps];
        let result = q(g), html = `${g} cm`, sentence = `Ein Stück wird ${g} cm lang.`;
        if (level === 5) {
          prompt = prompt.replace('Wie lang wird ein Stück?', 'Wie viele Stücke bekommt sie insgesamt?');
          guide.push({ title: 'Stücke zählen', ask: `Ein Stück ist ${g} cm lang. Wie viele Stücke werden es aus beiden Bändern zusammen?<div class="math big">${a} : ${g} + ${b} : ${g} = ?</div>`, answer: q(n), hint: 'Teile jede Bandlänge durch die Stücklänge und addiere.', explain: `${a / g} + ${b / g} = ${n} Stücke` });
          steps.push({ rule: 'Stücke zählen', lines: [`${a} : ${g} + ${b} : ${g} = ${a / g} + ${b / g} = ${n}`] });
          result = q(n); html = `${n} Stücke`; sentence = `Mia bekommt ${n} Stücke, jedes ${g} cm lang.`;
        }
        guide[0] = { ...guide[0], choose: { ask: 'Was musst du ausrechnen?', options: [{ html: 'den ggT von ' + a + ' und ' + b, ok: true }, { html: 'das kgV von ' + a + ' und ' + b, ok: false }, { html: `${a} + ${b}`, ok: false }], why: 'Die Stücke müssen in beide Längen passen, also beide teilen: ein gemeinsamer Teiler.' } };
        return { prompt, plain: prompt, answer: result, guide, word: true as const, needReduced: false, placeholder: level === 5 ? 'Anzahl Stücke' : 'Antwort in cm', sol: { kind: 'list' as const, steps, result, resultHTML: html, extra: [`<b>Antwortsatz:</b> ${sentence}`] } };
      }
      const a = pick([6, 8, 10, 12, 15, 20]), b = pick([4, 6, 8, 9, 10, 12, 15]);
      const l = L(a, b);
      if (a === b || l === Math.max(a, b) || l / Math.max(a, b) > 6 || l > 90) continue;
      const t = kgvTask(a, b);
      const guide: GuideStep[] = [...t.guide!];
      let prompt = `Um 8 Uhr fahren Bus A und Bus B gleichzeitig ab. Bus A fährt alle ${a} Minuten, Bus B alle ${b} Minuten. Nach wie vielen Minuten fahren sie wieder gleichzeitig ab?`;
      const steps = [{ rule: 'Was ist gesucht?', lines: [`Bus A fährt nach ${a}, ${2 * a}, ${3 * a}, … Minuten, also bei den Vielfachen von ${a}. Bus B bei den Vielfachen von ${b}. Gesucht ist das <b>kleinste gemeinsame Vielfache</b>.`] }, ...(t.sol as { steps: { rule: string; lines: string[] }[] }).steps];
      let result = q(l), html = `${l} min`, sentence = `Nach ${l} Minuten fahren beide wieder gleichzeitig ab.`;
      if (level === 5) {
        prompt += ` Wie oft ist Bus A bis dahin abgefahren (die Abfahrt um 8 Uhr nicht mitgezählt)?`;
        guide.push({ title: 'Fahrten von Bus A', ask: `Bus A fährt alle ${a} Minuten. Wie oft fährt er in ${l} Minuten?<div class="math big">${l} : ${a} = ?</div>`, answer: q(l / a), hint: `Teile ${l} durch ${a}.`, explain: `${l} : ${a} = ${l / a}` });
        steps.push({ rule: 'Fahrten von Bus A', lines: [`${l} : ${a} = ${l / a}`] });
        result = q(l / a); html = `${l / a}-mal`; sentence = `Nach ${l} Minuten fahren beide wieder zusammen. Bis dahin ist Bus A ${l / a}-mal abgefahren.`;
      }
      guide[0] = { ...guide[0], choose: { ask: 'Was musst du ausrechnen?', options: [{ html: 'das kgV von ' + a + ' und ' + b, ok: true }, { html: 'den ggT von ' + a + ' und ' + b, ok: false }, { html: `${a} · ${b}`, ok: false }], why: 'Gesucht ist eine Zeit, die in beiden Fahrplänen vorkommt: ein gemeinsames Vielfaches, und zwar das kleinste.' } };
      return { prompt, plain: prompt, answer: result, guide, word: true as const, needReduced: false, placeholder: level === 5 ? 'Anzahl' : 'Antwort in min', sol: { kind: 'list' as const, steps, result, resultHTML: html, extra: [`<b>Antwortsatz:</b> ${sentence}`] } };
    }
    return null;
  },

  groe: level => tryGen(() => {
    if (level === 4) {
      const k = R(0, 2);
      if (k === 0) {
        const km = R(41, 129) / 10, done = R(10, Math.floor(km * 10) - 3) * 100;
        const all = Math.round(km * 1000);
        return wordTask({
          prompt: `Ein Wanderweg ist ${String(km).replace('.', ',')} km lang. Lisa ist schon ${done} m gegangen. Wie viele Meter muss sie noch gehen?`,
          steps: [
            { title: 'Gleiche Einheit', ask: `Wie viele Meter sind ${String(km).replace('.', ',')} km?`, calc: `${String(km).replace('.', ',')} · 1000`, wrong: [`${String(km).replace('.', ',')} : 1000`, `${String(km).replace('.', ',')} · 100`], why: 'Erst alles in Meter. 1 km = 1000 m, in die kleinere Einheit also mal.', unit: 'm' },
            { title: 'Was noch fehlt', ask: 'Wie viele Meter fehlen noch?', calc: `${all} − ${done}`, wrong: [`${all} + ${done}`], why: 'Der Rest vom Weg: ganzer Weg minus geschaffter Weg.', unit: 'm' },
          ],
          unit: 'm', sentence: v => `Lisa muss noch ${v} gehen.`,
        });
      }
      if (k === 1) {
        const n = R(3, 12), g = pick([250, 500]);
        return wordTask({
          prompt: `Für ein Schulfest kauft Herr Kaya ${n} Packungen Nudeln. Jede Packung wiegt ${g} g. Wie viel Kilogramm Nudeln sind das?`,
          steps: [
            { title: 'Gewicht in Gramm', ask: 'Wie viel Gramm sind alle Packungen zusammen?', calc: `${n} · ${g}`, wrong: [`${n} + ${g}`], why: 'Mehrere gleiche Packungen: Anzahl mal Gewicht.', unit: 'g' },
            { title: 'In Kilogramm', ask: 'Wie viel Kilogramm sind das?', calc: `${n * g} : 1000`, wrong: [`${n * g} · 1000`, `${n * g} : 100`], why: '1 kg = 1000 g. In die größere Einheit also geteilt durch 1000.', unit: 'kg' },
          ],
          unit: 'kg', sentence: v => `Das sind ${v} Nudeln.`,
        });
      }
      const h = pick([1, 2]), m = pick([15, 30, 45]), b = R(10, 40);
      return wordTask({
        prompt: `Jonas fährt ${h} h ${m} min mit dem Zug zu seiner Oma und danach noch ${b} min mit dem Bus. Wie viele Minuten ist er insgesamt unterwegs?`,
        steps: [
          { title: 'Zugfahrt in Minuten', ask: `Wie viele Minuten sind ${h} h ${m} min?`, calc: `${h} · 60 + ${m}`, wrong: [`${h} · 100 + ${m}`], why: '1 h hat 60 min, nicht 100.', unit: 'min' },
          { title: 'Alles zusammen', ask: 'Wie viele Minuten ist Jonas insgesamt unterwegs?', calc: `${h * 60 + m} + ${b}`, unit: 'min' },
        ],
        unit: 'min', sentence: v => `Jonas ist ${v} unterwegs.`,
      });
    }
    if (Math.random() < 0.5) {
      const n = R(2, 4), w = pick([350, 450, 650, 850]), sp = R(11, 25) / 10, max = pick([5, 10]);
      const spH = String(sp).replace('.', ',');
      return wordTask({
        prompt: `Ein Paket darf höchstens ${max} kg wiegen. Ella packt ${n} Bücher zu je ${w} g und ein Spiel mit ${spH} kg hinein. Wie viel Gramm darf sie noch einpacken?`,
        steps: [
          { title: 'Die Bücher', ask: 'Wie viel Gramm wiegen die Bücher zusammen?', calc: `${n} · ${w}`, wrong: [`${n} + ${w}`], unit: 'g' },
          { title: 'Das Spiel in Gramm', ask: `Wie viel Gramm sind ${spH} kg?`, calc: `${spH} · 1000`, wrong: [`${spH} : 1000`], why: '1 kg = 1000 g: mal 1000.', unit: 'g' },
          { title: 'Schon im Paket', ask: 'Wie viel Gramm sind schon im Paket?', calc: `${n * w} + ${Math.round(sp * 1000)}`, unit: 'g' },
          { title: 'Was noch geht', ask: `${max} kg sind ${max * 1000} g. Wie viel Gramm darf Ella noch einpacken?`, calc: `${max * 1000} − ${n * w + Math.round(sp * 1000)}`, wrong: [`${max * 1000} + ${n * w + Math.round(sp * 1000)}`], why: 'Höchstgewicht minus das, was schon drin ist.', unit: 'g' },
        ],
        unit: 'g', sentence: v => `Ella darf noch ${v} einpacken.`,
      });
    }
    const h = pick([1, 2]), m = pick([10, 20, 40, 50]), w = R(5, 25);
    return wordTask({
      prompt: `Familie Weber fährt ${h} h ${m} min mit dem Auto in den Urlaub. Unterwegs machen sie ${w} min Pause, dann fahren sie noch 45 min weiter. Wie viele Minuten sind sie insgesamt unterwegs?`,
      steps: [
        { title: 'Erste Fahrt in Minuten', ask: `Wie viele Minuten sind ${h} h ${m} min?`, calc: `${h} · 60 + ${m}`, wrong: [`${h} · 100 + ${m}`], why: '1 h = 60 min.', unit: 'min' },
        { title: 'Pause dazu', ask: 'Wie viele Minuten sind es mit der Pause?', calc: `${h * 60 + m} + ${w}`, unit: 'min' },
        { title: 'Zweite Fahrt dazu', ask: 'Wie viele Minuten sind sie insgesamt unterwegs?', calc: `${h * 60 + m + w} + 45`, unit: 'min' },
      ],
      unit: 'min', sentence: v => `Familie Weber ist ${v} unterwegs.`,
    });
  }, t => t.guide.every(s => s.answer.terminating())),

  flae: level => tryGen(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const a = R(5, 20), b = R(3, 15), p = R(3, 12);
        return wordTask({
          prompt: `Ein rechteckiger Garten ist ${a} m lang und ${b} m breit. Er bekommt rundherum einen Zaun. Ein Meter Zaun kostet ${p} €. Wie viel kostet der Zaun?`,
          steps: [
            { title: 'Länge vom Zaun', ask: 'Wie lang ist der Zaun? (Der Zaun geht einmal außen herum.)', calc: `2 · ${a} + 2 · ${b}`, wrong: [`${a} · ${b}`, `${a} + ${b}`], why: 'Ein Zaun geht außen herum: Das ist der Umfang, 2 · a + 2 · b.', unit: 'm' },
            { title: 'Preis', ask: 'Wie viel kostet der Zaun?', calc: `${2 * a + 2 * b} · ${p}`, wrong: [`${2 * a + 2 * b} + ${p}`], why: 'Meter mal Preis pro Meter.', unit: '€' },
          ],
          unit: '€', sentence: v => `Der Zaun kostet ${v}.`,
        });
      }
      const a = R(2, 9), b = R(2, 6), k = pick([4, 5, 6, 8, 10]);
      return wordTask({
        prompt: `Ein rechteckiges Beet ist ${a} m lang und ${b} m breit. Auf jeden Quadratmeter pflanzt Paul ${k} Blumen. Wie viele Blumen braucht er?`,
        steps: [
          { title: 'Fläche vom Beet', ask: 'Wie groß ist die Fläche vom Beet?', calc: `${a} · ${b}`, wrong: [`2 · ${a} + 2 · ${b}`], why: 'Die Blumen kommen auf die Fläche: a · b.', unit: 'm²' },
          { title: 'Blumen', ask: 'Wie viele Blumen braucht Paul?', calc: `${a * b} · ${k}`, wrong: [`${a * b} + ${k}`], why: 'Pro Quadratmeter gleich viele: Fläche mal Blumen pro m².', unit: 'Blumen' },
        ],
        unit: 'Blumen', sentence: v => `Paul braucht ${v}.`,
      });
    }
    const a = R(3, 7), b = R(3, 6), c = R(15, 30), per = 2;
    return wordTask({
      prompt: `Ein Zimmer ist ${a} m lang und ${b} m breit. Es bekommt neuen Boden. Eine Packung Laminat reicht für ${per} m² und kostet ${c} €. Wie viel kostet der neue Boden?`,
      steps: [
        { title: 'Fläche vom Zimmer', ask: 'Wie groß ist die Fläche vom Zimmer?', calc: `${a} · ${b}`, wrong: [`2 · ${a} + 2 · ${b}`], why: 'Boden ist eine Fläche: a · b.', unit: 'm²' },
        { title: 'Packungen', ask: `Eine Packung reicht für ${per} m². Wie viele Packungen braucht man?`, calc: `${a * b} : ${per}`, wrong: [`${a * b} · ${per}`], why: 'So oft passen 2 m² in die Fläche: geteilt.', unit: 'Packungen' },
        { title: 'Preis', ask: 'Wie viel kosten alle Packungen?', calc: `${(a * b) / per} · ${c}`, unit: '€' },
      ],
      unit: '€', sentence: v => `Der neue Boden kostet ${v}.`,
    });
  }, nice),

  neg: level => {
    for (let i = 0; i < 300; i++) {
      try {
        const t = negWord(level);
        if (t.guide.every(s => s.answer.isInt() && !s.answer.isZero())) return t;
      } catch (e) { if (!(e instanceof MathError)) throw e; }
    }
    return null;
  },
};

function nice2(t: Word) { return t.guide.every(s => s.answer.d <= 12n); }

const pn = (v: number) => (v < 0 ? `(−${-v})` : String(v));
const sg = (v: number) => String(v).replace('-', '−');
function negWord(level: number): Word {
  if (level === 4) {
    if (Math.random() < 0.5) {
      const a = R(2, 9), b = R(3, 12), c = R(2, 10);
      return wordTask({
        prompt: `Am Morgen ist es ${sg(-a)} °C kalt. Bis zum Mittag steigt die Temperatur um ${b} Grad. Bis zum Abend sinkt sie wieder um ${c} Grad. Wie kalt ist es am Abend?`,
        steps: [
          { title: 'Mittags', ask: 'Wie warm ist es am Mittag?', calc: `${pn(-a)} + ${b}`, wrong: [`${pn(-a)} − ${b}`], why: 'Die Temperatur steigt: plus, auf dem Thermometer nach oben.', unit: '°C' },
          { title: 'Abends', ask: 'Wie warm ist es am Abend?', calc: `${pn(b - a)} − ${c}`, wrong: [`${pn(b - a)} + ${c}`], why: 'Die Temperatur sinkt: minus.', unit: '°C' },
        ],
        unit: '°C', sentence: v => `Am Abend sind es ${v}.`,
      });
    }
    const a = R(10, 60), b = R(20, 80), c = R(10, 70);
    return wordTask({
      prompt: `Auf Toms Konto sind ${sg(-a)} € (er hat also ${a} € Schulden). Er zahlt ${b} € ein und hebt danach ${c} € ab. Wie hoch ist sein Kontostand jetzt?`,
      steps: [
        { title: 'Einzahlung', ask: `Wie hoch ist der Kontostand nach dem Einzahlen?`, calc: `${pn(-a)} + ${b}`, wrong: [`${pn(-a)} − ${b}`], why: 'Einzahlen heißt: Es kommt Geld dazu, plus.', unit: '€' },
        { title: 'Abheben', ask: 'Wie hoch ist der Kontostand nach dem Abheben?', calc: `${pn(b - a)} − ${c}`, wrong: [`${pn(b - a)} + ${c}`], why: 'Abheben heißt: Geld geht weg, minus.', unit: '€' },
      ],
      unit: '€', sentence: v => `Toms Kontostand ist jetzt ${v}.`,
    });
  }
  if (Math.random() < 0.5) {
    const h = pick([4, 5, 6, 8]), r = R(1, 4), a = R(2, 12), b = h * r - a;
    return wordTask({
      prompt: `Auf einer Berghütte zeigt das Thermometer um 6 Uhr ${sg(-a)} °C. ${h} Stunden später sind es ${sg(b)} °C. Um wie viel Grad ist es pro Stunde wärmer geworden, wenn es jede Stunde gleich viel war?`,
      steps: [
        { title: 'Unterschied', ask: `Um wie viel Grad ist es insgesamt wärmer geworden? Rechne neue Temperatur minus alte Temperatur.`, calc: `${pn(b)} − ${pn(-a)}`, wrong: [`${pn(b)} + ${pn(-a)}`], why: 'Unterschied: neu minus alt. Minus minus wird plus.', unit: 'Grad' },
        { title: 'Pro Stunde', ask: `Das waren ${h} Stunden. Wie viel Grad pro Stunde?`, calc: `${b + a} : ${h}`, wrong: [`${b + a} · ${h}`], why: 'Gleichmäßig auf die Stunden verteilen: geteilt.', unit: 'Grad' },
      ],
      unit: 'Grad', sentence: v => `Es ist jede Stunde um ${v} wärmer geworden.`,
    });
  }
  const a = R(30, 120), k = R(2, 5), b = pick([15, 20, 25, 30]), c = R(10, 60);
  return wordTask({
    prompt: `Leas Konto steht bei ${sg(-a)} €. Sie zahlt ${k} Monate lang jeden Monat ${b} € ein. Dann kauft sie ein Buch für ${c} €. Wie hoch ist ihr Kontostand danach?`,
    steps: [
      { title: 'Alle Einzahlungen', ask: 'Wie viel zahlt Lea insgesamt ein?', calc: `${k} · ${b}`, wrong: [`${k} + ${b}`], unit: '€' },
      { title: 'Nach den Einzahlungen', ask: 'Wie hoch ist der Kontostand nach den Einzahlungen?', calc: `${pn(-a)} + ${k * b}`, wrong: [`${pn(-a)} − ${k * b}`], why: 'Einzahlen: plus.', unit: '€' },
      { title: 'Nach dem Kauf', ask: 'Wie hoch ist der Kontostand nach dem Kauf?', calc: `${pn(k * b - a)} − ${c}`, wrong: [`${pn(k * b - a)} + ${c}`], why: 'Bezahlen: Geld geht weg, minus.', unit: '€' },
    ],
    unit: '€', sentence: v => `Leas Kontostand ist danach ${v}.`,
  });
}
