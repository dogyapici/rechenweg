import { useEffect, useMemo, useRef, useState } from 'react';
import { MathError, hintHTML, htmlToText, parseAnswer, solHTML } from '../engine/index.js';
import { pick, type Task, type Topic } from '../topics';
import { freshStats, type Stats } from '../storage';
import type { TutorContext } from '../ai';
import { AiExplain } from './AiExplain';
import { Html } from './Html';

type Feedback = { state: 'right' | 'wrong' | 'almost' | 'invalid'; msg: string };
interface TaskState { task: Task | null; tries: number; hint: boolean; revealed: boolean; done: boolean; fb: Feedback | null; lastWrong: string | null; lastDiag: string | null; levelMsg: string }

function newTask(topic: Topic, level: number): TaskState {
  let task: Task | null = null;
  for (let i = 0; i < 5 && !task; i++) task = topic.gen(level);
  return { task, tries: 0, hint: false, revealed: false, done: false, fb: null, lastWrong: null, lastDiag: null, levelMsg: '' };
}
const ICON = { right: '✓', wrong: '✗', almost: '~', invalid: '?' };

interface Props { topic: Topic; stats: Stats; onStats: (s: Stats) => void; onAskTutor: (ctx: TutorContext) => void }

export function Practice({ topic, stats, onStats, onAskTutor }: Props) {
  const s = stats[topic.id] ?? freshStats();
  const [T, setT] = useState<TaskState>(() => newTask(topic, s.level));
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const solution = useMemo(() => (T.task ? solHTML(T.task.sol) : ''), [T.task]);
  useEffect(() => { if (!T.done) inputRef.current?.focus(); }, [T.task, T.done]);

  /** Stufe anpassen: 3 richtige in Folge ohne Hilfe → höher, 2 nicht gelöste Aufgaben → niedriger. */
  const finish = (right: boolean, state: TaskState): string => {
    const n = { ...s, total: s.total + 1 };
    let msg = '';
    if (right) {
      n.right++; n.miss = 0;
      if (state.tries === 1 && !state.hint) {
        n.streak++;
        if (n.streak >= 3 && n.level < 3) { n.level++; n.streak = 0; msg = `Stark! Weiter geht es mit Stufe ${n.level}.`; }
      } else n.streak = 0;
    } else {
      n.streak = 0; n.miss++;
      if (n.miss >= 2 && n.level > 1) { n.level--; n.miss = 0; msg = `Wir üben noch etwas auf Stufe ${n.level}. Das ist ganz normal.`; }
    }
    onStats({ ...stats, [topic.id]: n });
    return msg;
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const k = T.task!;
    let a;
    try { a = parseAnswer(input); }
    catch (err) {
      if (!(err instanceof MathError)) throw err;
      setT({ ...T, fb: { state: 'invalid', msg: err.message } });
      return;
    }
    if (k.answer.eq(a.v)) {
      if (k.needReduced && a.raw && !a.v.isRed()) {
        setT({ ...T, fb: { state: 'almost', msg: 'Der Wert stimmt! Aber der Bruch ist noch nicht vollständig gekürzt. Kürze weiter.' } });
        return;
      }
      const next = { ...T, tries: T.tries + 1, done: true };
      const lm = finish(true, next);
      setT({ ...next, levelMsg: lm, fb: { state: 'right', msg: pick(['Richtig! Sauber gerechnet.', 'Richtig! Genau so.', 'Stimmt! Weiter so.', 'Richtig! Das sitzt.']) + (next.tries > 1 ? ' Beim nächsten Mal klappt es schon im ersten Versuch.' : '') } });
    } else {
      const m = k.diag ? k.diag(a.v) : null;
      const tries = T.tries + 1;
      setT({ ...T, tries, lastWrong: input, lastDiag: m, fb: { state: 'wrong', msg: (m || 'Das stimmt noch nicht.') + (tries >= 2 && !T.hint ? ' Hol dir einen Tipp oder sieh dir den Lösungsweg an.' : ' Versuch es noch einmal.') } });
      inputRef.current?.select();
    }
  };
  const reveal = () => { if (T.done) return; const lm = finish(false, T); setT({ ...T, revealed: true, done: true, levelMsg: lm }); };
  const next = () => { setT(newTask(topic, (stats[topic.id] ?? freshStats()).level)); setInput(''); };
  const reset = () => { const n = { ...stats }; delete n[topic.id]; onStats(n); setT(newTask(topic, 1)); setInput(''); };

  if (!T.task) return <div className="err">Für dieses Thema konnte gerade keine Aufgabe erzeugt werden. <button className="linkbtn" onClick={next}>Neue Aufgabe</button></div>;
  const k = T.task;
  const showSol = T.revealed || T.done;

  return (
    <>
      <section className="card panel">
        <div className="panel-h">
          <span className="eyebrow">Aufgabe · Stufe {s.level} von 3</span>
          <span className="eyebrow">{s.right} richtig{s.streak ? ` · ${s.streak} in Folge` : ''}</span>
        </div>
        <Html as="p" className="prompt" html={k.prompt} />
        {!T.done && (
          <>
            <form className="ansrow" onSubmit={check} autoComplete="off">
              <input ref={inputRef} id="ans" value={input} onChange={e => setInput(e.target.value)} placeholder={k.placeholder || 'Deine Lösung'} aria-label="Deine Lösung" />
              <button className="btn" type="submit">Prüfen</button>
            </form>
            <p className="ai-note">Brüche schreibst du als 3/4, gemischte Zahlen als 1 1/2, Kommazahlen mit Komma: 2,5.</p>
          </>
        )}
        {T.fb && <div className={`fb ${T.fb.state}`} role="status"><span className="hand">{ICON[T.fb.state]}</span><span dangerouslySetInnerHTML={{ __html: T.fb.msg }} /></div>}
        {T.levelMsg && <p className="levelup">{T.levelMsg}</p>}
        {T.hint && !showSol && <Html className="hintbox" html={hintHTML(k.sol)} />}
        <div className="actions">
          {!showSol && (
            <>
              <button className="btn quiet" onClick={() => setT({ ...T, hint: true })} disabled={T.hint}>Tipp</button>
              <button className="btn quiet" onClick={reveal}>Lösungsweg zeigen</button>
            </>
          )}
          <button className={`btn ${T.done ? '' : 'ghost'}`} onClick={next}>Neue Aufgabe</button>
        </div>
        {showSol && (
          <>
            <details className="solbox" open={T.revealed || T.tries > 1}>
              <summary>Der Rechenweg</summary>
              <Html html={solution} />
            </details>
            <AiExplain
              req={{ topic: topic.title, task: htmlToText(k.prompt), steps: htmlToText(solution), wrong: T.lastWrong, diag: T.lastDiag ? htmlToText(T.lastDiag) : null }}
              onAskTutor={onAskTutor}
            />
          </>
        )}
      </section>
      <p className="ai-note">
        Die Stufe passt sich an: Drei richtige Aufgaben in Folge ohne Hilfe bringen dich eine Stufe höher.{' '}
        <button className="linkbtn" onClick={reset}>Fortschritt für dieses Thema zurücksetzen</button>
      </p>
    </>
  );
}
