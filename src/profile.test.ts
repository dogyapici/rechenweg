import { describe, expect, it } from 'vitest';
import { curriculumFor, fitOf, gradeOf, reachable, type Profile } from './profile';

const p = (klasse: number, schulform: Profile['schulform'] = 'gym'): Profile => ({ name: '', klasse, schulform, land: 'Nordrhein-Westfalen' });

describe('Bildungsplan BW', () => {
  const bw = (klasse: number): Profile => ({ name: '', klasse, schulform: 'gym', land: 'Baden-Württemberg' });
  it('wird für Gymnasium in BW benutzt', () => {
    expect(curriculumFor(bw(6))?.band.bradd).toBe('5/6');
    expect(curriculumFor({ ...bw(6), schulform: 'real' })).toBeNull();
  });
  it('ordnet Gleichungen und Prozent in 7/8 ein', () => {
    expect(fitOf('proz', bw(6))).toBe('later');
    expect(fitOf('gl', bw(7))).toBe('now');
  });
});

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
    expect(reachable(p(5))).toEqual(['zahl', 'rund', 'pvs', 'pot', 'groe', 'flae', 'koord', 'winkel', 'sym', 'koerper', 'daten']);
    expect(reachable(p(6))).not.toContain('proz');
    expect(reachable(p(6))).toContain('prop');
    expect(reachable(p(7, 'real'))).not.toContain('gl');
    expect(reachable(null)).toEqual([]);
  });
});
