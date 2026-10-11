/* ===== Klassenarbeit: gemischte Aufgaben aus den Themen eines Kapitels ===== */
import { MathError, parseAnswer } from './engine/index.js';
import { makeTask } from './stages';
import { TOPICS, type Task } from './topics';
import { formIssue } from './gen';

export interface ExamTask { topic: string; task: Task }

const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Gleiche Geschichte mit anderen Zahlen zählt als Wiederholung. */
const storyKey = (t: Task) => (t.word ? 'w:' : 'r:') + t.prompt.replace(/<[^>]*>/g, '').replace(/[\d.,]+/g, '#');

/**
 * Wie eine echte Klassenarbeit: von leicht nach schwer, jedes Thema kommt vor,
 * zum Schluss Textaufgaben. 8 Aufgaben pro Kapitel, in der Abschlussprüfung eine pro Thema (mindestens 12).
 */
export function buildExam(topicIds: string[], count = topicIds.length > 4 ? Math.max(12, topicIds.length) : 8): ExamTask[] {
  const levels = Array.from({ length: count }, (_, i) => (i < count * 0.3 ? 2 : i < count * 0.6 ? 3 : i < count * 0.85 ? 4 : 5));
  const order = shuffle(topicIds);
  const out: ExamTask[] = [];
  const seen = new Set<string>();
  levels.forEach((lv, i) => {
    const t = TOPICS.find(x => x.id === order[i % order.length])!;
    let task: Task | null = null;
    for (let k = 0; k < 30; k++) {
      const c = makeTask(t, lv);
      if (!c) continue;
      task = c;
      if (!seen.has(storyKey(c))) break;
    }
    if (task) { seen.add(storyKey(task)); out.push({ topic: t.id, task }); }
  });
  return out;
}

export type Mark = { points: number; state: 'right' | 'half' | 'wrong' | 'empty' };
/** Bewertung: richtig = 1 Punkt, richtig aber nicht gekürzt = ½ Punkt. */
export function mark(task: Task, input: string): Mark {
  if (!input.trim()) return { points: 0, state: 'empty' };
  try {
    const a = parseAnswer(input);
    if (!task.answer.eq(a.v)) return { points: 0, state: 'wrong' };
    if ((task.needReduced && a.raw && !a.v.isRed()) || formIssue(task, input)) return { points: 0.5, state: 'half' };
    return { points: 1, state: 'right' };
  } catch (e) {
    if (e instanceof MathError) return { points: 0, state: 'wrong' };
    throw e;
  }
}
