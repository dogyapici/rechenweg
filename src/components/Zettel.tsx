import { useRef, useState } from 'react';
import { AiError, readZettel } from '../ai';
import { CATALOG } from '../catalog';
import { grade, type Exams } from '../curriculum';
import { dateH, daysLeft, isoDay, ready, schedule, sortTopics, todayItem, type Plan, type PlanItem } from '../plan';
import { STAGES } from '../stages';
import type { Stats } from '../storage';
import { look, tone } from '../ui/look';
import { AccessCode } from './AccessCode';

const title = (id: string) => CATALOG.find(c => c.id === id)?.title ?? id;

interface Props {
  plan: Plan | null; stats: Stats; exams: Exams;
  onPlan: (p: Plan | null) => void; onOpen: (id: string) => void; onExam: () => void; onPlacement: (topics: string[]) => void; onBack: () => void;
}

/** Die nächste Klassenarbeit: Themenzettel eintragen, dann Lernplan bis zum Termin. */
export function Zettel(p: Props) {
  const [editing, setEditing] = useState(!p.plan);
  return (
    <div className="zettel">
      <div className="thead"><button className="back" onClick={p.onBack} aria-label="Zurück zum Lernpfad">←</button><span className="ticon" aria-hidden="true">📅</span><h1>Meine nächste Klassenarbeit</h1></div>
      {editing || !p.plan
        ? <ZettelForm plan={p.plan} onCancel={p.plan ? () => setEditing(false) : undefined} onSave={np => { p.onPlan(np); setEditing(false); window.scrollTo({ top: 0 }); }} />
        : <PlanView {...p} plan={p.plan} onEdit={() => setEditing(true)} />}
    </div>
  );
}

/** Bild verkleinern, damit es schnell hochgeladen ist (lange Seite höchstens 1600 px). */
async function shrink(file: File): Promise<{ data: string; type: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.85).split(',')[1], type: 'image/jpeg' };
}

type Read = { status: 'idle' | 'loading' | 'error'; msg?: string; needsCode?: boolean };

