/* ===== Aufgaben aus dem Schulbuch: Die KI liest ab, die Recheneinheit rechnet und prüft (ohne DOM, auch im Server nutzbar) ===== */
import { MathError, parseAnswer, sg, solveAny, type EqSolution, type ExprSolution, type Q } from './engine/index.js';
import { CATALOG_IDS } from './catalog.js';

/**
 * - `rechnung`: Die Aufgabe ist selbst ein Term oder eine Gleichung.
 * - `ansatz`: Textaufgabe; die KI stellt den Term auf, die Recheneinheit rechnet ihn aus.
 * - `ki`: Die Recheneinheit kann sie nicht rechnen. Nur die Teilrechnungen der KI werden nachgeprüft.
 */
export type BuchArt = 'rechnung' | 'ansatz' | 'ki';
export interface BuchCheck { term: string; ki: string }
export interface BuchTask {
  id: string; nr: string; text: string; topic: string | null; art: BuchArt;
  /** Eingabe für die Recheneinheit, kann der Schüler korrigieren */
  rechnung: string;
  /** Ergebnis der KI zum Gegenprüfen */
  ki: string; einheit: string;
  /** nur bei `ki`: Lösungsvorschlag und Teilrechnungen der KI */
  loesung: string; checks: BuchCheck[];
}
export interface BuchResult { title: string; tasks: BuchTask[] }

/** Eine fotografierte Seite mit dem, was der Schüler schon gelöst hat. */
export interface BuchPage {
  id: string; t: number; title: string; tasks: BuchTask[];
  done: Record<string, { ok: boolean; tries: number }>;
}

const str = (x: unknown, n: number) => (typeof x === 'string' ? x.trim().slice(0, n) : '');

/** Antwort der KI säubern: nur bekannte Felder, Längen begrenzt. */
export function cleanBuch(raw: unknown): BuchResult {
  const r = (raw ?? {}) as { titel?: unknown; aufgaben?: unknown };
  const list = Array.isArray(r.aufgaben) ? r.aufgaben : [];
  const tasks = list.slice(0, 30).map((x, i): BuchTask | null => {
    const a = (x ?? {}) as Record<string, unknown>;
    const text = str(a.text, 1200);
    if (!text) return null;
    const topic = str(a.thema, 40);
    const art: BuchArt = a.art === 'rechnung' || a.art === 'ansatz' ? a.art : 'ki';
    const checks = (Array.isArray(a.teilrechnungen) ? a.teilrechnungen : []).slice(0, 12)
      .map(c => ({ term: str((c as { term?: unknown })?.term, 200), ki: str((c as { ergebnis?: unknown })?.ergebnis, 60) }))
      .filter(c => c.term);
    return {
      id: String(i + 1), nr: str(a.nr, 12) || String(i + 1), text, topic: CATALOG_IDS.includes(topic) ? topic : null, art,
      rechnung: art === 'ki' ? '' : str(a.rechnung, 300), ki: str(a.ergebnis, 60), einheit: str(a.einheit, 20),
      loesung: str(a.loesung, 1500), checks,
    };
  }).filter((t): t is BuchTask => !!t);
  return { title: str(r.titel, 80), tasks };
}

export type Solved = { sol: ExprSolution | EqSolution; err: '' } | { sol: null; err: string };
export function solve(rechnung: string): Solved {
  try { return { sol: solveAny(rechnung), err: '' }; }
  catch (e) { return { sol: null, err: e instanceof MathError ? e.message : 'Diese Rechnung kann die Recheneinheit nicht lesen.' }; }
}

/** Die eine Zahl, die herauskommen muss, oder null (z. B. Gleichung ohne Lösung). */
export const target = (sol: ExprSolution | EqSolution): Q | null => sol.result;

function read(s: string): Q | null {
  try { return parseAnswer(s).v; } catch { return null; }
}

/** Was die App mit der Aufgabe machen kann. `engine`: Ergebnis kommt von der Recheneinheit. */
export interface Plan {
  engine: boolean; sol: ExprSolution | EqSolution | null; err: string;
  /** KI und Recheneinheit kommen auf verschiedene Ergebnisse: vermutlich falsch abgelesen */
  disagree: boolean;
}
export function planTask(t: BuchTask): Plan {
  if (t.art === 'ki' || !t.rechnung.trim()) return { engine: false, sol: null, err: '', disagree: false };
  const s = solve(t.rechnung);
  if (!s.sol) return { engine: false, sol: null, err: s.err, disagree: false };
  const v = target(s.sol), k = t.ki ? read(t.ki) : null;
  return { engine: true, sol: s.sol, err: '', disagree: !!(v && k && !v.eq(k)) };
}

/** Zahl als Klartext: 3/4, bei endlichen Dezimalzahlen auch 0,75. */
export function qText(x: Q): string {
  const r = x.red();
  const t = sg(r.txt());
  return r.d !== 1n && r.terminating() && r.d <= 1000n ? `${t} = ${sg(r.toDec())}` : t;
}

export type CheckState = 'ok' | 'falsch' | 'offen';
/** Teilrechnung der KI mit der Recheneinheit nachrechnen. */
export function verify(c: BuchCheck): { state: CheckState; engine: string } {
  const s = solve(c.term);
  if (!s.sol || !s.sol.result) return { state: 'offen', engine: '' };
  const k = read(c.ki);
  const engine = (s.sol.kind === 'eq' ? 'x = ' : '') + qText(s.sol.result);
  return { state: k && k.eq(s.sol.result) ? 'ok' : k ? 'falsch' : 'offen', engine };
}

export type Verdict = { state: 'right' | 'wrong' | 'almost' | 'invalid'; msg: string };
/** Antwort des Schülers mit dem Ergebnis der Recheneinheit vergleichen. */
export function judge(sol: ExprSolution | EqSolution, input: string): Verdict {
  const v = target(sol);
  if (!v) return { state: 'invalid', msg: 'Bei dieser Aufgabe gibt es keine einzelne Zahl als Lösung. Schau dir die Lösung an.' };
  let a;
  try { a = parseAnswer(input); }
  catch (e) { return { state: 'invalid', msg: e instanceof MathError ? e.message : 'Diese Antwort kann ich nicht lesen.' }; }
  if (!a.v.eq(v)) return { state: 'wrong', msg: 'Das stimmt noch nicht.' };
  if (a.raw && !a.v.isRed()) return { state: 'almost', msg: 'Fast! Der Wert stimmt, aber du kannst den Bruch noch weiter kürzen.' };
  return { state: 'right', msg: '' };
}

/* ===== Gespeicherte Seiten ===== */
export const MAX_PAGES = 12;
export function addPage(pages: BuchPage[], r: BuchResult, now = Date.now()): BuchPage[] {
  const p: BuchPage = { id: String(now), t: now, title: r.title || 'Aufgaben aus dem Buch', tasks: r.tasks, done: {} };
  return [p, ...pages].slice(0, MAX_PAGES);
}
export const updatePage = (pages: BuchPage[], p: BuchPage) => pages.map(x => (x.id === p.id ? p : x));
