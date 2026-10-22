# HALVETH / LUCINET · Essence Detector

**Ein lokaler Metadaten-Scan für eine ausdrücklich gewählte Projektwurzel.** Das
Werkzeug macht Platzverbrauch und mögliche Neubau-Schichten sichtbar. Es
löscht, verschiebt, komprimiert und lädt keine Datei hoch.

## Ausführen

Python 3.11 oder neuer genügt; Zusatzpakete sind nicht nötig. Die JSON-Datei
enthält lokale Pfade und bleibt außerhalb eines öffentlichen Repositories.

```powershell
python branches/system-essence-detector/scan.py "C:\Ausgewaehltes-Projekt" --output "C:\Privat\essence-scan.json"
```

Zwei ausdrücklich gewählte lokale Ordner lassen sich zusätzlich **lesend**
gegenüberstellen. Das Ergebnis führt die relativen Verzeichnis- und Dateipfade,
Byte-Längen, SHA-256-Werte, Unterschiede und Coverage-Lücken. Der Ausgabeort
muss außerhalb beider Eingaben und außerhalb dieses öffentlichen Repositories
liegen:

```powershell
python branches/system-essence-detector/compare.py "C:\Quelle" "C:\Arbeitskopie" --output "C:\Privat\tree-compare.json"
```

`EQUAL_WITHIN_BOUND_COVERAGE` bedeutet gleiche beobachtete Pfade und
Dateibytes im abgeschlossenen Leseumfang. `DIFFERENT` benennt eine
beobachtete Abweichung. `UNKNOWN_INCOMPLETE` erhält etwa Links,
Lesefehler, instabile Dateien oder ein erreichtes Budget als offene Lücke.
Der Vergleich prüft keine ACLs, Alternate Data Streams, Laufzeit,
Wiederherstellbarkeit oder gleichzeitige Schreibvorgänge und gibt keine
Löschfreigabe. Auch das JSON-Inventar bleibt privat.

Der **Projektfinder** sucht an einer ausdrücklich gewählten Wurzel und genau
eine Verzeichnisebene darunter nach lokalen Git-Checkouts. Er erfasst HEAD,
Branch, die **Namen** der Remotes und vorhandene Lizenz-*Dateinamen*; Remote-
URLs und Dateiinhalte liest er nicht in den Bericht. Damit werden alte
Projektinseln sichtbar, ohne sie mit einem öffentlichen Repository oder einer
wirksamen Lizenz gleichzusetzen. Die Ausgabe enthält lokale Pfade und bleibt
privat:

```powershell
python branches/system-essence-detector/git_roots.py "C:\Meine-Projekte" --output "C:\Privat\git-roots.json"
```

Ein höheres Suchlimit wird explizit mit `--max-children` gesetzt. Ein
erreichtes Limit, übersprungene Links und Lesefehler stehen im Coverage-Record;
der Finder geht niemals tiefer als eine Kindeebene. Er führt keinen
Git-Checkout, Pull, Status-Refresh, Commit oder Push aus.

Die [Browseransicht](index.html) öffnet die JSON-Datei per Dateiauswahl oder
Drag & Drop im eigenen Browser. Beim Start zeigt sie ausdrücklich
**synthetische Beispieldaten**. Es gibt keine Netzanforderung und keinen
Löschknopf. Auf kleinen Bildschirmen wechseln die Bereiche untereinander;
Tastaturbedienung und reduzierte Bewegung werden berücksichtigt.

```powershell
python -m unittest discover -s branches/system-essence-detector -p "test_*.py" -v
```

## Entscheidungsstufen

| Status | Gebundene Aussage | Nächste Prüfung |
| --- | --- | --- |
| `REBUILDABLE_CANDIDATE` | Ein passender Quell- und Verzeichniskontext wurde lokal gefunden. | Laufende Prozesse, tatsächliche Neubaufähigkeit, externe Nutzung und Plattenwirkung prüfen. |
| `REVIEW` | Ein Name oder eine Struktur deutet auf Cache oder Download hin; die Wiederherstellung ist offen. | Herkunft und möglichen Wiederaufnahmepunkt binden. |
| `HOLD_SOURCE_STATE` | Für einen Website-Build fehlt der saubere Commit-/Receipt-Zusammenhang. | Historischen Quellstand und einzigartige Ausgaben erhalten oder gesondert prüfen. |

`target/debug/incremental` benötigt `Cargo.toml` und `target/CACHEDIR.TAG`.
`Intermediate/Build` benötigt ein `.uproject` sowie `Source` und `Content`.
`.site-build` benötigt einen ignorierten Ordner, `build-info.json` mit
`GIT_STATUS_CLEAN`, passenden HEAD, einen sauberen Arbeitsbaum und
`tools/build_site.mjs`. Ein `.incomplete`-Download bleibt in `REVIEW`, weil
eine spätere Fortsetzung wertvoll sein kann.

## Messgrenze

- Symlinks und Windows-Reparsepunkte werden nicht durchlaufen. Fehler und ein
  erreichtes Eintragslimit bleiben im Coverage-Record sichtbar.
- `logicalBytes` summiert Dateilängen. Verschachtelte Kandidaten überlappen;
  ihre Zahlen dürfen nicht addiert werden. Freier Speicherplatz wird hier
  nicht gemessen.
- Git- und Projektmarker sind Indikatoren für einen möglichen Neubau, keine
  Inhaltsprüfung und keine Löschfreigabe. Quell-Commits, Backups, Belege,
  Spielpakete und aktive Prozesse brauchen eine eigene Prüfung.
- Der Zwei-Ordner-Vergleich liest benannte Bäume. Währenddessen wechselnde
  Dateien werden soweit erkennbar als Lücke geführt; eine vollständige
  Momentaufnahme gegen konkurrierende Schreibvorgänge ist das nicht.
- Die Scan-JSON enthält lokale Pfade. Sie gehört weder in Git noch in eine
  externe Anfrage. Das öffentliche Beispiel enthält nur erfundene Werte.
- Der Projektfinder beantwortet nur, **wo** ein lokaler Git-Root liegt.
  Ein fehlender Remote macht ein Projekt nicht wertlos; ein vorhandener
  Remote oder eine Datei namens `LICENSE` macht es nicht veröffentlichbar.

## Herkunft und Lizenz

Neu entwickelter, allgemeiner Werkzeugkern aus der HALVETH-Systempflege.
Private Inventare und Originaldateien wurden nicht übernommen. Code, Tests und
Browseransicht dieses Moduls: [Apache-2.0](LICENSE-APACHE-2.0.txt), mit
Namensnennung und Patentregelung. Erläuterungstexte unterliegen der
[Content-Lizenz des Repositories](../../LICENSE-CONTENT.md).

Projektleitung und Zusammenstellung: Juri Halveth / HALVETH. Entwicklung mit
KI-Unterstützung.
