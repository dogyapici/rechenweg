import { zettel, type ZettelInput } from '../server/claude.js';
import { aiError, json, readJson, unauthorized } from '../server/http.js';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request): Promise<Response> {
  const denied = unauthorized(req);
  if (denied) return denied;
  const body = await readJson<ZettelInput>(req);
  const text = typeof body?.text === 'string' ? body.text.slice(0, 4000) : '';
  const img = body?.image;
  const image = img && typeof img.data === 'string' && TYPES.includes(img.type) && img.data.length < 4_000_000 ? { data: img.data, type: img.type } : undefined;
  if (!text.trim() && !image) return json({ error: 'Schick bitte den Text oder ein Foto vom Zettel.' }, 400);
  try {
    const r = await zettel({ text, image });
    return json({ text: 'ok', ...r });
  } catch (e) {
    return aiError(e);
  }
}
