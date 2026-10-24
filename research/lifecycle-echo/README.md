# Nachhall – Ein Prozess endet. Sein Ergebnis bleibt.

**Juri · Projekt HALVETH · Entwicklung mit KI-Unterstützung.**

[Lesbare Ergebnisansicht](https://juri-halveth.github.io/halveth-forschungslabor/lifecycle/)
· [Minimierte Messdaten](results.json)
· [Ausführbarer Versuch](lifecycle_probe.py)

Vier eigene Python-Kindprozesse trennen Ausführung, Ausnahmebehandlung,
Threadende, erhaltene Daten und einen neuen Programmstart. Das öffentliche
Protokoll ist eine minimierte Ableitung des lokalen Versuchs vom
23. Oktober 2026, 21:48:26 UTC. Acht Ausgabevergleiche bestanden.

| Lauf | Beobachtung |
| --- | --- |
| Normaler Hauptthread-Ausstieg | `BEFORE_EXIT`, dann `FINALLY`; zuvor geschriebene Datei besteht nach Prozessende. |
| Abgefangenes `SystemExit` | `CAUGHT:0`, danach `AFTER_CAUGHT_EXIT`. |
| Worker-Thread steigt aus | `THREAD_BEFORE_EXIT`, danach `MAIN_AFTER_THREAD_EXIT` im Hauptthread. |
| Neuer Start desselben Codes | Gleicher Quell- und Ausgabedigest, eigener Startrecord. |

Diese Einordnung folgt der [Python-3.12-Dokumentation zu sys.exit](https://docs.python.org/3.12/library/sys.html#sys.exit):
Der Aufruf löst `SystemExit` aus. Abfangen, `finally` und der ausführende
Thread sind für das Ergebnis relevant.

## Reproduzieren

Ab Repository-Wurzel:

```sh
python research/lifecycle-echo/lifecycle_probe.py
```

Der Versuch erstellt ausschließlich einen neuen `run-<id>`-Ordner neben
seinem Script. Er startet vier eigene Prozesse mit `-I -S`, verwendet feste
synthetische Programme und höchstens fünf Sekunden Wartezeit je Kind.
Er beendet bei Timeout ausschließlich sein eigenes gestartetes Kind.
Bestehende Dateien und andere Prozesse bleiben unverändert.

Die neu erzeugten lokalen Receipts enthalten Laufzeitpfade und Prozess-IDs
und werden durch `.gitignore` aus der Versionskontrolle gehalten. Die
veröffentlichte `results.json` lässt Pfade, PIDs und zufällige Instanzkennungen
weg. Die Prüfaussagen und die verwendeten Quell-Digests bleiben enthalten.
`scripts/lifecycle-echo.test.mjs` wiederholt den Versuch in einem eigenen
temporären Verzeichnis und prüft seine acht Ergebnisse.

Die historische Messung bindet Windows-Textdateien mit CRLF-Zeilenende.
Unter Linux schreibt derselbe Python-Textaufruf LF; deshalb ist der Dateidigest
plattformgebunden. Der Test erhält den historischen Digest und prüft die
exakten erwarteten Bytes je Laufzeit. Gleichheit zwischen den beiden eigenen
Starts wird weiterhin innerhalb derselben Laufzeit geprüft.

## Reichweite

Beobachtet wurden feste Ausgabemarker, Rückgabecodes und eigene Dateien.
Die Elternanwendung liest die kleinen stdout-Puffer nach dem Kindprozessende.
Das zeigt Softwarepufferung. Ein vollständiger Betriebssystemtrace, eine
Speicherlöschmessung oder eine astrophysikalische oder biologische Probe ist
damit nicht durchgeführt.

Nächste Forschungsfrage: Wie unterscheidet ein konkreter Empfänger historische
Daten von aktuell gültiger Befehlsbefugnis? Dafür braucht es einen eigenen
Empfänger- und Autorisierungsvertrag.

Code und HTML: [MIT](../../LICENSE). Diese Erläuterung: [CC BY 4.0](../../LICENSE-CONTENT.md).
Minimierte Daten: [CC0](../../LICENSE-DATA.md). Die bestehende Quellenfassung
und das private Originalprotokoll bleiben erhalten.
