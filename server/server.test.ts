import { beforeEach, describe, expect, it, vi } from 'vitest';

// Claude wird simuliert: erst ein Werkzeugaufruf, dann die Antwort.
const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({ default: class { beta = { messages: { create } }; } }));

const { tutor } = await import('./claude.js');
const { unauthorized } = await import('./http.js');

describe('Zugangscode', () => {
  beforeEach(() => { process.env.APP_ACCESS_CODE = 'geheim'; });
  const req = (code?: string) => new Request('http://x/api/tutor', { method: 'POST', headers: code ? { 'x-access-code': code } : {} });
  it('lässt den richtigen Code durch', () => expect(unauthorized(req('geheim'))).toBeNull());
  it('blockt falschen oder fehlenden Code', () => {
    expect(unauthorized(req('falsch'))?.status).toBe(401);
    expect(unauthorized(req())?.status).toBe(401);
  });
});

describe('Tutor', () => {
  it('lässt Rechnungen von der Recheneinheit prüfen', async () => {
    create
      .mockResolvedValueOnce({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'rechnen', input: { aufgabe: '3/4 : 1/2' } }] })
      .mockResolvedValueOnce({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Das Ergebnis ist 3/2.' }] });
    const r = await tutor({ messages: [{ role: 'user', content: 'Wie rechne ich 3/4 : 1/2?' }] });
    expect(r.text).toBe('Das Ergebnis ist 3/2.');
    expect(r.checks).toEqual(['3/4 : 1/2 = 3/2']);
    const second = create.mock.calls[1][0];
    const toolResult = second.messages.at(-1).content[0];
    expect(toolResult.type).toBe('tool_result');
    expect(JSON.parse(toolResult.content).ergebnis).toBe('3/2');
  });
  it('meldet unlesbare Eingaben als Werkzeugfehler', async () => {
    create.mockReset()
      .mockResolvedValueOnce({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't2', name: 'rechnen', input: { aufgabe: '5 : 0' } }] })
      .mockResolvedValueOnce({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Durch 0 geht nicht.' }] });
    await tutor({ messages: [{ role: 'user', content: '5 : 0?' }] });
    const toolResult = create.mock.calls[1][0].messages.at(-1).content[0];
    expect(toolResult.is_error).toBe(true);
  });
});
