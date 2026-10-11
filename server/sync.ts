/* ===== Fortschritt in Supabase: ein Datensatz pro Schüler-Code ===== */
import { json } from './http.js';

/** Schüler-Codes sind zufällig und lang, damit niemand fremde Codes erraten kann. */
export const CODE_RE = /^[a-z2-9]{16}$/;
/** Ein Bericht ist höchstens so groß (Lerntagebuch ist auf dem Gerät begrenzt). */
export const MAX_BYTES = 1_500_000;

function config(): { url: string; key: string } | Response {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, ''), key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return json({ error: 'Auf dem Server fehlt SUPABASE_URL oder SUPABASE_SERVICE_KEY. Die Fern-Ansicht ist noch nicht eingerichtet.' }, 501);
  return { url, key };
}
const headers = (key: string) => ({ apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' });

export async function saveProgress(code: string, data: unknown): Promise<Response> {
  const c = config(); if (c instanceof Response) return c;
  const res = await fetch(`${c.url}/rest/v1/fortschritt?on_conflict=code`, {
    method: 'POST',
    headers: { ...headers(c.key), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ code, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) { console.error('supabase save', res.status, await res.text().catch(() => '')); return json({ error: 'Speichern auf dem Server hat nicht geklappt.' }, 502); }
  return json({ ok: true });
}

export async function loadProgress(code: string): Promise<Response> {
  const c = config(); if (c instanceof Response) return c;
  const res = await fetch(`${c.url}/rest/v1/fortschritt?code=eq.${code}&select=data,updated_at`, { headers: headers(c.key) });
  if (!res.ok) { console.error('supabase load', res.status, await res.text().catch(() => '')); return json({ error: 'Laden vom Server hat nicht geklappt.' }, 502); }
  const rows = (await res.json()) as { data: unknown; updated_at: string }[];
  if (!rows.length) return json({ error: 'Zu diesem Schüler-Code gibt es noch keinen Fortschritt. Ist die Übertragung auf dem Gerät des Schülers eingeschaltet?' }, 404);
  return json({ data: rows[0].data, updated: rows[0].updated_at });
}
