# Encounter Systems — Kooperation sichtbar und prüfbar machen

**Ein ausführbares Forschungslabor für laufende Arbeit, begrenzte Datenfreigabe und veränderbare Systemgrenzen.**

Ein eigenes System berechnet ein Bild. Ein Partner übernimmt abgegrenzte Rechenaufträge. Ein Besucher darf drei fertige Kacheln kopieren. Ein weiterer Akteur fordert eine Schreiboperation an. Die Ansicht zeigt die tatsächlich berechneten und gespeicherten Bildwerte; Reaktionen entstehen aus dem aktuellen Modellzustand.

![Desktopansicht des Encounter-Systems-Labors](preview.png)

Projektleitung und Idee: **Juri Halveth / HALVETH**. Entwicklung mit KI-Unterstützung. Forschungsstand: **ausführbarer, synthetischer Prototyp**.

## Was ist die Forschungsfrage?

Wie kann ein weiterarbeitendes System andere Teilnehmer sinnvoll einbeziehen, einen vereinbarten Datenaustausch zulassen und seine Zustandsgrenzen gleichzeitig nachvollziehbar erhalten?

Die Ausgangsbilder — Zahnräder, Andocken und „Loch zu Loch“ — werden hier in konkrete Softwareoperationen übersetzt:

| Begegnung | Tatsächliche Operation | Sichtbare Folge | Prüfbare Eigenschaft |
|---|---|---|---|
| Zusammenarbeit | Partner berechnet eigene Kachelaufträge | Kacheln gelangen in das gemeinsame Bild | Ausgabe stimmt mit dem Bildoracle überein |
| Kurzbesuch | Drei gespeicherte Bytearrays werden kopiert | Dieselben Bildteile erscheinen beim Besucher | Kopien stimmen mit den übertragenen Originalbytes überein |
| Widerruf | Freigabeversion wird beendet | Eine unterwegs befindliche Übergabe wird zurückgewiesen | Eine neue Freigabe reaktiviert keine alte Lieferung |
| Schreibversuch | Gesperrte oder erlaubte Mutation eines Bytearrays | Das Bild bleibt erhalten oder ändert sich | Vergleich der Werte vor und nach dem Versuch |
| Wiederherstellung | Kachel wird nach der ursprünglichen Regel neu berechnet | Der ursprüngliche Bildteil kehrt zurück | Exakte Übereinstimmung mit der Referenz |

Absichten werden nicht aus einer Form oder einer behaupteten Identität abgeleitet. Der Akteur sendet eine definierte Anfrage; die Modellregeln bestimmen deren Wirkung.

## Direkt ausführen

Für Modell und Versuche genügt **Node.js 24 oder neuer**. Es gibt keine Laufzeitabhängigkeiten und keine externen Dienste.

Vom Repository-Stamm:

```sh
node branches/encounter-systems/serve.mjs 8849
```

Dann **http://127.0.0.1:8849/** öffnen. Der mitgelieferte Server bindet ausschließlich Loopback und dient der lokalen Vorschau.

```sh
node --test branches/encounter-systems/model.test.mjs branches/encounter-systems/geometry.test.mjs
node branches/encounter-systems/research.mjs --check
```

Browserprüfung mit den im Modul-Lockfile gebundenen Entwicklungswerkzeugen:

```sh
npm ci --prefix branches/encounter-systems
npm exec --prefix branches/encounter-systems -- playwright install chromium
npm run browser --prefix branches/encounter-systems
```

Unter Windows kann eine vorhandene Chrome-Installation genutzt werden: in PowerShell `$env:PLAYWRIGHT_CHROME='1'` setzen und anschließend den Browserprüflauf starten.

## Methode und Ergebnisse

Der [Versuchsplan](RESEARCH_PLAN.json) trennt Vorhersagen, Gegenhypothesen, Messgrößen und ausgeschlossene Behauptungen. Zwei Modelle bleiben getrennt:

