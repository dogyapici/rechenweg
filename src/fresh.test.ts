import { describe, expect, it } from 'vitest';
import { freshTask, remember, storyKey, taskKey, KEEP_TASKS, type Seen } from './fresh';
import { TOPICS, type Task, type Topic } from './topics';
import { makeTask } from './stages';

describe('Keine Wiederholungen', () => {
  it('stellt in einer Übungsrunde keine Aufgabe doppelt', () => {
    for (const t of TOPICS) for (let lv = 1; lv <= 5; lv++) {
      let seen: Seen = {};
      const keys: string[] = [];
      for (let i = 0; i < 12; i++) {
        const k = freshTask(t, lv, seen);
        if (!k) continue;
        keys.push(taskKey(k)); seen = remember(seen, t.id, k);
      }
      expect(new Set(keys).size, `${t.id} Stufe ${lv}`).toBe(keys.length);
    }
  });
  it('wechselt bei Textaufgaben die Geschichte', () => {
    let seen: Seen = {};
    const t = TOPICS.find(x => x.id === 'pvs')!;
    const a = freshTask(t, 4, seen)!; seen = remember(seen, t.id, a);
    const b = freshTask(t, 4, seen)!;
    expect(storyKey(b)).not.toBe(storyKey(a));
  });
  it('vergisst alte Aufgaben irgendwann und liefert notfalls eine bekannte', () => {
    const t = TOPICS[0];
    let seen: Seen = {};
    for (let i = 0; i < KEEP_TASKS + 30; i++) seen = remember(seen, t.id, makeTask(t, 1)!);
    expect(seen[t.id].k.length).toBeLessThanOrEqual(KEEP_TASKS);
    // Ein Thema mit nur einer Aufgabe: Die bekannte kommt trotzdem, statt gar keiner.
    const only = makeTask(t, 1)!;
    const tiny = { ...t, id: 'mini' } as Topic;
    const s2 = remember({}, 'mini', only);
    expect(freshTask(tiny, 1, s2, new Set(), 5, () => ({ ...only } as Task))).toBeTruthy();
  });
});
