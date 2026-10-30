# Licht- und Zeitmodell

Ein kleiner numerischer Kern für eine klassische Zwei-Port-Interferenz und
Lorentz-Koordinatentransformationen in 1+1 Dimensionen. Keine Abhängigkeiten,
kein Netzwerk, keine Messgeräteanbindung.

## Ausführen

```sh
node --test tests/core.test.mjs
```

```js
const {balancedPorts, lorentzEvent, vacuumTransit} = require('./core.cjs');
balancedPorts(0, {phase: Math.PI, delay: 0, visibility: 1});
// plus: 0, minus: 2, input: 2
lorentzEvent({x: 1.2, t: 0, beta: 0.6});
vacuumTransit(1e-10); // Sekunden, Eingabe in Metern
```

## Modellvertrag

`balancedPorts(time, {phase, delay, visibility})` verwendet normierte gaußförmige
Feldhüllkurven und einen idealen verlustfreien 50:50-Kombinierer. Die Eingangszeit
und der Pulsversatz sind relative Einheiten; die wirksame Phase wird in Radiant
angegeben. `visibility` liegt zwischen 0 und 1 und skaliert den Interferenzterm.
Es gilt punktweise `plus + minus = input`. Der Parameter ist keine vollständige
mikroskopische Simulation von Dekohärenz. Das Modell beschreibt keine
Photonenzählstatistik, Materialabsorption oder gebundenen Photonenzustände.

`lorentzEvent({x, t, beta})` verwendet Einheiten mit c=1 und `abs(beta) < 1`.
Es transformiert Koordinaten. Es erzeugt keine physische Zeitumkehr.

`vacuumTransit(lengthMeters)` berechnet L/c mit c=299792458 m/s.

Fehlende, zusätzliche und ungültige Parameter werden abgelehnt. Die Funktionen
führen keine stillen Eingabekorrekturen aus. Sehr kleine Gaußamplituden können
in der Gleitkommarechnung unterlaufen; bei der Differenz fast gleicher großer
Koordinaten ist mit Genauigkeitsverlust zu rechnen.

Die Gegenproben prüfen die Energieumverteilung einschließlich beider Ausgänge,
den Wegfall der Phasenabhängigkeit bei `visibility = 0`, Erhaltung des
Raumzeitintervalls, Zukunftsrichtung zeitartiger Ereignisse und Eingabefehler.
Sie prüfen die implementierten Modellverträge; eine Naturhypothese wird dadurch
nicht experimentell bestätigt.

## Herkunft und technische Referenzen

Neue Implementierung von Juri / HALVETH mit KI-Unterstützung. Die Formeln und
Annahmen sind oben vollständig deklariert. Code und Tests: MIT; diese Erläuterung folgt im
Forschungslabor der dortigen Dokumentationslizenz.

- [Raumzeit und kausale Struktur, Einstein Online](https://www.einstein-online.info/en/spacetime/)
- [CODATA-Konstanten, NIST](https://physics.nist.gov/cuu/Constants/Table/allascii.txt)
