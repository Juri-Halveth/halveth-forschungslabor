# GENESIS: prüfbarer Belegsatz

Dieser Belegsatz zeigt **welche lokale Softwarefunktion geprüft wurde**. Die
zugehörigen Quelldateien liegen im benachbarten GENESIS-Modul. Die Aufnahmen
zeigen Browseransichten; der Testlog zeigt einen getrennten lokalen Testlauf.

## Drei sichtbare Zustände

| Aufnahme | Sichtbarer Befund | Grenze |
| --- | --- | --- |
| [Menü A002, Ereignis A001](event-source-menu-a002.jpg) | Nach Auswahl von A002 für den nächsten Impuls bezeichnet die sichtbare Ereigniskarte weiter A001 als Quelle des vorhandenen Events. | Ein Einzelbild belegt keine vollständige Bedienfolge. |
| [Graphlegende A001](event-source-legend-a001.jpg) | Die Legende am Graphen nennt A001 als Quelle des angezeigten Ereignisses; die Zeitspur zeigt einen Replay-Schritt. | Die Aufnahme bindet nur die sichtbare lokale Browserprojektion. |
| [Zwei Events, Rücksprung auf 1/2](two-event-replay.jpg) | Die Zeitspur zeigt `REPLAY OK · 2 Schritte` beim angezeigten Zustand 1/2 und die Legende A001. | Die Aufnahme ist keine unabhängige Messung außerhalb des Modells. |

Die drei Originaldateien des lokalen Arbeitsstands trugen die Endung `.png`,
enthielten aber JPEG/JFIF-Bytes. Hier sind **dieselben Bytes** mit zutreffender
`.jpg`-Endung abgelegt; die SHA-256-Werte stehen in [receipt.json](receipt.json).
Es wurde kein Pixelinhalt umgestaltet. Aufnahmezeit, vollständige Klickfolge
und unabhängiger Browser sind durch diese Dateien nicht attestiert.

## Ausführbare Prüfung

Der [vollständige lokale Testlog](npm-test-20261022.txt) stammt vom
22. Oktober 2026 bei Quell-HEAD
[`c782d4a`](https://github.com/Juri-Halveth/halveth-forschungslabor/commit/c782d4a1ebb7a7cbc9031c6109bd58fe07b504ea):

```text
npm test
Node: 148/148 bestanden
Python: 17/17 + 29/29 + 3/3 bestanden
Exit: 0
```

Die beiden [GitHub-Modulchecks des Quell-Heads](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/6/checks)
waren erfolgreich. Ein GitHub-Check belegt den bezeichneten Test auf seinem
Commit; der lokale Textlog kann durch seine Aufnahme ins Repo allein keine
unabhängige Attestierung erzeugen. Die Tests verwenden synthetische Zustände
und Gegenbeispiele. Sie prüfen weder reale Sensoren noch physische Effekte,
fremde Systeme oder eine allgemeine Vorhersagefähigkeit.

## Was als Nächstes getrennt geprüft wird

Ein späterer Browser- oder Produkttest braucht seinen eigenen gebundenen
Quellstand, Startweg, Beobachtungsfenster, Eingaben, Ergebnis und Gegenprobe.
Der nächste GENESIS-Leistungsrand ist langes Replay: Die Oberfläche berechnet
derzeit nach jedem Impuls die ganze Kette erneut. Die lokale Messung über
100 bzw. 300 Schritte bleibt in der internen Arbeitsakte; sie ist keine
behauptete mobile Bildrate oder Garantie für 9.999 interaktive Schritte.

Projektleitung und Konzept: Juri Halveth / HALVETH; Entwicklung mit
KI-Unterstützung. Die neu geschriebene Erläuterung und die eigenen
Browserabbildungen folgen [LICENSE-CONTENT.md](../../../LICENSE-CONTENT.md).
