import { explain, type ExplainInput } from '../server/claude.js';
import { aiError, json, readJson, unauthorized } from '../server/http.js';

export async function POST(req: Request): Promise<Response> {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const body = await readJson<ExplainInput>(req);
  if (!body || typeof body.task !== 'string' || typeof body.steps !== 'string') return json({ error: 'Ungültige Anfrage.' }, 400);
  try {
    const text = await explain({ topic: String(body.topic ?? ''), task: body.task.slice(0, 2000), steps: body.steps.slice(0, 8000), wrong: body.wrong ? String(body.wrong).slice(0, 200) : null, diag: body.diag ? String(body.diag).slice(0, 500) : null });
    return json({ text });
  } catch (e) {
    return aiError(e);
  }
}
