import Anthropic from '@anthropic-ai/sdk';
import { MathError, htmlToText, solHTML, solveAny } from '../src/engine/index.js';
import { CATALOG, CATALOG_IDS, type ZettelResult } from '../src/catalog.js';

/**
 * KI-Schicht. Die KI rechnet nie selbst: Erklärungen bekommen den fertigen Rechenweg der Engine,
 * der Tutor bekommt das Werkzeug `rechnen`, das die Engine aufruft.
 */
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const client = new Anthropic(); // liest ANTHROPIC_API_KEY

type Msg = Anthropic.Beta.BetaMessageParam;

async function ask(params: { system: string; messages: Msg[]; tools?: Anthropic.Beta.BetaTool[]; schema?: Record<string, unknown> }) {
  return client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: params.system,
    messages: params.messages,
    tools: params.tools,
    output_config: { effort: 'low', ...(params.schema ? { format: { type: 'json_schema' as const, schema: params.schema } } : {}) },
    // Lehnt ein Sicherheitsfilter fälschlich ab, springt automatisch ein anderes Modell ein.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
}
const textOf = (content: Anthropic.Beta.BetaContentBlock[]) =>
  content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('\n').trim();

const STYLE = `Du bist „Rechenweg“, ein geduldiger, freundlicher Mathe-Nachhilfe-Tutor in einer Lern-App für Schülerinnen und Schüler ab Klasse 5 in Deutschland.
Sprich Deutsch, in der Du-Form, mit kurzen Sätzen und einfachen Wörtern. Erkläre so, als ob der Schüler bei null anfängt, und erkläre Fachwörter kurz. Ein Vergleich aus dem Alltag (Pizza, Geld, Waage) hilft oft.
Schreibe Brüche als 3/4 und Malzeichen als ·. Keine Überschriften. Höchstens 160 Wörter.`;

export interface ExplainInput { topic: string; task: string; steps: string; wrong?: string | null; diag?: string | null }

export async function explain(inp: ExplainInput): Promise<string> {
  const system = `${STYLE}
Du erklärst einen fertigen Rechenweg, den eine exakte Rechen-Engine berechnet hat. Er ist garantiert richtig.
Benutze nur Zahlen und Ergebnisse, die im Rechenweg oder in der Aufgabe stehen. Rechne nichts Neues aus und erfinde keine eigenen Rechenbeispiele.
Ende mit einer kurzen Frage, mit der der Schüler prüfen kann, ob er es verstanden hat (ohne die Lösung zu verraten).`;
  const user = `Thema: ${inp.topic}
Aufgabe: ${inp.task}

Rechenweg der Engine (markierte Teile stehen in [eckigen Klammern]):
${inp.steps}
${inp.wrong ? `\nDie Antwort des Schülers war „${inp.wrong}“. Das ist falsch.${inp.diag ? ' Hinweis der App: ' + inp.diag : ''} Erkläre freundlich, wo der Fehler vermutlich liegt.` : ''}

Erkläre diesen Rechenweg einfach und verständlich.`;
  const res = await ask({ system, messages: [{ role: 'user', content: user }] });
  if (res.stop_reason === 'refusal') return 'Dazu kann ich leider nichts sagen. Der Rechenweg oben ist trotzdem vollständig.';
  return textOf(res.content);
}

const RECHNEN: Anthropic.Beta.BetaTool = {
  name: 'rechnen',
  description: 'Rechnet einen Term exakt aus oder löst eine lineare Gleichung mit der Recheneinheit der App. Gibt Ergebnis und Rechenweg zurück. Eingabe zum Beispiel "3/4 + 1/6", "2,5 · 1,4", "(3 + 4) · 2" oder "3x + 5 = 20". Benutze es für JEDE Rechnung, bevor du ein Ergebnis nennst.',
  input_schema: {
    type: 'object',
    properties: { aufgabe: { type: 'string', description: 'Term oder Gleichung; Brüche als 3/4, Dezimalzahlen mit Komma' } },
    required: ['aufgabe'],
  },
};

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface TutorInput { messages: ChatTurn[]; context?: { title: string; topic: string; steps: string } | null }
export interface TutorOutput { text: string; checks: string[] }

