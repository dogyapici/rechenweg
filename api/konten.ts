import { json, readJson } from '../server/http.js';
import { USERNAME_RE, caller, createAccount, notConfigured, profileOf, resetProgress, setPassword, supaConfig } from '../server/supa.js';

const UUID_RE = /^[0-9a-f-]{36}$/;
interface Body { action?: string; username?: string; password?: string; name?: string; role?: string; childId?: string; id?: string }

/** Nur Lehrer: Schüler- und Eltern-Konten anlegen, Passwörter neu setzen. */
export async function POST(req: Request): Promise<Response> {
  if (!supaConfig()) return notConfigured();
  const me = await caller(req);
  if (!me) return json({ error: 'Bitte melde dich an.' }, 401);
  if (me.role !== 'lehrer') return json({ error: 'Nur Lehrer dürfen Konten verwalten.' }, 403);
  const b = await readJson<Body>(req);
  if (!b) return json({ error: 'Ungültige Anfrage.' }, 400);

  if (b.action === 'zuruecksetzen') {
    if (typeof b.id !== 'string' || !UUID_RE.test(b.id)) return json({ error: 'Ungültige Anfrage.' }, 400);
    const p = await profileOf(b.id);
    if (!p || p.teacher_id !== me.id || p.role !== 'schueler') return json({ error: 'Dieses Konto gehört nicht zu dir.' }, 403);
    return resetProgress(b.id);
  }
  const pw = typeof b.password === 'string' ? b.password : '';
  if (pw.length < 6 || pw.length > 72) return json({ error: 'Das Passwort braucht mindestens 6 Zeichen.' }, 400);

  if (b.action === 'passwort') {
    if (typeof b.id !== 'string' || !UUID_RE.test(b.id)) return json({ error: 'Ungültige Anfrage.' }, 400);
    const p = await profileOf(b.id);
    if (!p || p.teacher_id !== me.id) return json({ error: 'Dieses Konto gehört nicht zu dir.' }, 403);
    return setPassword(b.id, pw);
  }

  const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
  if (!USERNAME_RE.test(username)) return json({ error: 'Der Benutzername braucht 3 bis 30 Zeichen: Kleinbuchstaben, Ziffern, Punkt oder Bindestrich.' }, 400);
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 40) : '';
  if (!name) return json({ error: 'Bitte gib einen Namen an.' }, 400);
  if (b.role === 'eltern') {
    if (typeof b.childId !== 'string' || !UUID_RE.test(b.childId)) return json({ error: 'Bitte wähle das Kind aus.' }, 400);
    const child = await profileOf(b.childId);
    if (!child || child.teacher_id !== me.id || child.role !== 'schueler') return json({ error: 'Dieses Kind gehört nicht zu dir.' }, 403);
    return createAccount({ username, password: pw, name, role: 'eltern', teacherId: me.id, childId: b.childId });
  }
  return createAccount({ username, password: pw, name, role: 'schueler', teacherId: me.id });
}
