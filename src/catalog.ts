/* ===== Welche Themen die App kennt (ohne Abhängigkeiten, damit auch der Server es nutzen kann) ===== */
export interface CatalogEntry { id: string; title: string; covers: string }

/** Für die Zuordnung eines Themenzettels: Was gehört alles zu einem App-Thema? */
export const CATALOG: CatalogEntry[] = [
  { id: 'pvs', title: 'Punkt vor Strich', covers: 'Rechenregeln, Klammern, Punkt vor Strich, Terme mit natürlichen Zahlen berechnen, Rechengesetze, Kopfrechnen mit mehreren Rechenzeichen' },
  { id: 'teil', title: 'Teiler, Vielfache und Primzahlen', covers: 'Teiler, Vielfache, Teilbarkeitsregeln, Quersumme, Primzahlen, Primfaktorzerlegung, ggT, kgV, gemeinsame Teiler und Vielfache' },
  { id: 'groe', title: 'Größen und Einheiten', covers: 'Größen, Einheiten umrechnen, Längen, Gewichte/Massen, Zeit, Geld, km m cm mm, t kg g, h min s, Euro und Cent, Kommaschreibweise bei Größen' },
  { id: 'flae', title: 'Umfang und Flächeninhalt', covers: 'Umfang, Flächeninhalt, Flächeneinheiten, Rechteck, Quadrat, Dreieck, Parallelogramm, zusammengesetzte Figuren, fehlende Seite berechnen' },
  { id: 'kuerzen', title: 'Brüche kürzen', covers: 'Was ist ein Bruch, Anteile, Zähler und Nenner, Brüche kürzen und erweitern, ggT, Teiler, gleichwertige Brüche, Brüche vergleichen' },
  { id: 'bradd', title: 'Brüche addieren und subtrahieren', covers: 'Brüche addieren, Brüche subtrahieren, Hauptnenner, kgV, gemischte Zahlen addieren' },
  { id: 'brmul', title: 'Brüche multiplizieren und dividieren', covers: 'Brüche multiplizieren, Brüche dividieren, Kehrwert, Bruch mal natürliche Zahl, Anteile von Größen' },
  { id: 'dez', title: 'Dezimalzahlen', covers: 'Dezimalzahlen, Kommazahlen addieren, subtrahieren, multiplizieren, dividieren, Komma verschieben, Brüche in Dezimalzahlen umwandeln' },
  { id: 'neg', title: 'Negative Zahlen', covers: 'Negative Zahlen, ganze Zahlen, Zahlenstrahl, Temperatur, Kontostand, Vorzeichen, Rechnen mit negativen Zahlen, Addieren, Subtrahieren, Multiplizieren und Dividieren ganzer Zahlen' },
  { id: 'proz', title: 'Prozentrechnung', covers: 'Prozent, Prozentsatz, Prozentwert, Grundwert, Dreisatz mit Prozent, Rabatt, Anteile in Prozent' },
  { id: 'gl', title: 'Gleichungen lösen', covers: 'Gleichungen, lineare Gleichungen, Variable x, Äquivalenzumformungen, Waagemodell, Gleichungen mit Klammern' },
];
export const CATALOG_IDS = CATALOG.map(c => c.id);

/** Ergebnis der Zettel-Erkennung: jeder Punkt vom Zettel, mit passendem App-Thema oder null. */
export interface ZettelPoint { text: string; topic: string | null }
export interface ZettelResult { title: string; date: string | null; points: ZettelPoint[] }