- **M1 / Referenz:** Ein separat geschriebener, skalarer Algorithmus erzeugt das vollständige Bild. Eine eigene Regel beschreibt die Kontinuität der Freigabeversion.
- **M2 / Implementierung:** Ein Scheduler berechnet 48 Kacheln mit je 256 Grauwerten und übergibt Ergebnisse durch lokale Nachrichtenwarteschlangen.

Beide Implementierungen und die Tests wurden im selben Entwicklungsprozess erstellt. Getrennter Code ist eine Gegenprobe; er ist keine unabhängige externe Begutachtung.

Die Vergleichsmatrix enthält **12 Läufe**: zwei Arbeitsaufträge (`fractal`, `wave`), drei Partner-Lieferzeiten (0, 1,1 und 4 Modellsekunden), jeweils allein und mit Partner. Jeder vollständige Lauf wird über alle **12.288 Ausgabebytes** geprüft. Die Quellen von Implementierung, Oracle und Plan sind in [results.json](results.json) über SHA-256 gebunden.

Im Standardfall bei 24 berechneten Zeilen pro Modellsekunde:

| Arbeitsauftrag | Allein, einschließlich Abschlussphase | Mit Partner, einschließlich Lieferung und Abschlussphase | Ausgabe |
|---|---:|---:|---|
| Fraktalbild | 34,02 Modellsekunden | 19,13 Modellsekunden | bytegleich |
| Wellentextur | 34,02 Modellsekunden | 19,13 Modellsekunden | bytegleich |

Diese Zahlen folgen dem ausdrücklich vorgegebenen Scheduler und seinen Arbeitsbudgets. Sie messen **keine Beschleunigung auf zwei echten Rechnern**. Browser und Node führen das Modell in einem JavaScript-Prozess aus.

### Was wurde gegenüber dem ersten Prototyp verbessert?

Der erste Prototyp prüfte bei der Ankunft nur die aktuell eingeschaltete Zustimmung. Ein zwischenzeitlicher Entzug mit anschließender neuer Zustimmung konnte dadurch eine alte Lieferung wieder zulassen.

Jetzt trägt jede Lieferung ihre ursprüngliche **Freigabeversion**. Bei einer Zustimmungsänderung steigt die Version. Bei der Ankunft müssen aktuelle Freigabe und Version passen. Eine neue Zustimmung gehört damit zu einem neuen Vorgang. Die entsprechende Gegenprobe und ein absichtlich abgeschwächter Modellprüfer stehen in [model.test.mjs](model.test.mjs).

Weitere Gegenproben verändern einen Partnerbeitrag, entfernen im Modell den Schreibschutz oder setzen die Reparatur außer Kraft. Die erwarteten Invarianten reagieren auf diese sicheren, lokalen Fehler. Das ist ein Modellbefund und kein Nachweis einer fremden Produktsicherheitslücke.

## Raum, Zeit und alternative Zustände

Die Darstellung trennt drei Ansichten desselben Systems:

1. **Raum:** X/Y/Z binden die Positionen der Kacheln, Ablagen und Kontaktstellen. Kameraänderungen verändern die Bildprojektion.
2. **Zeit:** Die Zeitspur hält Kopien beobachteter Modellzustände vor. Eine historische Ansicht pausiert die Bedienung der Gegenwart; sie schreibt den aktiven Zustand nicht zurück.
3. **Varianten:** Die Vergleichsmatrix verändert jeweils einen gebundenen Parameter und prüft denselben Ausgabe-Vertrag.

[geometry.mjs](geometry.mjs) führt stabile Punkt-IDs und vier deklarierte Projektionsoperatoren für Perspektive, Draufsicht, Vorder- und Seitenansicht. Die Geometrieprüfungen betreffen diese numerischen Operatoren; sie sind kein optischer Rekonstruktionsnachweis. Die interaktive Hauptansicht verwendet eine affine 3D-Projektion und eine Draufsicht.

„3D + Zeit + Variante“ ist eine Navigationsstruktur. Daraus folgt keine fünf- oder fünfundvierzigdimensionale physische Welt und keine Simulation von Vakuumphysik.

## Wo ist das anwendbar?

