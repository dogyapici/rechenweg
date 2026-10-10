import { useCallback, useState } from 'react';
import { Home } from './components/Home';
import { TopicPage } from './components/TopicPage';
import { Calculator } from './components/Calculator';
import { Tutor } from './components/Tutor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadLast, loadStats, saveLast, saveStats, type Stats } from './storage';
import type { TutorContext } from './ai';

export type View = { name: 'home' } | { name: 'topic'; id: string } | { name: 'calc' } | { name: 'tutor' };

const NAV = [['home', '📚', 'Lernen'], ['calc', '🧮', 'Rechner'], ['tutor', '💬', 'Fragen']] as const;

export function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [stats, setStats] = useState<Stats>(loadStats);
  const [last, setLast] = useState(loadLast);
  const [tutorCtx, setTutorCtx] = useState<TutorContext | null>(null);

  const go = useCallback((v: View) => {
    if (v.name === 'topic') { saveLast(v.id); setLast(v.id); }
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);
  const updateStats = useCallback((s: Stats) => { setStats(s); saveStats(s); }, []);
  const askTutor = useCallback((ctx: TutorContext | null) => { setTutorCtx(ctx); go({ name: 'tutor' }); }, [go]);

  const current = view.name === 'topic' ? 'home' : view.name;
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
        <ErrorBoundary key={view.name === 'topic' ? view.id : view.name}>
        {view.name === 'home' && <Home stats={stats} last={last} onOpen={id => go({ name: 'topic', id })} />}
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
