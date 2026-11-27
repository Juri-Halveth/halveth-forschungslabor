# Zwei lokale Ordner vergleichen

`compare.py` vergleicht die relativen Verzeichnispfade sowie die Länge und
SHA-256-Prüfsumme regulärer Dateien in zwei selbst gewählten Ordnern.
Die JSON-Ausgabe enthält Pfade und bleibt lokal außerhalb beider Ordner und
außerhalb von Git-Checkouts. Python 3.11 oder neuer genügt.

```sh
python branches/system-essence-detector/compare.py /pfad/quelle /pfad/kopie --output /privat/vergleich.json
python -m unittest discover -s branches/system-essence-detector -p test_compare.py
```

Mit `--max-entries` und `--max-bytes` lässt sich die Prüfung je Ordner begrenzen.
`coverage.bytesRead` enthält auch die gelesenen Teile zwischenzeitlich geänderter
Dateien. `coverage.bytesHashed` zählt die vollständig und stabil verglichenen
Dateibytes. Eine laufende Änderung, ein übersprungener Link oder ein erreichtes
Limit führt zu `UNKNOWN_INCOMPLETE`. Bei vollständigem Vergleich meldet das
Werkzeug `DIFFERENT` oder `EQUAL_WITHIN_BOUND_COVERAGE`.

Die Prüfung liest jede Datei in ihrem eigenen Zeitfenster und vergleicht
weder Zugriffsrechte noch alternative Datenströme. Für Aussagen über eine
gleichzeitig veränderte Sammlung sind schreibgeschützte Momentaufnahmen nötig.
Der Programmcode und seine Tests stammen aus dem HALVETH-Projektdetektor
und stehen unter [Apache-2.0](LICENSE-APACHE-2.0.txt).
