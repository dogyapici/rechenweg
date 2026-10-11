import { describe, expect, it } from 'vitest';
import { addAttempt, addExam, buildReport, decodeSnapshot, emptyJournal, encodeSnapshot, MAX_TRIES, snapshot, type Attempt, type Journal } from './journal';
import { isoDay } from './plan';

const NOW = new Date('2026-10-11T18:00:00').getTime();
const H = 3600e3;
const at = (o: Partial<Attempt>): Attempt => ({ t: NOW - H, topic: 'bradd', lv: 2, src: 'ueben', q: 'Berechne: 1/2 + 1/3', a: '5/6', wrong: [], ok: true, first: true, help: [], sec: 30, ...o });

function journal(list: Partial<Attempt>[]): Journal {
  return list.reduce<Journal>((j, a) => addAttempt(j, at(a)), emptyJournal());
}

describe('Lerntagebuch', () => {
  it('deckelt Länge, Zeit und Eingaben', () => {
    let j = emptyJournal();
    for (let i = 0; i < MAX_TRIES + 20; i++) j = addAttempt(j, at({ t: i, sec: 5000, wrong: ['1', '2', '3', '4'], q: 'x'.repeat(900) }));
    expect(j.tries).toHaveLength(MAX_TRIES);
    expect(j.tries[0].t).toBe(20);
    expect(j.tries[0].sec).toBe(600);
    expect(j.tries[0].wrong).toEqual(['2', '3', '4']);
    expect(j.tries[0].q.length).toBeLessThan(510);
  });

  it('findet das Thema, bei dem es hakt, mit dem typischen Fehler', () => {
    const j = journal([
      ...Array.from({ length: 6 }, () => ({ topic: 'kuerzen' })),
      ...Array.from({ length: 5 }, (_, i) => ({ topic: 'bradd', ok: i > 1, first: false, wrong: ['2/5'], diag: 'Nenner nicht addieren', help: i < 2 ? ['loesung' as const] : [] })),
    ]);
    const stats = { kuerzen: { level: 4, streak: 0, miss: 0, right: 6, total: 6 }, bradd: { level: 2, streak: 0, miss: 1, right: 3, total: 5 } };
    const r = buildReport(j, stats, { [isoDay(new Date(NOW))]: { right: 9, tasks: 11, exams: 0 } }, {}, { name: 'Mia', klasse: 6, schulform: 'gym', land: 'BW' }, NOW);
    expect(r.weak.map(t => t.id)).toEqual(['bradd']);
    expect(r.weak[0].state).toBe('hilfe');
    expect(r.weak[0].diags[0]).toEqual({ text: 'Nenner nicht addieren', n: 5 });
    expect(r.topics.find(t => t.id === 'kuerzen')!.state).toBe('stark');
    expect(r.mistakes).toHaveLength(5);
    expect(r.helpUse.loesung).toBe(2);
    expect(r.days.active7).toBe(1);
    expect(r.tasks.last7).toBe(11);
    expect(r.firstRate).toBeCloseTo(6 / 11);
    expect(r.last14[13]).toMatchObject({ tasks: 11, right: 9 });
    expect(r.name).toBe('Mia');
  });

  it('kennt alte Stufen-Zähler ohne Tagebuch und Klassenarbeiten', () => {
    let j = emptyJournal();
    j = addExam(j, { t: NOW, id: 'k2', name: 'Klassenarbeit: Brüche', p: 0.7, secs: 900, n: 8 });
    const r = buildReport(j, { dez: { level: 3, streak: 0, miss: 0, right: 12, total: 15 } }, {}, { k2: { best: 0.7, last: 0.7, at: '2026-10-11', tries: 1 } }, null, NOW);
    expect(r.topics[0]).toMatchObject({ id: 'dez', n: 15, right: 12, state: 'gut' });
    expect(r.tasks.all).toBe(15);
    expect(r.exams[0].note).toBe(3);
    expect(r.examBest[0].note).toBe(3);
  });

  it('packt den Bericht in einen Link und wieder aus', async () => {
    const j = journal(Array.from({ length: 300 }, (_, i) => ({ t: NOW - i * 1000, ok: i % 3 > 0, wrong: i % 3 ? [] : ['7/12'] })));
    const s = snapshot(null, { bradd: { level: 2, streak: 0, miss: 0, right: 200, total: 300 } }, {}, {}, j, NOW);
    expect(s.journal.tries).toHaveLength(250);
    const code = await encodeSnapshot(s);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(20000);
    expect(await decodeSnapshot(code)).toEqual(s);
    expect(await decodeSnapshot('kaputt')).toBeNull();
  });
});
