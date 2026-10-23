# Drei-Gabel · ein interaktives Drei-Akteure-Modell

Juris Ausgangsidee: Während A und B miteinander konkurrieren, kann C aus einer zunächst schwächeren oder übersehenen Position einen eigenen Weg eröffnen. Ein möglicher entscheidender Folgeschritt liegt nicht schon im Eintritt, sondern in den Reaktionen auf diesen dritten Weg.

## Lokal starten

Im Repository-Root:

```sh
python -m http.server 8847 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8847/branches/three-actor-fork/` öffnen. Das Labor benötigt kein Konto, keine API und keinen Netzabruf. Die Auswahl wird nur im aktuellen Browserzustand gehalten.

## Modellvertrag

1. **Ausgangslage:** A und B verfolgen verschiedene Wege. Über ihren tatsächlichen Konfliktgrund behauptet das Modell nichts.
2. **Zug 1:** C tritt eigenständig ein. `paths` wird von `[A,B]` auf `[A,B,C]` erweitert. C ersetzt keinen der beiden Akteure.
3. **Zug 2:** A und B wählen jeweils `offen`, `kooperiert` oder `blockiert`. `evaluateFork` bildet die Kombination deterministisch auf einen benannten **Kandidatenzustand** und eine offene Folgefrage ab.
4. **Ergebnisprüfung:** Weder `PAIR_CANDIDATE` noch `THREE_WAY_CANDIDATE` oder `EXCLUSION_CANDIDATE` ist bereits ein Sieg, ein Konsens oder ein belegtes „Schachmatt“. Dafür wären Ziele, Mittel, Zustimmungen, Regeln und eine beobachtete Folgehandlung nötig.

Das Modell rechnet keine Nutzenwerte und simuliert keine realen Personen. „Zug“ meint hier einen Schritt in einem abstrakten Interaktionsmodell, keinen legalen Zug einer Schachfigur.

## Lerntunnel für Programme und KI

[`LERN-TUNNEL.md`](LERN-TUNNEL.md) führt die Idee durch drei konkrete Softwarefälle: konkurrierende Lösungen, widersprüchliche Parser und widersprechende KI-Antworten. In jedem Fall werden die zwei Ausgangspositionen, eine eigenständige dritte Option, eine Gegenfrage und die nötige Prüfung getrennt. Das ist eine wiederverwendbare Denk- und Prüfstruktur; dieses Modul trainiert oder verändert kein KI-Modell.

## Forschungsanschluss

Die Forschung zu [Koalitionsbildung in fortgesetztem Konflikt](https://link.springer.com/article/10.1007/s00182-009-0203-4) behandelt unter bestimmten Annahmen drei konkurrierende Akteure und zeigt, dass die beiden schwächeren Akteure häufig eine Koalition gegen den stärkeren bilden. Das ist ein **Vergleichsmodell**, keine Herleitung dieser Oberfläche und keine universelle Vorhersage für Juris Idee. Das eigene Labor lässt ausdrücklich auch unabhängige, blockierte und offene Wege sichtbar.

Der Morrowind-Begriff „Gabel“ bleibt ein gestalterischer Anstoß. Dieses Modul verwendet keine Bethesda-Assets und behauptet keine Verbindung zu Marvel, Bethesda oder einer realen Organisation.

## Code und Rechte

`model.js` ist ein reiner lokaler Evaluator; `view.js` steuert die Oberfläche. [`diagram.mmd`](diagram.mmd) hält den gleichen Entscheidungsbaum als editierbare Mermaid-Quelle für FigJam bereit. Die `.js`-Endung erhält beim lokalen Python-HTTP-Server den für Browsermodule nötigen JavaScript-Medientyp. Die neuen Dateien wurden für dieses Modul erstellt und nicht aus einem fremden Projekt übernommen. Die Repository-Regeln in [`../../LICENSES.md`](../../LICENSES.md) gelten: Code, HTML und CSS MIT; dieses Markdown CC BY 4.0. Projektleitung: Juri / HALVETH; Entwicklung mit KI-Unterstützung.
