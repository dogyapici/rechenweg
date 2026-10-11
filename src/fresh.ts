/* ===== Keine Wiederholungen: Die App merkt sich die zuletzt gestellten Aufgaben pro Thema ===== */
import type { Task, Topic } from './topics';
import { makeTask } from './stages';

/** Gleiche Aufgabe: gleicher Text, gleiche Zeichnung, gleiche Lösung. */
export const taskKey = (t: Task) => t.prompt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '|' + (t.widget ? JSON.stringify(t.widget) : '') + '|' + t.answer.toString();
/** Namen und Fürwörter wechseln von Aufgabe zu Aufgabe, die Geschichte bleibt dieselbe. */
const NAMES = new Set(('Mia Ben Lena Tim Emre Sofia Noah Lea Jonas Aylin Paul Hanna Luca Elif Finn Ida Emma Zeynep Elias Lukas Mehmet Mila Ole Lina Emil Sara Leon Jakob ' +
  'Anna Max Yilmaz Müller Schneider Nowak Novak Weber Becker Berger Schmidt Huber Kaya Herr Frau ' +
  'er sie es ihm ihr sein seine seinem seinen seiner seines ihre ihrem ihren ihrer ihres Er Sie Es Sein Seine Ihr Ihre Bruder Schwester').split(' '));
/** Gleiche Geschichte mit anderen Zahlen oder Namen: Anfang des Textes ohne Zahlen, Namen und Fürwörter. */
export const storyKey = (t: Task) => (t.word ? 'w:' : 'r:') + t.prompt.replace(/<[^>]*>/g, ' ').replace(/[\d.,:|()−+\-]+/g, ' ')
  .split(/\s+/).filter(w => w && !NAMES.has(w.replace(/[’']s?$/, ''))).join(' ').slice(0, 50);

export interface SeenTopic { k: string[]; s: string[] }
export type Seen = Record<string, SeenTopic>;

/** So viele Aufgaben pro Thema kommen nicht noch einmal dran. */
export const KEEP_TASKS = 150;
/** Bei Textaufgaben: Die letzten Geschichten kommen erst später wieder. */
export const KEEP_STORIES = 4;

export function remember(seen: Seen, topic: string, t: Task): Seen {
  const o = seen[topic] ?? { k: [], s: [] };
  const k = taskKey(t), s = storyKey(t);
  return { ...seen, [topic]: { k: [...o.k.filter(x => x !== k), k].slice(-KEEP_TASKS), s: t.word ? [...o.s.filter(x => x !== s), s].slice(-KEEP_STORIES) : o.s } };
}

/**
 * Eine Aufgabe, die das Kind zuletzt nicht hatte. Erst wird auch eine andere Geschichte verlangt,
 * dann nur eine neue Aufgabe. Ist das Thema sehr klein, kommt notfalls eine bekannte Aufgabe.
 */
export function freshTask(topic: Topic, level: number, seen: Seen, avoid: Set<string> = new Set(), tries = 40, gen: (t: Topic, lv: number) => Task | null = makeTask): Task | null {
  const o = seen[topic.id] ?? { k: [], s: [] };
  const keys = new Set([...o.k, ...avoid]), stories = new Set(o.s);
  let fallback: Task | null = null, newOnly: Task | null = null;
  for (let i = 0; i < tries; i++) {
    const t = gen(topic, level);
    if (!t) continue;
    fallback ??= t;
    if (keys.has(taskKey(t))) continue;
    if (!t.word || !stories.has(storyKey(t))) return t;
    newOnly ??= t;
  }
  return newOnly ?? fallback;
}
