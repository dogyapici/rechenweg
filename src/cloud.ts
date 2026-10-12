/* ===== Konten und Synchronisation über Supabase ===== */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Exams } from './curriculum';
import type { Seen } from './fresh';
import type { Journal } from './journal';
import type { Plan } from './plan';
import type { Profile } from './profile';
import type { Activity, Unlocked } from './progress';
import type { Stats } from './storage';

export type Role = 'lehrer' | 'schueler' | 'eltern';
export interface Account { id: string; role: Role; name: string; username: string | null }

/** Der ganze Lernstand eines Schülers, so wie er in der Tabelle `progress` liegt. */
export interface CloudData {
  v: 1;
  /** Zeitpunkt der letzten Änderung auf dem Gerät (ms) */
  at: number;
  stats: Stats; exams: Exams; act: Activity; unlocked: Unlocked; journal: Journal;
  plan: Plan | null; profile: Profile | null; seen: Seen;
}
/** Was dieses Gerät über den Abgleich weiß. */
export interface SyncMeta { user: string | null; at: number; pushed: number }

export const LOGIN_DOMAIN = 'schueler.rechenweg.app';
/** Kinder melden sich mit Benutzernamen an, Erwachsene auch mit E-Mail. */
export const loginEmail = (name: string) => (name.includes('@') ? name.trim() : `${name.trim().toLowerCase()}@${LOGIN_DOMAIN}`);

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
/** Ohne Supabase-Einstellungen läuft die App wie bisher nur auf dem Gerät. */
export const cloudReady = !!(URL_ && KEY);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!cloudReady) throw new Error('Supabase ist nicht eingerichtet.');
  return (client ??= createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true } }));
}

/** Aktuelles Anmelde-Token, damit auch die KI-Funktionen ohne Zugangscode gehen. */
let token: string | null = null;
export const authToken = () => token;

export async function currentAccount(): Promise<Account | null> {
  if (!cloudReady) return null;
  const { data } = await sb().auth.getSession();
  token = data.session?.access_token ?? null;
  const user = data.session?.user;
  if (!user) return null;
  const { data: p } = await sb().from('profiles').select('id, role, name, username').eq('id', user.id).maybeSingle();
  return p ? (p as Account) : { id: user.id, role: 'schueler', name: '', username: null };
}
export function onAuthChange(cb: () => void): () => void {
  if (!cloudReady) return () => {};
  const { data } = sb().auth.onAuthStateChange((_e, s) => { token = s?.access_token ?? null; cb(); });
  return () => data.subscription.unsubscribe();
}

export async function login(name: string, password: string): Promise<string | null> {
  const { error } = await sb().auth.signInWithPassword({ email: loginEmail(name), password });
  if (!error) return null;
  return /invalid/i.test(error.message) ? 'Benutzername oder Passwort stimmt nicht.' : `Anmelden hat nicht geklappt: ${error.message}`;
}
export async function logout() { await sb().auth.signOut(); token = null; }

export async function pull(userId: string): Promise<CloudData | null> {
  const { data, error } = await sb().from('progress').select('data').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.data as CloudData | undefined) ?? null;
}
export async function push(userId: string, d: CloudData): Promise<void> {
  const { error } = await sb().from('progress').upsert({ user_id: userId, data: d, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/**
 * Was beim Anmelden passiert:
 * - `load`: Der Stand vom Server ersetzt den auf dem Gerät (anderes Kind vorher, oder der Server ist neuer).
 * - `push`: Das Gerät ist neuer, es schickt seinen Stand.
 * - `none`: Beide sind gleich.
 */
export function decide(meta: SyncMeta, user: string, server: CloudData | null, localHasData: boolean): 'load' | 'push' | 'none' {
  if (!server) return localHasData && (meta.user === null || meta.user === user) ? 'push' : 'none';
  if (meta.user !== user) return 'load';
  if (server.at > meta.at) return 'load';
  return meta.at > meta.pushed || meta.at > server.at ? 'push' : 'none';
}

/* ===== Für Lehrer und Eltern ===== */
export interface StudentRow { id: string; name: string; username: string | null; role: Role; updated: string | null; parents: { id: string; name: string; username: string | null }[] }

/** Schüler, die man sehen darf: als Lehrer alle eigenen, als Eltern die eigenen Kinder. */
export async function myStudents(me: Account): Promise<StudentRow[]> {
  const q = sb().from('profiles').select('id, name, username, role, teacher_id');
  const { data: profs, error } = me.role === 'lehrer' ? await q.eq('teacher_id', me.id) : await q.neq('id', me.id);
  if (error) throw new Error(error.message);
  const all = (profs ?? []) as (Account & { teacher_id: string | null })[];
  const kids = all.filter(p => p.role === 'schueler');
  const { data: prog } = await sb().from('progress').select('user_id, updated_at').in('user_id', kids.map(k => k.id));
  const { data: links } = await sb().from('parent_links').select('parent_id, student_id');
  const upd = new Map((prog ?? []).map(r => [r.user_id as string, r.updated_at as string]));
  return kids.map(k => ({
    id: k.id, name: k.name, username: k.username, role: k.role, updated: upd.get(k.id) ?? null,
    parents: (links ?? []).filter(l => l.student_id === k.id).map(l => all.find(p => p.id === l.parent_id)).filter(Boolean).map(p => ({ id: p!.id, name: p!.name, username: p!.username })),
  })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Kontoverwaltung läuft über den Server, weil nur er den Admin-Schlüssel hat. */
export async function manage(body: Record<string, string>): Promise<{ error?: string; id?: string }> {
  const res = await fetch('/api/konten', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token ?? ''}` }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
  return res.ok ? data : { error: data.error ?? `Fehler ${res.status}` };
}
