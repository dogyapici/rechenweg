import { useEffect, useMemo, useRef, useState } from 'react';
import { MascotSays } from './Mascot';
import { solHTML } from '../engine/index.js';
import { CHAPTERS, FINAL, PASS, grade, type Exams } from '../curriculum';
import { buildExam, mark, type ExamTask, type Mark } from '../exam';
import { answerLabel } from '../widgets';
import { TOPICS } from '../topics';
import { look } from '../ui/look';
import { AnswerInput } from './Widgets';
import { Html } from './Html';
import type { Attempt, ExamLog } from '../journal';
import { loadSeen, saveSeen } from '../storage';
import { remember } from '../fresh';

interface Props { id: string; exams: Exams; onExams: (e: Exams) => void; onBack: () => void; onOpenTopic: (id: string) => void; custom?: { name: string; topics: string[]; back: string }; onLog?: (tries: Attempt[], exam: ExamLog) => void }

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;
const num = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function Exam({ id, exams, onExams, onBack, onOpenTopic, custom, onLog }: Props) {
  const ch = CHAPTERS.find(c => c.id === id);
  const name = custom ? custom.name : ch ? `Klassenarbeit: ${ch.title}` : FINAL.title;
  const topics = custom ? custom.topics : ch ? ch.topics : FINAL.topics;
  const back = custom?.back ?? 'Zurück zum Lernpfad';
  const [phase, setPhase] = useState<'prep' | 'run' | 'result'>('prep');
  const [tasks, setTasks] = useState<ExamTask[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prev = exams[id];

  useEffect(() => {
    if (phase !== 'run') return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => { if (phase === 'run') inputRef.current?.focus(); }, [i, phase]);

  const marks: Mark[] = useMemo(() => (phase === 'result' ? tasks.map((t, k) => mark(t.task, answers[k] ?? '')) : []), [phase, tasks, answers]);

  const start = () => {
    const t = buildExam(topics, loadSeen());
    saveSeen(t.reduce((s, x) => remember(s, x.topic, x.task), loadSeen()));
    setTasks(t); setAnswers(t.map(() => '')); setI(0); setSecs(0); setConfirm(false); setPhase('run');
    window.scrollTo({ top: 0 });
  };
  const submit = () => {
    const ms = tasks.map((t, k) => mark(t.task, answers[k] ?? ''));
    const pts = ms.reduce((s, m) => s + m.points, 0);
    const p = pts / tasks.length;
    const now = Date.now(), per = secs / Math.max(1, tasks.length);
    onLog?.(tasks.map((t, k) => ({ t: now, topic: t.topic, lv: 0, src: 'arbeit', q: t.task.prompt, a: t.task.sol.resultHTML,
      wrong: ms[k].state === 'right' ? [] : [answerLabel(t.task.widget, answers[k] ?? '') || '(leer)'], ok: ms[k].state === 'right', first: ms[k].state === 'right', help: [], sec: per })),
      { t: now, id, name, p, secs, n: tasks.length });
    onExams({ ...exams, [id]: { best: Math.max(prev?.best ?? 0, p), last: p, at: new Date().toISOString(), tries: (prev?.tries ?? 0) + 1 } });
    setPhase('result');
    window.scrollTo({ top: 0 });
  };

  if (phase === 'prep') {
    const n = topics.length > 4 ? 12 : 8;
    return (
      <div className="exam">
        <div className="thead"><button className="back" onClick={onBack} aria-label={back}>←</button><span className="ticon" aria-hidden="true">📝</span><h1>{name}</h1></div>
        <section className="card panel">
          <h2 className="h2">Das kommt dran</h2>
          <ul className="exam-topics">{topics.map(t => <li key={t}><span aria-hidden="true">{look(t).icon}</span>{title(t)}</li>)}</ul>
          <p>{n} Aufgaben, von leicht nach schwer, am Ende Textaufgaben. Wie in einer echten Klassenarbeit gibt es <b>keine Tipps</b>, und du siehst erst am Ende, was richtig war.</p>
          <div className="merke"><span className="merke-l">So klappt's</span><ol>
            <li>Lies jede Aufgabe in Ruhe. Was ist gesucht?</li>
            <li>Hängst du bei einer Aufgabe? Überspring sie und komm später zurück.</li>
            <li>Kürze Brüche immer vollständig, sonst gibt es nur einen halben Punkt.</li>
            <li>Schau vor dem Abgeben alle Antworten noch einmal an.</li>
          </ol></div>
          {prev && <p className="exam-prev">Dein bestes Ergebnis bisher: <b>Note {grade(prev.best).note}</b> ({Math.round(prev.best * 100)} %)</p>}
          <button className="btn big wide" onClick={start}>{prev ? 'Neue Klassenarbeit schreiben' : 'Klassenarbeit starten'} ✏️</button>
        </section>
      </div>
    );
  }

  if (phase === 'run') {
    const t = tasks[i];
    const empty = answers.filter(a => !a.trim()).length;
    const setA = (v: string) => setAnswers(answers.map((a, k) => (k === i ? v : a)));
    return (
      <div className="exam">
        <div className="exam-bar">
          <span className="exam-n">Aufgabe {i + 1} von {tasks.length}</span>
          <span className="exam-clock" aria-label="Zeit">⏱ {clock(secs)}</span>
        </div>
        <div className="exam-dots" role="tablist" aria-label="Aufgaben">
          {tasks.map((_, k) => <button key={k} role="tab" aria-selected={k === i} className={answers[k].trim() ? 'filled' : ''} onClick={() => setI(k)}>{k + 1}</button>)}
        </div>
        <section className="card panel task">
          <span className="stage-tag" style={{ '--tc': look(t.topic).color } as React.CSSProperties}>{look(t.topic).icon} {title(t.topic)}</span>
          <Html as="p" className={`prompt${t.task.word ? ' story' : ''}`} html={t.task.prompt} />
          <form className="answer" autoComplete="off" onSubmit={e => { e.preventDefault(); if (i < tasks.length - 1) setI(i + 1); else setConfirm(true); }}>
            <AnswerInput key={i} task={t.task} value={answers[i]} onChange={setA} inputRef={inputRef} />
            <div className="exam-nav">
              <button type="button" className="btn quiet" disabled={i === 0} onClick={() => setI(i - 1)}>← Zurück</button>
              {i < tasks.length - 1
                ? <button type="submit" className="btn big">{answers[i].trim() ? 'Weiter 👉' : 'Überspringen 👉'}</button>
                : <button type="submit" className="btn big">Abgeben ✔</button>}
            </div>
          </form>
        </section>
        {(confirm || i === tasks.length - 1) && (
          <section className="card panel exam-confirm">
            {empty > 0 ? <p>Du hast noch <b>{empty}</b> {empty === 1 ? 'Aufgabe' : 'Aufgaben'} leer gelassen. Tippe oben auf die Nummer, um sie zu bearbeiten.</p> : <p>Alle Aufgaben sind beantwortet. Schau sie dir ruhig noch einmal an.</p>}
            <button className="btn big wide" onClick={submit}>Jetzt abgeben ✔</button>
          </section>
        )}
      </div>
    );
  }

  const pts = marks.reduce((s, m) => s + m.points, 0);
  const p = pts / tasks.length;
  const g = grade(p);
  const byTopic = topics.map(tp => {
    const ks = tasks.map((t, k) => (t.topic === tp ? k : -1)).filter(k => k >= 0);
    return { tp, got: ks.reduce((s, k) => s + marks[k].points, 0), of: ks.length };
  }).filter(x => x.of > 0);
  const weak = byTopic.filter(x => x.got < x.of);
  const ICON = { right: '✓', half: '½', wrong: '✗', empty: '–' };

  return (
    <div className="exam">
      <div className="thead"><button className="back" onClick={onBack} aria-label={back}>←</button><span className="ticon" aria-hidden="true">📝</span><h1>{name}</h1></div>
      <section className={`card panel exam-grade g${g.note}`}>
        <div className="grade-big" aria-label={`Note ${g.note}`}>{g.note}</div>
        <div>
          <h2 className="h2">Note {g.note}: {g.word}</h2>
          <p>{num(pts)} von {tasks.length} Punkten ({Math.round(p * 100)} %) in {clock(secs)} Minuten</p>
        </div>
        <MascotSays mood={p < PASS ? 'oops' : g.note <= 2 ? 'cheer' : 'happy'} size={64}>
          <p className="exam-verdict">{p >= PASS ? (g.note <= 2 ? 'Super! Du bist bereit für die echte Klassenarbeit. 🎉' : 'Bestanden! Mit etwas Übung schaffst du noch eine bessere Note.') : 'Noch nicht bestanden. Übe die Themen unten noch einmal und versuch es dann wieder. Du schaffst das!'}</p>
        </MascotSays>
      </section>

      <section className="card panel">
        <h2 className="h2">Deine Themen</h2>
        <ul className="exam-result-topics">
          {byTopic.map(x => (
            <li key={x.tp}>
              <span aria-hidden="true">{look(x.tp).icon}</span>
              <span className="ert-t">{title(x.tp)}</span>
              <span className={`ert-p ${x.got === x.of ? 'ok' : 'bad'}`}>{num(x.got)} / {x.of}</span>
              {x.got < x.of && <button className="btn soft" onClick={() => onOpenTopic(x.tp)}>Üben</button>}
            </li>
          ))}
        </ul>
        {!weak.length && <p>Alles richtig in jedem Thema. Stark!</p>}
      </section>

      <section className="card panel">
        <h2 className="h2">Deine Aufgaben</h2>
        <ol className="exam-review">
          {tasks.map((t, k) => (
            <li key={k} className={marks[k].state}>
              <div className="er-h"><span className="er-i" aria-hidden="true">{ICON[marks[k].state]}</span><b>Aufgabe {k + 1}</b><span className="er-pts">{num(marks[k].points)} P.</span></div>
              <Html as="p" html={t.task.prompt} />
              <p className="er-a">Deine Antwort: <b>{answerLabel(t.task.widget, answers[k]) || 'keine'}</b>{marks[k].state !== 'right' && <> · Richtig ist: <Html as="b" html={t.task.sol.resultHTML} /></>}{marks[k].state === 'half' && ' (nicht vollständig gekürzt)'}</p>
              {marks[k].state !== 'right' && <details className="solbox"><summary>Rechenweg ansehen</summary><Html html={solHTML(t.task.sol)} /></details>}
            </li>
          ))}
        </ol>
      </section>
      <div className="cta">
        <button className="btn big" onClick={start}>Neue Klassenarbeit schreiben</button>
        <button className="btn quiet" onClick={onBack}>{back}</button>
      </div>
    </div>
  );
}
