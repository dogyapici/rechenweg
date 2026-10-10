import { describe, expect, it } from 'vitest';
import { bestStreak, logExam, logStats, newAchievements, streak, type Activity } from './progress';

const on = { right: 5, tasks: 6, exams: 0 }, part = { right: 2, tasks: 2, exams: 0 };
const st = (right: number, total = right, level = 1) => ({ level, streak: 0, miss: 0, right, total });

describe('Serie', () => {
  const act: Activity = { '2026-10-07': on, '2026-10-08': on, '2026-10-09': on, '2026-10-10': part, '2026-09-30': on, '2026-10-01': on };
  it('zählt bis gestern, wenn heute noch nicht geschafft', () => expect(streak(act, '2026-10-10')).toBe(3));
  it('zählt heute mit, wenn geschafft', () => expect(streak({ ...act, '2026-10-10': on }, '2026-10-10')).toBe(4));
  it('bricht nach einem Tag Pause ab', () => expect(streak(act, '2026-10-11')).toBe(0));
  it('über Monatsgrenze', () => expect(bestStreak(act)).toBe(3));
  it('Klassenarbeit zählt als Lerntag', () => expect(streak(logExam({}, '2026-10-10'), '2026-10-10')).toBe(1));
});

describe('Eintragen', () => {
  it('zählt nur Zuwächse', () => {
    let a = logStats({}, { pvs: st(2) }, { pvs: st(3, 4) }, '2026-10-10');
    expect(a['2026-10-10']).toEqual({ right: 1, tasks: 2, exams: 0 });
    a = logStats(a, { pvs: st(3, 4) }, {}, '2026-10-10');
    expect(a['2026-10-10'].right).toBe(1);
  });
});

describe('Erfolge', () => {
  it('schaltet frei, aber nur einmal', () => {
    const c = { act: { '2026-10-10': on }, stats: { pvs: st(60, 60, 2) }, exams: {}, today: '2026-10-10' };
    const ids = newAchievements(c, {}).map(a => a.id);
    expect(ids).toEqual(['start', 'ziel', 'a50', 'stufe']);
    expect(newAchievements(c, { start: 'x', ziel: 'x', a50: 'x', stufe: 'x' })).toEqual([]);
  });
});
