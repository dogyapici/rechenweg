import { describe, expect, it } from 'vitest';
import { parseAnswer, type Q } from './engine/index.js';
import { MUSTER_TOPICS } from './topics-muster';
import { MAX_LEVEL, guideFor, makeTask } from './stages';
import { formIssue } from './gen';

const typedOf = (a: Q) => (a.d === 1n ? String(a.n) : a.terminating() ? a.toDec() : a.red().txt());

describe('Muster-Themen', () => {
  for (const t of MUSTER_TOPICS) {
    it(`${t.id}: Theorie und Beispiel`, () => {
      expect(t.theory.length).toBeGreaterThan(100);
      expect(t.exampleSol!().sol).toBeTruthy();
      expect(t.theory + t.short + t.title).not.toMatch(/—/);
    });
    for (let level = 1; level <= MAX_LEVEL; level++) {
      it(`${t.id} Stufe ${level}: Aufgaben und Schritte passen zusammen`, () => {
        for (let i = 0; i < 60; i++) {
          const k = makeTask(t, level);
          expect(k, 'Aufgabe erzeugt').toBeTruthy();
          if (level >= 4) expect(k!.word, 'Textaufgabe ab Stufe 4').toBe(true);
          expect(k!.prompt).not.toMatch(/—/);
          const g = guideFor(k!);
          if (level >= 2) expect(g.length, 'Gemeinsam lösen hat Schritte').toBeGreaterThan(0);
          if (g.length && !k!.widget) expect(g[g.length - 1].answer.eq(k!.answer), 'letzter Schritt = Ergebnis').toBe(true);
          for (const s of g) {
            if (k!.word) expect(s.answer.sign()).toBe(1);
            if (s.choose) expect(s.choose.options.filter(o => o.ok).length).toBe(1);
            const typed = typedOf(s.answer);
            expect(parseAnswer(typed).v.eq(s.answer), typed).toBe(true);
          }
          const w = k!.widget;
          if (!w) {
            // Die Lösung selbst lässt sich eintippen und passt zur verlangten Schreibweise.
            const typed = k!.form === 'frac' ? k!.answer.red().txt() : typedOf(k!.answer);
            const p = parseAnswer(typed);
            expect(p.v.eq(k!.answer), typed).toBe(true);
            if (k!.needReduced) expect(!p.raw || p.v.isRed()).toBe(true);
            expect(formIssue(k!, typed), typed).toBeNull();
            if (k!.form === 'frac') expect(k!.answer.isInt()).toBe(false);
            if (k!.form === 'dec') expect(k!.answer.terminating()).toBe(true);
          } else if (w.kind === 'pick') {
            expect(w.options.length).toBeGreaterThanOrEqual(2);
            expect(new Set(w.options).size).toBe(w.options.length);
            expect(k!.answer.isInt()).toBe(true);
            expect(Number(k!.answer.n)).toBeGreaterThanOrEqual(1);
            expect(Number(k!.answer.n)).toBeLessThanOrEqual(w.options.length);
            if (w.options.length > 2) expect(w.options.length).toBeGreaterThanOrEqual(3);
          } else if (w.kind === 'bar') {
            const v = Number(k!.answer.n);
            expect(v % w.step).toBe(0);
            expect(v).toBeGreaterThan(0);
            expect(v).toBeLessThanOrEqual(w.top);
          }
        }
      });
    }
  }
});
