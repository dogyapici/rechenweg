import { describe, expect, it } from 'vitest';
import { addPage, cleanBuch, judge, MAX_PAGES, planTask, verify, type BuchTask } from './buch';

const task = (p: Partial<BuchTask>): BuchTask => ({ id: '1', nr: '1a', text: 'Berechne.', topic: null, art: 'rechnung', rechnung: '', ki: '', einheit: '', loesung: '', checks: [], ...p });

describe('Buchaufgaben', () => {
  it('übernimmt nur saubere Felder aus der KI-Antwort', () => {
    const r = cleanBuch({ titel: 'S. 84', aufgaben: [
      { nr: '1a', text: 'Berechne 3/4 + 1/6', thema: 'bradd', art: 'rechnung', rechnung: '3/4 + 1/6', ergebnis: '11/12', einheit: '', loesung: '', teilrechnungen: [] },
      { nr: '2', text: 'Zeichne ein Dreieck.', thema: 'gibtsnicht', art: 'quatsch', rechnung: '1 + 1', ergebnis: '', einheit: '', loesung: 'So geht es.', teilrechnungen: [{ term: '180 - 90', ergebnis: '90' }] },
      { nr: '3', text: '   ' },
    ] });
    expect(r.title).toBe('S. 84');
    expect(r.tasks).toHaveLength(2);
    expect(r.tasks[0]).toMatchObject({ topic: 'bradd', art: 'rechnung', rechnung: '3/4 + 1/6' });
    expect(r.tasks[1]).toMatchObject({ topic: null, art: 'ki', rechnung: '', checks: [{ term: '180 - 90', ki: '90' }] });
    expect(cleanBuch(null).tasks).toEqual([]);
  });

  it('rechnet mit der Recheneinheit und merkt, wenn die KI etwas anderes sagt', () => {
    const ok = planTask(task({ rechnung: '3/4 + 1/6', ki: '11/12' }));
    expect(ok.engine).toBe(true);
    expect(ok.disagree).toBe(false);
    expect(planTask(task({ rechnung: '3/4 + 1/6', ki: '4/10' })).disagree).toBe(true);
    expect(planTask(task({ art: 'ansatz', rechnung: '3/8 · 24', ki: '9' })).sol?.result?.eq(planTask(task({ rechnung: '9' })).sol!.result!)).toBe(true);
    expect(planTask(task({ rechnung: '2x + 3 = 11', ki: 'x = 4' })).disagree).toBe(false);
  });

  it('gibt unlesbare Rechnungen an die KI ab', () => {
    const p = planTask(task({ rechnung: '2^3 + 1' }));
    expect(p.engine).toBe(false);
    expect(p.err).toBeTruthy();
    expect(planTask(task({ art: 'ki', rechnung: '1 + 1' })).engine).toBe(false);
  });

  it('prüft Antworten genau, auch mit Einheit und als Dezimalzahl', () => {
    const sol = planTask(task({ rechnung: '3/8 · 24' })).sol!;
    expect(judge(sol, '9').state).toBe('right');
    expect(judge(sol, '9 €').state).toBe('right');
    expect(judge(sol, '8').state).toBe('wrong');
    expect(judge(sol, 'neun').state).toBe('invalid');
    const frac = planTask(task({ rechnung: '1/4 + 1/4' })).sol!;
    expect(judge(frac, '2/4').state).toBe('almost');
    expect(judge(frac, '0,5').state).toBe('right');
    expect(judge(planTask(task({ rechnung: '2x + 3 = 11' })).sol!, 'x = 4').state).toBe('right');
    expect(judge(planTask(task({ rechnung: 'x + 1 = x + 2' })).sol!, '1').state).toBe('invalid');
  });

  it('rechnet die Teilrechnungen der KI nach', () => {
    expect(verify({ term: '180 - 90', ki: '90' }).state).toBe('ok');
    expect(verify({ term: '3/4 · 8', ki: '5' })).toEqual({ state: 'falsch', engine: '6' });
    expect(verify({ term: '1 : 4', ki: '0,3' }).engine).toBe('1/4 = 0,25');
    expect(verify({ term: 'Wurzel 9', ki: '3' }).state).toBe('offen');
  });

  it('hebt höchstens zwölf Seiten auf, die neueste zuerst', () => {
    let pages = addPage([], { title: '', tasks: [] }, 1);
    expect(pages[0].title).toBe('Aufgaben aus dem Buch');
    for (let i = 2; i < 20; i++) pages = addPage(pages, { title: `S. ${i}`, tasks: [] }, i);
    expect(pages).toHaveLength(MAX_PAGES);
    expect(pages[0].title).toBe('S. 19');
  });
});
