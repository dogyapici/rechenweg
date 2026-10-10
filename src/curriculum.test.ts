import { describe, expect, it } from 'vitest';
import { CHAPTERS, FINAL, grade, nextNode, pathNodes } from './curriculum';
import { buildExam, mark } from './exam';
import { TOPICS } from './topics';
import type { Stats } from './storage';

const st = (level: number) => ({ level, streak: 0, miss: 0, right: 0, total: 0 });
const title = (id: string) => id;

describe('Lernpfad-Kapitel', () => {
  it('enthält jedes Thema genau einmal', () => {
    expect(FINAL.topics.slice().sort()).toEqual(TOPICS.map(t => t.id).sort());
  });
  it('schaltet der Reihe nach frei', () => {
    let n = pathNodes({}, {}, false, title);
    expect(n.filter(x => x.state === 'open').map(x => x.id)).toEqual(['pvs']);
    const s: Stats = { pvs: st(4) };
    n = pathNodes(s, {}, false, title);
    expect(nextNode(n)?.id).toBe('k1');
    expect(n.find(x => x.id === 'kuerzen')!.state).toBe('locked');
    n = pathNodes(s, { k1: { best: 0.75, last: 0.75, at: '', tries: 1 } }, false, title);
    expect(nextNode(n)?.id).toBe('kuerzen');
  });
  it('freies Üben öffnet alles', () => {
    expect(pathNodes({}, {}, true, title).every(x => x.state !== 'locked')).toBe(true);
  });
  it('Noten', () => {
    expect(grade(1).note).toBe(1);
    expect(grade(0.85).note).toBe(2);
    expect(grade(0.5).note).toBe(4);
    expect(grade(0.49).note).toBe(5);
    expect(grade(0).note).toBe(6);
  });
});

describe('Klassenarbeit', () => {
  for (const ch of [...CHAPTERS, FINAL]) {
    it(`${ch.id}: vollständige Aufgaben, alle Themen kommen vor`, () => {
      for (let r = 0; r < 10; r++) {
        const e = buildExam(ch.topics);
        expect(e.length).toBe(ch.topics.length > 4 ? 12 : 8);
        for (const id of ch.topics) expect(e.some(x => x.topic === id)).toBe(true);
        for (const x of e) expect(mark(x.task, '').state).toBe('empty');
      }
    });
  }
  it('bewertet richtig, halb und falsch', () => {
    const e = buildExam(['kuerzen']);
    const t = e[0].task;
    const a = t.answer;
    expect(mark(t, `${a.n}/${a.d}`).points).toBe(1);
    expect(mark(t, `${a.n * 2n}/${a.d * 2n}`).points).toBe(0.5);
    expect(mark(t, '9999').points).toBe(0);
  });
});
