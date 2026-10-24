# HALVETH / LUCINET · 1001 Türen

Eine durchgehende Ansicht aller Ganzzahlen von **0 bis 1000**: Zahleneigenschaften,
Darstellungswechsel, ein ideales 555-Zeitmodell und ein ausführbarer lokaler
Übergang von 999 Modellstimmen zu einem erhaltenen Kern K und Zustand 1000.

Projektentwurf: **Juri Halveth / HALVETH**. Entwicklung mit KI-Unterstützung.

## Öffnen und prüfen

Im Repository-Hauptordner:

```sh
python branches/1001-doors/serve.py --port 8856
```

Dann `http://127.0.0.1:8856/branches/1001-doors/` öffnen. Die Module benötigen
HTTP; eine `file:`-Ansicht lädt JavaScript-Module nicht zuverlässig.
Der mitgelieferte Starter bindet ausschließlich Loopback und liefert `.mjs`
ausdrücklich als JavaScript, auch bei abweichender Windows-MIME-Registrierung.

```sh
node branches/1001-doors/generate.mjs
node branches/1001-doors/generate.mjs --check
node --test branches/1001-doors/model.test.mjs
npm test
```

Node 24+, Python nur für den lokalen Webserver. Keine externen Pakete,
Netzabfragen, Konten oder Zahlungen. JSON-Downloads funktionieren lokal.

## Ansichten und Versuche

1. **Türen:** Alle 1001 Werte sind direkt erreichbar und filterbar. Primzahl,
   Zweierpotenz, Quadrat, Dreieckszahl und Palindrom sind unabhängige Prädikate.
   Tür 2 behält gleichzeitig „Primzahl“ und „Zweierpotenz“. Notizen lassen sich
   in diesem Browser speichern und samt gebundenem Datensatz exportieren.
   Für 0–127 wird außerdem der ASCII-Eintrag gezeigt, für 100–599 der passende
   Eintrag im datierten IANA-HTTP-Register. Ein unzugewiesener Eintrag bleibt als
   solcher sichtbar; beispielsweise ist HTTP 555 im Snapshot unzugewiesen,
   während NE555 in einem anderen Namensraum ein Bauteil bezeichnet.
