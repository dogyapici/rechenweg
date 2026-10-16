/* ===== Gemischt üben: Aufgaben aus mehreren Themen durcheinander, zum Wiederholen vor der Klassenarbeit ===== */
import { freshTask, type Seen } from './fresh';
import { MAX_LEVEL } from './stages';
import type { Stats } from './storage';
import { TOPICS, type Task } from './topics';

export interface MixTask { topic: string; level: number; task: Task }

/**
 * Reihenfolge der Themen: Jedes Thema kommt einmal dran, dann wird neu gemischt.
 * So kommt keins zu kurz, und dasselbe Thema kommt nie zweimal direkt hintereinander.
 */
export function nextTopic(topics: string[], bag: string[], last: string | null, rnd = Math.random): { topic: string; bag: string[] } {
  // Was gerade dran war, kommt nicht sofort wieder, auch wenn es noch im Beutel liegt.
  let b = bag.filter(t => topics.includes(t) && t !== last);
  if (!b.length) {
    b = [...topics];
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    if (b.length > 1 && b[0] === last) [b[0], b[1]] = [b[1], b[0]];
  }
  return { topic: b[0], bag: b.slice(1) };
}

/** Schwierigkeit rund um die eigene Stufe im Thema: mal eine leichter, meist gleich, mal eine schwerer. */
export function mixLevel(own: number, rnd = Math.random): number {
  const d = [-1, 0, 0, 1][Math.floor(rnd() * 4)];
  return Math.max(1, Math.min(MAX_LEVEL, own + d));
}

/** Eigene Stufe im Thema; gemeisterte Themen zählen als Profi-Stufe. */
export const ownLevel = (stats: Stats, id: string) => (stats[id]?.mastered ? MAX_LEVEL : stats[id]?.level ?? 1);

/** Eine neue gemischte Aufgabe, die das Kind zuletzt nicht hatte. */
export function mixTask(topicId: string, stats: Stats, seen: Seen, rnd = Math.random): MixTask | null {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) return null;
  const level = mixLevel(ownLevel(stats, topicId), rnd);
  const task = freshTask(t, level, seen);
  return task ? { topic: topicId, level, task } : null;
}

/** Themen, die schon geübt wurden (für gemischtes Üben ohne Themenzettel). */
export const practiced = (stats: Stats, all: string[]) => all.filter(id => (stats[id]?.total ?? 0) > 0);