function ZettelForm({ plan, onSave, onCancel }: { plan: Plan | null; onSave: (p: Plan) => void; onCancel?: () => void }) {
  const [step, setStep] = useState<'input' | 'check'>(plan ? 'check' : 'input');
  const [text, setText] = useState('');
  const [read, setRead] = useState<Read>({ status: 'idle' });
  const [name, setName] = useState(plan?.title ?? '');
  const [date, setDate] = useState(plan?.date ?? '');
  const [topics, setTopics] = useState<string[]>(plan?.topics ?? []);
  const [extra, setExtra] = useState<string[]>(plan?.extra ?? []);
  const [found, setFound] = useState<{ text: string; topic: string | null }[]>([]);
  const file = useRef<HTMLInputElement>(null);
  const lib = useRef<HTMLInputElement>(null);
  const last = useRef<{ text?: string; image?: { data: string; type: string } }>({});

  const run = async (req: { text?: string; image?: { data: string; type: string } }) => {
    last.current = req;
    setRead({ status: 'loading' });
    try {
      const r = await readZettel(req);
      setFound(r.points);
      setTopics(sortTopics(r.points.flatMap(x => (x.topic ? [x.topic] : []))));
      setExtra(r.points.filter(x => !x.topic).map(x => x.text));
      if (r.title) setName(r.title);
      if (r.date) setDate(r.date);
      setRead({ status: 'idle' }); setStep('check');
    } catch (e) {
      setRead({ status: 'error', msg: e instanceof Error ? e.message : String(e), needsCode: e instanceof AiError && e.needsCode });
    }
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try { await run({ image: await shrink(f) }); }
    catch { setRead({ status: 'error', msg: 'Das Foto konnte nicht gelesen werden. Versuch ein anderes oder tippe die Themen ab.' }); }
    if (file.current) file.current.value = '';
    if (lib.current) lib.current.value = '';
  };
  const toggle = (id: string) => setTopics(sortTopics(topics.includes(id) ? topics.filter(t => t !== id) : [...topics, id]));

  if (step === 'input') {
    return (
      <section className="card panel">
        <h2 className="h2">Was steht auf deinem Themenzettel?</h2>
        <p>Deine Lehrerin oder dein Lehrer gibt dir vor der Klassenarbeit oft einen Zettel mit allen Themen. Zeig ihn mir, dann mache ich dir einen Lernplan.</p>
        <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={e => onFile(e.target.files?.[0])} />
        {/* Ohne capture öffnet das Handy die Mediathek, so geht auch ein Foto, das schon da ist. */}
        <input ref={lib} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0])} />
        <button className="btn big wide" onClick={() => file.current?.click()} disabled={read.status === 'loading'}>📷 Zettel fotografieren</button>
        <button className="btn soft wide" onClick={() => lib.current?.click()} disabled={read.status === 'loading'}>🖼️ Foto aus der Mediathek</button>
        <div className="or"><span>oder</span></div>
        <label className="zt-l" htmlFor="zt">Themen abtippen</label>
        <textarea id="zt" rows={5} value={text} onChange={e => setText(e.target.value)} placeholder={'z. B.\nBrüche kürzen und erweitern\nBrüche addieren\nTextaufgaben mit Brüchen'} />
        <button className="btn soft wide" onClick={() => run({ text })} disabled={!text.trim() || read.status === 'loading'}>✨ Themen erkennen</button>
        {read.status === 'loading' && <p className="thinking">Ich lese deinen Zettel …</p>}
        {read.status === 'error' && <div className="ai-out"><p className="err">{read.msg}</p>{read.needsCode && <AccessCode onSaved={() => run(last.current)} />}</div>}
        <button className="linkbtn" onClick={() => setStep('check')}>Ohne Zettel: Themen selbst auswählen</button>
        {onCancel && <button className="btn quiet" onClick={onCancel}>Abbrechen</button>}
      </section>
    );
  }

  return (
    <section className="card panel">
      <h2 className="h2">{found.length ? 'Stimmt das so?' : 'Was kommt dran?'}</h2>
      {found.length > 0 && <p>Ich habe deinen Zettel gelesen und die passenden Themen angekreuzt. Schau bitte kurz drüber, ob alles stimmt.</p>}
      <div className="zt-row">
        <label className="zt-l">Wann ist die Klassenarbeit?<input type="date" value={date} min={isoDay(new Date())} onChange={e => setDate(e.target.value)} /></label>
        <label className="zt-l">Name (wenn du willst)<input value={name} onChange={e => setName(e.target.value)} placeholder="z. B. 2. Klassenarbeit" /></label>
      </div>
      <fieldset className="zt-topics">
        <legend className="zt-l">Diese Themen kommen dran</legend>
        {CATALOG.map(c => (
          <label key={c.id} className={`zt-topic${topics.includes(c.id) ? ' on' : ''}`} style={tone(c.id)}>
            <input type="checkbox" checked={topics.includes(c.id)} onChange={() => toggle(c.id)} />
            <span className="ticon" aria-hidden="true">{look(c.id).icon}</span>
            <span><b>{c.title}</b>{found.some(f => f.topic === c.id) && <small>vom Zettel: {found.filter(f => f.topic === c.id).map(f => f.text).join(' · ')}</small>}</span>
          </label>
        ))}
      </fieldset>
      {extra.length > 0 && (
        <div className="hintbox">
          <b>Diese Punkte gibt es in der App noch nicht:</b>
          <ul>{extra.map(x => <li key={x}>{x}</li>)}</ul>
          <span>Dazu kannst du im Bereich „Fragen“ trotzdem alles fragen.</span>
        </div>
      )}
      <button className="btn big wide" disabled={!topics.length} onClick={() => onSave({ title: name.trim(), date: date || null, topics, extra })}>Lernplan erstellen 👉</button>
      <div className="cta">
        <button className="btn quiet" onClick={() => setStep('input')}>{found.length ? 'Anderen Zettel lesen' : 'Zettel lesen lassen'}</button>
        {onCancel && <button className="btn quiet" onClick={onCancel}>Abbrechen</button>}
      </div>
    </section>
  );
}

