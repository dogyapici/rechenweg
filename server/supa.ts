/* ===== Supabase auf dem Server: Konten anlegen und angemeldete Nutzer prüfen ===== */
import { supaKey, supaUrl } from '../src/supaUrl.js';
import { json } from './http.js';

export interface Caller { id: string; role: 'lehrer' | 'schueler' | 'eltern' }

/** Schüler melden sich mit Benutzernamen an. Intern ist das eine E-Mail unter dieser Domain. */
export const LOGIN_DOMAIN = 'schueler.rechenweg.app';
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const emailFor = (username: string) => `${username.toLowerCase()}@${LOGIN_DOMAIN}`;

export function supaConfig(): { url: string; key: string } | null {
  const url = supaUrl(process.env.SUPABASE_URL), key = supaKey(process.env.SUPABASE_SERVICE_KEY);
  return url && key ? { url, key } : null;
}
export const notConfigured = () => json({ error: 'Auf dem Server fehlt SUPABASE_URL oder SUPABASE_SERVICE_KEY. Die Konten sind noch nicht eingerichtet.' }, 501);
const admin = (key: string) => ({ apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' });

/** Wer schickt die Anfrage? Prüft das Anmelde-Token bei Supabase und liest die Rolle. */
export async function caller(req: Request): Promise<Caller | null> {
  const c = supaConfig();
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!c || !token) return null;
  const u = await fetch(`${c.url}/auth/v1/user`, { headers: { apikey: c.key, authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const user = (await u.json()) as { id?: string };
  if (!user.id) return null;
  const p = await fetch(`${c.url}/rest/v1/profiles?id=eq.${user.id}&select=role`, { headers: admin(c.key) });
  const rows = p.ok ? ((await p.json()) as { role: Caller['role'] }[]) : [];
  return rows[0] ? { id: user.id, role: rows[0].role } : null;
}

/** Legt ein Konto an. Rolle und Lehrer stehen in app_metadata, die kann nur der Server setzen. */
export async function createAccount(o: { username: string; password: string; name: string; role: 'schueler' | 'eltern'; teacherId: string; childId?: string }): Promise<Response> {
  const c = supaConfig(); if (!c) return notConfigured();
  const res = await fetch(`${c.url}/auth/v1/admin/users`, {
    method: 'POST', headers: admin(c.key),
    body: JSON.stringify({ email: emailFor(o.username), password: o.password, email_confirm: true,
      app_metadata: { role: o.role, name: o.name, username: o.username.toLowerCase(), teacher_id: o.teacherId, ...(o.childId ? { child_id: o.childId } : {}) } }),
  });
  if (res.ok) { const u = (await res.json()) as { id: string }; return json({ id: u.id }); }
  const err = await res.text().catch(() => '');
  if (res.status === 422 || /already/i.test(err)) return json({ error: 'Diesen Benutzernamen gibt es schon. Nimm bitte einen anderen.' }, 409);
  console.error('supabase create', res.status, err);
  return json({ error: 'Das Konto konnte nicht angelegt werden.' }, 502);
}

/** Lesen eines Profils mit dem Service-Schlüssel (für Rechteprüfungen). */
export async function profileOf(id: string): Promise<{ id: string; role: string; teacher_id: string | null } | null> {
  const c = supaConfig(); if (!c) return null;
  const p = await fetch(`${c.url}/rest/v1/profiles?id=eq.${id}&select=id,role,teacher_id`, { headers: admin(c.key) });
  const rows = p.ok ? ((await p.json()) as { id: string; role: string; teacher_id: string | null }[]) : [];
  return rows[0] ?? null;
}

export async function setPassword(id: string, password: string): Promise<Response> {
  const c = supaConfig(); if (!c) return notConfigured();
  const res = await fetch(`${c.url}/auth/v1/admin/users/${id}`, { method: 'PUT', headers: admin(c.key), body: JSON.stringify({ password }) });
  if (!res.ok) { console.error('supabase password', res.status, await res.text().catch(() => '')); return json({ error: 'Das Passwort konnte nicht geändert werden.' }, 502); }
  return json({ ok: true });
}

/**
 * Lernstand eines Schülers auf null setzen. Profil und Lernplan bleiben.
 * Es wird ein leerer, neuerer Stand geschrieben (nicht gelöscht), damit Geräte ihn beim nächsten Abgleich übernehmen.
 */
export async function resetProgress(id: string, now = Date.now()): Promise<Response> {
  const c = supaConfig(); if (!c) return notConfigured();
  const old = await fetch(`${c.url}/rest/v1/progress?user_id=eq.${id}&select=data`, { headers: admin(c.key) });
  const rows = old.ok ? ((await old.json()) as { data?: { profile?: unknown; plan?: unknown } }[]) : [];
  const keep = rows[0]?.data ?? {};
  const data = { v: 1, at: now, stats: {}, exams: {}, act: {}, unlocked: {}, journal: { tries: [], exams: [] }, plan: keep.plan ?? null, profile: keep.profile ?? null, seen: {} };
  const res = await fetch(`${c.url}/rest/v1/progress`, {
    method: 'POST', headers: { ...admin(c.key), prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: id, data, updated_at: new Date(now).toISOString() }),
  });
  if (!res.ok) { console.error('supabase reset', res.status, await res.text().catch(() => '')); return json({ error: 'Der Fortschritt konnte nicht zurückgesetzt werden.' }, 502); }
  return json({ ok: true });
}
