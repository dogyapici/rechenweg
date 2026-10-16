import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { MathError, hintHTML, parseAnswer, solHTML } from '../engine/index.js';
import { pick } from '../topics';
import { formIssue } from '../gen';
import { loadSeen, saveSeen, type Stats } from '../storage';
import { remember } from '../fresh';
import { mixTask, nextTopic, type MixTask } from '../mix';
import { STAGES } from '../stages';
import { CATALOG } from '../catalog';
import { look } from '../ui/look';
import { moodFor } from '../mascot';
import { answerLabel } from '../widgets';
import { AnswerInput } from './Widgets';
import { Html } from './Html';
import { Mascot, MascotSays } from './Mascot';
import type { Attempt } from '../journal';

type Feedback = { state: 'right' | 'wrong' | 'almost' | 'invalid'; msg: string };
interface Cur { mt: MixTask | null; n: number; tries: number; hint: boolean; done: boolean; revealed: boolean; fb: Feedback | null; wrongs: string[]; t0: number }
interface Score { right: number; tried: number; skipped: number; combo: number }

const title = (id: string) => CATALOG.find(c => c.id === id)?.title ?? id;
const ICON = { right: '✓', wrong: '✗', almost: '≈', invalid: '?' };
const PARTY = ['🎉', '⭐', '✨', '🎈', '⭐', '🎉'];

interface Props { name: string; topics: string[]; stats: Stats; back: string; onBack: () => void; onOpenTopic: (id: string) => void; onLog: (a: Attempt) => void }

