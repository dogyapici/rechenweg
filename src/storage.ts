/** Fortschritt und Zugangscode bleiben nur in diesem Browser gespeichert. */
export interface TopicStats { level: number; streak: number; miss: number; right: number; total: number }
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
