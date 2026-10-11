import { describe, expect, it } from 'vitest';
import { parseAnswer, type Q } from './engine/index.js';
import { RECHNEN_TOPICS } from './topics-rechnen';
import { MAX_LEVEL, guideFor, makeTask } from './stages';

const typed = (v: Q) => (v.d === 1n ? String(v.n) : v.terminating() ? v.toDec() : v.red().txt());

describe('Rechnen-Themen', () => {
  for (const t of RECHNEN_TOPICS) {
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
            if (k!.word) expect(s.answer.sign()).toBe(1);
            if (s.choose) expect(s.choose.options.filter(o => o.ok).length).toBe(1);
            const ty = typed(s.answer);
            expect(parseAnswer(ty).v.eq(s.answer), ty).toBe(true);
          }
          if (!k!.widget) {
            const ty = typed(k!.answer);
            expect(parseAnswer(ty).v.eq(k!.answer), `Lösung eintippen: ${ty}`).toBe(true);
          } else if (k!.widget.kind === 'pick') {
            const n = Number(k!.answer.n);
            expect(n >= 1 && n <= k!.widget.options.length, 'Auswahl im Bereich').toBe(true);
            expect(new Set(k!.widget.options).size, 'Optionen verschieden').toBe(k!.widget.options.length);
          }
          if (k!.form === 'dec') expect(k!.answer.terminating(), 'form dec').toBe(true);
          if (k!.form === 'frac') expect(k!.answer.isInt(), 'form frac').toBe(false);
          if (k!.form === 'mixed') expect(!k!.answer.isInt() && (k!.answer.n < 0n ? -k!.answer.n : k!.answer.n) > k!.answer.d, 'form mixed').toBe(true);
          // Kein Gedankenstrich im Text
          expect(k!.prompt.includes('—'), 'kein Gedankenstrich').toBe(false);
        }
      });
    }
  }
  it('Einheiten in Antworten werden ignoriert', () => {
    for (const u of ['m²', 'cm²', 'mm²', 'dm²', 'km²', 'm³', 'cm³', 'dm³', 'mm³', 'ml', 'l', 'cm', 'm', '€', 't']) expect(parseAnswer(`12 ${u}`).v.n, u).toBe(12n);
    expect(parseAnswer('4 800 cm²').v.n).toBe(4800n);
  });
});