/** Gemischt üben: eine Aufgabe nach der anderen aus allen Themen, mit Rückmeldung sofort. Überspringen zählt nicht als Fehler. */
export function Mix({ name, topics, stats, back, onBack, onOpenTopic, onLog }: Props) {
  const bag = useRef<string[]>([]);
  const make = (n: number, last: string | null, same?: string): Cur => {
    let mt: MixTask | null = null;
    for (let i = 0; i < 4 && !mt; i++) {
      let topic = same;
      if (!topic || i > 0) { const r = nextTopic(topics, bag.current, last); bag.current = r.bag; topic = r.topic; }
      mt = mixTask(topic, stats, loadSeen());
    }
    return { mt, n, tries: 0, hint: false, done: false, revealed: false, fb: null, wrongs: [], t0: Date.now() };
  };
  const [C, setC] = useState<Cur>(() => make(0, null));
  const [input, setInput] = useState('');
  const [score, setScore] = useState<Score>({ right: 0, tried: 0, skipped: 0, combo: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const solution = useMemo(() => (C.mt ? solHTML(C.mt.task.sol) : ''), [C.mt]);
  useEffect(() => { if (!C.done) inputRef.current?.focus(); }, [C.mt, C.done]);
  // Gestellte Aufgabe merken, damit sie so bald nicht wieder drankommt, auch nicht beim Üben im Thema.
  useEffect(() => { if (C.mt) saveSeen(remember(loadSeen(), C.mt.topic, C.mt.task)); }, [C.mt]);

  const log = (ok: boolean, c: Cur) => {
    const k = c.mt!;
    onLog({ t: Date.now(), topic: k.topic, lv: k.level, src: 'ueben', q: k.task.prompt, a: k.task.sol.resultHTML, wrong: c.wrongs, ok, first: ok && c.tries === 1 && !c.hint,
      help: [...(c.hint ? ['tipp' as const] : []), ...(c.revealed ? ['loesung' as const] : [])], sec: (Date.now() - c.t0) / 1000 });
  };
  const fresh = (same?: string) => { setC(make(C.n + 1, C.mt?.topic ?? null, same)); setInput(''); window.scrollTo({ top: 0 }); };
  /** Überspringen: nächstes Thema, zählt nicht als Fehler. */
  const skip = () => { setScore(s => ({ ...s, skipped: s.skipped + 1 })); fresh(); };
  /** Neue Aufgabe: gleiches Thema, neue Zahlen. */
  const other = () => fresh(C.mt?.topic);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const k = C.mt!.task;
    let a;
    try { a = parseAnswer(input); }
    catch (err) {
      if (!(err instanceof MathError)) throw err;
      setC({ ...C, fb: { state: 'invalid', msg: err.message } });
      return;
    }
    if (k.answer.eq(a.v)) {
      if (k.needReduced && a.raw && !a.v.isRed()) { setC({ ...C, fb: { state: 'almost', msg: 'Fast! Der Wert stimmt, aber du kannst den Bruch noch weiter kürzen.' } }); return; }
      const fi = formIssue(k, input);
      if (fi) { setC({ ...C, fb: { state: 'almost', msg: fi } }); return; }
      const next = { ...C, tries: C.tries + 1, done: true };
      const clean = next.tries === 1 && !next.hint;
      setScore(s => ({ ...s, right: s.right + 1, tried: s.tried + 1, combo: clean ? s.combo + 1 : 0 }));
      log(true, next);
      setC({ ...next, fb: { state: 'right', msg: pick(['Super, richtig!', 'Richtig! Genau so.', 'Stark gerechnet!', 'Richtig! Das sitzt.']) + (next.tries > 1 ? ' Gut, dass du drangeblieben bist.' : '') } });
    } else {
      const m = k.diag ? k.diag(a.v) : null;
      const tries = C.tries + 1;
      setC({ ...C, tries, wrongs: [...C.wrongs, answerLabel(k.widget, input)], fb: { state: 'wrong', msg: (m || 'Das stimmt noch nicht.') + (tries >= 2 ? ' Schau dir den Tipp oder die Lösung an.' : ' Versuch es noch einmal!') } });
      inputRef.current?.select();
    }
  };
  const reveal = () => {
    if (C.done) return;
    setScore(s => ({ ...s, tried: s.tried + 1, combo: 0 }));
    log(false, { ...C, revealed: true });
    setC({ ...C, revealed: true, done: true, fb: null });
  };

  const head = (
    <>
      <div className="thead"><button className="back" onClick={onBack} aria-label={back}>←</button><span className="ticon" aria-hidden="true">🔀</span><h1>{name}</h1></div>
      <div className="mix-score" aria-live="polite">
        <span className="ok">✓ {score.right} richtig</span>
        <span>{score.tried} {score.tried === 1 ? 'Aufgabe' : 'Aufgaben'}</span>
        {score.skipped > 0 && <span>⏭ {score.skipped} übersprungen</span>}
      </div>
    </>
  );
  if (!C.mt) return <div className="exam">{head}<div className="err">Gerade konnte keine Aufgabe erzeugt werden. <button className="linkbtn" onClick={() => fresh()}>Neue Aufgabe</button></div></div>;

  const { topic, level, task: k } = C.mt;
  const right = C.fb?.state === 'right';
  const combo = right && C.tries === 1 && !C.hint ? score.combo : 0;
  const stage = STAGES[level - 1];
  return (
    <div className="exam mix">
      {head}
      <section className={`card panel task${right ? ' win' : ''}`}>
        <div className="task-h">
          <span className="stage-tag" style={{ '--tc': look(topic).color } as CSSProperties}>{look(topic).icon} {title(topic)}</span>
          <span className="mix-lv" title={`Stufe ${level}: ${stage.name}`}>{stage.icon} {stage.name}</span>
        </div>
        <Html as="p" className={`prompt${k.word ? ' story' : ''}`} html={k.prompt} />

        {!C.done && (
          <form className="answer" onSubmit={check} autoComplete="off">
            <AnswerInput key={C.n} task={k} value={input} onChange={setInput} inputRef={inputRef} />
            <button className="btn big wide" type="submit" disabled={!input.trim()}>Prüfen ✔</button>
          </form>
        )}
        {C.fb && (
          <div className={`fb ${C.fb.state}`} role="status">
            {right && <span className="party" aria-hidden="true">{PARTY.map((c, i) => <i key={i} style={{ '--i': i } as CSSProperties}>{c}</i>)}</span>}
            <span className="fb-m"><Mascot key={`${C.n}-${C.tries}-${C.fb.state}`} mood={moodFor(C.fb.state, combo)} size={60} /><span className="fb-icon" aria-hidden="true">{ICON[C.fb.state]}</span></span>
            <span><span dangerouslySetInnerHTML={{ __html: C.fb.msg }} />{combo >= 2 && <span className="fb-combo">🔥 {combo} in Folge!</span>}</span>
          </div>
        )}
        {C.hint && !C.done && <Html className="hintbox" html={'💡 ' + hintHTML(k.sol)} />}
        {!C.done && (
          <div className="helpers four">
            <button className="btn quiet" onClick={() => setC({ ...C, hint: true })} disabled={C.hint}>💡 Tipp</button>
            <button className="btn quiet" onClick={reveal}>👀 Lösung</button>
            <button className="btn quiet" onClick={other}>🔄 Neue Aufgabe</button>
            <button className="btn quiet" onClick={skip}>⏭ Überspringen</button>
          </div>
        )}
        {C.done && <button className="btn big wide" onClick={() => fresh()}>Nächste Aufgabe 👉</button>}
      </section>

      {C.done && (
        <section className="card panel">
          {C.revealed && <MascotSays mood="think" size={56}><p>Kein Problem! Schau dir den Rechenweg in Ruhe an. Die nächste schaffst du.</p></MascotSays>}
          <details className="solbox" open={C.revealed || C.tries > 1}><summary>So wird es gerechnet</summary><Html html={solution} /></details>
          {!right && <button className="btn soft wide" onClick={() => onOpenTopic(topic)}>{look(topic).icon} {title(topic)} in Ruhe üben</button>}
        </section>
      )}
      <p className="foot-note">Gemischt aus: {topics.map(title).join(' · ')}. <b>Überspringen</b> ist kein Fehler, <b>Neue Aufgabe</b> gibt dir eine andere zum selben Thema.</p>
    </div>
  );
}

