import { tutor, type TutorInput } from '../server/claude.js';
import { aiError, json, readJson, unauthorized } from '../server/http.js';

export async function POST(req: Request): Promise<Response> {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const body = await readJson<TutorInput>(req);
  if (!body || !Array.isArray(body.messages)) return json({ error: 'Ungültige Anfrage.' }, 400);
  const messages = body.messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length) return json({ error: 'Die Nachricht ist leer.' }, 400);
  const c = body.context;
  const context = c && typeof c.title === 'string' ? { title: c.title.slice(0, 1000), topic: String(c.topic ?? '').slice(0, 200), steps: String(c.steps ?? '').slice(0, 8000) } : null;
  try {
    return json(await tutor({ messages, context }));
  } catch (e) {
    return aiError(e);
  }
}
