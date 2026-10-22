# Projekt Ausgrabungsstätte

Eine begehbare, öffentlich teilbare **Auswahl** aus einer lokalen Suche in
Juris `Documents`-Bestand. [Karte öffnen](index.html) ·
[Effektmodell](effect-model.js) · [Gegenproben](effect-model.test.mjs).

## Was tatsächlich verbunden ist

| Fund | Relation | Stand |
| --- | --- | --- |
| Gemeinsames VCC-2-Master-Dokument in Big Bang, Atlas, SEAL, DEFENDER und REMOTE | `EXACT_SOURCE_TEXT` | Fünf lokale Dateien mit gleichem SHA-256; gleicher Text, kein Nachweis gleicher Implementierung |
| Gemeinsame Meta-Logik-Fassung in Atlas, SEAL, DEFENDER und REMOTE | `EXACT_SOURCE_TEXT` | Vier lokale Dateien mit gleichem SHA-256; gleicher Text, kein Nachweis gleicher Laufzeit |
| Ältere Entity-Network-Akten vom 1. August 2026 | `SOURCE_BOUND_CONCEPT` | Zwei getrennte Fragen: fortlaufende Autorität **über Zeit** und gültiger Scope **am Wirkungsort** |
| Entity Network zum öffentlichen Ereigniskern | `NEW_RESEARCH_BRIDGE` | Neu implementiertes, rein synthetisches Modell; kein übernommener Altcode und kein Anschluss an reale Systeme |
| DISU zu Focus Kernel; ANÁDYSIS zu Ereigniskern | `MODEL_ANALOGY` / `STRUCTURAL_ANALOGY` | Vergleich von Fragen und Zustandsformen, keine Codegleichheit |
| Atlas zur öffentlichen Quellspan-Logik | `POSSIBLE_TYPE_BRIDGE` | Konkreter Adapter mit Typ- und Scopeprüfung steht aus |

Bei ANÁDYSIS ist der nächste konkrete Anschluss als **Messprofil** beschrieben:
Der historische `EMERGENCE_MEASUREMENT_PLAN` verlangt Schätzer, Skalenfenster,
Unsicherheit und Nullmodell statt einer einzelnen „Emergenz-Zahl“. Der Entwurf
`EMERGENT_GEOMETRY_MODEL` beschreibt Dimension aus Graphrelationen ohne
vorgegebene Raumkoordinaten. Diese Funde sind ein Forschungsast; eine
veröffentlichte Implementierungsbrücke und ein physikalischer Atomversuch
folgen daraus nicht.

Eine weitere öffentliche Nachbarschaft ist das
[`INFINITY`-Dossier in Scarlet](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/docs/entities/infinity.md):
Es beschreibt viele Möglichkeiten und den begrenzten Umfang einer konkreten
Handlung. Die Beziehung zu ANÁDYSIS ist hier `CONCEPTUAL_ADJACENCY`:
Auswahl und Messung können gemeinsam befragt werden, doch das Dossier ist
kein Emergenz-Messwert und keine physikalische Erklärung für Strahlung durch
Atome. Die Quelle wurde gegen den öffentlichen Git-Blob
`c11417d31de77ccf4b97f16aa2dbd791e4d21471` gebunden.

Die beiden lokalen Bytevergleiche sind an folgende Digest-/Größenpaare
gebunden. Sie sind Prüfschlüssel für die erhaltenen Originale, kein Beleg für
Urheberschaft, Erfindungsdatum oder gleiche Ausführung:

| Familie | SHA-256 | Größe |
| --- | --- | ---: |
| VCC-2-Mastertext | `74131d56fe952ee5ddd85d91943979056dda7b8c083e95004c08f74994c5992d` | 21.350 Bytes |
| Meta-Logik-Fassung | `307caa72788f57b87ccbfa79301d0e321130893f2871c1a4ab9194fbced20f3f` | 5.976 Bytes |

