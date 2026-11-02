# 256 · 512 · 1024 / Namen, Zahlentafeln und sichtbare Regeln

Stand: 23.10.2026. Forschungsaufsatz und lokales Rechenmodell 1.0.0.
Projektidee: Juri Halveth / HALVETH. Umsetzung mit KI-Unterstützung.

## Erhaltene Ausgangslage

Im gelieferten v1-Generator stehen bereits diese Entwürfe:

- **GENESIS-256:** 2^8 Agenten als reproduzierbare Testsituation.
- **GENESIS-512:** 2^9; Vergleich eines 8×8×8-Rasters mit einem dynamischen Graph.
- **1024:** 2^10 als binäre Schwelle für Speichergrößen und Tests.

Die ersten beiden Werte gehören zum Register 0–1000. 1024 stand im besonderen
Wörterbuch außerhalb des tatsächlich generierten Registers. Der neue Zusatzpfad
macht diesen Entwurf ausführbar. Er verändert weder die 1001 Originalrecords noch
ihre IDs, Digests oder das historische Nachbarschaftsregister.

Der frühere Entwurf ist Herkunft des Forschungsziels. Die folgenden Berechnungen
und recherchierten Fachquellen begründen die einzelnen neuen Aussagen.

## 1. Eine zusätzliche binäre Stelle verdoppelt den Zustandsraum

| Anzahl unabhängiger Bits | Zahl möglicher Muster | Unsigned Indices | Binärdarstellung der Anzahl selbst |
| --- | ---: | --- | --- |
| 8 | 256 | 0–255 | 100000000, neun Ziffern |
| 9 | 512 | 0–511 | 1000000000, zehn Ziffern |
| 10 | 1024 | 0–1023 | 10000000000, elf Ziffern |

Die kombinatorische Aussage lautet `|{0,1}^k| = 2^k`. Sie setzt voraus, dass jede
der k Positionen unabhängig beide Zustände annehmen darf. Eine verbotene
Kombination oder feste Prüfstelle kann den zulässigen Zustandsraum verkleinern.

Die NIST-Referenz nennt acht Bits pro Byte und unterscheidet binäre Präfixe von
SI-Präfixen. `1 KiB = 1024 B`, während `1 kB = 1000 B`. **1024 mögliche Zustände**,
**1024 Bits** und **1024 Bytes** haben verschiedene Typen und Mengen. Eine
Bitanzahl ist außerdem keine alleinige Aussage über die Sicherheit eines
Verschlüsselungsverfahrens.

