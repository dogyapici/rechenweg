/* ===== Lernplan bis zur nächsten Klassenarbeit (aus dem Themenzettel) ===== */
import { CHAPTERS, TOPIC_DONE_LEVEL } from './curriculum';
import type { Stats } from './storage';

export interface Plan {
  title: string;
  /** Datum der Klassenarbeit als JJJJ-MM-TT */
  date: string | null;
  /** App-Themen, die drankommen (in Lernpfad-Reihenfolge) */
  topics: string[];
  /** Punkte vom Zettel, die es in der App noch nicht gibt */
  extra: string[];
}

const ORDER = CHAPTERS.flatMap(c => c.topics);
export const sortTopics = (ids: string[]) => ORDER.filter(id => ids.includes(id));

const day = (iso: string) => new Date(iso + 'T12:00:00');
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Tage bis zur Arbeit: 0 = heute, 1 = morgen, negativ = vorbei. */
export const daysLeft = (date: string, today: string) => Math.round((day(date).getTime() - day(today).getTime()) / 864e5);

export const ready = (stats: Stats, id: string) => (stats[id]?.level ?? 1) >= TOPIC_DONE_LEVEL;

export type PlanItem = { kind: 'topic'; id: string } | { kind: 'probe' } | { kind: 'mix' };
export interface PlanDay { date: string; items: PlanItem[] }

/**
 * Verteilt die noch nicht sicheren Themen auf die Tage bis zur Arbeit.
 * Der letzte Tag davor ist immer für die Probe-Klassenarbeit, freie Tage sind zum Wiederholen.
 */
export function schedule(plan: Plan, stats: Stats, today: string): PlanDay[] {
  if (!plan.date) return [];
  const D = daysLeft(plan.date, today);
  if (D <= 0) return [];
  const open = plan.topics.filter(id => !ready(stats, id));
  const days: PlanDay[] = Array.from({ length: D }, (_, k) => {
    const d = day(today); d.setDate(d.getDate() + k);
    return { date: isoDay(d), items: [] };
  });
  const learn = Math.max(1, D - 1);
  open.forEach((id, i) => days[Math.min(D - 1, Math.floor((i * learn) / open.length))].items.push({ kind: 'topic', id }));
  days[D - 1].items.push({ kind: 'probe' });
  for (const d of days) if (!d.items.length) d.items.push({ kind: 'mix' });
  return days;
}

/** Was heute dran ist: das erste noch nicht sichere Thema, sonst die Probe-Klassenarbeit. */
export function todayItem(plan: Plan, stats: Stats): PlanItem {
  const id = plan.topics.find(t => !ready(stats, t));
  return id ? { kind: 'topic', id } : { kind: 'probe' };
}

export const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const dateH = (iso: string) => { const d = day(iso); return `${WEEKDAY[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`; };
