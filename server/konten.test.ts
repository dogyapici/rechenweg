import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../api/konten.js';
import { unauthorized } from './http.js';

const T = '11111111-1111-1111-1111-111111111111', S = '22222222-2222-2222-2222-222222222222';
const req = (body: unknown, token = 'tok') => new Request('http://x/api/konten', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });

/** Simuliert Supabase: Token → Nutzer, Profile, Admin-API. */
function supabase(role: string, profiles: Record<string, { role: string; teacher_id: string | null }> = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return (init?.headers as Record<string, string>).authorization === 'Bearer tok' ? Response.json({ id: T }) : new Response('', { status: 401 });
    const m = url.match(/profiles\?id=eq\.([^&]+)/);
    if (m) return Response.json(m[1] === T ? [{ id: T, role, teacher_id: null }] : profiles[m[1]] ? [{ id: m[1], ...profiles[m[1]] }] : []);
    if (url.endsWith('/auth/v1/admin/users')) return Response.json({ id: S });
    if (url.includes('/auth/v1/admin/users/')) return Response.json({});
    if (url.includes('/rest/v1/progress?')) return Response.json([{ data: { profile: { name: 'Mia' }, plan: null, stats: { bradd: {} } } }]);
    if (url.endsWith('/rest/v1/progress')) return new Response('', { status: 201 });
    return new Response('', { status: 404 });
  });
}

describe('Konten', () => {
  beforeEach(() => { process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SERVICE_KEY = 'k'; process.env.APP_ACCESS_CODE = 'geheim'; });
  afterEach(() => vi.unstubAllGlobals());

  it('Lehrer legt ein Schülerkonto mit Benutzernamen an, Rolle steht in app_metadata', async () => {
    const f = supabase('lehrer'); vi.stubGlobal('fetch', f);
    const r = await POST(req({ username: 'Mia.K', password: 'geheim1', name: 'Mia' }));
    expect(r.status).toBe(200);
    const call = f.mock.calls.find(c => String(c[0]).endsWith('/auth/v1/admin/users'))!;
    const body = JSON.parse(String(call[1]!.body));
    expect(body).toMatchObject({ email: 'mia.k@schueler.rechenweg.app', email_confirm: true, app_metadata: { role: 'schueler', teacher_id: T, username: 'mia.k' } });
  });
  it('Schüler und Fremde dürfen keine Konten anlegen', async () => {
    vi.stubGlobal('fetch', supabase('schueler'));
    expect((await POST(req({ username: 'abc', password: 'geheim1', name: 'X' }))).status).toBe(403);
    expect((await POST(req({ username: 'abc', password: 'geheim1', name: 'X' }, 'falsch'))).status).toBe(401);
  });
  it('Eltern-Konto nur für eigene Schüler, Passwort nur für eigene Konten', async () => {
    vi.stubGlobal('fetch', supabase('lehrer', { [S]: { role: 'schueler', teacher_id: 'someone-else' } }));
    expect((await POST(req({ role: 'eltern', username: 'mama.k', password: 'geheim1', name: 'Mama', childId: S }))).status).toBe(403);
    expect((await POST(req({ action: 'passwort', id: S, password: 'neues12' }))).status).toBe(403);
    vi.stubGlobal('fetch', supabase('lehrer', { [S]: { role: 'schueler', teacher_id: T } }));
    expect((await POST(req({ role: 'eltern', username: 'mama.k', password: 'geheim1', name: 'Mama', childId: S }))).status).toBe(200);
    expect((await POST(req({ action: 'passwort', id: S, password: 'neues12' }))).status).toBe(200);
  });
  it('prüft Benutzername und Passwort', async () => {
    vi.stubGlobal('fetch', supabase('lehrer'));
    expect((await POST(req({ username: 'a b', password: 'geheim1', name: 'X' }))).status).toBe(400);
    expect((await POST(req({ username: 'abc', password: '123', name: 'X' }))).status).toBe(400);
  });
  it('angemeldete Nutzer dürfen die KI ohne Zugangscode nutzen', async () => {
    vi.stubGlobal('fetch', supabase('schueler'));
    expect(await unauthorized(new Request('http://x', { headers: { authorization: 'Bearer tok' } }))).toBeNull();
    expect((await unauthorized(new Request('http://x', { headers: { authorization: 'Bearer falsch' } })))?.status).toBe(401);
  });
  it('setzt den Fortschritt eines eigenen Schülers zurück, Profil bleibt', async () => {
    const f = supabase('lehrer', { [S]: { role: 'schueler', teacher_id: T } }); vi.stubGlobal('fetch', f);
    expect((await POST(req({ action: 'zuruecksetzen', id: S }))).status).toBe(200);
    const call = f.mock.calls.find(c => String(c[0]).endsWith('/rest/v1/progress'))!;
    const body = JSON.parse(String(call[1]!.body));
    expect(body.user_id).toBe(S);
    expect(body.data).toMatchObject({ stats: {}, journal: { tries: [] }, profile: { name: 'Mia' } });
    expect(body.data.at).toBeGreaterThan(0);
    vi.stubGlobal('fetch', supabase('lehrer', { [S]: { role: 'schueler', teacher_id: 'someone-else' } }));
    expect((await POST(req({ action: 'zuruecksetzen', id: S }))).status).toBe(403);
  });
});
