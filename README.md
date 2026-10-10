# Rechenweg – Mathe-Coach ab Klasse 5

Eine Lern-App, mit der Schülerinnen und Schüler Mathe selbstständig lernen: erst die Idee verstehen, dann ein durchgerechnetes Beispiel ansehen, dann üben, bis es sitzt.

**Grundprinzip: Die KI rechnet nie.** Alle Ergebnisse und Rechenwege kommen aus einer eigenen, exakten Recheneinheit (Brüche mit `BigInt`, keine Rundungsfehler). Die KI (Claude) formuliert den fertigen Rechenweg nur einfacher. Im Tutor-Chat muss sie jede Rechnung über das Werkzeug `rechnen` von der Recheneinheit prüfen lassen.

## Was drin ist

- 7 Themen von Klasse 5 bis 7: Punkt vor Strich, Brüche kürzen, Brüche addieren/subtrahieren, Brüche multiplizieren/dividieren, Dezimalzahlen, Prozentrechnung, Gleichungen
- pro Thema: Theorie von null an, Beispiel mit Rechenweg, Übungen mit Tipp, Lösungsweg und Fehlererkennung (z. B. „Nenner plus Nenner“)
- drei Schwierigkeitsstufen, die sich anpassen
- Rechner, der für eigene Aufgaben jeden Schritt zeigt
- als App aufs Handy installierbar (PWA), funktioniert offline (außer KI)

## Aufbau

```
src/engine/   Recheneinheit: Bruch-Arithmetik, Parser, Rechenweg-Generator, Gleichungslöser (+ Tests)
src/topics.ts Themen, Theorie-Texte und Aufgaben-Generatoren
src/components/  React-Oberfläche
server/       KI-Anbindung (Claude) und Zugangscode-Prüfung
api/          Serverless-Funktionen für Vercel: /api/explain, /api/tutor
```

## Entwickeln

```bash
npm install
npm run dev        # Oberfläche auf http://localhost:5173 (ohne KI)
npm test           # Tests der Recheneinheit und der KI-Schicht
npm run build
```

Mit KI lokal: `npx vercel dev` und eine `.env.local` nach Vorlage von `.env.example`.

## Online stellen (Vercel)

1. Auf [vercel.com/new](https://vercel.com/new) dieses Repo importieren. Vercel erkennt Vite automatisch.
2. Unter *Settings → Environment Variables* setzen:
   - `ANTHROPIC_API_KEY`: API-Schlüssel von [console.anthropic.com](https://console.anthropic.com)
   - `APP_ACCESS_CODE`: ein selbst ausgedachter Code. Die App fragt einmal danach, damit niemand Fremdes deinen API-Schlüssel benutzt.
3. Deploy. Jeder Push auf `main` geht danach automatisch online.

## Später

Login, Fortschritt über mehrere Geräte und mehrere Schüler: dafür bietet sich Supabase an (Datenbank + Login), ohne eigenen Server.