export async function tutor(inp: TutorInput): Promise<TutorOutput> {
  let system = `${STYLE}
WICHTIG: Rechne nie selbst im Kopf. Jedes Ergebnis und jede Rechnung, die du nennst, prüfst du vorher mit dem Werkzeug „rechnen“. Nenne nur Zahlen, die das Werkzeug geliefert hat oder die in der Frage stehen.
Wenn jemand nur die Lösung seiner Hausaufgabe will, erkläre zuerst den Weg und lass ihn den ersten Schritt selbst versuchen. Bleib beim Thema Mathe.`;
  if (inp.context) system += `\n\nDer Schüler fragt zu dieser Aufgabe aus der App (Thema: ${inp.context.topic}): ${inp.context.title}\nRechenweg der Engine (garantiert richtig):\n${inp.context.steps}`;

  const messages: Msg[] = inp.messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
  if (!messages.length || messages[0].role !== 'user') messages.unshift({ role: 'user', content: 'Hallo' });
  const checks: string[] = [];

  for (let round = 0; round < 6; round++) {
    const res = await ask({ system, messages, tools: [RECHNEN] });
    if (res.stop_reason === 'refusal') return { text: 'Dazu kann ich leider nichts sagen. Frag mich gern etwas anderes zu Mathe.', checks };
    if (res.stop_reason !== 'tool_use') return { text: textOf(res.content), checks };

    messages.push({ role: 'assistant', content: res.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue;
      const aufgabe = String((block.input as { aufgabe?: unknown })?.aufgabe ?? '');
      try {
        const sol = solveAny(aufgabe);
        const ergebnis = htmlToText(sol.resultHTML);
        checks.push(`${aufgabe.trim()} ${sol.kind === 'eq' ? '→' : '='} ${ergebnis}`);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify({ ergebnis, rechenweg: htmlToText(solHTML(sol)).slice(0, 3000) }) });
      } catch (e) {
        const msg = e instanceof MathError ? e.message : 'Diese Eingabe kann die Recheneinheit nicht lesen.';
        results.push({ type: 'tool_result', tool_use_id: block.id, content: msg, is_error: true });
      }
    }
    messages.push({ role: 'user', content: results });
  }
  return { text: 'Das war gerade zu viel auf einmal. Stell mir die Frage bitte in kleineren Schritten.', checks };
}

export interface ZettelInput { text?: string; image?: { data: string; type: string } }

const ZETTEL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titel', 'datum', 'punkte'],
  properties: {
    titel: { type: 'string', description: 'Überschrift des Zettels, z. B. „2. Klassenarbeit“; leer, wenn keine da ist' },
    datum: { type: 'string', description: 'Datum der Klassenarbeit als JJJJ-MM-TT, leer, wenn keins dasteht' },
    punkte: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['text', 'thema'],
        properties: { text: { type: 'string' }, thema: { type: 'string', enum: [...CATALOG_IDS, 'keins'] } },
      },
    },
  },
};

/** Liest einen Themenzettel (Text oder Foto) und ordnet jeden Punkt einem App-Thema zu. Rechnet nichts. */
export async function zettel(inp: ZettelInput, today = new Date().toISOString().slice(0, 10)): Promise<ZettelResult> {
  const list = CATALOG.map(c => `- ${c.id}: ${c.title} (${c.covers})`).join('\n');
  const system = `Du hilfst einer Mathe-Lern-App für Schüler ab Klasse 5. Ein Schüler zeigt dir seinen Themenzettel für die nächste Mathe-Klassenarbeit.
Schreibe jeden Punkt vom Zettel einzeln und kurz ab (so wie er dasteht, ohne Aufzählungszeichen). Ordne ihn dem passenden Thema der App zu oder „keins“, wenn keins passt. Rate nicht: Geometrie, Größen, Diagramme, Zahlenstrahl, Teilbarkeit ohne Brüche usw. sind „keins“.
Heute ist ${today}. Steht ein Datum ohne Jahr da, nimm das nächste passende Datum ab heute.
Themen der App:
${list}`;
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (inp.image) content.push({ type: 'image', source: { type: 'base64', media_type: inp.image.type as 'image/jpeg', data: inp.image.data } });
  content.push({ type: 'text', text: inp.text?.trim() ? `Der Zettel:\n${inp.text}` : 'Das Foto zeigt den Zettel.' });
  const res = await ask({ system, messages: [{ role: 'user', content }], schema: ZETTEL_SCHEMA });
  if (res.stop_reason === 'refusal') throw new Error('refusal');
  const raw = JSON.parse(textOf(res.content)) as { titel?: unknown; datum?: unknown; punkte?: unknown };
  const points = (Array.isArray(raw.punkte) ? raw.punkte : [])
    .map(p => ({ text: String((p as { text?: unknown })?.text ?? '').trim().slice(0, 200), topic: String((p as { thema?: unknown })?.thema ?? '') }))
    .filter(p => p.text)
    .slice(0, 40)
    .map(p => ({ text: p.text, topic: CATALOG_IDS.includes(p.topic) ? p.topic : null }));
  const date = typeof raw.datum === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.datum) ? raw.datum : null;
  return { title: typeof raw.titel === 'string' ? raw.titel.slice(0, 80) : '', date, points };
}
