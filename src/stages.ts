/* ===== Lernpfad: fünf Stufen pro Thema, von ganz leicht bis zu Profi-Textaufgaben ===== */
import { autoGuide, type GuideStep } from './guide.js';
import { TEXT } from './textaufgaben.js';
import type { Task, Topic } from './topics';
import { heftFor } from './heft.js';

export const MAX_LEVEL = 5;
/** So viele richtige Aufgaben in Folge ohne Hilfe braucht es für die nächste Stufe. */
export const STREAK_UP = 3;

export interface Stage { name: string; icon: string; intro: string }
export const STAGES: Stage[] = [
  { name: 'Einstieg', icon: '🌱', intro: 'Wir fangen ganz leicht an. Schau dir bei jeder Aufgabe genau an, was gefragt ist.' },
  { name: 'Üben', icon: '💪', intro: 'Jetzt werden die Zahlen etwas größer. Der Weg bleibt derselbe wie vorher.' },
  { name: 'Schwieriger', icon: '🚀', intro: 'Jetzt kommen längere Aufgaben mit mehreren Schritten. Mach immer nur einen Schritt nach dem anderen.' },
  { name: 'Textaufgaben', icon: '📖', intro: `<p>Jetzt steckt die Mathe in einer kleinen Geschichte. So gehst du vor:</p>
    <ol><li><b>Lies</b> die Aufgabe in Ruhe, am besten zweimal.</li><li>Was ist <b>gegeben</b>? Was ist <b>gesucht</b>?</li><li>Welche <b>Rechnung</b> passt?</li><li><b>Rechne</b> Schritt für Schritt.</li><li>Schreib einen <b>Antwortsatz</b>.</li></ol>
    <p>Die erste Textaufgabe machen wir zusammen.</p>` },
  { name: 'Profi', icon: '🏆', intro: 'Profi-Aufgaben haben mehrere Schritte hintereinander. Teile sie in kleine Teile: Was musst du zuerst wissen, was danach? Die erste machen wir wieder zusammen.' },
];

export function makeTask(topic: Topic, level: number): Task | null {
  let t: Task | null = null;
  if (level >= 4) t = TEXT[topic.id]?.(level) ?? topic.text?.(level) ?? null;
  if (!t) t = topic.gen(Math.min(level, 3));
  if (t && t.heft === undefined) t.heft = heftFor(t);
  return t;
}

export const guideFor = (t: Task): GuideStep[] => (t.guide?.length ? t.guide : autoGuide(t.sol));
