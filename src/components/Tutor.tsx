import { useEffect, useRef, useState } from 'react';
import { AiError, askTutor, type ChatTurn, type TutorContext } from '../ai';
import { md } from '../markdown';
import { AccessCode } from './AccessCode';
import { Html } from './Html';

interface Msg extends ChatTurn { checks?: string[]; error?: boolean }
const SUGGESTIONS = ['Warum gilt Punkt vor Strich?', 'Was ist ein Hauptnenner?', 'Wie rechne ich 3/4 : 1/2?', 'Wie löse ich 4x − 7 = 13?'];

export function Tutor({ context, onClearContext, onBuch }: { context: TutorContext | null; onClearContext: () => void; onBuch?: () => void }) {
  const [chat, setChat] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  // Geschweifte Klammern: Neuere Browser geben bei scrollIntoView ein Promise zurück, das React sonst als Aufräum-Funktion aufrufen würde.
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [chat, busy]);

  const send = async (text: string) => {
    if (busy || !text.trim()) return;
    const history: Msg[] = [...chat.filter(m => !m.error), { role: 'user', content: text.trim() }];
    setChat(history);
    setDraft('');
    setBusy(true);
    try {
      const r = await askTutor(history.map(({ role, content }) => ({ role, content })), context);
      setChat([...history, { role: 'assistant', content: r.text, checks: r.checks }]);
      setNeedsCode(false);
    } catch (e) {
      setChat([...history, { role: 'assistant', content: e instanceof Error ? e.message : String(e), error: true }]);
      setNeedsCode(e instanceof AiError && e.needsCode);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card panel">
      <h1 className="h1">💬 Fragen</h1>
      <p className="lead">Frag einfach, was du nicht verstehst. Es gibt keine dummen Fragen!</p>
      {context && <div className="ctx">Es geht um: <b>{context.title}</b><button onClick={onClearContext}>entfernen</button></div>}
      <div className="chat" aria-live="polite">
        {!chat.length && <div className="msg assistant"><p>Hallo! 😊 Ich bin dein Mathe-Helfer. Schick mir eine Frage oder eine Aufgabe, dann gehen wir sie zusammen durch.</p></div>}
        {chat.map((m, i) => m.role === 'user'
          ? <div key={i} className="msg user">{m.content}</div>
          : (
            <div key={i} className="msg assistant">
              {m.error ? <p className="ai-note">{m.content}</p> : <Html html={md(m.content)} />}
              {!!m.checks?.length && <div className="checks">{m.checks.map((c, j) => <span key={j} className="check">✓ nachgerechnet: {c}</span>)}</div>}
            </div>
          ))}
        {busy && <div className="msg assistant"><p className="thinking">Ich denke nach …</p></div>}
        <div ref={endRef} />
      </div>
      {needsCode && <AccessCode onSaved={() => setNeedsCode(false)} />}
      {!chat.length && onBuch && <button className="btn soft wide" onClick={onBuch}>📸 Aufgabe aus dem Buch fotografieren</button>}
      {!chat.length && <div className="try"><span>Zum Beispiel:</span>{SUGGESTIONS.map(s => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>}
      <form className="chatform" onSubmit={e => { e.preventDefault(); send(draft); }}>
        <textarea id="chatin" rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Deine Frage …" aria-label="Deine Frage"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }} />
        <button className="btn big" type="submit" disabled={busy || !draft.trim()}>Senden ➤</button>
      </form>
    </section>
  );
}
