import { useEffect, useState } from 'react';
import { AiError, explain, type ExplainRequest, type TutorContext } from '../ai';
import { md } from '../markdown';
import { AccessCode } from './AccessCode';
import { Html } from './Html';

/** „Erklär es mir anders“: Die KI bekommt nur den fertigen Rechenweg der Engine. */
export function AiExplain({ req, onAskTutor }: { req: ExplainRequest; onAskTutor: (ctx: TutorContext) => void }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string; needsCode?: boolean }>({ status: 'idle' });
  useEffect(() => setState({ status: 'idle' }), [req.task, req.steps]);

  const run = async () => {
    setState({ status: 'loading' });
    try { setState({ status: 'done', text: await explain(req) }); }
    catch (e) { setState({ status: 'error', text: e instanceof Error ? e.message : String(e), needsCode: e instanceof AiError && e.needsCode }); }
  };
  return (
    <div className="ai card">
      <div className="actions">
        <button className="btn soft" onClick={run} disabled={state.status === 'loading'}>🤖 Erklär es mir anders</button>
        <button className="btn quiet" onClick={() => onAskTutor({ title: req.task, topic: req.topic, steps: req.steps })}>💬 Ich habe eine Frage</button>
      </div>
      {state.status === 'loading' && <div className="ai-out"><p className="thinking">Einen Moment, ich überlege mir eine einfache Erklärung …</p></div>}
      {state.status === 'done' && <Html className="ai-out" html={md(state.text || '')} />}
      {state.status === 'error' && <div className="ai-out"><p className="ai-note">{state.text}</p>{state.needsCode && <AccessCode onSaved={run} />}</div>}
      <p className="ai-note">Die KI erklärt nur. Gerechnet hat die App selbst, ganz genau.</p>
    </div>
  );
}
