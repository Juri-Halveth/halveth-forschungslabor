# Code & Messung

**Dateien einordnen. Signale vergleichen. Codes übersetzen.**

Vier interaktive Arbeitsplätze verbinden die Format-, Beobachtungs- und Sequenzrecherche vom 25./26. Oktober 2026 mit ausführbaren Gegenproben. Du kannst Eingaben verändern, die berechneten Ergebnisse ansehen und sie als JSON mitnehmen. Die Anwendung verwendet native JavaScript-Module und arbeitet nach dem Laden lokal im Browser.

![Echte Browseransicht: Dateiname, Headerbytes und Formatkandidaten](preview.png)

## Starten

Im Wurzelordner dieses Repositorys, mit der in [package.json](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/package.json) gebundenen Node.js-Version:

```sh
node branches/code-observation-lab/serve.mjs
```

Öffne anschließend **http://127.0.0.1:8855/code/**. Der vorhandene gemeinsame Vorschauserver liefert ausschließlich die ausdrücklich freigegebenen öffentlichen Dateien aus. Er setzt den JavaScript-MIME-Typ auch unter Windows korrekt. Es werden keine zusätzlichen Pakete installiert.

Die komplette rechnerische Beispielsammlung und die Modelltests:

```sh
node branches/code-observation-lab/cli.mjs demo
node --test branches/code-observation-lab/model.test.mjs
```

Die Pages-Veröffentlichung bereitet dieselben Dateien unter `/code/` vor. Ob diese Fassung bereits online ist, ergibt sich aus dem zugehörigen Merge und dem erfolgreichen Pages-Deploy; ein Branch oder Draft-PR allein ist noch kein Deploy.

## Die vier Arbeitsplätze

| Arbeitsplatz | Was du verändern kannst | Was das Ergebnis bedeutet |
| --- | --- | --- |
| **Formate** | Dateiname und bis zu 256 eingegebene Headerbytes in der Oberfläche | Sieben katalogisierte Zuordnungen, bekannte Kennungspräfixe und ihre Quellen. Gleiche Bytes behalten ihren Headerkandidaten nach einer Umbenennung. Die Bytekennung ersetzt keinen vollständigen Formatparser. |
| **Signale** | Markerüberlappung, Phase, Phasenrauschen und ein menschliches Lesemetadatum | Berechnete Intensität und Kontrast eines ausdrücklich definierten Zwei-Wege-Modells. Phasenmittelung kann den Kontrast auch ohne Weginformation verringern. |
| **Symbolcode** | Unicode-Text, Symbolfolge und eine von 24 Zuordnungen | Reversibler UTF-8-Code mit zwei Bits pro Symbol und vier Symbolen pro Byte. Der ausgewählte Decoder gehört zum Vertrag; die Buchstaben A/C/G/T erzeugen hier keine DNA. |
| **Zellcode** | mRNA aus A/C/G/U und Leserahmen 0, 1 oder 2 | Nachschlagen vollständiger Tripletts in NCBI-Codontabelle 1, einschließlich Stopcodons und sichtbarem unvollständigem Rest. Es wird keine Zelle simuliert. |

Alle Benutzereingaben werden als Text beziehungsweise Zahlen verarbeitet. Es gibt keinen Datei-Upload, keine ENS-Auflösung, keine externe API, keine Telemetrie und keinen Gerätesteuerbefehl. Ein JSON-Export enthält die jeweilige Eingabe: vor einer Weitergabe selbst prüfen.

Auf schmalen Bildschirmen bleiben die aktuellen Ergebniswerte in einer kompakten Zeile unter den Registern sichtbar. Der Detailknopf bewegt die Ansicht erst auf deinen Klick. Eine frische Navigation startet am Seitenanfang; anschließende normale Ankerklicks bleiben möglich.

### Quellen und Forschungsfortschritt

[RESEARCH.md](RESEARCH.md) erklärt die Verbindungen und Gegenmodelle. [sources.json](sources.json) bindet 25 Quellen mit gelesener Coverage und Aussagegrenze. Besonders wichtig ist die neue, versionsgebundene Primärspur zu **Ethnograph 3.0 und `.ETH`** aus einem Anwenderbericht von 1996. Die Ether-/Zoerf-Zuordnung bleibt eine Katalogspur. Herstellerbeschreibungen, Erkennungsdefinitionen und katalogisierte Vermutungen bleiben in den Daten getrennt.

## Modelle

[model.mjs](model.mjs) exportiert zusätzlich zur Oberfläche drei kleine Arbeitsmodelle. [cli.mjs im Repository](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/branches/code-observation-lab/cli.mjs) führt sie mit festen Beispielen aus:

