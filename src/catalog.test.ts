import { expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { TOPICS } from './topics';

it('Katalog passt zu den Themen', () => {
  expect(CATALOG.map(c => [c.id, c.title])).toEqual(TOPICS.map(t => [t.id, t.title]));
});
