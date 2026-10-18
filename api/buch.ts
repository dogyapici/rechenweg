import { buch, type BuchInput } from '../server/claude.js';
import { aiError, json, readJson, unauthorized } from '../server/http.js';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request): Promise<Response> {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const body = await readJson<BuchInput>(req);
  const text = typeof body?.text === 'string' ? body.text.slice(0, 6000) : '';
  const welche = typeof body?.welche === 'string' ? body.welche.slice(0, 200) : '';
  const img = body?.image;
  const image = img && typeof img.data === 'string' && TYPES.includes(img.type) && img.data.length < 4_000_000 ? { data: img.data, type: img.type } : undefined;
  if (!text.trim() && !image) return json({ error: 'Schick bitte ein Foto von den Aufgaben oder tippe sie ab.' }, 400);
  try {
    return json(await buch({ text, image, welche }));
  } catch (e) {
    return aiError(e);
  }
}
