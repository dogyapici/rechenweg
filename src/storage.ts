import type { Exams } from './curriculum';
import type { Plan } from './plan';
import type { Profile } from './profile';
import type { Activity, Unlocked } from './progress';
import { emptyJournal, type Journal } from './journal';
import type { Seen } from './fresh';
import type { CloudData, SyncMeta } from './cloud';

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

/* ===== Abgleich mit dem Konto ===== */
/** Alles, was zum Lernstand gehört (nicht Zugangscode und Geräte-Einstellungen). */
export const PROGRESS_KEYS = ['rechenweg-stats', 'rechenweg-exams', 'rechenweg-activity', 'rechenweg-unlocked', 'rechenweg-journal', 'rechenweg-plan', 'rechenweg-profile', 'rechenweg-seen', 'rechenweg-last'];
export function localData(): Omit<CloudData, 'v' | 'at'> {
  return { stats: loadStats(), exams: loadExams(), act: loadActivity(), unlocked: loadUnlocked(), journal: loadJournal(), plan: loadPlan(), profile: loadProfile(), seen: loadSeen() };
}
export const hasLocalData = () => Object.keys(loadStats()).length > 0 || loadJournal().tries.length > 0 || Object.keys(loadExams()).length > 0;
export function applyData(d: CloudData) {
  saveStats(d.stats ?? {}); saveExams(d.exams ?? {}); saveActivity(d.act ?? {}); saveUnlocked(d.unlocked ?? {});
  saveJournal(d.journal ?? emptyJournal()); savePlan(d.plan ?? null); if (d.profile) saveProfile(d.profile); else write('rechenweg-profile', null);
  saveSeen(d.seen ?? {});
}
export function clearLocal() { for (const k of PROGRESS_KEYS) { try { localStorage.removeItem(k); } catch { /* egal */ } } }
export const loadSyncMeta = (): SyncMeta => ({ user: null, at: 0, pushed: 0, ...read<Partial<SyncMeta>>('rechenweg-sync', {}) });
export const saveSyncMeta = (m: SyncMeta) => write('rechenweg-sync', m);