[NIST: Binäre Präfixe](https://pml.nist.gov/cuu/Units/binary.html)

## 2. Gleiche Menge, verschiedene Adressen und Nachbarschaften

`256 = 16²`, `512 = 8³ = 32×16`, `1024 = 32²`.

Das Browserraster verwendet `index = y * columns + x`, mit X von links nach
rechts und Y von oben nach unten. Für 512 existiert zusätzlich die umkehrbare
Würfeladresse `index = z*64 + y*8 + x` mit jeder Koordinate in 0–7.

Die **Abbildung zwischen Indices und Koordinaten** wird vollständig geprüft.
Ein 2D-Raster und ein Würfel besitzen dadurch dieselbe Anzahl adressierbarer
Elemente. Ihre Nachbarschaften ergeben sich erst aus einer zusätzlichen
Kantenregel. Die aktuelle Ansicht simuliert weder eine physische Welt noch
interagierende Agenten. Genau diese nächste Modellkante bleibt offen.

## 3. Was die gezeigte Buchseite tatsächlich enthält

Die Nutzerabbildung entspricht Agrippas Sonnentafel in der englischen Ausgabe
von 1651, gedruckte Seite 246, digitaler Scan 271. Darauf stehen das Zahlengitter,
eine hebräische Zahlschreibweise und drei benannte grafische Zeichen.

Der direkt geprüfte Primärtext, Buch II Kapitel 22, ordnet der Sonne ein
6×6-Quadrat zu. Die Zahlen 1 bis 36 kommen je einmal vor. Zeilen, Spalten und
beide Hauptdiagonalen haben die Summe 111. Die Gesamtsumme ist 666.

[Scan und Transkription](https://en.wikisource.org/wiki/Page:Three_Books_of_Occult_Philosophy_(De_Occulta_Philosophia)_(1651).djvu/271)
· [Primärtext in der Edition von Joseph H. Peterson](https://www.esotericarchives.com/agrippa/agripp2b.htm)

Der Scan ist der historische Bildbeleg. Die Transkription ist ein eigener
editorischer Verarbeitungsschritt. Unsere neue hebräische Zahlenansicht wird
berechnet und beansprucht keine buchstaben- oder pixelgenaue Transkription des
Drucks. Insbesondere verwenden wir für 15 und 16 die heute gebräuchlichen
Schreibweisen טו und טז; die gezeigte historische Tafel besitzt andere Varianten.

Hebcal dokumentiert die verwendeten Buchstabenwerte und die besonderen
Schreibweisen 15/16 aus der Praxis seines Kalendersystems. Unicode beschreibt
die hebräische Schrift und ihre Schreibrichtung von rechts nach links. Im Code
bleibt die logische Unicode-Zeichenfolge erhalten; eine sichtbare Rechts-nach-
links-Darstellung wird nicht mit einer Umkehr der gespeicherten Zeichen verwechselt.

[Hebcal: Buchstabenwerte](https://www.hebcal.com/home/1824/numerical-values-of-hebrew-letters)
· [Unicode 17, Abschnitt 9.1.1](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-9/)

## 4. Der Zusammenhang umfasst auch die Namen

Agrippas Tabelle nennt **Nachiel** als Intelligenz und **Sorath** als Geist der
Sonne. Die zugeordneten hebräischen Schreibweisen ergeben:

| Quellenname | Exakte Zeichenfolge | Einzelwerte in logischer Lesereihenfolge | Summe |
| --- | --- | --- | ---: |
| Nachiel | נכיאל | 50 + 20 + 10 + 1 + 30 | 111 |
| Sorath | סורת | 60 + 6 + 200 + 400 | 666 |

Das sind überprüfbare Beziehungen zwischen Namen und den Zahlen der Tafel.
Die Quelle dokumentiert ein absichtlich verbundenes religiös-magisches
Zuordnungssystem. Ihre Aussagen über übernatürliche Wirkungen sind historische
Lehraussagen; die Arithmetik der Namen ist getrennt davon reproduzierbar.

Ein Gegenbeispiel begrenzt, was eine solche Summe identifizieren kann:
`אב = 1+2 = 3` und `בא = 2+1 = 3`. Verschiedene Zeichenfolgen können denselben
Wert ergeben. Die Summe verliert Reihenfolge und bestimmt keinen eindeutigen
Namen, Sprecher oder realen Träger. Menschliche Bevölkerungsgruppen lassen sich
aus solchen Zahlensummen oder religiösen Figurenbeschreibungen nicht als andere
Spezies klassifizieren.

## 5. Wie aus Buchstabenwerten ein gezeichneter Weg entsteht

Karl Anton Nowotnys historische Untersuchung von 1949 rekonstruiert Beziehungen
zwischen Zahlentafeln, Namenswerten und Zeichen. Er unterscheidet geometrisch
konstruierte Siegel von aus Namen abgeleiteten Charakteren. Er dokumentiert
abweichende Linienführungen, Ersetzungen zwischen Einer-/Zehner-/Hunderterwerten
und Probleme einzelner Druckformen. Damit liegt ein konkreter untersuchbarer
Konstruktionsweg vor; die Überlieferung wird nicht zu einer ausnahmslos
einheitlichen Decodierregel geglättet.

[Nowotny: The Construction of Certain Seals and Characters in the Work of Agrippa of Nettesheim](https://www.marianotomatis.it/biblioteca/repository/NOW1949.pdf)

Unser **neuer Lehrversuch** bindet die Regel ausdrücklich: Ein Wert über 36 wird
durch zehn geteilt, solange er exakt durch zehn teilbar ist und über 36 bleibt.
Anschließend verbindet die Grafik die zugehörigen Zellen in Namensreihenfolge.

- Nachiel: `[50,20,10,1,30]` wird zur Zellfolge `[5,20,10,1,30]`.
- Sorath: `[60,6,200,400]` wird zur Zellfolge `[6,6,20,4]`.

Die originale Wertfolge bleibt im Export erhalten. Wiederholte Zellen bleiben
als wiederholte Dateneinträge sichtbar; die Grafik erfindet dafür keinen
historischen Haken. Diese Vorschrift ist eine eigene deterministische
Demonstration, **keine pixelgenaue Wiederherstellung sämtlicher historischer
Siegel**. Ein grafisches Zeichen ist auch keine kryptografische Signatur.

Die weiterführende fachhistorische Lektüre von Allison Kavey behandelt Agrippas
Zusammenhang zwischen natürlicher, astrologisch-mathematischer und religiöser
Welt. Das ist ein Kontext für seine Argumentation, kein Messnachweis der von ihm
behaupteten Wirkungen.

[Kavey: Reading Agrippa von Nettesheim’s De Occulta Philosophia Libri Tres](https://scholarworks.wmich.edu/cgi/viewcontent.cgi?article=1063&context=accessus)

## 6. Der Sudoku-Vergleich: Regeln statt bloßer Form prüfen

Nikolis Standard-Sudoku verwendet ein 9×9-Feld mit den Zeichen 1–9. Jede Zeile,
Spalte und jeder 3×3-Block enthält jedes Zeichen einmal. Das Sonnenquadrat
verwendet ein 6×6-Feld mit 1–36 je einmal insgesamt und festgelegten
Liniensummen. Die zwei Systeme teilen eine Gitterdarstellung, prüfen aber
verschiedene Invarianten. Eine Sudoku-Lösung setzt keine Summenregel voraus.

[Nikoli: Regeln und Geschichte des Sudoku](https://www.nikoli.co.jp/en/puzzles/sudoku/)

Für LUCINET folgt ein ausführbarer Baugedanke: **Datenstruktur und Prüfer
getrennt binden.** Derselbe visuelle Container kann unterschiedliche Regeln
tragen. Ein ähnliches Raster ist noch kein identisches Protokoll oder eine
nachgewiesene Verschlüsselung.

## Versuchs- und Quellenumfang

- 1792 Bitmuster: alle 256 + 512 + 1024 Zustände; exakte Raster-Roundtrips.
- Alle 512 Würfeladressen; vollständiger 3D-Koordinaten-Roundtrip.
- Alle Zahlenschreibweisen 1–36 in zwei ausdrücklich benannten Konventionen.
- Zwei quellengebundene Namen mit vollständigen Werten und deklarierter Pfadregel.
- Ungültige Eingaben werden abgelehnt; es gibt keine automatische Korrektur.
- Schrift, Namenssumme, Pfadmodell, historische Deutung und Außenwirkung führen
  verschiedene Aussagebereiche. Exporte sind lokale Modellrecords.
- Gelesen wurden die genannten relevanten Quellpassagen und Tabellen; keine
  Volllektüre aller Ausgaben, Manuskripte oder Forschungsliteratur.

```sh
node --test branches/1001-doors/powers-square.test.mjs
```

Offene Fortsetzung: Varianten direkt an datierten Scanstellen vergleichen;
Gegenmodelle für unterschiedliche Pfadregeln prüfen; anschließend den
GENESIS-512-Topologievergleich mit einer eigenen Nachbarschaftsregel ausführen.
