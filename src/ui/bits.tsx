import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Html } from '../components/Html';

/** Sterne für die abgeschlossenen Stufen eines Themas. */
export function Stars({ n, max = 5, label = true }: { n: number; max?: number; label?: boolean }) {
  return (
    <span className="stars" role="img" aria-label={label ? `${n} von ${max} Sternen` : undefined} aria-hidden={label ? undefined : true}>
      {Array.from({ length: max }, (_, k) => k + 1).map(i => <span key={i} className={i <= n ? 'on' : ''}>★</span>)}
    </span>
  );
}

/**
 * Rechenweg Schritt für Schritt aufdecken. Der Rechenweg kommt fertig als HTML aus der Engine;
 * hier werden nur seine Schritte (und am Ende das Ergebnis) nacheinander sichtbar gemacht.
 */
export function StepReveal({ html, all = false, start = 1 }: { html: string; all?: boolean; start?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(start);
  useLayoutEffect(() => { setShown(all ? Infinity : start); }, [html, all, start]);
  useLayoutEffect(() => {
    const units = stepUnits(ref.current);
    setTotal(units.length);
    units.forEach((u, i) => u.forEach(el => { el.hidden = i >= shown; el.classList.toggle('fresh', i === shown - 1 && shown > 1); }));
  }, [html, shown]);
  const done = shown >= total;
  return (
    <div className="reveal">
      <Html html={html} ref={ref} />
      {!done && (total > 1 || shown === 0) && (
        <div className="reveal-bar">
          <button className="btn big" onClick={() => setShown(shown + 1)}>{shown === 0 ? 'Ersten Schritt zeigen 👉' : shown === total - 1 ? 'Ergebnis zeigen 👉' : 'Nächster Schritt 👉'}</button>
          <button className="btn quiet" onClick={() => setShown(Infinity)}>Alles zeigen</button>
          <span className="reveal-n">{Math.min(shown, total)} von {total}</span>
        </div>
      )}
    </div>
  );
}

/** Teilt den Rechenweg in Einheiten: jeder Schritt einzeln, Ergebnis und Probe zusammen am Schluss. */
function stepUnits(root: HTMLElement | null): HTMLElement[][] {
  if (!root) return [];
  const units: HTMLElement[][] = [];
  const steps = root.querySelectorAll<HTMLElement>('ol.steps > li');
  steps.forEach(li => units.push([li]));
  const eq = root.querySelector('.eqrows');
  if (eq) {
    // Gleichung: eine Zeile plus ihre Erklärung ist ein Schritt. Die erste Zeile (Aufgabe + Ziel) ist immer zu sehen.
    let cur: HTMLElement[] = [];
    Array.from(eq.children as HTMLCollectionOf<HTMLElement>).forEach(el => {
      if (el.classList.contains('eqrow') && cur.length) { units.push(cur); cur = []; }
      cur.push(el);
    });
    if (cur.length) units.push(cur);
  }
  const tail = Array.from(root.querySelectorAll<HTMLElement>(':scope > .result, :scope > .extra'));
  if (tail.length) units.push(tail);
  return units;
}

/** Erklärtext in kleine Karten teilen: ein Absatz pro Karte, Bilder und Listen gehören zum Absatz davor. */
export function useTheoryCards(theory: string): string[] {
  return useMemo(() => {
    const t = document.createElement('template');
    t.innerHTML = theory;
    const cards: string[] = [];
    Array.from(t.content.children).forEach(el => {
      const starts = el.tagName === 'P' || el.classList.contains('merke');
      if (starts || !cards.length) cards.push(el.outerHTML);
      else cards[cards.length - 1] += el.outerHTML;
    });
    return cards;
  }, [theory]);
}

/** Bildschirm-Tasten für Zeichen, die auf dem Handy schwer zu finden sind. */
export function Keypad({ inputRef, value, onChange, x = false, ops = false }: { inputRef: RefObject<HTMLInputElement | null>; value: string; onChange: (v: string) => void; x?: boolean; ops?: boolean }) {
  const keys: [string, string, string][] = [['/', '/', 'Bruchstrich'], [',', ',', 'Komma'], ['-', '−', 'Minus']];
  if (ops) keys.push([' + ', '+', 'Plus'], [' · ', '·', 'Mal'], [' : ', ':', 'Geteilt'], ['(', '(', 'Klammer auf'], [')', ')', 'Klammer zu']);
  if (x) keys.push(['x', 'x', 'x'], [' = ', '=', 'Gleich']);
  keys.push([' ', '␣', 'Leerzeichen']);
  const put = (s: string | null) => {
    const el = inputRef.current;
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? value.length;
    const next = s === null ? (a === b ? value.slice(0, Math.max(0, a - 1)) + value.slice(b) : value.slice(0, a) + value.slice(b)) : value.slice(0, a) + s + value.slice(b);
    const pos = s === null ? (a === b ? Math.max(0, a - 1) : a) : a + s.length;
    onChange(next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(pos, pos); });
  };
  return (
    <div className="keypad" aria-label="Sonderzeichen">
      {keys.map(([v, l, a]) => <button key={a} type="button" aria-label={a} onMouseDown={e => e.preventDefault()} onClick={() => put(v)}>{l}</button>)}
      <button type="button" aria-label="Löschen" onMouseDown={e => e.preventDefault()} onClick={() => put(null)}>⌫</button>
    </div>
  );
}
