/* ===== Welche Themen die App kennt (ohne Abhängigkeiten, damit auch der Server es nutzen kann) ===== */
export interface CatalogEntry { id: string; title: string; covers: string }

/** Für die Zuordnung eines Themenzettels: Was gehört alles zu einem App-Thema? */
export const CATALOG: CatalogEntry[] = [
  { id: 'pvs', title: 'Punkt vor Strich', covers: 'Rechenregeln, Klammern, Punkt vor Strich, Terme mit natürlichen Zahlen berechnen, Kopfrechnen mit mehreren Rechenzeichen' },
  { id: 'teil', title: 'Teiler, Vielfache und Primzahlen', covers: 'Teiler, Vielfache, Quersumme, Teilbarkeit durch 3, Primzahlen, ggT, kgV, gemeinsame Teiler und Vielfache' },
  { id: 'groe', title: 'Größen und Einheiten', covers: 'Größen, Einheiten umrechnen, Längen, Gewichte/Massen, Zeit, Geld, km m cm mm, t kg g, h min s, Euro und Cent, Kommaschreibweise bei Größen' },
  { id: 'flae', title: 'Umfang und Flächeninhalt', covers: 'Umfang, Flächeninhalt, Flächeneinheiten, Rechteck, Quadrat, Dreieck, Parallelogramm, Trapez, zusammengesetzte Figuren, fehlende Seite berechnen' },
  { id: 'kuerzen', title: 'Brüche kürzen', covers: 'Was ist ein Bruch, Anteile, Zähler und Nenner, Brüche kürzen, ggT, Teiler, gleichwertige Brüche' },
  { id: 'bradd', title: 'Brüche addieren und subtrahieren', covers: 'Brüche addieren, Brüche subtrahieren, Hauptnenner, kgV' },
  { id: 'brmul', title: 'Brüche multiplizieren und dividieren', covers: 'Brüche multiplizieren, Brüche dividieren, Kehrwert, Bruch mal natürliche Zahl, Anteile von Größen' },
  { id: 'dez', title: 'Dezimalzahlen', covers: 'Dezimalzahlen, Kommazahlen addieren, subtrahieren, multiplizieren, dividieren, Komma verschieben' },
  { id: 'neg', title: 'Negative Zahlen', covers: 'Negative Zahlen, ganze Zahlen, Zahlenstrahl, Temperatur, Kontostand, Vorzeichen, Rechnen mit negativen Zahlen, Addieren, Subtrahieren, Multiplizieren und Dividieren ganzer Zahlen' },
  { id: 'proz', title: 'Prozentrechnung', covers: 'Prozent, Prozentsatz, Prozentwert, Grundwert, Dreisatz mit Prozent, Rabatt, Anteile in Prozent' },
  { id: 'gl', title: 'Gleichungen lösen', covers: 'Gleichungen, lineare Gleichungen, Variable x, Äquivalenzumformungen, Waagemodell, Gleichungen mit Klammern' },
  { id: 'zahl', title: 'Große Zahlen und Stellenwerte', covers: 'Große Zahlen, Millionen, Milliarden, Stellenwerttafel, Stellenwertsystem, Zahlen lesen und schreiben, Zahlwörter, Vorgänger und Nachfolger, natürliche Zahlen ordnen' },
  { id: 'rund', title: 'Runden und Überschlagen', covers: 'Runden, Zahlen runden, Dezimalzahlen runden, Überschlag, Überschlagsrechnung, Schätzen, ungefähr' },
  { id: 'pot', title: 'Potenzen', covers: 'Potenzen, Basis, Exponent, Quadratzahlen, Zehnerpotenzen, Hochzahl, Potenz vor Punkt vor Strich' },
  { id: 'prop', title: 'Proportional und antiproportional', covers: 'Zuordnungen, proportional, antiproportional, Dreisatz, je mehr desto mehr, je mehr desto weniger' },
  { id: 'mass', title: 'Maßstab', covers: 'Maßstab, Karten, Baupläne, Vergrößern, Verkleinern, Entfernungen auf Karten' },
  { id: 'daten', title: 'Daten, Diagramme und Mittelwert', covers: 'Daten, Strichliste, Häufigkeit, Säulendiagramm, Balkendiagramm, Diagramme lesen, Mittelwert, Durchschnitt, Spannweite, Statistik' },
  { id: 'winkel', title: 'Winkel, Dreiecke und Vierecke', covers: 'Winkel messen, Winkel zeichnen, Geodreieck, Winkelarten spitz recht stumpf gestreckt überstumpf, Winkelsumme Dreieck und Viereck, Nebenwinkel, Dreiecke, Vierecke' },
  { id: 'sym', title: 'Symmetrie und Spiegeln', covers: 'Symmetrie, achsensymmetrisch, Symmetrieachse, punktsymmetrisch, Spiegeln, Spiegelbild, Figuren spiegeln' },
  { id: 'koerper', title: 'Körper und Netze', covers: 'Körper, Würfel, Quader, Pyramide, Prisma, Zylinder, Kegel, Ecken Kanten Flächen, Netze, Würfelnetz, Volumen, Rauminhalt, Oberfläche' },
  { id: 'koord', title: 'Koordinatensystem', covers: 'Koordinatensystem, Koordinaten, Punkte eintragen, Punkte ablesen, x-Achse, y-Achse, Figuren im Koordinatensystem, Quadranten' },
];
export const CATALOG_IDS = CATALOG.map(c => c.id);

/** Ergebnis der Zettel-Erkennung: jeder Punkt vom Zettel, mit passendem App-Thema oder null. */
export interface ZettelPoint { text: string; topic: string | null }
export interface ZettelResult { title: string; date: string | null; points: ZettelPoint[] }
