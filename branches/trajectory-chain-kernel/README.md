# Trajectory Chain / lokaler Replay-Kern

Ein kleiner, neu geschriebener **reiner Datenkern** für eine Folge von
Beobachtungen. Jede Beobachtung ist eine endliche Liste synthetischer
Schlüssel und SHA-256-Digests. Der Kern bildet daraus eine Deltafolge mit
`added`, `modified` und `removed`, bindet jede Folge an ihren Vorgänger und
rekonstruiert den Endzustand beim Prüfen. Ein getrennter Value-Digest bindet
das Ergebnis an den fertigen Event-Hash und vermeidet einen zirkulären Hash.

```js
import {createHash} from 'node:crypto';
import {buildHistory, verifyHistory} from './chain.mjs';

const digest = text => createHash('sha256').update(text).digest('hex').toUpperCase();
const records = buildHistory([
  [{key: 'item', digest: digest('erste Fassung')}],
  [{key: 'item', digest: digest('zweite Fassung')}]
]);
const result = verifyHistory(records);
```

`result.state` ist `VALID_LOCAL_MODEL`, wenn Event-Reihenfolge, Vorgänger,
Delta, Projektion und Value innerhalb dieses JSON-Modells zusammenpassen.
Das ist keine Signatur, kein externer Zeitstempel und kein Nachweis, dass
die Eingabedaten wahr oder vollständig waren. Für Unveränderlichkeit über
einen Angreifer mit Schreibzugriff hinweg braucht es einen unabhängig
verankerten Endhash. Die Schlüssel sind absichtlich nur generische ASCII-IDs;
der Kern scannt keine Dateien und nimmt keine privaten Pfade auf.

Bis zu 1024 Beobachtungen mit je 4096 Einträgen werden akzeptiert. Alle
Eingaben müssen geschlossene Plain-JSON-Werte mit eindeutigen Schlüsseln
und uppercase SHA-256-Digests sein. Der Digestvertrag ist kanonisches JSON
mit sortierten Objektschlüsseln, UTF-8 und einem abschließenden LF.

Die Idee wurde durch einen älteren lokalen Trajektorienbegleiter angeregt;
dessen Quellbytes, Store und historische Eventdaten wurden nicht übernommen.
Die öffentliche Demo nutzt nur synthetische Werte. Der alte lokale Store
bleibt ein eigener, privater Belegstand und ist nicht direkt mit diesem
neu definierten Demo-Schema kompatibel.

## Prüfen

```sh
node --test branches/trajectory-chain-kernel/chain.test.mjs
```

**Code und Tests:** [Apache-2.0](LICENSE-APACHE-2.0.txt). Erläuterung:
[CC BY 4.0](../../LICENSE-CONTENT.md). Projektleitung: Juri Halveth /
HALVETH; Implementierung mit KI-Unterstützung.
