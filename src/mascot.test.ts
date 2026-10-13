import { describe, expect, it } from 'vitest';
import { POKE, moodFor, nextPoke } from './mascot';

describe('Plusi', () => {
  it('reagiert passend auf Antworten', () => {
    expect(moodFor('right')).toBe('happy');
    expect(moodFor('right', 2)).toBe('cheer');
    expect(moodFor('right', 0, true)).toBe('cheer');
    expect(moodFor('wrong')).toBe('oops');
    expect(moodFor('almost')).toBe('think');
    expect(moodFor('invalid')).toBe('think');
  });
  it('sagt nie zweimal denselben Spruch hintereinander', () => {
    for (let prev = 0; prev < POKE.length; prev++)
      for (const r of [0, 0.3, 0.6, 0.999]) {
        const k = nextPoke(prev, () => r);
        expect(k).not.toBe(prev);
        expect(k).toBeGreaterThanOrEqual(0);
        expect(k).toBeLessThan(POKE.length);
      }
    expect(nextPoke(-1, () => 0)).toBe(0);
  });
});
