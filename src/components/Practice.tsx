import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { MathError, hintHTML, htmlToText, parseAnswer, solHTML } from '../engine/index.js';
import { pick, type Task, type Topic } from '../topics';
import { freshStats, type Stats } from '../storage';
import type { TutorContext } from '../ai';
import { Keypad, StepReveal, Stars } from '../ui/bits';
import { stars } from '../ui/look';
import { AiExplain } from './AiExplain';
import { Html } from './Html';

type Feedback = { state: 'right' | 'wrong' | 'almost' | 'invalid'; msg: string };
interface TaskState { task: Task | null; tries: number; hint: boolean; revealed: boolean; done: boolean; fb: Feedback | null; lastWrong: string | null; lastDiag: string | null; levelMsg: string }

function newTask(topic: Topic, level: number): TaskState {
  let task: Task | null = null;
  for (let i = 0; i < 5 && !task; i++) task = topic.gen(level);
  return { task, tries: 0, hint: false, revealed: false, done: false, fb: null, lastWrong: null, lastDiag: null, levelMsg: '' };
}
const PARTY = ['🎉', '⭐', '✨', '🎈', '⭐', '🎉'];
const ICON = { right: '✓', wrong: '✗', almost: '≈', invalid: '?' };

interface Props { topic: Topic; stats: Stats; onStats: (s: Stats) => void; onAskTutor: (ctx: TutorContext) => void }

export function Practice({ topic, stats, onStats, onAskTutor }: Props) {
  const s = stats[topic.id] ?? freshStats();
  const [T, setT] = useState<TaskState>(() => newTask(topic, s.level));
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const solution = useMemo(() => (T.task ? solHTML(T.task.sol) : ''), [T.task]);
  useEffect(() => { if (!T.done) inputRef.current?.focus(); }, [T.task, T.done]);

  /** Stufe anpassen: 3 richtige in Folge ohne Hilfe → höher, 2 nicht gelöste Aufgaben → niedriger. Jede Stufe ist ein Stern. */
  const finish = (right: boolean, state: TaskState): string => {
    const n = { ...s, total: s.total + 1 };
    let msg = '';
    if (right) {
      if (n.right === 0) msg = 'Dein erster Stern für dieses Thema! ⭐';
      n.right++; n.miss = 0;
      if (state.tries === 1 && !state.hint) {
        n.streak++;
        if (n.streak >= 3 && n.level < 3) { n.level++; n.streak = 0; msg = `Neuer Stern! ⭐ Jetzt kommen etwas schwerere Aufgaben.`; }
      } else n.streak = 0;
    } else {
      n.streak = 0; n.miss++;
      if (n.miss >= 2 && n.level > 1) { n.level--; n.miss = 0; msg = 'Wir üben erst noch ein paar leichtere Aufgaben. Das ist ganz normal!'; }
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
        setT({ ...T, fb: { state: 'almost', msg: 'Fast! Der Wert stimmt, aber du kannst den Bruch noch weiter kürzen.' } });
        return;
      }
      const next = { ...T, tries: T.tries + 1, done: true };
      const lm = finish(true, next);
      setT({ ...next, levelMsg: lm, fb: { state: 'right', msg: pick(['Super, richtig!', 'Richtig! Genau so.', 'Stark gerechnet!', 'Richtig! Das sitzt.']) + (next.tries > 1 ? ' Gut, dass du drangeblieben bist.' : '') } });
    } else {
      const m = k.diag ? k.diag(a.v) : null;
      const tries = T.tries + 1;
      setT({ ...T, tries, lastWrong: input, lastDiag: m, fb: { state: 'wrong', msg: (m || 'Das stimmt noch nicht.') + (tries >= 2 && !T.hint ? ' Hol dir einen Tipp 💡' : ' Versuch es noch einmal!') } });
      inputRef.current?.select();
    }
  };
  const reveal = () => { if (T.done) return; const lm = finish(false, T); setT({ ...T, revealed: true, done: true, levelMsg: lm }); };
  const next = () => { setT(newTask(topic, (stats[topic.id] ?? freshStats()).level)); setInput(''); };
  const reset = () => { const n = { ...stats }; delete n[topic.id]; onStats(n); setT(newTask(topic, 1)); setInput(''); };

  if (!T.task) return <div className="err">Gerade konnte keine Aufgabe erzeugt werden. <button className="linkbtn" onClick={next}>Neue Aufgabe</button></div>;
  const k = T.task;
  const right = T.fb?.state === 'right';

  return (
    <>
      <section className={`card panel task${right ? ' win' : ''}`}>
        <div className="task-h">
          <Stars n={stars(s)} />
          <span className="score">✓ {s.right} richtig</span>
        </div>
        <Html as="p" className="prompt" html={k.prompt} />
        {!T.done && (
          <form className="answer" onSubmit={check} autoComplete="off">
            <input ref={inputRef} id="ans" value={input} onChange={e => setInput(e.target.value)} placeholder={k.placeholder || 'Deine Lösung'} aria-label="Deine Lösung" />
            <Keypad inputRef={inputRef} value={input} onChange={setInput} />
            <button className="btn big wide" type="submit" disabled={!input.trim()}>Prüfen ✔</button>
          </form>
        )}
        {T.fb && (
          <div className={`fb ${T.fb.state}`} role="status">
            {right && <span className="party" aria-hidden="true">{PARTY.map((c, i) => <i key={i} style={{ '--i': i } as CSSProperties}>{c}</i>)}</span>}
            <span className="fb-icon" aria-hidden="true">{ICON[T.fb.state]}</span>
            <span dangerouslySetInnerHTML={{ __html: T.fb.msg }} />
          </div>
        )}
        {T.levelMsg && <p className="levelup">{T.levelMsg}</p>}
        {T.hint && !T.done && <Html className="hintbox" html={'💡 ' + hintHTML(k.sol)} />}
        {!T.done && (
          <div className="helpers">
            <button className="btn quiet" onClick={() => setT({ ...T, hint: true })} disabled={T.hint}>💡 Tipp</button>
            <button className="btn quiet" onClick={reveal}>👀 Lösung zeigen</button>
          </div>
        )}
        {T.done && <button className="btn big wide" onClick={next}>Nächste Aufgabe 👉</button>}
      </section>

      {T.done && (
        <section className="card panel">
          {T.revealed
            ? <><h2 className="h2">So wird es gerechnet</h2><StepReveal html={solution} /></>
            : <details className="solbox" open={T.tries > 1}><summary>So wird es gerechnet</summary><Html html={solution} /></details>}
        </section>
      )}
      {T.done && (
        <AiExplain
          req={{ topic: topic.title, task: htmlToText(k.prompt), steps: htmlToText(solution), wrong: T.lastWrong, diag: T.lastDiag ? htmlToText(T.lastDiag) : null }}
          onAskTutor={onAskTutor}
        />
      )}
      <p className="foot-note">
        3 richtige Aufgaben hintereinander ohne Hilfe bringen dir einen neuen Stern.{' '}
        <button className="linkbtn" onClick={reset}>Von vorne anfangen</button>
      </p>
    </>
  );
}
