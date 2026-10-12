/* ===== Lerntagebuch: jede gelöste Aufgabe und Klassenarbeit, für die Eltern-Ansicht ===== */
import { grade, type Exams } from './curriculum';
import { isoDay } from './plan';
import type { Activity } from './progress';
import type { Profile } from './profile';
import type { Stats } from './storage';

/** Welche Hilfe das Kind bei einer Aufgabe genutzt hat. */
export type Help = 'tipp' | 'heft' | 'gemeinsam' | 'loesung' | 'ki';

/** Eine Aufgabe aus „Üben“ oder einer Klassenarbeit. */
export interface Attempt {
  /** Zeitpunkt in ms */
  t: number;
  topic: string;
  /** Stufe 1–5 beim Üben, 0 in einer Klassenarbeit */
  lv: number;
  src: 'ueben' | 'arbeit';
  /** Aufgabe als HTML (gekürzt) */
  q: string;
  /** richtige Lösung als HTML */
  a: string;
  /** falsche Eingaben des Kindes, höchstens drei */
  wrong: string[];
  /** am Ende selbst (oder gemeinsam) gelöst */
  ok: boolean;
  /** beim ersten Versuch ohne Hilfe richtig */
  first: boolean;
  help: Help[];
  /** Hinweis der App zum typischen Fehler */
  diag?: string;
  /** Bearbeitungszeit in Sekunden (gedeckelt) */
  sec: number;
}

export interface ExamLog { t: number; id: string; name: string; p: number; secs: number; n: number }
export interface Journal { tries: Attempt[]; exams: ExamLog[] }

export const MAX_TRIES = 600;
export const MAX_SEC = 600;
const MAX_Q = 500;

export const emptyJournal = (): Journal => ({ tries: [], exams: [] });

const clip = (s: string, n = MAX_Q) => (s.length > n ? s.slice(0, n) + '…' : s);

export function addAttempt(j: Journal, a: Attempt): Journal {
  const x: Attempt = { ...a, q: clip(a.q), a: clip(a.a, 200), wrong: a.wrong.slice(-3).map(w => clip(w, 60)), sec: Math.max(0, Math.min(MAX_SEC, Math.round(a.sec))) };
  return { ...j, tries: [...j.tries, x].slice(-MAX_TRIES) };
}
export function addExam(j: Journal, e: ExamLog): Journal {
  return { ...j, exams: [...j.exams, e].slice(-100) };
}

/* ===== Auswertung ===== */

export type TopicState = 'stark' | 'gut' | 'ueben' | 'hilfe' | 'neu';
export interface TopicRow {
  id: string; level: number;
  /** Aufgaben im Tagebuch / laut Stufen-Zähler */
  n: number; right: number;
  firstRate: number | null;
  helpRate: number | null;
  /** falsch oder nur mit Lösung in den letzten 10 Aufgaben */
  recentMiss: number;
  lastAt: number | null;
  sec: number;
  state: TopicState;
  /** häufigste Fehlerhinweise mit Anzahl */
  diags: { text: string; n: number }[];
}

export interface DaySum { day: string; tasks: number; right: number; sec: number }

export interface Report {
  made: number;
  name: string;
  days: { active7: number; active30: number; total: number };
  tasks: { all: number; right: number; last7: number; last30: number };
  firstRate: number | null;
  helpRate: number | null;
  sec7: number; secAll: number;
  helpUse: Record<Help, number>;
  last14: DaySum[];
  topics: TopicRow[];
  weak: TopicRow[];
  mistakes: Attempt[];
  exams: (ExamLog & { note: number })[];
  examBest: { id: string; best: number; note: number; tries: number; at: string }[];
}

const rate = (k: number, n: number) => (n ? k / n : null);

function stateOf(r: Omit<TopicRow, 'state'>): TopicState {
  if (!r.n) return 'neu';
  const ten = Math.min(10, r.n);
  if (r.recentMiss >= Math.max(3, ten * 0.4)) return 'hilfe';
  if ((r.firstRate ?? 1) < 0.5 && r.n >= 5) return 'ueben';
  if (r.recentMiss >= 2) return 'ueben';
  if (r.level >= 4 && (r.firstRate ?? 1) >= 0.75) return 'stark';
  return 'gut';
}

/** Ein Schritt zurück: Fehlversuch oder ohne eigene Lösung. */
const missed = (a: Attempt) => !a.ok || a.help.includes('loesung') || a.wrong.length > 0;

/**
 * Fasst Tagebuch, Stufen und Lerntage zu einem Bericht zusammen.
 * Ältere Aufgaben vor dem Tagebuch kennt nur der Stufen-Zähler, sie zählen bei „Aufgaben“ mit.
 */
