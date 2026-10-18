import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Path } from './components/Path';
import { TopicPage } from './components/TopicPage';
import { Calculator } from './components/Calculator';
import { Tutor } from './components/Tutor';
import { Exam } from './components/Exam';
import { Zettel } from './components/Zettel';
import { Mix } from './components/Mix';
import { Buch } from './components/Buch';
import { practiced } from './mix';
import { Placement } from './components/Placement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Progress } from './components/Progress';
import { ProfilePage } from './components/ProfilePage';
import { Eltern } from './components/Eltern';
import { Konto } from './components/Konto';
import { Schueler } from './components/Schueler';
import { useSync } from './useSync';
import { addAttempt, addExam, decodeSnapshot, SHARE_KEY, type Attempt, type ExamLog, type Journal, type Snapshot } from './journal';
import { Celebrate, type Party } from './components/Celebrate';
import { loadActivity, loadExams, loadFree, loadJournal, loadPlan, loadProfile, loadStats, loadUnlocked, saveActivity, saveExams, saveFree, saveJournal, saveLast, savePlan, saveProfile, saveStats, saveUnlocked, type Stats } from './storage';
import { isoDay, type Plan } from './plan';
import { reachable, type Profile } from './profile';
import { DAILY_GOAL, isActive, logExam, logMix, logStats, newAchievements, streak, type Activity, type Unlocked } from './progress';
import { CHAPTERS, FINAL, type Exams } from './curriculum';
import type { TutorContext } from './ai';

export type View = { name: 'home' } | { name: 'topic'; id: string; from?: 'plan' | 'path' } | { name: 'path'; focus?: string } | { name: 'exam'; id: string } | { name: 'mix'; id: string } | { name: 'plan' } | { name: 'placement'; topics: string[]; back: 'home' | 'plan' } | { name: 'calc' } | { name: 'tutor' } | { name: 'progress' } | { name: 'profile' } | { name: 'eltern' } | { name: 'konto' } | { name: 'schueler' } | { name: 'buch' };

const ALL = CHAPTERS.flatMap(c => c.topics);
const NAV = [['home', '🏠', 'Start'], ['path', '📚', 'Lernpfad'], ['plan', '📅', 'Klassenarbeit'], ['calc', '🧮', 'Rechner'], ['tutor', '💬', 'Fragen']] as const;

