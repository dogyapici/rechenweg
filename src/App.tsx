import { useCallback, useState } from 'react';
import { Home } from './components/Home';
import { TopicPage } from './components/TopicPage';
import { Calculator } from './components/Calculator';
import { Tutor } from './components/Tutor';
import { Exam } from './components/Exam';
import { Zettel } from './components/Zettel';
import { Placement } from './components/Placement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadExams, loadFree, loadPlan, loadStats, saveExams, saveFree, saveLast, savePlan, saveStats, type Stats } from './storage';
import type { Plan } from './plan';
import { CHAPTERS, type Exams } from './curriculum';
import type { TutorContext } from './ai';

export type View = { name: 'home' } | { name: 'topic'; id: string } | { name: 'exam'; id: string } | { name: 'plan' } | { name: 'placement'; topics: string[]; back: 'home' | 'plan' } | { name: 'calc' } | { name: 'tutor' };

const ALL = CHAPTERS.flatMap(c => c.topics);
const NAV = [['home', '📚', 'Lernen'], ['calc', '🧮', 'Rechner'], ['tutor', '💬', 'Fragen']] as const;

export function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [stats, setStats] = useState<Stats>(loadStats);
  const [exams, setExams] = useState<Exams>(loadExams);
  const [free, setFree] = useState(loadFree);
  const [plan, setPlan] = useState<Plan | null>(loadPlan);
  const [tutorCtx, setTutorCtx] = useState<TutorContext | null>(null);

  const go = useCallback((v: View) => {
    if (v.name === 'topic') saveLast(v.id);
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);
  const updateStats = useCallback((s: Stats) => { setStats(s); saveStats(s); }, []);
  const updateExams = useCallback((e: Exams) => { setExams(e); saveExams(e); }, []);
  const updateFree = useCallback((f: boolean) => { setFree(f); saveFree(f); }, []);
  /** Ein neuer Zettel heißt neue Klassenarbeit: Die alte Probe-Klassenarbeit zählt nicht mehr. */
  const updatePlan = useCallback((p: Plan | null) => {
    if (JSON.stringify(p?.topics) !== JSON.stringify(plan?.topics) || p?.date !== plan?.date) {
      const e = { ...exams }; delete e.plan; setExams(e); saveExams(e);
    }
    setPlan(p); savePlan(p);
  }, [plan, exams]);
  const askTutor = useCallback((ctx: TutorContext | null) => { setTutorCtx(ctx); go({ name: 'tutor' }); }, [go]);

  const current = view.name === 'calc' || view.name === 'tutor' ? view.name : 'home';
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
        <ErrorBoundary key={view.name === 'topic' || view.name === 'exam' ? view.id : view.name}>
        {view.name === 'home' && <Home stats={stats} exams={exams} free={free} plan={plan} onFree={updateFree} onOpen={id => go({ name: 'topic', id })} onExam={id => go({ name: 'exam', id })}
          onPlan={() => go({ name: 'plan' })} onPlacement={() => go({ name: 'placement', topics: ALL, back: 'home' })} />}
        {view.name === 'exam' && <Exam key={view.id} id={view.id} exams={exams} onExams={updateExams} onBack={() => go({ name: view.id === 'plan' ? 'plan' : 'home' })} onOpenTopic={id => go({ name: 'topic', id })}
          custom={view.id === 'plan' && plan ? { name: `Probe-Klassenarbeit${plan.title ? ': ' + plan.title : ''}`, topics: plan.topics, back: 'Zurück zum Lernplan' } : undefined} />}
        {view.name === 'plan' && <Zettel plan={plan} stats={stats} exams={exams} onPlan={updatePlan} onOpen={id => go({ name: 'topic', id })} onExam={() => go({ name: 'exam', id: 'plan' })}
          onPlacement={topics => go({ name: 'placement', topics, back: 'plan' })} onBack={() => go({ name: 'home' })} />}
        {view.name === 'placement' && <Placement topics={view.topics} stats={stats} onStats={updateStats} onDone={() => go({ name: view.back })} />}
        {view.name === 'topic' && (
          <TopicPage key={view.id} id={view.id} stats={stats} onStats={updateStats} onBack={() => go({ name: 'home' })} onAskTutor={askTutor} />
        )}
        {view.name === 'calc' && <Calculator onAskTutor={askTutor} />}
        {view.name === 'tutor' && <Tutor context={tutorCtx} onClearContext={() => setTutorCtx(null)} />}
        </ErrorBoundary>
      </main>
    </>
  );
}
