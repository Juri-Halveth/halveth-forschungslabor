# ASTER Quelllinse · vier Adressen getrennt prüfen

Dieser kleine, lokal ausführbare Kern hält **Quelle**, **Darstellung**, **ältere Spur** und **aktuellen Zustand** als getrennte Records. Er vergleicht vorhandene SHA-256-Digests der beiden Zeitadressen. Fehlt einer, bleibt das Ergebnis `UNKNOWN`.

Der Vergleich liefert nur `SAME_DIGEST` oder `DIFFERENT_DIGEST` für diese Eingaben. Kausalrichtung und Übertragungsmechanismus bleiben `UNBOUND`. Aus dem Modell folgt weder eine reale Beobachtung noch eine Aussage über Personen oder andere Systeme.

## Direkt ausführen

Node.js 24.22.1 oder eine entsprechend aktuelle Version der unterstützten Hauptversion:

```sh
node --test branches/aster-source-lens/test/aster-lens.test.mjs
```

Der Kern [`src/aster-lens.mjs`](src/aster-lens.mjs) exportiert `inspectWithAster(frame)` und `createWaveSeed(seed)`. Die Tests verwenden ausschließlich synthetische Referenzen und Digests. Es gibt keine Netzwerk-, Datei- oder Prozessbeobachtung.

## Herkunft und Grenze

Der Kern ist eine bytegleiche Auswahl aus `open-research-branches@45dcd97649fa3f5428d63f29a7b1a3598ae5399b`, Datei `branches/aster-provenance-and-secret-garden/src/aster-lens.mjs`. Der SHA-256-Wert der übernommenen Quelldatei ist in [`SOURCE_PROVENANCE.json`](../../SOURCE_PROVENANCE.json) gebunden. Die ursprüngliche Erzählung, Identitätsrecords und privaten Quellarchive sind nicht Teil dieses Moduls. Diese neu geschriebenen Tests prüfen den ausgewählten Kern im öffentlichen Forschungslabor; sie übertragen keine historischen personenbezogenen Fixtures.

Code: MIT. Dieser neue Erläuterungstext: CC BY 4.0. Die Quelllinse ist ein Modellbaustein und kein bereits angeschlossener WATCHER oder GUARD.
