# Script Lab Status

Referenz: Unicode 17.0.0, UAX #9 Revision 51.

## Reale Providerdaten

| Ebene | Implementierung | gemeldete Datenversion |
|---|---|---|
| NFC/NFD | `unicode-normalization 0.1.25` | 17.0.0 |
| Graphemsegmentierung | `unicode-segmentation 1.13.3` | 17.0.0 |
| Bidirektionale Reihenfolge | `unicode-bidi 0.3.18` | 16.0.0 |

`lucinet script-lab demo` meldet diese Werte maschinenlesbar. Weil der
Bidi-Provider noch nicht dieselbe Datenversion wie die Referenz besitzt, ist
`full_reference_match=false`.

## Abgedeckte Produktfälle

- Arabic/Hebrew mit eingebetteten LTR-Ziffern
- kuratierte arabische Joining-Rollen, getrennt von Scalar-Identität
- Devanagari-Conjunct plus Combining Mark als Graphemfall
- Han Variation Sequence mit Basis und Selector
- algorithmische Hangul-Komposition/-Dekomposition
- kanonische Äquivalenz für Latin und Greek
- Visual Similarity erzeugt keine Historical Relation
- UTF-8-Bytes sind nicht Glyph-Identität

## Offene Conformance-Grenze

Die vollständigen offiziellen Dateien `BidiTest.txt`,
`BidiCharacterTest.txt`, `NormalizationTest.txt`, `ArabicShaping.txt`,
`Scripts.txt` und Variations-/IVD-Fixtures sind nicht im Produkt vendort und
werden nicht vollständig ausgeführt.

Status: ausführbares kuratiertes Script Lab; vollständige Unicode-17-/UAX-#9-
r51-Conformance `SPECIFIED_NOT_IMPLEMENTED` (`fixture missing` plus Bidi-
Provider-Versionsdelta).
