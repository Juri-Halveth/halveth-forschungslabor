# CIHBw-Anschluss: Portfoliowahl am 26. Oktober 2026

**Leitfrage:** Welcher bereits ausführbare HALVETH-Baustein lässt sich mit dem kleinsten ehrlichen Integrationsschritt in einen CIHBw-relevanten, dual nutzbaren Prototyp verwandeln? Dies ist ein endlicher Vergleich der unten genannten öffentlichen Stände, keine Prüfung aller denkbaren Produkte.

## Vier Ebenen pro Kandidat

| Kandidat | 0 · Vorhanden | 1 · Nächste Integration | 2 · Unterscheidende Probe | 3 · Relevante Umgebung |
| --- | --- | --- | --- | --- |
| **LAGEFADEN / SDD; cUxS als Hypothese** | C-DROHNE-Fall, ausführbarer Offline-Prüfer und ein datierter echter USGS-Katalogabruf | Lesender Adapter mit gebundener Herkunft und getrennten Zeitquellen für einen **passenden** Nutzerworkflow | Verblindet gegen Checkliste: falsch unabhängige Hinweise, Widersprüche, Bearbeitungszeit | Versioniertes Paket im abgesprochenen Arbeitsablauf mit realen Nutzern und protokollierter Abnahme |
| **Encounter Systems / SDD** | Deterministischer Scheduler, Freigabeversion, Modell-Oracle | Echter isolierter Worker statt simuliertem Partner | Unterbrechung, Widerruf und Wiederherstellung gegenüber einfacher Worker-Queue vergleichen | Unterschiedliche Geräte und reale Verzögerungen im autorisierten Testnetz |
| **Signallabor / EW-Bezug** | 64 synthetische Bits, drei Decoder, modelliertes Rauschen | Kalibrierter eigener Sender/Empfänger oder offener Testdatensatz mit lizenziertem Zugriff | Vorab gebundene Bitfehlerrate und Ausfallgrenzen gegen Baseline | Relevanter elektromagnetischer Test nur mit zuständiger Freigabe und Fachpartner |

Die Auswahl ist **LAGEFADEN**, weil Problem, Browserfall, lesender Modus und erster Gegenversuch heute konkret sind. Das ist eine Reihenfolge für Entwicklung, keine Behauptung technischer Überlegenheit. Encounter Systems bleibt ein eigenständiger SDD-Kandidat. Das Signallabor ist für einen aktuellen EW-Pitch deutlich zu weit von realer Funkhardware entfernt. Tresor ist bereits als Windows-Produkt paketiert, aber seine derzeitige Funktion als Zugangsdatenverwaltung liefert ohne spezifischen Nutzerbedarf und unabhängige Sicherheitsprüfung keinen klaren CIHBw-Fit.

## GitHub-Impulse vom 26. Oktober 2026 und ihre Verbindung

