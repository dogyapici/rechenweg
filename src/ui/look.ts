import type { CSSProperties } from 'react';

/** Aussehen der Themen: Symbol, Farbe und ein ganz kurzer Satz für Kinder. */
export interface Look { icon: string; color: string; teaser: string }

const LOOKS: Record<string, Look> = {
  pvs: { icon: '🎯', color: '#e8590c', teaser: 'Was rechne ich zuerst?' },
  kuerzen: { icon: '🍕', color: '#d6336c', teaser: 'Brüche einfacher machen' },
  bradd: { icon: '🍰', color: '#7048e8', teaser: 'Brüche plus und minus' },
  brmul: { icon: '✂️', color: '#1c7ed6', teaser: 'Brüche mal und geteilt' },
  dez: { icon: '🪙', color: '#0c8599', teaser: 'Rechnen mit Komma' },
  proz: { icon: '🏷️', color: '#2f9e44', teaser: 'Prozente wie beim Einkaufen' },
  gl: { icon: '⚖️', color: '#c2255c', teaser: 'Finde das x' },
};
const FALLBACK: Look = { icon: '📘', color: '#1d47c9', teaser: '' };
export const look = (id: string): Look => LOOKS[id] ?? FALLBACK;

/** Sterne: einer pro erreichter Stufe, aber erst nach der ersten richtigen Aufgabe. */
export const stars = (s?: { level: number; right: number }) => (s && s.right > 0 ? s.level : 0);

/** CSS-Variablen für die Themenfarbe. */
export const tone = (id: string) => ({ '--tc': look(id).color }) as CSSProperties;
