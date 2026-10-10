/* ===== Textaufgaben für Stufe 4 (zwei Schritte) und Stufe 5 (Profi, mehrere Schritte) ===== */
import { MathError, q, gcd, lcm, type Q } from './engine/index.js';
import { wordTask } from './guide.js';

type Word = ReturnType<typeof wordTask>;
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
};

function nice2(t: Word) { return t.guide.every(s => s.answer.d <= 12n); }
