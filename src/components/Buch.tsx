import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { AiError, readBuch, type TutorContext } from '../ai';
import { addPage, judge, planTask, solve, updatePage, verify, type BuchPage, type BuchTask, type Verdict } from '../buch';
import { CATALOG } from '../catalog';
import { hintHTML, htmlToText, solHTML } from '../engine/index.js';
import { BUCH_TOPIC, type Attempt, type Help } from '../journal';
import { moodFor } from '../mascot';
import { md } from '../markdown';
import { shrink } from '../photo';
import { loadBuch, saveBuch } from '../storage';
import { look } from '../ui/look';
import { Keypad, StepReveal } from '../ui/bits';
import { AccessCode } from './AccessCode';
import { AskAi } from './AskAi';
import { Html } from './Html';
import { Mascot } from './Mascot';

const title = (id: string | null) => (id && CATALOG.find(c => c.id === id)?.title) || 'Aufgabe aus dem Buch';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ICON = { right: '✓', wrong: '✗', almost: '≈', invalid: '?' };
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const when = (t: number) => { const d = new Date(t); return `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`; };

interface Props { onBack: () => void; onLog: (a: Attempt) => void; onOpenTopic: (id: string) => void }

/** Aufgaben aus dem Schulbuch: abfotografieren, die KI liest sie ab, die Recheneinheit rechnet und prüft. */
export function Buch({ onBack, onLog, onOpenTopic }: Props) {
  const [pages, setPages] = useState<BuchPage[]>(loadBuch);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(() => !loadBuch().length);
  const save = (p: BuchPage[]) => { setPages(p); saveBuch(p); };
  const page = pages.find(p => p.id === openId);

  if (page) return <PageView page={page} onChange={p => save(updatePage(pages, p))} onBack={() => setOpenId(null)} onLog={onLog} onOpenTopic={onOpenTopic}
    onDelete={() => { save(pages.filter(p => p.id !== page.id)); setOpenId(null); }} />;
  return (
    <div className="zettel buch">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zur Startseite">←</button><span className="ticon" aria-hidden="true">📸</span><h1>Aufgaben aus dem Buch</h1></div>
      {adding || !pages.length
        ? <NewPage onCancel={pages.length ? () => setAdding(false) : undefined} onRead={r => { const next = addPage(pages, r); save(next); setAdding(false); setOpenId(next[0].id); window.scrollTo({ top: 0 }); }} />
        : <button className="btn big wide" onClick={() => setAdding(true)}>📷 Neue Aufgaben fotografieren</button>}
      {pages.length > 0 && (
        <section className="card panel">
          <h2 className="h2">Meine Buchseiten</h2>
          <ul className="buch-pages">
            {pages.map(p => {
              const n = p.tasks.length, d = p.tasks.filter(t => p.done[t.id]).length;
              return (
                <li key={p.id}><button onClick={() => { setOpenId(p.id); window.scrollTo({ top: 0 }); }}>
                  <span><b>{p.title}</b><small>{when(p.t)} · {d} von {n} {n === 1 ? 'Aufgabe' : 'Aufgaben'} gelöst</small></span>
                  <span className="bp-go" aria-hidden="true">{d === n ? '✅' : '›'}</span>
                </button></li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

type Read = { status: 'idle' | 'loading' | 'error'; msg?: string; needsCode?: boolean };
type Req = { text?: string; image?: { data: string; type: string }; welche?: string };

function NewPage({ onRead, onCancel }: { onRead: (r: Awaited<ReturnType<typeof readBuch>>) => void; onCancel?: () => void }) {
  const [text, setText] = useState('');
  const [welche, setWelche] = useState('');
  const [read, setRead] = useState<Read>({ status: 'idle' });
  const file = useRef<HTMLInputElement>(null);
  const lib = useRef<HTMLInputElement>(null);
  const last = useRef<Req>({});
  const busy = read.status === 'loading';

  const run = async (req: Req) => {
    last.current = req;
    setRead({ status: 'loading' });
    try {
      const r = await readBuch(req);
      if (!r.tasks.length) { setRead({ status: 'error', msg: 'Ich konnte auf dem Foto keine Aufgabe erkennen. Fotografiere die Seite bitte gerade und hell, oder tippe die Aufgabe ab.' }); return; }
      setRead({ status: 'idle' });
      onRead(r);
    } catch (e) {
      setRead({ status: 'error', msg: e instanceof Error ? e.message : String(e), needsCode: e instanceof AiError && e.needsCode });
    }
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    // Buchseiten haben kleine Schrift, deshalb etwas größer als beim Themenzettel.
    try { await run({ image: await shrink(f, 2000), welche }); }
    catch { setRead({ status: 'error', msg: 'Das Foto konnte nicht gelesen werden. Versuch ein anderes oder tippe die Aufgabe ab.' }); }
    if (file.current) file.current.value = '';
    if (lib.current) lib.current.value = '';
  };

  return (
    <section className="card panel">
      <h2 className="h2">Welche Aufgaben willst du machen?</h2>
      <p>Fotografiere die Seite aus deinem Mathebuch oder dein Arbeitsblatt. Ich lese die Aufgaben ab, und die Recheneinheit rechnet die Lösungen ganz genau aus. So kannst du jede Aufgabe gleich prüfen.</p>
      <label className="zt-l">Nur bestimmte Aufgaben? (wenn du willst)<input value={welche} onChange={e => setWelche(e.target.value)} placeholder="z. B. Nr. 3 und 5a bis c" disabled={busy} /></label>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={e => onFile(e.target.files?.[0])} />
      {/* Ohne capture öffnet das Handy die Mediathek, so geht auch ein Foto, das schon da ist. */}
      <input ref={lib} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0])} />
      <button className="btn big wide" onClick={() => file.current?.click()} disabled={busy}>📷 Buchseite fotografieren</button>
      <button className="btn soft wide" onClick={() => lib.current?.click()} disabled={busy}>🖼️ Foto aus der Mediathek</button>
      <div className="or"><span>oder</span></div>
      <label className="zt-l" htmlFor="bt">Aufgabe abtippen</label>
      <textarea id="bt" rows={4} value={text} onChange={e => setText(e.target.value)} disabled={busy} placeholder={'z. B.\n1 a) 3/4 + 1/6   b) 2/3 · 9/10\n2 Lea hat 24 €. Sie gibt 3/8 davon aus. Wie viel Geld ist das?'} />
      <button className="btn soft wide" onClick={() => run({ text, welche })} disabled={!text.trim() || busy}>✨ Aufgaben erkennen</button>
      {busy && <div className="buch-wait" role="status"><Mascot mood="think" size={56} /><p className="thinking">Ich lese die Aufgaben und stelle die Rechnungen auf … Das kann einen Moment dauern.</p></div>}
      {read.status === 'error' && <div className="ai-out"><p className="err">{read.msg}</p>{read.needsCode && <AccessCode onSaved={() => run(last.current)} />}</div>}
      {onCancel && <button className="btn quiet" onClick={onCancel} disabled={busy}>Abbrechen</button>}
    </section>
  );
}

interface PageProps { page: BuchPage; onChange: (p: BuchPage) => void; onBack: () => void; onDelete: () => void; onLog: (a: Attempt) => void; onOpenTopic: (id: string) => void }

function PageView({ page, onChange, onBack, onDelete, onLog, onOpenTopic }: PageProps) {
  const first = page.tasks.find(t => !page.done[t.id]) ?? page.tasks[0];
  const [open, setOpen] = useState<string | null>(first?.id ?? null);
  const [sure, setSure] = useState(false);
  const solved = page.tasks.filter(t => page.done[t.id]).length;
  const engine = page.tasks.filter(t => planTask(t).engine).length;
  const next = (id: string) => {
    const i = page.tasks.findIndex(t => t.id === id);
    const n = [...page.tasks.slice(i + 1), ...page.tasks.slice(0, i)].find(t => !page.done[t.id] && t.id !== id);
    setOpen(n?.id ?? null);
    if (n) requestAnimationFrame(() => document.getElementById(`bt-${n.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  return (
    <div className="exam buch">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zurück zu meinen Buchseiten">←</button><span className="ticon" aria-hidden="true">📸</span><h1>{page.title}</h1></div>
      <div className="mix-score" aria-live="polite">
        <span className="ok">✓ {solved} von {page.tasks.length} gelöst</span>
        <span>🧮 {engine} von der Recheneinheit geprüft</span>
      </div>
      {solved === page.tasks.length && <div className="fb right" role="status"><span className="fb-m"><Mascot mood="cheer" size={60} /></span><span>Alle Aufgaben geschafft! Super gemacht! 🎉</span></div>}
      {page.tasks.map(t => (
        <TaskCard key={t.id} task={t} done={page.done[t.id]} open={open === t.id} onToggle={() => setOpen(open === t.id ? null : t.id)}
          onEdit={nt => onChange({ ...page, tasks: page.tasks.map(x => (x.id === t.id ? nt : x)) })}
          onDone={(ok, tries) => onChange({ ...page, done: { ...page.done, [t.id]: { ok, tries } } })}
          onNext={() => next(t.id)} onLog={onLog} onOpenTopic={onOpenTopic} />
      ))}
      <p className="foot-note"><b>🧮 geprüft</b>: Die Lösung hat die Recheneinheit der App genau ausgerechnet. <b>🤖 KI</b>: Diese Aufgabe kann die Recheneinheit nicht selbst rechnen. Die KI hilft dir, kann sich aber auch mal irren.</p>
      {sure
        ? <div className="cta"><button className="btn quiet" onClick={onDelete}>Ja, Seite löschen</button><button className="btn quiet" onClick={() => setSure(false)}>Nein</button></div>
        : <button className="linkbtn" onClick={() => setSure(true)}>Diese Seite löschen</button>}
    </div>
  );
}

interface TaskProps {
  task: BuchTask; done?: { ok: boolean; tries: number }; open: boolean;
  onToggle: () => void; onEdit: (t: BuchTask) => void; onDone: (ok: boolean, tries: number) => void; onNext: () => void;
  onLog: (a: Attempt) => void; onOpenTopic: (id: string) => void;
}

function TaskCard({ task, done, open, onToggle, onEdit, onDone, onNext, onLog, onOpenTopic }: TaskProps) {
  const plan = useMemo(() => planTask(task), [task]);
  const sol = plan.sol;
  const html = useMemo(() => (sol ? solHTML(sol) : ''), [sol]);
  const [input, setInput] = useState('');
  const [fb, setFb] = useState<Verdict | null>(null);
  const [tries, setTries] = useState(0);
  const [wrongs, setWrongs] = useState<string[]>([]);
  const [helps, setHelps] = useState<Help[]>([]);
  const [hint, setHint] = useState(false);
  const [shown, setShown] = useState(false);
  const [ask, setAsk] = useState(false);
  const [editing, setEditing] = useState(false);
  const t0 = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const help = (h: Help) => setHelps(x => (x.includes(h) ? x : [...x, h]));
  const finished = !!done || shown;
  const unit = task.einheit ? ` ${task.einheit}` : '';

  const log = (ok: boolean, n: number, used: Help[]) => onLog({
    t: Date.now(), topic: task.topic ?? BUCH_TOPIC, lv: 0, src: 'buch', q: esc(`${task.nr}: ${task.text}`), a: sol ? sol.resultHTML + esc(unit) : '',
    wrong: wrongs, ok, first: ok && n === 1 && !used.length, help: used, sec: (Date.now() - t0.current) / 1000,
  });
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sol) return;
    const v = judge(sol, input);
    if (v.state === 'invalid' || v.state === 'almost') { setFb(v); return; }
    const n = tries + 1;
    setTries(n);
    if (v.state === 'right') {
      setFb({ state: 'right', msg: (n === 1 ? 'Super, richtig!' : 'Richtig! Gut, dass du drangeblieben bist.') + ' Die Recheneinheit hat es nachgerechnet.' });
      log(true, n, helps); onDone(true, n);
    } else {
      setWrongs(w => [...w, input.trim()].slice(-3));
      setFb({ state: 'wrong', msg: `Das stimmt noch nicht. ${n >= 2 ? 'Schau dir den Tipp an oder frag die KI.' : 'Versuch es noch einmal!'}` });
      inputRef.current?.select();
    }
  };
  const reveal = () => {
    setShown(true); help('loesung');
    if (!done && sol) log(false, tries, [...helps, 'loesung']);
  };

  const ctx: TutorContext = sol
    ? { title: `Aufgabe ${task.nr} aus dem Buch: ${task.text}`, topic: title(task.topic), steps: (task.art === 'ansatz' ? `Rechnung dazu: ${task.rechnung}\n` : '') + htmlToText(html) + unit, open: !finished, wrong: wrongs }
    : { title: `Aufgabe ${task.nr} aus dem Buch: ${task.text}`, topic: title(task.topic), steps: [task.loesung, ...task.checks.map(c => `${c.term} = ${c.ki}`)].filter(Boolean).join('\n') || '(kein Lösungsvorschlag)', open: !finished, wrong: wrongs, unchecked: true };

  return (
    <section id={`bt-${task.id}`} className={`card panel bt${done?.ok ? ' win' : ''}`} style={{ '--tc': look(task.topic ?? BUCH_TOPIC).color } as CSSProperties}>
      <button className="bt-h" onClick={onToggle} aria-expanded={open}>
        <span className="bt-nr">{task.nr}</span>
        <span className="bt-t">{task.text}</span>
        <span className={`bt-badge ${plan.engine ? 'eng' : 'ki'}`}>{plan.engine ? '🧮 geprüft' : '🤖 KI'}</span>
        <span className="bt-state" aria-label={done ? 'gelöst' : 'offen'}>{done ? '✅' : open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="bt-body">
          {task.topic && <span className="stage-tag">{look(task.topic).icon} {title(task.topic)}</span>}
          {editing
            ? <EditCalc task={task} onSave={nt => { onEdit(nt); setEditing(false); setFb(null); setShown(false); setHint(false); }} onCancel={() => setEditing(false)} />
            : <>
              {plan.engine && sol && (
                <p className="bt-calc">{task.art === 'ansatz' ? 'Die KI hat die Rechnung aufgestellt:' : 'Die Recheneinheit rechnet:'} <code>{task.rechnung}</code>
                  <button className="linkbtn" onClick={() => setEditing(true)}>✏️ falsch abgelesen?</button></p>
              )}
              {plan.disagree && <p className="hintbox">⚠️ Die KI und die Recheneinheit kommen auf verschiedene Ergebnisse. Vielleicht wurde die Aufgabe falsch abgelesen. Vergleiche die Rechnung oben mit deinem Buch.</p>}
              {!plan.engine && (
                <p className="hintbox">🤖 Diese Aufgabe kann die Recheneinheit nicht selbst ausrechnen{plan.err ? ' (die Rechnung war nicht lesbar)' : ''}. Die KI hilft dir dabei. Rechnungen im Lösungsvorschlag prüft die Recheneinheit nach.
                  <button className="linkbtn" onClick={() => setEditing(true)}>🧮 Rechnung selbst eintragen</button></p>
              )}
            </>}

          {plan.engine && sol && !finished && !editing && (
            <form className="answer" onSubmit={check} autoComplete="off">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} aria-label="Deine Lösung" placeholder={sol.kind === 'eq' ? 'x = …' : `Deine Lösung${unit}`} inputMode="text" />
              <Keypad inputRef={inputRef} value={input} onChange={setInput} />
              <button className="btn big wide" type="submit" disabled={!input.trim()}>Prüfen ✔</button>
            </form>
          )}
          {fb && (
            <div className={`fb ${fb.state}`} role="status">
              <span className="fb-m"><Mascot key={`${tries}-${fb.state}`} mood={moodFor(fb.state, 0)} size={56} /><span className="fb-icon" aria-hidden="true">{ICON[fb.state]}</span></span>
              <span>{fb.msg}</span>
            </div>
          )}
          {hint && sol && !finished && <Html className="hintbox" html={'💡 ' + hintHTML(sol)} />}

          {!editing && !finished && (
            <div className="helpers">
              {sol && <button className="btn quiet" onClick={() => { setHint(true); help('tipp'); }} disabled={hint}>💡 Tipp</button>}
              <button className="btn quiet" onClick={() => setAsk(!ask)}>💬 Frag die KI</button>
              <button className="btn quiet" onClick={reveal}>👀 {sol ? 'Lösung' : 'Lösungsvorschlag'}</button>
              {!sol && <button className="btn quiet" onClick={() => onDone(true, 1)}>✓ Hab ich gelöst</button>}
            </div>
          )}

          {finished && sol && (
            <details className="solbox" open={shown || tries > 1}><summary>So wird es gerechnet</summary><StepReveal html={html} all={!shown} />{unit && <p className="bt-unit">Ergebnis mit Einheit: <b><Html as="span" html={sol.resultHTML} />{unit}</b></p>}</details>
          )}
          {shown && !sol && <KiSolution task={task} />}

          {ask && <AskAi context={ctx} open={!finished} onUsed={() => help('ki')} onClose={() => setAsk(false)} />}
          {finished && (
            <div className="cta">
              {!ask && <button className="btn quiet" onClick={() => setAsk(true)}>💬 Noch eine Frage</button>}
              {!done && !sol && <button className="btn quiet" onClick={() => onDone(true, 1)}>✓ Verstanden</button>}
              {task.topic && !done?.ok && <button className="btn quiet" onClick={() => onOpenTopic(task.topic!)}>{look(task.topic).icon} Thema üben</button>}
              <button className="btn" onClick={onNext}>Nächste Aufgabe 👉</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Lösungsvorschlag der KI. Jede Teilrechnung wird mit der Recheneinheit nachgerechnet. */
function KiSolution({ task }: { task: BuchTask }) {
  const checks = useMemo(() => task.checks.map(c => ({ ...c, ...verify(c) })), [task.checks]);
  return (
    <div className="solbox ki-sol">
      <b>🤖 Lösungsvorschlag der KI</b>
      {task.loesung ? <Html html={md(task.loesung)} /> : <p>Die KI hat dazu keinen Lösungsweg aufgeschrieben. Frag sie einfach.</p>}
      {checks.length > 0 && (
        <div className="checks">
          {checks.map((c, i) => c.state === 'ok'
            ? <span key={i} className="check">✓ nachgerechnet: {c.term} = {c.ki}</span>
            : c.state === 'falsch'
              ? <span key={i} className="check bad">⚠️ {c.term}: Die KI sagt {c.ki}, die Recheneinheit sagt {c.engine}</span>
              : <span key={i} className="check open">? {c.term} = {c.ki} (nicht prüfbar)</span>)}
        </div>
      )}
      <p className="ai-note">Diesen Vorschlag hat die KI geschrieben. Die Recheneinheit hat nur die Rechnungen darin geprüft.</p>
    </div>
  );
}

/** Rechnung korrigieren oder selbst eintragen; die Recheneinheit zeigt sofort, ob sie sie lesen kann. */
function EditCalc({ task, onSave, onCancel }: { task: BuchTask; onSave: (t: BuchTask) => void; onCancel: () => void }) {
  const [v, setV] = useState(task.rechnung);
  const ref = useRef<HTMLInputElement>(null);
  const s = v.trim() ? solve(v) : null;
  return (
    <form className="answer bt-edit" onSubmit={e => { e.preventDefault(); if (s?.sol) onSave({ ...task, rechnung: v.trim(), art: task.art === 'ki' ? 'rechnung' : task.art, ki: '' }); }}>
      <label className="zt-l" htmlFor={`be-${task.id}`}>Wie lautet die Rechnung im Buch?</label>
      <input id={`be-${task.id}`} ref={ref} value={v} onChange={e => setV(e.target.value)} placeholder="z. B. 3/4 + 1/6 oder 2x + 3 = 11" />
      <Keypad inputRef={ref} value={v} onChange={setV} x ops />
      {s && !s.sol && <p className="err">{s.err}</p>}
      {s?.sol && <p className="ai-note">✓ Das kann die Recheneinheit rechnen.</p>}
      <div className="cta">
        <button className="btn" type="submit" disabled={!s?.sol}>Übernehmen</button>
        <button className="btn quiet" type="button" onClick={onCancel}>Abbrechen</button>
      </div>
    </form>
  );
}
