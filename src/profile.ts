/* ===== Schülerprofil: Klasse, Schulform, Bundesland ===== */
import { CHAPTERS } from './curriculum';

export const LAENDER = ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'] as const;

export type Schulform = 'gym' | 'real' | 'gesamt' | 'haupt' | 'grund';
export const SCHULFORMEN: { id: Schulform; name: string }[] = [
  { id: 'gym', name: 'Gymnasium' },
  { id: 'real', name: 'Realschule' },
  { id: 'gesamt', name: 'Gesamtschule, Oberschule oder Sekundarschule' },
  { id: 'haupt', name: 'Hauptschule oder Mittelschule' },
  { id: 'grund', name: 'Grundschule (Klasse 5 und 6)' },
];
/** In Berlin und Brandenburg geht die Grundschule bis Klasse 6. */
export const longPrimary = (land: string) => land === 'Berlin' || land === 'Brandenburg';

export interface Profile { name: string; klasse: number; schulform: Schulform; land: string }

/**
 * In welcher Klasse ein Thema meistens drankommt. Das ist ein Richtwert aus den Lehrplänen der Länder.
 * Die genaue Reihenfolge entscheidet oft die Schule, deshalb hat der Themenzettel immer Vorrang.
 */
const GRADE: Record<string, { gym: number; other: number }> = {
  pvs: { gym: 5, other: 5 },
  zahl: { gym: 5, other: 5 },
  rund: { gym: 5, other: 5 },
  pot: { gym: 5, other: 6 },
  koord: { gym: 5, other: 5 },
  winkel: { gym: 5, other: 6 },
  sym: { gym: 5, other: 5 },
  koerper: { gym: 5, other: 5 },
  daten: { gym: 5, other: 6 },
  prop: { gym: 6, other: 7 },
  mass: { gym: 6, other: 6 },
  groe: { gym: 5, other: 5 },
  flae: { gym: 5, other: 5 },
  teil: { gym: 6, other: 6 },
  kuerzen: { gym: 6, other: 6 },
  bradd: { gym: 6, other: 6 },
  brmul: { gym: 6, other: 6 },
  dez: { gym: 6, other: 6 },
  neg: { gym: 6, other: 7 },
  proz: { gym: 7, other: 7 },
  gl: { gym: 7, other: 8 },
  brvgl: { gym: 6, other: 6 },
  umw: { gym: 6, other: 6 },
  rat: { gym: 6, other: 7 },
  geschickt: { gym: 5, other: 5 },
  schrift: { gym: 5, other: 5 },
  kreis: { gym: 6, other: 8 },
  einh2: { gym: 6, other: 6 },
  prim: { gym: 5, other: 6 },
  haeuf: { gym: 6, other: 6 },
  raetsel: { gym: 5, other: 5 },
  anteil: { gym: 6, other: 6 },
};
export const gradeOf = (id: string, p: Profile | null) => {
  const c = curriculumFor(p);
  if (c?.grade[id]) return c.grade[id];
  return GRADE[id] ? (p?.schulform === 'gym' ? GRADE[id].gym : GRADE[id].other) : 5;
};

export type Fit = 'past' | 'now' | 'later';
/** Wiederholung aus früheren Klassen, Stoff dieses Jahres oder kommt erst später */
export const fitOf = (id: string, p: Profile): Fit => { const g = gradeOf(id, p); return g < p.klasse ? 'past' : g === p.klasse ? 'now' : 'later'; };

/** Themen bis zur eigenen Klasse sind sofort offen: Was man schon hatte oder gerade hat, muss man nicht erst freispielen. */
export const reachable = (p: Profile | null) => (p ? CHAPTERS.flatMap(c => c.topics).filter(id => gradeOf(id, p) <= p.klasse) : []);

/** Die App hat bisher Stoff bis etwa Klasse 7/8. */
export const MAX_COVERED = 8;

