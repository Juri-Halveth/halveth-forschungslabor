# W-Coverage / Blind-Spot Map · Vertrag v1

Projekt: LAGEFADEN / Juri / HALVETH. Gesunder Ausgangsstand:
`2998513b2f526b483fbc07c70f473bcf09f2f82f`. Die drei bestehenden Snapshot-Dateien
bleiben unverändert. Dieser Nachfolger ergänzt eine lokale Ansicht und eigene
Tests; der bisherige Draft-PR wird fortgeführt.

## Was die Karte berechnet

Die implementierte Abbildung lautet **gespeicherter Snapshot → typisierte
Teilantworten → Coverage-Zelle**. Die Abbildung Außenwelt → Anbieter-Datensatz
ist eine weitergehende Forschungsfrage. Die Karte misst deren Vollständigkeit
oder Informationsverlust nicht.

`coverage.mjs` definiert 22 Fragen mit ausdrücklich genannten Teilfragen
(Facetten). Es wertet die drei gebundenen Fälle einzeln aus. `w-space.mjs`
liefert dieselben ausführlichen Antworten an die W-Räume und die Matrix.
Eine Facette trägt `DATA`, `RECEIPT`, `DERIVED`, `DESIGN` oder `UNKNOWN`.

| Matrixzelle | Exakte v1-Regel |
| --- | --- |
| `DOCUMENTED` / ● | Jede definierte Facette ist `DATA` oder `RECEIPT`. |
| `PARTIAL` / ◐ | Mindestens eine Facette ist gebunden; mindestens eine ist offen, abgeleitet oder Anwendungsentwurf. |
| `UNKNOWN` / ○ | Alle Facetten dieser Frage sind bei vorhandenem gültigen Snapshot offen. |
| `PENDING` / … | Der Snapshot wird noch geladen. |
| `UNAVAILABLE` / — | Der Snapshot fehlt oder besteht die Eingangsprüfung nicht. |

Die Regelsammlung ist endlich und versioniert. Ein Punkt bedeutet die
Abdeckung **dieses definierten Ausschnitts**, keine allgemeine
Anbieterbewertung. Es gibt weder Gesamtnote noch Welt-Vollständigkeitsquote.
Unmarkierte CEMS-Zeitfelder bleiben als UTC-Interpretation gemäß der bereits
gebundenen Anbieterbeschreibung sichtbar; ihre normalisierte Darstellung ist
`DERIVED`. Ein Zeitabstand ist keine Ereignisdauer.

## Die drei Unterschiede im gespeicherten Stand

USGS enthält den Ortsbezug im Titel; der minimierte Snapshot enthält keine
Koordinaten. EONET enthält Geometriepunkte, aber keinen gesondert gebundenen
Ortsnamen. CEMS enthält Land und Ortsbezug im Titel, aber keine konkrete
Schadensgeometrie in diesem Snapshot. Bei `WO?` bleibt damit jeweils eine
andere Facette offen. EONET enthält externe Quellverweise; daraus entsteht
keine authentisierte Messkette. Seine Katalog-Änderungszeit ist in diesem
Snapshot offen. Die CEMS-Ansichten behalten ihre abweichenden Updatezeiten.

## Vereinigung und Schnitt mit gebundenen Endpunkten

`answerInventory` vereinigt bekannte Teilantworten als Records mit
`sourceId`, `caseId`, Facetten-ID, Basisstatus, Belegstellen und Snapshotreceipt.
Ein Record darf keinen anderen Fall ergänzen. `anyUnknown` nennt die
Vereinigung offener Facetten samt betroffenen Spalten. `sharedUnknown` nennt
den Schnitt offener Facetten nur, wenn alle drei Snapshots gültig vorliegen.
Ein Ausfall erzeugt `INCOMPLETE_SOURCE_COVERAGE` und keinen gemeinsamen
Weltbefund. Unterschiedliche Antwortbasis und unterschiedliche Ereignisse
bleiben orthogonale Achsen.

Die Relation heißt `ANSWER_SCOPE_COMPARISON`; katalogübergreifende
Ereignisidentität trägt `NOT_EVALUATED`. Zwei gleiche W-Fragewörter sind
kein Identitätsbeleg. Datenfeld-Referenzen binden JSON-Pointer und Feldwert.
Die Snapshotreceipts binden Pfad, tatsächlich geladene Bytezahl, SHA-256,
Vertragsversion und Abrufzeiten. Der lokale Hash bindet die geladenen Bytes;
er authentisiert weder den Anbieter noch eine physische Beobachtung.

## Vollständige Software-Apertur für diesen Nachfolger

