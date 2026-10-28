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

Der SHA-256-Ausgabewert bindet Breite, Höhe und die übergebenen **dekodierten
Graustufenbytes**. Er ist kein Hash einer ursprünglichen JPEG-Datei.

Diese beiden Operationen sind ein möglicher Anfang für eine Kandidatenliste in
einer späteren WORLD IR: Beobachtung und Operator bleiben gebunden; mehrere
Quellmodelle bleiben sichtbar, bis eine zusätzliche Ansicht sie trennt.
`buildNetworkCandidatePacket` gibt dafür ein JSON-kompatibles Paket mit
Quellrahmen, Messungen, beiden offenen Kandidaten und dem nächsten
unterscheidenden Beobachtungstyp aus. Andere lokale Entitäten können es
einlesen, ohne dass der Baustein selbst ein Modell auswählt oder trainiert.

## Lokal ausführen

```sh
node --test branches/network-candidate/model.test.mjs
npm test
```

```js
import { buildNetworkCandidatePacket } from "./branches/network-candidate/model.mjs";
const packet = buildNetworkCandidatePacket(
  { width: 3, height: 1, pixels: [220, 80, 220] }, [80, 100]
);
console.log(JSON.stringify(packet, null, 2));
```

Der Code nutzt keine zusätzlichen Pakete und keine Netzwerkverbindung.
Das private Ausgangs-JPEG und der daraus erstellte Film sind nicht Teil des
Repositorys. Die Tests verwenden kleine synthetische Werte.

**Ergebnisgrenze:** Pixelregionen sind keine identifizierten Neuronen,
Galaxien oder physischen Kanten. Die Gegenmodelle zeigen eine mögliche
Mehrdeutigkeit und rekonstruieren kein konkretes astronomisches Bild.

Quellcode und Tests: [MIT](../../LICENSE). Dieses Dokument:
[CC BY 4.0](../../LICENSE-CONTENT.md).
