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
  kuerzen: { gym: 6, other: 6 },
  bradd: { gym: 6, other: 6 },
  brmul: { gym: 6, other: 6 },
  dez: { gym: 6, other: 6 },
  proz: { gym: 7, other: 7 },
  gl: { gym: 7, other: 8 },
};
export const gradeOf = (id: string, p: Profile | null) => (GRADE[id] ? (p?.schulform === 'gym' ? GRADE[id].gym : GRADE[id].other) : 5);

export type Fit = 'past' | 'now' | 'later';
/** Wiederholung aus früheren Klassen, Stoff dieses Jahres oder kommt erst später */
export const fitOf = (id: string, p: Profile): Fit => { const g = gradeOf(id, p); return g < p.klasse ? 'past' : g === p.klasse ? 'now' : 'later'; };

/** Themen bis zur eigenen Klasse sind sofort offen: Was man schon hatte oder gerade hat, muss man nicht erst freispielen. */
export const reachable = (p: Profile | null) => (p ? CHAPTERS.flatMap(c => c.topics).filter(id => gradeOf(id, p) <= p.klasse) : []);

/** Die App hat bisher Stoff bis etwa Klasse 7/8. */
export const MAX_COVERED = 8;