function PlanView({ plan, stats, exams, onPlan, onOpen, onExam, onPlacement, onEdit }: Props & { plan: Plan; onEdit: () => void }) {
  const today = isoDay(new Date());
  const left = plan.date ? daysLeft(plan.date, today) : null;
  const days = schedule(plan, stats, today);
  const now = todayItem(plan, stats);
  const done = plan.topics.filter(id => ready(stats, id)).length;
  const probe = exams.plan;
  const fresh = plan.topics.every(id => !stats[id]?.total);
  const label = (it: PlanItem) => it.kind === 'topic' ? `${look(it.id).icon} ${title(it.id)}` : it.kind === 'probe' ? '📝 Probe-Klassenarbeit' : '🔁 Wiederholen: gemischte Aufgaben';
  const act = (it: PlanItem) => (it.kind === 'topic' ? onOpen(it.id) : it.kind === 'probe' ? onExam() : onOpen(weakest()));
  const weakest = () => plan.topics.reduce((a, b) => ((stats[b]?.level ?? 1) < (stats[a]?.level ?? 1) ? b : a));

  return (
    <>
      <section className="card panel zt-head">
        <div>
          <h2 className="h2">{plan.title || 'Klassenarbeit'}{plan.date && <> am {dateH(plan.date)}</>}</h2>
          <p className="zt-left">{left === null ? 'Kein Datum eingetragen' : left > 1 ? <>Noch <b>{left} Tage</b></> : left === 1 ? <b>Morgen ist es so weit!</b> : left === 0 ? <b>Heute ist es so weit. Viel Erfolg! 🍀</b> : 'Die Arbeit ist vorbei. Trag einfach den nächsten Zettel ein.'}</p>
          <p>{done} von {plan.topics.length} Themen sitzen schon.</p>
        </div>
        {(left === null || left >= 0) && (
          <button className="continue" style={now.kind === 'topic' ? tone(now.id) : { '--tc': '#c2410c' } as React.CSSProperties} onClick={() => act(now)}>
            <span className="ticon" aria-hidden="true">{now.kind === 'topic' ? look(now.id).icon : '📝'}</span>
            <span className="continue-t"><small>Heute dran</small><b>{now.kind === 'topic' ? title(now.id) : 'Probe-Klassenarbeit'}</b></span>
            <span className="continue-go" aria-hidden="true">▶</span>
          </button>
        )}
      </section>

      {fresh && (
        <section className="card panel">
          <h2 className="h2">🎯 Wo stehst du gerade?</h2>
          <p>Mach zuerst den kurzen Einstufungstest. Dann musst du nicht üben, was du schon kannst, und startest jedes Thema auf der passenden Stufe.</p>
          <button className="btn soft wide" onClick={() => onPlacement(plan.topics)}>Einstufungstest starten</button>
        </section>
      )}

      <section className="card panel">
        <h2 className="h2">Deine Themen</h2>
        <ul className="zt-list">
          {plan.topics.map(id => {
            const lv = stats[id]?.level ?? 1;
            return (
              <li key={id} style={tone(id)}>
                <button className="node-b" onClick={() => onOpen(id)}>
                  <span className="ticon" aria-hidden="true">{look(id).icon}</span>
                  <span className="node-t"><b>{title(id)}</b><small>{ready(stats, id) ? 'Sitzt! Ab und zu wiederholen.' : `Stufe ${lv}: ${STAGES[lv - 1].name}`}</small>
                    <span className="node-bar" aria-hidden="true">{STAGES.map((_, k) => <i key={k} className={k < lv - 1 ? 'on' : ''} />)}</span></span>
                  {ready(stats, id) && <span className="node-ok" aria-label="sitzt">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {plan.extra.length > 0 && <p className="ai-note">Noch nicht in der App: {plan.extra.join(' · ')}. Frag dazu im Bereich „Fragen“.</p>}
      </section>

      {days.length > 0 && (
        <section className="card panel">
          <h2 className="h2">Dein Lernplan</h2>
          <p>Jeden Tag ein bisschen, am letzten Tag eine Probe-Klassenarbeit. Wenn ein Thema schon sitzt, fällt es aus dem Plan raus.</p>
          <ol className="zt-days">
            {days.map((d, k) => (
              <li key={d.date} className={k === 0 ? 'today' : ''}>
                <span className="zt-date">{k === 0 ? 'Heute' : k === 1 ? 'Morgen' : dateH(d.date)}</span>
                <span className="zt-items">{d.items.map((it, j) => k === 0
                  ? <button key={j} className="chip" onClick={() => act(it)}>{label(it)}</button>
                  : <span key={j}>{label(it)}</span>)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card panel">
        <h2 className="h2">📝 Probe-Klassenarbeit</h2>
        <p>Genau zu deinen Zettel-Themen, mit Note. Am besten kurz vor der echten Arbeit.</p>
        {probe && <p className="exam-prev">Bestes Ergebnis: <b>Note {grade(probe.best).note}</b> ({Math.round(probe.best * 100)} %), {probe.tries}× geschrieben</p>}
        <button className="btn wide" onClick={onExam}>Probe-Klassenarbeit schreiben</button>
      </section>

      <div className="cta">
        <button className="btn quiet" onClick={onEdit}>Zettel ändern</button>
        <button className="btn quiet" onClick={() => { if (confirm('Den Zettel löschen und einen neuen anfangen?')) onPlan(null); }}>Neuer Zettel</button>
      </div>
    </>
  );
}
