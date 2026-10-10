import { useEffect, useRef } from 'react';

export interface Party { icon: string; title: string; text: string; kind: 'goal' | 'badge' }

const COLORS = ['#f5b301', '#2563eb', '#16a34a', '#e11d48', '#9333ea', '#f97316'];

/** Großer Erfolgsmoment: Abzeichen springt ins Bild, Konfetti regnet. */
export function Celebrate({ party, more, onClose }: { party: Party; more: number; onClose: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, [party]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="cel-t" onClick={onClose}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <i key={`${party.title}-${i}`} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 9) * 0.09}s`, '--r': `${(i * 53) % 360}deg`, '--c': COLORS[i % COLORS.length], '--s': `${0.8 + (i % 4) * 0.25}` } as React.CSSProperties} />
        ))}
      </div>
      <div className={`cel-card ${party.kind}`} onClick={e => e.stopPropagation()}>
        <div className="cel-badge" aria-hidden="true"><span>{party.icon}</span></div>
        <p className="cel-k">{party.kind === 'goal' ? 'Tagesziel geschafft!' : 'Neuer Erfolg!'}</p>
        <h2 id="cel-t">{party.title}</h2>
        <p>{party.text}</p>
        <button ref={btn} className="btn big wide" onClick={onClose}>{more ? 'Weiter 👉' : 'Super! 🎉'}</button>
      </div>
    </div>
  );
}
