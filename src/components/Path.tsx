import { useState } from 'react';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { CHAPTERS, grade, nextNode, pathNodes, type Exams, type PathNode } from '../curriculum';
import { MAX_LEVEL, STAGES } from '../stages';
import { look, tone } from '../ui/look';
import { fitOf, gradeOf, reachable, type Profile } from '../profile';
import type { Plan } from '../plan';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;

interface Props { stats: Stats; exams: Exams; free: boolean; plan: Plan | null; profile: Profile | null; focus?: string; onFree: (f: boolean) => void; onOpen: (id: string) => void; onExam: (id: string) => void; onPlacement: () => void }

/** Der ganze Lernpfad: alle Kapitel mit ihren Themen und Klassenarbeiten. */
export function Path({ stats, exams, free, plan, profile, focus, onFree, onOpen, onExam, onPlacement }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const nodes = pathNodes(stats, exams, free, title, [...(plan?.topics ?? []), ...reachable(profile)]);
  const next = nextNode(nodes, n => n.kind === 'topic' && !!profile && fitOf(n.id, profile) === 'now');
  const done = nodes.filter(n => n.state === 'done').length;
  // Aufgeklappt ist das gewünschte Kapitel oder das, in dem es gerade weitergeht.
  const [shown, setShown] = useState<Set<string>>(() => new Set([focus ?? next?.chapter?.id ?? 'end']));
  const toggle = (id: string) => setShown(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const open = (n: PathNode) => {
    if (n.state === 'locked') { setWhy(why === n.id ? null : n.id); return; }
    if (n.kind === 'topic') onOpen(n.id); else onExam(n.id);
  };
  const chapters = [
    ...CHAPTERS.map((ch, ci) => ({ id: ch.id, n: `Kapitel ${ci + 1}`, title: ch.title, why: ch.why, nodes: nodes.filter(x => x.chapter?.id === ch.id) })),
    { id: 'end', n: 'Zum Schluss', title: 'Prüfungsvorbereitung', why: 'Alles aus allen Kapiteln gemischt, wie in einer großen Arbeit.', nodes: nodes.filter(x => !x.chapter) },
  ];

  return (
    <>
      <div className="path-h"><h1>Dein Lernpfad</h1><span>{done} von {nodes.length} geschafft</span></div>
      <ol className="map">
        {chapters.map(ch => {
          const isOpen = shown.has(ch.id);
          const ok = ch.nodes.filter(x => x.state === 'done').length;
          return (
            <li key={ch.id} className={`map-ch${isOpen ? ' on' : ''}`}>
              <button className="map-ch-h" onClick={() => toggle(ch.id)} aria-expanded={isOpen} aria-controls={`ch-${ch.id}`}>
                <span className="map-ch-t"><span className="map-ch-n">{ch.n}</span><b>{ch.title}</b></span>
                <span className="map-ch-p" aria-label={`${ok} von ${ch.nodes.length} geschafft`}>
                  <span className="map-ch-bar" aria-hidden="true"><i style={{ width: `${ch.nodes.length ? (100 * ok) / ch.nodes.length : 0}%` }} /></span>
                  {ok}/{ch.nodes.length}
                </span>
                <span className="map-ch-x" aria-hidden="true">›</span>
              </button>
              {isOpen && (
                <div id={`ch-${ch.id}`}>
                  <p className="map-ch-why">{ch.why}</p>
                  <ol className="map-nodes">
                    {ch.nodes.map(n => <Node key={n.id} n={n} stats={stats} exams={exams} profile={profile} why={why === n.id} onClick={() => open(n)} />)}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="extras">
        <label className="free">
          <input type="checkbox" checked={free} onChange={e => onFree(e.target.checked)} />
          <span><b>Freies Üben</b><small>Alle Themen sofort öffnen, zum Beispiel wenn du für ein bestimmtes Thema in der Schule übst.</small></span>
        </label>
        <button className="linkbtn" onClick={onPlacement}>🎯 Einstufungstest machen</button>
      </section>
    </>
  );
}

function Node({ n, stats, exams, profile, why, onClick }: { n: PathNode; stats: Stats; exams: Exams; profile: Profile | null; why: boolean; onClick: () => void }) {
  if (n.kind === 'topic') {
    const lv = stats[n.id]?.level ?? 1;
    return (
      <li className={`node ${n.state}`} style={tone(n.id)}>
        <button className="node-b" onClick={onClick} aria-describedby={why ? `why-${n.id}` : undefined}>
          <span className="ticon" aria-hidden="true">{n.state === 'locked' ? '🔒' : look(n.id).icon}</span>
          <span className="node-t">
            <b>{title(n.id)}</b>
            {profile && <FitTag id={n.id} profile={profile} />}
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

function FitTag({ id, profile }: { id: string; profile: Profile }) {
  const fit = fitOf(id, profile), g = gradeOf(id, profile);
  return <span className={`fit ${fit}`}>{fit === 'past' ? `Wiederholung aus Kl. ${g}` : fit === 'now' ? `Klasse ${g}: jetzt dran` : `Kommt meist in Kl. ${g}`}</span>;
}
