import { useState } from 'react';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { CHAPTERS, grade, nextNode, pathNodes, type Exams, type PathNode } from '../curriculum';
import { MAX_LEVEL, STAGES } from '../stages';
import { look, tone } from '../ui/look';
import { DAILY_GOAL, isActive, streak, type Activity } from '../progress';
import { dateH, daysLeft, isoDay, ready, todayItem, type Plan } from '../plan';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;

interface Props { stats: Stats; exams: Exams; free: boolean; plan: Plan | null; act: Activity; onProgress: () => void; onFree: (f: boolean) => void; onOpen: (id: string) => void; onExam: (id: string) => void; onPlan: () => void; onPlacement: () => void }

export function Home({ stats, exams, free, plan, act, onProgress, onFree, onOpen, onExam, onPlan, onPlacement }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const nodes = pathNodes(stats, exams, free, title, plan?.topics);
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

      <DayGoal act={act} onClick={onProgress} />
      <PlanCard plan={plan} stats={stats} onPlan={onPlan} />
      {!Object.keys(stats).length && (
        <button className="card panel promo" onClick={onPlacement}>
          <span className="ticon" aria-hidden="true">🎯</span>
          <span><b>Neu hier? Mach den Einstufungstest</b><small>Ein paar Aufgaben, dann weiß die App, wo du startest.</small></span>
        </button>
      )}

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

      <button className="linkbtn" onClick={onPlacement}>🎯 Einstufungstest machen</button>
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

/** Die nächste Klassenarbeit vom Themenzettel, ganz oben auf der Startseite. */
function PlanCard({ plan, stats, onPlan }: { plan: Plan | null; stats: Stats; onPlan: () => void }) {
  if (!plan) {
    return (
      <button className="card panel promo" onClick={onPlan}>
        <span className="ticon" aria-hidden="true">📅</span>
        <span><b>Bald eine Klassenarbeit?</b><small>Trag deinen Themenzettel ein oder fotografier ihn. Dann bekommst du einen Lernplan bis zum Termin.</small></span>
      </button>
    );
  }
  const left = plan.date ? daysLeft(plan.date, isoDay(new Date())) : null;
  const now = todayItem(plan, stats);
  const done = plan.topics.filter(id => ready(stats, id)).length;
  return (
    <button className="card panel promo plan-card" onClick={onPlan}>
      <span className="ticon" aria-hidden="true">📅</span>
      <span>
        <b>{plan.title || 'Klassenarbeit'}{plan.date && ` am ${dateH(plan.date)}`}</b>
        <small>{left === null ? '' : left > 1 ? `Noch ${left} Tage · ` : left === 1 ? 'Morgen! · ' : left === 0 ? 'Heute! Viel Erfolg 🍀 · ' : 'Vorbei · '}{done} von {plan.topics.length} Themen sitzen · Heute dran: {now.kind === 'topic' ? title(now.id) : 'Probe-Klassenarbeit'}</small>
      </span>
      <span className="continue-go" aria-hidden="true">▶</span>
    </button>
  );
}

/** Tagesziel als Fortschrittsring mit Serie */
function DayGoal({ act, onClick }: { act: Activity; onClick: () => void }) {
  const today = isoDay(new Date());
  const r = Math.min(DAILY_GOAL, act[today]?.right ?? 0);
  const n = streak(act, today);
  const lit = isActive(act[today]);
  const C = 2 * Math.PI * 22;
  return (
    <button className={`card panel daygoal${lit ? ' lit' : ''}`} onClick={onClick}>
      <span className="ring" aria-hidden="true">
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" className="ring-bg" /><circle cx="26" cy="26" r="22" className="ring-fg" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - r / DAILY_GOAL) }} /></svg>
        <span>{lit ? '🔥' : `${r}/${DAILY_GOAL}`}</span>
      </span>
      <span className="dg-t">
        <b>{lit ? `Tagesziel geschafft! ${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge` : n ? `🔥 ${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge` : 'Starte deine Serie'}</b>
        <small>{lit ? 'Kalender und Erfolge ansehen' : `Heute noch ${DAILY_GOAL - r} ${DAILY_GOAL - r === 1 ? 'Aufgabe' : 'Aufgaben'} richtig lösen${n ? ', damit die Serie hält' : ''}`}</small>
      </span>
      <span className="dg-go" aria-hidden="true">›</span>
    </button>
  );
}
