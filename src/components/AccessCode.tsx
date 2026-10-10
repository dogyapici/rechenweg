import { useState } from 'react';
import { loadCode, saveCode } from '../storage';

/** Zugangscode für die KI-Funktionen. Wird einmal eingegeben und im Browser gemerkt. */
export function AccessCode({ onSaved }: { onSaved?: () => void }) {
  const [code, setCode] = useState(loadCode);
  return (
    <form className="settings" onSubmit={e => { e.preventDefault(); saveCode(code.trim()); onSaved?.(); }}>
      <label htmlFor="access-code" className="ai-note">Für die KI brauchst du einmal den Zugangscode, den du beim Einrichten festgelegt hast.</label>
      <div className="ansrow">
        <input id="access-code" type="password" autoComplete="current-password" value={code} onChange={e => setCode(e.target.value)} placeholder="Zugangscode" />
        <button className="btn" type="submit">Speichern</button>
      </div>
    </form>
  );
}
