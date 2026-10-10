/* ===== Fester Lernpfad: Kapitel bauen aufeinander auf, jedes endet mit einer Klassenarbeit ===== */
import type { Stats } from './storage';

export interface Chapter { id: string; title: string; why: string; topics: string[] }

/** Reihenfolge wie im Schulbuch: Jedes Kapitel braucht, was davor kam. */
export const CHAPTERS: Chapter[] = [
  { id: 'k1', title: 'Rechnen mit Plan', why: 'Die Rechenregeln brauchst du in jedem späteren Thema.', topics: ['pvs'] },
  { id: 'k2', title: 'Brüche', why: 'Erst verstehen, was ein Bruch ist und wie man kürzt, dann damit rechnen.', topics: ['kuerzen', 'bradd', 'brmul'] },
  { id: 'k3', title: 'Kommazahlen und Prozent', why: 'Kommazahlen sind eine andere Schreibweise für Brüche. Prozent baut auf beidem auf.', topics: ['dez', 'proz'] },
  { id: 'k4', title: 'Gleichungen', why: 'Hier kommt alles zusammen: Rechenregeln, Brüche und Gegenrechnungen.', topics: ['gl'] },
];
export const FINAL = { id: 'final', title: 'Große Abschlussprüfung', topics: CHAPTERS.flatMap(c => c.topics) };

/** Ein Thema gilt als „geschafft“, wenn die Stufe „Schwieriger“ abgeschlossen ist (also Stufe 4 erreicht). */
export const TOPIC_DONE_LEVEL = 4;
/** Ab 50 % ist eine Klassenarbeit bestanden (Note 4). */
export const PASS = 0.5;

export interface ExamResult { best: number; last: number; at: string; tries: number }
export type Exams = Record<string, ExamResult>;

export const topicDone = (stats: Stats, id: string) => (stats[id]?.level ?? 1) >= TOPIC_DONE_LEVEL;
export const examPassed = (exams: Exams, id: string) => (exams[id]?.best ?? 0) >= PASS;

export type NodeState = 'locked' | 'open' | 'done';
export type PathNode =
  | { kind: 'topic'; id: string; chapter: Chapter; state: NodeState; needs?: string }
  | { kind: 'exam'; id: string; title: string; topics: string[]; state: NodeState; needs?: string; chapter?: Chapter };

/** Alle Stationen des Lernpfads mit ihrem Zustand. Im freien Modus ist alles offen. */
/** `unlocked`: Themen, die zusätzlich offen sind (z. B. vom Themenzettel der nächsten Klassenarbeit). */
export function pathNodes(stats: Stats, exams: Exams, free: boolean, titleOf: (id: string) => string, unlocked: string[] = []): PathNode[] {
  const out: PathNode[] = [];
  let prevOk = true, prevNeed = '';
  for (const ch of CHAPTERS) {
    for (const id of ch.topics) {
      const done = topicDone(stats, id);
      out.push({ kind: 'topic', id, chapter: ch, state: done ? 'done' : prevOk || free || unlocked.includes(id) ? 'open' : 'locked', needs: prevOk ? undefined : prevNeed });
      prevOk = done; prevNeed = `Schaffe zuerst die Stufe „Schwieriger“ bei „${titleOf(id)}“.`;
    }
    const passed = examPassed(exams, ch.id);
    const ready = ch.topics.every(id => topicDone(stats, id));
    out.push({ kind: 'exam', id: ch.id, title: `Klassenarbeit: ${ch.title}`, topics: ch.topics, chapter: ch, state: passed ? 'done' : ready || free ? 'open' : 'locked', needs: ready ? undefined : 'Schaffe zuerst bei allen Themen dieses Kapitels die Stufe „Schwieriger“.' });
    prevOk = passed; prevNeed = `Bestehe zuerst die Klassenarbeit „${ch.title}“.`;
  }
  out.push({ kind: 'exam', id: FINAL.id, title: FINAL.title, topics: FINAL.topics, state: examPassed(exams, FINAL.id) ? 'done' : prevOk || free ? 'open' : 'locked', needs: prevOk ? undefined : prevNeed });
  return out;
}

/** Der nächste sinnvolle Schritt: die erste offene, noch nicht geschaffte Station. */
/** `prefer`: Stationen, die zuerst vorgeschlagen werden (z. B. Stoff der eigenen Klasse). */
export const nextNode = (nodes: PathNode[], prefer: (n: PathNode) => boolean = () => false) =>
  nodes.find(n => n.state === 'open' && prefer(n)) ?? nodes.find(n => n.state === 'open') ?? null;

/** Schulnote aus dem Anteil der Punkte (übliche Skala). */
export function grade(p: number): { note: number; word: string } {
  const t: [number, number, string][] = [[0.92, 1, 'sehr gut'], [0.81, 2, 'gut'], [0.67, 3, 'befriedigend'], [0.5, 4, 'ausreichend'], [0.3, 5, 'mangelhaft'], [0, 6, 'ungenügend']];
  const [, note, word] = t.find(([min]) => p >= min - 1e-9)!;
  return { note, word };
}
