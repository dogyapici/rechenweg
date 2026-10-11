/* ===== Gemeinsame Bausteine für die Aufgaben-Generatoren ===== */
import type { GuideStep } from './guide.js';
import { MathError, Q, qH, evalExpr, type Solution, type ExprSolution, type ListSolution } from './engine/index.js';
import type { Widget } from './widgets.js';

/** Eine Übungsaufgabe. `answer` und `sol` kommen immer aus der Recheneinheit. */
export interface Task {
  prompt: string;
  plain?: string;
  answer: Q;
  sol: Solution;
  needReduced?: boolean;
  diag?: (v: Q) => string | null;
  placeholder?: string;
  int?: Q;
  /** Eigene Schritte für „Gemeinsam lösen“ (sonst aus dem Rechenweg abgeleitet). */
  guide?: GuideStep[];
  /** Textaufgabe */
  word?: boolean;
  /** Antwort wird nicht getippt, sondern gezeichnet, geklickt oder ausgewählt. */
  widget?: Widget;
}
export interface Topic {
  id: string;
  klasse: number;
  title: string;
  short: string;
  theory: string;
  example?: string;
  exampleSol?: () => { prompt: string; sol: Solution };
  gen: (level: number) => Task | null;
  /** Textaufgaben für Stufe 4 und 5 (sonst aus textaufgaben.ts) */
  text?: (level: number) => Task | null;
}

export const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const M = (s: string): string => `<span class="math">${s}</span>`;
export const B = (s: string) => `<b>${s}</b>`;
export const divisors = (n: number): number[] => { const r: number[] = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
export function exprTask(s: string, o: { prompt?: string; needReduced?: boolean; diag?: (v: Q) => string | null; placeholder?: string } = {}): Task & { sol: ExprSolution } {
  const sol = evalExpr(s);
  return { prompt: o.prompt || `Berechne: ${M(sol.inputHTML)}`, plain: s, answer: sol.result, sol, needReduced: !!o.needReduced, diag: o.diag, placeholder: o.placeholder || 'Deine Lösung' };
}
export function genFrom<T>(make: () => T | null, ok: (t: T) => boolean, tries = 400): T | null { for (let i = 0; i < tries; i++) { try { const t = make(); if (t && ok(t)) return t; } catch (e) { if (!(e instanceof MathError)) throw e; } } return null; }
export const list = (steps: ListSolution['steps'], v: Q, h = qH(v, true), extra?: string[]): ListSolution => ({ kind: 'list', steps, result: v, resultHTML: h, extra });
