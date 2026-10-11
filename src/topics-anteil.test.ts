import { describe, expect, it } from 'vitest';
import { parseAnswer, type Q } from './engine/index.js';
import { formIssue } from './gen';
import { ANTEIL_TOPICS } from './topics-anteil';
import { MAX_LEVEL, guideFor, makeTask } from './stages';

const typedOf = (a: Q) => (a.d === 1n ? String(a.n) : a.terminating() ? a.toDec() : a.red().txt());
const mixedOf = (a: Q) => { const r = a.red(), w = r.n / r.d, rest = (r.n < 0n ? -r.n : r.n) % r.d; return `${w} ${rest}/${r.d}`; };

describe('Anteil-Thema', () => {
  for (const t of ANTEIL_TOPICS) {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      it(`${t.id} Stufe ${level}: Aufgaben und Schritte passen zusammen`, () => {
        for (let i = 0; i < 60; i++) {
          const k = makeTask(t, level);
          expect(k, 'Aufgabe erzeugt').toBeTruthy();
          if (level >= 4) expect(k!.word, 'Textaufgabe ab Stufe 4').toBe(true);
          const g = guideFor(k!);
          if (level >= 2) expect(g.length, 'Gemeinsam lösen hat Schritte').toBeGreaterThan(0);
          if (g.length && !k!.widget) expect(g[g.length - 1].answer.eq(k!.answer), 'letzter Schritt = Ergebnis').toBe(true);
          for (const s of g) {
            if (k!.word) expect(s.answer.sign(), `${s.title}: positiv`).toBe(1);
            if (s.choose) expect(s.choose.options.filter(o => o.ok).length).toBe(1);
            const typed = typedOf(s.answer);
            expect(parseAnswer(typed).v.eq(s.answer), typed).toBe(true);
          }
          if (k!.widget?.kind === 'pick') {
            const o = k!.widget.options;
            expect(o.length, 'Auswahl hat 3 bis 4 Optionen').toBeGreaterThanOrEqual(3);
            expect(o.length).toBeLessThanOrEqual(4);
            expect(new Set(o).size, 'Optionen verschieden').toBe(o.length);
            expect(k!.answer.isInt() && k!.answer.n >= 1n && k!.answer.n <= BigInt(o.length)).toBe(true);
          }
          if (k!.widget?.kind === 'line') {
            const w = k!.widget;
            expect(w.ticks.length).toBe(w.n + 1);
            expect(k!.answer.isInt() && k!.answer.n >= 1n && k!.answer.n <= BigInt(w.n + 1)).toBe(true);
          }
          if (!k!.widget) {
            const a = k!.answer;
            const typed = k!.form === 'mixed' ? mixedOf(a) : k!.form === 'frac' ? a.red().txt() : typedOf(a);
            expect(parseAnswer(typed).v.eq(a), `Lösung eintippbar: ${typed}`).toBe(true);
            expect(formIssue(k!, typed), `Schreibweise passt: ${typed}`).toBeNull();
            if (k!.form === 'dec') expect(a.terminating(), 'Kommazahl möglich').toBe(true);
            if (k!.form === 'frac') expect(a.isInt(), 'Bruch nicht ganzzahlig').toBe(false);
            if (k!.form === 'mixed') expect(!a.isInt() && (a.n < 0n ? -a.n : a.n) > a.d, 'gemischte Zahl möglich').toBe(true);
            if (k!.needReduced) expect(parseAnswer(a.red().txt()).v.isRed()).toBe(true);
          }
          expect(k!.sol).toBeTruthy();
          expect(/—/.test(k!.prompt), 'kein Gedankenstrich').toBe(false);
        }
      });
    }
    it(`${t.id}: Beispiel-Lösung und Theorie`, () => {
      expect(t.theory.length).toBeGreaterThan(100);
      if (t.exampleSol) expect(t.exampleSol().sol).toBeTruthy();
    });
  }
  it('Recheneinheit kann negative Kommazahlen und Brüche', () => {
    expect(parseAnswer('(−2,5) + 1,7').v.eq(parseAnswer('-0,8').v)).toBe(true);
    expect(parseAnswer('−3/4').v.eq(parseAnswer('-0,75').v)).toBe(true);
    expect(parseAnswer('2 3/4').v.eq(parseAnswer('11/4').v)).toBe(true);
  });
});
