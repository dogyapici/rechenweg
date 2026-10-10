import { useMemo, useState } from 'react';
import { htmlToText, solHTML, solveAny } from '../engine/index.js';
import { M, TOPICS, type Topic } from '../topics';
import type { Stats } from '../storage';
import type { TutorContext } from '../ai';
import { look, tone } from '../ui/look';
import { StepReveal, useTheoryCards } from '../ui/bits';
import { AiExplain } from './AiExplain';
import { Html } from './Html';
import { Practice } from './Practice';

type Tab = 'theorie' | 'beispiel' | 'ueben';
const STEPS = [['theorie', 'Verstehen'], ['beispiel', 'Beispiel'], ['ueben', 'Üben']] as const;

function defaultExample(t: Topic) {
  if (t.example) {
    const sol = solveAny(t.example);
    return { prompt: sol.kind === 'eq' ? `Löse die Gleichung: ${M(sol.rows[0].eq)}` : `Berechne: ${M(sol.inputHTML)}`, sol };
  }
  return t.exampleSol!();
}

interface Props { id: string; stats: Stats; onStats: (s: Stats) => void; onBack: () => void; onAskTutor: (ctx: TutorContext) => void }

export function TopicPage({ id, stats, onStats, onBack, onAskTutor }: Props) {
  const t = TOPICS.find(x => x.id === id)!;
  const l = look(t.id);
  const [tab, setTab] = useState<Tab>(() => (stats[t.id]?.total ? 'ueben' : 'theorie'));
  const [card, setCard] = useState(0);
  const cards = useTheoryCards(t.theory);
  const [example, setExample] = useState(() => defaultExample(t));
  const exHTML = useMemo(() => solHTML(example.sol), [example]);
  const show = (k: Tab) => { setTab(k); window.scrollTo({ top: 0 }); };

  return (
    <div className="topic" style={tone(t.id)}>
      <div className="thead">
        <button className="back" onClick={onBack} aria-label="Zurück zur Übersicht">←</button>
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
            <span className="cardno">{card + 1} / {cards.length}</span>
            <Html html={cards[card]} />
          </article>
          <div className="dots" aria-hidden="true">{cards.map((_, i) => <i key={i} className={i === card ? 'on' : i < card ? 'seen' : ''} />)}</div>
          <div className="cta">
            {card > 0 && <button className="btn quiet" onClick={() => setCard(card - 1)}>← Zurück</button>}
            {card < cards.length - 1
              ? <button className="btn big" onClick={() => setCard(card + 1)}>Weiter 👉</button>
              : <button className="btn big" onClick={() => show('beispiel')}>Zum Beispiel 👉</button>}
          </div>
        </>
      )}

      {tab === 'beispiel' && (
        <>
          <section className="card panel">
            <Html as="p" className="prompt" html={example.prompt} />
            <StepReveal html={exHTML} />
          </section>
          <div className="cta">
            <button className="btn big" onClick={() => show('ueben')}>Jetzt du! 💪</button>
            <button className="btn quiet" onClick={() => { const k = t.gen(Math.min(2, stats[t.id]?.level ?? 1)); if (k) setExample(k); }}>🔄 Anderes Beispiel</button>
          </div>
          <AiExplain req={{ topic: t.title, task: htmlToText(example.prompt), steps: htmlToText(exHTML) }} onAskTutor={onAskTutor} />
        </>
      )}

      {tab === 'ueben' && <Practice topic={t} stats={stats} onStats={onStats} onAskTutor={onAskTutor} />}
    </div>
  );
}
