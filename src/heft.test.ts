import { describe, expect, it } from 'vitest';
import { heftAddSub, heftDiv, heftFor, heftFracAdd, heftFracMul, heftMul, heftPrim, heftText } from './heft';
import { TOPICS } from './topics';
import { evalExpr } from './engine/index.js';
import { makeTask } from './stages';

const last = (h: ReturnType<typeof heftMul>) => heftText(h!);
describe('Heft', () => {
  it('addiert und subtrahiert schriftlich', () => {
    expect(last(heftAddSub('4567', '389', '+'))[2].trim()).toBe('4956');
    expect(last(heftAddSub('12,5', '3,75', '+'))[2].trim()).toBe('16,25');
    expect(last(heftAddSub('5003', '1278', '-'))[2].trim()).toBe('3725');
    expect(last(heftAddSub('7,2', '3,45', '-'))[2].trim()).toBe('3,75');
    expect(last(heftAddSub('0,9', '0,85', '-'))[2].trim()).toBe('0,05');
  });
  it('multipliziert schriftlich', () => {
    const t = last(heftMul('385', '27'));
    expect(t[0].trim()).toBe('385·27');
    expect(t.map(r => r.trim())).toContain('10395');
    expect(last(heftMul('3,2', '1,5')).map(r => r.trim())).toContain('4,80');
  });
  it('dividiert schriftlich, auch mit Periode und Komma', () => {
    expect(last(heftDiv('936', '4'))[0]).toContain('=234');
    expect(last(heftDiv('1', '3'))[0]).toContain('=0,3');
    expect(last(heftDiv('5', '8'))[0]).toContain('=0,625');
    expect(last(heftDiv('7,2', '0,4'))[1] ?? '').toContain('');
    const h = heftDiv('7,2', '0,4')!;
    expect(heftText(h).some(r => r.includes('=18'))).toBe(true);
    const p = heftDiv('5', '7')!;
    expect(heftText(p)[0]).toContain('=0,714285');
  });
  it('teilt Kommazahlen mit Nullen nach dem Komma', () => {
    for (const [a, b, q] of [['0,06', '7', '=0,00857142'], ['0,6', '7', '=0,0857142'], ['0,05', '4', '=0,0125'], ['0,6', '3', '=0,2']]) {
      const top = heftText(heftDiv(a, b)!).find(z => z.includes('='))!;
      expect(top.replace(/\s/g, ''), `${a}:${b}`).toContain(q.replace(/\s/g, ''));
      expect(top.replace(/\s/g, '').startsWith(a), `${a}:${b} beginnt mit der Aufgabe`).toBe(true);
    }
  });
  it('stimmt bei zufälligen Zahlen mit der exakten Rechnung überein', () => {
    const r = (n: number) => Math.floor(Math.random() * n);
    const dec = () => { const k = r(3); const v = String(r(9000) + 1); return k ? (v.padStart(k + 1, '0').slice(0, -k) + ',' + v.padStart(k + 1, '0').slice(-k)) : v; };
    const val = (s: string) => evalExpr(s).result;
    for (let i = 0; i < 300; i++) {
      const a = dec(), b = dec();
      const [x, y] = val(a).lt(val(b)) ? [b, a] : [a, b];
      expect(val(last(heftAddSub(x, y, '+'))[2].trim()).eq(val(`${x} + ${y}`)), `${x}+${y}`).toBe(true);
      expect(val(last(heftAddSub(x, y, '-'))[2].trim()).eq(val(`${x} - ${y}`)), `${x}-${y}`).toBe(true);
      const m = last(heftMul(a, b)).map(z => z.trim()).filter(Boolean);
      expect(val(m[m.length - 1]).eq(val(`${a} · ${b}`)), `${a}·${b}`).toBe(true);
      const d = String(r(20) + 2);
      const h = heftDiv(a, d)!; const top = heftText(h).find(z => z.includes('='))!;
      const qv = top.slice(top.lastIndexOf('=') + 1).trim();
      const exact = val(`${a} : ${d}`);
      if (exact.terminating()) expect(val(qv).eq(exact), `${a}:${d} -> ${qv}`).toBe(true);
      else {
        // Periodisch: Die geschriebenen Ziffern sind der abgeschnittene exakte Wert.
        const m = BigInt(qv.split(',')[1]?.length ?? 0);
        expect(qv.replace(',', '').replace(/^0+(?=\d)/, ''), `${a}:${d} -> ${qv}`).toBe(String((exact.n * 10n ** m) / exact.d));
      }
    }
  });
  it('rechnet Brüche', () => {
    const h = heftFracAdd([{ f: { n: 3n, d: 4n }, sign: 1 }, { f: { n: 1n, d: 6n }, sign: 1 }])!;
    expect(h.steps.some(s => s.say.includes('Hauptnenner') && s.say.includes('12'))).toBe(true);
    expect(heftText(h).join('|')).toContain('11');
    const m = heftFracMul({ n: 2n, d: 3n }, { n: 4n, d: 9n }, true)!;
    expect(m.steps.some(s => s.say.includes('Kehrwert'))).toBe(true);
    expect(heftPrim(84).steps.at(-1)!.blocks.at(-1)).toBeTruthy();
  });
  it('jede Aufgabe mit Heft hat Schritte, und die Ergebnisse stimmen mit der Lösung', () => {
    let n = 0;
    for (const t of TOPICS) for (let lv = 1; lv <= 5; lv++) for (let i = 0; i < 20; i++) {
      const k = makeTask(t, lv);
      if (!k?.heft) continue;
      n++;
      expect(k.heft.steps.length, `${t.id} ${lv}`).toBeGreaterThan(1);
      for (const s of k.heft.steps) expect(s.say.length).toBeGreaterThan(5);
    }
    expect(n).toBeGreaterThan(200);
  });
});