Die lokale Suche sammelte 592.235 eindeutige Dateipfade in einem Metadaten-
Snapshot. Aus ausgewählten historischen Wurzeln wurden 1.062 Text- und
Codequellen vollständig gehasht und, soweit UTF-8, nach Begriffen durchsucht.
Benannte Buildordner und Reparse-Pfade wurden ausgenommen; andere generierte
Kopien können im Index stehen. Das ist eine
**endliche Suchabdeckung**, keine vollständige inhaltliche Prüfung sämtlicher
Dateien. Vollständige lokale Pfade, private Archive und Rohbeweise sind nicht
Teil dieser öffentlichen Auswahl.

Der neue Scanner gehört fachlich zum bereits vorhandenen
[`bounded-knowledge-reuse-inventory`](../bounded-knowledge-reuse-inventory/):
**erfassen → deklarierte Metadaten prüfen → öffentliche Ableitung schreiben**.
Die erste Stufe erzeugt keine fertigen Records für die zweite; ein geprüfter
Adapter und eine bewusste Auswahl wären der nächste technische Schritt. Das
Metadaten-Gate erteilt seinerseits keine Publikationsberechtigung.

## Das neue Modell

`evaluateContinuingEffect(record)` nimmt ausschließlich fünf deklarierte
dreiwertige Felder entgegen: aktive Wirkung, ursprüngliche Erlaubnis, aktuelle
Erlaubnis, Scope am Wirkungsort und ausdrückliche Fortsetzung. Es hält eine
zeitliche Abweichung, eine Kontextabweichung und fehlende Angaben auseinander.
Die Fälle sind synthetisch. Ein `CURRENT_AUTHORITY_DECLARED` ist eine Aussage
über die **Eingabe**, keine Authentisierung oder rechtliche Freigabe.

Eine behauptete Fortsetzung bei zugleich verneinter aktueller Erlaubnis wird
als Konflikt angezeigt. Der Prüfer kann keine Berechtigung erschaffen und
führt keine Aktion aus.

```sh
node --test branches/documents-excavation/*.test.mjs
python -m http.server 8847 --bind 127.0.0.1
```

Die Karte ist anschließend unter
`http://127.0.0.1:8847/branches/documents-excavation/` erreichbar.

## Weitere lokale Ausgrabung

[`scripts/excavate-metadata.py`](../../scripts/excavate-metadata.py) ist das
veröffentlichbare Suchwerkzeug hinter dem ersten Inventurschritt. Es liest
Dateinamen, Größe und Zeitstempel, aber keine Dateiinhalte; Reparse-Pfade und
generierte Ordner werden ausgelassen. Die Ausgabe enthält **private relative
Pfade** und muss deshalb in einem lokalen Verzeichnis außerhalb des Git-Repos
bleiben. Budgetende und Lesefehler stehen im Summary.

```sh
python scripts/excavate-metadata.py --root "C:/Pfad/zur/Sammlung" --output "C:/Pfad/zum/lokalen/Index" --max-files 100000 --max-seconds 600
```

Der hier genannte öffentliche Quellbestand ist eine kuratierte Ableitung.
Aus einem neuen Metadatenindex folgt weder automatische Veröffentlichung noch
die Freigabe einer privaten Datei.

## Herkunft und Lizenzen

Projektleitung und ursprüngliche Forschungsfragen: **Juri Janovski /
HALVETH**. Diese öffentliche Fassung, Visualisierung und das Effektmodell
wurden für diesen Zweig neu geschrieben, mit KI-Unterstützung. Es wurden keine
privaten Produktquellen, Vorfallsdetails oder persönlichen Dateipfade kopiert.
Code, Tests, HTML und CSS folgen der Repository-Lizenz MIT; neu geschriebene
Erläuterungen CC BY 4.0; [Details](../../LICENSES.md).

**Stand:** 22. Oktober 2026. Historische Statusaussagen sind als
`SOURCE_REPORTED` markiert und in diesem Zweig nicht neu ausgeführt. Für
weitere Ausgrabungen bleiben Source-Snapshot, Owner-Freigabe, Adapter und
messbarer Laufzeitvergleich getrennte nächste Schritte.
