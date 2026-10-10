import { useState } from 'react';
import { TOPICS } from '../topics';
import type { Stats } from '../storage';
import { look, stars, tone } from '../ui/look';
import { Stars } from '../ui/bits';

const KLASSEN = [5, 6, 7] as const;

export function Home({ stats, last, onOpen }: { stats: Stats; last: string | null; onOpen: (id: string) => void }) {
  const [klasse, setKlasse] = useState<number | null>(null);
  const lastTopic = TOPICS.find(t => t.id === last);
  const list = TOPICS.filter(t => klasse === null || t.klasse === klasse);
  const earned = TOPICS.reduce((n, t) => n + stars(stats[t.id]), 0);

  return (
    <>
      <section className="hello">
        <h1>Hallo! 👋<br />Was möchtest du heute üben?</h1>
        {earned > 0 && <p className="hello-stars">Du hast schon <b>{earned} ★</b> gesammelt.</p>}
      </section>

      {lastTopic && (
        <button className="continue" style={tone(lastTopic.id)} onClick={() => onOpen(lastTopic.id)}>
          <span className="ticon" aria-hidden="true">{look(lastTopic.id).icon}</span>
          <span className="continue-t"><small>Weitermachen</small><b>{lastTopic.title}</b></span>
          <span className="continue-go" aria-hidden="true">▶</span>
        </button>
      )}

      <div className="filter" role="group" aria-label="Klasse auswählen">
        <span>Klasse</span>
        <button aria-pressed={klasse === null} onClick={() => setKlasse(null)}>Alle</button>
        {KLASSEN.map(k => <button key={k} aria-pressed={klasse === k} aria-label={`Klasse ${k}`} onClick={() => setKlasse(k)}>{k}</button>)}
      </div>

      <ul className="tiles">
        {list.map(t => {
          const l = look(t.id);
          return (
            <li key={t.id}>
              <button className="tile" style={tone(t.id)} onClick={() => onOpen(t.id)}>
                <span className="ticon" aria-hidden="true">{l.icon}</span>
                <span className="tile-t">
                  <b>{t.title}</b>
                  <small>{l.teaser}</small>
                </span>
                <span className="tile-f">
                  <span className="kl">Klasse {t.klasse}</span>
                  <Stars n={stars(stats[t.id])} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
