import { describe, expect, it } from 'vitest';
import { MathError, evalExpr, htmlToText, parseAnswer, q, solHTML, solveEq } from './index.js';
import { TOPICS } from '../topics.js';

const txt = (h: string) => htmlToText(h);

describe('Terme', () => {
  const cases: [string, string][] = [
    ['2 + 3 · (8 − 4)', '14'],
    ['10 - 3 - 2', '5'],
    ['12 : 2 · 3', '18'],
    ['2·3 + 4·5', '26'],
    ['(2+3)·(4+5)', '45'],
    ['3 - (2 - 5)', '6'],
    ['-3 + 5', '2'],
    ['1/2 + 2/3', '7/6'],
    ['1 + 1/4 - 2/3', '7/12'],
    ['3/4 : 5/8', '6/5'],
    ['2/3 · 3/5', '2/5'],
    ['1 : 3', '1/3'],
    ['6/8', '3/4'],
    ['0,1 + 0,2', '3/10'],
    ['2,5 · 1,4', '7/2'],
    ['4,5 : 0,5', '9'],
  ];
  it.each(cases)('%s = %s', (input, expected) => {
    expect(evalExpr(input).result.txt()).toBe(expected);
  });

  it('rechnet die Klammer zuerst, dann Punkt vor Strich', () => {
    const sol = evalExpr('2 + 3 · (8 − 4)');
    expect(sol.steps.map(s => s.rule)).toEqual(['Klammer zuerst', 'Punkt vor Strich', 'Letzter Schritt']);
  });

  it('zeigt bei verschiedenen Nennern den Hauptnenner und das Erweitern', () => {
    const t = txt(solHTML(evalExpr('1/2 + 2/3')));
    expect(t).toContain('Hauptnenner');
    expect(t).toContain('Erweitern mit 3');
  });

  it('kennt 0,1 + 0,2 exakt (keine Gleitkomma-Fehler)', () => {
    expect(evalExpr('0,1 + 0,2').resultHTML).toBe('0,3');
  });

  it('meldet verständliche Fehler', () => {
    expect(() => evalExpr('5 : 0')).toThrow(MathError);
    expect(() => evalExpr('(2 + 3')).toThrow('Klammer');
    expect(() => evalExpr('2 # 3')).toThrow('kenne ich nicht');
  });
});

describe('Gleichungen', () => {
  const cases: [string, string][] = [
    ['3x + 5 = 20', '5'],
    ['2(x - 1) = x + 7', '9'],
    ['5 = 2x - 3', '4'],
    ['4x = 6', '3/2'],
    ['x/2 + 1 = 4', '6'],
    ['5x + 4 = 2x - 5', '-3'],
  ];
  it.each(cases)('%s → x = %s', (input, expected) => {
    const sol = solveEq(input);
    expect(sol.result!.txt()).toBe(expected);
    expect(sol.probe).toContain('stimmt');
  });

  it('schreibt die Umformungen wie im Heft', () => {
    const sol = solveEq('3x + 5 = 20');
    expect(sol.rows.map(r => r.op).filter(Boolean).map(o => txt(o!))).toEqual(['| − 5', '| : 3']);
  });

  it('erkennt Gleichungen ohne oder mit unendlich vielen Lösungen', () => {
    expect(solveEq('3x + 1 = 3x + 1').solution).toBe('all');
    expect(solveEq('2x + 1 = 2x + 3').solution).toBe('none');
  });
});

describe('Antworten lesen', () => {
  it.each([
    ['3/4', '3/4'], ['1 1/2', '3/2'], ['0,75', '3/4'], ['x = 5', '5'], ['25 %', '25'], ['12 €', '12'], ['-2', '-2'],
  ])('%s', (input, expected) => {
    expect(parseAnswer(input).v.red().txt()).toBe(expected);
  });
  it('merkt sich, ob ein Bruch ungekürzt eingegeben wurde', () => {
    const a = parseAnswer('6/8');
    expect(a.raw && !a.v.isRed()).toBe(true);
  });
});

describe('Aufgaben-Generatoren', () => {
  for (const topic of TOPICS) {
    for (const level of [1, 2, 3]) {
      it(`${topic.title}, Stufe ${level}: Lösung stimmt mit der Recheneinheit überein`, () => {
        for (let i = 0; i < 25; i++) {
          const task = topic.gen(level);
          expect(task).not.toBeNull();
          expect(task!.answer.eq(task!.sol.result!)).toBe(true);
          expect(() => solHTML(task!.sol)).not.toThrow();
          // Ein Schüler, der die richtige Antwort eintippt, bekommt „richtig“.
          const typed = task!.answer.terminating() && topic.id !== 'kuerzen' && topic.id !== 'bradd' && topic.id !== 'brmul' ? task!.answer.toDec() : task!.answer.txt();
          expect(parseAnswer(typed).v.eq(task!.answer)).toBe(true);
        }
      });
    }
  }
  it('Prozent: 25 % von 80 € sind 20 €', () => {
    expect(q(80).mul(q(25)).div(q(100)).txt()).toBe('20');
  });
});