2. **033:** Die ausdrücklich dezimale Schreibweise 033 ergibt 33; ausdrücklich
   oktal ergibt sie 27 (ASCII ESC); 0x33 ergibt 51 (ASCII 3). Eine gepolsterte
   Register-ID trägt keine implizite oktale Bedeutung. Steuersequenzen werden
   als sichtbare Daten gezeigt. [RFC 20](https://datatracker.ietf.org/doc/html/rfc0020)
   und [ECMA-48](https://ecma-international.org/publications-and-standards/standards/ecma-48/)
   binden die technische Referenz.
3. **555:** Zwei freie ideale RC-Oszillatoren werden analytisch ausgewertet.
   Verwendet werden `tH = ln(2)(RA+RB)C`, `tL = ln(2)RB C`, `f = 1/(tH+tL)`.
   Die Kondensatorspannung folgt den exponentiellen Lade-/Entladegleichungen
   zwischen VCC/3 und 2VCC/3. Anfangsbedingung ist der stationäre Ladezyklus
   bei VCC/3, kein Boot aus einem leeren Kondensator. Rauschen, Toleranzen,
   Versorgungseinflüsse und reale Kopplung sind offene Erweiterungen.
4. **999 → K → 1000:** Standard ist Einstimmigkeit aller 999 registrierten
   Modellmitglieder. Antworten müssen denselben Vorschlag und Scope betreffen.
   Vor der Modellfrist bleibt der Stand `COLLECTING`. Eine fehlende Antwort
   bleibt `MISSING`; Gegenstimme und Veto haben eigene Ergebnisse. Die alternative
   Ja-Schwelle mit Veto ist sichtbar zu wählen. Ihr Nenner bleibt immer 999.
   Erst eine erfüllte Regel gibt den Button für ein lokales Modellereignis frei.
   K enthält alle Einzelstimmen samt Evaluation, statt sie wegzukomprimieren.
   Gleiche Kernbytes ergeben dieselbe Ereignis-ID. Das ist ein Abstimmungsmodell;
   Signaturen, reale Identitäten, Netz- oder Blockchainkonsens sind eigene Adapter.

## Quelle und Verbesserungen

Das gelieferte Archiv `HALVETH_1001_TUEREN_v1.zip` wurde vollständig gelesen.
[SOURCE_RECEIPT.json](SOURCE_RECEIPT.json) bindet Archiv und drei enthaltene Dateien.
Die Originale bleiben außerhalb dieses Moduls erhalten. Ein isolierter Lauf des
geprüften v1-Generators erzeugte semantisch dasselbe JSON. Unter Windows änderten
sich die Zeilenenden, daher keine rohe Bytegleichheit. Der neue Generator schreibt
festes UTF-8 mit LF und liefert deterministische Ausgaben.

Die Primfaktorzerlegung von 0 erhält `UNDEFINED_FOR_ZERO`. Für 1 ist die Liste
leer und ihr Produkt 1. Die Bitlänge von 0 ist 0, während seine sichtbare
Binärschreibweise eine Ziffer besitzt. Gemessenes 0 und fehlende Beobachtung
bleiben verschieden. 1024 ist jetzt als eigener Zusatzversuch erreichbar;
2048 bleibt eine Erweiterungsfront. Beide liegen außerhalb des historischen
Registerbereichs 0–1000.

Das neue [Register](registry.json) enthält alle 1001 berechneten Records und ihre
Digests. [relations.json](relations.json) bindet ausschließlich die 1000 direkten
arithmetischen Nachbarschaften mit beiden Endpoint-IDs, Digests, semantischen
Adressen, Relationdefinition und eigener Write-Domain. Ein Nachfolgerpfeil
behauptet dabei keine Kausalität. Das Register ist kein vollständiger Graph
aller denkbaren Relationen zwischen Zahlen.

## Aussagebereich und nächste Forschung

Die Tests prüfen alle 1001 Zahlen unabhängig über Divisoren und endliche
Referenzmengen. Sie prüfen zusätzlich Gegenbeispiele für gemischte Scopes,
doppelte Mitglieder, fehlende Stimmen, Veto, Zeitfenster, Kernintegrität und
Regelwechsel. Das sind lokale mathematische und programmatische Ergebnisse.

Eine eigene historische Recherche für jede Zahl, eine physische Wirkung oder
die Zustimmung echter Menschen und Nodes folgt daraus nicht. Jeder Record
bewahrt dafür offene Frage, Gegenmodell und Reopen-Trigger. 666 und 888 führen
die im gelieferten Archiv benannten Entwurfsmotive; ihre Zahlengestalt ist
keine Messung einer äußeren Wirkung.

Der [IANA-HTTP-Registry-Snapshot](https://www.iana.org/assignments/http-status-codes)
wurde am 23.10.2026 aus der offiziellen CSV gelesen. Der gelieferte Registry-Stand
lautet 15.09.2025. Alle 500 Werte im Bereich 100–599 sind durch die registrierten
Zeilen oder ihre expliziten unzugewiesenen Bereiche abgedeckt. Temporär,
unbenutzt und obsolet bleiben eigene Zustände. Die ursprünglichen CSV-Bytes
liegen in `http-status-codes-source.csv`; ihr Digest steht in
`http-status-data.mjs`. Die Registry-Daten führen die
[IANA/IETF-CC0-Widmung](https://www.iana.org/help/licensing-terms).

Der 555-Name wird in [Camenzinds direktem Interview](https://www.semiconductormuseum.com/Transistors/LectureHall/Camenzind/Camenzind_Page2.htm)
als willkürliche Produktnamenswahl beschrieben. Die Schaltungsreferenz ist das
[TI-Datenblatt](https://www.ti.com/lit/ds/symlink/ne555.pdf). Die Experimente von
[Santillán 2018](https://doi.org/10.31349/RevMexFis.64.107) zeigen bei **zwei real
gekoppelten** 555-Oszillatoren Phasenverhältnisse und auch stationäre Zustände.
Diese Beobachtungen werden hier referenziert; die aktuelle freie Simulation
reproduziert die dortige Kopplung noch nicht.

## Anschlüsse an bestehende Werkzeuge

- [Dialogprotokoll](../binary-inquiry-loop/): Antworten und offene Zustände.
- [Drei-Gabel](../three-actor-fork/): Alternativen unter derselben Prüffrage.
- [Nächster-Schritt-Navigator](../next-action-navigator/): Frage, Gegenmodell und
  kleinste nächste Probe an einem erhaltenen Elternzustand ausrichten.
- `scripts/plain-json.mjs`: Der vorhandene gemeinsame Datenprüfer wird auch
  von den Abstimmungsrecords verwendet. Versteckte Felder und Getter werden
  vor einer Snapshot-Kopie abgelehnt.

Code: MIT. Neu berechnete Daten: CC0-1.0. Erläuterungen: CC BY 4.0, entsprechend
den [Repository-Lizenzen](../../LICENSES.md). Rechte fremder Quellen bleiben bei
deren jeweiligen Inhabern. Ein Digest bindet die Bytes einer Fassung.

## Quellenrecherche: sieben ausgewählte Zahlen

Die neue [Recherche](NUMBER_RESEARCH.md) öffnet **3, 6, 28, 55, 64, 137 und 666**:
Rosetta, Kohlenstoff, vollständige Paarvergleiche, Pflanzenmuster, Bit-/DNA-
Darstellungen, Feinstrukturkonstante und Agrippas Sonnenquadrat mit getrennten
Siegeltraditionen. Die Auswahl folgt der Nutzerfrage; sie behauptet keine
Vollrecherche oder repräsentative Häufigkeit für alle 1001 Zahlen.

Direkt im Browser stehen Quellenkarten, ein auswählbarer Quadratvergleich,
umschaltbare sechs Bits mit reversibler DNA-Triplettabbildung, ein veränderbares
geometrisches Setzmodell, Molekül- und Paargraphschemas zur Verfügung.
Die ursprünglichen generierten Registerdateien bleiben unverändert. Das neue
Wissen liegt als eigener versionierter Forschungsaufsatz in `number-research.mjs`.
Der Notizexport v2 bindet Originalrecord, Forschungsrecord und Quellen getrennt.

```sh
node --test branches/1001-doors/number-research.test.mjs
```

Die Tests prüfen auch beschädigte Zahlengitter, sämtliche 64 Roundtrips,
ungültige Eingaben und den Unterschied zwischen einem vollständigen Paargraphen
und bloßer Nachbarschaft. [NUMBER_RESEARCH_RECEIPT.json](NUMBER_RESEARCH_RECEIPT.json)
bindet Quellenverweise, Datenfassung und den erhaltenen Registerstand.

## Rollenreise und Sitzungshive

Die [Vertiefung zu Rollen und Wegen](ROLE_JOURNEY_RESEARCH.md) ergänzt für jede
der 1001 Registerzahlen ein berechnetes Rollenprofil: Stellenwert, Schreibweisen,
Anzahl und Indices sowie das vollständige Ordnungsprofil `p <= n`.
Der vollständige Test prüft 1.002.001 Proben und unterscheidet alle 1001 Werte
innerhalb dieses endlichen Ordnungsmodells.

Vier auswählbare Wege zeigen Darstellungswechsel, unterschiedliche Reihenfolgen
von Addition/Verdopplung und die vielen möglichen Urbilder eines Modulo-Restes.
Jeder Lauf erhält getrennte Inhalts-, Vorkommens-, Ereignis- und Relationsrecords.
Der Originalinput bleibt erhalten. Ein Ortwechsel oder gleiches Endergebnis
behauptet keine unaufgezeichnete historische Reise.

„Pollen ins Hive sammeln“ prüft und sammelt den Lauf **nur in dieser Sitzung**.
Doppelte Klicks erzeugen keinen zusätzlichen Lauf. Neue Wiederholungen bleiben
als eigene Witnesses erhalten, erhöhen aber nicht die Zahl verschiedener
Rechenbefunde oder unabhängiger Provenienzcluster. Lauf und Hive können als JSON
heruntergeladen werden; ein Reload beginnt ein neues Sitzungshive.

```sh
node --test branches/1001-doors/role-journey.test.mjs
```

## 256, 512, 1024 und historische Namenspfade

Der fünfte Laborbereich öffnet die im Original bereits benannten
GENESIS-256-/GENESIS-512-Motive und die binäre Schwelle 1024 als bedienbare
Zustandsräume. 256 und 512 ergänzen die Quellenkarten im Register. 1024 erhält
einen eigenen Zusatzpfad. Die Auswahl umfasst damit neun Registerzahlen plus
einen Zusatzwert; die ursprünglichen sieben Forschungsrecords bleiben unverändert.

Alle 1792 Bitmuster lassen sich anwählen; Rasteradresse, Bitfolge, Zustandsanzahl
und höchster Index bleiben getrennt. Für 512 ist zusätzlich die 8×8×8-Adresse
sichtbar. Das ist eine vollständige Koordinatenabbildung, noch kein dynamischer
Graph oder autonomer Agentenschwarm.

Daneben verbindet ein Quellenversuch die Namen Nachiel und Sorath mit ihren
hebräischen Buchstabenwerten, Summen und einer ausdrücklich gewählten Gitterspur.
Historische Textaussage, heutige Zahlenschreibweise, deklarierte Pfadregel und
Sudoku-Regeln bleiben unterscheidbar. Der Scan dient als historische Referenz;
die Demo beansprucht keine pixelgenaue Reproduktion der alten Siegel.

[Quellenprüfung und Versuchsvertrag](POWERS_SQUARE_RESEARCH.md)

```sh
node --test branches/1001-doors/powers-square.test.mjs
```

## Zeitlich gebundene Receipts

`NUMBER_RESEARCH_RECEIPT.json` bleibt der historische Snapshot der ersten sieben
Zahlenpfade auf Commit `7dc5e0685b3d5ff80ad9a8d3d2f11311e7625578`.
Die dort gebundenen damaligen UI-Dateien werden durch spätere Änderungen nicht
rückwirkend umgebunden. [ROLE_JOURNEY_RECEIPT.json](ROLE_JOURNEY_RECEIPT.json)
bindet die neuen Rollen-/Strukturmodule, die aktuelle Oberfläche und die
unverändert erhaltenen Vorgängerdateien. Ein Dateidigest belegt seine Bytefassung;
Quellenlinks und lokale Tests haben jeweils den im Bericht beschriebenen Scope.
