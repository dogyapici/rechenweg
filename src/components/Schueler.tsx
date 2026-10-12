import { useCallback, useEffect, useState } from 'react';
import { manage, myStudents, pull, type Account, type CloudData, type StudentRow } from '../cloud';
import { emptyJournal } from '../journal';
import { Eltern } from './Eltern';

const WORDS = ['bruch', 'zahl', 'kreis', 'winkel', 'punkt', 'summe', 'prisma', 'gerade', 'würfel', 'faktor'];
/** Leicht zu tippen für Kinder: Wort und vier Ziffern. */
export const newPassword = () => `${WORDS[Math.floor(Math.random() * WORDS.length)].replace('ü', 'ue')}${1000 + Math.floor(Math.random() * 9000)}`;
/** Vorschlag für den Benutzernamen aus dem Vornamen. */
export const suggestUser = (name: string) =>
  name.trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 30);

const when = (iso: string) => { const d = new Date(iso); return `${d.getDate()}.${d.getMonth() + 1}. um ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

type Form = { kind: 'kind' } | { kind: 'eltern'; child: StudentRow } | { kind: 'passwort'; id: string; name: string } | { kind: 'reset'; id: string; name: string };
interface Done { title: string; user: string; password: string }

interface Props { me: Account; onBack: () => void }

/** Lehrer: Schüler und Eltern-Konten anlegen, Fortschritt ansehen. Eltern: Fortschritt der eigenen Kinder. */
export function Schueler({ me, onBack }: Props) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [open, setOpen] = useState<{ row: StudentRow; data: CloudData | null; loading: boolean } | null>(null);
  const teacher = me.role === 'lehrer';

  const load = useCallback(() => {
    setErr('');
    myStudents(me).then(setRows, e => setErr(`Die Liste konnte nicht geladen werden: ${e instanceof Error ? e.message : e}`));
  }, [me]);
  useEffect(load, [load]);

  const show = useCallback((row: StudentRow) => {
    setOpen(o => ({ row, data: o?.row.id === row.id ? o.data : null, loading: true }));
    pull(row.id).then(
      data => setOpen({ row, data, loading: false }),
      e => { setOpen({ row, data: null, loading: false }); setErr(`Fortschritt konnte nicht geladen werden: ${e instanceof Error ? e.message : e}`); },
    );
    window.scrollTo({ top: 0 });
  }, []);
  // Eltern mit nur einem Kind landen direkt beim Fortschritt.
  useEffect(() => { if (!teacher && rows?.length === 1 && !open) show(rows[0]); }, [teacher, rows, open, show]);

  if (open) {
    const d = open.data;
    const close = () => { setOpen(null); if (!teacher && rows?.length === 1) onBack(); };
    return (
      <>
        {err && <p className="kt-err" role="alert">{err}</p>}
        <Eltern
          key={open.row.id + (d?.at ?? 0)}
          data={{ profile: d?.profile ?? null, stats: d?.stats ?? {}, exams: d?.exams ?? {}, act: d?.act ?? {}, journal: d?.journal ?? emptyJournal() }}
          remote={{ name: open.row.name, updated: d ? new Date(d.at).toISOString() : null, onRefresh: () => show(open.row), loading: open.loading }}
          onBack={close}
        />
      </>
    );
  }

  return (
    <div className="schueler">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zurück">←</button><span className="ticon" aria-hidden="true">{teacher ? '👩‍🏫' : '👪'}</span><h1>{teacher ? 'Meine Schüler' : 'Meine Kinder'}</h1></div>
      {err && <p className="kt-err" role="alert">{err}</p>}
      {done && (
        <section className="card panel kt-done" role="status">
          <b>{done.title}</b>
          <p>Diese Anmeldedaten bitte aufschreiben und weitergeben. Das Passwort wird nicht noch einmal angezeigt.</p>
          <dl><dt>Benutzername</dt><dd><code>{done.user}</code></dd><dt>Passwort</dt><dd><code>{done.password}</code></dd></dl>
          <button className="btn quiet" onClick={() => setDone(null)}>Erledigt</button>
        </section>
      )}
      {!rows && !err && <p className="muted">Lädt …</p>}
      {rows && !rows.length && <section className="card panel"><p>{teacher ? 'Du hast noch keine Schüler angelegt.' : 'Mit diesem Konto ist noch kein Kind verbunden. Bitte beim Lehrer melden.'}</p></section>}
      {rows && rows.length > 0 && (
        <ul className="kt-list">
          {rows.map(r => (
            <li key={r.id} className="card kt-kid">
              <div className="kt-kid-h"><b>{r.name}</b>{r.username && <small className="muted">@{r.username}</small>}</div>
              <small className="muted">{r.updated ? `Zuletzt übertragen am ${when(r.updated)}` : 'Noch nichts übertragen'}</small>
              {teacher && r.parents.length > 0 && <small className="muted">Eltern-Konto: {r.parents.map(p => p.username ? `${p.name} (@${p.username})` : p.name).join(', ')}</small>}
              <div className="kt-row">
                <button className="btn" onClick={() => show(r)}>📊 Fortschritt ansehen</button>
                {teacher && <button className="btn quiet" onClick={() => { setDone(null); setForm({ kind: 'passwort', id: r.id, name: r.name }); }}>🔑 Passwort</button>}
                {teacher && <button className="btn quiet" onClick={() => { setDone(null); setForm({ kind: 'eltern', child: r }); }}>👪 Eltern-Konto</button>}
                {teacher && <button className="btn quiet" onClick={() => { setDone(null); setForm({ kind: 'reset', id: r.id, name: r.name }); }}>🧹 Zurücksetzen</button>}
              </div>
              {form?.kind === 'reset' && form.id === r.id && <ResetForm id={r.id} name={r.name} onCancel={() => setForm(null)} onDone={() => { setForm(null); load(); setErr(''); }} />}
              {form && (form.kind === 'eltern' || form.kind === 'passwort') && (form.kind === 'eltern' ? form.child.id : form.id) === r.id &&
                <AccountForm form={form} onCancel={() => setForm(null)} onDone={d => { setForm(null); setDone(d); load(); window.scrollTo({ top: 0 }); }} />}
            </li>
          ))}
        </ul>
      )}
      {teacher && (form?.kind === 'kind'
        ? <section className="card panel"><AccountForm form={form} onCancel={() => setForm(null)} onDone={d => { setForm(null); setDone(d); load(); window.scrollTo({ top: 0 }); }} /></section>
        : <button className="btn big wide" onClick={() => { setDone(null); setForm({ kind: 'kind' }); }}>➕ Schüler anlegen</button>)}
    </div>
  );
}

function AccountForm({ form, onCancel, onDone }: { form: Form; onCancel: () => void; onDone: (d: Done) => void }) {
  const [name, setName] = useState('');
  const [user, setUser] = useState('');
  const [touched, setTouched] = useState(false);
  const [pw, setPw] = useState(newPassword);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const pwOnly = form.kind === 'passwort';
  const userValue = touched ? user : form.kind === 'eltern' ? `${(form.child.username ?? suggestUser(form.child.name)).slice(0, 22)}.eltern` : suggestUser(name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body: Record<string, string> =
      form.kind === 'passwort' ? { action: 'passwort', id: form.id, password: pw }
      : form.kind === 'eltern' ? { role: 'eltern', childId: form.child.id, name: name.trim(), username: userValue, password: pw }
      : { name: name.trim(), username: userValue, password: pw };
    const r = await manage(body).catch(x => ({ error: String(x) }));
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onDone({
      title: form.kind === 'passwort' ? `Neues Passwort für ${form.name}` : form.kind === 'eltern' ? `Eltern-Konto für ${form.child.name} angelegt` : `${name.trim()} angelegt`,
      user: form.kind === 'passwort' ? '(wie bisher)' : userValue, password: pw,
    });
  };

  return (
    <form className="kt-form" onSubmit={submit}>
      <b>{form.kind === 'passwort' ? `Neues Passwort für ${form.name}` : form.kind === 'eltern' ? `Eltern-Konto für ${form.child.name}` : 'Neuer Schüler'}</b>
      {!pwOnly && <>
        <label className="zt-l">{form.kind === 'eltern' ? 'Name der Eltern' : 'Vorname des Kindes'}
          <input className="pf-in" value={name} onChange={e => setName(e.target.value)} placeholder={form.kind === 'eltern' ? 'z. B. Familie Yilmaz' : 'z. B. Mia'} required />
        </label>
        <label className="zt-l">Benutzername <small className="muted">(nur kleine Buchstaben, Zahlen, Punkt)</small>
          <input className="pf-in" value={userValue} onChange={e => { setTouched(true); setUser(e.target.value.toLowerCase()); }} autoCapitalize="none" spellCheck={false} required pattern="[a-z0-9][a-z0-9._\-]{2,29}" />
        </label>
      </>}
      <label className="zt-l">Passwort
        <span className="kt-pw"><input className="pf-in" value={pw} onChange={e => setPw(e.target.value)} minLength={6} maxLength={72} required spellCheck={false} autoComplete="new-password" /><button type="button" className="btn quiet" onClick={() => setPw(newPassword())} aria-label="Neues Passwort vorschlagen">🎲</button></span>
      </label>
      {err && <p className="kt-err" role="alert">{err}</p>}
      <div className="kt-row">
        <button className="btn" disabled={busy}>{busy ? 'Einen Moment …' : pwOnly ? 'Passwort setzen' : 'Konto anlegen'}</button>
        <button type="button" className="btn quiet" onClick={onCancel}>Abbrechen</button>
      </div>
    </form>
  );
}

/** Alles Geübte löschen, zum Beispiel nach einem Test. Profil und Lernplan bleiben. */
function ResetForm({ id, name, onCancel, onDone }: { id: string; name: string; onCancel: () => void; onDone: () => void }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    const r = await manage({ action: 'zuruecksetzen', id }).catch(x => ({ error: String(x) }));
    setBusy(false);
    if (r.error) setErr(r.error); else onDone();
  };
  return (
    <div className="kt-form" role="alertdialog" aria-label={`Fortschritt von ${name} zurücksetzen`}>
      <b>Fortschritt von {name} zurücksetzen?</b>
      <p className="muted">Alle Aufgaben, Stufen, Klassenarbeiten, Lerntage und Erfolge werden gelöscht. Profil und Lernplan bleiben. Das lässt sich nicht rückgängig machen. Auf dem Gerät des Kindes ist der Stand nach dem nächsten Speichern auch leer.</p>
      {err && <p className="kt-err" role="alert">{err}</p>}
      <div className="kt-row">
        <button className="btn danger" disabled={busy} onClick={go}>{busy ? 'Einen Moment …' : 'Ja, alles löschen'}</button>
        <button type="button" className="btn quiet" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}