/** Ein konkreter Landeslehrplan, den wir gelesen und den App-Themen zugeordnet haben. */
export interface Curriculum {
  name: string;
  /** Doppeljahrgang laut Plan, z. B. „5/6“ */
  band: Record<string, string>;
  /** Übliche Klasse innerhalb des Doppeljahrgangs */
  grade: Record<string, number>;
  /** Was der Plan für diese Stufen vorsieht, die App aber noch nicht kann */
  missing: Record<string, string[]>;
  sources: { label: string; url: string }[];
}

/**
 * Bildungsplan Gymnasium Baden-Württemberg, Mathematik (gelesen am 10.10.2026).
 * Klassen 5/6 aus der überarbeiteten Fassung V3.0 vom 21.05.2026, Klassen 7/8 aus dem Bildungsplan 2016.
 * Brüche (kürzen, alle vier Grundrechenarten), Dezimalzahlen und Zahlterme stehen in 5/6 (3.1.1 Nr. 10–18, 23–27),
 * Prozentrechnung und Äquivalenzumformungen in 7/8 (3.2.1 Nr. 2 und 19). In 5/6 werden Gleichungen nur durch Probieren gelöst.
 */
const BW_GYM: Curriculum = {
  name: 'Bildungsplan Baden-Württemberg, Gymnasium',
  band: { zahl: '5/6', rund: '5/6', pot: '5/6', koord: '5/6', winkel: '5/6', sym: '5/6', koerper: '5/6', daten: '5/6', prop: '5/6', mass: '5/6', pvs: '5/6', teil: '5/6', groe: '5/6', flae: '5/6', neg: '5/6', kuerzen: '5/6', bradd: '5/6', brmul: '5/6', dez: '5/6', proz: '7/8', gl: '7/8', brvgl: '5/6', umw: '5/6', rat: '5/6', geschickt: '5/6', schrift: '5/6', kreis: '5/6', einh2: '5/6', prim: '5/6', haeuf: '5/6', raetsel: '5/6', anteil: '5/6' },
  grade: { zahl: 5, rund: 5, pot: 5, koord: 5, winkel: 5, sym: 5, koerper: 5, daten: 6, prop: 6, mass: 6, pvs: 5, groe: 5, flae: 5, teil: 6, neg: 6, kuerzen: 6, bradd: 6, brmul: 6, dez: 6, proz: 7, gl: 7, brvgl: 6, umw: 6, rat: 6, geschickt: 5, schrift: 5, kreis: 6, einh2: 6, prim: 5, haeuf: 6, raetsel: 5, anteil: 6 },
  missing: {
    '5/6': ['Schrägbilder, Grund- und Aufriss zeichnen', 'Senkrechte und Parallelen zeichnen, Abstände', 'Dreiecks- und Viereckarten mit ihren Eigenschaften',
      'Andere Zahlsysteme (römische Zahlen, Zweiersystem)', 'Größen schätzen', 'Zusammengesetzte Körper'],
    '7/8': ['Zinsrechnung', 'Terme mit Variablen und Klammern', 'Binomische Formeln', 'Wurzeln und reelle Zahlen', 'Lineare Gleichungssysteme',
      'Quadratische Gleichungen', 'Lineare und quadratische Funktionen'],
  },
  sources: [
    { label: 'Bildungsplan Mathematik Gymnasium (Fassung V3.0)', url: 'https://www.bildungsplaene-bw.de/,Lde/DE_BW_BILDUNGSPLAENE_GEN2X_BPBW_ALLG_GYM_M(V3.0)' },
    { label: 'Bildungsplan 2016, Klassen 7/8', url: 'https://www.bildungsplaene-bw.de/,Lde/LS/BP2016BW/ALLG/GYM/M/IK/7-8/01' },
  ],
};

/** Der genau eingelesene Lehrplan für dieses Profil, falls es einen gibt. */
export function curriculumFor(p: Profile | null): Curriculum | null {
  if (p?.land === 'Baden-Württemberg' && p.schulform === 'gym') return BW_GYM;
  return null;
}
/** Doppeljahrgang einer Klasse, z. B. 6 → „5/6“ */
export const bandOf = (klasse: number) => (klasse <= 6 ? '5/6' : klasse <= 8 ? '7/8' : '9/10');
