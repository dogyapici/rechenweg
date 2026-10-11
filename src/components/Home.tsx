import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { CHAPTERS, FINAL, grade, nextNode, pathNodes, topicDone, type Exams, type PathNode } from '../curriculum';
import { MAX_LEVEL, STAGES } from '../stages';
import { look, tone } from '../ui/look';
import { SCHULFORMEN, fitOf, reachable, type Profile } from '../profile';
import { ACHIEVEMENTS, DAILY_GOAL, bestStreak, isActive, streak, type Activity, type Unlocked } from '../progress';
import { dateH, daysLeft, isoDay, ready, todayItem, type Plan } from '../plan';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const shift = (iso: string, days: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + days); return isoDay(d); };
const examTitle = (id: string) => id === 'final' ? FINAL.title : id === 'plan' ? 'Probe-Klassenarbeit' : CHAPTERS.find(c => c.id === id)?.title ?? id;
const pct = (s: { right: number; total: number }) => s.total ? s.right / s.total : 0;

interface Props {
  stats: Stats; exams: Exams; free: boolean; plan: Plan | null; profile: Profile | null; act: Activity; unlocked: Unlocked
  onProfile: () => void; onProgress: () => void; onParents: () => void; onOpen: (id: string) => void; onExam: (id: string) => void; onPlan: () => void; onPlacement: () => void; onPath: (chapter?: string) => void
}

