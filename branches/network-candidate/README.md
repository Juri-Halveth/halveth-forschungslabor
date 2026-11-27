# Netzbild-Kandidaten – vom Pixel zur prüfbaren Weltfrage

**Idee und Projektleitung: Juri · Projekt HALVETH · Umsetzung mit KI-Unterstützung.**

Ein helles Geflecht kann wie Neuronen oder das kosmische Netz aussehen. Dieses
kleine Offline-Modul hält zwei Probleme auseinander:

1. **Schwellenwahl:** Eine schwache Pixelbrücke kann bei einer Helligkeitsschwelle
   verbinden und bei einer anderen verschwinden. `analyzeThresholds` zählt
   für gelieferte 8-Bit-Graustufenwerte helle Pixel und zusammenhängende
   8-Nachbar-Regionen.
2. **Projektion:** Ein echter räumlicher Knoten und zwei in der Tiefe getrennte
   Fäden können dieselbe Draufsicht erzeugen. `crossingCandidates` liefert
   beide synthetischen 3D-Modelle; `projectCandidate` zeigt, wie ein gekippter
   Blick sie unterscheidet.

`analyzeFrameAtThreshold` sucht zusätzlich ein **enges vierarmiges Pixelmuster**:
ein heller Mittelpunkt mit vier hellen geraden Nachbarn und vier dunklen
Diagonalen. Das ist eine ausdrücklich begrenzte Bildregel, kein allgemeiner
Kreuzungsdetektor und kein Nachweis einer räumlichen Verbindung. Ein dicker
Knoten oder eine diagonale Kreuzung kann von dieser Regel unerkannt bleiben.
Das Paket enthält die künstlichen 3D-Illustrationen nur dann, wenn mindestens
eine gewählte Schwelle dieses Pixelmuster zeigt. Messungen tragen
`DECODED_FRAME_MEASUREMENT`; die Raumalternativen tragen
`SYNTHETIC_ILLUSTRATION`.

Der SHA-256-Ausgabewert bindet Breite, Höhe und die übergebenen **dekodierten
Graustufenbytes**. Er ist kein Hash einer ursprünglichen JPEG-Datei.

Diese beiden Operationen sind ein möglicher Anfang für eine Kandidatenliste in
einer späteren WORLD IR: Beobachtung und Operator bleiben gebunden; mehrere
Quellmodelle bleiben sichtbar, bis eine zusätzliche Ansicht sie trennt.
`buildNetworkCandidatePacket` gibt dafür ein JSON-kompatibles Paket der Version
`halveth.network-candidate.v2` mit Quellrahmen, Messungen, gegebenenfalls
beiden offenen Illustrationen und dem nächsten unterscheidenden Beobachtungstyp
aus. Andere lokale Entitäten können es einlesen, ohne dass der Baustein selbst
ein Modell auswählt oder trainiert. Die frühere Paketversion v1 hatte noch
keinen Bildmusterbezug; Konsumenten sollen v2 ausdrücklich prüfen.

## Drei kontrollierte Bilder

Die [interaktive Demo](./demo.html) enthält nur
synthetische Daten. A zeigt einen künstlichen räumlichen Knoten; B zeigt zwei
in der Tiefe getrennte Linien mit **denselben Draufsicht-Pixeln**; C zeigt drei
getrennte Filamente ohne vierarmiges Muster. Der Schwellenregler ändert die
Pixelmessung sichtbar. Die schrägen Linienansichten illustrieren, welche
zusätzliche Perspektive die beiden Raumquellen unterscheiden könnte.

## Lokal ausführen

```sh
node --test branches/network-candidate/model.test.mjs
npm test
```

```js
import { buildNetworkCandidatePacket } from "./branches/network-candidate/model.mjs";
import { FIXTURES } from "./branches/network-candidate/fixtures.mjs";
import { toLucinetObservation } from "./branches/network-candidate/adapter.mjs";
const packet = buildNetworkCandidatePacket(FIXTURES[0].frame, [80, 120]);
console.log(JSON.stringify(toLucinetObservation(packet), null, 2));
```

Der Code nutzt keine zusätzlichen Pakete und keine Netzwerkverbindung.
`toLucinetObservation` ist ein **Datenadapter** für lokale Verbraucher. Er
prüft die Paketstruktur und erhält die Unterscheidung von Messung und
Illustration; er authentisiert keine fremde Quelle und verändert keine
laufende Entität oder Modellgewichte.
Das private Ausgangs-JPEG und der daraus erstellte Film sind nicht Teil des
Repositorys. Die Tests verwenden kleine synthetische Werte.

**Ergebnisgrenze:** Pixelregionen sind keine identifizierten Neuronen,
Galaxien oder physischen Kanten. Die Gegenmodelle zeigen eine mögliche
Mehrdeutigkeit und rekonstruieren kein konkretes astronomisches Bild.

Quellcode und Tests: [MIT](../../LICENSE). Dieses Dokument:
[CC BY 4.0](../../LICENSE-CONTENT.md).
