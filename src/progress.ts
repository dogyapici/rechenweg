/* ===== Lerntage, Serie (Streak) und Erfolge ===== */
import { PASS, type Exams } from './curriculum';
import { isoDay } from './plan';
import type { Stats } from './storage';

export interface DayLog { right: number; tasks: number; exams: number }
export type Activity = Record<string, DayLog>;
/** Erfolge mit dem Tag, an dem sie freigeschaltet wurden */
export type Unlocked = Record<string, string>;

/** So viele richtige Aufgaben am Tag zählen als Lerntag für die Serie. */
export const DAILY_GOAL = 5;

export const emptyDay = (): DayLog => ({ right: 0, tasks: 0, exams: 0 });
export const isActive = (d?: DayLog) => !!d && (d.right >= DAILY_GOAL || d.exams > 0);

const shift = (iso: string, days: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + days); return isoDay(d); };

/** Aktuelle Serie: Tage in Folge mit geschafftem Tagesziel. Heute zählt mit, bricht sie aber noch nicht ab. */
export function streak(act: Activity, today: string): number {
  let d = isActive(act[today]) ? today : shift(today, -1);
  let n = 0;
  while (isActive(act[d])) { n++; d = shift(d, -1); }
  return n;
}

export function bestStreak(act: Activity): number {
  let best = 0, run = 0, prev = '';
  for (const d of Object.keys(act).filter(k => isActive(act[k])).sort()) {
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}

/** Trägt neue Aufgaben in den heutigen Tag ein (nur Zuwächse, ein Zurücksetzen zählt nicht). */
export function logStats(act: Activity, before: Stats, after: Stats, today: string): Activity {
  let right = 0, tasks = 0;
  for (const id of Object.keys(after)) {
    right += Math.max(0, after[id].right - (before[id]?.right ?? 0));
    tasks += Math.max(0, after[id].total - (before[id]?.total ?? 0));
  }
  if (!right && !tasks) return act;
  const d = act[today] ?? emptyDay();
  return { ...act, [today]: { ...d, right: d.right + right, tasks: d.tasks + tasks } };
}
export function logExam(act: Activity, today: string): Activity {
  const d = act[today] ?? emptyDay();
  return { ...act, [today]: { ...d, exams: d.exams + 1 } };
}

export interface Ctx { act: Activity; stats: Stats; exams: Exams; today: string }
export interface Achievement { id: string; icon: string; title: string; desc: string; test: (c: Ctx) => boolean }

const totalRight = (s: Stats) => Object.values(s).reduce((a, t) => a + t.right, 0);
const levels = (s: Stats) => Object.values(s).map(t => t.level);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', icon: '🌱', title: 'Los geht’s', desc: 'Die erste Aufgabe richtig gelöst', test: c => totalRight(c.stats) >= 1 },
  { id: 'ziel', icon: '🎯', title: 'Tagesziel', desc: `Zum ersten Mal ${DAILY_GOAL} Aufgaben an einem Tag`, test: c => Object.values(c.act).some(isActive) },
  { id: 's3', icon: '🔥', title: '3 Tage in Folge', desc: 'Drei Tage hintereinander das Tagesziel geschafft', test: c => bestStreak(c.act) >= 3 },
  { id: 's7', icon: '⚡', title: 'Eine Woche', desc: 'Sieben Tage in Folge gelernt', test: c => bestStreak(c.act) >= 7 },
  { id: 's14', icon: '🌟', title: 'Zwei Wochen', desc: '14 Tage in Folge gelernt', test: c => bestStreak(c.act) >= 14 },
  { id: 's30', icon: '👑', title: 'Ein ganzer Monat', desc: '30 Tage in Folge gelernt', test: c => bestStreak(c.act) >= 30 },
  { id: 'a50', icon: '✏️', title: '50 Aufgaben', desc: '50 Aufgaben richtig gelöst', test: c => totalRight(c.stats) >= 50 },
  { id: 'a200', icon: '📚', title: '200 Aufgaben', desc: '200 Aufgaben richtig gelöst', test: c => totalRight(c.stats) >= 200 },
  { id: 'a500', icon: '🧠', title: '500 Aufgaben', desc: '500 Aufgaben richtig gelöst', test: c => totalRight(c.stats) >= 500 },
  { id: 'stufe', icon: '⭐', title: 'Aufgestiegen', desc: 'Zum ersten Mal eine Stufe geschafft', test: c => levels(c.stats).some(l => l >= 2) },
  { id: 'text', icon: '📖', title: 'Geschichtenlöser', desc: 'Bei einem Thema bis zu den Textaufgaben gekommen', test: c => levels(c.stats).some(l => l >= 4) },
  { id: 'profi', icon: '🏆', title: 'Profi', desc: 'Ein Thema bis zur Profi-Stufe gebracht', test: c => levels(c.stats).some(l => l >= 5) },
  { id: 'arbeit', icon: '📝', title: 'Bestanden', desc: 'Die erste Klassenarbeit bestanden', test: c => Object.values(c.exams).some(e => e.best >= PASS) },
  { id: 'note1', icon: '🥇', title: 'Glatte Eins', desc: 'Note 1 in einer Klassenarbeit', test: c => Object.values(c.exams).some(e => e.best >= 0.92) },
  { id: 'final', icon: '🎓', title: 'Abschluss', desc: 'Die große Abschlussprüfung bestanden', test: c => (c.exams.final?.best ?? 0) >= PASS },
];

/** Erfolge, die gerade neu dazugekommen sind. */
export const newAchievements = (c: Ctx, have: Unlocked) => ACHIEVEMENTS.filter(a => !have[a.id] && a.test(c));
