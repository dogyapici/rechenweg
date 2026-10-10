import { loadCode } from './storage';

/** Aufrufe an die eigene Server-Funktion. Der API-Schlüssel liegt nur auf dem Server. */
export class AiError extends Error {
  constructor(message: string, readonly needsCode = false) { super(message); }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-access-code': loadCode() }, body: JSON.stringify(body) });
  } catch {
    throw new AiError('Keine Verbindung zum Server. Bist du online?');
  }
  const data = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (res.status === 504) throw new AiError('Die KI hat zu lange gebraucht. Versuch es bitte noch einmal.');
  if (!res.ok) throw new AiError(data?.error || `Die KI ist gerade nicht erreichbar (Fehler ${res.status}).`, res.status === 401);
  if (!data || typeof (data as { text?: unknown }).text !== 'string') throw new AiError(`Der Server hat keine lesbare Antwort geschickt (Status ${res.status}).`);
  return data;
}

export interface ExplainRequest { topic: string; task: string; steps: string; wrong?: string | null; diag?: string | null }
export const explain = (r: ExplainRequest) => post<{ text: string }>('/api/explain', r).then(d => d.text);

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface TutorContext { title: string; topic: string; steps: string }
export const askTutor = (messages: ChatTurn[], context: TutorContext | null) =>
  post<{ text: string; checks: string[] }>('/api/tutor', { messages, context });
