/* ===== Klasse 5/6: Rechengesetze, schriftliches Rechnen, Kreis, Flächen- und Volumeneinheiten ===== */
import type { GuideChoice, GuideStep } from './guide.js';
import { autoGuide, termH, wordTask } from './guide.js';
import { MINUS, evalExpr, q as q0, qH, type Q, type ExprSolution, type ListSolution } from './engine/index.js';
import { M, R, genFrom, list, pick, type Task, type Topic } from './gen.js';
import { LETTERS } from './widgets.js';

type ListStep = ListSolution['steps'][number];
/** Bruch, gleich gekürzt gespeichert */
const q = (n: number | bigint, d: number | bigint = 1): Q => q0(n, d).red();
const dH = (v: Q) => qH(v, true);
/** Große Zahl mit schmalen Leerzeichen in Dreiergruppen */
const gz = (n: number | bigint | string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '&#8239;');
const nH = (v: Q) => gz(dH(v));
/** Zahl als Text mit Komma (für Rechnungen, die die Engine ausrechnet) */
const dc = (n: number) => q(Math.round(n * 1000), 1000).toDec();
const val = (s: string): Q => evalExpr(s).result;
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const opts = (right: string, wrong: string[]) => shuffle([{ html: right, ok: true }, ...[...new Set(wrong)].filter(w => w !== right).map(w => ({ html: w, ok: false }))]);
const ch = (ask: string, right: string, wrong: string[], why: string): GuideChoice => ({ ask, options: opts(right, wrong), why });
const exprSteps = (s: ExprSolution): ListStep[] => s.steps.map(st => ({ rule: st.rule, lines: [M(st.before), ...st.lines] }));
const merke = (items: string[]) => `<div class="merke"><span class="merke-l">Merke</span><ol>${items.map(i => `<li>${i}</li>`).join('')}</ol></div>`;

/** Rechenaufgabe: Vorschritte (optional) und dann eine Rechnung, die die Engine Schritt für Schritt ausrechnet. */
function calcTask(prompt: string, calc: string, o: { choose?: GuideChoice; pre?: GuideStep[]; preLines?: ListStep[]; lines?: ListStep[]; unit?: string; extra?: string[] } & Partial<Task> = {}): Task {
  const sol = evalExpr(calc);
  const g = autoGuide(sol);
  const pre = o.pre ?? [];
  if (o.choose) { if (pre.length) pre[0] = { ...pre[0], choose: o.choose }; else g[0] = { ...g[0], choose: o.choose }; }
  const u = o.unit ? ' ' + o.unit : '';
  const { choose: _c, pre: _p, preLines, lines, unit: _u, extra, ...rest } = o;
  void _c; void _p; void _u;
  const steps = [...(preLines ?? []), ...(lines ?? exprSteps(sol))];
  return {
    prompt, plain: calc, answer: sol.result, sol: list(steps, sol.result, dH(sol.result) + u, extra), guide: [...pre, ...g],
    placeholder: o.unit ? `Antwort in ${o.unit}` : 'Deine Lösung', ...rest,
  };
}

interface Opt { html: string; fb?: string }
/** Auswahl-Aufgabe: genau eine Option ist richtig. `fb` ist die Rückmeldung, wenn jemand diese falsche Option wählt. */
function pickTask(prompt: string, right: Opt, wrong: Opt[], lines: string[], guide: GuideStep[] = [], rule = 'Begründung'): Task {
  const all = shuffle([{ ...right, ok: true }, ...wrong.filter(w => w.html !== right.html).map(w => ({ ...w, ok: false }))]);
  const k = all.findIndex(x => x.ok);
  return {
    prompt, plain: prompt.replace(/<[^>]+>/g, ' '), answer: q(k + 1), widget: { kind: 'pick', options: all.map(x => x.html) }, placeholder: 'Auswahl', guide,
    sol: list([{ rule, lines }], q(k + 1), `${LETTERS[k]}: ${right.html}`),
    diag: v => all[Number(v.n) - 1]?.fb ?? null,
  };
}

/* =====================================================================
   1. Rechengesetze und Terme
   ===================================================================== */
const NAMES = { '+': 'Summe', '−': 'Differenz', '·': 'Produkt', ':': 'Quotient' } as const;
const EIN = { '+': 'eine', '−': 'eine', '·': 'ein', ':': 'ein' } as const;
type Op = keyof typeof NAMES;
const VERB = { '+': 'Plus', '−': 'Minus', '·': 'Mal', ':': 'Geteilt' } as const;

function begriffTask(): Task {
  const op = pick(['+', '−', '·', ':'] as Op[]);
  const b = R(3, 9), a = op === ':' ? b * R(3, 9) : op === '−' ? R(20, 90) : R(4, 15);
  const term = `${a} ${op} ${b}`, v = val(term);
  const wrong = (Object.keys(NAMES) as Op[]).filter(o => o !== op).map(o => ({ html: NAMES[o], fb: `${NAMES[o]} gehört zu ${VERB[o]}. Hier wird aber ${VERB[op]} gerechnet.` }));
  return pickTask(`Wie heißt der Term ${M(`${a} ${op === '−' ? MINUS : op} ${b}`)}? Und wie heißt sein Ergebnis ${M(dH(v))}?`, { html: NAMES[op] }, wrong,
    ['Plus → <b>Summe</b>, Minus → <b>Differenz</b>, Mal → <b>Produkt</b>, Geteilt → <b>Quotient</b>.', `Hier wird ${VERB[op]} gerechnet, also ist es ${EIN[op]} <b>${NAMES[op]}</b>.`], [], 'Fachbegriff');
}
function teilTask(): Task {
  const k = R(0, 3);
  if (k === 0) { const a = R(12, 60), b = R(5, 30); return pickTask(`In ${M(`${a} + ${b} = ${a + b}`)}: Wie heißen die Zahlen ${a} und ${b}?`, { html: 'Summanden' }, [{ html: 'Faktoren', fb: 'Faktoren gibt es beim Malnehmen.' }, { html: 'Summe', fb: 'Die Summe ist das Ergebnis, hier also ' + (a + b) + '.' }, { html: 'Divisoren', fb: 'Einen Divisor gibt es beim Teilen.' }], ['Bei einer Summe heißen die Zahlen, die man addiert, <b>Summanden</b>. Das Ergebnis heißt Summe.'], [], 'Fachbegriff'); }
  if (k === 1) { const a = R(3, 9), b = R(4, 12); return pickTask(`In ${M(`${a} · ${b} = ${a * b}`)}: Wie heißen die Zahlen ${a} und ${b}?`, { html: 'Faktoren' }, [{ html: 'Summanden', fb: 'Summanden gibt es beim Addieren.' }, { html: 'Produkt', fb: `Das Produkt ist das Ergebnis, hier also ${a * b}.` }, { html: 'Dividenden', fb: 'Einen Dividenden gibt es beim Teilen.' }], ['Bei einem Produkt heißen die Zahlen, die man malnimmt, <b>Faktoren</b>. Das Ergebnis heißt Produkt.'], [], 'Fachbegriff'); }
  const b = R(3, 9), c = R(3, 12), a = b * c, first = k === 2;
  return pickTask(`In ${M(`${a} : ${b} = ${c}`)}: Wie heißt die Zahl <b>${first ? a : b}</b>?`, { html: first ? 'Dividend' : 'Divisor' },
    [{ html: first ? 'Divisor' : 'Dividend', fb: first ? 'Der Divisor ist die Zahl, durch die geteilt wird. Das ist hier die ' + b + '.' : 'Der Dividend ist die Zahl, die geteilt wird. Das ist hier die ' + a + '.' }, { html: 'Quotient', fb: `Der Quotient ist das Ergebnis, hier also ${c}.` }, { html: 'Faktor', fb: 'Faktoren gibt es beim Malnehmen.' }],
    [`${a} : ${b} = ${c}: <b>Dividend</b> : <b>Divisor</b> = <b>Quotient</b>.`, `Die ${a} wird geteilt (Dividend), durch die ${b} wird geteilt (Divisor).`], [], 'Fachbegriff');
}
function berechneBegriff(): Task {
  const op = pick(['+', '−', '·', ':'] as Op[]);
  const b = R(3, 9), a = op === ':' ? b * R(4, 12) : op === '−' ? R(40, 99) : op === '·' ? R(4, 12) : R(15, 80);
  const right = `${a} ${op} ${b}`;
  const wrong = op === '+' ? [`${a} · ${b}`, `${a} − ${b}`] : op === '−' ? [`${a} + ${b}`, `${a} : ${b}`] : op === '·' ? [`${a} + ${b}`, `${a} − ${b}`] : [`${a} · ${b}`, `${a} − ${b}`];
  const art = { '+': 'die Summe', '−': 'die Differenz', '·': 'das Produkt', ':': 'den Quotienten' }[op];
  return calcTask(`Berechne ${art} aus ${a} und ${b}.`, right, {
    choose: ch('Welcher Term passt?', termH(right), wrong.map(termH), `${NAMES[op]} heißt ${VERB[op]}. Die erste Zahl steht vorne.`),
    preLines: [{ rule: 'Term aufstellen', lines: [`${art[0].toUpperCase() + art.slice(1)} aus ${a} und ${b}: ${termH(right)}`] }],
  });
}

/** Geschickt rechnen: erst die passende Umformung wählen, dann in kleinen Schritten rechnen. */
function smartTask(orig: string, smart: string, law: string, wrong: string[], why: string, diag?: (v: Q) => string | null): Task {
  return calcTask(`Rechne geschickt: ${termH(orig)}`, smart, {
    choose: ch('Welche Umformung hilft dir beim geschickten Rechnen?', termH(smart), wrong.map(termH), why),
    preLines: [{ rule: law, lines: [`${termH(orig)} = ${termH(smart)}`, why] }], diag, plain: orig,
  });
}
function smartGen(dist: boolean): Task {
  const x = R(11, 49);
  if (!dist) {
    const k = R(0, 3);
    if (k === 0) return smartTask(`25 · ${x} · 4`, `25 · 4 · ${x}`, 'Vertauschungsgesetz', [`(25 + 4) · ${x}`, `25 · 4 + ${x}`], '25 · 4 = 100. Mit 100 rechnet es sich leicht. Beim Malnehmen darfst du die Faktoren vertauschen.');
    if (k === 1) return smart125();
    if (k === 2) { const a = R(11, 89), c = 100 - a, b = R(11, 89); return smartTask(`${a} + ${b} + ${c}`, `(${a} + ${c}) + ${b}`, 'Vertauschungs- und Verbindungsgesetz', [`(${a} + ${c}) · ${b}`, `${a} · ${c} + ${b}`], `${a} + ${c} = 100. Beim Addieren darfst du vertauschen und Klammern setzen, wie du willst.`); }
    return smartTask(`2 · ${x} · 50`, `2 · 50 · ${x}`, 'Vertauschungsgesetz', [`(2 + 50) · ${x}`, `2 · 50 + ${x}`], '2 · 50 = 100. Beim Malnehmen darfst du die Faktoren vertauschen.');
  }
  const k = R(0, 2), a = R(11, 29);
  if (k === 0) { const s = pick([1, 2, 3]); return smartTask(`${a} · ${100 - s}`, `${a} · 100 − ${a} · ${s}`, 'Verteilungsgesetz', [`${a} · 100 − ${s}`, `${a} · 100 + ${a} · ${s}`], `${100 - s} = 100 − ${s}. Die ${a} wird mit <b>beiden</b> Zahlen malgenommen.`, v => (v.eq(q(a * 100 - s)) ? `Du musst auch die ${s} mit ${a} malnehmen: ${a} · ${s}.` : null)); }
  if (k === 1) { const b = R(2, 8), c = 10 - b; return smartTask(`${a} · ${b} + ${a} · ${c}`, `${a} · (${b} + ${c})`, 'Verteilungsgesetz (Ausklammern)', [`${a} · ${b} · ${c}`, `(${a} + ${a}) · (${b} + ${c})`], `In beiden Produkten steckt die ${a}. Du klammerst sie aus: ${b} + ${c} = 10.`); }
  const t = R(2, 4) * 10, s = R(1, 3);
  return smartTask(`${a} · ${t + s}`, `${a} · ${t} + ${a} · ${s}`, 'Verteilungsgesetz', [`${a} · ${t} + ${s}`, `${a} · ${t / 10} + ${a} · ${s}`], `${t + s} = ${t} + ${s}. Die ${a} wird mit <b>beiden</b> Teilen malgenommen.`, v => (v.eq(q(a * t + s)) ? `Du musst auch die ${s} mit ${a} malnehmen.` : null));
}
function smart125(): Task { const n = R(3, 9); return smartTask(`125 · ${n} · 8`, `125 · 8 · ${n}`, 'Vertauschungsgesetz', [`(125 + 8) · ${n}`, `125 · 8 + ${n}`], '125 · 8 = 1000. Beim Malnehmen darfst du die Faktoren vertauschen.'); }

