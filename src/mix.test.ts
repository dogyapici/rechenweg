import { describe, expect, it } from 'vitest';
import { mixLevel, mixTask, nextTopic, ownLevel, practiced } from './mix';
import { remember, taskKey, type Seen } from './fresh';
import { logMix } from './progress';
import { CHAPTERS } from './curriculum';
import { freshStats, type Stats } from './storage';

describe('Gemischt üben', () => {
  it('bringt jedes Thema einmal, bevor eins wiederkommt, und nie zweimal direkt hintereinander', () => {
    const topics = ['a', 'b', 'c', 'd'];
    let bag: string[] = [], last: string | null = null;
    const seq: string[] = [];
    for (let i = 0; i < 40; i++) { const r = nextTopic(topics, bag, last); bag = r.bag; last = r.topic; seq.push(r.topic); }
    for (let i = 0; i < 40; i += 4) expect(new Set(seq.slice(i, i + 4)).size).toBe(4);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });
  it('überspringt nie ins gleiche Thema, auch wenn es noch im Beutel liegt', () => {
    expect(nextTopic(['a', 'b', 'c'], ['a', 'b'], 'a').topic).toBe('b');
    expect(nextTopic(['a', 'b'], ['a'], 'a').topic).toBe('b');
  });
  it('kommt mit einem einzigen Thema zurecht', () => {
    expect(nextTopic(['x'], [], 'x').topic).toBe('x');
  });
  it('bleibt mit der Schwierigkeit nah an der eigenen Stufe', () => {
    for (let own = 1; own <= 5; own++) for (const r of [0, 0.3, 0.6, 0.99]) {
      const lv = mixLevel(own, () => r);
      expect(Math.abs(lv - own)).toBeLessThanOrEqual(1);
      expect(lv).toBeGreaterThanOrEqual(1); expect(lv).toBeLessThanOrEqual(5);
    }
    const s: Stats = { p: { ...freshStats(), level: 5, mastered: '2026-10-01' } };
    expect(ownLevel(s, 'p')).toBe(5);
    expect(ownLevel(s, 'neu')).toBe(1);
  });
  it('stellt in einer gemischten Runde keine Aufgabe doppelt', () => {
    for (const ch of CHAPTERS) {
      let seen: Seen = {}, bag: string[] = [], last: string | null = null;
      const keys: string[] = [];
      for (let i = 0; i < 16; i++) {
        const r = nextTopic(ch.topics, bag, last); bag = r.bag; last = r.topic;
        const m = mixTask(r.topic, {}, seen);
        expect(m, `${ch.id} ${r.topic}`).toBeTruthy();
        keys.push(taskKey(m!.task)); seen = remember(seen, m!.topic, m!.task);
      }
      expect(new Set(keys).size, ch.id).toBe(keys.length);
    }
  });
  it('mischt ohne Zettel nur Themen, die schon geübt wurden', () => {
    const s: Stats = { a: { ...freshStats(), total: 3 }, b: freshStats() };
    expect(practiced(s, ['a', 'b', 'c'])).toEqual(['a']);
  });
  it('zählt gemischte Aufgaben fürs Tagesziel', () => {
    let act = logMix({}, true, '2026-10-16');
    act = logMix(act, false, '2026-10-16');
    expect(act['2026-10-16']).toMatchObject({ right: 1, tasks: 2, exams: 0 });
  });
});
