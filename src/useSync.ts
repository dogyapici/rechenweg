import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudReady, currentAccount, decide, logout, onAuthChange, pull, push, type Account } from './cloud';
import { applyData, clearLocal, hasLocalData, localData, loadSyncMeta, saveSyncMeta } from './storage';

const DELAY = 4000;
const time = (t: number) => { const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

/**
 * Anmeldung und Abgleich: Ein angemeldeter Schüler schickt seinen Lernstand ein paar Sekunden
 * nach jeder Änderung ins Konto. Lehrer und Eltern lesen ihn dort.
 * `changed` muss sich bei jeder Änderung am Lernstand ändern.
 */
export function useSync(changed: unknown) {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState('');
  const ready = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const refresh = useCallback(() => { currentAccount().then(setAccount, () => setAccount(null)); }, []);
  useEffect(() => { if (!cloudReady) return; refresh(); return onAuthChange(refresh); }, [refresh]);

  /** true, wenn nichts mehr auf dem Gerät wartet. */
  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timer.current);
    const user = ready.current;
    if (!user) return false;
    const meta = loadSyncMeta();
    if (meta.user !== user || meta.at <= meta.pushed) return true;
    setStatus('Wird gespeichert …');
    try {
      // Wurde der Stand inzwischen woanders geändert (zum Beispiel vom Lehrer zurückgesetzt), gilt der vom Konto.
      const server = await pull(user);
      if (server && meta.pushed && server.at > meta.pushed) {
        applyData(server);
        saveSyncMeta({ user, at: server.at, pushed: server.at });
        location.reload();
        return true;
      }
      await push(user, { v: 1, at: meta.at, ...localData() });
      saveSyncMeta({ ...loadSyncMeta(), pushed: meta.at });
      setStatus(`Im Konto gespeichert um ${time(Date.now())}.`);
      return true;
    } catch {
      setStatus('Gerade keine Verbindung. Dein Fortschritt wird gespeichert, sobald du wieder online bist.');
      return false;
    }
  }, []);

  // Beim Anmelden: Stand vom Server holen oder den eigenen hochladen.
  useEffect(() => {
    if (account?.role !== 'schueler' || ready.current === account.id) return;
    const user = account.id;
    let stop = false;
    setStatus('Fortschritt wird abgeglichen …');
    pull(user).then(server => {
      if (stop) return;
      const meta = loadSyncMeta();
      const what = decide(meta, user, server, hasLocalData());
      if (what === 'load' && server) {
        applyData(server);
        saveSyncMeta({ user, at: server.at, pushed: server.at });
        location.reload();
        return;
      }
      const at = meta.user === user && meta.at ? meta.at : Date.now();
      saveSyncMeta({ user, at, pushed: what === 'push' ? Math.min(meta.pushed, at - 1) : at });
      ready.current = user;
      if (what === 'push') void flush(); else setStatus('Dein Fortschritt ist im Konto gespeichert.');
    }, () => { if (!stop) setStatus('Gerade keine Verbindung zum Konto. Es wird später abgeglichen.'); });
    return () => { stop = true; };
  }, [account, flush]);

  // Jede Änderung merken und kurz danach hochladen.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!ready.current) return;
    saveSyncMeta({ ...loadSyncMeta(), at: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), DELAY);
  }, [changed, flush]);

  // Beim Schließen oder Wechseln der App sofort speichern, nach Verbindungsabbruch nachholen.
  useEffect(() => {
    const now = () => { if (document.visibilityState === 'hidden') void flush(); };
    const online = () => void flush();
    document.addEventListener('visibilitychange', now);
    window.addEventListener('online', online);
    return () => { document.removeEventListener('visibilitychange', now); window.removeEventListener('online', online); };
  }, [flush]);

  /** Schüler: erst speichern, dann den Lernstand von diesem Gerät löschen. */
  const signOut = useCallback(async (): Promise<boolean> => {
    const kid = account?.role === 'schueler';
    // Ohne Verbindung nicht abmelden, sonst wäre der neueste Stand weg.
    if (kid && ready.current && !(await flush())) return false;
    await logout().catch(() => {});
    ready.current = null;
    if (kid) { clearLocal(); saveSyncMeta({ user: null, at: 0, pushed: 0 }); location.reload(); }
    else setAccount(null);
    return true;
  }, [account, flush]);

  return { account, status, signOut };
}
