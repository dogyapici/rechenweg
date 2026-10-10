import { useMemo } from 'react';
import { evalExpr, solHTML } from '../engine/index.js';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { Html } from './Html';

export function Home({ stats, onOpen }: { stats: Stats; onOpen: (id: string) => void }) {
  const demo = useMemo(() => solHTML(evalExpr('2 + 3 · (8 − 4)')), []);
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Mathe verstehen, <em>Schritt für Schritt.</em></h1>
          <p>Lerne selbstständig, auch wenn du bei null anfängst: erst die Idee verstehen, dann ein durchgerechnetes Beispiel ansehen, dann selbst üben, bis es sitzt.</p>
          <div className="trust">
            <div><span className="dot d1">1</span><span><b>Jede Zahl ist nachgerechnet.</b> Ergebnisse und Rechenwege kommen aus einer exakten Recheneinheit, nicht aus einer KI.</span></div>
            <div><span className="dot d2">2</span><span><b>Die KI erklärt nur.</b> Sie formuliert den fertigen Rechenweg einfacher und beantwortet Fragen. Rechnen lässt sie die Recheneinheit.</span></div>
            <div><span className="dot d3">3</span><span><b>Fehler werden erkannt.</b> Typische Fehler wie „Nenner plus Nenner“ bemerkt die App und sagt dir, was schiefging.</span></div>
          </div>
        </div>
        <div className="card demo" aria-label="Beispiel für einen Rechenweg">
          <span className="demo-h">So sieht ein Rechenweg aus</span>
          <Html html={demo} />
        </div>
      </section>
      <h2 className="sec">Dein Lernpfad <span>Von oben nach unten aufgebaut, du kannst aber überall einsteigen.</span></h2>
      <ol className="path">
        {TOPICS.map((t, i) => {
          const s = stats[t.id];
          return (
            <li key={t.id}>
              <button className="tcard" onClick={() => onOpen(t.id)}>
                <span className="tc-top"><span className="tnum">{i + 1}</span><span className="kl">Klasse {t.klasse}</span></span>
                <h3>{t.title}</h3>
                <p>{t.short}</p>
                <span className="prog">
                  <span className="pips" aria-hidden="true">{[1, 2, 3].map(n => <i key={n} className={s && n <= s.level ? 'on' : ''} />)}</span>
                  {s ? `Stufe ${s.level} von 3 · ${s.right} richtig` : 'Noch nicht begonnen'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
