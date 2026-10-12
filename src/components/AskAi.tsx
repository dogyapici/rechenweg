import { useEffect, useRef, useState } from 'react';
import { AiError, askTutor, type ChatTurn, type TutorContext } from '../ai';
import { md } from '../markdown';
import { AccessCode } from './AccessCode';
import { Html } from './Html';

interface Msg extends ChatTurn { checks?: string[]; error?: boolean }

/** Vorschläge, solange die Aufgabe offen ist, und danach. */
const OPEN = ['Ich verstehe die Aufgabe nicht.', 'Wie fange ich an?', 'Was ist hier gefragt?'];
const AFTER_WRONG = 'Warum ist meine Antwort falsch?';
const DONE = ['Warum rechnet man das so?', 'Gibt es einen einfacheren Weg?', 'Erklär mir den schwierigsten Schritt.'];

interface Props {
  context: TutorContext;
  /** Aufgabe noch nicht gelöst: Die KI hilft, verrät aber das Ergebnis nicht. */
  open: boolean;
  /** Erste Frage gestellt (zählt als Hilfe) */
  onUsed: () => void;
  onClose: () => void;
}

/** Fragen an die KI direkt bei der Aufgabe, ohne die Übung zu verlassen. */
export function AskAi({ context, open, onUsed, onClose }: Props) {
  const [chat, setChat] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [draft, setDraft] = useState('');
  const inRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { inRef.current?.focus({ preventScroll: true }); inRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, []);
  useEffect(() => { if (chat.length) endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [chat, busy]);

  const send = async (text: string) => {
    if (busy || !text.trim()) return;
    if (!chat.some(m => m.role === 'user')) onUsed();
    const history: Msg[] = [...chat.filter(m => !m.error), { role: 'user', content: text.trim() }];
    setChat(history); setDraft(''); setBusy(true);
    try {
      const r = await askTutor(history.map(({ role, content }) => ({ role, content })), { ...context, open });
      setChat([...history, { role: 'assistant', content: r.text, checks: r.checks }]);
      setNeedsCode(false);
    } catch (e) {
      setChat([...history, { role: 'assistant', content: e instanceof Error ? e.message : String(e), error: true }]);
      setNeedsCode(e instanceof AiError && e.needsCode);
    } finally { setBusy(false); }
  };

  const ideas = (open ? (context.wrong?.length ? [AFTER_WRONG, ...OPEN.slice(1)] : OPEN) : DONE).filter(i => !chat.some(m => m.content === i));
  return (
    <div className="askai">
      <div className="askai-h">
        <b>💬 Frag die KI</b>
        <button className="linkbtn" onClick={onClose}>schließen</button>
      </div>
      <p className="ai-note">{open ? 'Die KI hilft dir weiter, verrät aber nicht das Ergebnis. Das schaffst du selbst!' : 'Frag ruhig, was dir noch unklar ist.'}</p>
      {chat.length > 0 && (
        <div className="chat" aria-live="polite">
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
      )}
      {needsCode && <AccessCode onSaved={() => setNeedsCode(false)} />}
      {!busy && <div className="try">{ideas.map(s => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>}
      <form className="chatform" onSubmit={e => { e.preventDefault(); void send(draft); }}>
        <textarea ref={inRef} rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Deine Frage zur Aufgabe …" aria-label="Deine Frage zur Aufgabe"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(draft); } }} />
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>Senden ➤</button>
      </form>
    </div>
  );
}
