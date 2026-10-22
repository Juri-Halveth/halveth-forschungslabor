# HALVETH · Exact Percent Kernel

Ein **reiner JavaScript-Baustein** für endliche Dezimalzahlen und Prozentanteile.
Er nutzt `BigInt` und einen expliziten Dezimalmaßstab. Die Funktionen lesen
keine Wallet, verändern keine Datei und senden nichts ins Netz.

## Warum er aus der Ausgrabung kommt

Ein lokaler PowerShell-Prototyp aus `HALVETH_AI_FILM_STUDIO/kernel` enthielt
bereits die Idee einer exakten Dezimal- und Prozentrechnung. Der Code hier
wurde als kleiner, unabhängiger Baustein neu geschrieben. Das lokale Original
mit Identitäts- und Schreibfunktionen blieb unverändert und wurde nicht
mitveröffentlicht. [Source-Receipt](SOURCE_RECEIPT.json) bindet die
Quell- und Implementierungsdigests sowie die Übernahmeart.

## Start

Node.js 24 genügt:

```sh
node --test branches/exact-percent-kernel/exact-percent.test.mjs
```

```js
import {analyzeAllocation, formatDecimal, parseDecimal, parsePercent, portion}
  from './branches/exact-percent-kernel/exact-percent.mjs';

const split = analyzeAllocation(['23%', '23%', '23%', '23%', '4%']);
console.log(split.state, formatDecimal(split.residual)); // UNDER_100 4

const amount = portion(parseDecimal('50000000'), parsePercent('4%'));
console.log(formatDecimal(amount)); // 2000000.00
```

Viermal 23 % plus 4 % ergibt 96 %, nicht 100 %. Der Kern hält diese
Restmenge sichtbar. `24 % + 24 % + 24 % + 24 % + 4 %` ergibt exakt 100 %.

Für deutsche Dezimalzeichen ist die Trennung ausdrücklich zu wählen:
`parsePercent('4,25%', {decimalSeparator: ','})`. Tausendertrennzeichen,
Exponentialschreibweise und innere Leerzeichen werden abgelehnt. Eine
`portion` kann mehr Dezimalstellen haben als die kleinste Währungseinheit;
Rundung, Zuteilung von Rest-Cents, Wechselkurse und Buchungsregeln sind
bewusst **nicht** Teil dieses Kerns.

Die Syntax ist auf 256 Zeichen, 128 Eingangsnachkommastellen und 128
Allokationsanteile begrenzt. Die Tests decken Rechengenauigkeit, Unter- und
Überbelegung, ungültige Eingaben und explizite Dezimalzeichen ab. Sie
belegen keine Deckung, Liquidität, Rendite oder Smart-Contract-Wirkung.

## Rechte

Neu geschriebener Code und Tests in diesem Modul: [Apache-2.0](LICENSE-APACHE-2.0.txt).
Der Lizenztext gilt nicht für das unveröffentlichte lokale Ausgangsskript.
Projektleitung und Zusammenstellung: Juri Halveth / HALVETH; Entwicklung
mit KI-Unterstützung.
