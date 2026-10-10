import type { Exams } from './curriculum';

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
