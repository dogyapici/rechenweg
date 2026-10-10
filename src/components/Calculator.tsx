import { useMemo, useState } from 'react';
import { MathError, htmlToText, solHTML, solveAny, type EqSolution, type ExprSolution } from '../engine/index.js';
import { M } from '../topics';
import type { TutorContext } from '../ai';
import { AiExplain } from './AiExplain';
import { Html } from './Html';

const EXAMPLES = ['3 + 4 · (5 − 2)', '3/4 + 5/6', '2/3 : 4/9', '2,5 · 1,4', '7,5 : 0,25', '3x + 5 = 20', '2(x − 1) = x + 7'];

function solve(s: string): { sol: ExprSolution | EqSolution | null; err: string } {
  try { return { sol: solveAny(s), err: '' }; }
  catch (e) { return { sol: null, err: e instanceof MathError ? e.message : 'Diese Aufgabe kann ich noch nicht lesen. Prüfe die Schreibweise.' }; }
}

export function Calculator({ onAskTutor }: { onAskTutor: (ctx: TutorContext) => void }) {
  const [input, setInput] = useState('3/4 + 5/6');
  const [solved, setSolved] = useState(() => ({ input: '3/4 + 5/6', ...solve('3/4 + 5/6') }));
  const html = useMemo(() => (solved.sol ? solHTML(solved.sol) : ''), [solved]);
  const run = (s: string) => { setInput(s); setSolved({ input: s, ...solve(s) }); };
  const sol = solved.sol;

  return (
    <>
      <section className="card panel">
        <div className="panel-h"><h2>Rechner mit Rechenweg</h2><span className="eyebrow">Exakt, ohne Raten</span></div>
        <p className="ai-note" style={{ fontSize: 15 }}>Tippe eine Aufgabe ein, zum Beispiel aus deinen Hausaufgaben. Du bekommst jeden Zwischenschritt mit Begründung. Erlaubt sind + − · : ( ), Brüche wie 3/4, Kommazahlen und Gleichungen mit x.</p>
        <form className="calcrow" autoComplete="off" onSubmit={e => { e.preventDefault(); run(input); }}>
          <input id="calcin" value={input} onChange={e => setInput(e.target.value)} aria-label="Aufgabe" placeholder="z. B. 3/4 + 5/6" />
          <button className="btn" type="submit">Rechnen</button>
        </form>
        <div className="chips">{EXAMPLES.map(e => <button key={e} className="chip" onClick={() => run(e)}>{e}</button>)}</div>
      </section>
      {solved.err && <div className="err" role="alert">{solved.err}</div>}
      {sol && (
        <section className="card panel">
          <Html as="span" className="eyebrow" html={`Rechenweg für ${M(sol.kind === 'eq' ? sol.rows[0].eq : sol.inputHTML)}`} />
          <Html html={html} />
          <AiExplain req={{ topic: sol.kind === 'eq' ? 'Gleichungen lösen' : 'Terme berechnen', task: solved.input, steps: htmlToText(html) }} onAskTutor={onAskTutor} />
        </section>
      )}
    </>
  );
}
