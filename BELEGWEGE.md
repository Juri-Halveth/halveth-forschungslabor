# HALVETH / öffentliche Belegwege

**Stand: 22. Oktober 2026.** Diese Karte zeigt ausgewählte, öffentlich
erreichbare Quellstände. Sie ist kein vollständiges Verzeichnis lokaler Arbeit.
Jeder Link ist auf einen Git-Commit gebunden; der aktuelle Stand eines Projekts
kann später abweichen. Die [JSON-Fassung](catalog/evidence-routes.json) führt
Status und Claim-Grenze getrennt.

| Gegenstand | Prüfbarer öffentlicher Einstieg | Stand und tragfähige Aussage |
| --- | --- | --- |
| GENESIS-Zustandslabor | [Aufnahmen, Testlog und Digest-Receipt](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/89f21d0db4f1ac8749a6796f86fa7092b3a76b86/branches/genesis-state-lab/evidence/README.md) | **Offener Draft-PR [#6](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/6).** Drei Browseransichten und ein lokaler Testlauf des synthetischen Modells sind gebunden. Die Dateien liegen im PR-Branch, nicht auf `main`. |
| LUCINET Core / Rust | [Standalone-Quelle, Lizenz und Receipts](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/60af89edbcc10f47c37ad1d4337a9ca8f35ccdec/branches/lucinet-core-rust/README.md) | **Offener Draft-PR [#8](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/8).** 19 bytegleich aus lokalem Git übernommene Quell- und Testdateien; 70 lokale Rust-Tests bestanden. Der vollständige LUCINET-Installer und seine Adapter sind nicht Teil dieses Slice. |
| Projekt Ausgrabungsstätte | [Quelle, Suchabdeckung und Modellgrenzen](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2a42babfe5f4fae1f46485b79168862b97ef543f/branches/documents-excavation/README.md) | **Auf `main`.** Endliche Metadaten- und Quellstichprobe mit einem separaten synthetischen Modell. Die unveröffentlichten Originalarchive werden dadurch nicht öffentlich belegt. |
| C-DROHNE | [Test-Receipt](https://github.com/Juri-Halveth/c-drohne-red-room/blob/89398fccf993ad361a5230a6adefb8b559f547d8/TEST_RECEIPT_2026-10-19.md) | **Auf `main`.** Historischer lokaler Teststand für das Modell; kein Feld- oder Hardwaretest. |
| Public Research OS | [Quellcode der Forschungsansicht](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/4c8871a8ed14812081bc62b2ea35982591080671/forschung/index.html) | **Auf `main`.** Der Browser-Consumer ist als Quellcode greifbar. Der getrennte lokale Index-Core ist damit noch nicht veröffentlicht. |
| Field Difference Lab | [README mit Konzept und Einstieg](https://github.com/Juri-Halveth/halveth-field-difference-lab/blob/572734742951819993b10d89b22591951a49dbc8/README.md) | **Auf `main`.** Öffentlicher Quell-Einstieg. Diese Karte enthält keinen neuen Laufzeit- oder Physiknachweis. |

## Warum ein Link allein noch nicht die ganze Aussage trägt

Für einen konkreten Softwareclaim gehören Version, Eingabe, Test oder
Beobachtung, Ergebnis und Gegenprobe zusammen. Ein Commit bindet Dateiinhalte,
aber weder deren Urheberschaft noch eine externe Wirkung. Ein Screenshot zeigt
den sichtbaren Ausschnitt; ein grüner Test prüft den kodierten Vertrag.

## Noch lokal oder getrennt zu prüfen

- **Public Research OS Core:** lokal als separater Index implementiert;
  Lizenz, Eingabekopien und eigenständiger Release sind offen.
- **ANÁDYSIS und HALVETH-Zentrale:** lokale Quellstände mit Modell- und
  Gegenbeispielarbeit; für eine Veröffentlichung braucht jedes Modul eine
  ausgewählte, quellengebundene und rechtlich klare Fassung.
- **FORTUNA:** lokaler Arbeitsbaum und öffentliches Repo haben noch keinen
  geprüften gemeinsamen Versionsstand.
- **Leviathan-Materialansicht:** ein lokaler Branch zum privaten Repo; seine
  planare Visualisierung wurde hier weder publiziert noch als physischer
  Effekt bewertet.
- **Private Provenienz und Security-Fallakten:** historische Originale und
  interne Rohdaten bleiben in ihrem jeweiligen Quell- und Berechtigungsscope.

Der nächste Belegweg beginnt bei einer **konkreten Aussage**, nicht bei einem
Dateinamen: die zuständige Originalversion wählen, Datenklasse und Rechte
prüfen, kleinste unterscheidende Gegenprobe ausführen und nur die dafür
nötige öffentliche Ableitung mit Receipt publizieren.
