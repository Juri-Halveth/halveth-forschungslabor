# LAGEFADEN · Herkunft und Zeit vor der Lageentscheidung

**Ein lesender, dual nutzbarer Softwarebaustein von Juri / HALVETH.** Die [bedienbare Probe](index.html) zeigt an erfundenen Nachrichten, warum drei Meldungen nicht automatisch drei unabhängige Beobachtungen sind. Die Seite läuft lokal und enthält weder eine Drohnensteuerung noch eine Lagefreigabe.

[Portfoliowahl mit drei Kandidaten und acht Bauachsen](PORTFOLIO_DECISION.md)

## Was die Person am Bildschirm bekommt

Eine Einsatzmeldung wurde zweimal weitergeleitet; daneben liegt ein älterer Gegenhinweis. LAGEFADEN zeigt pro Nachricht den angegebenen Ursprung, ihre Kopierkette, die Zeit der Beobachtung und den Eingang. Ein alter Ursprung wird durch eine neue Weiterleitung nicht frisch. Bei einem aktuellen Widerspruch bleibt die Prüfung offen. Ein zusätzliches Gegenbeispiel trägt zwei verschiedene Ursprungskennungen, obwohl sie in der erfundenen Außenwelt denselben Absender verdecken: Der lokale Code kann das ohne authentisierte Herkunft nicht erkennen. Die sichtbare Ausgabe lautet daher **deklarierte** Ursprünge und **Außenlage unbekannt**.

## Portfolio-Übernahme: was tatsächlich vorliegt

