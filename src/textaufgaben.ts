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

export const TEXT: Record<string, (level: number) => Word | null> = {
  pvs: level => tryGen(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const a = R(2, 6), b = R(2, 5), c = R(1, 4);
        return wordTask({
          prompt: `Lena kauft ${a} Hefte zu je ${b} € und einen Stift für ${c} €. Wie viel bezahlt sie insgesamt?`,
          steps: [
            { title: 'Preis für die Hefte', ask: `Wie viel kosten die ${a} Hefte zusammen?`, calc: `${a} · ${b}`, wrong: [`${a} + ${b}`, `${a} · ${c}`], why: 'Mehrere gleiche Dinge: Anzahl mal Preis.', unit: '€' },
            { title: 'Alles zusammen', ask: 'Wie viel bezahlt Lena insgesamt?', calc: `${a * b} + ${c}`, wrong: [`${a * b} − ${c}`], why: 'Der Stift kommt dazu, also plus.', unit: '€' },
          ],
          term: `${c} + ${a} · ${b}`, unit: '€', sentence: v => `Lena bezahlt insgesamt ${v}.`,
        });
      }
      const a = R(5, 12), b = R(2, 4), c = R(2, a * b - 2);
      return wordTask({
        prompt: `Ein Bus hat ${a} Sitzreihen mit je ${b} Plätzen. ${c} Plätze sind noch frei. Wie viele Plätze sind besetzt?`,
        steps: [
          { title: 'Alle Plätze', ask: 'Wie viele Plätze hat der Bus insgesamt?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Reihen mal Plätze pro Reihe.', unit: 'Plätze' },
          { title: 'Besetzte Plätze', ask: 'Wie viele Plätze sind besetzt?', calc: `${a * b} − ${c}`, wrong: [`${a * b} + ${c}`], why: 'Die freien Plätze ziehst du ab.', unit: 'Plätze' },
        ],
        term: `${a} · ${b} − ${c}`, unit: 'Plätze', sentence: v => `Im Bus sind ${v} besetzt.`,
      });
    }
    if (Math.random() < 0.5) {
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
    }
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
  }, nice),

  kuerzen: level => tryGen(() => {
    if (level === 4) {
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
    }
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
  }),

  bradd: level => tryGen(() => {
    const D = [2, 3, 4, 5, 6, 8];
    const b = pick(D), d = pick(D.filter(x => x !== b)), a = R(1, b - 1), c = R(1, d - 1);
    if (G(a, b) !== 1 || G(c, d) !== 1 || a * d + c * b >= b * d) return null;
    const H = L(b, d);
    const s = q(a, b).add(q(c, d));
    const hn = { title: 'Hauptnenner finden', ask: `Welcher Hauptnenner passt für die Nenner ${b} und ${d}? Nimm den kleinsten.`, calc: String(H), hint: `Die kleinste Zahl, in der ${b} und ${d} beide aufgehen.`, explain: `${H} ist die kleinste Zahl, die durch ${b} und durch ${d} teilbar ist.` };
    if (level === 4) {
      return wordTask({
        prompt: `Mia isst ${fr(a, b)} einer Pizza, Ben isst ${fr(c, d)} davon. Wie viel von der Pizza haben die beiden zusammen gegessen?`,
        steps: [hn, { title: 'Zusammenzählen', ask: 'Wie viel haben beide zusammen gegessen? Kürze, wenn es geht.', calc: `${fr(a, b)} + ${fr(c, d)}`, wrong: [`${fr(a, b)} − ${fr(c, d)}`, `${fr(a, b)} · ${fr(c, d)}`], why: 'Zusammen heißt plus.', needReduced: true }],
        sentence: v => `Zusammen haben sie ${v} der Pizza gegessen.`,
      });
    }
    return wordTask({
      prompt: `Ein Kuchen wird verteilt. Oma bekommt ${fr(a, b)} davon, Opa ${fr(c, d)}. Wie viel vom Kuchen ist danach noch übrig?`,
      steps: [
        hn,
        { title: 'Verteilter Teil', ask: 'Wie viel vom Kuchen wurde zusammen verteilt? Kürze, wenn es geht.', calc: `${fr(a, b)} + ${fr(c, d)}`, wrong: [`${fr(a, b)} − ${fr(c, d)}`], needReduced: true },
        { title: 'Was übrig ist', ask: 'Wie viel ist noch übrig? Der ganze Kuchen ist 1.', calc: `1 − ${s.txt()}`, wrong: [`1 + ${s.txt()}`], why: 'Vom Ganzen (1) ziehst du ab, was weg ist.', needReduced: true },
      ],
      sentence: v => `Es ist noch ${v} vom Kuchen übrig.`,
    });
  }),

  brmul: level => tryGen(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const [a, b] = pick([[3, 4], [2, 3], [1, 2], [3, 8], [2, 5]]), k = R(2, 5);
        return wordTask({
          prompt: `Für ein Rezept brauchst du ${fr(a, b)} Liter Milch. Du willst die ${k}-fache Menge backen. Wie viele Liter Milch brauchst du?`,
          steps: [{ title: 'Rechnen', ask: 'Wie viele Liter Milch brauchst du? Kürze, wenn es geht.', calc: `${fr(a, b)} · ${k}`, wrong: [`${fr(a, b)} + ${k}`, `${fr(a, b)} : ${k}`], why: 'Die k-fache Menge heißt: mal k.', unit: 'l', needReduced: true }],
          sentence: v => `Du brauchst ${v} Milch.`,
        });
      }
      const N = R(2, 6), k = pick([2, 3, 4, 5]);
      return wordTask({
        prompt: `Du hast ${N} Liter Saft. Du füllst ihn in Gläser, in die jeweils ${fr(1, k)} Liter passt. Wie viele Gläser kannst du füllen?`,
        steps: [{ title: 'Rechnen', ask: 'Wie viele Gläser werden voll?', calc: `${N} : ${fr(1, k)}`, wrong: [`${N} · ${fr(1, k)}`, `${N} − ${fr(1, k)}`], why: 'Wie oft passt ein Glas in den Saft? Das ist eine Geteilt-Aufgabe.', hint: 'Durch einen Bruch teilen heißt: mit dem Kehrwert malnehmen.' }],
        sentence: v => `Du kannst ${v} Gläser füllen.`,
      });
    }
    const [a, b] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6]]), S = b * R(2, 6);
    return wordTask({
      prompt: `Paul wohnt ${S} km von seiner Oma entfernt. ${fr(a, b)} der Strecke fährt er mit dem Bus, den Rest fährt er mit dem Rad. Wie viele Kilometer fährt er mit dem Rad?`,
      steps: [
        { title: 'Strecke mit dem Bus', ask: `Wie viele Kilometer sind ${fr(a, b)} von ${S} km?`, calc: `${S} · ${fr(a, b)}`, wrong: [`${S} : ${fr(a, b)}`, `${S} + ${fr(a, b)}`], why: '„Ein Bruch von etwas“ heißt: mal.', unit: 'km' },
        { title: 'Strecke mit dem Rad', ask: 'Wie viele Kilometer bleiben für das Rad?', calc: `${S} − ${(S * a) / b}`, wrong: [`${S} + ${(S * a) / b}`], why: 'Der Rest ist die ganze Strecke ohne den Bus-Teil.', unit: 'km' },
      ],
      term: `${S} − ${S} · ${fr(a, b)}`, unit: 'km', sentence: v => `Paul fährt ${v} mit dem Rad.`,
    });
  }, nice2),

  dez: level => tryGen(() => {
    const price = () => R(105, 499);
    if (level === 4) {
      const p1 = price(), p2 = price(), pay = p1 + p2 < 500 ? 5 : 10;
      return wordTask({
        prompt: `Du kaufst ein Brot für ${eur(p1)} € und Milch für ${eur(p2)} €. Du bezahlst mit einem ${pay}-€-Schein. Wie viel Rückgeld bekommst du?`,
        steps: [
          { title: 'Alles zusammen', ask: 'Wie viel kostet der Einkauf?', calc: `${eur(p1)} + ${eur(p2)}`, hint: 'Komma unter Komma schreiben.', unit: '€' },
          { title: 'Rückgeld', ask: 'Wie viel Rückgeld bekommst du?', calc: `${pay} − ${eur(p1 + p2)}`, wrong: [`${pay} + ${eur(p1 + p2)}`], why: 'Rückgeld = bezahlt minus Preis.', unit: '€' },
        ],
        unit: '€', sentence: v => `Du bekommst ${v} zurück.`,
      });
    }
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
  }, money),

  proz: level => tryGen(() => {
    const Gw = pick([40, 60, 80, 120, 150, 200, 250]);
    if (level === 4) {
      const p = pick([10, 20, 25, 30, 50]), one = q(Gw).div(q(100)), W = one.mul(q(p));
      return wordTask({
        prompt: `Eine Jacke kostet ${Gw} €. Im Sommerschlussverkauf gibt es ${p} % Rabatt. Wie viel kostet die Jacke jetzt?`,
        steps: [
          { title: 'Erst 1 % ausrechnen', ask: `Wie viel Euro ist 1 % von ${Gw} €?`, calc: `${Gw} : 100`, wrong: [`${Gw} · 100`], why: '100 % sind der ganze Preis. Für 1 % teilst du durch 100.', unit: '€' },
          { title: `Dann ${p} % ausrechnen`, ask: `Wie viel Euro Rabatt sind ${p} %?`, calc: `${p} · ${dec(one)}`, wrong: [`${p} + ${dec(one)}`], unit: '€' },
          { title: 'Neuer Preis', ask: 'Wie viel kostet die Jacke jetzt?', calc: `${Gw} − ${dec(W)}`, wrong: [`${Gw} + ${dec(W)}`], why: 'Rabatt wird abgezogen.', unit: '€' },
        ],
        unit: '€', sentence: v => `Die Jacke kostet jetzt ${v}.`,
      });
    }
    const p = pick([10, 20, 25, 50]), up = q(Gw).mul(q(p)).div(q(100)), N = q(Gw).add(up), down = N.mul(q(10)).div(q(100));
    return wordTask({
      prompt: `Ein Fahrrad kostet ${Gw} €. Der Preis steigt um ${p} %. Später gibt es auf den neuen Preis 10 % Rabatt. Was kostet das Fahrrad am Ende?`,
      steps: [
        { title: 'Preiserhöhung', ask: `Um wie viel Euro steigt der Preis? (${p} % von ${Gw} €)`, calc: `${Gw} · ${p} : 100`, wrong: [`${Gw} · ${p}`, `${Gw} : ${p}`], why: 'Prozentwert = Grundwert · p : 100.', unit: '€' },
        { title: 'Neuer Preis', ask: 'Wie viel kostet das Fahrrad nach der Erhöhung?', calc: `${Gw} + ${dec(up)}`, unit: '€' },
        { title: 'Rabatt', ask: 'Wie viel Euro sind 10 % vom neuen Preis?', calc: `${dec(N)} · 10 : 100`, wrong: [`${Gw} · 10 : 100`], why: 'Der Rabatt bezieht sich auf den neuen Preis.', unit: '€' },
        { title: 'Endpreis', ask: 'Was kostet das Fahrrad am Ende?', calc: `${dec(N)} − ${dec(down)}`, unit: '€' },
      ],
      unit: '€', sentence: v => `Das Fahrrad kostet am Ende ${v}.`,
    });
  }, money),

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