const LAST: Record<Op, string> = NAMES;
function gliedernTask(): Task {
  const k = R(0, 5), a = R(2, 9), b = R(2, 12), c = R(2, 9);
  const T: [string, Op][] = [[`${a} · (${b} + ${c})`, '·'], [`${a + 10} + ${b} · ${c}`, '+'], [`(${a * c} + ${b * c}) : ${c}`, ':'], [`${a} · ${b} − ${c}`, '−'], [`(${a + b + 3} − ${b}) · ${c}`, '·'], [`${a * c} : ${c} + ${b}`, '+']];
  const [term, op] = T[k];
  const v = val(term);
  const wrong = (Object.keys(NAMES) as Op[]).filter(o => o !== op).map(o => ({ html: NAMES[o], fb: 'Schau, welche Rechnung du ganz zum Schluss machst. Die gibt dem Term den Namen.' }));
  const g: GuideStep[] = [{ title: 'Die letzte Rechnung', choose: ch('Welche Rechnung machst du ganz zum Schluss?', M(VERB[op] + ` (${op === '−' ? MINUS : op})`), (Object.keys(NAMES) as Op[]).filter(o => o !== op).map(o => M(VERB[o] + ` (${o === '−' ? MINUS : o})`)), 'Klammer zuerst, Punkt vor Strich. Was dann übrig bleibt, ist die letzte Rechnung.'),
    ask: `<p>Rechne den Term aus: ${termH(term)}</p>`, answer: v, hint: 'Klammer zuerst, dann Punkt vor Strich.', explain: `${termH(term)} = ${M(dH(v))}. Die letzte Rechnung ist ${VERB[op]}, also ist der Term ${EIN[op]} <b>${LAST[op]}</b>.` }];
  return pickTask(`Was für ein Term ist ${termH(term)}?`, { html: LAST[op] }, wrong,
    ['Ein Term bekommt seinen Namen von der Rechnung, die du <b>zuletzt</b> ausführst.', `Bei ${termH(term)} rechnest du zuletzt ${VERB[op]}. Also ist es ${EIN[op]} <b>${LAST[op]}</b>.`], g, 'Term gliedern');
}
function wortTermTask(): Task {
  const k = R(0, 3);
  let text: string, right: string, wrong: string[];
  if (k === 0) { const a = R(8, 15), b = R(4, 9), c = R(5, 20), d = R(3, 12); if (a * b <= c + d) return wortTermTask(); text = `Subtrahiere vom Produkt aus ${a} und ${b} die Summe aus ${c} und ${d}.`; right = `${a} · ${b} − (${c} + ${d})`; wrong = [`${a} · ${b} − ${c} + ${d}`, `(${c} + ${d}) − ${a} · ${b}`, `${a} + ${b} − ${c} · ${d}`]; }
  else if (k === 1) { const a = R(5, 20), b = R(5, 20), c = R(3, 9); text = `Multipliziere die Summe aus ${a} und ${b} mit ${c}.`; right = `(${a} + ${b}) · ${c}`; wrong = [`${a} + ${b} · ${c}`, `${a} · ${b} + ${c}`]; }
  else if (k === 2) { const c = R(3, 9), r = R(3, 12), b = R(5, 30), a = b + c * r; text = `Dividiere die Differenz aus ${a} und ${b} durch ${c}.`; right = `(${a} − ${b}) : ${c}`; wrong = [`${a} − ${b} : ${c}`, `${c} : (${a} − ${b})`]; }
  else { const b = R(3, 9), a = b * R(3, 9), c = R(3, 9), d = R(3, 9); text = `Addiere zum Quotienten aus ${a} und ${b} das Produkt aus ${c} und ${d}.`; right = `${a} : ${b} + ${c} · ${d}`; wrong = [`(${a} : ${b} + ${c}) · ${d}`, `${a} · ${b} + ${c} : ${d}`]; }
  return calcTask(`Welcher Term passt? Stelle ihn auf und berechne ihn.<p><i>${text}</i></p>`, right, {
    choose: ch('Welcher Term passt zum Text?', termH(right), wrong.map(termH), 'Lies von hinten: Was wird zuletzt gerechnet? Teile, die zuerst berechnet werden müssen, kommen in Klammern.'),
    preLines: [{ rule: 'Term aufstellen', lines: [text, termH(right)] }], plain: text,
  });
}
function wahrTask(): Task {
  const k = R(0, 6);
  const yes = (html: string) => ({ html: 'Stimmt. ' + html }), no = (html: string) => ({ html: 'Stimmt nicht. ' + html });
  const step = (term: string, why: string): GuideStep[] => [{ title: 'Linke Seite ausrechnen', ask: `<p>Rechne die linke Seite aus: ${termH(term)}</p>`, answer: val(term), hint: 'Klammer zuerst.', explain: `${termH(term)} = ${M(dH(val(term)))}. ${why}` }];
  if (k === 0) { const a = R(12, 30), b = R(2, 9); const L = `${a} − ${b}`; return pickTask(`Gilt das Vertauschungsgesetz auch für Minus? Stimmt ${M(`${a} − ${b} = ${b} − ${a}`.replace(/−/g, MINUS))}?`, no(`${a} − ${b} = ${a - b}. Bei ${b} − ${a} nimmst du viel mehr weg, als da ist. Bei Minus darf man nicht tauschen.`), [yes('Man darf bei jeder Rechnung die Zahlen tauschen.'), yes('Auf beiden Seiten stehen dieselben Zahlen, also ist es gleich.')], [`${a} − ${b} = ${a - b}. Würdest du tauschen, nimmst du von ${b} ganze ${a} weg. Das ergibt nicht ${a - b}.`, 'Das Vertauschungsgesetz gilt nur für Plus und Mal.'], step(L, 'Rechts käme etwas ganz anderes heraus.')); }
  if (k === 1) { const b = R(2, 8), a = b * R(3, 9); return pickTask(`Stimmt ${M(`${a} : ${b} = ${b} : ${a}`)}?`, no(`${a} : ${b} = ${a / b}, aber ${b} : ${a} ist kleiner als 1. Bei Geteilt darf man nicht tauschen.`), [yes('Beim Teilen darf man die Zahlen vertauschen wie beim Malnehmen.'), yes('Teilen ist das Gegenteil von Malnehmen, darum geht Tauschen auch.')], [`${a} : ${b} = ${a / b}. ${b} : ${a} ist kleiner als 1.`, 'Das Vertauschungsgesetz gilt nur für Plus und Mal.'], step(`${a} : ${b}`, `${b} Stücke aus ${a} ist nicht dasselbe wie ${a} Stücke aus ${b}.`)); }
  if (k === 2) { const a = R(3, 12), b = R(13, 30); return pickTask(`Stimmt ${M(`${a} · ${b} = ${b} · ${a}`)}?`, yes('Beim Malnehmen darf man die Faktoren vertauschen (Vertauschungsgesetz).'), [no('Vertauschen darf man nur bei Plus.'), no('Das Ergebnis wird größer, wenn die größere Zahl vorne steht.')], [`${a} · ${b} = ${a * b} und ${b} · ${a} = ${a * b}.`, 'Beim Malnehmen und beim Addieren darfst du immer vertauschen.'], step(`${a} · ${b}`, `Rechts kommt auch ${a * b} heraus.`)); }
  if (k === 3) { const a = R(3, 9), b = R(10, 30), c = R(2, 9); return pickTask(`Stimmt ${M(`${a} · (${b} + ${c}) = ${a} · ${b} + ${c}`)}?`, no(`Die ${a} muss mit <b>beiden</b> Zahlen in der Klammer malgenommen werden: ${a} · ${b} + ${a} · ${c}.`), [yes('Man rechnet einfach von links nach rechts.'), yes('Das ist genau das Verteilungsgesetz.')], [`Links: ${a} · ${b + c} = ${a * (b + c)}. Rechts: ${a * b} + ${c} = ${a * b + c}.`, `Richtig wäre: ${a} · (${b} + ${c}) = ${a} · ${b} + ${a} · ${c}.`], step(`${a} · (${b} + ${c})`, `Rechts kommt ${a * b + c} heraus. Das ist nicht gleich.`)); }
  if (k === 4) { const a = R(30, 60), b = R(10, 20), c = R(2, 8); return pickTask(`Gilt das Verbindungsgesetz auch für Minus? Stimmt ${M(`(${a} − ${b}) − ${c} = ${a} − (${b} − ${c})`.replace(/−/g, MINUS))}?`, no('Bei Minus darf man die Klammern nicht einfach versetzen.'), [yes('Klammern darf man immer versetzen.'), yes('Es sind dieselben Zahlen in derselben Reihenfolge.')], [`Links: ${a - b} − ${c} = ${a - b - c}. Rechts: ${a} − ${b - c} = ${a - b + c}.`, 'Das Verbindungsgesetz gilt nur für Plus und Mal.'], step(`(${a} − ${b}) − ${c}`, `Rechts kommt ${a - b + c} heraus.`)); }
  if (k === 5) { const a = R(12, 40), b = R(12, 40), c = R(12, 40); return pickTask(`Stimmt ${M(`(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`)}?`, yes('Beim Addieren darf man Klammern setzen, wie man will (Verbindungsgesetz).'), [no('Was in der Klammer steht, ändert das Ergebnis immer.'), no('Klammern darf man nur beim Malnehmen versetzen.')], [`Links: ${a + b} + ${c} = ${a + b + c}. Rechts: ${a} + ${b + c} = ${a + b + c}.`], step(`(${a} + ${b}) + ${c}`, `Rechts kommt auch ${a + b + c} heraus.`)); }
  const a = R(3, 9), b = R(10, 20), c = R(2, 9);
  return pickTask(`Stimmt ${M(`${a} · (${b} − ${c}) = ${a} · ${b} − ${a} · ${c}`.replace(/−/g, MINUS))}?`, yes('Die Zahl vor der Klammer wird mit jeder Zahl in der Klammer malgenommen (Verteilungsgesetz). Das gilt auch bei Minus.'), [no('Das Verteilungsgesetz gilt nur bei Plus in der Klammer.'), no(`Rechts muss ${a} · ${b} − ${c} stehen.`)], [`Links: ${a} · ${b - c} = ${a * (b - c)}. Rechts: ${a * b} − ${a * c} = ${a * (b - c)}.`], step(`${a} · (${b} − ${c})`, `Rechts kommt auch ${a * (b - c)} heraus.`));
}

const GESCHICKT: Topic = {
  id: 'geschickt', klasse: 5, title: 'Rechengesetze und Terme', short: 'Fachbegriffe, geschickt rechnen mit den Rechengesetzen und Terme gliedern.',
  exampleSol: () => { const t = smartGen(true); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Jede Rechenart hat ihre <b>Fachbegriffe</b>:</p>
    <table class="stellen"><tr><th>Rechnung</th><th>Teile</th><th>Ergebnis</th></tr>
      <tr><td>${M('12 + 5')}</td><td>Summand + Summand</td><td><b>Summe</b></td></tr>
      <tr><td>${M(`12 ${MINUS} 5`)}</td><td>Minuend ${MINUS} Subtrahend</td><td><b>Differenz</b></td></tr>
      <tr><td>${M('12 · 5')}</td><td>Faktor · Faktor</td><td><b>Produkt</b></td></tr>
      <tr><td>${M('12 : 4')}</td><td>Dividend : Divisor</td><td><b>Quotient</b></td></tr></table>
    <p>Ein Term heißt nach der Rechnung, die du <b>zuletzt</b> machst. ${M('3 · (4 + 5)')} ist ein <b>Produkt</b>, denn zuerst rechnest du die Klammer, zum Schluss Mal.</p>
    <p><b>Vertauschungsgesetz:</b> Bei Plus und Mal darfst du die Zahlen tauschen. ${M('25 · 17 · 4 = 25 · 4 · 17 = 100 · 17 = 1700')}</p>
    <p><b>Verbindungsgesetz:</b> Bei Plus und Mal darfst du Klammern setzen, wie du willst. ${M('(38 + 62) + 17 = 100 + 17 = 117')}</p>
    <p><b>Verteilungsgesetz:</b> Eine Zahl vor der Klammer wird mit jeder Zahl in der Klammer malgenommen. ${M(`13 · 98 = 13 · (100 ${MINUS} 2) = 1300 ${MINUS} 26 = 1274`)}. Andersherum kannst du auch ausklammern: ${M('19 · 6 + 19 · 4 = 19 · 10 = 190')}.</p>
    ${merke(['Plus und Mal: Tauschen und Klammern versetzen ist erlaubt.', 'Minus und Geteilt: Tauschen ist <b>nicht</b> erlaubt!', 'Such Paare, die 10, 100 oder 1000 ergeben.', 'Beim Verteilungsgesetz: mit <b>jeder</b> Zahl in der Klammer malnehmen.'])}`,
  gen(level) {
    return genFrom(() => {
      if (level === 1) return pick([begriffTask, teilTask, berechneBegriff, berechneBegriff])();
      if (level === 2) { const k = R(0, 3); return k === 0 ? smartGen(false) : k === 1 ? smart125() : smartGen(true); }
      return pick([gliedernTask, wortTermTask, wahrTask, wahrTask, () => smartGen(true)])();
    }, t => t.answer.sign() > 0);
  },
  text: level => genFrom(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const a = R(3, 8), b = 10 - a, p = pick([1.25, 1.75, 2.45, 0.85, 3.15]), P = dc(p), it = pick(['Hefte', 'Brezeln', 'Brötchen', 'Stifte']);
        return wordTask({
          prompt: `Lena kauft ${a} ${it}, Tim kauft ${b} ${it}. Ein Stück kostet ${P} €. Wie viel bezahlen beide zusammen? Rechne geschickt.`,
          steps: [
            { title: 'Erst die Anzahl', ask: `Wie viele ${it} kaufen beide zusammen?`, calc: `${a} + ${b}`, pick: { ask: 'Welcher Term ist geschickt?', right: `(${a} + ${b}) · ${P}`, wrong: [`${a} · ${b} · ${P}`, `${a} + ${b} · ${P}`] }, why: `Erst die Stückzahl zusammenzählen: ${a} + ${b} = 10. Mit 10 malnehmen ist leicht (Verteilungsgesetz).` },
            { title: 'Dann der Preis', ask: `Was kosten 10 Stück zu je ${P} €?`, calc: `10 · ${P}`, unit: '€', hint: 'Mal 10: Das Komma rückt eine Stelle nach rechts.' },
          ],
          unit: '€', term: `(${a} + ${b}) · ${P}`, sentence: v => `Zusammen bezahlen sie ${v}.`,
        });
      }
      const p = R(4, 12), s = pick([1, 2]), n = 100 - s;
      return wordTask({
        prompt: `Die ganze Schule fährt ins Museum. Es fahren ${n} Kinder mit, der Eintritt kostet ${p} € pro Kind. Wie viel Eintritt bezahlen alle zusammen? Rechne geschickt mit ${n} = 100 ${MINUS} ${s}.`,
        steps: [
          { title: 'Für 100 Kinder', ask: 'Wie viel müssten 100 Kinder bezahlen?', calc: `${p} · 100`, pick: { ask: 'Welcher Term ist geschickt?', right: `${p} · 100 − ${p} · ${s}`, wrong: [`${p} · 100 − ${s}`, `${p} · 100 + ${p} · ${s}`] }, why: `${n} Kinder sind ${s} weniger als 100. Also: 100 Kinder rechnen und ${s} ${s === 1 ? 'Kind' : 'Kinder'} wieder abziehen.`, unit: '€' },
          { title: `${s === 1 ? 'Ein Kind' : 'Zwei Kinder'} zu viel`, ask: `Wie viel ${s === 1 ? 'bezahlt 1 Kind' : 'bezahlen 2 Kinder'}?`, calc: `${p} · ${s}`, unit: '€' },
          { title: 'Abziehen', ask: `Wie viel bezahlen also die ${n} Kinder?`, calc: `${p * 100} − ${p * s}`, unit: '€' },
        ],
        unit: '€', term: `${p} · 100 − ${p} · ${s}`, sentence: v => `Alle zusammen bezahlen ${v} Eintritt.`,
      });
    }
    if (Math.random() < 0.5) {
      const n = R(24, 30), b = R(12, 20), k = R(2, 4), pb = R(15, 29), sp = R(25, 49);
      if (n * b <= k * pb + sp) return null;
      return wordTask({
        prompt: `In der Klasse 6b sind ${n} Kinder. Jedes Kind zahlt ${b} € in die Klassenkasse. Davon kauft die Klasse ${k} Bälle zu je ${pb} € und ein Spiel für ${sp} €. Wie viel Geld bleibt übrig? Stelle zuerst einen Term auf.`,
        steps: [
          { title: 'Einnahmen', ask: 'Wie viel Geld kommt in die Kasse?', calc: `${n} · ${b}`, pick: { ask: 'Welcher Term passt zur ganzen Aufgabe?', right: `${n} · ${b} − (${k} · ${pb} + ${sp})`, wrong: [`${n} · ${b} − ${k} · ${pb} + ${sp}`, `(${n} + ${b}) − ${k} · ${pb} − ${sp}`] }, why: 'Erst das ganze Geld, dann ziehst du alle Ausgaben ab. Die Ausgaben gehören zusammen in eine Klammer.', unit: '€' },
          { title: 'Bälle', ask: `Was kosten die ${k} Bälle?`, calc: `${k} · ${pb}`, unit: '€' },
          { title: 'Alle Ausgaben', ask: 'Wie viel gibt die Klasse insgesamt aus?', calc: `${k * pb} + ${sp}`, unit: '€' },
          { title: 'Was übrig bleibt', ask: 'Wie viel Geld bleibt übrig?', calc: `${n * b} − ${k * pb + sp}`, unit: '€' },
        ],
        unit: '€', term: `${n} · ${b} − (${k} · ${pb} + ${sp})`, sentence: v => `Es bleiben ${v} übrig.`,
      });
    }
    const e = R(2, 4), pe = R(9, 13), c = R(3, 7), pc = R(5, 8), g = pick([5, 10, 15]);
    return wordTask({
      prompt: `Familie Kaya geht ins Kino: ${e} Erwachsene zu je ${pe} € und ${c} Kinder zu je ${pc} €. Sie haben einen Gutschein über ${g} €. Wie viel müssen sie noch bezahlen? Stelle zuerst einen Term auf.`,
      steps: [
        { title: 'Erwachsene', ask: 'Wie viel kosten die Karten für die Erwachsenen?', calc: `${e} · ${pe}`, pick: { ask: 'Welcher Term passt zur ganzen Aufgabe?', right: `${e} · ${pe} + ${c} · ${pc} − ${g}`, wrong: [`(${e} + ${c}) · ${pe} − ${g}`, `${e} · ${pe} + ${c} · (${pc} − ${g})`] }, why: 'Erwachsene und Kinder haben verschiedene Preise. Erst beide Teile ausrechnen, dann den Gutschein abziehen.', unit: '€' },
        { title: 'Kinder', ask: 'Wie viel kosten die Karten für die Kinder?', calc: `${c} · ${pc}`, unit: '€' },
        { title: 'Zusammen', ask: 'Wie viel kosten alle Karten?', calc: `${e * pe} + ${c * pc}`, unit: '€' },
        { title: 'Gutschein abziehen', ask: 'Wie viel müssen sie noch bezahlen?', calc: `${e * pe + c * pc} − ${g}`, unit: '€' },
      ],
      unit: '€', term: `${e} · ${pe} + ${c} · ${pc} − ${g}`, sentence: v => `Sie müssen noch ${v} bezahlen.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

/* =====================================================================
   2. Schriftlich multiplizieren und dividieren
   ===================================================================== */
/** Schriftliche Multiplikation (ohne Komma) im Heft-Layout */
function mulPre(a: string, b: string): string {
  const head = `${a} · ${b}`, L = b.length, A = BigInt(a);
  const parts = b.split('').map(d => String(A * BigInt(d)));
  const res = String(A * BigInt(b));
  const w = Math.max(head.length, res.length, ...parts.map((p, i) => p.length + (L - 1 - i))) + 1;
  const rows = [head.padStart(w), '─'.repeat(w)];
  if (L > 1) { parts.forEach((p, i) => rows.push(p.padStart(w - (L - 1 - i)))); rows.push('─'.repeat(w)); }
  rows.push(res.padStart(w));
  return `<pre class="column" aria-label="schriftlich">${rows.join('\n')}</pre>`;
}
interface DivStep { i: number; cur: number; qd: number; sub: number; rem: number }
function divSteps(a: number, b: number): DivStep[] {
  const s = String(a), out: DivStep[] = [];
  let cur = 0, started = false;
  for (let i = 0; i < s.length; i++) {
    cur = cur * 10 + Number(s[i]);
    if (!started && cur < b && i < s.length - 1) continue;
    started = true;
    const qd = Math.floor(cur / b), sub = qd * b;
    out.push({ i, cur, qd, sub, rem: cur - sub });
    cur -= sub;
  }
  return out;
}
/** Schriftliche Division (geht auf) im Heft-Layout */
function divPre(a: number, b: number): string {
  const s = String(a), st = divSteps(a, b);
  const at = (str: string, end: number) => ' '.repeat(Math.max(0, 2 + end - str.length)) + str;
  const rows = [` ${s} : ${b} = ${a / b}`];
  st.forEach((x, k) => {
    if (k > 0) rows.push(at(String(x.cur), x.i));
    rows.push(at(MINUS + x.sub, x.i));
    rows.push(at('─'.repeat(Math.max(String(x.cur).length, String(x.sub).length + 1)), x.i));
  });
  const last = st[st.length - 1];
  rows.push(at(String(last.rem), last.i));
  return `<pre class="column" aria-label="schriftlich">${rows.join('\n')}</pre>`;
}
const STELLE = ['Einer', 'Zehner', 'Hunderter', 'Tausender'];
function mul1Task(): Task {
  const a = R(1, 9) * 100 + R(1, 9) * 10 + R(1, 9), b = R(3, 9), s = String(a);
  const parts = s.split('').map((d, i) => Number(d) * 10 ** (s.length - 1 - i));
  const g: GuideStep[] = parts.map((p, i) => ({ title: `${STELLE[s.length - 1 - i]}`, ask: `<p>Rechne die ${STELLE[s.length - 1 - i]} mal ${b}: ${M(`${p} · ${b}`)}</p>`, answer: q(p * b), hint: s.length - 1 - i ? `Rechne ${s[i]} · ${b} = ${Number(s[i]) * b} und hänge ${s.length - 1 - i === 2 ? 'zwei Nullen' : 'eine Null'} an.` : 'Einmaleins.', explain: `${M(`${p} · ${b} = ${p * b}`)}` }));
  g.push({ title: 'Zusammenzählen', ask: `<p>Zähle die Teile zusammen: ${M(parts.map(p => p * b).join(' + '))}</p>`, answer: q(a * b), hint: 'Stelle unter Stelle addieren.', explain: `${M(`${a} · ${b} = ${a * b}`)}` });
  return { prompt: `Rechne schriftlich: ${M(`${a} · ${b}`)}`, plain: `${a} · ${b}`, answer: q(a * b), placeholder: 'Deine Lösung', guide: g,
    sol: list([
      { rule: 'Stelle für Stelle', lines: parts.map((p, i) => `${STELLE[s.length - 1 - i]}: ${M(`${p} · ${b} = ${p * b}`)}`) },
      { rule: 'Schriftlich', lines: ['Du fängst hinten bei den Einern an. Was über 9 geht, merkst du dir als Übertrag für die nächste Stelle.', mulPre(s, String(b))] },
    ], q(a * b), gz(a * b)),
    diag: v => (v.eq(q(Number(s.split('').map(d => String(Number(d) * b % 10)).join('')))) ? 'Du hast die Überträge vergessen. Was über 9 geht, kommt zur nächsten Stelle dazu.' : null) };
}
function div1Task(): Task {
  const b = R(3, 9), c = R(Math.ceil(100 / b) + 3, Math.floor(999 / b)), a = b * c;
  const st = divSteps(a, b), s = String(a);
  const g: GuideStep[] = st.map((x, k) => ({ title: k === 0 ? 'Vorne anfangen' : `Nächste Ziffer`,
    ask: `<p>${k === 0 ? (x.i === 0 ? `Fang vorne an: Wie oft passt die ${b} in die ${x.cur}?` : `Die ${s[0]} ist kleiner als ${b}. Nimm die nächste Ziffer dazu: Wie oft passt die ${b} in ${x.cur}?`) : `Hol die ${s[x.i]} herunter. Jetzt hast du ${x.cur}. Wie oft passt die ${b} in ${x.cur}?`}</p>`,
    answer: q(x.qd), hint: `Welche Zahl aus der ${b}er-Reihe ist höchstens ${x.cur}?`,
    explain: `${x.qd}-mal, denn ${M(`${b} · ${x.qd} = ${x.sub}`)}. Rest: ${M(`${x.cur} ${MINUS} ${x.sub} = ${x.rem}`)}${k < st.length - 1 ? '. Den Rest nimmst du mit zur nächsten Ziffer.' : '.'}` }));
  g.push({ title: 'Ergebnis ablesen', ask: '<p>Schreib die Ziffern hintereinander. Wie heißt das Ergebnis?</p>', answer: q(c), hint: st.map(x => x.qd).join(', '), explain: `${M(`${a} : ${b} = ${c}`)}. Probe: ${M(`${c} · ${b} = ${a}`)}` });
  return { prompt: `Rechne schriftlich: ${M(`${a} : ${b}`)}`, plain: `${a} : ${b}`, answer: q(c), placeholder: 'Deine Lösung', guide: g,
    sol: list([
      { rule: 'Ziffer für Ziffer', lines: st.map(x => `${b} passt in ${x.cur} genau ${x.qd}-mal (${b} · ${x.qd} = ${x.sub}), Rest ${x.rem}.`) },
      { rule: 'Schriftlich', lines: [divPre(a, b), `Probe: ${M(`${c} · ${b} = ${a}`)}`] },
    ], q(c)) };
}
const roundTo = (n: number, p: number) => Math.round(n / p) * p;
function mul2Task(three: boolean): Task {
  const a = R(2, 9) * 100 + R(1, 9) * 10 + R(1, 9), b = three ? R(1, 3) * 100 + R(1, 9) * 10 + R(1, 9) : R(1, 9) * 10 + R(1, 9);
  const bs = String(b), parts = bs.split('').map((d, i) => Number(d) * 10 ** (bs.length - 1 - i)).filter(p => p > 0);
  const ra = roundTo(a, 100), rb = roundTo(b, three ? 100 : 10);
  const g: GuideStep[] = [
    { title: 'Überschlag', ask: `<p>Überschlage erst: Runde auf ${M(`${ra} · ${rb}`)}. Was kommt ungefähr heraus?</p>`, answer: q(ra * rb), hint: `Rechne ${ra / 100} · ${rb / (three ? 100 : 10)} und hänge die Nullen an.`, explain: `${M(`${ra} · ${rb} = ${gz(ra * rb)}`)}. Das genaue Ergebnis muss in der Nähe liegen.` },
    ...parts.map(p => ({ title: `${a} · ${p}`, ask: `<p>${b} = ${parts.join(' + ')}. Rechne ${M(`${a} · ${p}`)}</p>`, answer: q(a * p), hint: p >= 10 ? `Erst ${a} · ${p / 10 ** Math.floor(Math.log10(p))}, dann die Nullen anhängen.` : 'Stelle für Stelle von hinten.', explain: M(`${a} · ${p} = ${gz(a * p)}`) })),
    { title: 'Zusammenzählen', ask: `<p>Zähle die Teilergebnisse zusammen: ${M(parts.map(p => gz(a * p)).join(' + '))}</p>`, answer: q(a * b), hint: 'Stelle unter Stelle.', explain: `${M(`${a} · ${b} = ${gz(a * b)}`)}. Überschlag ${gz(ra * rb)}: passt!` },
  ];
  return { prompt: `Rechne schriftlich: ${M(`${a} · ${b}`)}`, plain: `${a} · ${b}`, answer: q(a * b), placeholder: 'Deine Lösung', guide: g,
    sol: list([
      { rule: 'Überschlag', lines: [M(`${a} · ${b} ≈ ${ra} · ${rb} = ${gz(ra * rb)}`)] },
      { rule: 'Zerlegen', lines: [`${M(`${a} · ${b} = ${parts.map(p => `${a} · ${p}`).join(' + ')}`)}`, M(`= ${parts.map(p => gz(a * p)).join(' + ')} = ${gz(a * b)}`)] },
      { rule: 'Schriftlich', lines: ['Jede Ziffer des zweiten Faktors gibt eine Zeile. Die Zeile rückt jeweils eine Stelle nach rechts, ihre letzte Ziffer steht unter der Ziffer, mit der du malnimmst.', mulPre(String(a), bs)] },
    ], q(a * b), gz(a * b)),
    diag: v => (v.eq(q(a * bs.split('').reduce((t, d) => t + Number(d), 0))) ? 'Die Zeilen müssen jeweils eine Stelle nach rechts rücken. Du hast sie alle bündig untereinander geschrieben.' : null) };
}
function div2Task(): Task {
  const b = R(12, 25), c = R(21, 79), a = b * c, lo = Math.floor(c / 10) * 10, st = divSteps(a, b);
  const g: GuideStep[] = [
    { title: 'Überschlag', ask: `<p>Überschlage: Rechne ${M(`${b} · ${lo}`)}.</p>`, answer: q(b * lo), hint: `${b} · ${lo / 10}, dann eine Null anhängen.`, explain: `${b} · ${lo} = ${b * lo} ist kleiner als ${a}, aber ${b} · ${lo + 10} = ${b * (lo + 10)} ist schon zu viel. Das Ergebnis liegt zwischen ${lo} und ${lo + 10}.` },
    ...st.map((x, k) => ({ title: k === 0 ? 'Erste Ziffer' : 'Nächste Ziffer', ask: `<p>${k === 0 ? `Wie oft passt die ${b} in ${x.cur}?` : `Hol die nächste Ziffer herunter: ${x.cur}. Wie oft passt die ${b} in ${x.cur}?`}</p>`, answer: q(x.qd), hint: `Probiere: ${b} · ${Math.max(1, x.qd - 1)} = ${b * Math.max(1, x.qd - 1)}, ${b} · ${x.qd + 1} = ${b * (x.qd + 1)}`, explain: `${x.qd}-mal: ${M(`${b} · ${x.qd} = ${x.sub}`)}, Rest ${x.rem}.` })),
    { title: 'Ergebnis', ask: '<p>Wie heißt das Ergebnis?</p>', answer: q(c), hint: st.map(x => x.qd).join(' und '), explain: `${M(`${a} : ${b} = ${c}`)}. Probe: ${M(`${c} · ${b} = ${a}`)}` },
  ];
  return { prompt: `Rechne schriftlich: ${M(`${gz(a)} : ${b}`)}`, plain: `${a} : ${b}`, answer: q(c), placeholder: 'Deine Lösung', guide: g,
    sol: list([
      { rule: 'Überschlag', lines: [`${b} · ${lo} = ${b * lo} und ${b} · ${lo + 10} = ${b * (lo + 10)}. Das Ergebnis liegt zwischen ${lo} und ${lo + 10}.`] },
      { rule: 'Schriftlich', lines: [...st.map(x => `${b} passt in ${x.cur} genau ${x.qd}-mal, Rest ${x.rem}.`), divPre(a, b), `Probe: ${M(`${c} · ${b} = ${a}`)}`] },
    ], q(c)) };
}
function kommaShift(): Task {
  const x = q(R(101, 9999), pick([10, 100])), f = pick([10, 100, 1000]), mul = Math.random() < 0.55, k = String(f).length - 1;
  const calc = `${x.toDec()} ${mul ? '·' : ':'} ${f}`;
  const dir = mul ? 'nach rechts' : 'nach links', other = mul ? 'nach links' : 'nach rechts';
  const st = k === 1 ? 'Stelle' : 'Stellen';
  const res = val(calc);
  return calcTask(`Berechne im Kopf: ${termH(calc)}`, calc, {
    choose: ch('Was passiert mit dem Komma?', `${k} ${st} ${dir}`, [`${k} ${st} ${other}`, mul ? `${k === 1 ? 'eine Null' : k === 2 ? 'zwei Nullen' : 'drei Nullen'} hinten anhängen` : `${k} ${st} weglassen`],
      mul ? `Mal ${f} macht die Zahl ${f}-mal so groß. Jede Ziffer rückt ${k} ${st} nach links in der Stellentafel, also wandert das Komma ${k} ${st} nach rechts. Nullen anhängen geht nur bei ganzen Zahlen.` : `Geteilt durch ${f} macht die Zahl kleiner. Jede Ziffer rückt ${k} ${st} nach rechts, also wandert das Komma ${k} ${st} nach links.`),
    lines: [{ rule: 'Komma verschieben', lines: [`${mul ? 'Mal' : 'Geteilt durch'} ${f}: Das Komma wandert ${k} ${st} ${dir}. Fehlen Stellen, füllst du mit 0 auf.`, `${termH(calc)} = ${M(dH(res))}`] }],
    form: res.isInt() ? undefined : 'dec',
    diag: v => (v.eq(mul ? x.div(q(f)) : x.mul(q(f))) ? `Falsche Richtung! ${mul ? 'Mal' : 'Geteilt durch'} ${f}: Das Komma muss ${dir}.` : null),
  });
}
function kommaWhy(): Task {
  const x = q(pick([R(11, 19), R(21, 29), R(31, 39), R(41, 49), R(51, 99)]), 10), f = pick([10, 100]), k = f === 10 ? 1 : 2, r = x.mul(q(f)), name = pick(['Mia', 'Ben', 'Noah', 'Emma']);
  const wrongStr = x.toDec() + '0'.repeat(k);
  return pickTask(`${name} sagt: „Bei ${M(`${x.toDec()} · ${f}`)} hänge ich einfach ${k === 1 ? 'eine Null' : 'zwei Nullen'} an. Dann kommt ${M(wrongStr)} heraus.“ Welche Antwort stimmt?`,
    { html: `${name} irrt sich. ${wrongStr} ist dasselbe wie ${x.toDec()}. Beim Malnehmen mit ${f} rückt das Komma ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts: ${dH(r)}.` },
    [{ html: `${name} hat recht. Bei mal ${f} hängt man immer ${k === 1 ? 'eine Null' : 'zwei Nullen'} an.`, fb: `Nullen hinten nach dem Komma ändern den Wert nicht: ${wrongStr} = ${x.toDec()}.` },
     { html: `Das Komma rückt ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach links: ${dH(x.div(q(f)))}.`, fb: 'Mal macht die Zahl größer. Das Komma muss nach rechts.' }],
    [`${wrongStr} ist nur eine andere Schreibweise für ${x.toDec()}. Die Zahl ist dadurch nicht größer geworden.`, `Mal ${f}: Jede Ziffer wird ${f}-mal so viel wert. Das Komma rückt ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts: ${M(`${x.toDec()} · ${f} = ${dH(r)}`)}.`],
    [{ title: 'Selbst rechnen', ask: `<p>Wie viel ist ${M(`${x.toDec()} · ${f}`)} wirklich?</p>`, answer: r, hint: `Das Komma rückt ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts.`, explain: `${M(`${x.toDec()} · ${f} = ${dH(r)}`)}. Jetzt sieh dir an, welche Antwort das erklärt.` }]);
}
function decMulTask(): Task {
  const two = Math.random() < 0.5;
  const a = two ? q(R(101, 999), 100) : q(R(11, 99), 10), b = q(R(11, 59), 10);
  if (a.isInt() || b.isInt() || a.mul(q(100)).n % 10n === 0n && two) return decMulTask();
  const ka = two ? 2 : 1, kb = 1, ia = Number(a.mul(q(10 ** ka)).n), ib = Number(b.mul(q(10)).n), P = ia * ib, v = a.mul(b);
  const Pc = (() => { const s = String(P).padStart(ka + kb + 1, '0'); return s.slice(0, s.length - ka - kb) + ',' + s.slice(-ka - kb); })();
  return { prompt: `Rechne schriftlich: ${M(`${a.toDec()} · ${b.toDec()}`)}`, plain: `${a.toDec()} · ${b.toDec()}`, answer: v, form: 'dec', placeholder: 'Deine Lösung',
    guide: [
      { title: 'Ohne Komma rechnen', ask: `<p>Lass die Kommas erst weg. Rechne ${M(`${ia} · ${ib}`)}</p>`, answer: q(P), hint: 'Schriftlich, Zeile für Zeile.', explain: M(`${ia} · ${ib} = ${gz(P)}`) },
      { title: 'Kommastellen zählen', ask: `<p>Wie viele Stellen nach dem Komma haben ${a.toDec()} und ${b.toDec()} <b>zusammen</b>?</p>`, answer: q(ka + kb), hint: `${a.toDec()} hat ${ka}, ${b.toDec()} hat ${kb}.`, explain: `${ka} + ${kb} = ${ka + kb} Nachkommastellen.` },
      { title: 'Komma setzen', ask: `<p>Setze das Komma in ${M(String(P))}: ${ka + kb} Stellen von rechts. Wie heißt das Ergebnis?</p>`, answer: v, hint: 'Zähle von rechts ab. Nullen ganz hinten nach dem Komma darfst du weglassen.', explain: `${M(Pc)} = ${M(dH(v))}` },
    ],
    sol: list([
      { rule: 'Ohne Komma rechnen', lines: [mulPre(String(ia), String(ib))] },
      { rule: 'Komma setzen', lines: [`Zusammen ${ka + kb} Nachkommastellen, also ${ka + kb} Stellen von rechts: ${M(Pc)}${Pc !== v.toDec() ? ` = ${M(dH(v))}` : ''}`, `Überschlag: ${M(`${Math.round(Number(a.n) / Number(a.d))} · ${Math.round(Number(b.n) / Number(b.d))} = ${Math.round(Number(a.n) / Number(a.d)) * Math.round(Number(b.n) / Number(b.d))}`)}, das passt.`] },
    ], v, dH(v)),
    diag: x => (x.eq(q(P)) ? 'Du hast das Komma vergessen. Zähle die Nachkommastellen beider Zahlen zusammen.' : x.eq(v.mul(q(10))) || x.eq(v.div(q(10))) ? 'Die Ziffern stimmen, aber das Komma sitzt falsch. Zähle die Nachkommastellen beider Zahlen <b>zusammen</b>.' : null) };
}
function decDivTask(): Task {
  if (Math.random() < 0.5) {
    // Kommazahl durch ganze Zahl: ohne Komma teilen, dann Komma setzen
    const b = pick([4, 5, 8, 12, 15, 25]), c = R(3, 40), A = b * c, k = 1, a = q(A, 10);
    if (a.isInt()) return decDivTask();
    const v = a.div(q(b));
    return { prompt: `Rechne schriftlich: ${M(`${a.toDec()} : ${b}`)}`, plain: `${a.toDec()} : ${b}`, answer: v, form: 'dec', placeholder: 'Deine Lösung',
      guide: [
        { title: 'Ohne Komma teilen', ask: `<p>${a.toDec()} sind ${A} Zehntel. Rechne erst ${M(`${A} : ${b}`)}</p>`, answer: q(c), hint: `Wie oft passt ${b} in ${A}?`, explain: `${M(`${A} : ${b} = ${c}`)}, also ${c} Zehntel.` },
        { title: 'Komma setzen', ask: `<p>${c} Zehntel: Wie heißt das Ergebnis als Kommazahl?</p>`, answer: v, hint: 'Ein Zehntel ist 0,1. Das Komma rückt eine Stelle nach links.', explain: `${M(`${a.toDec()} : ${b} = ${dH(v)}`)}` },
      ],
      sol: list([
        { rule: 'Ohne Komma teilen', lines: [`${a.toDec()} = ${A} Zehntel.`, divPre(A, b)] },
        { rule: 'Komma setzen', lines: [`${c} Zehntel = ${dH(v)}. Schriftlich setzt du im Ergebnis das Komma, sobald du beim Teilen über das Komma gehst.`, M(`${a.toDec()} : ${b} = ${dH(v)}`)] },
      ], v, dH(v), [`Probe: ${M(`${dH(v)} · ${b} = ${a.toDec()}`)}`]),
      diag: x => (x.eq(q(c)) ? 'Du hast das Komma vergessen. Es waren Zehntel!' : null) };
  }
  // Kommazahl durch Kommazahl: erst Komma verschieben
  const k = pick([1, 2]), b = q(R(2, 25), 10 ** k), c = R(3, 40), a = b.mul(q(c));
  if (b.isInt() || (k === 2 && b.mul(q(10)).isInt())) return decDivTask();
  const f = 10 ** k, A = a.mul(q(f)), Bb = b.mul(q(f));
  const calc = `${A.toDec()} : ${Bb.toDec()}`;
  return calcTask(`Rechne schriftlich: ${M(`${a.toDec()} : ${b.toDec()}`)}`, calc, {
    pre: [{ title: 'Komma verschieben', ask: `<p>Der Teiler ${b.toDec()} soll eine ganze Zahl werden. Um wie viele Stellen verschiebst du das Komma (bei beiden Zahlen)?</p>`, answer: q(k), hint: `${b.toDec()} hat ${k} ${k === 1 ? 'Nachkommastelle' : 'Nachkommastellen'}.`, explain: `${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts: ${M(`${a.toDec()} : ${b.toDec()} = ${A.toDec()} : ${Bb.toDec()}`)}` }],
    choose: ch('Welche Aufgabe hat dasselbe Ergebnis?', M(calc), [M(`${a.toDec()} : ${Bb.toDec()}`), M(`${A.toDec()} : ${b.toDec()}`)], 'Verschiebst du das Komma bei <b>beiden</b> Zahlen gleich weit, bleibt das Ergebnis gleich.'),
    preLines: [{ rule: 'Komma verschieben', lines: [`Bei beiden Zahlen ${k} ${k === 1 ? 'Stelle' : 'Stellen'} nach rechts: ${M(`${a.toDec()} : ${b.toDec()} = ${calc}`)}`] }],
    diag: x => (x.eq(a.div(Bb)) || x.eq(q(c, f)) ? 'Verschiebe das Komma bei <b>beiden</b> Zahlen gleich weit.' : null),
    plain: `${a.toDec()} : ${b.toDec()}`,
  });
}

const SCHRIFT: Topic = {
  id: 'schrift', klasse: 5, title: 'Schriftlich multiplizieren und dividieren', short: 'Große Zahlen und Kommazahlen schriftlich malnehmen und teilen, mit Überschlag.',
  exampleSol: () => { const t = mul2Task(false); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p><b>Schriftlich multiplizieren:</b> Du nimmst den ersten Faktor mit jeder Ziffer des zweiten Faktors mal. Jede Ziffer gibt eine Zeile. Die Zeilen rücken jeweils eine Stelle nach rechts. Zum Schluss zählst du alles zusammen.</p>
    ${mulPre('347', '26')}
    <p>Das ist dasselbe wie ${M('347 · 20 + 347 · 6 = 6940 + 2082 = 9022')}.</p>
    <p><b>Schriftlich dividieren:</b> Du gehst Ziffer für Ziffer von vorne. Wie oft passt der Teiler hinein? Den Rest nimmst du mit und holst die nächste Ziffer herunter.</p>
    ${divPre(936, 4)}
    <p><b>Überschlag:</b> Runde vorher, dann weißt du ungefähr, was herauskommen muss: ${M('347 · 26 ≈ 300 · 30 = 9000')}.</p>
    <p><b>Mit Kommazahlen:</b> Beim Malnehmen rechnest du erst ohne Komma. Dann hat das Ergebnis so viele Nachkommastellen wie beide Faktoren <b>zusammen</b>: ${M('4,25 · 3,6')}: ${M('425 · 36 = 15300')}, 2 + 1 = 3 Stellen, also ${M('15,300 = 15,3')}.</p>
    <p>Beim Teilen durch eine Kommazahl verschiebst du erst das Komma bei <b>beiden</b> Zahlen, bis der Teiler eine ganze Zahl ist: ${M('3,6 : 0,12 = 360 : 12 = 30')}.</p>
    ${merke(['Erst überschlagen, dann rechnen.', '· 10, · 100, · 1000: Komma 1, 2, 3 Stellen nach rechts. Bei : nach links.', 'Malnehmen mit Komma: Nachkommastellen zusammenzählen.', 'Teilen: Der Teiler muss eine ganze Zahl sein.'])}`,
  gen(level) {
    return genFrom(() => {
      if (level === 1) return Math.random() < 0.5 ? mul1Task() : div1Task();
      if (level === 2) return pick([() => mul2Task(false), div2Task, kommaShift, kommaWhy])();
      return pick([() => mul2Task(true), decMulTask, decDivTask, decDivTask])();
    }, t => t.answer.sign() > 0);
  },
  text: level => genFrom(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const n = R(21, 34), p = R(249, 489);
        if (n % 10 === 0) return null;
        const t = Math.floor(n / 10) * 10, o = n % 10;
        return wordTask({
          prompt: `Die Schule kauft ${n} Tablets. Ein Tablet kostet ${p} €. Wie viel kosten alle Tablets zusammen? Überschlage auch.`,
          steps: [
            { title: 'Überschlag', ask: `Überschlage: Wie viel ist ${roundTo(n, 10)} · ${roundTo(p, 100)}?`, calc: `${roundTo(n, 10)} · ${roundTo(p, 100)}`, unit: '€', hint: 'Erst ohne Nullen rechnen, dann die Nullen anhängen.' },
            { title: `${t} Tablets`, ask: `Rechne genau. Was kosten ${t} Tablets?`, calc: `${p} · ${t}`, pick: { ask: 'Welche Rechnung passt?', right: `${p} · ${n}`, wrong: [`${p} + ${n}`, `${p} : ${n}`] }, why: `Jedes der ${n} Tablets kostet ${p} €: mal. ${n} = ${t} + ${o}.`, unit: '€' },
            { title: `${o} Tablets`, ask: `Was kosten noch ${o} Tablets?`, calc: `${p} · ${o}`, unit: '€' },
            { title: 'Zusammen', ask: 'Was kosten alle Tablets zusammen?', calc: `${p * t} + ${p * o}`, unit: '€' },
          ],
          unit: '€', term: `${p} · ${n}`, sentence: v => `Alle Tablets kosten zusammen ${v}.`,
        });
      }
      const n = R(12, 24), p = R(21, 49), s = n * p;
      return wordTask({
        prompt: `Der Sportverein kauft ${n} gleiche Trikots und bezahlt dafür ${gz(s)} €. Wie viel kostet ein Trikot?`,
        steps: [{ title: 'Ein Trikot', ask: 'Wie viel kostet ein Trikot?', calc: `${s} : ${n}`, wrong: [`${s} · ${n}`, `${s} − ${n}`], why: 'Der Preis wird gleichmäßig auf alle Trikots verteilt: geteilt.', unit: '€', hint: `Schriftlich: Wie oft passt ${n} in die ersten Ziffern?` }],
        unit: '€', sentence: v => `Ein Trikot kostet ${v}.`,
      });
    }
    const n = R(22, 30), bus = n * R(28, 45), h = R(24, 36), k = R(2, 4), e = R(5, 12);
    return wordTask({
      prompt: `Die Klasse 6a (${n} Kinder) fährt ins Schullandheim. Der Bus kostet für alle zusammen ${gz(bus)} €. Die Übernachtung kostet ${h} € pro Kind und Nacht, sie bleiben ${k} Nächte. Dazu kommen ${e} € Eintritt pro Kind. Wie viel muss jedes Kind bezahlen?`,
      steps: [
        { title: 'Bus pro Kind', ask: 'Wie viel Busgeld muss jedes Kind bezahlen?', calc: `${bus} : ${n}`, wrong: [`${bus} · ${n}`, `${bus} − ${n}`], why: 'Die Buskosten werden auf alle Kinder verteilt.', unit: '€' },
        { title: 'Übernachtung', ask: `Was kosten ${k} Nächte für ein Kind?`, calc: `${h} · ${k}`, wrong: [`${h} + ${k}`], unit: '€' },
        { title: 'Zusammen pro Kind', ask: 'Wie viel muss jedes Kind insgesamt bezahlen?', calc: `${bus / n} + ${h * k} + ${e}`, unit: '€', hint: 'Bus, Übernachtung und Eintritt zusammenzählen.' },
      ],
      unit: '€', term: `${bus} : ${n} + ${h} · ${k} + ${e}`, sentence: v => `Jedes Kind muss ${v} bezahlen.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

/* =====================================================================
   3. Kreis
   ===================================================================== */
const PI = '3,14';
/** Kreis mit Mittelpunkt und beschriftetem Radius oder Durchmesser. `mark` hebt etwas rot hervor. */
function circFig(o: { r?: string; d?: string; mark?: 'M' | 'r' | 'd' | 'u'; half?: boolean; ring?: [string, string] } = {}): string {
  const cx = 110, cy = 100, R0 = 78;
  let s = '';
  if (o.ring) s += `<path class="sh" fill-rule="evenodd" d="M${cx - R0},${cy} a${R0},${R0} 0 1,0 ${2 * R0},0 a${R0},${R0} 0 1,0 ${-2 * R0},0 M${cx - 42},${cy} a42,42 0 1,0 84,0 a42,42 0 1,0 -84,0" />`;
  else if (o.half) s += `<path class="sh" d="M${cx - R0},${cy} A${R0},${R0} 0 0,1 ${cx + R0},${cy} Z" />`;
  else s += `<circle class="sh" cx="${cx}" cy="${cy}" r="${R0}" />`;
  if (o.mark === 'u') s += `<circle class="arc b" cx="${cx}" cy="${cy}" r="${R0}" style="stroke-width:5" />`;
  if (o.mark === 'r' || o.r) s += `<line class="${o.mark === 'r' ? 'arc b' : 'ray'}" style="stroke-width:${o.mark === 'r' ? 4 : 2.5}" x1="${cx}" y1="${cy}" x2="${cx + R0}" y2="${cy}" />`;
  if (o.mark === 'd' || o.d) s += `<line class="${o.mark === 'd' ? 'arc b' : 'ray'}" style="stroke-width:${o.mark === 'd' ? 4 : 2.5}" x1="${cx - R0}" y1="${cy}" x2="${cx + R0}" y2="${cy}" />`;
  if (o.ring) s += `<line class="ray" style="stroke-width:2.5" x1="${cx}" y1="${cy}" x2="${cx + R0 * 0.6}" y2="${cy - R0 * 0.8}" /><line class="ray" style="stroke-width:2.5" x1="${cx}" y1="${cy}" x2="${cx - 42}" y2="${cy}" /><text x="${cx + 40}" y="${cy - 34}">R = ${o.ring[0]}</text><text x="${cx - 21}" y="${cy - 8}" text-anchor="middle">r = ${o.ring[1]}</text>`;
  s += o.mark === 'M' ? `<circle class="arc b" cx="${cx}" cy="${cy}" r="6" style="stroke-width:4" />` : `<circle class="dot" cx="${cx}" cy="${cy}" r="3.5" />`;
  if (!o.mark) s += `<text x="${cx - 6}" y="${cy + 18}" text-anchor="middle">M</text>`;
  if (o.r) s += `<text x="${cx + R0 / 2}" y="${cy - 8}" text-anchor="middle">r = ${o.r}</text>`;
  if (o.d) s += `<text x="${cx + (o.half ? 0 : 0)}" y="${cy + (o.half ? 18 : -8)}" text-anchor="middle">d = ${o.d}</text>`;
  return `<svg class="fig" viewBox="20 ${o.half ? 10 : 10} 180 ${o.half ? 115 : 180}" role="img" aria-label="Kreis${o.r ? ` mit Radius ${o.r}` : ''}${o.d ? ` mit Durchmesser ${o.d}` : ''}">${s}</svg>`;
}
const UNITS_L = ['cm', 'cm', 'm', 'mm'];
function rdTask(): Task {
  const u = pick(UNITS_L);
  if (Math.random() < 0.5) {
    const r = R(2, 25);
    return calcTask(`Ein Kreis hat den Radius ${M(`r = ${r} ${u}`)}. Wie groß ist der Durchmesser d?${circFig({ r: `${r} ${u}` })}`, `2 · ${r}`, {
      unit: u, choose: ch('Wie hängen d und r zusammen?', M('d = 2 · r'), [M('d = r : 2'), M('d = r + 2')], 'Der Durchmesser geht durch den Mittelpunkt einmal ganz durch den Kreis. Er ist doppelt so lang wie der Radius.'),
      diag: v => (v.eq(q(r, 2)) ? 'Der Durchmesser ist <b>länger</b> als der Radius: doppelt so lang.' : null) });
  }
  const d = R(3, 40), r = q(d, 2);
  return calcTask(`Ein Kreis hat den Durchmesser ${M(`d = ${d} ${u}`)}. Wie groß ist der Radius r?${circFig({ d: `${d} ${u}` })}`, `${d} : 2`, {
    unit: u, form: r.isInt() ? undefined : 'dec', choose: ch('Wie hängen r und d zusammen?', M('r = d : 2'), [M('r = 2 · d'), M('r = d − 2')], 'Der Radius geht nur vom Mittelpunkt bis zum Rand. Er ist halb so lang wie der Durchmesser.'),
    diag: v => (v.eq(q(2 * d)) ? 'Der Radius ist <b>kürzer</b> als der Durchmesser: halb so lang.' : null) });
}
function begriffKreis(): Task {
  const m = pick(['M', 'r', 'd', 'u'] as const);
  const N = { M: 'Mittelpunkt', r: 'Radius', d: 'Durchmesser', u: 'Umfang (Kreislinie)' };
  const FB: Record<string, string> = { M: 'Der Mittelpunkt ist nur ein Punkt in der Mitte.', r: 'Der Radius geht vom Mittelpunkt bis zum Rand, nur halb durch.', d: 'Der Durchmesser geht durch den Mittelpunkt ganz durch den Kreis.', u: 'Der Umfang ist die ganze Kreislinie außen herum.' };
  return pickTask(`Was ist im Bild <b>rot</b> markiert?${circFig({ mark: m })}`, { html: N[m] }, (Object.keys(N) as (keyof typeof N)[]).filter(k => k !== m).map(k => ({ html: N[k], fb: FB[k] })), [`Rot markiert ist der <b>${N[m]}</b>. ${FB[m]}`], [], 'Kreisbegriffe');
}
function piPick(): Task {
  return pickTask('Was bedeutet die Zahl <b>π</b> (gesprochen „Pi“)?', { html: `Bei jedem Kreis ist Umfang : Durchmesser gleich, nämlich etwa ${PI}. Das ist π.` },
    [{ html: 'π ist Durchmesser : Radius, also 2.', fb: 'Durchmesser : Radius ist bei jedem Kreis 2. Das ist nicht π.' }, { html: 'π ist der Umfang eines Kreises mit Radius 1 cm, also genau 3 cm.', fb: 'π ist keine Länge mit Einheit und auch nicht genau 3.' }, { html: 'π ist für jeden Kreis eine andere Zahl.', fb: 'Gerade nicht: π ist bei großen und kleinen Kreisen gleich.' }],
    [`Misst du bei einem Kreis den Umfang und teilst durch den Durchmesser, kommt immer etwa ${PI} heraus. Diese Zahl heißt π.`, `Darum gilt: ${M(`u = d · π ≈ d · ${PI}`)}.`], [], 'Die Zahl π');
}
function umfangTask(): Task {
  const u = pick(['cm', 'cm', 'm']);
  if (Math.random() < 0.5) {
    const d = R(2, 30);
    return calcTask(`Ein Kreis hat den Durchmesser ${M(`d = ${d} ${u}`)}. Berechne den Umfang u. Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ d: `${d} ${u}` })}`, `${d} · ${PI}`, {
      unit: u, form: 'dec', choose: ch('Welche Formel passt?', M(`u = d · ${PI}`), [M(`u = d · d · ${PI}`), M(`u = d : ${PI}`)], 'Der Umfang ist etwa 3,14-mal so lang wie der Durchmesser.'),
      diag: v => (v.eq(val(`${d} : 2 · ${PI}`)) ? 'Du hast mit dem Radius gerechnet. Gegeben ist der Durchmesser: u = d · 3,14.' : v.eq(val(`2 · ${d} · ${PI}`)) ? 'Gegeben ist schon der Durchmesser. Du musst ihn nicht verdoppeln.' : null) });
  }
  const r = R(2, 15);
  return calcTask(`Ein Kreis hat den Radius ${M(`r = ${r} ${u}`)}. Berechne den Umfang u. Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ r: `${r} ${u}` })}`, `2 · ${r} · ${PI}`, {
    unit: u, form: 'dec', choose: ch('Welche Formel passt?', M(`u = 2 · r · ${PI}`), [M(`u = r · ${PI}`), M(`u = r · r · ${PI}`)], 'Der Umfang ist d · 3,14 und der Durchmesser ist d = 2 · r.'),
    diag: v => (v.eq(val(`${r} · ${PI}`)) ? 'Du hast den Radius statt den Durchmesser genommen. Der Durchmesser ist doppelt so lang: d = 2 · r.' : v.eq(val(`${r} · ${r} · ${PI}`)) ? 'Das ist die <b>Fläche</b>. Für den Umfang rechnest du 2 · r · 3,14.' : null) });
}
function flaecheTask(): Task {
  const u = pick(['cm', 'cm', 'm']);
  if (Math.random() < 0.55) {
    const r = R(2, 12);
    return calcTask(`Ein Kreis hat den Radius ${M(`r = ${r} ${u}`)}. Berechne den Flächeninhalt A. Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ r: `${r} ${u}` })}`, `${r} · ${r} · ${PI}`, {
      unit: `${u}²`, form: 'dec', choose: ch('Welche Formel passt?', M(`A = r · r · ${PI}`), [M(`A = 2 · r · ${PI}`), M(`A = r · ${PI}`)], 'Die Fläche ist etwa 3,14 Quadrate mit der Seitenlänge r.'),
      diag: v => (v.eq(val(`2 · ${r} · ${PI}`)) ? 'Das ist der <b>Umfang</b>. Für die Fläche rechnest du r · r · 3,14.' : v.eq(val(`2 · ${r} · 2 · ${r} · ${PI}`)) ? 'Du hast den Durchmesser genommen. Für die Fläche brauchst du den Radius.' : null) });
  }
  const r = R(2, 12), d = 2 * r;
  return calcTask(`Ein Kreis hat den Durchmesser ${M(`d = ${d} ${u}`)}. Berechne den Flächeninhalt A. Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ d: `${d} ${u}` })}`, `${r} · ${r} · ${PI}`, {
    unit: `${u}²`, form: 'dec',
    pre: [{ title: 'Erst der Radius', ask: `<p>Für die Fläche brauchst du den Radius. Wie lang ist r, wenn ${M(`d = ${d} ${u}`)}?</p>`, answer: q(r), hint: 'r = d : 2', explain: M(`r = ${d} : 2 = ${r}`) + ` ${u}`, placeholder: `Antwort in ${u}` }],
    choose: ch('Welche Formel brauchst du für die Fläche?', M(`A = r · r · ${PI}`), [M(`A = d · ${PI}`), M(`A = d · d · ${PI}`)], 'Die Fläche rechnest du mit dem Radius: r · r · 3,14.'),
    preLines: [{ rule: 'Radius', lines: [M(`r = ${d} : 2 = ${r}`) + ` ${u}`] }],
    diag: v => (v.eq(val(`${d} · ${d} · ${PI}`)) ? 'Du hast mit dem Durchmesser statt mit dem Radius gerechnet. Erst r = d : 2.' : v.eq(val(`${d} · ${PI}`)) ? 'Das ist der <b>Umfang</b>. Gefragt ist die Fläche.' : null) });
}
function kreis3Task(): Task {
  const k = R(0, 3), u = pick(['cm', 'm']);
  if (k === 0) {
    const d = R(3, 30), U = val(`${d} · ${PI}`);
    return calcTask(`Ein Kreis hat den Umfang ${M(`u = ${dH(U)} ${u}`)}. Wie groß ist sein Durchmesser? Rechne mit ${M(`π ≈ ${PI}`)}.`, `${U.toDec()} : ${PI}`, {
      unit: u, choose: ch('Wie kommst du rückwärts zum Durchmesser?', M(`d = u : ${PI}`), [M(`d = u · ${PI}`), M(`d = u : 2`)], `Es gilt u = d · 3,14. Rückwärts rechnest du also geteilt durch 3,14.`),
      diag: v => (v.eq(val(`${U.toDec()} : ${PI} : 2`)) ? 'Das ist der Radius. Gefragt ist der Durchmesser.' : null) });
  }
  if (k === 1) {
    const r = R(2, 10) * 2;
    return calcTask(`Berechne den Flächeninhalt des Halbkreises mit ${M(`r = ${r} ${u}`)}. Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ half: true, r: `${r} ${u}` })}`, `${r} · ${r} · ${PI} : 2`, {
      unit: `${u}²`, form: 'dec', choose: ch('Wie rechnest du die Fläche vom Halbkreis?', M(`A = r · r · ${PI} : 2`), [M(`A = r · r · ${PI}`), M(`A = r · ${PI} : 2`)], 'Ein Halbkreis ist die Hälfte vom ganzen Kreis: erst die ganze Kreisfläche, dann durch 2.'),
      diag: v => (v.eq(val(`${r} · ${r} · ${PI}`)) ? 'Das ist der ganze Kreis. Der Halbkreis ist nur die Hälfte davon.' : null) });
  }
  if (k === 2) {
    const d = R(2, 15) * 2;
    return calcTask(`Ein Halbkreis hat den Durchmesser ${M(`d = ${d} ${u}`)}. Wie lang ist sein ganzer Rand (Bogen und gerade Seite)? Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ half: true, d: `${d} ${u}` })}`, `${d} · ${PI} : 2 + ${d}`, {
      unit: u, form: 'dec', choose: ch('Was gehört alles zum Rand?', M(`${d} · ${PI} : 2 + ${d}`), [M(`${d} · ${PI} : 2`), M(`${d} · ${PI} + ${d}`)], 'Der Rand besteht aus dem halben Kreisbogen und der geraden Seite, dem Durchmesser.'),
      diag: v => (v.eq(val(`${d} · ${PI} : 2`)) ? 'Das ist nur der Bogen. Die gerade Seite (der Durchmesser) gehört auch zum Rand.' : null) });
  }
  const Rr = R(5, 12), r = R(2, Rr - 2);
  return calcTask(`Ein Kreisring hat außen den Radius ${M(`R = ${Rr} ${u}`)} und innen den Radius ${M(`r = ${r} ${u}`)}. Wie groß ist die gefärbte Fläche? Rechne mit ${M(`π ≈ ${PI}`)}.${circFig({ ring: [`${Rr} ${u}`, `${r} ${u}`] })}`, `${Rr} · ${Rr} · ${PI} − ${r} · ${r} · ${PI}`, {
    unit: `${u}²`, form: 'dec', choose: ch('Wie rechnest du die Ringfläche?', M(`R · R · ${PI} − r · r · ${PI}`), [M(`(R − r) · (R − r) · ${PI}`), M(`R · R · ${PI} + r · r · ${PI}`)], 'Großer Kreis minus das Loch in der Mitte.'),
    diag: v => (v.eq(val(`${Rr - r} · ${Rr - r} · ${PI}`)) ? 'So geht es nicht: Rechne erst die große Kreisfläche, dann die kleine, und ziehe ab.' : null) });
}
const KREIS: Topic = {
  id: 'kreis', klasse: 6, title: 'Kreis', short: 'Radius und Durchmesser, Umfang und Fläche mit π ≈ 3,14.',
  exampleSol: () => { const t = umfangTask(); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Alle Punkte auf einem <b>Kreis</b> sind gleich weit vom <b>Mittelpunkt M</b> entfernt. Diese Entfernung heißt <b>Radius r</b>. Der <b>Durchmesser d</b> geht durch den Mittelpunkt einmal ganz durch: ${M('d = 2 · r')}.</p>
    <div class="fig-row"><figure>${circFig({ r: 'r' })}<figcaption>Radius</figcaption></figure><figure>${circFig({ d: 'd' })}<figcaption>Durchmesser</figcaption></figure></div>
    <p>Bei jedem Kreis ist der Umfang etwa 3,14-mal so lang wie der Durchmesser. Diese Zahl heißt <b>π</b> („Pi“). Wir rechnen mit ${M(`π ≈ ${PI}`)}.</p>
    <p><b>Umfang:</b> ${M(`u = d · ${PI}`)} oder ${M(`u = 2 · r · ${PI}`)}. Beispiel: ${M('r = 5 cm')}: ${M(`u = 2 · 5 · ${PI} = 31,4`)} cm.</p>
    <p><b>Flächeninhalt:</b> ${M(`A = r · r · ${PI}`)}. Beispiel: ${M(`A = 5 · 5 · ${PI} = 78,5`)} cm².</p>
    <p>Ein <b>Halbkreis</b> hat die halbe Fläche. Beim <b>Kreisring</b> rechnest du großen Kreis minus kleinen Kreis.</p>
    ${merke(['d = 2 · r und r = d : 2.', 'Umfang: d · 3,14. Fläche: r · r · 3,14.', 'Für die Fläche immer den <b>Radius</b> nehmen!', 'Rückwärts: d = u : 3,14.'])}`,
  gen(level) {
    return genFrom(() => {
      if (level === 1) return pick([rdTask, rdTask, begriffKreis, piPick])();
      if (level === 2) return Math.random() < 0.5 ? umfangTask() : flaecheTask();
      return Math.random() < 0.75 ? kreis3Task() : flaecheTask();
    }, t => t.answer.sign() > 0);
  },
  text: level => genFrom(() => {
    if (level === 4) {
      if (Math.random() < 0.55) {
        const d = pick([50, 55, 60, 65, 70]), n = 10;
        const t = wordTask({
          prompt: `Ein Fahrradreifen hat einen Durchmesser von ${d} cm. Wie viele Meter fährt das Fahrrad, wenn sich das Rad ${n}-mal dreht? Rechne mit π ≈ ${PI}.`,
          steps: [
            { title: 'Eine Umdrehung', ask: 'Wie weit kommt das Rad bei einer Umdrehung? Das ist der Umfang.', calc: `${d} · ${PI}`, wrong: [`${d} · ${d} · ${PI}`, `${d} : 2 · ${PI}`], why: 'Bei einer Umdrehung rollt der Reifen einmal seinen Umfang ab: u = d · 3,14.', unit: 'cm' },
            { title: `${n} Umdrehungen`, ask: `Wie weit kommt das Rad bei ${n} Umdrehungen?`, calc: `${dc(d * 3.14)} · ${n}`, unit: 'cm', hint: 'Mal 10: Komma eine Stelle nach rechts.' },
            { title: 'In Meter', ask: 'Wie viele Meter sind das?', calc: `${dc(d * 3.14 * n)} : 100`, wrong: [`${dc(d * 3.14 * n)} : 10`, `${dc(d * 3.14 * n)} : 1000`], why: '1 m = 100 cm.', unit: 'm' },
          ],
          unit: 'm', sentence: v => `Das Fahrrad fährt ${v} weit.`,
        });
        return { ...t, form: 'dec' as const };
      }
      const d = R(3, 8), p = R(4, 9);
      const t = wordTask({
        prompt: `Ein rundes Blumenbeet hat einen Durchmesser von ${d} m. Herum soll ein Zaun. 1 m Zaun kostet ${p} €. Wie teuer ist der Zaun? Rechne mit π ≈ ${PI}.`,
        steps: [
          { title: 'Länge des Zauns', ask: 'Wie lang muss der Zaun sein?', calc: `${d} · ${PI}`, wrong: [`${d / 2} · ${d / 2} · ${PI}`, `2 · ${d} · ${PI}`], why: 'Der Zaun geht einmal außen herum. Das ist der Umfang: u = d · 3,14.', unit: 'm' },
          { title: 'Preis', ask: 'Wie viel kostet der Zaun?', calc: `${dc(d * 3.14)} · ${p}`, wrong: [`${dc(d * 3.14)} + ${p}`], unit: '€' },
        ],
        unit: '€', term: `${d} · ${PI} · ${p}`, sentence: v => `Der Zaun kostet ${v}.`,
      });
      return { ...t, form: 'dec' as const };
    }
    const D = pick([30, 32, 34, 36]), d = pick([20, 22, 24, 26]);
    const big = D / 2, small = d / 2;
    const AB = big * big * 3.14, AS = 2 * small * small * 3.14;
    if (Math.abs(AB - AS) < 10) return null;
    const bigWins = AB > AS;
    const t = wordTask({
      prompt: `In der Pizzeria gibt es eine große Pizza mit ${D} cm Durchmesser oder zwei kleine mit je ${d} cm Durchmesser. Beide Angebote kosten gleich viel. Bei welchem Angebot bekommst du mehr Pizza, und wie viel cm² mehr ist es? Rechne mit π ≈ ${PI}.`,
      steps: [
        { title: 'Große Pizza', ask: `Wie groß ist die Fläche der großen Pizza? Ihr Radius ist ${D} : 2 = ${big} cm.`, calc: `${big} · ${big} · ${PI}`, wrong: [`${D} · ${D} · ${PI}`, `${D} · ${PI}`], why: 'Fläche mit dem Radius: r · r · 3,14.', unit: 'cm²' },
        { title: 'Eine kleine Pizza', ask: `Wie groß ist die Fläche einer kleinen Pizza? Ihr Radius ist ${small} cm.`, calc: `${small} · ${small} · ${PI}`, unit: 'cm²' },
        { title: 'Zwei kleine Pizzen', ask: 'Wie viel Fläche haben die zwei kleinen Pizzen zusammen?', calc: `2 · ${dc(small * small * 3.14)}`, unit: 'cm²' },
        { title: 'Vergleichen', ask: `Wie viel cm² mehr ${bigWins ? 'hat die große Pizza' : 'haben die zwei kleinen'}?`, calc: bigWins ? `${dc(AB)} − ${dc(AS)}` : `${dc(AS)} − ${dc(AB)}`, unit: 'cm²', hint: 'Größere Fläche minus kleinere Fläche.' },
      ],
      unit: 'cm²', sentence: v => `${bigWins ? 'Die große Pizza' : 'Die zwei kleinen Pizzen'} ${bigWins ? 'hat' : 'haben'} ${v} mehr.`,
    });
    return { ...t, form: 'dec' as const };
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

/* =====================================================================
   4. Flächen- und Volumeneinheiten
   ===================================================================== */
const AREA = ['mm²', 'cm²', 'dm²', 'm²', 'a', 'ha', 'km²'];
const VOL = ['mm³', 'cm³', 'dm³', 'm³'];
const UNAME: Record<string, string> = { a: 'a (Ar)', ha: 'ha (Hektar)' };
const un = (u: string) => UNAME[u] ?? u;
/** Wie die Einheit im Eingabefeld-Platzhalter steht (ha und a kann man nicht mit eintippen) */
const ph = (u: string) => (u === 'a' || u === 'ha' ? `Zahl in ${u}` : `Antwort in ${u}`);
interface Conv { v: Q; from: string; to: string; f: number; steps: number }
function convOf(lad: string[], f: number, v: Q, from: string, to: string): Conv { return { v, from, to, f, steps: lad.indexOf(to) - lad.indexOf(from) }; }
/** Umrechnen: Ergebnis und die Rechnung als Text */
function convCalc(c: Conv): string {
  const tot = c.f ** Math.abs(c.steps);
  return c.steps < 0 ? `${c.v.toDec()} · ${tot}` : `${c.v.toDec()} : ${tot}`;
}
function convTask(c: Conv, level: number): Task {
  const n = Math.abs(c.steps), down = c.steps < 0, tot = c.f ** n, calc = convCalc(c), res = val(calc);
  const name = c.f === 100 ? 'Flächeneinheiten' : 'Volumeneinheiten';
  const why = `Bei ${name} ist die Umrechnungszahl ${c.f}${n > 1 ? `, über ${n} Stufen also ${n === 2 ? `${c.f} · ${c.f}` : `${c.f} · ${c.f} · ${c.f}`} = ${gz(tot)}` : ''}. In eine ${down ? 'kleinere Einheit: mal' : 'größere Einheit: geteilt'}.`;
  const right = `${down ? '·' : ':'} ${gz(tot)}`;
  const wrongs = [`${down ? ':' : '·'} ${gz(tot)}`, `${down ? '·' : ':'} ${gz(10 ** n)}`, `${down ? '·' : ':'} ${gz((c.f === 100 ? 1000 : 100) ** n)}`];
  const prompt = `Rechne um: ${M(`${nH(c.v)} ${c.from} = ? ${c.to}`)}`;
  const diag = (v: Q) => (v.eq(down ? c.v.div(q(tot)) : c.v.mul(q(tot))) ? `Falsche Richtung! In eine ${down ? 'kleinere' : 'größere'} Einheit rechnest du ${down ? 'mal' : 'geteilt'}.` : v.eq(down ? c.v.mul(q(10 ** n)) : c.v.div(q(10 ** n))) ? `Bei ${name} ist die Umrechnungszahl ${c.f}, nicht 10.` : null);
  if (n === 1 || level === 1) {
    return calcTask(prompt, calc, { unit: c.to, placeholder: ph(c.to), form: res.isInt() ? undefined : 'dec', diag, plain: `${c.v.toDec()} ${c.from} in ${c.to}`,
      choose: ch('Mit welcher Zahl rechnest du um?', M(right), wrongs.map(M), why),
      lines: [{ rule: 'Umrechnungszahl', lines: [why] }, { rule: 'Rechnen', lines: [`${M(`${nH(c.v)} ${c.from} = ${evalExpr(calc).inputHTML} ${c.to} = ${nH(res)} ${c.to}`)}`, `${down ? 'Mal' : 'Geteilt durch'} ${gz(tot)}: Das Komma wandert ${String(tot).length - 1} Stellen nach ${down ? 'rechts' : 'links'}.`] }] });
  }
  // mehrere Stufen: Stufe für Stufe
  const lad = c.f === 100 ? AREA : VOL;
  const i0 = lad.indexOf(c.from), dir = down ? -1 : 1;
  const g: GuideStep[] = []; const lines: string[] = [];
  let cur = c.v;
  for (let k = 1; k <= n; k++) {
    const u = lad[i0 + dir * k], nxt = down ? cur.mul(q(c.f)) : cur.div(q(c.f));
    g.push({ title: `In ${u}`, ask: `<p>${M(`${nH(cur)} ${lad[i0 + dir * (k - 1)]}`)} sind wie viel ${un(u)}?</p>`, answer: nxt, hint: `${down ? 'Mal' : 'Geteilt durch'} ${c.f}.`, explain: M(`${nH(cur)} ${lad[i0 + dir * (k - 1)]} = ${nH(nxt)} ${u}`), placeholder: ph(u) });
    lines.push(M(`${nH(cur)} ${lad[i0 + dir * (k - 1)]} = ${nH(nxt)} ${u}`));
    cur = nxt;
  }
  g[0] = { ...g[0], choose: ch(`Mit welcher Zahl rechnest du insgesamt von ${c.from} in ${c.to} um?`, M(right), wrongs.map(M), why) };
  return { prompt, plain: `${c.v.toDec()} ${c.from} in ${c.to}`, answer: res, form: res.isInt() ? undefined : 'dec', placeholder: ph(c.to), guide: g, diag,
    sol: list([{ rule: 'Umrechnungszahl', lines: [why] }, { rule: 'Stufe für Stufe', lines }, { rule: 'Auf einmal', lines: [M(`${nH(c.v)} ${c.from} = ${nH(c.v)} ${right} ${c.to} = ${nH(res)} ${c.to}`)] }], res, `${nH(res)} ${c.to}`) };
}
const LITER: [string, string, number][] = [['l', 'ml', 1000], ['dm³', 'l', 1], ['cm³', 'ml', 1]];
function literTask(level: number): Task {
  const [a, b, f] = pick(LITER);
  const rev = Math.random() < 0.5;
  const v = f === 1 ? q(R(2, 900)) : rev ? q(R(2, 90) * (level > 1 ? 10 : 100)) : level > 1 ? q(R(11, 99), 10) : q(R(2, 9));
  const from = rev ? b : a, to = rev ? a : b;
  const calc = f === 1 ? `${v.toDec()} · 1` : rev ? `${v.toDec()} : 1000` : `${v.toDec()} · 1000`;
  const res = val(calc);
  const why = f === 1 ? `${a === 'dm³' ? '1 dm³ = 1 l' : '1 cm³ = 1 ml'}. Die Zahl bleibt gleich.` : `1 l = 1000 ml. In eine ${rev ? 'größere Einheit: geteilt' : 'kleinere Einheit: mal'}.`;
  const right = f === 1 ? 'gleich bleiben (· 1)' : `${rev ? ':' : '·'} 1000`;
  const wrong = f === 1 ? ['· 1000', '· 100'] : [`${rev ? '·' : ':'} 1000`, `${rev ? ':' : '·'} 100`];
  return calcTask(`Rechne um: ${M(`${nH(v)} ${from} = ? ${to}`)}`, calc, { unit: to, placeholder: ph(to), form: res.isInt() ? undefined : 'dec',
    choose: ch('Mit welcher Zahl rechnest du um?', M(right), wrong.map(M), why),
    lines: [{ rule: 'Umrechnen', lines: [why, M(`${nH(v)} ${from} = ${nH(res)} ${to}`)] }],
    diag: x => (f === 1 && !x.eq(v) ? why : f === 1000 && x.eq(rev ? v.mul(q(1000)) : v.div(q(1000))) ? 'Falsche Richtung!' : null) });
}
function nbConv(level: number): Task {
  const vol = Math.random() < 0.4, lad = vol ? VOL : AREA, f = vol ? 1000 : 100;
  const i = R(0, lad.length - 2), down = Math.random() < 0.5;
  const from = down ? lad[i + 1] : lad[i], to = down ? lad[i] : lad[i + 1];
  const v = down ? (level > 1 ? q(R(11, 99), 10) : q(R(2, 60))) : q(R(2, 60) * f);
  return convTask(convOf(lad, f, v, from, to), level);
}
function farConv(): Task {
  const k = R(0, 3);
  if (k === 0) { const v = Math.random() < 0.5 ? q(R(2, 9)) : q(R(11, 99), 10); return convTask(convOf(AREA, 100, v, 'm²', 'cm²'), 2); }
  if (k === 1) { const v = Math.random() < 0.5 ? q(R(2, 9)) : q(R(11, 49), 10); return convTask(convOf(AREA, 100, v, 'ha', 'm²'), 2); }
  if (k === 2) { const v = q(R(2, 80) * 10000); return convTask(convOf(AREA, 100, v, 'm²', 'ha'), 2); }
  return convTask(convOf(VOL, 1000, q(R(2, 9)), 'm³', 'cm³'), 2);
}
function mixedTask(): Task {
  const vol = Math.random() < 0.35;
  const [big, small, f] = vol ? pick([['dm³', 'cm³', 1000], ['m³', 'dm³', 1000]] as [string, string, number][]) : pick([['m²', 'dm²', 100], ['dm²', 'cm²', 100], ['ha', 'a', 100], ['m²', 'cm²', 10000]] as [string, string, number][]);
  const a = R(2, 9), b = f === 100 ? (Math.random() < 0.3 ? R(1, 9) : R(11, 99)) : f === 1000 ? (Math.random() < 0.3 ? R(5, 95) : R(101, 999)) : R(101, 9999);
  return mixedBuild(a, b, big, small, f);
}
/** gemischte Angabe: nur Vorschritte, kein doppeltes Ausrechnen */
function mixedBuild(a: number, b: number, big: string, small: string, f: number): Task {
  const res = a * f + b;
  return { prompt: `Rechne um: ${M(`${a} ${big} ${b} ${small} = ? ${small}`)}`, plain: `${a} ${big} ${b} ${small} in ${small}`, answer: q(res), placeholder: ph(small),
    guide: [
      { title: `${a} ${big} umrechnen`, choose: ch(`Wie viel ${small} sind 1 ${big}?`, M(`${gz(f)} ${small}`), [M(`${gz(f / 10)} ${small}`), M(`${gz(f * 10)} ${small}`)], f === 1000 ? 'Bei Volumeneinheiten ist die Umrechnungszahl 1000.' : f === 100 ? 'Bei Flächeneinheiten ist die Umrechnungszahl 100.' : 'Von m² zu cm² sind es zwei Stufen: 100 · 100 = 10 000.'),
        ask: `<p>Wie viel ${un(small)} sind ${M(`${a} ${big}`)}?</p>`, answer: q(a * f), hint: `1 ${big} = ${gz(f)} ${small}`, explain: M(`${a} ${big} = ${gz(a * f)} ${small}`), placeholder: ph(small) },
      { title: 'Dazuzählen', ask: `<p>Jetzt kommen noch ${M(`${b} ${small}`)} dazu. Wie viel ${un(small)} sind es zusammen?</p>`, answer: q(res), hint: `${gz(a * f)} + ${b}`, explain: M(`${gz(a * f)} ${small} + ${b} ${small} = ${gz(res)} ${small}`), placeholder: ph(small) },
    ],
    sol: list([{ rule: 'Erst die große Einheit', lines: [M(`${a} ${big} = ${a} · ${gz(f)} ${small} = ${gz(a * f)} ${small}`)] }, { rule: 'Dann dazuzählen', lines: [M(`${gz(a * f)} ${small} + ${b} ${small} = ${gz(res)} ${small}`)] }], q(res), `${gz(res)} ${small}`),
    diag: v => (v.eq(q(Number(`${a}${b}`))) && String(b).length < String(f).length - 1 ? `Vorsicht: ${a} ${big} sind ${gz(a * f)} ${small}. Die ${b} ${small} kommen dazu. Du darfst die Ziffern nicht einfach hintereinander schreiben.` : null) };
}
function compareTask(): Task {
  const k = R(0, 2);
  let A: Q, ua: string, Bv: Q, ub: string, f: number;
  if (k === 0) { f = 10000; A = q(R(1, 9), 10); ua = 'm²'; ub = 'cm²'; Bv = q(Number(A.mul(q(f)).n) + pick([-1, 1, 0]) * R(1, 4) * 100); }
  else if (k === 1) { f = 100; A = q(R(11, 99), 10); ua = 'dm²'; ub = 'cm²'; Bv = q(Number(A.mul(q(f)).n) + pick([-1, 1, 0]) * R(1, 9) * 10); }
  else { f = 1000; A = q(R(11, 49), 10); ua = 'l'; ub = 'cm³'; Bv = q(Number(A.mul(q(f)).n) + pick([-1, 1, 0]) * R(1, 9) * 100); }
  if (Bv.sign() <= 0) return compareTask();
  const Ac = A.mul(q(f)), cmp = Ac.lt(Bv) ? 1 : Bv.lt(Ac) ? 0 : 2;
  const oA = `${dH(A)} ${ua}`, oB = `${gz(Bv.n)} ${ub}`, same = 'Beide sind gleich groß.';
  const names = [oA, oB, same];
  const right = names[cmp];
  const conv = ua === 'l' ? `1 l = 1 dm³ = 1000 cm³` : `1 ${ua} = ${gz(f)} ${ub}`;
  return pickTask(`Was ist mehr: ${M(oA)} oder ${M(oB)}?`, { html: right }, names.filter(n => n !== right).map(n => ({ html: n, fb: `Rechne erst beide in ${ub} um: ${dH(A)} ${ua} = ${gz(Ac.n)} ${ub}.` })),
    [`Erst in dieselbe Einheit umrechnen: ${conv}.`, `${M(`${dH(A)} ${ua} = ${gz(Ac.n)} ${ub}`)}. Vergleiche mit ${M(oB)}.`, cmp === 2 ? 'Beide sind gleich groß.' : `Also ist ${M(right)} mehr.`],
    [{ title: 'Gleiche Einheit', ask: `<p>Rechne ${M(oA)} in ${ub} um. ${ua === 'l' ? 'Denk an 1 l = 1 dm³.' : ''}</p>`, answer: Ac, hint: conv, explain: `${M(`${dH(A)} ${ua} = ${gz(Ac.n)} ${ub}`)}. Jetzt kannst du vergleichen.`, placeholder: ph(ub) }], 'Vergleichen');
}
function literVolTask(): Task {
  const v = q(R(11, 99), 10), toCm = Math.random() < 0.6;
  if (toCm) {
    const res = v.mul(q(1000));
    return { prompt: `Rechne um: ${M(`${dH(v)} l = ? cm³`)}`, plain: `${v.toDec()} l in cm³`, answer: res, placeholder: ph('cm³'),
      guide: [
        { title: 'Liter in dm³', choose: ch('Welcher Würfel fasst genau 1 Liter?', M('1 dm³'), [M('1 cm³'), M('1 m³')], 'Ein Würfel mit 10 cm Kantenlänge fasst genau 1 Liter: 1 l = 1 dm³.'), ask: `<p>Wie viel dm³ sind ${M(`${dH(v)} l`)}?</p>`, answer: v, hint: '1 l = 1 dm³', explain: M(`${dH(v)} l = ${dH(v)} dm³`), placeholder: ph('dm³') },
        { title: 'dm³ in cm³', ask: `<p>Wie viel cm³ sind ${M(`${dH(v)} dm³`)}?</p>`, answer: res, hint: '1 dm³ = 1000 cm³: mal 1000.', explain: M(`${dH(v)} dm³ = ${gz(res.n)} cm³`), placeholder: ph('cm³') },
      ],
      sol: list([{ rule: 'Liter in dm³', lines: [M(`1 l = 1 dm³`), M(`${dH(v)} l = ${dH(v)} dm³`)] }, { rule: 'dm³ in cm³', lines: [M(`${dH(v)} dm³ = ${dH(v)} · 1000 cm³ = ${gz(res.n)} cm³`)] }], res, `${gz(res.n)} cm³`),
      diag: x => (x.eq(v.mul(q(100))) ? 'Bei Volumeneinheiten ist die Umrechnungszahl 1000, nicht 100.' : null) };
  }
  const c = q(R(2, 9) * 1000 + R(1, 9) * 100), res = c.div(q(1000));
  return { prompt: `Ein Topf fasst ${M(`${gz(c.n)} cm³`)}. Wie viele Liter sind das?`, plain: `${c.n} cm³ in l`, answer: res, form: 'dec', placeholder: ph('l'),
    guide: [
      { title: 'cm³ in dm³', choose: ch('Wie rechnest du von cm³ in dm³ um?', M(': 1000'), [M(': 100'), M('· 1000')], 'Bei Volumeneinheiten ist die Umrechnungszahl 1000. In die größere Einheit: geteilt.'), ask: `<p>Wie viel dm³ sind ${M(`${gz(c.n)} cm³`)}?</p>`, answer: res, hint: ': 1000', explain: M(`${gz(c.n)} cm³ = ${dH(res)} dm³`), placeholder: ph('dm³') },
      { title: 'dm³ in Liter', ask: `<p>1 dm³ = 1 l. Wie viele Liter sind ${M(`${dH(res)} dm³`)}?</p>`, answer: res, hint: 'Die Zahl bleibt gleich.', explain: M(`${dH(res)} dm³ = ${dH(res)} l`), placeholder: ph('l') },
    ],
    sol: list([{ rule: 'cm³ in dm³', lines: [M(`${gz(c.n)} cm³ = ${gz(c.n)} : 1000 dm³ = ${dH(res)} dm³`)] }, { rule: 'dm³ in Liter', lines: [M(`1 dm³ = 1 l`), M(`${dH(res)} dm³ = ${dH(res)} l`)] }], res, `${dH(res)} l`) };
}
const EINH2: Topic = {
  id: 'einh2', klasse: 6, title: 'Flächen- und Volumeneinheiten', short: 'mm² bis km² und mm³ bis m³ umrechnen, Liter und Milliliter.',
  exampleSol: () => { const t = farConv(); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Ein Quadrat mit 1 cm Seitenlänge hat die Fläche <b>1 cm²</b>. Ein Quadrat mit 1 dm = 10 cm Seitenlänge passt 10 · 10 = <b>100</b> solche Quadrate. Darum ist bei Flächen die Umrechnungszahl <b>100</b>.</p>
    <table class="stellen"><tr><th>km²</th><th>ha</th><th>a</th><th>m²</th><th>dm²</th><th>cm²</th><th>mm²</th></tr><tr><td colspan="7">jeweils · 100 nach rechts, : 100 nach links</td></tr></table>
    <p>1 a (Ar) = 100 m², das ist ein Quadrat mit 10 m Seitenlänge. 1 ha (Hektar) = 100 a = 10 000 m². 1 km² = 100 ha.</p>
    <p>Ein Würfel mit 1 dm Kantenlänge passt 10 · 10 · 10 = <b>1000</b> Würfel mit 1 cm. Darum ist bei Volumen die Umrechnungszahl <b>1000</b>.</p>
    <table class="stellen"><tr><th>m³</th><th>dm³</th><th>cm³</th><th>mm³</th></tr><tr><td colspan="4">jeweils · 1000 nach rechts, : 1000 nach links</td></tr></table>
    <p><b>Liter:</b> ${M('1 dm³ = 1 l')} und ${M('1 cm³ = 1 ml')}. ${M('1 l = 1000 ml')}.</p>
    <p>Beispiele: ${M('3,5 m² = 350 dm²')} · ${M('2 m² 35 dm² = 235 dm²')} · ${M('4,2 l = 4,2 dm³ = 4200 cm³')}</p>
    ${merke(['Länge: 10 · Fläche: 100 · Volumen: 1000.', 'In eine kleinere Einheit: mal. In eine größere: geteilt.', 'Vor dem Vergleichen alles in dieselbe Einheit bringen.', '1 dm³ = 1 l, 1 cm³ = 1 ml.'])}`,
  gen(level) {
    return genFrom(() => {
      if (level === 1) return Math.random() < 0.7 ? nbConv(1) : literTask(1);
      if (level === 2) return pick([farConv, farConv, () => nbConv(2), () => literTask(2)])();
      return pick([mixedTask, compareTask, compareTask, literVolTask])();
    }, t => t.answer.sign() > 0);
  },
  text: level => genFrom(() => {
    if (level === 4) {
      if (Math.random() < 0.5) {
        const a = R(2, 6) * 5, b = R(2, 8) * 10;
        return wordTask({
          prompt: `Familie Huber hat einen rechteckigen Garten, ${a} m lang und ${b} m breit. Wie viel Ar ist der Garten groß?`,
          steps: [
            { title: 'Fläche in m²', ask: 'Wie groß ist der Garten in m²?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`, `2 · ${a} + 2 · ${b}`], why: 'Fläche vom Rechteck: Länge mal Breite.', unit: 'm²' },
            { title: 'In Ar', ask: 'Wie viel Ar sind das? (Gib nur die Zahl ein.)', calc: `${a * b} : 100`, wrong: [`${a * b} : 10`, `${a * b} · 100`], why: '1 a = 100 m². In die größere Einheit: geteilt durch 100.', unit: 'a' },
          ],
          unit: 'a', sentence: v => `Der Garten ist ${v} groß.`,
        });
      }
      const l = pick([50, 60, 80, 100]), b = pick([30, 40]), h = pick([30, 40, 50]);
      return wordTask({
        prompt: `Ein Aquarium ist ${l} cm lang, ${b} cm breit und ${h} cm hoch. Wie viele Liter Wasser passen hinein?`,
        steps: [
          { title: 'Volumen in cm³', ask: 'Wie groß ist das Volumen in cm³?', calc: `${l} · ${b} · ${h}`, wrong: [`${l} + ${b} + ${h}`, `${l} · ${b}`], why: 'Volumen vom Quader: Länge mal Breite mal Höhe.', unit: 'cm³' },
          { title: 'In dm³', ask: 'Wie viel dm³ sind das?', calc: `${l * b * h} : 1000`, wrong: [`${l * b * h} : 100`, `${l * b * h} · 1000`], why: '1 dm³ = 1000 cm³. In die größere Einheit: geteilt.', unit: 'dm³' },
          { title: 'In Liter', ask: '1 dm³ = 1 l. Wie viele Liter sind das?', calc: `${(l * b * h) / 1000} · 1`, explain: `${(l * b * h) / 1000} dm³ = ${(l * b * h) / 1000} l`, unit: 'l' },
        ],
        unit: 'l', sentence: v => `In das Aquarium passen ${v} Wasser.`,
      });
    }
    const a = pick([200, 250, 300, 400, 500]), b = pick([100, 200, 300, 400]), e = R(6, 9);
    if ((a * b) % 10000) return null;
    return wordTask({
      prompt: `Bauer Maier hat ein rechteckiges Weizenfeld, ${a} m lang und ${b} m breit. Pro Hektar erntet er ${e} t Weizen. Wie viele Tonnen erntet er auf dem ganzen Feld?`,
      steps: [
        { title: 'Fläche in m²', ask: 'Wie groß ist das Feld in m²?', calc: `${a} · ${b}`, wrong: [`${a} + ${b}`], why: 'Länge mal Breite.', unit: 'm²' },
        { title: 'In Hektar', ask: 'Wie viel Hektar sind das? (Gib nur die Zahl ein.)', calc: `${a * b} : 10000`, wrong: [`${a * b} : 100`, `${a * b} : 1000`], why: '1 ha = 100 a = 10 000 m².', unit: 'ha' },
        { title: 'Ernte', ask: 'Wie viele Tonnen Weizen erntet er?', calc: `${(a * b) / 10000} · ${e}`, wrong: [`${(a * b) / 10000} + ${e}`], why: `Auf jedem Hektar wachsen ${e} t.`, unit: 't' },
      ],
      unit: 't', sentence: v => `Er erntet ${v} Weizen.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0)),
};

export const RECHNEN_TOPICS: Topic[] = [GESCHICKT, SCHRIFT, KREIS, EINH2];
