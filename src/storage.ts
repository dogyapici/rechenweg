import type { Exams } from './curriculum';
import type { Plan } from './plan';
import type { Profile } from './profile';
import type { Activity, Unlocked } from './progress';
import { emptyJournal, type Journal } from './journal';
import type { Seen } from './fresh';

/** Fortschritt und Zugangscode bleiben nur in diesem Browser gespeichert. */
/** `intro`: höchste Stufe, deren Einführung schon gezeigt wurde. `atLevel`: erledigte Aufgaben auf der aktuellen Stufe. */
export interface TopicStats { level: number; streak: number; miss: number; right: number; total: number; intro?: number; atLevel?: number }
export type Stats = Record<string, TopicStats>;

const read = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* privates Fenster */ } };

export const loadStats = (): Stats => read<Stats>('rechenweg-stats', {});
export const saveStats = (s: Stats) => write('rechenweg-stats', s);
export const freshStats = (): TopicStats => ({ level: 1, streak: 0, miss: 0, right: 0, total: 0 });

export const loadCode = (): string => read<string>('rechenweg-code', '');
export const saveCode = (c: string) => write('rechenweg-code', c);

/** Zuletzt geöffnetes Thema, für „Weiter üben“ auf der Startseite. */
export const loadLast = (): string | null => read<string | null>('rechenweg-last', null);
export const saveLast = (id: string) => write('rechenweg-last', id);

export const loadExams = (): Exams => read<Exams>('rechenweg-exams', {});
export const saveExams = (e: Exams) => write('rechenweg-exams', e);
/** Freies Üben: alle Themen offen, ohne Reihenfolge. */
export const loadFree = (): boolean => read<boolean>('rechenweg-free', false);
export const saveFree = (f: boolean) => write('rechenweg-free', f);
/** Die nächste Klassenarbeit mit den Themen vom Zettel. */
export const loadPlan = (): Plan | null => read<Plan | null>('rechenweg-plan', null);
export const savePlan = (p: Plan | null) => write('rechenweg-plan', p);
/** Lerntage und freigeschaltete Erfolge */
export const loadActivity = (): Activity => read<Activity>('rechenweg-activity', {});
export const saveActivity = (a: Activity) => write('rechenweg-activity', a);
export const loadUnlocked = (): Unlocked => read<Unlocked>('rechenweg-unlocked', {});
export const saveUnlocked = (u: Unlocked) => write('rechenweg-unlocked', u);
export const loadProfile = (): Profile | null => read<Profile | null>('rechenweg-profile', null);
export const saveProfile = (p: Profile) => write('rechenweg-profile', p);
/** Lerntagebuch für die Eltern-Ansicht */
export const loadJournal = (): Journal => ({ ...emptyJournal(), ...read<Partial<Journal>>('rechenweg-journal', {}) });
export const saveJournal = (j: Journal) => write('rechenweg-journal', j);
/** Zuletzt gestellte Aufgaben pro Thema, damit sich nichts wiederholt */
export const loadSeen = (): Seen => read<Seen>('rechenweg-seen', {});
export const saveSeen = (s: Seen) => write('rechenweg-seen', s);
