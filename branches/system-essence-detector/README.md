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
- Die Scan-JSON enthält lokale Pfade. Sie gehört weder in Git noch in eine
  externe Anfrage. Das öffentliche Beispiel enthält nur erfundene Werte.

## Herkunft und Lizenz

Neu entwickelter, allgemeiner Werkzeugkern aus der HALVETH-Systempflege.
Private Inventare und Originaldateien wurden nicht übernommen. Code, Tests und
Browseransicht dieses Moduls: [Apache-2.0](LICENSE-APACHE-2.0.txt), mit
Namensnennung und Patentregelung. Erläuterungstexte unterliegen der
[Content-Lizenz des Repositories](../../LICENSE-CONTENT.md).

Projektleitung und Zusammenstellung: Juri Halveth / HALVETH. Entwicklung mit
KI-Unterstützung.
