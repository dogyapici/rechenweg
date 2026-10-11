import { useEffect, useRef, useState } from 'react';
import { CATALOG } from '../catalog';
import { mark } from '../exam';
import { makeTask, STAGES } from '../stages';
import { freshStats, type Stats } from '../storage';
import { TOPICS, type Task } from '../topics';
import { look } from '../ui/look';
import { AnswerInput } from './Widgets';
import { Html } from './Html';

const title = (id: string) => CATALOG.find(c => c.id === id)?.title ?? id;

/** Je Thema höchstens zwei Aufgaben: erst Stufe „Üben“, dann „Schwieriger“. */
const PROBES = [2, 3];
/** Startstufe nach dem Test: nichts gelöst → 1, „Üben“ gelöst → 3, beides gelöst → 4 (Textaufgaben). */
const START = [1, 3, 4];

interface Props { topics: string[]; stats: Stats; onStats: (s: Stats) => void; onDone: () => void }

/** Einstufungstest: findet heraus, auf welcher Stufe jedes Thema startet. Fortschritt wird nur erhöht, nie gesenkt. */
export function Placement({ topics, stats, onStats, onDone }: Props) {
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro');
  const [ti, setTi] = useState(0);
  const [pi, setPi] = useState(0);
  const [task, setTask] = useState<Task | null>(null);
  const [input, setInput] = useState('');
  const [solved, setSolved] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (phase === 'run') inputRef.current?.focus(); }, [task, phase]);

  const load = (t: number, p: number) => {
    const topic = TOPICS.find(x => x.id === topics[t])!;
    let k: Task | null = null;
    for (let i = 0; i < 5 && !k; i++) k = makeTask(topic, PROBES[p]);
    setTi(t); setPi(p); setTask(k); setInput('');
  };
  const nextTopic = (t: number) => { if (t + 1 < topics.length) load(t + 1, 0); else setPhase('result'); };
  const answer = (ok: boolean) => {
    const id = topics[ti];
    if (ok) {
      setSolved(s => ({ ...s, [id]: pi + 1 }));
      if (pi + 1 < PROBES.length) { load(ti, pi + 1); return; }
    }
    nextTopic(ti);
  };
  const apply = () => {
    const n = { ...stats };
    for (const id of topics) {
      const lv = START[solved[id] ?? 0];
      const cur = { ...freshStats(), ...n[id] };
      if (lv > cur.level) n[id] = { ...cur, level: lv, streak: 0, miss: 0, atLevel: 0 };
    }
    onStats(n);
    onDone();
  };

  if (phase === 'intro') {
    return (
      <div className="exam">
        <div className="thead"><button className="back" onClick={onDone} aria-label="Zurück">←</button><span className="ticon" aria-hidden="true">🎯</span><h1>Einstufungstest</h1></div>
        <section className="card panel">
          <h2 className="h2">Was kannst du schon?</h2>
          <p>Zu jedem Thema bekommst du ein bis zwei Aufgaben. Das ist <b>kein Test mit Note</b>. Es geht nur darum, wo du anfängst, damit du nichts übst, was du schon kannst.</p>
          <p>Kennst du ein Thema noch nicht? Dann tippe einfach auf „Kann ich noch nicht“. Das ist völlig okay.</p>
          <ul className="exam-topics">{topics.map(t => <li key={t}><span aria-hidden="true">{look(t).icon}</span>{title(t)}</li>)}</ul>
          <button className="btn big wide" onClick={() => { load(0, 0); setPhase('run'); }}>Los geht's 👉</button>
        </section>
      </div>
    );
  }

  if (phase === 'run') {
    const id = topics[ti];
    return (
      <div className="exam">
        <div className="exam-bar"><span className="exam-n">Thema {ti + 1} von {topics.length}</span></div>
        <div className="gs-bar" aria-hidden="true">{topics.map((_, k) => <i key={k} className={k < ti ? 'done' : k === ti ? 'on' : ''} />)}</div>
        <section className="card panel task">
          <span className="stage-tag" style={{ '--tc': look(id).color } as React.CSSProperties}>{look(id).icon} {title(id)}</span>
          {task ? (
            <>
              <Html as="p" className={`prompt${task.word ? ' story' : ''}`} html={task.prompt} />
              <form className="answer" autoComplete="off" onSubmit={e => { e.preventDefault(); answer(mark(task, input).points === 1); }}>
                <AnswerInput task={task} value={input} onChange={setInput} inputRef={inputRef} />
                <button className="btn big wide" type="submit" disabled={!input.trim()}>Weiter 👉</button>
              </form>
            </>
          ) : <p className="err">Hier konnte keine Aufgabe erzeugt werden.</p>}
          <button className="btn quiet" onClick={() => nextTopic(ti)}>Kann ich noch nicht</button>
        </section>
      </div>
    );
  }

  return (
    <div className="exam">
      <div className="thead"><span className="ticon" aria-hidden="true">🎯</span><h1>Dein Ergebnis</h1></div>
      <section className="card panel">
        <h2 className="h2">Hier startest du</h2>
        <ul className="exam-result-topics">
          {topics.map(id => {
            const lv = Math.max(START[solved[id] ?? 0], stats[id]?.level ?? 1);
            return (
              <li key={id}>
                <span aria-hidden="true">{look(id).icon}</span>
                <span className="ert-t">{title(id)}</span>
                <span className={`ert-p ${lv >= 3 ? 'ok' : ''}`}>{STAGES[lv - 1].icon} {STAGES[lv - 1].name}</span>
              </li>
            );
          })}
        </ul>
        <p>Ein Thema, das du noch nicht kannst, fängt ganz vorne an. Dort lernst du es Schritt für Schritt.</p>
        <button className="btn big wide" onClick={apply}>Übernehmen 👉</button>
      </section>
    </div>
  );
}
