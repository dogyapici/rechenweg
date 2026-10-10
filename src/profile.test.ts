import { describe, expect, it } from 'vitest';
import { fitOf, gradeOf, reachable, type Profile } from './profile';

const p = (klasse: number, schulform: Profile['schulform'] = 'gym'): Profile => ({ name: '', klasse, schulform, land: 'Nordrhein-Westfalen' });

describe('Profil', () => {
  it('Gleichungen am Gymnasium früher', () => {
    expect(gradeOf('gl', p(7))).toBe(7);
    expect(gradeOf('gl', p(7, 'real'))).toBe(8);
  });
  it('ordnet Themen der Klasse zu', () => {
    expect(fitOf('pvs', p(6))).toBe('past');
    expect(fitOf('bradd', p(6))).toBe('now');
    expect(fitOf('proz', p(6))).toBe('later');
  });
  it('öffnet alles bis zur eigenen Klasse', () => {
    expect(reachable(p(5))).toEqual(['pvs']);
    expect(reachable(p(6))).toEqual(['pvs', 'kuerzen', 'bradd', 'brmul', 'dez']);
    expect(reachable(p(7, 'real'))).not.toContain('gl');
    expect(reachable(null)).toEqual([]);
  });
});
