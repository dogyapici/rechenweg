import { useState } from 'react';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { CHAPTERS, grade, nextNode, pathNodes, type Exams, type PathNode } from '../curriculum';
import { MAX_LEVEL, STAGES } from '../stages';
import { look, tone } from '../ui/look';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;

interface Props { stats: Stats; exams: Exams; free: boolean; onFree: (f: boolean) => void; onOpen: (id: string) => void; onExam: (id: string) => void }

export function Home({ stats, exams, free, onFree, onOpen, onExam }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const nodes = pathNodes(stats, exams, free, title);
  const next = nextNode(nodes);
  const done = nodes.filter(n => n.state === 'done').length;
  const open = (n: PathNode) => {
    if (n.state === 'locked') { setWhy(why === n.id ? null : n.id); return; }
    if (n.kind === 'topic') onOpen(n.id); else onExam(n.id);
  };

  return (
    <>
      <section className="hello">
        <h1>Hallo! 👋<br />Dein Mathe-Lernpfad</h1>
        <p className="hello-stars">Du hast schon <b>{done} von {nodes.length}</b> Stationen geschafft.</p>
      </section>

      {next && (
        <button className="continue" style={next.kind === 'topic' ? tone(next.id) : { '--tc': '#c2410c' } as React.CSSProperties} onClick={() => open(next)}>
          <span className="ticon" aria-hidden="true">{next.kind === 'topic' ? look(next.id).icon : '📝'}</span>
          <span className="continue-t">
            <small>Als Nächstes</small>
            <b>{next.kind === 'topic' ? title(next.id) : next.title}</b>
            {next.kind === 'topic' && <small className="continue-s">Stufe {stats[next.id]?.level ?? 1}: {STAGES[(stats[next.id]?.level ?? 1) - 1].name}</small>}
          </span>
          <span className="continue-go" aria-hidden="true">▶</span>
        </button>
      )}

      <ol className="map">
        {CHAPTERS.map((ch, ci) => (
          <li key={ch.id} className="map-ch">
            <div className="map-ch-h"><span className="map-ch-n">Kapitel {ci + 1}</span><h2>{ch.title}</h2><p>{ch.why}</p></div>
            <ol className="map-nodes">
              {nodes.filter(n => n.chapter?.id === ch.id).map(n => <Node key={n.id} n={n} stats={stats} exams={exams} why={why === n.id} onClick={() => open(n)} />)}
            </ol>
          </li>
        ))}
        <li className="map-ch">
          <div className="map-ch-h"><span className="map-ch-n">Zum Schluss</span><h2>Prüfungsvorbereitung</h2><p>Alles aus allen Kapiteln gemischt, wie in einer großen Arbeit.</p></div>
          <ol className="map-nodes">{nodes.filter(n => !n.chapter).map(n => <Node key={n.id} n={n} stats={stats} exams={exams} why={why === n.id} onClick={() => open(n)} />)}</ol>
        </li>
      </ol>

      <label className="free">
        <input type="checkbox" checked={free} onChange={e => onFree(e.target.checked)} />
        <span><b>Freies Üben</b><small>Alle Themen sofort öffnen, zum Beispiel wenn du für ein bestimmtes Thema in der Schule übst.</small></span>
      </label>
    </>
  );
}

function Node({ n, stats, exams, why, onClick }: { n: PathNode; stats: Stats; exams: Exams; why: boolean; onClick: () => void }) {
  if (n.kind === 'topic') {
    const lv = stats[n.id]?.level ?? 1;
    return (
      <li className={`node ${n.state}`} style={tone(n.id)}>
        <button className="node-b" onClick={onClick} aria-describedby={why ? `why-${n.id}` : undefined}>
          <span className="ticon" aria-hidden="true">{n.state === 'locked' ? '🔒' : look(n.id).icon}</span>
          <span className="node-t">
            <b>{title(n.id)}</b>
            <small>{n.state === 'locked' ? 'Noch gesperrt' : n.state === 'done' && lv === MAX_LEVEL ? 'Profi-Stufe erreicht 🏆' : `Stufe ${lv}: ${STAGES[lv - 1].name}`}</small>
            <span className="node-bar" aria-hidden="true">{STAGES.map((_, k) => <i key={k} className={k < lv - 1 ? 'on' : ''} />)}</span>
          </span>
          {n.state === 'done' && <span className="node-ok" aria-label="geschafft">✓</span>}
        </button>
        {why && <p className="node-why" id={`why-${n.id}`}>🔒 {n.needs}</p>}
      </li>
    );
  }
  const r = exams[n.id];
  return (
    <li className={`node exam-node ${n.state}${n.id === 'final' ? ' final' : ''}`}>
      <button className="node-b" onClick={onClick}>
        <span className="ticon" aria-hidden="true">{n.state === 'locked' ? '🔒' : n.id === 'final' ? '🏆' : '📝'}</span>
        <span className="node-t">
          <b>{n.title}</b>
          <small>{r ? `Beste Note: ${grade(r.best).note} (${Math.round(r.best * 100)} %)` : n.state === 'locked' ? 'Noch gesperrt' : 'Bereit! Probier die Klassenarbeit.'}</small>
        </span>
        {n.state === 'done' && <span className="node-ok" aria-label="bestanden">✓</span>}
      </button>
      {why && <p className="node-why">🔒 {n.needs}</p>}
    </li>
  );
}
