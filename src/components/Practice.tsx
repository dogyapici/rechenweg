import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { MathError, hintHTML, htmlToText, parseAnswer, solHTML } from '../engine/index.js';
import { pick, type Task, type Topic } from '../topics';
import { formIssue } from '../gen';
import { freshStats, loadSeen, saveSeen, type Stats, type TopicStats } from '../storage';
import { freshTask, remember } from '../fresh';
import { MAX_LEVEL, STAGES, STREAK_UP, guideFor } from '../stages';
import type { TutorContext } from '../ai';
import { StepReveal } from '../ui/bits';
import { AnswerInput } from './Widgets';
import { AiExplain } from './AiExplain';
import { Guide } from './Guide';
import { Html } from './Html';
import { HeftView } from './HeftView';
import { answerLabel } from '../widgets';
import type { Attempt, Help } from '../journal';

type Feedback = { state: 'right' | 'wrong' | 'almost' | 'invalid'; msg: string };
interface TaskState {
  task: Task | null; tries: number; hint: boolean; revealed: boolean; done: boolean; guided: boolean; heft: boolean;
  fb: Feedback | null; lastWrong: string | null; lastDiag: string | null; levelMsg: string; n: number;
  /** fürs Lerntagebuch: Startzeit, falsche Eingaben, genutzte Hilfen */
  t0: number; wrongs: string[]; helps: Help[];
}

/** Die erste Aufgabe jeder neuen Stufe (ab Stufe 2) wird gemeinsam gelöst. */
function newTask(topic: Topic, s: TopicStats, n = 0): TaskState {
  let task: Task | null = null;
  for (let i = 0; i < 5 && !task; i++) task = freshTask(topic, s.level, loadSeen());
  const guided = !!task && s.level >= 2 && !(s.atLevel ?? 0) && guideFor(task).length > 1 && !task.widget;
  return { task, tries: 0, hint: guided, revealed: false, done: false, guided, heft: false, fb: null, lastWrong: null, lastDiag: null, levelMsg: '', n, t0: Date.now(), wrongs: [], helps: [] };
}
const addHelp = (h: Help[], x: Help) => (h.includes(x) ? h : [...h, x]);
const PARTY = ['🎉', '⭐', '✨', '🎈', '⭐', '🎉'];
const ICON = { right: '✓', wrong: '✗', almost: '≈', invalid: '?' };

interface Props { topic: Topic; stats: Stats; onStats: (s: Stats) => void; onAskTutor: (ctx: TutorContext) => void; onLog?: (a: Attempt) => void }

