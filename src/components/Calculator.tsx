import { useMemo, useRef, useState } from 'react';
import { MathError, htmlToText, solHTML, solveAny, type EqSolution, type ExprSolution } from '../engine/index.js';
import { M } from '../topics';
import type { TutorContext } from '../ai';
import { Keypad, StepReveal } from '../ui/bits';
import { AiExplain } from './AiExplain';
import { Html } from './Html';

const EXAMPLES = ['3 + 4 · (5 − 2)', '3/4 + 5/6', '2/3 : 4/9', '2,5 · 1,4', '3x + 5 = 20'];

function solve(s: string): { sol: ExprSolution | EqSolution | null; err: string } {
  try { return { sol: solveAny(s), err: '' }; }
  catch (e) { return { sol: null, err: e instanceof MathError ? e.message : 'Diese Aufgabe kann ich noch nicht lesen. Schau nochmal, ob alles richtig getippt ist.' }; }
}

export function Calculator({ onAskTutor }: { onAskTutor: (ctx: TutorContext) => void }) {
  const [input, setInput] = useState('3/4 + 5/6');
  const [solved, setSolved] = useState(() => ({ input: '3/4 + 5/6', ...solve('3/4 + 5/6') }));
  const html = useMemo(() => (solved.sol ? solHTML(solved.sol) : ''), [solved]);
  const run = (s: string) => { setInput(s); setSolved({ input: s, ...solve(s) }); };
  const sol = solved.sol;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className="card panel">
        <h1 className="h1">🧮 Rechner</h1>
        <p className="lead">Tippe eine Aufgabe ein. Ich zeige dir jeden Schritt.</p>
        <form className="answer" autoComplete="off" onSubmit={e => { e.preventDefault(); run(input); }}>
          <input ref={inputRef} id="calcin" value={input} onChange={e => setInput(e.target.value)} aria-label="Aufgabe" placeholder="z. B. 3/4 + 5/6" />
          <Keypad inputRef={inputRef} value={input} onChange={setInput} x ops />
          <button className="btn big wide" type="submit">Rechnen ▶</button>
        </form>
        <div className="try"><span>Probier mal:</span>{EXAMPLES.map(e => <button key={e} className="chip" onClick={() => run(e)}>{e}</button>)}</div>
      </section>
      {solved.err && <div className="err" role="alert">{solved.err}</div>}
      {sol && (
        <section className="card panel">
          {sol.kind !== 'eq' && <Html as="p" className="prompt" html={M(sol.inputHTML)} />}
          <StepReveal html={html} />
        </section>
      )}
      {sol && (
        <AiExplain req={{ topic: sol.kind === 'eq' ? 'Gleichungen lösen' : 'Terme berechnen', task: solved.input, steps: htmlToText(html) }} onAskTutor={onAskTutor} />
      )}
    </>
  );
}
