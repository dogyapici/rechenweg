import { useState } from 'react';
import type { Exams } from '../curriculum';
import { dateH, isoDay, type Plan } from '../plan';
import { ACHIEVEMENTS, DAILY_GOAL, bestStreak, isActive, streak, type Activity, type Unlocked } from '../progress';
import type { Stats } from '../storage';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

interface Props { act: Activity; unlocked: Unlocked; stats: Stats; exams: Exams; plan: Plan | null; onBack: () => void }

/** Serie, Lernkalender und Erfolge */
export function Progress({ act, unlocked, stats, exams, plan, onBack }: Props) {
  const today = isoDay(new Date());
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [sel, setSel] = useState<string | null>(today);
  const s = streak(act, today);
  const best = bestStreak(act);
  const t = act[today];
  const left = Math.max(0, DAILY_GOAL - (t?.right ?? 0));
  const days = Object.keys(act).filter(k => isActive(act[k])).length;
  const right = Object.values(stats).reduce((a, x) => a + x.right, 0);
  const tries = Object.values(exams).reduce((a, x) => a + x.tries, 0);

  // Woche Mo–So
  const now = new Date(today + 'T12:00:00');
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return isoDay(d); });

  // Monatsraster
  const first = new Date(month.y, month.m, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => isoDay(new Date(month.y, month.m, i + 1, 12)))];
  const go = (k: number) => setMonth(({ y, m }) => { const d = new Date(y, m + k, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const sd = sel ? act[sel] : undefined;

  return (
    <div className="progress">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zurück">←</button><span className="ticon" aria-hidden="true">🔥</span><h1>Meine Serie</h1></div>

      <section className={`card panel streak-hero${isActive(t) ? ' lit' : ''}`}>
        <div className="flame" aria-hidden="true"><span>🔥</span></div>
        <div className="sh-t">
          <p className="sh-n"><b>{s}</b> {s === 1 ? 'Tag' : 'Tage'} in Folge</p>
          <p>{isActive(t) ? 'Heute geschafft! Komm morgen wieder, dann wächst deine Serie. 💪' : s ? `Noch ${left} ${left === 1 ? 'Aufgabe' : 'Aufgaben'} heute, sonst ist deine Serie morgen weg!` : `Löse heute ${DAILY_GOAL} Aufgaben richtig und starte deine Serie.`}</p>
          <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={DAILY_GOAL} aria-valuenow={Math.min(DAILY_GOAL, t?.right ?? 0)} aria-label="Tagesziel">
            <i style={{ width: `${Math.min(100, ((t?.right ?? 0) / DAILY_GOAL) * 100)}%` }} />
          </div>
          <small>Tagesziel: {Math.min(DAILY_GOAL, t?.right ?? 0)} von {DAILY_GOAL} Aufgaben richtig · Rekord: {best} {best === 1 ? 'Tag' : 'Tage'}</small>
        </div>
        <ol className="week" aria-label="Diese Woche">
          {week.map((d, i) => (
            <li key={d} className={`${isActive(act[d]) ? 'on' : ''}${d === today ? ' today' : ''}${d > today ? ' future' : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <span>{WD[i]}</span><b aria-label={isActive(act[d]) ? 'geschafft' : 'nicht geschafft'}>{isActive(act[d]) ? '🔥' : ''}</b>
            </li>
          ))}
        </ol>
      </section>

      <section className="card panel">
        <div className="cal-h">
          <button className="btn quiet" onClick={() => go(-1)} aria-label="Voriger Monat">‹</button>
          <h2 className="h2">{MONTHS[month.m]} {month.y}</h2>
          <button className="btn quiet" onClick={() => go(1)} aria-label="Nächster Monat">›</button>
        </div>
        <div className="cal" role="grid" aria-label="Lernkalender">
          {WD.map(w => <span key={w} className="cal-wd">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const l = act[d];
            const cls = [isActive(l) ? 'on' : l?.right ? 'part' : '', d === today ? 'today' : '', d === sel ? 'sel' : '', plan?.date === d ? 'exam' : '', d > today ? 'future' : ''].filter(Boolean).join(' ');
            return (
              <button key={d} className={`cal-d ${cls}`} onClick={() => setSel(d)} aria-label={`${dateH(d)}${isActive(l) ? ', Tagesziel geschafft' : l?.right ? `, ${l.right} richtig` : ''}${plan?.date === d ? ', Klassenarbeit' : ''}`}>
                <span>{Number(d.slice(8))}</span>
                {isActive(l) && <i aria-hidden="true">🔥</i>}
                {plan?.date === d && <i aria-hidden="true">📝</i>}
              </button>
            );
          })}
        </div>
        <ul className="cal-legend" aria-hidden="true">
          <li><i className="on" />Tagesziel geschafft</li><li><i className="part" />Ein bisschen geübt</li>{plan?.date && <li>📝 Klassenarbeit</li>}
        </ul>
        {sel && (
          <p className="cal-sel">
            <b>{sel === today ? 'Heute' : dateH(sel)}:</b>{' '}
            {plan?.date === sel && <>📝 {plan.title || 'Klassenarbeit'}. </>}
            {sd ? <>{sd.right} {sd.right === 1 ? 'Aufgabe' : 'Aufgaben'} richtig{sd.exams ? `, ${sd.exams} ${sd.exams === 1 ? 'Klassenarbeit' : 'Klassenarbeiten'}` : ''}{isActive(sd) ? ' 🔥' : ''}</> : sel > today ? 'Das kommt noch.' : 'Nicht geübt.'}
          </p>
        )}
      </section>

      <section className="card panel">
        <h2 className="h2">Zahlen</h2>
        <div className="numbers">
          <div><b>{right}</b><span>Aufgaben richtig</span></div>
          <div><b>{days}</b><span>Lerntage</span></div>
          <div><b>{best}</b><span>längste Serie</span></div>
          <div><b>{tries}</b><span>Klassenarbeiten</span></div>
        </div>
      </section>

      <section className="card panel">
        <h2 className="h2">Erfolge <small className="muted">{Object.keys(unlocked).length} von {ACHIEVEMENTS.length}</small></h2>
        <ul className="badges">
          {ACHIEVEMENTS.map((a, i) => {
            const at = unlocked[a.id];
            return (
              <li key={a.id} className={at ? 'got' : 'locked'} style={{ '--i': i } as React.CSSProperties}>
                <span className="b-icon" aria-hidden="true">{at ? a.icon : '🔒'}</span>
                <b>{a.title}</b>
                <small>{a.desc}</small>
                {at && <small className="b-at">am {dateH(at)}</small>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