### Render- und Rechenaufträge

Die Kachelaufteilung veranschaulicht einen Aufgabenverteiler mit Ergebnisprüfung und Rückgabe abgebrochener Aufträge. Ein nächster praktischer Adapter könnte `BUILD` durch einen echten Worker oder Renderprozess ausführen. Vor Leistungsbehauptungen braucht er Fehler-, Last-, Verzögerungs- und Hardwaremessungen. Die bekannte Aufgabenverteilung in [MapReduce](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/) ist ein verwandtes Grundprinzip; dieses Modul implementiert keinen MapReduce-Cluster.

### KI-Werkzeuge und Plugin-Aufträge

Eine Werkzeugfreigabe kann an Teilnehmer, Operation, Datenumfang und Lebenszyklus gebunden werden. Hier wird deren Verhalten lokal modelliert. Ein realer Adapter benötigt authentisierte Identitäten, einen durchsetzenden Dienst, Fristen, Ressourcenlimits und eine Wiederherstellungsroute. Die Einordnung von Subjekt, Objekt, Operation und Umgebungsbedingungen hat einen etablierten Bezug zu [NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).

### Gemeinsame Datenräume und Lehre

Das Modell zeigt den Unterschied zwischen einer eigenen Berechnung, einer Kopie, einer offenen Lieferung und einem späteren Widerruf. Es eignet sich als Lehr- und Entwurfswerkzeug für solche Produktentscheidungen. Speicherung echter persönlicher Daten, rechtliche Einwilligung und Löschpflichten sind nicht Teil der implementierten Simulation.

## Wie „lernt“ GitHub dabei?

[KNOWLEDGE.json](KNOWLEDGE.json) hält konkrete Fragen, Antworten, Belege und Anschlussstellen maschinenlesbar fest. Die CI führt Tests und Vergleichsläufe erneut aus und kontrolliert die versionierten Ergebnisdateien. Ein neuer Fall wird mit Eingabe, erwarteter Eigenschaft und Gegenprobe ergänzt.

Das ist ein **wachsendes, überprüfbares Regressionswissen**. GitHub trainiert hier keine KI und ändert keine Modellgewichte. Ein grüner Lauf ersetzt keine Begutachtung und keine Messung eines später angeschlossenen Produkts.

Die neue Workflowdatei arbeitet mit lesenden Repository-Berechtigungen, gebundenen Action-Revisionen und Testartefakten. Sie veröffentlicht keine Website und führt keine fremden Nachrichten oder Aufgaben aus.

## Dateien und Herkunft

| Datei | Zweck |
|---|---|
| `index.html`, `style.css`, `view.mjs`, `dashboard.mjs` | Desktop-/Mobilansicht, laufende Berechnung und Zeitspur |
| `model.mjs` | Deterministischer Scheduler, Operationen und Freigabeversionen |
| `reference.mjs` | Getrennter Ausgabe- und Regelvergleich |
| `model.test.mjs`, `geometry.test.mjs`, `browser.spec.mjs` | Invarianten, Gegenproben, Bedienung und Darstellungsprüfung |
| `RESEARCH_PLAN.json`, `research.mjs`, `results.json` | Vorhersagen, reproduzierbare Matrix und Ergebnisse |
| `KNOWLEDGE.json`, `SOURCES.md` | Wiederverwendbare Erkenntnisse und Primärquellen |
| `SOURCE.json` | Digest und Umfang des übernommenen lokalen Prototyps |

Die ursprüngliche lokale Anschauung bleibt erhalten. Dieser Branch erweitert sie um wissenschaftlich prüfbare Fragen, Referenzen, Versuche und eine öffentliche Quellfassung. Anwendungen auf reale Dienste bleiben eigene Integrationsaufgaben.

**Lizenzen:** Code, Tests, HTML und CSS: MIT. Daten/Fixtures: CC0 1.0. Neu geschriebene Texte: CC BY 4.0. Siehe die [Lizenzübersicht](../../LICENSES.md). Kontakt: [security@halveth.de](mailto:security@halveth.de).