export function buildReport(j: Journal, stats: Stats, act: Activity, exams: Exams, profile: Profile | null, now = Date.now()): Report {
  const today = isoDay(new Date(now));
  const dayOf = (t: number) => isoDay(new Date(t));
  const back = (k: number) => { const d = new Date(now); d.setDate(d.getDate() - k); return isoDay(d); };
  const d7 = back(6), d30 = back(29);
  const activeDays = Object.keys(act).filter(d => (act[d].tasks || act[d].right || act[d].exams) && d <= today);

  const ids = [...new Set([...Object.keys(stats), ...j.tries.map(a => a.topic)])];
  const topics: TopicRow[] = ids.map(id => {
    const ts = j.tries.filter(a => a.topic === id && a.src === 'ueben');
    const all = j.tries.filter(a => a.topic === id);
    const st = stats[id];
    const last10 = ts.slice(-10);
    const dc = new Map<string, number>();
    for (const a of all) if (a.diag) dc.set(a.diag, (dc.get(a.diag) ?? 0) + 1);
    const row = {
      id, level: st?.level ?? 1,
      n: Math.max(st?.total ?? 0, ts.length), right: Math.max(st?.right ?? 0, ts.filter(a => a.ok).length),
      firstRate: rate(ts.filter(a => a.first).length, ts.length),
      helpRate: rate(ts.filter(a => a.help.length).length, ts.length),
      recentMiss: last10.filter(missed).length,
      lastAt: all.length ? all[all.length - 1].t : null,
      sec: all.reduce((s, a) => s + a.sec, 0),
      diags: [...dc].map(([text, n]) => ({ text, n })).sort((a, b) => b.n - a.n).slice(0, 3),
    };
    return { ...row, state: stateOf(row) };
  });
  const order: TopicState[] = ['hilfe', 'ueben', 'gut', 'stark', 'neu'];
  topics.sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state) || (b.lastAt ?? 0) - (a.lastAt ?? 0));

  const ue = j.tries.filter(a => a.src === 'ueben');
  const helpUse: Record<Help, number> = { tipp: 0, heft: 0, gemeinsam: 0, loesung: 0, ki: 0 };
  for (const a of ue) for (const h of a.help) if (h in helpUse) helpUse[h]++;

  const last14: DaySum[] = Array.from({ length: 14 }, (_, i) => {
    const day = back(13 - i);
    const ts = j.tries.filter(a => dayOf(a.t) === day);
    return { day, tasks: Math.max(act[day]?.tasks ?? 0, ts.filter(a => a.src === 'ueben').length), right: act[day]?.right ?? ts.filter(a => a.ok).length, sec: ts.reduce((s, a) => s + a.sec, 0) };
  });
  const inLast = (from: string) => Object.keys(act).filter(d => d >= from && d <= today).reduce((s, d) => s + act[d].tasks, 0);

  return {
    made: now,
    name: profile?.name ?? '',
    days: { active7: activeDays.filter(d => d >= d7).length, active30: activeDays.filter(d => d >= d30).length, total: activeDays.length },
    tasks: { all: Object.values(stats).reduce((s, t) => s + t.total, 0), right: Object.values(stats).reduce((s, t) => s + t.right, 0), last7: inLast(d7), last30: inLast(d30) },
    firstRate: rate(ue.filter(a => a.first).length, ue.length),
    helpRate: rate(ue.filter(a => a.help.length).length, ue.length),
    sec7: j.tries.filter(a => dayOf(a.t) >= d7).reduce((s, a) => s + a.sec, 0),
    secAll: j.tries.reduce((s, a) => s + a.sec, 0),
    helpUse,
    last14,
    topics,
    weak: topics.filter(t => t.state === 'hilfe' || t.state === 'ueben'),
    mistakes: j.tries.filter(missed).slice(-60).reverse(),
    exams: j.exams.slice().reverse().map(e => ({ ...e, note: grade(e.p).note })),
    examBest: Object.entries(exams).map(([id, e]) => ({ id, best: e.best, note: grade(e.best).note, tries: e.tries, at: e.at })),
  };
}

/* ===== Bericht als Link teilen (ohne Server): komprimiert im #-Teil der Adresse ===== */

export interface Snapshot { v: 1; made: number; profile: Profile | null; stats: Stats; exams: Exams; act: Activity; journal: Journal }

const b64u = (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(t, c => c.charCodeAt(0)); };

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Für den Link reichen die letzten 60 Lerntage und 250 Aufgaben. */
export function snapshot(profile: Profile | null, stats: Stats, exams: Exams, act: Activity, j: Journal, now = Date.now()): Snapshot {
  const days = Object.keys(act).sort().slice(-60);
  return { v: 1, made: now, profile, stats, exams, act: Object.fromEntries(days.map(d => [d, act[d]])), journal: { tries: j.tries.slice(-250), exams: j.exams.slice(-30) } };
}
export async function encodeSnapshot(s: Snapshot): Promise<string> {
  return b64u(await pipe(new TextEncoder().encode(JSON.stringify(s)), new CompressionStream('deflate-raw')));
}
export async function decodeSnapshot(code: string): Promise<Snapshot | null> {
  try {
    const s = JSON.parse(new TextDecoder().decode(await pipe(unb64u(code), new DecompressionStream('deflate-raw')))) as Snapshot;
    return s && s.v === 1 && s.journal && s.stats ? s : null;
  } catch { return null; }
}
export const SHARE_KEY = 'bericht';
