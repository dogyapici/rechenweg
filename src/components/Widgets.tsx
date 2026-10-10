import { useRef, useState, type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { Keypad } from '../ui/bits';
import type { Task } from '../gen';
import { LETTERS, axisSVG, cellsValue, decodePoint, encodePoint, pointH, valueCells, type Widget } from '../widgets';
import { Html } from './Html';

type W<K extends Widget['kind']> = Extract<Widget, { kind: K }>;
interface P<K extends Widget['kind']> { w: W<K>; value: string; onChange: (v: string) => void; locked?: boolean }

/** Eingabe für eine Aufgabe: Tippen mit Tastenfeld oder das passende Widget. */
export function AnswerInput({ task, value, onChange, inputRef, locked }: { task: Task; value: string; onChange: (v: string) => void; inputRef: RefObject<HTMLInputElement | null>; locked?: boolean }) {
  const w = task.widget;
  if (!w) return (
    <>
      <input ref={inputRef} value={value} onChange={e => onChange(e.target.value)} placeholder={task.placeholder || 'Deine Lösung'} aria-label="Deine Lösung" />
      <Keypad inputRef={inputRef as RefObject<HTMLInputElement>} value={value} onChange={onChange} />
    </>
  );
  if (w.kind === 'point') return <PointWidget w={w} value={value} onChange={onChange} locked={locked} />;
  if (w.kind === 'mirror') return <MirrorWidget w={w} value={value} onChange={onChange} locked={locked} />;
  if (w.kind === 'angle') return <AngleWidget w={w} value={value} onChange={onChange} locked={locked} />;
  return <PickWidget w={w} value={value} onChange={onChange} locked={locked} />;
}

/** Position im SVG aus einem Klick */
function svgPos(svg: SVGSVGElement, e: { clientX: number; clientY: number }): [number, number] {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return [r.x, r.y];
}

/* Koordinatensystem: Punkt setzen */
function PointWidget({ w, value, onChange, locked }: P<'point'>) {
  const ref = useRef<SVGSVGElement>(null);
  const n = w.max - w.min, s = 300 / n, pad = 26;
  const X = (x: number) => (x - w.min) * s, Y = (y: number) => (w.max - y) * s;
  const cur = value ? decodePoint(Number(value)) : null;
  const set = (x: number, y: number) => { if (!locked) onChange(String(encodePoint(Math.max(w.min, Math.min(w.max, x)), Math.max(w.min, Math.min(w.max, y))))); };
  const click = (e: RPointerEvent<SVGSVGElement>) => { const [px, py] = svgPos(ref.current!, e); set(Math.round(px / s + w.min), Math.round(w.max - py / s)); };
  const key = (e: React.KeyboardEvent) => {
    const [x, y] = cur ?? [Math.max(0, w.min), Math.max(0, w.min)];
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (d[e.key]) { e.preventDefault(); set(x + d[e.key][0], y + d[e.key][1]); }
  };
  const lines = [];
  for (let k = 0; k <= n; k++) {
    const v = w.min + k, axisX = v === 0, axisY = v === 0;
    lines.push(<line key={`v${k}`} className={axisX ? 'ax' : 'gl'} x1={X(v)} y1={0} x2={X(v)} y2={300} />, <line key={`h${k}`} className={axisY ? 'ax' : 'gl'} x1={0} y1={Y(v)} x2={300} y2={Y(v)} />);
    if (v !== 0 || w.min === 0) lines.push(<text key={`tx${k}`} className="tk" x={X(v)} y={Math.min(300, Y(0)) + 16} textAnchor="middle">{String(v).replace('-', '−')}</text>);
    if (v !== 0) lines.push(<text key={`ty${k}`} className="tk" x={Math.max(0, X(0)) - 7} y={Y(v) + 4} textAnchor="end">{String(v).replace('-', '−')}</text>);
  }
  const poly = w.poly ? [...w.pts.map(p => [p.x, p.y]), ...(cur ? [cur] : [])] : [];
  return (
    <div className="widget">
      <svg ref={ref} className="coord" viewBox={`${-pad} ${-12} ${300 + pad + 14} ${300 + pad + 12}`} onPointerDown={click} onKeyDown={key} tabIndex={0} role="application"
        aria-label={`Koordinatensystem. Tippe auf die Stelle für ${w.label} oder benutze die Pfeiltasten.${cur ? ` Gesetzt: ${w.label}(${cur[0]}|${cur[1]})` : ''}`}>
        {lines}
        <text className="tk ax-l" x={300 + 8} y={Y(0) + 4}>x</text><text className="tk ax-l" x={X(0) + 6} y={-2}>y</text>
        {poly.length > 1 && <polygon className="poly" points={poly.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} />}
        {w.pts.map(p => <g key={p.label} className="pt given"><circle cx={X(p.x)} cy={Y(p.y)} r={5} /><text x={X(p.x) + 8} y={Y(p.y) - 8}>{p.label}</text></g>)}
        {cur && <g className="pt mine"><circle cx={X(cur[0])} cy={Y(cur[1])} r={7} /><text x={X(cur[0]) + 9} y={Y(cur[1]) - 9}>{w.label}</text></g>}
      </svg>
      <p className="widget-read">{cur ? <>Dein Punkt: <b>{w.label}</b> <Html as="b" html={pointH(cur[0], cur[1])} /></> : `Tippe auf die Stelle, an der ${w.label} liegen soll.`}</p>
    </div>
  );
}

/* Spiegeln: Kästchen anmalen */
function MirrorWidget({ w, value, onChange, locked }: P<'mirror'>) {
  const s = 26, W = w.w * s, H = w.h * s;
  const mine = value ? valueCells(BigInt(value)) : [];
  const toggle = (c: number) => {
    if (locked || w.given.includes(c)) return;
    const next = mine.includes(c) ? mine.filter(x => x !== c) : [...mine, c];
    onChange(next.length ? String(cellsValue(next)) : '');
  };
  const cells = [];
  for (let c = 0; c < w.w * w.h; c++) {
    const x = (c % w.w) * s, y = Math.floor(c / w.w) * s;
    const cls = w.given.includes(c) ? 'given' : mine.includes(c) ? 'added' : '';
    cells.push(<rect key={c} className={`mc ${cls}`} x={x} y={y} width={s} height={s} onClick={() => toggle(c)}
      role="checkbox" aria-checked={!!cls} aria-label={`Kästchen Spalte ${(c % w.w) + 1}, Zeile ${Math.floor(c / w.w) + 1}${w.given.includes(c) ? ', schon da' : ''}`}
      tabIndex={w.given.includes(c) ? -1 : 0} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(c); } }} />);
  }
  return (
    <div className="widget">
      <svg className="mirror-svg big" viewBox={`-3 -3 ${W + 6} ${H + 6}`}>
        {cells}
        <g dangerouslySetInnerHTML={{ __html: axisSVG(w.axis, s, W, H) }} />
      </svg>
      <p className="widget-read">{mine.length ? <>Du hast <b>{mine.length}</b> {mine.length === 1 ? 'Kästchen' : 'Kästchen'} angemalt. Nochmal tippen macht es wieder weiß.</> : 'Tippe auf die Kästchen, die du anmalen willst.'}</p>
    </div>
  );
}

