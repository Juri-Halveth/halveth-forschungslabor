# Sieben Zahlen, sieben Quellenpfade

Stand der Quellenprüfung: **23. Oktober 2026**. Recherche und neue Laboransichten
im HALVETH/LUCINET-Projekt von **Juri Halveth**, mit KI-Unterstützung.
Die folgenden mathematischen, historischen und naturwissenschaftlichen
Ergebnisse behalten ihre jeweiligen Quellenautoren.

Die sieben Beispiele ergänzen das erhaltene Register von 0 bis 1000. Sie
ersetzen keine historische Recherche zu den übrigen 994 Zahlen. Die Auswahl
beginnt mit der Nutzerfrage nach 666, Siegeln, Binärmustern und alten Schriften;
sie ist keine zufällige Stichprobe und kein statistischer Nachweis besonderer
Häufigkeit dieser Zahlen in der Natur.

| Zahl | Verbindung | Art der Verbindung | Direkt im Labor |
|---|---|---|---|
| 3 | Rosetta: drei Schriften, zwei Sprachen, ein Dekret | dokumentierter historischer Gegenstand | Sprach- und Schriftzuordnung |
| 6 | Kohlenstoff und sechsgliedriger Benzolring | verschiedene chemische Zähleinheiten | Molekülschema |
| 28 | perfekte Zahl und 28 Paare aus acht Elementen | zwei exakte mathematische Identitäten | vollständiger Acht-Knoten-Graph |
| 55 | Fibonacci-Folge und Pflanzenmuster | Modell plus empirische Forschung | Winkeländerung am Setzmodell |
| 64 | sechs Bits, drei Basen, sechs zweiwertige Linien | exakte Kardinalität; historische Rezeption | umschaltbare Bits, DNA-Tripel, Linienbild |
| 137 | inverse Feinstrukturkonstante | Messreferenz mit Unsicherheit | Vergleich mit dem goldenen Winkel und seinen Einheiten |
| 666 | Sonnentafel; Zahl des Tieres; eigene Siegeltraditionen | exakte Summen und getrennte historische Kontexte | Zeilen, Spalten, Diagonalen, Gesamtsumme |

## 666: Die konkrete mathematische Verbindung

Ein normales magisches Quadrat der Ordnung sechs enthält alle Zahlen von 1 bis
36 genau einmal. Damit gilt unabhängig von ihrer Anordnung:

```text
Gesamtsumme = 36 × 37 / 2 = 666
```

