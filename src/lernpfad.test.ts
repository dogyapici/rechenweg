import { describe, expect, it } from 'vitest';
import { parseAnswer } from './engine/index.js';
import { TOPICS } from './topics';
import { MAX_LEVEL, guideFor, makeTask } from './stages';

describe('Lernpfad', () => {
  for (const t of TOPICS) {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      it(`${t.id} Stufe ${level}: Aufgaben und Schritte passen zusammen`, () => {
        for (let i = 0; i < 40; i++) {
          const k = makeTask(t, level);
          expect(k, 'Aufgabe erzeugt').toBeTruthy();
          if (level >= 4) expect(k!.word, 'Textaufgabe ab Stufe 4').toBe(true);
          const g = guideFor(k!);
          if (level >= 2) expect(g.length, 'Gemeinsam lösen hat Schritte').toBeGreaterThan(0);
          if (g.length) expect(g[g.length - 1].answer.eq(k!.answer), 'letzter Schritt = Ergebnis').toBe(true);
          for (const s of g) {
            if (k!.word && t.id !== 'neg') expect(s.answer.sign()).toBe(1);
            if (s.choose) expect(s.choose.options.filter(o => o.ok).length).toBe(1);
            // Die richtige Antwort muss sich auch eintippen lassen.
            const typed = s.answer.d === 1n ? String(s.answer.n) : s.answer.terminating() ? s.answer.toDec() : s.answer.red().txt();
            expect(parseAnswer(typed).v.eq(s.answer), typed).toBe(true);
          }
        }
      });
    }
  }
  it('Einheiten in Antworten werden ignoriert', () => {
    expect(parseAnswer('12 Jahre').v.n).toBe(12n);
    expect(parseAnswer('4,50 €').v.eq(parseAnswer('4,5').v)).toBe(true);
    expect(parseAnswer('20 Plätze').v.n).toBe(20n);
  });
});
