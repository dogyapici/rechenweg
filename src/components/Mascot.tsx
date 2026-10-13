import type { ReactNode } from 'react';
import type { Mood } from '../mascot';

const INK = '#1b2547';

/**
 * Plusi, das Maskottchen: ein rundes blaues Wesen mit Plus-Antenne.
 * Selbst gezeichnet (kein fremdes Bild). Die Bewegungen stecken im CSS (.mascot.m-…),
 * bei „Bewegung reduzieren“ bleibt nur der Gesichtsausdruck.
 */
export function Mascot({ mood = 'idle', size = 80, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const joy = mood === 'happy' || mood === 'cheer';
  return (
    <svg className={`mascot m-${mood} ${className}`} width={size} height={size * 130 / 120} viewBox="0 0 120 130" aria-hidden="true" focusable="false">
      <ellipse className="m-shadow" cx="60" cy="125" rx="30" ry="4" />
      <g className="m-jump">
        <g className="m-body">
          <ellipse cx="45" cy="115" rx="11" ry="6.5" fill="#2a4fc0" />
          <ellipse cx="75" cy="115" rx="11" ry="6.5" fill="#2a4fc0" />
          <g className="m-ant">
            <path d="M60 31 Q58 22 60 16" fill="none" stroke="#2a4fc0" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="11" r="9" fill="#ffc93c" stroke="#e0a100" strokeWidth="1.5" />
            <path d="M60 6.5v9M55.5 11h9" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="M60 27C89 27 103 47 103 75C103 103 85 117 60 117C35 117 17 103 17 75C17 47 31 27 60 27Z" fill="#4f7cff" />
          <path d="M34 42C40 34 50 31 58 31" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="60" cy="102" rx="24" ry="12" fill="#dfe8ff" />
          <ellipse cx="33" cy="80" rx="6.5" ry="4" fill="#ff8fa3" opacity=".7" />
          <ellipse cx="87" cy="80" rx="6.5" ry="4" fill="#ff8fa3" opacity=".7" />
          <g className="m-arm m-arm-l"><ellipse cx="22" cy="84" rx="7.5" ry="13" fill="#3d68f0" stroke="#2a4fc0" strokeWidth="1.5" /></g>
          <g className="m-arm m-arm-r"><ellipse cx="98" cy="84" rx="7.5" ry="13" fill="#3d68f0" stroke="#2a4fc0" strokeWidth="1.5" /></g>
          <Eyes mood={mood} />
          {mood === 'oops' && <path d="M37 50L53 46M67 46L83 50" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
          {mood === 'think' && <path d="M38 47Q46 43 54 47M67 44L82 46" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
          <Mouth mood={mood} />
        </g>
      </g>
      {joy && (
        <g className="m-sparks">
          <Spark x={12} y={32} /><Spark x={106} y={26} s={1.2} /><Spark x={104} y={70} s={0.8} /><Spark x={10} y={72} s={0.9} />
        </g>
      )}
      {mood === 'think' && <text className="m-q" x="100" y="34" fontSize="26" fontWeight="800" fill="#4f7cff">?</text>}
    </svg>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'happy' || mood === 'cheer') {
    return <path className="m-eyes" d="M37 64Q46 53 55 64M65 64Q74 53 83 64" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />;
  }
  return (
    <g className="m-eyes">
      <circle cx="46" cy="62" r="11" fill="#fff" />
      <circle cx="74" cy="62" r="11" fill="#fff" />
      <g className="m-pupils">
        <circle cx="47" cy="63" r="6" fill={INK} /><circle cx="75" cy="63" r="6" fill={INK} />
        <circle cx="49" cy="60.5" r="2" fill="#fff" /><circle cx="77" cy="60.5" r="2" fill="#fff" />
      </g>
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'happy' || mood === 'cheer' || mood === 'wave') {
    return (
      <g className="m-mouth">
        <path d="M47 81Q60 101 73 81Z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="2" />
        <ellipse cx="60" cy="89.5" rx="6" ry="2.6" fill="#ff7a8a" />
      </g>
    );
  }
  if (mood === 'oops') return <path className="m-mouth" d="M50 88Q55 84 60 88Q65 92 70 88" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
  if (mood === 'think') return <ellipse className="m-mouth" cx="63" cy="87" rx="3.5" ry="4" fill={INK} />;
  return <path className="m-mouth" d="M50 83Q60 93 70 83" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
}

function Spark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><path className="m-spark" d="M0-8C1-2 2-1 8 0C2 1 1 2 0 8C-1 2-2 1-8 0C-2-1-1-2 0-8Z" fill="#ffc93c" /></g>;
}

/** Plusi mit Sprechblase daneben. `bump` startet die Bewegung neu, wenn sich die Stimmung nicht ändert. */
export function MascotSays({ mood, size = 72, children, onPoke, label, bump }: { mood: Mood; size?: number; children: ReactNode; onPoke?: () => void; label?: string; bump?: number | string }) {
  return (
    <div className="m-says">
      {onPoke
        ? <button className="m-poke" onClick={onPoke} aria-label={label ?? 'Plusi antippen'}><Mascot key={bump} mood={mood} size={size} /></button>
        : <Mascot key={bump} mood={mood} size={size} />}
      <div className="m-bubble">{children}</div>
    </div>
  );
}
