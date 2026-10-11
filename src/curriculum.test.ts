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
    expect(n.filter(x => x.state === 'open').map(x => x.id)).toEqual(['zahl']);
    const s: Stats = { zahl: st(4), rund: st(4), schrift: st(4), pvs: st(4), geschickt: st(4), pot: st(4) };
    n = pathNodes(s, {}, false, title);
    expect(nextNode(n)?.id).toBe('k1');
    expect(n.find(x => x.id === 'teil')!.state).toBe('locked');
    n = pathNodes(s, { k1: { best: 0.75, last: 0.75, at: '', tries: 1 } }, false, title);
    expect(nextNode(n)?.id).toBe('teil');
  });
  it('Zettel-Themen sind offen', () => {
    expect(pathNodes({}, {}, false, title, ['gl']).find(x => x.id === 'gl')!.state).toBe('open');
  });
  it('bevorzugt Stoff der eigenen Klasse', () => {
    const n = pathNodes({}, {}, false, title, ['pvs', 'kuerzen', 'bradd']);
    expect(nextNode(n, x => x.id === 'bradd')?.id).toBe('bradd');
    expect(nextNode(n, () => false)?.id).toBe('zahl');
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
    it(`${ch.id}: vollständige Aufgaben, genug Aufgaben, alle Themen (Abschluss: 24 verschiedene)`, () => {
      for (let r = 0; r < 10; r++) {
        const e = buildExam(ch.topics);
        const n = ch.topics.length > 4 ? Math.min(24, Math.max(12, ch.topics.length)) : 8;
        expect(e.length).toBe(n);
        expect(new Set(e.map(x => x.topic)).size).toBe(Math.min(n, ch.topics.length));
        for (const x of e) expect(mark(x.task, '').state).toBe('empty');
      }
    });
  }
  it('bewertet richtig, halb und falsch', () => {
    let t = buildExam(['kuerzen'])[0].task;
    for (let k = 0; k < 200 && !(t.needReduced && !t.widget); k++) t = buildExam(['kuerzen'])[0].task;
    expect(t.needReduced).toBe(true);
    const a = t.answer;
    expect(mark(t, `${a.n}/${a.d}`).points).toBe(1);
    expect(mark(t, `${a.n * 2n}/${a.d * 2n}`).points).toBe(0.5);
    expect(mark(t, '9999').points).toBe(0);
  });
});