export function Practice({ topic, stats, onStats, onAskTutor, onLog }: Props) {
  const s: TopicStats = { ...freshStats(), ...stats[topic.id] };
  const [T, setT] = useState<TaskState>(() => newTask(topic, s));
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const solution = useMemo(() => (T.task ? solHTML(T.task.sol) : ''), [T.task]);
  const guide = useMemo(() => (T.task ? guideFor(T.task) : []), [T.task]);
  // Nach dem Aufstieg erst das Lob zeigen, die Einführung der neuen Stufe kommt mit der nächsten Aufgabe.
  const showIntro = (s.intro ?? 0) < s.level && !T.done;
  useEffect(() => { if (!T.done && !T.guided) inputRef.current?.focus(); }, [T.task, T.done, T.guided]);
  // Gestellte Aufgabe merken, damit sie so bald nicht wieder drankommt.
  useEffect(() => { if (T.task) saveSeen(remember(loadSeen(), topic.id, T.task)); }, [T.task, topic.id]);

  /** Stufe anpassen: 3 richtige in Folge ohne Hilfe → nächste Stufe, 2 nicht gelöste Aufgaben → eine Stufe zurück. */
  const finish = (right: boolean, state: TaskState): string => {
    const n: TopicStats = { ...s, total: s.total + 1, atLevel: (s.atLevel ?? 0) + 1 };
    let msg = '';
    if (right) {
      n.right++; n.miss = 0;
      if (state.tries === 1 && !state.hint) {
        n.streak++;
        if (n.streak >= STREAK_UP && n.level < MAX_LEVEL) {
          n.level++; n.streak = 0; n.atLevel = 0;
          msg = `Stufe geschafft! ⭐ Als Nächstes: ${STAGES[n.level - 1].icon} ${STAGES[n.level - 1].name}.`;
        } else if (n.streak >= STREAK_UP && n.level === MAX_LEVEL) msg = 'Du bist ein echter Profi in diesem Thema! 🏆';
      } else n.streak = 0;
    } else {
      n.streak = 0; n.miss++;
      if (n.miss >= 2 && n.level > 1) { n.level--; n.miss = 0; n.atLevel = 0; n.intro = Math.max(n.intro ?? 0, n.level); msg = 'Wir üben erst noch ein paar Aufgaben auf der Stufe davor. Das ist ganz normal!'; }
    }
    onStats({ ...stats, [topic.id]: n });
    const k = state.task!;
    onLog?.({ t: Date.now(), topic: topic.id, lv: s.level, src: 'ueben', q: k.prompt, a: k.sol.resultHTML, wrong: state.wrongs, ok: right, first: right && state.tries === 1 && !state.helps.length,
      help: state.helps, diag: state.lastDiag ? htmlToText(state.lastDiag) : undefined, sec: (Date.now() - state.t0) / 1000 });
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
      const fi = formIssue(k, input);
      if (fi) { setT({ ...T, fb: { state: 'almost', msg: fi } }); return; }
      const next = { ...T, tries: T.tries + 1, done: true };
      const lm = finish(true, next);
      setT({ ...next, levelMsg: lm, fb: { state: 'right', msg: pick(['Super, richtig!', 'Richtig! Genau so.', 'Stark gerechnet!', 'Richtig! Das sitzt.']) + (next.tries > 1 ? ' Gut, dass du drangeblieben bist.' : '') } });
    } else {
      const m = k.diag ? k.diag(a.v) : null;
      const tries = T.tries + 1;
      setT({ ...T, tries, lastWrong: input, lastDiag: m ?? T.lastDiag, wrongs: [...T.wrongs, answerLabel(k.widget, input)], fb: { state: 'wrong', msg: (m || 'Das stimmt noch nicht.') + (tries >= 2 ? ' Lösen wir sie gemeinsam? 🧭' : ' Versuch es noch einmal!') } });
      inputRef.current?.select();
    }
  };
  const guidedDone = () => {
    // Bei Zeichen- und Klickaufgaben bereiten die Schritte nur vor. Die Antwort setzt man danach selbst.
    if (T.task?.widget) { setT({ ...T, guided: false, hint: true, fb: { state: 'almost', msg: 'Gut vorbereitet! Jetzt setz es oben um und prüfe deine Antwort.' } }); return; }
    const next = { ...T, tries: T.tries + 1, hint: true, done: true, helps: addHelp(T.helps, 'gemeinsam') };
    const lm = finish(true, next);
    setT({ ...next, levelMsg: lm, fb: { state: 'right', msg: 'Super, gemeinsam geschafft! Die nächste Aufgabe probierst du allein.' } });
  };
  const reveal = () => { if (T.done) return; const lm = finish(false, { ...T, helps: addHelp(T.helps, 'loesung') }); setT({ ...T, revealed: true, done: true, guided: false, levelMsg: lm }); };
  const next = () => { setT(newTask(topic, { ...freshStats(), ...stats[topic.id] }, T.n + 1)); setInput(''); };
  const reset = () => { const n = { ...stats }; delete n[topic.id]; onStats(n); setT(newTask(topic, freshStats())); setInput(''); };
  const startStage = () => onStats({ ...stats, [topic.id]: { ...s, intro: s.level } });

  const stage = STAGES[s.level - 1];
  const path = (
    <ol className="path5" aria-label={`Stufe ${s.level} von ${MAX_LEVEL}: ${stage.name}`}>
      {STAGES.map((st, i) => {
        const lv = i + 1, state = lv < s.level ? 'done' : lv === s.level ? 'now' : 'locked';
        return (
          <li key={st.name} className={state}>
            <span className="p5-dot" aria-hidden="true">{state === 'done' ? '⭐' : state === 'locked' ? '🔒' : st.icon}</span>
            <span className="p5-name">{st.name}</span>
          </li>
        );
      })}
    </ol>
  );

  if (showIntro) {
    return (
      <>
        {path}
        <section className="card panel stage-intro">
          <span className="si-icon" aria-hidden="true">{stage.icon}</span>
          <h2 className="h2">Stufe {s.level}: {stage.name}</h2>
          <Html className="si-text" html={stage.intro.startsWith('<') ? stage.intro : `<p>${stage.intro}</p>`} />
          <button className="btn big wide" onClick={startStage}>Los geht's 👉</button>
        </section>
      </>
    );
  }

  if (!T.task) return <div className="err">Gerade konnte keine Aufgabe erzeugt werden. <button className="linkbtn" onClick={next}>Neue Aufgabe</button></div>;
  const k = T.task;
  const right = T.fb?.state === 'right';
  const toGo = STREAK_UP - s.streak;

  return (
    <>
      {path}
      <section className={`card panel task${right ? ' win' : ''}`}>
        <div className="task-h">
          <span className="stage-tag">{stage.icon} {stage.name}{k.word && s.level !== 4 ? ' · Textaufgabe' : ''}</span>
          <span className="score">✓ {s.right} richtig</span>
        </div>
        <Html as="p" className={`prompt${k.word ? ' story' : ''}`} html={k.prompt} />
        {k.heft && !T.done && !T.heft && <p className="paper-tip">📝 Rechne auf Papier mit. Unter „Im Heft“ siehst du, wie es aussehen soll.</p>}
        {k.heft && T.heft && !T.done && !T.guided && <HeftView heft={k.heft} />}

        {T.guided && !T.done && (
          <>
            <div className="guide-head"><span>🧭 Wir lösen die Aufgabe gemeinsam, Schritt für Schritt.</span>
              <button className="linkbtn" onClick={() => setT({ ...T, guided: false })}>Ich probier's allein</button></div>
            <Guide key={T.n} steps={guide} onDone={guidedDone} />
          </>
        )}

        {!T.done && !T.guided && (
          <form className="answer" onSubmit={check} autoComplete="off">
            <AnswerInput task={k} value={input} onChange={setInput} inputRef={inputRef} />
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
        {T.hint && !T.done && !T.guided && <Html className="hintbox" html={'💡 ' + (guide[0]?.hint ? `<b>${guide[0].title}:</b> ${guide[0].hint}` : hintHTML(k.sol))} />}
        {!T.done && !T.guided && (
          <div className={`helpers ${k.heft ? 'four' : 'three'}`}>
            <button className="btn quiet" onClick={() => setT({ ...T, hint: true, helps: addHelp(T.helps, 'tipp') })} disabled={T.hint}>💡 Tipp</button>
            {k.heft && <button className="btn quiet" onClick={() => setT({ ...T, hint: true, heft: true, helps: addHelp(T.helps, 'heft') })} disabled={T.heft}>📝 Im Heft</button>}
            {guide.length > 0 && <button className={`btn ${T.tries >= 1 ? 'soft' : 'quiet'}`} onClick={() => setT({ ...T, hint: true, guided: true, fb: null, helps: addHelp(T.helps, 'gemeinsam') })}>🧭 Gemeinsam lösen</button>}
            <button className="btn quiet" onClick={reveal}>👀 Lösung</button>
          </div>
        )}
        {T.done && <button className="btn big wide" onClick={next}>Nächste Aufgabe 👉</button>}
      </section>

      {T.done && (
        <section className="card panel">
          {k.heft && <><h2 className="h2">So steht es im Heft</h2><HeftView heft={k.heft} startAll={T.heft} /></>}
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
        {s.level < MAX_LEVEL
          ? <>Noch <b>{toGo}</b> {toGo === 1 ? 'Aufgabe' : 'Aufgaben'} hintereinander ohne Hilfe richtig, dann geht es zur nächsten Stufe.{' '}</>
          : <>Du bist auf der höchsten Stufe. Bleib dran!{' '}</>}
        <button className="linkbtn" onClick={reset}>Von vorne anfangen</button>
      </p>
    </>
  );
}