1. **Virtuelle Kamera:** `simulateCameraCommand()` trennt Auftrag, berechnete Zielwinkel und ausdrücklich synthetische Rückmeldung. Einheit und Bezugssystem werden geprüft. Annahme ohne Rückmeldung bedeutet noch keine erreichte Kameralage. Es existiert kein MAVLink-Hardwareadapter.
2. **Zustandsbrücken:** `compareStateModels()` vergleicht zwei Regeln auf allen drei deklarierten Zuständen. Unter der Identitätsbrücke unterscheiden sie sich; unter `h(x)=−x mod 3` sind sie konjugiert. Äquivalenz hängt an der gebundenen Brücke.
3. **Optik:** Photonenenergie, schwache Lichtablenkung und mittlere Leistungsdichte einer geometrischen Öffnung. Die Linsennäherung gilt hier erst ab `b ≥ 100 r_s`. Nicht darstellbare positive Ergebnisse werden ausdrücklich abgewiesen. Diese Rechnungen belegen weder einen Energieerzeuger noch einen materiellen Tunnel.

Das Signalmodell verwendet gleich starke Wege und reine Markerzustände:

```text
V = γ · exp(−σ²/2)
D = sqrt(1−γ²)
I = 1 + V · cos(φ)
```

`σ` ist die Standardabweichung einer gaußverteilten Phase in rad. Das Modell besitzt keine räumliche Beugungshülle, keinen Detektor und keine Bewusstseinsvariable. Der Leseschalter ändert ein Metadatum. Das ist eine programmierte Modellannahme und keine eigene physikalische Messung.

Der RNA-Lookup liest auch hinter einem Stopcodon weiter, damit jede Tabellenzuordnung sichtbar bleibt. Initiation, Terminierung, Ribosomenkinetik, Zellumgebung und alternative genetische Codes benötigen eigene Modelle. Die technische Vierer-Codierung ist eine getrennte Funktion.

## Gegenprüfungen

Die [Modelltests im Repository](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/branches/code-observation-lab/model.test.mjs) enthalten unter anderem:

- dieselben Headerbytes mit richtiger und falscher Dateiendung sowie widersprüchliche kurze Header;
- alle 24 Symbolzuordnungen mit Unicode, führendem BOM und absichtlich unpassendem Decoder;
- alle 64 Standardcodons, drei Stopcodons, drei Leserahmen und unvollständige Reste;
- Phasenmittelung mit vier Offsets als Gegenprobe zu einer voreiligen Wegdeutung;
- beide Zustandsbrücken über die gesamte deklarierte Dreiermenge;
- Auftragsannahme ohne Rückmeldung sowie falsche Kameraeinheiten und Bezugssysteme;
- Überlauf des früheren Linsennenners, Unterlauf positiver Leistungsquotienten und die Linsengrenze für 1 bis 100 Sonnenmassen.

Browserregressionen liegen gemeinsam mit den vorhandenen Veröffentlichungstests in [browser.spec.mjs](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/branches/encounter-systems/browser.spec.mjs). Sie benutzen das bereits gesperrte Testpaket aus `encounter-systems`; die eigentliche Anwendung besitzt keine Paketabhängigkeiten. Links zu neuen Dateien auf `main` stehen nach dem zugehörigen Merge bereit.

## Erhaltene Forschungsäste

[data.mjs](data.mjs) führt neun Themen mit konkretem nächstem Prüfweg. Die heutige Auswertung bleibt ein endlicher Stand dieser gebundenen Pakete. Generische Audiospektren, adaptive Raum-/Materialmodelle und ein realer Kameraadapter sind eigene Entwicklungsäste. Astrochemische Stoffnachweise sind Quellenforschung. Private Medien, Transkripte, lokale Identitäten und die originale TrID-Datenbank bleiben an ihren bisherigen Quellorten erhalten.

Die lokale Entitätsberatung ergänzt Prüfideen. Gemeinsam genutzte Modelle, Prompts und Quellen bilden dabei einen korrelierten Herkunftscluster. Die Zahl beratender Rollen ist kein Beweis für Richtigkeit.

## Herkunft und Rechte

Projektleitung: **Juri / HALVETH**. Entwicklung mit KI-Unterstützung. [SOURCE.json](SOURCE.json) beschreibt die neue Implementierung und ihre gebundenen Vorarbeiten; das historische Repository-Manifest bleibt unverändert. Code, Tests, HTML und CSS: MIT. Neu verfasste Datenwerte: CC0. Erläuterungen: CC BY 4.0. Verlinkte Werke behalten ihre eigenen Rechte; siehe [LICENSES.md](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/main/LICENSES.md).
