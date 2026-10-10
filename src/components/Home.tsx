import { useState } from 'react';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { CHAPTERS, grade, nextNode, pathNodes, type Exams, type PathNode } from '../curriculum';
import { MAX_LEVEL, STAGES } from '../stages';
import { look, tone } from '../ui/look';
import { SCHULFORMEN, fitOf, gradeOf, reachable, type Profile } from '../profile';
import { DAILY_GOAL, isActive, streak, type Activity } from '../progress';
import { dateH, daysLeft, isoDay, ready, todayItem, type Plan } from '../plan';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;

interface Props { stats: Stats; exams: Exams; free: boolean; plan: Plan | null; profile: Profile | null; onProfile: () => void; act: Activity; onProgress: () => void; onFree: (f: boolean) => void; onOpen: (id: string) => void; onExam: (id: string) => void; onPlan: () => void; onPlacement: () => void }

export function Home({ stats, exams, free, plan, profile, onProfile, act, onProgress, onFree, onOpen, onExam, onPlan, onPlacement }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const nodes = pathNodes(stats, exams, free, title, [...(plan?.topics ?? []), ...reachable(profile)]);
  const next = nextNode(nodes, n => n.kind === 'topic' && !!profile && fitOf(n.id, profile) === 'now');
  const done = nodes.filter(n => n.state === 'done').length;
  // Nur das Kapitel, in dem es gerade weitergeht, ist aufgeklappt. Der Rest bleibt kurz.
  const [shown, setShown] = useState<Set<string>>(() => new Set([next?.chapter?.id ?? 'end']));
  const toggle = (id: string) => setShown(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const open = (n: PathNode) => {
    if (n.state === 'locked') { setWhy(why === n.id ? null : n.id); return; }
    if (n.kind === 'topic') onOpen(n.id); else onExam(n.id);
  };
  const isNew = !Object.keys(stats).length;
  const chapters = [
    ...CHAPTERS.map((ch, ci) => ({ id: ch.id, n: `Kapitel ${ci + 1}`, title: ch.title, why: ch.why, nodes: nodes.filter(x => x.chapter?.id === ch.id) })),
    { id: 'end', n: 'Zum Schluss', title: 'Prüfungsvorbereitung', why: 'Alles aus allen Kapiteln gemischt, wie in einer großen Arbeit.', nodes: nodes.filter(x => !x.chapter) },
  ];

  return (
    <>
      <section className="hello">
        <h1>Hallo{profile?.name ? ` ${profile.name}` : ''}! 👋</h1>
        <div className="chips">
          <DayGoal act={act} onClick={onProgress} />
          {profile && <button className="chip" onClick={onProfile} aria-label="Profil ändern">🎒 Kl. {profile.klasse} · {SCHULFORMEN.find(f => f.id === profile.schulform)?.name.split(' (')[0]} · {profile.land}</button>}
        </div>
      </section>

      {(!profile || isNew) && <Setup profile={!!profile} isNew={isNew} onProfile={onProfile} onPlacement={onPlacement} />}

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

      <PlanLine plan={plan} stats={stats} onPlan={onPlan} />

      <section className="path">
        <div className="path-h"><h2>Dein Lernpfad</h2><span>{done} von {nodes.length} geschafft</span></div>
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
      </section>

      <section className="extras">
        <label className="free">
          <input type="checkbox" checked={free} onChange={e => onFree(e.target.checked)} />
          <span><b>Freies Üben</b><small>Alle Themen sofort öffnen, zum Beispiel wenn du für ein bestimmtes Thema in der Schule übst.</small></span>
        </label>
        {!isNew && <button className="linkbtn" onClick={onPlacement}>🎯 Einstufungstest nochmal machen</button>}
      </section>
    </>
  );
}

/** Für den Anfang: die zwei Schritte, die noch fehlen, in einer Karte. */
function Setup({ profile, isNew, onProfile, onPlacement }: { profile: boolean; isNew: boolean; onProfile: () => void; onPlacement: () => void }) {
  return (
    <div className="card panel setup">
      <b>So geht's los</b>
      <ol>
        <li className={profile ? 'ok' : ''}>
          <button onClick={onProfile}><span aria-hidden="true">{profile ? '✓' : '1'}</span><span>Sag mir deine Klasse, Schule und dein Bundesland<small>Dann passt der Lernpfad zu deinem Unterricht.</small></span></button>
        </li>
        {isNew && (
          <li>
            <button onClick={onPlacement}><span aria-hidden="true">2</span><span>Mach den Einstufungstest<small>Ein paar Aufgaben, dann weiß die App, wo du startest.</small></span></button>
          </li>
        )}
      </ol>
    </div>
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

/** Die nächste Klassenarbeit vom Themenzettel als eine schmale Zeile. */
function PlanLine({ plan, stats, onPlan }: { plan: Plan | null; stats: Stats; onPlan: () => void }) {
  if (!plan) return <button className="planline" onClick={onPlan}><span aria-hidden="true">📅</span><span>Bald eine Klassenarbeit? <b>Themenzettel eintragen</b></span><span aria-hidden="true">›</span></button>;
  const left = plan.date ? daysLeft(plan.date, isoDay(new Date())) : null;
  const now = todayItem(plan, stats);
  const done = plan.topics.filter(id => ready(stats, id)).length;
  const when = left === null ? '' : left > 1 ? `noch ${left} Tage` : left === 1 ? 'morgen!' : left === 0 ? 'heute! 🍀' : 'vorbei';
  return (
    <button className="planline on" onClick={onPlan}>
      <span aria-hidden="true">📅</span>
      <span><b>{plan.title || 'Klassenarbeit'}{plan.date && ` am ${dateH(plan.date)}`}</b>{when && ` · ${when}`} · {done}/{plan.topics.length} Themen sitzen<small>Heute dran: {now.kind === 'topic' ? title(now.id) : 'Probe-Klassenarbeit'}</small></span>
      <span aria-hidden="true">›</span>
    </button>
  );
}

/** Tagesziel als kleiner Ring mit Serie */
function DayGoal({ act, onClick }: { act: Activity; onClick: () => void }) {
  const today = isoDay(new Date());
  const r = Math.min(DAILY_GOAL, act[today]?.right ?? 0);
  const n = streak(act, today);
  const lit = isActive(act[today]);
  const C = 2 * Math.PI * 22;
  const label = lit ? `Tagesziel geschafft, ${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge` : `Tagesziel: ${r} von ${DAILY_GOAL} Aufgaben${n ? `, ${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge` : ''}`;
  return (
    <button className={`chip daygoal${lit ? ' lit' : ''}`} onClick={onClick} aria-label={`${label}. Kalender und Erfolge ansehen`}>
      <span className="ring" aria-hidden="true">
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" className="ring-bg" /><circle cx="26" cy="26" r="22" className="ring-fg" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - r / DAILY_GOAL) }} /></svg>
      </span>
      <span>{lit ? `🔥 ${n} ${n === 1 ? 'Tag' : 'Tage'}` : `Heute ${r}/${DAILY_GOAL}`}{!lit && n > 0 && ` · 🔥 ${n}`}</span>
    </button>
  );
}

function FitTag({ id, profile }: { id: string; profile: Profile }) {
  const fit = fitOf(id, profile), g = gradeOf(id, profile);
  return <span className={`fit ${fit}`}>{fit === 'past' ? `Wiederholung aus Kl. ${g}` : fit === 'now' ? `Klasse ${g}: jetzt dran` : `Kommt meist in Kl. ${g}`}</span>;
}
