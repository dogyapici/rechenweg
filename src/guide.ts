/* ===== „Gemeinsam lösen“: jede Aufgabe in kleine Schritte zerlegt. Alle Zahlen kommen aus der Recheneinheit. ===== */
import { Q, evalExpr, qH, solveEq, type ListSolution, type Solution } from './engine/index.js';

export interface GuideChoice { ask: string; options: { html: string; ok: boolean }[]; why: string }
export interface GuideStep {
  title: string;
  /** Erst die passende Rechnung auswählen (bei Textaufgaben), dann ausrechnen. */
  choose?: GuideChoice;
  ask: string;
  answer: Q;
  hint?: string;
  /** Wird nach dem Schritt gezeigt: so wurde gerechnet. */
  explain: string;
  needReduced?: boolean;
  placeholder?: string;
}

const M = (s: string) => `<span class="math">${s}</span>`;
const HINT: Record<string, string> = {
  'Klammer zuerst': 'Was in der Klammer steht, rechnest du zuerst aus.',
  'Punkt vor Strich': 'Mal und Geteilt kommen vor Plus und Minus.',
  'Von links nach rechts': 'Gleichrangige Rechnungen gehst du von links nach rechts durch.',
};

/** Leitet die kleinen Schritte aus dem fertigen Rechenweg der Engine ab. */
export function autoGuide(sol: Solution): GuideStep[] {
  if (sol.kind === 'expr') {
    let k = 0;
    return sol.steps.map(st => {
      if (st.rule === 'Kürzen') {
        return { title: 'Kürzen', ask: `Kürze das Ergebnis vollständig: ${M(st.before)}`, answer: sol.result, needReduced: true, hint: 'Suche eine Zahl, durch die Zähler und Nenner beide teilbar sind.', explain: st.lines.join('<br>'), placeholder: 'z. B. 3/4' };
      }
      const v = sol.vals[k++];
      return {
        title: st.rule,
        ask: `Rechne nur den <mark>markierten</mark> Teil aus:<div class="math big">${st.before}</div>`,
        answer: v,
        hint: st.lines.length > 1 ? st.lines[0] : HINT[st.rule] ?? 'Schau dir den markierten Teil genau an.',
        explain: `${st.lines.join('<br>')}<br>Danach steht da: ${M(st.after)}`,
      };
    });
  }
  if (sol.kind === 'eq') {
    const out: GuideStep[] = [];
    let pre = '';
    sol.rows.forEach((r, i) => {
      if (i === 0) return;
      // Schritte ohne Frage (vereinfachen, Seiten tauschen) zeigt die App vor dem nächsten Schritt.
      if (!r.ask) { pre += `<p class="gs-pre">${r.expl}<br>${M(r.eq)}</p>`; return; }
      out.push({
        title: `Rechne ${r.op?.replace(/^\|\s*/, '') ?? ''} auf beiden Seiten`,
        ask: `${pre}<div class="math big">${sol.rows[i - 1].eq} <span class="note">${r.op ?? ''}</span></div>${r.ask.q}`,
        answer: r.ask.v,
        hint: r.expl.split('. ')[0] + '.',
        explain: `${M(r.eq)}<br>${r.expl}`,
      });
      pre = '';
    });
    return out;
  }
  return [];
}

/** HTML für einen Term oder eine Gleichung, so wie die Engine sie schreibt. */
export const termH = (s: string): string => M(s.includes('=') ? solveEq(s).rows[0].eq : evalExpr(s).inputHTML);

export interface WordStep {
  title: string;
  ask: string;
  /** Rechnung, die die Engine ausrechnet. */
  calc: string;
  /** Falsche Rechnungen zum Auswählen. Ohne diese Liste wird nicht gewählt. */
  wrong?: string[];
  /** Statt der Rechnung etwas anderes auswählen lassen, z. B. die passende Gleichung. */
  pick?: { ask: string; right: string; wrong: string[] };
  /** Eigene Erklärung statt „Rechnung = Ergebnis“. */
  explain?: string;
  why?: string;
  unit?: string;
  hint?: string;
  needReduced?: boolean;
}

const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Baut eine Textaufgabe: Rechenweg, Lösung und Schritte kommen aus der Engine. */
export function wordTask(o: { prompt: string; steps: WordStep[]; sentence: (v: string) => string; unit?: string; term?: string }) {
  const guide: GuideStep[] = [];
  const steps: ListSolution['steps'] = [];
  let last: Q | null = null, lastH = '';
  for (const w of o.steps) {
    const sol = evalExpr(w.calc);
    const dec = /,/.test(w.calc);
    const vH = qH(sol.result, dec && sol.result.terminating());
    const u = w.unit ? ' ' + w.unit : '';
    const line = `${M(sol.inputHTML)} = ${M(vH)}${u}`;
    const choose: GuideChoice | undefined = w.pick
      ? { ask: w.pick.ask, options: shuffle([{ html: termH(w.pick.right), ok: true }, ...w.pick.wrong.map(c => ({ html: termH(c), ok: false }))]), why: w.why ?? '' }
      : w.wrong ? { ask: 'Welche Rechnung passt?', options: shuffle([{ html: termH(w.calc), ok: true }, ...w.wrong.map(c => ({ html: termH(c), ok: false }))]), why: w.why ?? '' } : undefined;
    guide.push({
      title: w.title,
      choose,
      ask: w.wrong && !w.pick ? `${w.ask}<div class="math big">${sol.inputHTML} = ?</div>` : w.ask,
      answer: sol.result,
      hint: w.hint,
      explain: w.explain ?? line,
      needReduced: w.needReduced,
      placeholder: w.unit ? `Antwort in ${w.unit}` : undefined,
    });
    steps.push({ rule: w.title, lines: [...(w.pick ? [`Gleichung: ${termH(w.pick.right)}`] : []), w.ask, w.explain ?? line] });
    last = sol.result; lastH = vH + u;
  }
  const sentence = o.sentence(lastH);
  const extra = [`<b>Antwortsatz:</b> ${sentence}`];
  if (o.term) extra.push(`Alles in einem Term: ${termH(o.term)} = ${M(lastH)}`);
  const sol: ListSolution = { kind: 'list', steps, result: last!, resultHTML: lastH, extra };
  const needReduced = o.steps[o.steps.length - 1].needReduced;
  return { prompt: o.prompt, plain: o.prompt, answer: last!, sol, guide, needReduced, placeholder: o.unit ? `Antwort in ${o.unit}` : 'Deine Antwort', word: true as const };
}
