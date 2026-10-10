import { useMemo, useState } from 'react';
import { htmlToText, solHTML, solveAny } from '../engine/index.js';
import { M, TOPICS, type Topic } from '../topics';
import type { Stats } from '../storage';
import type { TutorContext } from '../ai';
import { AiExplain } from './AiExplain';
import { Html } from './Html';
import { Practice } from './Practice';

type Tab = 'theorie' | 'beispiel' | 'ueben';

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
  const [tab, setTab] = useState<Tab>('theorie');
  const [example, setExample] = useState(() => defaultExample(t));
  const exHTML = useMemo(() => solHTML(example.sol), [example]);

  return (
    <>
      <button className="back" onClick={onBack}>← Lernpfad</button>
      <div className="thead"><span className="kl">Klasse {t.klasse}</span><h1>{t.title}</h1></div>
      <div className="subtabs" role="tablist">
        {([['theorie', 'Verstehen'], ['beispiel', 'Beispiel'], ['ueben', 'Üben']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'theorie' && (
        <>
          <Html as="article" className="card prose" html={t.theory} />
          <div className="cta">
            <button className="btn" onClick={() => setTab('beispiel')}>Weiter zum Beispiel</button>
            <button className="btn ghost" onClick={() => setTab('ueben')}>Gleich üben</button>
          </div>
        </>
      )}

      {tab === 'beispiel' && (
        <>
          <section className="card panel">
            <div className="panel-h">
              <span className="eyebrow">Beispiel, vollständig durchgerechnet</span>
              <button className="btn quiet" onClick={() => { const k = t.gen(Math.min(2, stats[t.id]?.level ?? 1)); if (k) setExample(k); }}>Anderes Beispiel</button>
            </div>
            <Html as="p" className="prompt" html={example.prompt} />
            <Html html={exHTML} />
            <AiExplain req={{ topic: t.title, task: htmlToText(example.prompt), steps: htmlToText(exHTML) }} onAskTutor={onAskTutor} />
          </section>
          <div className="cta"><button className="btn" onClick={() => setTab('ueben')}>Jetzt selbst üben</button></div>
        </>
      )}

      {tab === 'ueben' && <Practice topic={t} stats={stats} onStats={onStats} onAskTutor={onAskTutor} />}
    </>
  );
}
