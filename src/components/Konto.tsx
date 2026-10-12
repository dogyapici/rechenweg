import { useState } from 'react';
import { cloudReady, login, type Account } from '../cloud';

const ROLE: Record<Account['role'], string> = { lehrer: 'Lehrer', schueler: 'Schüler', eltern: 'Eltern' };

interface Props {
  account: Account | null;
  sync: string;
  onBack: () => void;
  onLogout: () => void;
  onStudents: () => void;
}

/** Anmelden und Konto-Übersicht. Ohne Anmeldung bleibt der Fortschritt nur auf diesem Gerät. */
export function Konto({ account, sync, onBack, onLogout, onStudents }: Props) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const m = await login(name, pw).catch(x => String(x));
    setBusy(false);
    if (m) setErr(m);
  };

  return (
    <div className="konto">
      <div className="thead"><button className="back" onClick={onBack} aria-label="Zurück">←</button><span className="ticon" aria-hidden="true">👤</span><h1>{account ? 'Mein Konto' : 'Anmelden'}</h1></div>
      {!cloudReady && (
        <section className="card panel"><p>Konten sind auf diesem Server noch nicht eingerichtet. Die App funktioniert trotzdem, der Fortschritt bleibt dann auf diesem Gerät.</p></section>
      )}
      {cloudReady && !account && (
        <section className="card panel">
          <p>Melde dich mit dem Benutzernamen an, den du bekommen hast. Dann wird dein Fortschritt gespeichert, und du kannst auch auf einem anderen Gerät weitermachen.</p>
          <form className="kt-form" onSubmit={submit}>
            <label className="zt-l">Benutzername <small className="muted">(als Lehrer: E-Mail)</small>
              <input className="pf-in" value={name} onChange={e => setName(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
            </label>
            <label className="zt-l">Passwort
              <input className="pf-in" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" required />
            </label>
            {err && <p className="kt-err" role="alert">{err}</p>}
            <button className="btn big wide" disabled={busy || !name.trim() || !pw}>{busy ? 'Einen Moment …' : 'Anmelden'}</button>
          </form>
        </section>
      )}
      {account && (
        <section className="card panel">
          <p className="kt-who"><b>{account.name || account.username}</b>{account.username && <small> @{account.username}</small>}<span className="el-chip ok">{ROLE[account.role]}</span></p>
          {account.role === 'schueler' && <p className="kt-sync" role="status">{sync}</p>}
          {account.role !== 'schueler' && <button className="btn big wide" onClick={onStudents}>{account.role === 'lehrer' ? '👩‍🏫 Meine Schüler' : '👪 Fortschritt meines Kindes'}</button>}
          {!confirm
            ? <button className="btn quiet" onClick={() => setConfirm(true)}>Abmelden</button>
            : <div className="kt-confirm">
                <p>{account.role === 'schueler' ? 'Dein Fortschritt ist im Konto gespeichert. Auf diesem Gerät wird er nach dem Abmelden gelöscht.' : 'Wirklich abmelden?'}</p>
                <div className="kt-row"><button className="btn" onClick={onLogout}>Ja, abmelden</button><button className="btn quiet" onClick={() => setConfirm(false)}>Abbrechen</button></div>
              </div>}
        </section>
      )}
    </div>
  );
}