Erfüllt die Anordnung zusätzlich die magischen Zeilen- und Spaltensummen,
ergibt jede dieser Linien `666 / 6 = 111`. Agrippas Sonnentafel besitzt diese
Eigenschaft; auch beide Hauptdiagonalen ergeben 111. Die geprüfte englische
Ausgabe von 1651 zeigt das Quadrat und zugehörige Siegel auf derselben Seite.
[Historische Tafel, gedruckte Seite 246](https://en.wikisource.org/wiki/Page:Three_Books_of_Occult_Philosophy_(De_Occulta_Philosophia)_(1651).djvu/271)

Der Zahlenwert bleibt beim Darstellungswechsel gleich:

```text
666 dezimal = 1010011010 binär = 0x29A hexadezimal
```

Die drei gleichen Dezimalziffern bleiben dabei nicht als drei gleiche
Binärziffern erhalten. Darstellungsregel und Zahlenwert sind eigene Objekte.

Die religiöse Bedeutung von 666 hat einen anderen Quellenort:
[Offenbarung 13,18](https://bible.usccb.org/bible/revelation/13) nennt die Zahl
des Tieres. [Irenäus, Gegen die Häresien V,30](https://www.newadvent.org/fathers/0103530.htm)
bespricht die Lesart 616 und mehrere Namen mit passender Zahlensumme. Das
zeigt, weshalb eine passende Zahlensumme einen Namen nicht eindeutig bestimmt.

Lucifer-Zeichen sind wiederum in einer eigenen grimoiregeschichtlichen
Überlieferung zu untersuchen. Die [Edition des Grimorium Verum von Joseph H.
Peterson](https://www.esotericarchives.com/solomon/gv.htm) bindet Textzeugen,
Zeichen und Ausgabenvarianten. Daraus folgt keine Identität aller dieser
Traditionen. Eine historische magische Wirkungsbehauptung bleibt eine Aussage
ihres Textes; die hier gemessene Leistung ist die mathematische Invariante des
Quadrats und die Quellenzuordnung.

**Nutzung:** definierte Zahlengitter, überprüfbare Invarianten, Visualisierung
von Zuordnungen. Zeilen- oder Gesamtsummen können manche Änderungen entdecken,
übersehen aber beispielsweise bestimmte Umordnungen. Sie ersetzen keine
kryptografische Integritätsprüfung.

## 64: Die stärkste exakte Brücke zwischen drei Darstellungen

```text
2 × 2 × 2 × 2 × 2 × 2 = 64
4 × 4 × 4             = 64
```

Sechs zweiwertige Positionen und drei vierwertige Positionen haben dieselbe
Anzahl möglicher Kombinationen. Mit dem ausdrücklich gewählten Vertrag
`A=00, C=01, G=10, T=11` wird daraus eine umkehrbare Abbildung. Beispiel:
`ACT ↔ 000111`. Alle 64 Roundtrips werden lokal geprüft.

Die [genetischen Tabellen des NCBI](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi#SG1)
binden den biologischen Teil: Der Standardcode besitzt 64 Codons, davon 61
Aminosäurecodons und drei Stopcodons. NCBI führt weitere Übersetzungstabellen.
Mehrere Codons können dieselbe Aminosäure bezeichnen; die Übersetzung zur
Aminosäure ist daher keine umkehrbare Sechs-Bit-Codierung. Die Demo arbeitet mit
DNA-Schreibweise; RNA verwendet U anstelle von T.

Die sechs durchgehenden oder geteilten Linien eines Hexagramms ergeben ebenfalls
64 Kombinationen. Die [Leibniz–Bouvet-Briefedition](https://archive.swarthmore.edu/leibniz-bouvet/)
dokumentiert die historische Verbindung zu Leibniz’ Binärarithmetik. Leserichtung,
Bitbedeutung und traditionelle Reihenfolge bleiben getrennte Konventionen.
Die Demo-Indices von 0 bis 63 sind keine traditionellen Hexagrammnummern.

**Nutzung:** reversible Decoder, exhaustive Tests kleiner Zustandsräume,
Vergleiche derselben Daten in mehreren Darstellungen. Die gleiche Anzahl
beweist keinen gemeinsamen Ursprung von DNA, I Ging und Computern.

## 55: Fibonacci, Pflanzen und ein veränderbares Modell

In der Fibonacci-Folge mit `F0=0` und `F1=1` gilt `F10=55` und `34+55=89`.
Die Geometrie des goldenen Winkels lautet mit `φ=(1+√5)/2`:

```text
goldener Winkel = 360° / φ² ≈ 137,507764050…°
```

Das Labor setzt 360 Punkte mit einem Radius proportional zur Quadratwurzel des
Index. Beim Wechsel zu 135° wiederholt sich die Richtung nach acht Schritten.
Dieses geometrische Modell veranschaulicht den Einfluss der Winkelregel.

Eine [Studie an 657 Sonnenblumen, Swinton, Ochu et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4892450/)
erfasst sowohl häufige Fibonacci-Struktur als auch Abweichungen. Das erhält die
Gegenbeispiele, die ein Modell erklären muss.
[Douady und Couder 1992](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.68.2098)
berichten im frei zugänglichen Abstract über entsprechende Strukturen aus
physikalischem Experiment und numerischer Simulation. Der gesamte
kostenpflichtige Artikel wurde hier nicht als gelesen ausgegeben.

**Nutzung:** Platzierung und Dichte in Grafikmodellen untersuchen; mathematische
Formen gegen echte Pflanzenbilder prüfen. Das eigene Setzbild ist keine
Reproduktion der vollständigen physikalischen Versuchsanordnung.

## 137: Definition, Messwert, Unsicherheit und Einheit

[CODATA 2022](https://api.codata.org/drum/constants/constants/InverseFineStructureConstant)
gibt `α⁻¹=137,035999177(21)` an. Die Klammer bedeutet Standardunsicherheit
`0,000000021`. [NIST erklärt α als elektromagnetische Kopplungskonstante](https://physics.nist.gov/cuu/Constants/alpha.html).
Die historische Erklärungsseite wird für diese Definition verwendet; ihr alter
Zahlen- und SI-Stand wird nicht als aktueller Messstand übernommen.

Der goldene Winkel `137,507764…°` ist ein anderer Wert mit anderer Rolle und
Einheit. Eine Rundung oder Präfixübereinstimmung baut keine physikalische Brücke.

**Nutzung:** Datentypen für Integer, Messwert, Standardunsicherheit und Einheit;
das verhindert Scheingleichheit zwischen verschiedenen Modellgrößen.

## 6: Kohlenstoff, Kernzählung und Ringzählung

[IUPAC](https://goldbook.iupac.org/terms/view/C00821) führt Kohlenstoff als Element
6. Die [Royal Society of Chemistry](https://periodic-table.rsc.org/element/6/carbon)
erklärt die Ordnungszahl als Protonenzahl. Das
[NIST WebBook](https://webbook.nist.gov/cgi/cbook.cgi?ID=71-43-2) bindet Benzol,
seine Formel C6H6 und Struktur.

Sechs Protonen **pro Kohlenstoffkern** und sechs Kohlenstoffatome **im Benzolring**
zählen unterschiedliche Objekte. Der Kernzählwert allein sagt die Molekülform
nicht vorher. Außerdem ist `6=1+2+3` eine perfekte Zahl; diese arithmetische
Eigenschaft ist keine Erklärung für chemische Ringbildung.

**Nutzung:** Mengenangaben immer an Objekttyp und Zähleinheit binden.

## 28: Vollständige Paare und Euklids perfekte Zahlen

Die echten positiven Teiler von 28 sind `1,2,4,7,14`; ihre Summe ist 28.
[Euklids Elemente IX.36](https://mathcs.clarku.edu/~djoyce/elements/bookIX/propIX36.html)
liefert einen Konstruktionssatz: Ist `2^p−1` prim, dann ist
`2^(p−1)(2^p−1)` perfekt. Für `p=3` ergibt das `4×7=28`.

Unabhängig davon besitzen acht verschiedene Objekte genau `8×7/2=28`
ungeordnete Paare. Der vollständige K8-Graph im Labor zeigt sie. Nur die sieben
Nachbarschaftskanten würden 21 Paarvergleiche offen lassen.

**Nutzung:** alle direkten Vergleiche zwischen acht Forschungsachsen erfassen.
Die übereinstimmende Zahl begründet keine Kausalität zwischen beiden Sätzen.

## 3: Der tatsächliche Schlüssel des Rosetta-Steins

Der [British-Museum-Objektbericht](https://www.britishmuseum.org/blog/everything-you-ever-wanted-know-about-rosetta-stone)
datiert das Dekret auf **196 v. Chr.**: Hieroglyphen und Demotisch schreiben
Ägyptisch, daneben steht Griechisch. Das sind drei Schriften und zwei Sprachen.
Die Vergleichsstellen halfen zusammen mit weiteren Texten und Sprachkenntnissen
bei der Entschlüsselung. Eine binäre 0/1-Inschrift ist in der hier geprüften
Objektbeschreibung nicht belegt.

**Nutzung:** gebundene Inhalte über verschiedene Darstellungen vergleichen,
Decoder prüfen und gemeinsame Fragmente lokalisieren. Für die historische
Verbindung zweiwertiger Linien mit Binärarithmetik ist Tür 64 einschlägig.

## Warum lässt sich zu fast jeder Zahl eine Verbindung finden?

Eine Zahl kann eine Anzahl, Position, Messgröße, Kennung oder kulturelle
Zuordnung sein. Viele Gegenstände werden gezählt und viele Kulturtraditionen
verwenden Zahlen. Mit freier Auswahl von Basis, Rundung, Einheit und Quelle
wächst die Zahl möglicher Treffer erheblich. Daher benötigt jede behauptete
Verbindung eine vorab benannte Regel und ein unterscheidendes Gegenbeispiel.

Universell im mathematischen Sinn ist beispielsweise: **Jede** Menge aus sechs
zweiwertigen Positionen hat 64 Muster. Eine Bedeutung von 666 in einem
bestimmten Text ist dagegen an diesen historischen Text gebunden. Ein
Naturmechanismus benötigt ein passendes Modell und Beobachtungen.

Zur Frage nach einer greifbaren Wand: Falls eine reale materielle Wand gemeint
ist, beschreiben Atommodelle anziehende und bei zu großer Annäherung abstoßende
Wechselwirkungen; siehe [Feynmans Primärvorlesung, Atoms in Motion](https://www.feynmanlectures.caltech.edu/I_01.html).
Eine Zeichnung oder Zahlenbeschreibung dieser Wand ist eine andere
Repräsentation. Die offene Idee einer weiteren Verbindung bleibt prüfbar,
sobald sie eine konkrete andere Beobachtung vorhersagt.

## Reproduzierbar prüfen

```sh
node --test branches/1001-doors/number-research.test.mjs
node branches/1001-doors/generate.mjs --check
npm test
```

Die neuen Tests binden das historische Zahlenquadrat, 64 reversible
Codierungen, eine geometrische Vergleichsprobe und vollständige Paare. Sie
belegen den lokalen Rechenvertrag. Historische und naturwissenschaftliche
Aussagen bleiben zusätzlich an die verlinkten Quellen und deren Umfang
gebunden.
