import { useMemo, useState } from 'react';
import { htmlToText, solHTML, solveAny } from '../engine/index.js';
import { M, TOPICS, type Topic } from '../topics';
import type { Stats } from '../storage';
import type { TutorContext } from '../ai';
import { look, tone } from '../ui/look';
import { StepReveal, useTheoryCards } from '../ui/bits';
import { makeTask } from '../stages';
import { AiExplain } from './AiExplain';
import { Html } from './Html';
import { Practice } from './Practice';
import { HeftView } from './HeftView';
import { heftFor, type Heft } from '../heft';
import type { Attempt } from '../journal';

type Tab = 'theorie' | 'beispiel' | 'ueben';
const STEPS = [['theorie', 'Verstehen'], ['beispiel', 'Beispiel'], ['ueben', 'Üben']] as const;

function defaultExample(t: Topic) {
  if (t.example) {
    const sol = solveAny(t.example);
    return { prompt: sol.kind === 'eq' ? `Löse die Gleichung: ${M(sol.rows[0].eq)}` : `Berechne: ${M(sol.inputHTML)}`, sol, plain: t.example };
  }
  return t.exampleSol!();
}

type Example = { prompt: string; sol: ReturnType<typeof defaultExample>['sol'] };
const heftOf = (ex: Example): Heft | null => { const e = ex as Example & { heft?: Heft | null; plain?: string; word?: boolean }; return e.heft !== undefined ? e.heft : heftFor(e); };
const EX_LABEL = ['Einfach', 'Etwas schwerer', 'Textaufgabe'];
/** Drei Beispiele: ein leichtes, ein schwereres und eine Textaufgabe. */
function makeExample(t: Topic, i: number, fresh = false): Example {
  if (i === 0) return !fresh ? defaultExample(t) : (t.gen(1) ?? defaultExample(t));
  return (i === 1 ? t.gen(3) : makeTask(t, 4)) ?? defaultExample(t);
}

interface Props { id: string; stats: Stats; onStats: (s: Stats) => void; onBack: () => void; backLabel?: string; onAskTutor: (ctx: TutorContext) => void; onLog?: (a: Attempt) => void }

export function TopicPage({ id, stats, onStats, onBack, backLabel = 'Zurück zur Übersicht', onAskTutor, onLog }: Props) {
  const t = TOPICS.find(x => x.id === id)!;
  const l = look(t.id);
  const [tab, setTab] = useState<Tab>(() => (stats[t.id]?.total ? 'ueben' : 'theorie'));
  const [card, setCard] = useState(0);
  const cards = useTheoryCards(t.theory);
  const [exI, setExI] = useState(0);
  const [examples, setExamples] = useState<Example[]>(() => [0, 1, 2].map(i => makeExample(t, i)));
  const example = examples[exI];
  const exHTML = useMemo(() => solHTML(example.sol), [example]);
  const hefts = useMemo(() => examples.map(heftOf), [examples]);
  const exHeft = hefts[exI];
  /** Unter „Verstehen“ rechnet die letzte Karte ein leichtes Beispiel im Heft vor. */
  const [theoryHeft] = useState(() => {
    for (let i = 0; i < 6; i++) { const e = i < 2 ? examples[i] : makeExample(t, i % 2, true); const h = heftOf(e); if (h) return { prompt: e.prompt, heft: h }; }
    return null;
  });
  const nCards = cards.length + (theoryHeft ? 1 : 0);
  const heftCard = !!theoryHeft && card === cards.length;
  const renew = () => setExamples(examples.map((e, i) => (i === exI ? makeExample(t, i, true) : e)));
  const show = (k: Tab) => { setTab(k); window.scrollTo({ top: 0 }); };

  return (
    <div className="topic" style={tone(t.id)}>
      <div className="thead">
        <button className="back" onClick={onBack} aria-label={backLabel}>←</button>
        <span className="ticon" aria-hidden="true">{l.icon}</span>
        <h1>{t.title}</h1>
      </div>

      <ol className="stepper" aria-label="Schritte">
        {STEPS.map(([k, label], i) => (
          <li key={k}>
            <button aria-current={tab === k ? 'step' : undefined} onClick={() => show(k)}>
              <span className="sn">{i + 1}</span>{label}
            </button>
          </li>
        ))}
      </ol>

      {tab === 'theorie' && (
        <>
          <article className="card prose bubble" key={card}>
            <span className="cardno">{card + 1} / {nCards}</span>
            {heftCard
              ? <>
                  <h3>📝 So rechnest du es im Heft</h3>
                  <p>Manche Aufgaben rechnet man nicht im Kopf, sondern schriftlich. Schau zu, wie es auf dem Papier aussieht. Tippe dazu auf „Nächster Schritt“.</p>
                  <Html as="p" className="prompt" html={theoryHeft.prompt} />
                  <HeftView heft={theoryHeft.heft} />
                </>
              : <Html html={cards[card]} />}
          </article>
          <div className="dots" aria-hidden="true">{Array.from({ length: nCards }, (_, i) => <i key={i} className={i === card ? 'on' : i < card ? 'seen' : ''} />)}</div>
          <div className="cta">
            {card > 0 && <button className="btn quiet" onClick={() => setCard(card - 1)}>← Zurück</button>}
            {card < nCards - 1
              ? <button className="btn big" onClick={() => setCard(card + 1)}>Weiter 👉</button>
              : <button className="btn big" onClick={() => show('beispiel')}>Zum Beispiel 👉</button>}
          </div>
        </>
      )}

      {tab === 'beispiel' && (
        <>
          <div className="exnav" role="tablist" aria-label="Beispiele">
            {EX_LABEL.map((l, i) => (
              <button key={l} role="tab" aria-selected={exI === i} onClick={() => setExI(i)}><b>Beispiel {i + 1}</b><small>{l}</small></button>
            ))}
          </div>
          <section className="card panel" key={exI}>
            <Html as="p" className={`prompt${exI === 2 ? ' story' : ''}`} html={example.prompt} />
            {exHeft && <><h3 className="ex-heft-h">📝 So schreibst du es ins Heft</h3><HeftView heft={exHeft} /></>}
            {exHeft ? <details className="solbox"><summary>Erklärung in Worten</summary><StepReveal html={exHTML} start={0} /></details> : <StepReveal html={exHTML} start={0} />}
          </section>
          <div className="cta">
            {exI < 2
              ? <button className="btn big" onClick={() => { setExI(exI + 1); window.scrollTo({ top: 0 }); }}>Nächstes Beispiel 👉</button>
              : <button className="btn big" onClick={() => show('ueben')}>Jetzt du! 💪</button>}
            <button className="btn quiet" onClick={renew}>🔄 Andere Zahlen</button>
          </div>
          <AiExplain req={{ topic: t.title, task: htmlToText(example.prompt), steps: htmlToText(exHTML) }} onAskTutor={onAskTutor} />
        </>
      )}

      {tab === 'ueben' && <Practice topic={t} stats={stats} onStats={onStats} onLog={onLog} onBack={onBack} backLabel={backLabel} />}
    </div>
  );
}
