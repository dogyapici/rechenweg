import { json, unauthorized } from '../server/http.js';
import { CODE_RE, MAX_BYTES, loadProgress, saveProgress } from '../server/sync.js';

/** Das Gerät des Schülers schickt seinen Stand. */
export async function POST(req: Request): Promise<Response> {
  const denied = unauthorized(req);
  if (denied) return denied;
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return json({ error: 'Der Bericht ist zu groß.' }, 413);
  let body: { code?: unknown; data?: unknown };
  try { body = JSON.parse(raw); } catch { return json({ error: 'Ungültige Anfrage.' }, 400); }
  if (typeof body.code !== 'string' || !CODE_RE.test(body.code) || typeof body.data !== 'object' || !body.data) return json({ error: 'Ungültige Anfrage.' }, 400);
  return saveProgress(body.code, body.data);
}

/** Eltern oder Nachhilfe holen den Stand zu einem Schüler-Code. */
export async function GET(req: Request): Promise<Response> {
  const denied = unauthorized(req);
  if (denied) return denied;
  const code = new URL(req.url).searchParams.get('code') ?? '';
  if (!CODE_RE.test(code)) return json({ error: 'Der Schüler-Code ist ungültig.' }, 400);
  return loadProgress(code);
}
