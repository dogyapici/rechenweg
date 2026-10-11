import type { CSSProperties } from 'react';

/** Aussehen der Themen: Symbol, Farbe und ein ganz kurzer Satz für Kinder. */
export interface Look { icon: string; color: string; teaser: string }

const LOOKS: Record<string, Look> = {
  pvs: { icon: '🎯', color: '#e8590c', teaser: 'Was rechne ich zuerst?' },
  teil: { icon: '🔢', color: '#5c7cfa', teaser: 'Welche Zahl passt hinein?' },
  groe: { icon: '📏', color: '#f08c00', teaser: 'km, kg und Minuten' },
  flae: { icon: '🟩', color: '#37b24d', teaser: 'Außen herum und innen drin' },
  kuerzen: { icon: '🍕', color: '#d6336c', teaser: 'Brüche einfacher machen' },
  bradd: { icon: '🍰', color: '#7048e8', teaser: 'Brüche plus und minus' },
  brmul: { icon: '✂️', color: '#1c7ed6', teaser: 'Brüche mal und geteilt' },
  dez: { icon: '🪙', color: '#0c8599', teaser: 'Rechnen mit Komma' },
  neg: { icon: '🌡️', color: '#1098ad', teaser: 'Zahlen unter null' },
  proz: { icon: '🏷️', color: '#2f9e44', teaser: 'Prozente wie beim Einkaufen' },
  zahl: { icon: '🔟', color: '#4263eb', teaser: 'Bis zur Million und weiter' },
  rund: { icon: '🎯', color: '#e67700', teaser: 'Ungefähr reicht oft' },
  pot: { icon: '🚀', color: '#9c36b5', teaser: 'Hoch zwei, hoch drei' },
  prop: { icon: '🛒', color: '#2b8a3e', teaser: 'Der Dreisatz' },
  mass: { icon: '🗺️', color: '#5f3dc4', teaser: 'Karten lesen' },
  daten: { icon: '📊', color: '#1971c2', teaser: 'Diagramme und Durchschnitt' },
  winkel: { icon: '📐', color: '#c92a2a', teaser: 'Messen mit dem Geodreieck' },
  sym: { icon: '🦋', color: '#d6336c', teaser: 'Spiegeln und Falten' },
  koerper: { icon: '🧊', color: '#0b7285', teaser: 'Würfel zum Drehen' },
  koord: { icon: '📍', color: '#5c940d', teaser: 'Erst gehen, dann steigen' },
  gl: { icon: '⚖️', color: '#c2255c', teaser: 'Finde das x' },
  brvgl: { icon: '⚖️', color: '#ae3ec9', teaser: 'Welcher Bruch ist größer?' },
  umw: { icon: '🔄', color: '#0b7285', teaser: '0,75 = 3/4 = 75 %' },
  rat: { icon: '❄️', color: '#1864ab', teaser: 'Minus mit Komma und Bruch' },
  geschickt: { icon: '🧠', color: '#f76707', teaser: 'Rechne geschickt' },
  schrift: { icon: '✍️', color: '#495057', teaser: 'Untereinander rechnen' },
  kreis: { icon: '⭕', color: '#e03131', teaser: 'Rund mit π' },
  einh2: { icon: '🧃', color: '#f59f00', teaser: 'm², ha und Liter' },
  prim: { icon: '🧩', color: '#3b5bdb', teaser: 'Zahlen in Bausteine zerlegen' },
  haeuf: { icon: '📈', color: '#1c7ed6', teaser: 'Umfragen auswerten' },
  raetsel: { icon: '🔍', color: '#862e9c', teaser: 'Knobeln und rückwärts rechnen' },
};
const FALLBACK: Look = { icon: '📘', color: '#1d47c9', teaser: '' };
export const look = (id: string): Look => LOOKS[id] ?? FALLBACK;

/** Sterne: einer pro abgeschlossener Stufe des Lernpfads. */
export const stars = (s?: { level: number }) => (s ? s.level - 1 : 0);

/** CSS-Variablen für die Themenfarbe. */
export const tone = (id: string) => ({ '--tc': look(id).color }) as CSSProperties;