| Öffentliche Spur | Vorhandener technischer Stand | Beitrag zu LAGEFADEN | Nicht mitübernommen |
| --- | --- | --- | --- |
| [C-DROHNE](https://github.com/Juri-Halveth/c-drohne-red-room) | Synthetischer Drei-Meldungen-Fall, neun Gegenvarianten und Messlabor | Kopien, alte Meldungen und menschliche Klärung als konkrete Problemprobe | Flug- oder Sensornachweis; die Filme sind Konzeptvisualisierungen |
| [Encounter Systems](https://github.com/Juri-Halveth/halveth-forschungslabor/tree/main/branches/encounter-systems) | Deterministische Zustände, Versionsbindung, Wiederherstellung und Gegenoracle | Muster für endliche Tests, gleiche Eingabe und offene Übergänge | Freigabe- oder Widerrufscode ist hier noch nicht integriert |
| [Focus Kernel](https://github.com/Juri-Halveth/halveth-forschungslabor/tree/main/branches/focus-kernel) | Bestätigte Ziele und Vorschläge bleiben getrennt | Produktregel: Befundvorschlag ersetzt keinen menschlichen Auftrag | Kein KI-Agent entscheidet einen Fall |
| [Grenzbeobachter](https://github.com/Juri-Halveth/halveth-scarlet/tree/main/forschung/grenzbeobachter) | Synthetischer Messplanvergleich mit Replay und ausgewiesenen Verlustgrenzen | Architekturidee: Beobachtungsfenster und Ausfall sichtbar halten | Sein Code und seine Messdaten wurden nicht kopiert |
| [Tresor](https://github.com/Juri-Halveth/halveth-tresor) | Lokale Windows-Anwendung für Zugangsdaten | Beleg, dass Desktop-Paketierung im Portfolio existiert | Kein Credential- oder Kryptocode in dieser Probe |

Die vorliegende Implementierung ist **neu geschrieben**; die Tabelle benennt konzeptionelle Vorarbeiten, keine unsichtbare Laufzeitintegration. Fremde Projektbegriffe werden nicht als zertifizierte Eigenschaften importiert.

## Passung zum CIHBw

Die [öffentliche CIHBw-Seite für Startups](https://www.cyberinnovationhub.de/mitwirken/startup) nennt Software Defined Defence/KI, Drohnen und elektronische Kampfführung als Themen. Die [SDD-Seite](https://www.cyberinnovationhub.de/innovation/showroom/fokusthema-sdd) betont Hardwareunabhängigkeit, getrennte Daten und Anwendungen sowie Nutzernähe. LAGEFADEN wäre ein **lesender Zusatzlayer** für die Prüfung von Herkunft und Zeit an einer bereits vorhandenen Datenansicht. Ein möglicher Anknüpfungspunkt sind [CIP](https://www.cyberinnovationhub.de/innovation/showroom/innovations-case-cip) und [MSDF](https://www.cyberinnovationhub.de/innovation/showroom/innovations-case-msdf); deren konkrete Schnittstellen, Datenrechte und Fähigkeit zur Kopienprüfung sind öffentlich nicht belegt. Daraus folgt weder ein Produktauftrag noch eine festgestellte Fähigkeitslücke.

Für cUxS wäre dieselbe Prüfung bei mehreren eingehenden Sichtungen denkbar. Im Bereich Electronic Warfare könnte eine spätere Version Herkunft und Ausfall von Signalberichten dokumentieren; das vorhandene [Signallabor](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/branches/encounter-systems/SIGNAL_RESEARCH.md) ist lediglich ein BPSK-ähnliches Softwaremodell. Wir behaupten damit keine Funk- oder EW-Fähigkeit.

## Reifegrad: der Weg zur relevanten Umgebung

Die hier gebaute Probe ist ein **lokaler synthetischer Proof of Concept**, nicht TRL 6. Die [EU-TRL-Definition](https://eic.ec.europa.eu/programme-finder-13_en) verlangt für TRL 6 eine Demonstration in relevanter Umgebung. Janas Antwort nennt TRL ≥ 6 **und** einen passenden Use Case als Voraussetzung für eine Zusammenarbeit. Ihre Einladung zur späteren proaktiven Meldung formuliert Ausgründung **und/oder** einen höheren Reifegrad; sie verspricht damit keine Aufnahme bei bloßer Neugründung.

Nächster technischer Vertrag, bevor man erneut pitcht:

1. Einen konkreten Nutzerworkflow und dessen bestehende Checkliste mit einer zuständigen Stelle definieren. Eingaben zunächst anonymisiert oder synthetisch; ein lesender Adapter, kein Eingriff in bestehende Systeme.
2. Zeitquelle, Ursprungsidentität und Weitergabekante von einem tatsächlich kontrollierten Testsystem beziehen und gegen manipulierte Kennungen prüfen. Empfangszeit und Ereigniszeit getrennt halten.
3. Dieselben vorab klassifizierten Fälle verblindet mit Checkliste und LAGEFADEN bearbeiten lassen. Messen: erkannte Kopien, fälschlich als unabhängig gezählte Quellen, erkannte Widersprüche, Bearbeitungszeit und Fehlgewissheit.
4. Einen installierbaren, versionierten Prototypen in einer für den Use Case relevanten Testumgebung vorführen. Abnahmebedingungen und Datennutzung mit der zuständigen Stelle vereinbaren. Erst die protokollierte Vorführung kann den behaupteten Reifegrad tragen.

Der erste unterscheidende Test ist **nicht** eine schönere Visualisierung. Er fragt, ob LAGEFADEN in einem verblindeten Datensatz gegenüber einer einfachen Prüfliste weniger Weitergaben als unabhängige Hinweise fehlzählt, ohne neue Fehlentscheidungen oder unverhältnismäßige Mehrarbeit zu erzeugen. Ein Gleichstand oder eine Verschlechterung würde die Produktthese ändern.

## Lokale Ausführung und prüfbarer Umfang

`index.html` direkt im Browser kann je nach Browser lokale ES-Module blockieren. Vom Repository-Stamm aus startet der vorhandene, auf die öffentliche Dateiliste beschränkte Vorschau-Server:

```sh
node scripts/serve-public-preview.mjs
```

Danach `http://127.0.0.1:8867/lagefaden/` öffnen. Ist der Port bereits belegt, kann `createPreview` an einen freien Loopback-Port gebunden werden. `node --test branches/lagefaden/model.test.mjs` prüft neun lokale Modelltests; `npm test` führt den gesamten Repository-Testvertrag aus. Der JSON-Download enthält nur den gewählten erfundenen Fall und dessen lokale Auswertung. Keine Eingaben werden an einen Dienst gesendet. Lizenz: Code/HTML/CSS MIT, Text CC BY 4.0 nach [Lizenzkarte](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/LICENSES.md).