export function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [stats, setStats] = useState<Stats>(loadStats);
  const [exams, setExams] = useState<Exams>(loadExams);
  const [free, setFree] = useState(loadFree);
  const [plan, setPlan] = useState<Plan | null>(loadPlan);
  const [profile, setProfile] = useState<Profile | null>(loadProfile);
  const [tutorCtx, setTutorCtx] = useState<TutorContext | null>(null);
  const [journal, setJournal] = useState<Journal>(loadJournal);
  const jref = useRef(journal);
  const logTry = useCallback((a: Attempt) => { const j = addAttempt(jref.current, a); jref.current = j; setJournal(j); saveJournal(j); }, []);
  const logExam_ = useCallback((tries: Attempt[], e: ExamLog) => { let j = jref.current; for (const a of tries) j = addAttempt(j, a); j = addExam(j, e); jref.current = j; setJournal(j); saveJournal(j); }, []);
  /** Ein geteilter Bericht kommt als #bericht=… in der Adresse und wird nur angezeigt, nie gespeichert. */
  const [shared, setShared] = useState<Snapshot | 'bad' | null>(null);
  useEffect(() => {
    const read = () => {
      const m = location.hash.match(new RegExp(`^#${SHARE_KEY}=(.+)$`));
      if (m) decodeSnapshot(m[1]).then(s => setShared(s ?? 'bad')); else setShared(null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const closeShared = () => { history.replaceState(null, '', location.pathname + location.search); setShared(null); };

  const go = useCallback((v: View) => {
    if (v.name === 'topic') saveLast(v.id);
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);
  const [act, setAct] = useState<Activity>(loadActivity);
  const [unlocked, setUnlocked] = useState<Unlocked>(loadUnlocked);
  const [parties, setParties] = useState<Party[]>([]);
  const ref = useRef({ stats, exams, act, unlocked });
  ref.current = { stats, exams, act, unlocked };

  /** Lerntag eintragen, Tagesziel und neue Erfolge feiern. */
  const record = useCallback((nextStats: Stats, nextExams: Exams, nextAct: Activity) => {
    const today = isoDay(new Date());
    const { act: prevAct, unlocked: have } = ref.current;
    const fresh: Party[] = [];
    if (!isActive(prevAct[today]) && isActive(nextAct[today])) {
      const n = streak(nextAct, today);
      fresh.push({ kind: 'goal', icon: '🔥', title: n > 1 ? `${n} Tage in Folge!` : 'Deine Serie startet!', text: n > 1 ? `Du hast heute ${DAILY_GOAL} Aufgaben geschafft. Deine Serie ist jetzt ${n} Tage lang. Weiter so!` : `Du hast heute ${DAILY_GOAL} Aufgaben geschafft. Komm morgen wieder, dann wächst deine Serie.` });
    }
    const got = newAchievements({ act: nextAct, stats: nextStats, exams: nextExams, today }, have);
    if (got.length) {
      const u = { ...have }; for (const a of got) u[a.id] = today;
      ref.current.unlocked = u; setUnlocked(u); saveUnlocked(u);
      // Ein neuer Serien-Erfolg ersetzt die normale Tagesziel-Meldung, sonst kommt dasselbe zweimal.
      if (got.some(a => /^s\d+$/.test(a.id))) fresh.length = 0;
      fresh.push(...got.filter(a => !(a.id === 'ziel' && fresh.length)).map(a => ({ kind: 'badge' as const, icon: a.icon, title: a.title, text: a.desc })));
    }
    ref.current = { ...ref.current, stats: nextStats, exams: nextExams, act: nextAct };
    if (nextAct !== prevAct) { setAct(nextAct); saveActivity(nextAct); }
    if (fresh.length) setParties(p => [...p, ...fresh]);
  }, []);
  const updateStats = useCallback((s: Stats) => {
    const prev = ref.current.stats;
    setStats(s); saveStats(s);
    record(s, ref.current.exams, logStats(ref.current.act, prev, s, isoDay(new Date())));
  }, [record]);
  const updateExams = useCallback((e: Exams) => {
    const more = Object.keys(e).some(k => (e[k]?.tries ?? 0) > (ref.current.exams[k]?.tries ?? 0));
    setExams(e); saveExams(e);
    record(ref.current.stats, e, more ? logExam(ref.current.act, isoDay(new Date())) : ref.current.act);
  }, [record]);
  /** Gemischt geübte Aufgabe: ins Lerntagebuch und fürs Tagesziel zählen, die Stufen im Thema bleiben, wie sie sind. */
  const logMix_ = useCallback((a: Attempt) => {
    logTry(a);
    record(ref.current.stats, ref.current.exams, logMix(ref.current.act, a.ok, isoDay(new Date())));
  }, [logTry, record]);
  /** Buchaufgabe, von der Recheneinheit geprüft: ins Lerntagebuch und fürs Tagesziel. */
  const logBuch = useCallback((a: Attempt) => {
    logTry(a);
    record(ref.current.stats, ref.current.exams, logMix(ref.current.act, a.ok, isoDay(new Date())));
  }, [logTry, record]);
  const updateFree = useCallback((f: boolean) => { setFree(f); saveFree(f); }, []);
  /** Ein neuer Zettel heißt neue Klassenarbeit: Die alte Probe-Klassenarbeit zählt nicht mehr. */
  const updatePlan = useCallback((p: Plan | null) => {
    if (JSON.stringify(p?.topics) !== JSON.stringify(plan?.topics) || p?.date !== plan?.date) {
      const e = { ...exams }; delete e.plan; setExams(e); saveExams(e);
    }
    setPlan(p); savePlan(p);
  }, [plan, exams]);
  const changed = useMemo(() => [stats, exams, act, unlocked, journal, plan, profile], [stats, exams, act, unlocked, journal, plan, profile]);
  const { account, status, signOut } = useSync(changed);
  const [outErr, setOutErr] = useState('');
  const doLogout = async () => { setOutErr(''); if (await signOut()) go({ name: 'home' }); else setOutErr('Gerade keine Verbindung. Bitte erst wieder online gehen, damit nichts verloren geht.'); };

  const placement = () => go({ name: 'placement', topics: profile && reachable(profile).length ? reachable(profile) : ALL, back: 'home' });
  const askTutor = useCallback((ctx: TutorContext | null) => { setTutorCtx(ctx); go({ name: 'tutor' }); }, [go]);

  const fromPlan = view.name === 'plan' || (view.name === 'topic' && view.from === 'plan') || (view.name === 'exam' && view.id === 'plan') || (view.name === 'mix' && (view.id === 'plan' || view.id === 'geuebt')) || (view.name === 'placement' && view.back === 'plan');
  const fromPath = view.name === 'path' || (view.name === 'topic' && view.from === 'path') || (view.name === 'exam' && view.id !== 'plan') || (view.name === 'mix' && view.id !== 'plan' && view.id !== 'geuebt');
  const current = view.name === 'calc' || view.name === 'tutor' ? view.name : fromPlan ? 'plan' : fromPath ? 'path' : 'home';
  return (
    <>
      <header className="top">
        <div className="top-in">
          <button className="brand" onClick={() => go({ name: 'home' })} aria-label="Zur Startseite">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="var(--blue)" />
              <path d="M8 21 L14 15 L18 19 L24 11" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="11" r="2.6" fill="var(--sun)" />
            </svg>
            <b>Rechenweg</b>
          </button>
          <StreakChip act={act} onClick={() => go({ name: 'progress' })} />
          <nav className="tabs" aria-label="Bereiche">
            {NAV.map(([k, i, l]) => (
              <button key={k} aria-current={current === k ? 'page' : undefined} onClick={() => go({ name: k })}>
                <span className="ti" aria-hidden="true">{i}</span><span>{l}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main>
        {shared === 'bad' && <div className="card panel"><p>Dieser Bericht-Link ist leider beschädigt oder unvollständig. Bitte lassen Sie sich einen neuen Link schicken.</p><button className="btn" onClick={closeShared}>Zur App</button></div>}
        {shared && shared !== 'bad' && <ErrorBoundary key="shared"><Eltern data={shared} shared onBack={closeShared} /></ErrorBoundary>}
        {!shared && <ErrorBoundary key={view.name === 'topic' || view.name === 'exam' || view.name === 'mix' ? view.id : view.name}>
        {view.name === 'home' && <Home stats={stats} exams={exams} free={free} plan={plan} profile={profile} act={act} unlocked={unlocked} onProfile={() => go({ name: 'profile' })} onProgress={() => go({ name: 'progress' })} onParents={() => go({ name: 'eltern' })} account={account} onAccount={() => go({ name: 'konto' })} onStudents={() => go({ name: 'schueler' })} onOpen={id => go({ name: 'topic', id })} onExam={id => go({ name: 'exam', id })}
          onPlan={() => go({ name: 'plan' })} onPlacement={placement} onPath={focus => go({ name: 'path', focus })} onBuch={() => go({ name: 'buch' })} />}
        {view.name === 'buch' && <Buch onBack={() => go({ name: 'home' })} onLog={logBuch} onOpenTopic={id => go({ name: 'topic', id })} />}
        {view.name === 'path' && <Path key={view.focus} stats={stats} exams={exams} free={free} plan={plan} profile={profile} focus={view.focus} onFree={updateFree} onOpen={id => go({ name: 'topic', id, from: 'path' })} onExam={id => go({ name: 'exam', id })} onPlacement={placement} />}
        {view.name === 'exam' && <Exam key={view.id} id={view.id} exams={exams} onExams={updateExams} onLog={logExam_} onBack={() => go({ name: view.id === 'plan' ? 'plan' : 'path' })} onOpenTopic={id => go({ name: 'topic', id, from: view.id === 'plan' ? 'plan' : 'path' })} onMix={() => go({ name: 'mix', id: view.id })}
          custom={view.id === 'plan' && plan ? { name: `Probe-Klassenarbeit${plan.title ? ': ' + plan.title : ''}`, topics: plan.topics, back: 'Zurück zum Lernplan' } : undefined} />}
        {view.name === 'mix' && (() => {
          const ch = CHAPTERS.find(c => c.id === view.id);
          const toPlan = view.id === 'plan' || view.id === 'geuebt';
          const topics = view.id === 'plan' ? plan?.topics ?? [] : view.id === 'geuebt' ? practiced(stats, ALL) : ch ? ch.topics : FINAL.topics;
          const name = view.id === 'plan' ? `Gemischt üben${plan?.title ? ': ' + plan.title : ''}` : view.id === 'geuebt' ? 'Gemischt üben' : `Gemischt üben: ${ch ? ch.title : FINAL.title}`;
          const back = () => go(toPlan ? { name: 'plan' } : { name: 'exam', id: view.id });
          return topics.length
            ? <Mix name={name} topics={topics} stats={stats} back="Zurück zur Klassenarbeit" onBack={back} onLog={logMix_} onOpenTopic={id => go({ name: 'topic', id, from: toPlan ? 'plan' : 'path' })} />
            : <div className="card panel"><p>Hier gibt es noch keine Themen zum Mischen.</p><button className="btn" onClick={back}>Zurück</button></div>;
        })()}
        {view.name === 'plan' && <Zettel plan={plan} stats={stats} exams={exams} onPlan={updatePlan} onOpen={id => go({ name: 'topic', id, from: 'plan' })} onExam={() => go({ name: 'exam', id: 'plan' })} onMix={id => go({ name: 'mix', id })}
          onPlacement={topics => go({ name: 'placement', topics, back: 'plan' })} onBack={() => go({ name: 'home' })} />}
        {view.name === 'placement' && <Placement topics={view.topics} stats={stats} onStats={updateStats} onDone={() => go({ name: view.back })} />}
        {view.name === 'topic' && (
          <TopicPage key={view.id} id={view.id} stats={stats} onStats={updateStats} onLog={logTry} onBack={() => go({ name: view.from ?? 'home' })} backLabel={view.from === 'plan' ? 'Zurück zum Lernplan' : view.from === 'path' ? 'Zurück zum Lernpfad' : 'Zur Startseite'} onAskTutor={askTutor} />
        )}
        {view.name === 'profile' && <ProfilePage profile={profile} onSave={p => { setProfile(p); saveProfile(p); go({ name: 'home' }); }} onBack={() => go({ name: 'home' })} />}
        {view.name === 'progress' && <Progress act={act} unlocked={unlocked} stats={stats} exams={exams} plan={plan} onBack={() => go({ name: 'home' })} />}
        {view.name === 'calc' && <Calculator onAskTutor={askTutor} />}
        {view.name === 'tutor' && <Tutor context={tutorCtx} onClearContext={() => setTutorCtx(null)} onBuch={() => go({ name: 'buch' })} />}
        {view.name === 'konto' && <Konto account={account} sync={outErr || status} onBack={() => go({ name: 'home' })} onLogout={doLogout} onStudents={() => go({ name: 'schueler' })} />}
        {view.name === 'schueler' && account && account.role !== 'schueler' && <Schueler me={account} onBack={() => go({ name: 'home' })} />}
        {view.name === 'eltern' && <Eltern data={{ profile, stats, exams, act, journal }} synced={account?.role === 'schueler'} onBack={() => go({ name: 'home' })} onOpenTopic={id => go({ name: 'topic', id })} />}
        </ErrorBoundary>}
      </main>
      {parties[0] && <Celebrate party={parties[0]} more={parties.length - 1} onClose={() => setParties(p => p.slice(1))} />}
    </>
  );
}

/** Serie oben in der Leiste: Flamme leuchtet, wenn das Tagesziel heute geschafft ist. */
function StreakChip({ act, onClick }: { act: Activity; onClick: () => void }) {
  const today = isoDay(new Date());
  const n = streak(act, today);
  const lit = isActive(act[today]);
  return (
    <button className={`streak-chip${lit ? ' lit' : ''}`} onClick={onClick} aria-label={`Serie: ${n} ${n === 1 ? 'Tag' : 'Tage'}${lit ? ', heute geschafft' : ''}. Kalender und Erfolge öffnen`}>
      <span className="sc-f" aria-hidden="true">🔥</span><b>{n}</b>
    </button>
  );
}
