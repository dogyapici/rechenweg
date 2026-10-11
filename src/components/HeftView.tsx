import { useEffect, useState } from 'react';
import type { HCell, Heft, HeftBlock } from '../heft';
import { Html } from './Html';

/** Zellen, die in diesem Schritt neu dazugekommen sind, werden blau. */
function isNew(c: HCell | null, prev: HCell | null | undefined) {
  if (!c || (!c.t && !c.carry)) return false;
  return !prev || prev.t !== c.t || prev.carry !== c.carry || !!prev.o !== !!c.o || !!prev.cm !== !!c.cm;
}

function GridBlock({ b, prev }: { b: Extract<HeftBlock, { kind: 'grid' }>; prev?: HeftBlock }) {
  const cols = Math.max(1, ...b.rows.map(r => r.length));
  const pr = prev?.kind === 'grid' ? prev.rows : [];
  return (
    <div className="hk-grid" style={{ gridTemplateColumns: `repeat(${cols}, var(--k))` }} role="img" aria-label={b.rows.map(r => r.map(c => c?.t ?? ' ').join('')).join(', ')}>
      {b.rows.flatMap((row, r) => Array.from({ length: cols }, (_, c) => {
        const cell = row[c] ?? null;
        const cls = ['hk-c', cell?.u && 'u', cell?.s && 's', cell?.o && 'o', cell?.mid && 'mid', cell?.c === 'note' && 'note', isNew(cell, pr[r]?.[c]) && 'new'].filter(Boolean).join(' ');
        return (
          <span key={`${r}-${c}`} className={cls} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
            {cell?.t}
            {cell?.carry && <i className="hk-carry">{cell.carry}</i>}
            {cell?.cm && <i className="hk-cm">,</i>}
          </span>
        );
      }))}
    </div>
  );
}

function TextBlock({ b, prev }: { b: Extract<HeftBlock, { kind: 'text' }>; prev?: HeftBlock }) {
  const n0 = prev?.kind === 'text' ? prev.lines.length : 0;
  return (
    <div className="hk-text">
      {b.lines.map((l, i) => (
        <div key={i} className={`hk-line${i >= n0 ? ' new' : ''}`}>
          <Html as="span" html={l.html} />
          {l.note && <Html as="span" className="hk-note" html={l.note} />}
        </div>
      ))}
    </div>
  );
}

/** Rechnet wie an der Tafel vor: Schritt für Schritt auf kariertem Papier. */
export function HeftView({ heft, startAll = false }: { heft: Heft; startAll?: boolean }) {
  const n = heft.steps.length;
  const [k, setK] = useState(startAll ? n - 1 : 0);
  useEffect(() => { setK(startAll ? n - 1 : 0); }, [heft, startAll, n]);
  const step = heft.steps[k], prev = k > 0 ? heft.steps[k - 1] : null;
  return (
    <div className="heft">
      <div className="hk-head"><span>📝 {heft.title}</span><span className="hk-count">Schritt {k + 1} von {n}</span></div>
      <div className="hk-page">
        {step.blocks.map((b, i) => (b.kind === 'grid'
          ? <GridBlock key={i} b={b} prev={prev?.blocks[i]} />
          : <TextBlock key={i} b={b} prev={prev?.blocks[i]} />))}
      </div>
      <Html as="p" className="hk-say" html={step.say} />
      <div className="hk-nav">
        <button className="btn quiet" onClick={() => setK(k - 1)} disabled={k === 0} aria-label="Schritt zurück">←</button>
        {k < n - 1
          ? <button className="btn" onClick={() => setK(k + 1)}>Nächster Schritt 👉</button>
          : <button className="btn quiet" onClick={() => setK(0)}>Nochmal von vorn</button>}
        {k < n - 1 && <button className="linkbtn" onClick={() => setK(n - 1)}>Alles zeigen</button>}
      </div>
    </div>
  );
}
