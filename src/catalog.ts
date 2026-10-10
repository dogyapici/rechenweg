/* ===== Welche Themen die App kennt (ohne Abhängigkeiten, damit auch der Server es nutzen kann) ===== */
export interface CatalogEntry { id: string; title: string; covers: string }

/** Für die Zuordnung eines Themenzettels: Was gehört alles zu einem App-Thema? */
export const CATALOG: CatalogEntry[] = [
  { id: 'pvs', title: 'Punkt vor Strich', covers: 'Rechenregeln, Klammern, Punkt vor Strich, Terme mit natürlichen Zahlen berechnen, Rechengesetze, Kopfrechnen mit mehreren Rechenzeichen' },
  { id: 'kuerzen', title: 'Brüche kürzen', covers: 'Was ist ein Bruch, Anteile, Zähler und Nenner, Brüche kürzen und erweitern, ggT, Teiler, gleichwertige Brüche, Brüche vergleichen' },
  { id: 'bradd', title: 'Brüche addieren und subtrahieren', covers: 'Brüche addieren, Brüche subtrahieren, Hauptnenner, kgV, gemischte Zahlen addieren' },
  { id: 'brmul', title: 'Brüche multiplizieren und dividieren', covers: 'Brüche multiplizieren, Brüche dividieren, Kehrwert, Bruch mal natürliche Zahl, Anteile von Größen' },
  { id: 'dez', title: 'Dezimalzahlen', covers: 'Dezimalzahlen, Kommazahlen addieren, subtrahieren, multiplizieren, dividieren, Komma verschieben, Brüche in Dezimalzahlen umwandeln' },
  { id: 'proz', title: 'Prozentrechnung', covers: 'Prozent, Prozentsatz, Prozentwert, Grundwert, Dreisatz mit Prozent, Rabatt, Anteile in Prozent' },
  { id: 'gl', title: 'Gleichungen lösen', covers: 'Gleichungen, lineare Gleichungen, Variable x, Äquivalenzumformungen, Waagemodell, Gleichungen mit Klammern' },
];
export const CATALOG_IDS = CATALOG.map(c => c.id);

/** Ergebnis der Zettel-Erkennung: jeder Punkt vom Zettel, mit passendem App-Thema oder null. */
export interface ZettelPoint { text: string; topic: string | null }
export interface ZettelResult { title: string; date: string | null; points: ZettelPoint[] }
