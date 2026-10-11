import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../api/sync.js';

const CODE = 'abcdefgh23456789';
const req = (method: string, body?: unknown, q = '') => new Request(`http://x/api/sync${q}`, { method, headers: { 'x-access-code': 'geheim' }, body: body === undefined ? undefined : JSON.stringify(body) });

describe('Fern-Ansicht', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env.APP_ACCESS_CODE = 'geheim'; process.env.SUPABASE_URL = 'https://db.example/'; process.env.SUPABASE_SERVICE_KEY = 'k';
    vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('speichert den Stand per Upsert', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 201 }));
    const r = await POST(req('POST', { code: CODE, data: { v: 1 } }));
    expect(r.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://db.example/rest/v1/fortschritt?on_conflict=code');
    expect(init.headers.prefer).toContain('merge-duplicates');
    expect(JSON.parse(init.body)).toMatchObject({ code: CODE, data: { v: 1 } });
  });
  it('lädt den Stand und meldet fehlende Codes', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ data: { v: 1 }, updated_at: '2026-10-11T10:00:00Z' }]));
    const r = await GET(req('GET', undefined, `?code=${CODE}`));
    expect(await r.json()).toEqual({ data: { v: 1 }, updated: '2026-10-11T10:00:00Z' });
    fetchMock.mockResolvedValueOnce(Response.json([]));
    expect((await GET(req('GET', undefined, `?code=${CODE}`))).status).toBe(404);
  });
  it('lehnt ungültige Codes und fehlenden Zugang ab, ohne die Datenbank zu fragen', async () => {
    expect((await GET(req('GET', undefined, '?code=abc'))).status).toBe(400);
    expect((await POST(req('POST', { code: "x' or 1=1", data: {} }))).status).toBe(400);
    process.env.APP_ACCESS_CODE = 'anders';
    expect((await GET(req('GET', undefined, `?code=${CODE}`))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sagt klar, wenn Supabase noch nicht eingerichtet ist', async () => {
    delete process.env.SUPABASE_URL;
    const r = await GET(req('GET', undefined, `?code=${CODE}`));
    expect(r.status).toBe(501);
    expect((await r.json()).error).toContain('SUPABASE_URL');
  });
});