Der aktuelle Remote-main-Stand wurde gegen die heutigen PRs geprüft. [Forschungslabor #26](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/26) macht Modellbeispiele und Status sichtbar; [#28](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/28) behebt einen Grenzfall bei reduzierter Bewegung. Beide sind **gemerged** und geben LAGEFADEN ein besseres Muster für bedienbare Gegenproben, aber keinen Sensorbeleg. [Fortuna #9](https://github.com/Juri-Halveth/fortuna/pull/9) zeigt sofort eine echte lokale Rechnung statt nur einer leeren Eingabe; [#10](https://github.com/Juri-Halveth/fortuna/pull/10) stellt Ladefehler sichtbar vor den Dialog. Diese **gemergten** UI-Muster sind für den echten USGS-Fall nützlich: sichtbare Erstprobe und sichtbarer Ausfall. Der [Portfolioeingang #40](https://github.com/Juri-Halveth/Juri-Halveth.github.io/pull/40) wurde ebenfalls gemerged und erleichtert das Auffinden nach Aufgabe. Lernportal und Lernstudio erhielten heute sichtbare Überschriften nach Interaktion; das ist ein Bedienbarkeitsbeitrag, keine Datenfusion.

Ältere, materiell passende Spur: Die [Datenmuschel](https://github.com/Juri-Halveth/halveth-data-metabolism) bindet einen lesenden GitHub-Abruf an Quelle, Bytes und Zeiten. Der neue USGS-Abruf übernimmt **dieses Prinzip**, nicht den Python-Code. [C-DROHNE](https://github.com/Juri-Halveth/c-drohne-red-room) liefert den synthetischen Mehrfachmeldungsfall. [Grenzbeobachter](https://github.com/Juri-Halveth/halveth-scarlet/tree/main/forschung/grenzbeobachter) erinnert an Beobachtungsfenster und Verluste. Die offenen Drafts [Code & Messung #24](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/24) und [Open Organism Engine #25](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/25) bleiben eigene Kandidaten; sie sind nicht still in LAGEFADEN oder main integriert.

**Aktuelle real-data-Kante:** [USGS-Feed und Event-Detail](data/usgs-example.json) bilden dasselbe öffentlich katalogisierte Erdbeben mit zwei API-Darstellungen ab. Die Software erkennt die gemeinsame Event-ID; Sensorunabhängigkeit bleibt unbekannt. Eine globale öffentliche Naturereignis-Probe zeigt, dass der Datenweg ohne eigene Drohne, Radar- oder Satellitenhardware ausführbar ist. Ein militärischer Nutzerbedarf, Leistungsgewinn oder TRL-6-Stand folgt daraus nicht.

## Software-Bau-Apertur für LAGEFADEN

| Achse | Gebundener Stand | Kritische nächste Kante |
| --- | --- | --- |
| `USER_OUTCOME` | Browser macht Doppelzählung und alte Ursprungssignale sichtbar | Nutzen gegenüber Checkliste mit Nutzern messen |
| `INTERFACE` | Fünf anwählbare Fälle, Textliste, JSON-Ausgabe | Workflow mit zuständigen Anwendern gemeinsam prüfen |
| `STATE_DATA` | Striktes Eingabeschema, deklarierte Kopierkette und datierter USGS-Katalogfall | Identität und Zeit aus verlässlichem Adapter für den Zielworkflow statt frei eingegebener Kennung beziehen |
| `INTEGRATION` | Bounded read-only USGS-Abruf in einem separaten lokalen Capture-Skript; keine Betriebsintegration | Dokumentierten, lesenden Testadapter für einen relevanten Workflow definieren |
| `FAILURE_RECOVERY` | Ungültige Ketten und Zeiten brechen ab, Außenlage bleibt unbekannt | Ausfälle, verspätete Pakete und Wiederaufnahme testen |
| `SECURITY_PRIVACY` | Synthetische Übungsfälle und ein öffentlicher USGS-Snapshot; keine Accounts; die Browseransicht liest nur die lokale statische Datei | Datenminimierung, Rollen, Herkunftsbeleg und unabhängige Prüfung |
| `ACCESSIBILITY` | Semantische Überschriften, Tastatur-Buttons, Textausgabe, reduzierte Bewegung | Echter Screenreader- und Schmalbildschirmtest |
| `DELIVERY_OBSERVABILITY` | Tests, explizite Pages-Dateiliste, lokaler Preview, Abrufzeit und Rohantwort-Hashes | Versioniertes installierbares Paket, Nutzungs- und Fehlerbeleg |

## Paarvergleich ohne Scheinkonsens

- **LAGEFADEN ↔ Encounter Systems:** Lagefaden hat die klarere konkrete Anwenderfrage für CIP/MSDF-nahe Sichtungen. Encounter hat die stärkere Zustands- und Widerrufsmechanik. Eine spätere Kombination ist möglich, aber keine heutige Integration.
- **LAGEFADEN ↔ Signallabor:** Lagefaden verarbeitet Metadaten lesend; das Signallabor modelliert Signalphysik. Der erste relevante Feldtest ist für Lagefaden plausibler. Der EW-Bezug bleibt für beide unbewiesen.
- **Encounter Systems ↔ Signallabor:** Encounter hat mehr implementierte Zustandskontrollen; das Signallabor hat den direkteren fachlichen Klang zu EW, aber keine reale Funkmessung. Klangähnlichkeit wiegt nicht mehr als Implementierung.

**Priorität als Suchheuristik:** LAGEFADEN zuerst, Encounter parallel als technisches Reservoir, Signallabor später mit Fachpartner. Andere Portfolioäste bleiben offen. Wiederaufnahme: ein vom CIHBw benannter Use Case, ein Partner mit einer relevanten Testumgebung oder ein neuer, belastbarer Feld-/Integrationsbeleg kann die Reihenfolge ändern.

## Was für alle Seiten gewinnbar wäre – und wie man es prüft

Ein Lage-Team könnte dieselben Meldungen schneller und mit weniger Doppelzählung verstehen; bestehende Plattformen könnten einen kleinen, lesenden Zusatz statt eines Systemwechsels testen; betroffene Menschen hätten eine bessere Chance, dass unsichere Hinweise auch als unsicher gezeigt werden. Juri könnte einen messbaren dual-use Softwarebaustein anbieten. Jeder Nutzen ist eine **Testhypothese**, keine bereits beobachtete Wirkung. Ein unabhängiger Vergleich muss auch falsche Herkunft, neue Beobachtungen derselben Quelle und Mehrarbeit einschließen.

Eine erneute Nachricht an Jana wäre sinnvoll, wenn ein solcher Test samt Ergebnis, Produktpfad und konkretem Use Case vorliegt. Ihr Schreiben eröffnet proaktiven Kontakt bei Ausgründung **und/oder** weiterem Reifegrad; die Zusammenarbeit setzt laut ihrem Wortlaut **TRL mindestens 6 und Use-Case-Fit** voraus. Ein laufender Browserfall allein erfüllt das nicht.
