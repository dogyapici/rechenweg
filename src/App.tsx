import { useCallback, useState } from 'react';
import { Home } from './components/Home';
import { TopicPage } from './components/TopicPage';
import { Calculator } from './components/Calculator';
import { Tutor } from './components/Tutor';
import { loadStats, saveStats, type Stats } from './storage';
import type { TutorContext } from './ai';

export type View = { name: 'home' } | { name: 'topic'; id: string } | { name: 'calc' } | { name: 'tutor' };

export function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [stats, setStats] = useState<Stats>(loadStats);
  const [tutorCtx, setTutorCtx] = useState<TutorContext | null>(null);

  const go = useCallback((v: View) => { setView(v); window.scrollTo({ top: 0 }); }, []);
  const updateStats = useCallback((s: Stats) => { setStats(s); saveStats(s); }, []);
  const askTutor = useCallback((ctx: TutorContext | null) => { setTutorCtx(ctx); go({ name: 'tutor' }); }, [go]);

  const current = view.name === 'topic' ? 'home' : view.name;
  return (
    <>
      <header className="top">
        <div className="top-in">
          <button className="brand" onClick={() => go({ name: 'home' })} aria-label="Zur Startseite">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="none" stroke="var(--blue)" strokeWidth="2.5" />
              <path d="M8 21 L14 15 L18 19 L24 11" fill="none" stroke="var(--red)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="11" r="2.4" fill="var(--red)" />
            </svg>
            <span><b>Rechenweg</b><small>Mathe-Coach ab Klasse 5</small></span>
          </button>
          <nav className="tabs" aria-label="Bereiche">
            {([['home', 'Lernen'], ['calc', 'Rechner'], ['tutor', 'Tutor']] as const).map(([k, l]) => (
              <button key={k} aria-current={current === k ? 'page' : undefined} onClick={() => go({ name: k })}>{l}</button>
            ))}
          </nav>
        </div>
      </header>
      <main>
        {view.name === 'home' && <Home stats={stats} onOpen={id => go({ name: 'topic', id })} />}
        {view.name === 'topic' && (
          <TopicPage key={view.id} id={view.id} stats={stats} onStats={updateStats} onBack={() => go({ name: 'home' })} onAskTutor={askTutor} />
        )}
        {view.name === 'calc' && <Calculator onAskTutor={askTutor} />}
        {view.name === 'tutor' && <Tutor context={tutorCtx} onClearContext={() => setTutorCtx(null)} />}
      </main>
    </>
  );
}
