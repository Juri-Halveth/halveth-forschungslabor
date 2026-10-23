# HALVETH / LUCINET · Nächster-Schritt-Navigator

Ein wiederverwendbarer **Einstiegspfad** für vier Arten von Arbeit: Security und Bug Bounty, Softwarebau, Analyse und Forschung sowie Zeigen und Einreichen. Er übersetzt „Was tun wir jetzt?“ in eine sichtbare Folge aus Gegenstand, Quelle, Rahmen, vollständigem Achsenfeld, Gegenmodell, kleinster Prüfung und Ergebnis. [`diagram.mmd`](diagram.mmd) zeigt denselben Ablauf als editierbares Mermaid-Diagramm.

## Starten

Im Repository-Root `python -m http.server 8847 --bind 127.0.0.1` ausführen und `http://127.0.0.1:8847/branches/next-action-navigator/` öffnen. Die Oberfläche nutzt keine API, speichert nichts automatisch und führt keine Tests gegen Zielsysteme aus. Der JSON-Export entsteht nur nach Klick im eigenen Browser; vertrauliche Fallbelege gehören weiterhin in ihre geschützte Akte.

## Was der Code tatsächlich tut

[`model.js`](model.js) besitzt pro Arbeitsweg ein Pflichtachsenregister. `evaluateNavigation` prüft die deklarierten Eingaben in Reihenfolge und nennt die erste offene Station. `UNKNOWN` hält eine Achse sichtbar; es ist keine Zustimmung oder ein Fehler. Ein Ausschluss zählt erst mit eingetragenem Grund. Nach Ergebnis und Evidenzstand folgt ein expliziter Reopen-Trigger. Der höchste automatische Abschluss lautet `FINITE_SNAPSHOT`. Der Export bindet die eingegebenen Daten und die daraus berechnete Navigation, bestätigt aber keine externe Wahrheit.

Das ist eine **Einstiegsnavigation**, keine Implementierung des vollständigen HALVETH/LUCINET Status-quo-Vertrags mit Vertikalvorschauen, Paargraph und Priorisierung. Es gibt weder automatische KI-Entscheidungen noch eine Integration in alle anderen Projekte. Ein Projektadapter kann später den JSON-Stand lesen, die zuständigen Originalquellen öffnen und dort die tiefere Prüfung ausführen.

Ein anderer lokaler HALVETH-Baustein kann `evaluateNavigation({ track, goal, source, scope, axisStates, axisReasons, hypothesis, counter, check, result, evidenceState, reopen })` importieren. Die Antwort enthält `nextId`, `nextQuestion`, `boundary` und `outcome`. Der aufrufende Baustein entscheidet selbst über seine zuständigen Quellen und darf `nextQuestion` nicht als Aktionsfreigabe verstehen. Die Browseroberfläche ist ein Beispieladapter für diesen Vertrag.

## Wo die Wege anschließen

| Weg | Sinnvoller Anschluss im Repository | Was getrennt bleibt |
| --- | --- | --- |
| Security & Bug Bounty | [Berichtsprüfung](../security-impact-learning/), [Referenzprüfer](../document-issue-reference-verifier/) | Aktuelle Programmpolicy, Eigentümer, Testidentität, Live-Test, Impact und Meldung. |
| Software bauen | [Focus Kernel](../focus-kernel/), [Bildvergleich](../pixel-region-change-observer/) | Entwurf, Patch, lokaler Test, Merge und Deployment. |
| Analyse & Forschung | [Regelmodell](../normenwerk-rule-universe/), [Optiklabor](../eye-optics-and-prediction/) | Analogie, Hypothese, Messung und Außenbehauptung. |
| Zeigen & einreichen | [Dialogprotokoll](../binary-inquiry-loop/), [Metadatenprüfung](../bounded-knowledge-reuse-inventory/) | Entwurf, Rechteprüfung, Freigabe, Versand, Empfang und Wirkung. |

Für Security-Arbeit bietet dieses Modul nur Lesen oder ein lokales Modell. Eine frei eingetragene Autoritätsbeschreibung ist keine technische Verifikation und erteilt keine Testfreigabe. Ein späterer aktiver Test verlangt eine gesonderte Prüfung von Eigentümer, aktueller Policy, Scope und Stopbedingungen. Dieser Navigator stellt keine Payloads bereit und führt keine Netzoperation aus.

## Prüfen und Rechte

`node --test branches/next-action-navigator/model.test.mjs` prüft die deterministische Eingabereihenfolge und Grenzen. `npm test` führt zusätzlich die übrigen lokalen Modultests aus. Das beweist nur den kodierten Modellvertrag, nicht einen realen Sicherheitsbefund oder einen Erfolg in einem anderen Projekt.

Neue Code-, HTML- und CSS-Dateien stehen unter [MIT](../../LICENSE); dieses Markdown und das Mermaid-Diagramm unter [CC BY 4.0](../../LICENSE-CONTENT.md). Die neuen Dateien wurden für dieses Modul erstellt. Projektleitung und Zusammenstellung: Juri / HALVETH; Entwicklung mit KI-Unterstützung. Bestehende Quellübernahmen im Repository bleiben im unveränderten [`SOURCE_PROVENANCE.json`](../../SOURCE_PROVENANCE.json) gebunden.