/** Startseite: was als Nächstes dran ist und wie es bisher läuft. */
export function Home({ stats, exams, free, plan, profile, act, unlocked, onProfile, onProgress, onParents, onOpen, onExam, onPlan, onPlacement, onPath }: Props) {
  const today = isoDay(new Date());
  const nodes = pathNodes(stats, exams, free, title, [...(plan?.topics ?? []), ...reachable(profile)]);
  const next = nextNode(nodes, n => n.kind === 'topic' && !!profile && fitOf(n.id, profile) === 'now');
  const isNew = !Object.keys(stats).length;
  const open = (n: PathNode) => { if (n.kind === 'topic') onOpen(n.id); else onExam(n.id); };

  const r = Math.min(DAILY_GOAL, act[today]?.right ?? 0);
  const lit = isActive(act[today]);
  const s = streak(act, today), best = bestStreak(act);
  const dow = (new Date(today + 'T12:00:00').getDay() + 6) % 7;
  const sum = (from: number, to: number) => { let n = 0; for (let k = from; k <= to; k++) n += act[shift(today, -k)]?.right ?? 0; return n; };
  const week = sum(0, dow), lastWeek = sum(dow + 1, dow + 7);
  const allTopics = CHAPTERS.flatMap(c => c.topics);
  const doneTopics = allTopics.filter(id => topicDone(stats, id)).length;

  return (
    <>
      <section className="hello">
        <h1>Hallo{profile?.name ? ` ${profile.name}` : ''}! 👋</h1>
        <p className="hello-sub">{lit ? 'Tagesziel geschafft. Stark! Alles ab jetzt ist Bonus. 💪' : r ? `Noch ${DAILY_GOAL - r} ${DAILY_GOAL - r === 1 ? 'Aufgabe' : 'Aufgaben'} bis zum Tagesziel.` : s ? `Halte deine Serie: heute ${DAILY_GOAL} Aufgaben richtig lösen.` : `Schön, dass du da bist. Heute schaffst du ${DAILY_GOAL} Aufgaben!`}</p>
        {profile && <button className="chip" onClick={onProfile} aria-label="Profil ansehen und ändern">🎒 Kl. {profile.klasse} · {SCHULFORMEN.find(f => f.id === profile.schulform)?.name.split(' (')[0]} · {profile.land}</button>}
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

      <section className="kpis" aria-label="Deine Zahlen">
        <button className={`kpi${lit ? ' lit' : ''}`} onClick={onProgress}>
          <Ring value={r} max={DAILY_GOAL} />
          <span><small>Heute</small><b>{r} von {DAILY_GOAL}</b><em>{lit ? 'Ziel geschafft 🎉' : 'richtig gelöst'}</em></span>
        </button>
        <button className="kpi" onClick={onProgress}>
          <span className="kpi-i" aria-hidden="true">🔥</span>
          <span><small>Serie</small><b>{s} {s === 1 ? 'Tag' : 'Tage'}</b><em>Rekord: {best}</em></span>
        </button>
        <button className="kpi" onClick={onProgress}>
          <span className="kpi-i" aria-hidden="true">✏️</span>
          <span><small>Diese Woche</small><b>{week}</b><em>richtig{lastWeek ? `, letzte Woche ${lastWeek}${week > lastWeek ? ' ↑' : ''}` : ' gelöst'}</em></span>
        </button>
        <button className="kpi" onClick={() => onPath()}>
          <span className="kpi-i" aria-hidden="true">⭐</span>
          <span><small>Themen</small><b>{doneTopics} von {allTopics.length}</b><em>geschafft</em></span>
        </button>
        {plan && <PlanKpi plan={plan} stats={stats} onPlan={onPlan} />}
      </section>

      <History act={act} today={today} onClick={onProgress} />

      <section className="card panel dash">
        <div className="dash-h"><h2>Dein Fortschritt</h2><button className="linkbtn" onClick={() => onPath()}>Ganzer Lernpfad ›</button></div>
        <ul className="chprog">
          {CHAPTERS.map(ch => {
            const n = ch.topics.length;
            const steps = ch.topics.reduce((a, id) => a + Math.min(MAX_LEVEL, stats[id]?.level ?? 1) - 1, 0);
            const ok = ch.topics.filter(id => topicDone(stats, id)).length;
            const note = exams[ch.id] ? grade(exams[ch.id].best).note : null;
            return (
              <li key={ch.id}>
                <button onClick={() => onPath(ch.id)} aria-label={`${ch.title}: ${ok} von ${n} Themen geschafft${note ? `, Klassenarbeit Note ${note}` : ''}`}>
                  <span className="chprog-t"><i aria-hidden="true">{look(ch.topics[0]).icon}</i><b>{ch.title}</b></span>
                  <span className="chprog-bar" aria-hidden="true"><i style={{ width: `${(100 * steps) / (n * (MAX_LEVEL - 1))}%` }} /></span>
                  <span className="chprog-n" aria-hidden="true">{note ? `📝 ${note}` : `${ok}/${n}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Strengths stats={stats} onOpen={onOpen} />
      <ExamList exams={exams} onExam={onExam} />
      <Badges unlocked={unlocked} onClick={onProgress} />
      <button className="card parents-link" onClick={onParents}>
        <span aria-hidden="true">👪</span>
        <span><b>Für Eltern und Nachhilfe</b><small>Fortschritt, Fehler und wo es hakt</small></span>
        <span aria-hidden="true">›</span>
      </button>
    </>
  );
}

/** Für den Anfang: die Schritte, die noch fehlen, in einer Karte. */
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

function Ring({ value, max }: { value: number; max: number }) {
  const C = 2 * Math.PI * 22;
  return (
    <span className="ring" aria-hidden="true">
      <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" className="ring-bg" /><circle cx="26" cy="26" r="22" className="ring-fg" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - value / max) }} /></svg>
      <span>{value >= max ? '🔥' : ''}</span>
    </span>
  );
}

/** Countdown zur nächsten Klassenarbeit. Der Lernplan selbst ist auf der Seite „Klassenarbeit“. */
function PlanKpi({ plan, stats, onPlan }: { plan: Plan; stats: Stats; onPlan: () => void }) {
  const left = plan.date ? daysLeft(plan.date, isoDay(new Date())) : null;
  const now = todayItem(plan, stats);
  const done = plan.topics.filter(id => ready(stats, id)).length;
  const when = left === null ? 'ohne Termin' : left > 1 ? `in ${left} Tagen` : left === 1 ? 'morgen!' : left === 0 ? 'heute! 🍀' : 'vorbei';
  return (
    <button className="kpi wide plan" onClick={onPlan}>
      <span className="kpi-i" aria-hidden="true">📅</span>
      <span><small>{plan.title || 'Klassenarbeit'}{plan.date && ` am ${dateH(plan.date)}`}</small><b>{when}</b><em>{done} von {plan.topics.length} Themen sitzen · heute dran: {now.kind === 'topic' ? title(now.id) : 'Probe-Klassenarbeit'}</em></span>
      <span className="kpi-go" aria-hidden="true">›</span>
    </button>
  );
}

/** Die letzten 14 Tage als Balken, mit Linie für das Tagesziel. */
function History({ act, today, onClick }: { act: Activity; today: string; onClick: () => void }) {
  const days = Array.from({ length: 14 }, (_, k) => shift(today, k - 13));
  const vals = days.map(d => act[d]?.right ?? 0);
  const top = Math.max(DAILY_GOAL * 2, ...vals);
  const W = 14 * 22, H = 110, y = (v: number) => H - (v / top) * H;
  const total = vals.reduce((a, b) => a + b, 0), active = days.filter(d => isActive(act[d])).length;
  return (
    <section className="card panel dash">
      <div className="dash-h"><h2>Deine letzten 14 Tage</h2><button className="linkbtn" onClick={onClick}>Kalender ›</button></div>
      <svg className="hist" viewBox={`-4 -16 ${W + 40} ${H + 38}`} role="img" aria-label={`In den letzten 14 Tagen ${total} Aufgaben richtig, an ${active} Tagen das Tagesziel geschafft`}>
        <line className="hist-goal" x1={0} x2={W} y1={y(DAILY_GOAL)} y2={y(DAILY_GOAL)} />
        <text className="hist-gl" x={W + 4} y={y(DAILY_GOAL) + 4}>Ziel</text>
        {days.map((d, k) => (
          <g key={d}>
            {vals[k] > 0 && <rect className={isActive(act[d]) ? 'on' : ''} x={k * 22 + 3} y={y(vals[k])} width={16} height={H - y(vals[k])} rx={4} />}
            {vals[k] > 0 && <text className="hist-v" x={k * 22 + 11} y={y(vals[k]) - 3} textAnchor="middle">{vals[k]}</text>}
            <text className={`hist-d${d === today ? ' today' : ''}`} x={k * 22 + 11} y={H + 16} textAnchor="middle">{d === today ? 'heute' : WD[new Date(d + 'T12:00:00').getDay()]}</text>
          </g>
        ))}
        <line className="hist-base" x1={0} x2={W} y1={H} y2={H} />
      </svg>
      <p className="dash-sum">{total ? <><b>{total}</b> Aufgaben richtig, an <b>{active}</b> {active === 1 ? 'Tag' : 'Tagen'} das Tagesziel geschafft.</> : 'Hier siehst du bald, an welchen Tagen du geübt hast.'}</p>
    </section>
  );
}

/** Was schon gut klappt und wo sich Üben lohnt. Erst ab ein paar Aufgaben pro Thema. */
function Strengths({ stats, onOpen }: { stats: Stats; onOpen: (id: string) => void }) {
  const seen = Object.keys(stats).filter(id => stats[id].total >= 5 && TOPICS.some(t => t.id === id));
  const good = seen.filter(id => pct(stats[id]) >= 0.8).sort((a, b) => pct(stats[b]) - pct(stats[a])).slice(0, 3);
  const work = seen.filter(id => pct(stats[id]) < 0.7).sort((a, b) => pct(stats[a]) - pct(stats[b])).slice(0, 3);
  if (!good.length && !work.length) return null;
  const row = (id: string) => (
    <li key={id} style={tone(id)}>
      <button onClick={() => onOpen(id)}><span aria-hidden="true">{look(id).icon}</span><b>{title(id)}</b><em>{Math.round(pct(stats[id]) * 100)} % richtig</em></button>
    </li>
  );
  return (
    <section className="card panel dash strengths">
      {good.length > 0 && <div><h2>💪 Läuft super</h2><ul>{good.map(row)}</ul></div>}
      {work.length > 0 && <div><h2>🎯 Nochmal üben lohnt sich</h2><ul>{work.map(row)}</ul></div>}
    </section>
  );
}

function ExamList({ exams, onExam }: { exams: Exams; onExam: (id: string) => void }) {
  const ids = Object.keys(exams).sort((a, b) => (exams[b].at ?? '').localeCompare(exams[a].at ?? '')).slice(0, 4);
  if (!ids.length) return null;
  return (
    <section className="card panel dash">
      <div className="dash-h"><h2>Deine Klassenarbeiten</h2></div>
      <ul className="exlist">
        {ids.map(id => {
          const g = grade(exams[id].best);
          return (
            <li key={id}>
              <button onClick={() => onExam(id)}>
                <span className={`exnote n${g.note}`} aria-label={`Note ${g.note}`}>{g.note}</span>
                <span><b>{examTitle(id)}</b><em>{Math.round(exams[id].best * 100)} % · {exams[id].tries} {exams[id].tries === 1 ? 'Versuch' : 'Versuche'}{exams[id].at ? ` · ${dateH(exams[id].at.slice(0, 10))}` : ''}</em></span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Badges({ unlocked, onClick }: { unlocked: Unlocked; onClick: () => void }) {
  const got = ACHIEVEMENTS.filter(a => unlocked[a.id]).sort((a, b) => unlocked[b.id].localeCompare(unlocked[a.id]));
  const nxt = ACHIEVEMENTS.find(a => !unlocked[a.id]);
  return (
    <button className="card panel badges" onClick={onClick}>
      <span className="badges-i" aria-hidden="true">{got.length ? got.slice(0, 4).map(a => <i key={a.id}>{a.icon}</i>) : <i>🏅</i>}</span>
      <span><b>{got.length} von {ACHIEVEMENTS.length} Erfolgen</b><em>{nxt ? `Als Nächstes: ${nxt.icon} ${nxt.title}` : 'Du hast alle Erfolge! 👑'}</em></span>
      <span aria-hidden="true">›</span>
    </button>
  );
}
