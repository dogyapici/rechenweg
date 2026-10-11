/* ===== Welche Themen die App kennt (ohne Abhängigkeiten, damit auch der Server es nutzen kann) ===== */
export interface CatalogEntry { id: string; title: string; covers: string }

/** Für die Zuordnung eines Themenzettels: Was gehört alles zu einem App-Thema? */
export const CATALOG: CatalogEntry[] = [
  { id: 'pvs', title: 'Punkt vor Strich', covers: 'Rechenregeln, Klammern, Punkt vor Strich, Terme mit natürlichen Zahlen berechnen, Kopfrechnen mit mehreren Rechenzeichen' },
  { id: 'teil', title: 'Teiler, Vielfache und Primzahlen', covers: 'Teiler, Vielfache, Quersumme, Teilbarkeit durch 3, Primzahlen, ggT, kgV, gemeinsame Teiler und Vielfache' },
  { id: 'groe', title: 'Größen und Einheiten', covers: 'Größen, Einheiten umrechnen, Längen, Gewichte/Massen, Zeit, Geld, km m cm mm, t kg g, h min s, Euro und Cent, Kommaschreibweise bei Größen' },
  { id: 'flae', title: 'Umfang und Flächeninhalt', covers: 'Umfang, Flächeninhalt, Flächeneinheiten, Rechteck, Quadrat, Dreieck, Parallelogramm, Trapez, zusammengesetzte Figuren, fehlende Seite berechnen' },
  { id: 'kuerzen', title: 'Brüche kürzen', covers: 'Was ist ein Bruch, Anteile, Zähler und Nenner, Brüche kürzen, Brüche erweitern, Bruchstreifen, auf einen Nenner erweitern oder kürzen, schrittweise kürzen, ggT, gleichwertige Brüche' },
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
  { id: 'brvgl', title: 'Brüche vergleichen und ordnen', covers: 'Brüche vergleichen, Brüche ordnen, größer kleiner, Brüche erweitern, Zahlengerade, Zahlenstrahl, Brüche darstellen, gemischte Zahlen, unechte Brüche, Brüche im Koordinatensystem, viele Brüche an einer Stelle' },
  { id: 'umw', title: 'Bruch, Dezimalzahl und Prozent', covers: 'Brüche in Dezimalzahlen umwandeln, Dezimalzahlen in Brüche, periodische Dezimalzahlen, abbrechende Dezimalzahlen, Bruch in Prozent, Prozent als Bruch, Zehnerbrüche, Hundertstel' },
  { id: 'rat', title: 'Rationale Zahlen', covers: 'Rationale Zahlen, negative Brüche, negative Dezimalzahlen, Betrag, Gegenzahl, Zahlengerade mit negativen Zahlen, rationale Zahlen ordnen und vergleichen, Rechnen mit rationalen Zahlen, Zahlenmengen natürliche, ganze und rationale Zahlen (N, Z, Q)' },
  { id: 'geschickt', title: 'Rechengesetze und Terme', covers: 'Rechengesetze, Kommutativgesetz, Assoziativgesetz, Distributivgesetz, Vertauschungsgesetz, Verbindungsgesetz, Verteilungsgesetz, geschickt rechnen, Rechenvorteile, Fachbegriffe Summe Differenz Produkt Quotient, Terme aufstellen, Terme gliedern' },
  { id: 'schrift', title: 'Schriftlich multiplizieren und dividieren', covers: 'schriftliche Multiplikation, schriftliche Division, schriftlich rechnen, Komma verschieben, Kommazahlen schriftlich multiplizieren und dividieren, Überschlag' },
  { id: 'kreis', title: 'Kreis', covers: 'Kreis, Radius, Durchmesser, Mittelpunkt, Kreisumfang, Kreisfläche, Pi, Halbkreis, Kreisring' },
  { id: 'einh2', title: 'Flächen- und Volumeneinheiten', covers: 'Flächeneinheiten, mm² cm² dm² m² a ha km², Volumeneinheiten, mm³ cm³ dm³ m³, Liter, Milliliter, Hohlmaße, Einheiten umrechnen' },
  { id: 'prim', title: 'Teilbarkeit und Primfaktoren', covers: 'Teilbarkeitsregeln, Teilbarkeit durch 2 3 4 5 6 9 10, Endstellenregel, Quersummenregel, Primzahlen erkennen, Primfaktorzerlegung, Primfaktoren, Potenzschreibweise' },
  { id: 'haeuf', title: 'Häufigkeiten und Diagramme', covers: 'Urliste, Häufigkeitstabelle, absolute Häufigkeit, relative Häufigkeit, Anteil in Prozent, Säulendiagramm zeichnen, Streifendiagramm, Kreisdiagramm, irreführende Diagramme, Aussagen zu Diagrammen' },
  { id: 'raetsel', title: 'Zahlenrätsel, Folgen und Tabellen', covers: 'Zahlenrätsel, Platzhalter, Umkehraufgabe, Rückwärtsrechnen, Probieren, Zahlenfolgen, Muster, Wertetabelle, proportionale Tabelle prüfen' },
  { id: 'anteil', title: 'Anteile und Verhältnisse', covers: 'Anteil von einer Größe berechnen, vom Anteil auf das Ganze schließen, echte und unechte Brüche, gemischte Zahlen, Anteile aus Säulen- und Kreisdiagrammen, Bruch als Quotient, Größen teilen, Verhältnisse angeben und kürzen, Aufteilen nach Verhältnis, Verhältnis und Anteil unterscheiden' },
];
export const CATALOG_IDS = CATALOG.map(c => c.id);

/** Ergebnis der Zettel-Erkennung: jeder Punkt vom Zettel, mit passendem App-Thema oder null. */
export interface ZettelPoint { text: string; topic: string | null }
export interface ZettelResult { title: string; date: string | null; points: ZettelPoint[] }