| Achse | Zustand | Gebundene Entscheidung |
| --- | --- | --- |
| `USER_OUTCOME` | `STABLE` | Unterschiede und Lücken ohne Gesamtscore verstehen. |
| `INTERFACE` | `MATERIAL_CANDIDATE` | Matrix, Tastaturzellen, Filter, Belegstellen und JSON-Export. |
| `STATE_DATA` | `MATERIAL_CANDIDATE` | Ein Facettenvertrag statt Übernahme der beispielhaften Punktetabelle. |
| `INTEGRATION` | `STABLE` | Dieselben drei lokalen Snapshotbytes, kein weiterer Netzabruf. |
| `FAILURE_RECOVERY` | `MATERIAL_CANDIDATE` | Ladefehler getrennt von inhaltlichem UNKNOWN halten. |
| `SECURITY_PRIVACY` | `STABLE` | Nur bestehende minimierte öffentliche Fälle; Source-Text bleibt Dateninhalt. |
| `ACCESSIBILITY` | `MATERIAL_CANDIDATE` | Semantische Tabelle, lesbare Statuswörter, Fokus und Schmalbildtest. |
| `DELIVERY_OBSERVABILITY` | `STABLE` | Explizite Publikationsdateiliste, lokale Tests, Browserprüfung und Draft-PR. |

Vertikale Vorschau (`MULTI_APERTURE_FIELD_PROBE`, maximal vier Ebenen):

| Kandidat | 1 · Bezug | 2 · unterscheidende Probe | 3 · Verbraucher | 4 · endliche Grenze |
| --- | --- | --- | --- | --- |
| `STATE_DATA` | W-Antwort → Facetten | USGS ohne Koordinaten vs. EONET mit Punkten | Matrix und Export lesen dieselben Records | Snapshot-Ausschnitt bleibt vom Anbieter-Gesamtangebot getrennt. |
| `INTERFACE` | Spalte → Zelle → Detail | gleiche Gesamtmarke, unterschiedliche offene Facette | lesende Person öffnet die Belegstelle | Nutzerverständnis bleibt nach automatischem Browserlauf ungeprüft. |
| `FAILURE_RECOVERY` | Ladezustand → Source-Zustand | eine / alle Quellen ausfallen lassen | gemeinsame Lückenliste und Export | Unbeobachtete Verfügbarkeit bleibt offen. |
| `ACCESSIBILITY` | Tabelle → Button → Fokus | schmale Breiten und Tastatur bedienen | vorhandener Browser und viewportgebundene Maße | echter Screenreader-Nutzertest bleibt offen. |

Der vollständige diagonale Paargraph umfasst sechs Paare: STATE_DATA–INTERFACE
(Facetten vor Darstellung), STATE_DATA–FAILURE_RECOVERY (Ausfall ist kein
unbekannter Feldwert), STATE_DATA–ACCESSIBILITY (Bedeutung auch ohne Farbe),
INTERFACE–FAILURE_RECOVERY (sichtbare Ausfallspalte),
INTERFACE–ACCESSIBILITY (Tastatur/kleine Breite) und
FAILURE_RECOVERY–ACCESSIBILITY (Ausfall bleibt lesbarer Text).
Alle Vergleiche beziehen sich auf denselben lokalen UI-/Datenvertrag. Sie
bilden einen gemeinsamen Code-/Test-Provenienzcluster.

Suchheuristik des kanonischen Navigationsvalidators: Zielrelevanz,
Kritikalität, Evidenzstärke, autorisierte Erreichbarkeit, Informationsgewinn,
Reparaturwert, Aufwand und Aktionsrisiko jeweils ordinal 0–4. Die ersten sechs
Werte werden addiert, die letzten zwei abgezogen. STATE_DATA erhält
`(4,4,4,4,4,4,1,0)`; die drei übrigen Kandidaten erhalten
`(3,3,3,3,3,3,1,0)`. Diagonale Anpassungen bleiben null. Die Ordnung wird
zuerst nach Score, dann nach den vollständigen Vektoren, dann nach ASCII-ID
aufgelöst. STATE_DATA wird zuerst gebunden, weil dessen Definition alle
anderen drei trägt. Dies ist
`ORDINAL_SEARCH_HEURISTIC_NOT_FACT_OR_IMPACT`. Der deklarierte Frame umfasst
alle acht Pflichtachsen, vier Vorschauen und alle sechs Paare; die lokale
Strukturprüfung wählt `STATE_DATA`. Alle vier Kandidaten werden im Nachfolger
umgesetzt; kein Geschwisterast wird gelöscht.

Ergebnisziel: `FINITE_STATUS_QUO` für den dokumentierten Snapshotvertrag.
Offene Fronten: zusätzlicher Anbieter oder neue Snapshotfelder erfordern
erneute Facettenprüfung; ein gemeinsamer Ereignistest braucht eine eigene
Ereignisrelation; eine tatsächliche Vollständigkeitsbehauptung braucht
Ground Truth und einen gebundenen Beobachtungsvertrag. Live-Daten,
betriebliche Nutzung, Nutzerwirkung und TRL 6 bleiben eigene Prüfstände.
