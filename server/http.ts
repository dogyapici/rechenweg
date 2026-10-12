import { timingSafeEqual } from 'node:crypto';

/**
 * Nur wer den Zugangscode kennt, darf die KI nutzen (schützt den API-Schlüssel vor fremder Nutzung).
 * Angemeldete Nutzer brauchen keinen Code: Ihr Anmelde-Token wird bei Supabase geprüft.
 */
export async function unauthorized(req: Request): Promise<Response | null> {
  if (req.headers.get('authorization') && (await import('./supa.js').then(m => m.caller(req)))) return null;
  return codeDenied(req);
}

export function codeDenied(req: Request): Response | null {
  const expected = process.env.APP_ACCESS_CODE;
  if (!expected) return json({ error: 'Auf dem Server fehlt APP_ACCESS_CODE.' }, 500);
  const given = req.headers.get('x-access-code') ?? '';
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: 'Der Zugangscode stimmt nicht.' }, 401);
  return null;
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function readJson<T>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; } catch { return null; }
}

export function aiError(e: unknown): Response {
  console.error(e);
  const status = typeof e === 'object' && e && 'status' in e ? Number((e as { status: unknown }).status) : 0;
  if (status === 429) return json({ error: 'Gerade gab es zu viele Anfragen. Warte kurz und versuch es noch einmal.' }, 429);
  return json({ error: 'Die KI ist gerade nicht erreichbar. Der Rechenweg funktioniert trotzdem.' }, 502);
}
