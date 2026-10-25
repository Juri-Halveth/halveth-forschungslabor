# Security Research · HALVETH

**Eine Beobachtung. Ein belegbarer Befund.**

[Öffentlichen Forschungsraum öffnen](https://juri-halveth.github.io/halveth-forschungslabor/security/)

Ein gemeinsamer Einstieg für Methoden, konkrete Quellpfade, Werkzeuge und die
nächste unterscheidende Prüfung. Projektleitung: Juri / HALVETH. Entwicklung mit
KI-Unterstützung.

## Was ausführbar ist

- **Prüfplan:** sieben Forschungsfamilien, sechs Aufgaben, neun offene
  Security-Achsen, passende Werkzeuge und Wiederaufnahme. JSON- und
  Markdown-Download; die CLI verwendet denselben Kern wie der Browser.
- **Vier Gegenproben:** mehrdeutige Feldverkettung, Objektbindung,
  zurückbleibender Request-Zustand und verschiedene Chain-Sichten. Jede hat
  eine normale Gegenkontrolle und eine eigene Beleggrenze.
- **Arbeitsstand:** `Neu`, `In Arbeit`, `Erledigt`. Ein markierter Auftrag ist
  ein vom Nutzer erklärter Fortschritt. Der Klick verifiziert keinen Impact.
- **Verknüpfungen:** 18 Methoden, 13 Werkzeugprofile, sechs öffentliche
  Forschungsspuren und vier veröffentlichte Fälle anderer Forschender.

Die Seite ist statisch und benötigt keine Pakete, Anmeldung oder API-Schlüssel.
Sie führt keine Netztests, Policy-Abrufe, Scans, Exploits oder Einreichungen aus.
Formulareingaben bleiben im Arbeitsspeicher der Seite bis zum Export oder
Schließen. Ein Download enthält die eigenen Eingaben; vor Weitergabe prüfen.
Externe Quellen öffnen sich erst durch bewusstes Anklicken.

## Lokal verwenden

Vom Repository-Hauptordner:

```sh
node --test branches/security-research-hub/model.test.mjs
node branches/security-research-hub/cli.mjs fixture serialization
node branches/security-research-hub/cli.mjs plan branches/security-research-hub/example-input.json
node branches/security-research-hub/cli.mjs plan branches/security-research-hub/example-input.json --markdown
```

Die letzten beiden Befehle schreiben auf stdout. Eine gewünschte Datei lässt
sich mit einer expliziten Shell-Umleitung erzeugen. Ein freies Zielsystem ist
kein Parameter der vier Gegenproben.

Der vorhandene [Sicherheitswerkzeugkasten](../security-workbench/README.md)
enthält zusätzlich sechs Prüfplätze und einen kurzlebigen eigenen HTTP-Dienst
für Burp. Das sind eigenständige Implementierungen; der Hub stellt die Links
und begründeten Übergänge bereit.

## Datenvertrag

`buildPlan(input)` akzeptiert ausschließlich diese Felder:

```json
{
  "family": "identity",
  "environment": "OWN_LOCAL",
  "observation": "IDEA",
  "question": "Welche Identität kommt beim Objekt an?",
  "scope": {
    "target": "Eigene synthetische Fixture",
    "owner": "Lokaler Betreiber",
    "policyUrl": "",
    "allowedAction": "Feste In-Memory-Daten vergleichen"
  }
}
```

Familien: `web`, `identity`, `runtime`, `device`, `network`, `chain`, `evidence`.
Umgebungen: `PUBLIC_SOURCES`, `OWN_LOCAL`, `PROGRAM`.
Beobachtungsangaben: `IDEA`, `SOURCE`, `LOCAL`, `IMPACT`.
Auch `IMPACT` bleibt eine Nutzerangabe; eine gefüllte Policy-URL bleibt
`DECLARED_NOT_VERIFIED`. Die Ausgabe lautet höchstens
`DETERMINISTIC_RESEARCH_PLAN_ONLY`. Ungültige Felder, nicht unterstützte Werte,
kaputtes Unicode und zu lange Eingaben werden ausdrücklich abgelehnt.

## Quellen und Offenlegung

[SOURCES.md](SOURCES.md) ordnet die veröffentlichten Fälle und Regeln zu.
Der Katalog enthält neu geschriebene Zusammenfassungen und Links zu Primärquellen.
Historische Prämienbeträge werden ihren fremden, veröffentlichten Fällen
zugeschrieben. Sie sind weder eigene Einnahmen noch eine Prognose.

Private Fallnamen, Report-IDs, Anhänge, Kommunikation, Gerätebelege und lokale
Pfade werden nicht aus einem Fallordner in diesen Katalog importiert.
Das Geräteprofil enthält eine allgemeine Methodenverbindung und keine private
JBL-Offenlegung. PHP bezieht sich auf Herstellerbefunde; der TRON-Link auf den
öffentlichen Forschungsfork. Ein eigener bestätigter Zero-Day wird hierdurch
nicht behauptet.

HackerOne verlangt den aktuellen Programmscope und reproduzierbare Schritte.
Immunefi untersagt unter anderem Tests auf produktiven oder öffentlichen
Testnetz-Contracts und die vorzeitige Offenlegung vertraulicher Reports. Für
einen konkreten Auftrag wird die aktuelle Programmpolicy erneut gebunden.

## Rollenmodell

| Rolle | Aufgabe im Plan |
| --- | --- |
| HALVETH | Oberflächen, Zustand und mögliche Modelle öffnen |
| LUCINET | Differenz, Gegenprobe, Quelle und Beleggrenze prüfen |
| Rachel | Arbeitszustand, Zuständigkeit und Wiederaufnahme halten |

Diese Rollen werden vom Navigator zugeordnet. Die Ansicht startet keine
separaten Agenten und verbindet sich nicht automatisch mit einem privaten
Rachel-Board. Der JSON-Plan ist ein eigener Vertrag, kein stiller Import in ein
anderes System.

## Weiterbauen

Eine neue Methode benötigt Frage, Invariante, Gegenmodell, sichere lokale
Prüfung, Werkzeug und Primärquelle. Neue Modelle benötigen eine absichtlich
abweichende Kontrolle und eine normale Nutzung. Der öffentliche Build kopiert
ausschließlich die einzeln freigegebenen Dateipfade; benachbarte Fallakten
werden nicht automatisch veröffentlicht.

Code: MIT. Eigene Erläuterungen: CC BY 4.0. Katalogmetadaten: CC0. Verlinkte
Quellen behalten ihre Bedingungen. [Repository-Lizenzen](../../LICENSES.md).
Kontakt: `security@halveth.de`.
