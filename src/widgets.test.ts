import { describe, expect, it } from 'vitest';
import { decodePoint, encodePoint, isCubeNet, mirrorAnswer, cellsValue, valueCells, type Cell } from './widgets';

describe('Widgets', () => {
  it('erkennt Würfelnetze', () => {
    const kreuz: Cell[] = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]];
    const treppe: Cell[] = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]];
    const block: Cell[] = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]];
    const reihe: Cell[] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]];
    const fuenf: Cell[] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1]];
    expect(isCubeNet(kreuz)).toBe(true);
    expect(isCubeNet(treppe)).toBe(true);
    expect(isCubeNet(block)).toBe(false);
    expect(isCubeNet(reihe)).toBe(false);
    expect(isCubeNet(fuenf)).toBe(false);
  });
  it('Punkte und Kästchen hin und zurück', () => {
    expect(decodePoint(encodePoint(-3, 4))).toEqual([-3, 4]);
    expect(valueCells(cellsValue([0, 5, 47]))).toEqual([0, 5, 47]);
  });
  it('spiegelt an der Achse', () => {
    expect(mirrorAnswer({ kind: 'mirror', w: 8, h: 6, axis: { dir: 'v', at: 4 }, given: [3, 0] })).toEqual([4, 7]);
    expect(mirrorAnswer({ kind: 'mirror', w: 8, h: 6, axis: { dir: 'p', x: 4, y: 3 }, given: [0] })).toEqual([47]);
  });
});
