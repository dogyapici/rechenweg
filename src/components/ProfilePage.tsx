import { useState } from 'react';
import { CATALOG } from '../catalog';
import { LAENDER, MAX_COVERED, SCHULFORMEN, bandOf, curriculumFor, fitOf, gradeOf, longPrimary, type Profile, type Schulform } from '../profile';
import { look } from '../ui/look';

const KLASSEN = [5, 6, 7, 8, 9, 10];

/** Profil anlegen oder ändern. Daraus ergibt sich, welche Themen schon dran waren, jetzt dran sind oder später kommen. */
export function ProfilePage({ profile, onSave, onBack }: { profile: Profile | null; onSave: (p: Profile) => void; onBack: () => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [klasse, setKlasse] = useState(profile?.klasse ?? 0);
  const [land, setLand] = useState(profile?.land ?? '');
  const [form, setForm] = useState<Schulform | ''>(profile?.schulform ?? '');
  const forms = SCHULFORMEN.filter(f => f.id !== 'grund' || (longPrimary(land) && klasse <= 6));
  const formOk = forms.some(f => f.id === form);
  const draft: Profile | null = klasse && land && formOk ? { name: name.trim(), klasse, land, schulform: form as Schulform } : null;
  const cur = curriculumFor(draft);
  const missing = draft && cur ? cur.missing[bandOf(draft.klasse)] ?? [] : [];

  return (
    <div className="profile">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zurück">←</button><span className="ticon" aria-hidden="true">👤</span><h1>{profile ? 'Mein Profil' : 'Erzähl mir von dir'}</h1></div>
      <section className="card panel">
        <p>Damit ich weiß, was du schon hattest und was gerade in der Schule dran ist.</p>
        <label className="zt-l">Wie heißt du? <small className="muted">(wenn du willst)</small>
          <input className="pf-in" value={name} onChange={e => setName(e.target.value)} placeholder="Vorname" autoComplete="given-name" maxLength={30} />
        </label>
        <fieldset className="pf-set">
          <legend className="zt-l">In welche Klasse gehst du?</legend>
          <div className="pf-klassen">{KLASSEN.map(k => <button key={k} type="button" className={`pf-k${k === klasse ? ' on' : ''}`} aria-pressed={k === klasse} onClick={() => setKlasse(k)}>{k}</button>)}</div>
        </fieldset>
        <label className="zt-l">In welchem Bundesland?
          <select className="pf-in" value={land} onChange={e => setLand(e.target.value)}>
            <option value="" disabled>Bitte wählen</option>
            {LAENDER.map(l => <option key={l}>{l}</option>)}
          </select>
        </label>
        <fieldset className="pf-set">
          <legend className="zt-l">Auf welche Schule?</legend>
          <div className="pf-forms">
            {forms.map(f => (
              <label key={f.id} className={`pf-form${f.id === form ? ' on' : ''}`}>
                <input type="radio" name="schulform" checked={f.id === form} onChange={() => setForm(f.id)} />{f.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {draft && (
        <section className="card panel">
          <h2 className="h2">So sieht dein Lernpfad aus</h2>
          <ul className="pf-preview">
            {CATALOG.map(c => {
              const fit = fitOf(c.id, draft), g = gradeOf(c.id, draft);
              return (
                <li key={c.id}>
                  <span aria-hidden="true">{look(c.id).icon}</span><span className="ert-t">{c.title}</span>
                  <span className={`fit ${fit}`}>{fit === 'past' ? `Wiederholung (Kl. ${cur?.band[c.id] ?? g})` : fit === 'now' ? 'Jetzt dran' : `Kommt in Kl. ${cur?.band[c.id] ?? g}`}</span>
                </li>
              );
            })}
          </ul>
          {cur ? (
            <p className="ai-note">Eingeordnet nach dem <b>{cur.name}</b>. Der Plan legt den Stoff für zwei Klassen zusammen fest (z. B. 5/6), die genaue Reihenfolge bestimmt deine Schule. Was in deiner nächsten Arbeit drankommt, steht auf deinem Themenzettel.
              {' '}Quelle: {cur.sources.map((q, i) => <span key={q.url}>{i > 0 && ', '}<a href={q.url} target="_blank" rel="noreferrer">{q.label}</a></span>)}</p>
          ) : (
            <p className="ai-note">Was bis zu deiner Klasse dran ist, ist gleich offen. Spätere Themen schaltest du der Reihe nach frei. Die Klassen sind Richtwerte, für dein Bundesland habe ich den Lehrplan noch nicht genau eingelesen. Was in deiner nächsten Arbeit wirklich drankommt, steht auf deinem Themenzettel.</p>
          )}
          {missing.length > 0 && (
            <details className="solbox">
              <summary>Laut Lehrplan in Klasse {bandOf(draft.klasse)}, aber noch nicht in der App ({missing.length})</summary>
              <ul className="pf-missing">{missing.map(m => <li key={m}>{m}</li>)}</ul>
              <p className="ai-note">Diese Themen kommen nach und nach dazu. Bis dahin kannst du im Bereich „Fragen“ alles dazu fragen.</p>
            </details>
          )}
          {draft.klasse >= MAX_COVERED && <p className="hintbox">Für Klasse {draft.klasse} gibt es in der App bisher vor allem Wiederholung. Themen wie Terme, lineare Funktionen oder Geometrie kommen noch dazu.</p>}
        </section>
      )}

      <button className="btn big wide" disabled={!draft} onClick={() => draft && onSave(draft)}>{profile ? 'Speichern ✔' : 'Fertig 👉'}</button>
    </div>
  );
}
