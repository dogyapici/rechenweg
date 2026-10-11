import { useEffect, useRef, useState } from 'react';
import { MathError, parseAnswer } from '../engine/index.js';
import type { GuideStep } from '../guide';
import { Keypad } from '../ui/bits';
import { Html } from './Html';

type Fb = { ok: boolean; msg: string } | null;

/** „Gemeinsam lösen“: Die Aufgabe wird Schritt für Schritt abgefragt, jede Zahl prüft die Recheneinheit. */
export function Guide({ steps, onDone }: { steps: GuideStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [wrongPick, setWrongPick] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [fb, setFb] = useState<Fb>(null);
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const step = steps[i];
  const choosing = !!step?.choose && !chosen;
  useEffect(() => { if (!choosing && !solved) inputRef.current?.focus(); }, [i, choosing, solved]);

  if (!step) return null;
  const last = i === steps.length - 1;

  const pickOption = (k: number) => {
    const o = step.choose!.options[k];
    if (o.ok) { setChosen(true); setFb({ ok: true, msg: `Genau, diese Rechnung passt! ${step.choose!.why}` }); }
    else { setWrongPick([...wrongPick, k]); setFb({ ok: false, msg: `Das passt noch nicht. ${step.choose!.why || 'Lies die Aufgabe noch einmal genau.'}` }); }
  };
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    let a;
    try { a = parseAnswer(input); }
    catch (err) { if (!(err instanceof MathError)) throw err; setFb({ ok: false, msg: err.message }); return; }
    if (step.answer.eq(a.v)) {
      if (step.needReduced && a.raw && !a.v.isRed()) { setFb({ ok: false, msg: 'Der Wert stimmt! Kürze aber noch weiter.' }); return; }
      setSolved(true); setFb({ ok: true, msg: 'Richtig!' });
    } else {
      setTries(tries + 1);
      setFb({ ok: false, msg: tries === 0 ? 'Noch nicht. Schau dir den Schritt noch einmal an.' : 'Noch nicht. Hol dir ruhig die Hilfe.' });
      if (step.hint) setHint(true);
      inputRef.current?.select();
    }
  };
  const next = () => {
    if (last) { onDone(); return; }
    setI(i + 1); setChosen(false); setWrongPick([]); setInput(''); setFb(null); setTries(0); setHint(false); setSolved(false);
  };

  return (
    <div className="guide">
      <ol className="guide-done">
        {steps.slice(0, i).map((s, k) => (
          <li key={k}><span className="gd-ok" aria-hidden="true">✓</span><span><Html as="b" html={s.title} /><Html as="span" className="gd-ex" html={s.explain} /></span></li>
        ))}
      </ol>
      <section className="guide-step">
        <div className="gs-h">
          <span className="gs-n">Schritt {i + 1} von {steps.length}</span>
          <div className="gs-bar" aria-hidden="true">{steps.map((_, k) => <i key={k} className={k < i ? 'done' : k === i ? 'on' : ''} />)}</div>
        </div>
        <Html as="h3" html={step.title} />
        {choosing ? (
          <>
            <p>{step.choose!.ask}</p>
            <div className="options">
              {step.choose!.options.map((o, k) => (
                <button key={k} className="option" disabled={wrongPick.includes(k)} onClick={() => pickOption(k)}><Html as="span" html={o.html} /></button>
              ))}
            </div>
          </>
        ) : (
          <>
            <Html className="gs-ask" html={step.ask} />
            {!solved && (
              <form className="answer" onSubmit={check} autoComplete="off">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder={step.placeholder || 'Deine Zahl'} aria-label="Antwort für diesen Schritt" />
                <Keypad inputRef={inputRef} value={input} onChange={setInput} />
                <button className="btn big wide" type="submit" disabled={!input.trim()}>Prüfen ✔</button>
              </form>
            )}
          </>
        )}
        {fb && <div className={`fb ${fb.ok ? 'right' : 'wrong'}`} role="status"><span className="fb-icon" aria-hidden="true">{fb.ok ? '✓' : '✗'}</span><span dangerouslySetInnerHTML={{ __html: fb.msg }} /></div>}
        {!solved && !choosing && hint && step.hint && <Html className="hintbox" html={'💡 ' + step.hint} />}
        {solved && <Html className="gs-explain" html={step.explain} />}
        {!solved && !choosing && (
          <div className="helpers">
            {step.hint && <button className="btn quiet" onClick={() => setHint(true)} disabled={hint}>💡 Hilfe</button>}
            {tries >= 2 && <button className="btn quiet" onClick={() => { setSolved(true); setFb({ ok: true, msg: 'So wird es gerechnet. Schau es dir in Ruhe an.' }); }}>👀 Zeig es mir</button>}
          </div>
        )}
        {solved && <button className="btn big wide" onClick={next}>{last ? 'Fertig 🎉' : 'Nächster Schritt 👉'}</button>}
      </section>
    </div>
  );
}
