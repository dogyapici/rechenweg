/** Plusi, das Maskottchen: Stimmungen und was es sagt. Die Figur selbst ist in components/Mascot.tsx. */
export type Mood = 'idle' | 'wave' | 'happy' | 'cheer' | 'think' | 'oops';
export type FbState = 'right' | 'wrong' | 'almost' | 'invalid';

/** Wie Plusi auf eine Antwort reagiert. `combo` = richtige Aufgaben in Folge ohne Hilfe. */
export function moodFor(fb: FbState, combo = 0, levelUp = false): Mood {
  if (fb === 'right') return levelUp || combo >= 2 ? 'cheer' : 'happy';
  if (fb === 'wrong') return 'oops';
  return 'think';
}

/** Was Plusi sagt, wenn man es auf der Startseite antippt. */
export const POKE = [
  'Hihi, das kitzelt! 😄',
  'Ich bin Plusi. Zusammen schaffen wir jede Aufgabe!',
  'Fehler sind okay. Aus Fehlern lernt man am meisten.',
  'Wusstest du? 0,5 und ½ sind genau gleich viel.',
  'Kleiner Tipp: Rechne immer auf Papier mit. ✏️',
  'Jeden Tag ein bisschen üben, dann wächst deine Serie! 🔥',
  'Ich glaub an dich! 💪',
  'Wusstest du? Jede Zahl mal 0 ist 0.',
];

/** Nächster Spruch, nie zweimal derselbe hintereinander. */
export function nextPoke(prev: number, rnd = Math.random): number {
  if (prev < 0) return Math.floor(rnd() * POKE.length);
  const k = Math.floor(rnd() * (POKE.length - 1));
  return k >= prev ? k + 1 : k;
}