/* Winkel zeichnen: den zweiten Schenkel drehen und am Geodreieck ablesen */
function AngleWidget({ w, value, onChange, locked }: P<'angle'>) {
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(false);
  const cx = 150, cy = w.max === 180 ? 165 : 150, R = 125;
  const deg = value ? Number(value) : 0;
  const rad = (deg * Math.PI) / 180;
  const set = (e: RPointerEvent<SVGSVGElement>) => {
    if (locked) return;
    const [x, y] = svgPos(ref.current!, e);
    let a = (Math.atan2(cy - y, x - cx) * 180) / Math.PI; if (a < 0) a += 360;
    if (w.max === 180 && a > 180) a = a > 270 ? 0 : 180;
    a = Math.round(a / 5) * 5 % 360;
    onChange(a ? String(a) : '');
  };
  const key = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 5 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? -5 : 0;
    if (!d) return; e.preventDefault();
    const n = Math.max(0, Math.min(w.max === 180 ? 180 : 355, deg + d)); onChange(n ? String(n) : '');
  };
  const ticks = [];
  for (let a = 0; a < (w.max === 180 ? 181 : 360); a += 5) {
    const r1 = a % 10 === 0 ? R - 12 : R - 7, t = (a * Math.PI) / 180;
    ticks.push(<line key={a} className="tick" x1={cx + R * Math.cos(t)} y1={cy - R * Math.sin(t)} x2={cx + r1 * Math.cos(t)} y2={cy - r1 * Math.sin(t)} />);
    if (a % 10 === 0 && (w.max === 180 || a % 30 === 0)) ticks.push(<text key={`t${a}`} className="tk sm" x={cx + (R - 22) * Math.cos(t)} y={cy - (R - 22) * Math.sin(t) + 3} textAnchor="middle">{a}</text>);
  }
  const arc = deg ? `M ${cx + 36} ${cy} A 36 36 0 ${deg > 180 ? 1 : 0} 0 ${cx + 36 * Math.cos(rad)} ${cy - 36 * Math.sin(rad)}` : '';
  return (
    <div className="widget">
      <svg ref={ref} className={`angle-w${drag ? ' drag' : ''}`} viewBox={w.max === 180 ? '0 25 300 160' : '0 0 300 300'} role="slider" tabIndex={0}
        aria-label="Winkel zeichnen" aria-valuemin={0} aria-valuemax={w.max} aria-valuenow={deg} aria-valuetext={`${deg} Grad`}
        onPointerDown={e => { setDrag(true); ref.current!.setPointerCapture(e.pointerId); set(e); }} onPointerMove={e => drag && set(e)} onPointerUp={() => setDrag(false)} onKeyDown={key}>
        <path className="protractor" d={w.max === 180 ? `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} Z` : `M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy + 0.01} Z`} />
        {ticks}
        {arc && <path className="arc" d={arc} />}
        <line className="ray" x1={cx} y1={cy} x2={cx + R + 10} y2={cy} />
        <line className="ray mine" x1={cx} y1={cy} x2={cx + (R + 10) * Math.cos(rad)} y2={cy - (R + 10) * Math.sin(rad)} />
        <circle className="knob" cx={cx + (R + 10) * Math.cos(rad)} cy={cy - (R + 10) * Math.sin(rad)} r={9} />
        <circle className="vertex" cx={cx} cy={cy} r={4} />
      </svg>
      <p className="widget-read">Zieh am Punkt, bis der Schenkel auf der richtigen Zahl steht. Lies am Geodreieck ab, wo du gerade bist.</p>
    </div>
  );
}

/* Auswahl aus Bildern */
function PickWidget({ w, value, onChange, locked }: P<'pick'>) {
  return (
    <div className="pick-grid" role="radiogroup" aria-label="Antwort auswählen">
      {w.options.map((o, k) => (
        <button key={k} type="button" role="radio" aria-checked={value === String(k + 1)} className={`pick${value === String(k + 1) ? ' on' : ''}`} disabled={locked} onClick={() => onChange(String(k + 1))}>
          <span className="pick-l">{LETTERS[k]}</span><Html as="span" className="pick-c" html={o} />
        </button>
      ))}
    </div>
  );
}
