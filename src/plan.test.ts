import { describe, expect, it } from 'vitest';
import { daysLeft, schedule, sortTopics, todayItem, type Plan } from './plan';

const plan = (date: string | null, topics: string[]): Plan => ({ title: '', date, topics, extra: [] });
const st = (level: number) => ({ level, streak: 0, miss: 0, right: 0, total: 0 });

describe('Lernplan', () => {
  it('zählt Tage', () => {
    expect(daysLeft('2026-10-20', '2026-10-10')).toBe(10);
    expect(daysLeft('2026-11-02', '2026-10-30')).toBe(3);
    expect(daysLeft('2026-10-09', '2026-10-10')).toBe(-1);
  });
  it('sortiert nach Lernpfad', () => expect(sortTopics(['gl', 'pvs', 'bradd'])).toEqual(['pvs', 'bradd', 'gl']));
  it('verteilt Themen und endet mit Probearbeit', () => {
    const d = schedule(plan('2026-10-15', ['kuerzen', 'bradd', 'brmul']), {}, '2026-10-10');
    expect(d.length).toBe(5);
    expect(d[0].date).toBe('2026-10-10');
    expect(d.flatMap(x => x.items).filter(i => i.kind === 'topic').map(i => (i as { id: string }).id)).toEqual(['kuerzen', 'bradd', 'brmul']);
    expect(d[4].items.at(-1)).toEqual({ kind: 'probe' });
    expect(d.every(x => x.items.length)).toBe(true);
  });
  it('wenig Zeit: alles passt trotzdem rein', () => {
    const d = schedule(plan('2026-10-11', ['kuerzen', 'bradd', 'brmul']), {}, '2026-10-10');
    expect(d.length).toBe(1);
    expect(d[0].items.length).toBe(4);
  });
  it('sichere Themen fallen raus', () => {
    const p = plan('2026-10-15', ['kuerzen', 'bradd']);
    expect(todayItem(p, { kuerzen: st(4) })).toEqual({ kind: 'topic', id: 'bradd' });
    expect(todayItem(p, { kuerzen: st(4), bradd: st(5) })).toEqual({ kind: 'probe' });
    expect(schedule(plan('2026-10-10', ['gl']), {}, '2026-10-10')).toEqual([]);
  });
});
