# Open Hands / exakter Allokationskern

Ein lokaler, reiner Vorschlagsrechner für Anteile in **kleinsten ganzzahligen
Einheiten**. Er nutzt den [Exact Percent Kernel](../exact-percent-kernel/)
und verlangt für jeden Anteil eine ID, ein Label und einen exakten
Prozentstring. Alle vorhandenen Zeilen werden vor der Rechnung geprüft;
ungültige Zeilen werden nicht still übersprungen.

```js
import {planAllocation} from './allocation.mjs';

const proposal = planAllocation({
  amountMinorUnits: '1000',
  shares: [
    {id: 'a', label: 'A', percent: '23'},
    {id: 'b', label: 'B', percent: '23'},
    {id: 'c', label: 'C', percent: '23'},
    {id: 'd', label: 'D', percent: '23'},
    {id: 'e', label: 'E', percent: '4'}
  ],
  remainderId: 'reserve',
  remainderLabel: 'vereinbarte Reserve'
});
```

In diesem Beispiel sind **96 %** zugewiesen; 40 von 1000 Einheiten bleiben
bei der ausdrücklich benannten Reserve. Jedes anteilige Ergebnis wird auf
ganze Einheiten **abgerundet**. Ein Rundungsrest gehört ebenfalls zum
benannten Rest. Wenn eine Einheit 50/50 verteilt werden soll, bekommen
beide Zeilen null Einheiten und die eine Einheit bleibt sichtbar im Rest.
Andere Rundungs- oder Restregeln brauchen einen neuen, benannten Vertrag.

`amountMinorUnits` ist ein kanonischer nichtnegativer Integerstring mit
höchstens 78 Ziffern. Die Liste umfasst höchstens 128 eindeutige
ASCII-IDs; die Rest-ID muss davon verschieden sein. Die Prozente müssen
zusammen höchstens 100 ergeben. Das Ergebnis
ist ein eingefrorenes lokales Datenobjekt im Zustand `LOCAL_PROPOSAL_ONLY`.

## Prüfen

```sh
node --test branches/open-hands-allocation/allocation.test.mjs
```

Der Kern liest keine Dateien, besitzt keine Wallet-Verbindung und sendet
keine Transaktion. Er prüft weder Kontoguthaben noch Ansprüche, Zustimmung,
Marktwert oder externe Verträge. Die historische lokale Open-Hands-Idee
war der Anlass; diese JavaScript-Implementierung wurde neu geschrieben,
ohne privaten Ledgerinhalt zu übernehmen.

**Code und Tests:** [Apache-2.0](LICENSE-APACHE-2.0.txt). Erläuterung:
[CC BY 4.0](../../LICENSE-CONTENT.md). Projektleitung: Juri Halveth /
HALVETH; Implementierung mit KI-Unterstützung.
