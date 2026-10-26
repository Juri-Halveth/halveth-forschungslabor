# Quellen und Modellgrenzen

Stand des Quellenabrufs: **2026-10-26**. Externe Links begründen jeweils nur den
genannten technischen Teil. Die abstrakten Organparameter sind eigene Entwurfswerte.

| Quelle | Verwendeter Teil | Reichweite |
| --- | --- | --- |
| Vom Nutzer bereitgestelltes `HALVETH_OPEN_ORGANISM_ENGINE.zip`, Version 0.1.0 | Ursprung der generischen Engine, Operatoren und Beispielmodelle | Original mit SHA-256 `0b463b7c4806247f4c9e88959ae03d718751d7e083da60e0a5f6b67de9e4a9f6` erhalten; bereitgestellte Aussagen und grüne Originaltests sind keine unabhängige Wirkungsmessung |
| [WHATWG HTML: Web Workers](https://html.spec.whatwg.org/multipage/workers.html) | Eigener Worker-Eventloop und Nachrichten zur Oberfläche | Browserlaufzeit und Lebensdauer; kein vom Browser unabhängiger Dienst |
| [WHATWG: strukturierte Daten](https://html.spec.whatwg.org/multipage/structured-data.html#safe-passing-of-structured-data) | Übertragung von Datenobjekten | Funktionen werden nicht als ausführbare Callbacks über Structured Clone wiederhergestellt |
| [Node 24.22.1: Dateisystem](https://nodejs.org/docs/v24.22.1/api/fs.html) | FileHandle, begrenztes Lesen, `sync`, `link` und `rename` | System-/Dateisystemverhalten muss beobachtet werden; Sync ist keine universelle Stromausfallgarantie |
| [W3C Content Security Policy Level 3: worker-src](https://w3c.github.io/webappsec-csp/#directive-worker-src) | Ausschließlich eigene Worker in der lokalen Vorschau | Browserpolicy; keine allgemeine Prüfung jedes Nutzergeräts |
| [NIST FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) | SHA-256, gegen veröffentlichte Vektoren und Node crypto geprüft | Digest-/Integritätsfunktion, keine Signatur oder Identitätsbestätigung |
| [NCBI: Standard Genetic Code, Tabelle 1](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi#SG1) | Referenzzuordnung der 64 RNA-Codons | Der Code nutzt zusätzlich eine ausdrücklich einfache AUG-Startheuristik; keine Simulation der Proteinsynthese oder biologischer Merkmale |

## Getrennte Quellenflächen

- **Original:** Das private ZIP und seine ursprünglichen Architektur-/Audittexte.
- **Bearbeitung:** Engine 0.2.0 mit den in `SOURCE.json` genannten Reparaturen.
- **Beobachtung:** Versionierte Testläufe, tatsächlich gestartete Worker und lokale
  Dateireceipts. Mehrere mit demselben Quellstand arbeitende KI-Prüfungen sind ein
  korrelierter Provenienzcluster.
- **Interpretation:** Das Architekturmotiv „lebendes System“ beschreibt die gewünschte
  dauernde Zustandsentwicklung. Es erteilt keinen biologischen, klinischen oder
  Bewusstseinsnachweis.

Das frühere Scarlet-Register wurde für die Herkunft des 68er-Stands betrachtet.
Seine Rollenoriginaltexte und Gestaltung sind nicht Bestandteil der synthetischen
öffentlichen Fixtures. Für jeden externen Registerimport gelten die Rechte der
jeweiligen Quelle; es wird kein neuer Lizenzgrant aus einem Parser erzeugt.
