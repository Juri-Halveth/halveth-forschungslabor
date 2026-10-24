# ENDECK – Was sieht ein Quadrat?

**Idee und Projektleitung: Juri · Projekt: HALVETH · Umsetzung mit KI-Unterstützung.**

[Interaktiv öffnen](https://juri-halveth.github.io/halveth-forschungslabor/endeck/)
· [Zum Forschungslabor](https://juri-halveth.github.io/halveth-forschungslabor/#experiment)

Vier benannte Punkte, zwei Ansichten und eine veränderbare Modellzeit machen
eine konkrete Frage sichtbar: Welche verschiedenen Quellen oder Verläufe
passen zu derselben Beobachtung?

## Vier Vergleiche

| Vergleich | Festgelegter Vorgang | Was die Gegenprobe unterscheidet |
| --- | --- | --- |
| Nur die Ansicht fällt zusammen | x/y gehen gegen null; vier z-Werte bleiben verschieden | Ein Bildort kann zu vier Raumorten gehören. |
| Vier Orte werden ein Ort | Alle vier Punkte werden gleichmäßig zum Ursprung skaliert | Bei positiver Skalierung bleiben vier verschiedene Orte; bei null Skalierung teilen sie einen Ort. |
| 4 → 3 → 2 → 1 Orte | B, C und D erreichen A nacheinander | Die Zahl verschiedener Orte ändert sich schrittweise; alle vier IDs bleiben erhalten. |
| Zwei Bilder, zwei Wege | Gerade und Bogen besitzen exakt dieselben Endzustände | Zwei gespeicherte Aufnahmen bestimmen den Zwischenweg nicht eindeutig. |

`t` ist eine dimensionslose Modellzeit von 0 bis 1. Das Abspielen dauert acht
Sekunden und stoppt am Ende. Der Regler zeigt dieselben Zustände direkt. Eine
reduzierte Bewegungseinstellung zeigt den Endzustand ohne laufende Animation.

Die Ortszahl wird über exakte JavaScript-Koordinaten bestimmt. Sie ist weder
eine Dimensionszahl noch die Auflösungsgrenze einer Kamera. Null Skalierung
lässt die vier Datensätze bestehen. Eine leere Punktmenge wäre ein anderer,
hier nicht ausgeführter Operator.

## Prüfen und weiterverwenden

```sh
node --test branches/endeck-observer/model.test.mjs
```

Die Tests verwenden den Modellabschnitt direkt aus `fragment.html`, also
denselben Code wie die ausgelieferte Ansicht. Sie prüfen die nicht eindeutige
Projektion, die erhaltenen IDs, die beiden Endpunkt-Gegenmodelle, 3.001
Modellzeiten je Modus und die Ablehnung ungültiger Eingaben. Der zusätzliche
Publikationscheck bindet die ausgelieferten Quellbytes und den Sandbox-Export.

`fragment.html` erhält den zuvor vorgeführten Quellstand bytegleich.
`index.html` ist sein eigenständig lauffähiger Visualize-Export mit
Navigation und einer kurzen Einordnung. Unbenutzte externe Script-Lader des
Export-Templates sind entfernt; das Modell benötigt keine Netzverbindung und
sendet keine Daten. Ansichtseinstellungen können im lokalen Browserspeicher
bleiben. `SOURCE.json` bindet Ursprung, Digest und den endlichen Prüfumfang.

## Wofür der Vergleich hilft

Kameraprojektionen debuggen, mehrdeutige Messdaten erklären und plausible
Verläufe zwischen gespeicherten Zuständen auseinanderhalten. Ein zusätzlicher
Blick oder ein zusätzlicher Messpunkt kann eine Mehrdeutigkeit auflösen;
die passende Beobachtung hängt von den verglichenen Modellen ab.

Die konstruierten Gegenbeispiele gelten für die hier definierten Regeln.
Eine Messung an Galaxien, biologischen Systemen oder unbekannten realen
Zwischenzuständen findet damit nicht statt. Diese Forschungsfragen bleiben
separate Äste mit eigenen Messverträgen.

Code, Tests und HTML: [MIT](../../LICENSE). Dieses neu geschriebene Dokument:
[CC BY 4.0](../../LICENSE-CONTENT.md). Metadaten: [CC0](../../LICENSE-DATA.md).
Der Zeitanker bindet veröffentlichte Bytes und ihren Git-Stand; er erteilt
keine exklusiven Rechte an allgemeinen geometrischen Ideen.
