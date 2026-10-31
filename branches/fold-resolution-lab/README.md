# Faltgrenze: zwei Operatoren und eine Frage nach Prüftiefe

Ausgangspunkt ist Juris lokaler Forschungsdialog vom 31. Oktober 2026 über
Papierfaltung, ein idealisiertes Universumsblatt, Planck-Skala und die Frage,
wie tief man in einem großen Codebestand prüfen muss. Der private Dialog wird
hier nicht veröffentlicht. Dieses Modul enthält eine neue, begrenzte Rechnung
und ein öffentliches Browserlabor.

## Die konkrete Korrektur

Im Dialog wurden `Aₙ=A₀/2ⁿ`, `tₙ=t₀·2ⁿ` und `Lₙ=L₀/2ⁿ` nebeneinander
verwendet. Die ersten beiden Formeln beschreiben einen idealen Stapel nach
Flächenhalbierung. Die dritte ist **kein allgemeines Längenmaß desselben
Stapelvorgangs**: Werden zwei Seiten jeweils halbiert, wird die Fläche
geviertelt. Die Simulation faltet jeweils die aktuell längere Seite und
führt Breite, Höhe, Schichten und Dicke separat.

| Gebundener Operator | Fläche / Volumen | Längenmaß | Status |
| --- | --- | --- | --- |
| Faltstapel | Fläche ÷2, Stärke ×2; Idealvolumen konstant | Breite oder Höhe wird halbiert; äußere Ausdehnung kann wegen Stärke wieder wachsen | Rechenmodell, physisch nicht unbegrenzt ausführbar |
| Isotrope Kompression | Kugelvolumen ÷8, Dichte ×8 | angenommener Radius ÷2 | hypothetischer Gegenoperator, keine Papierfaltung |

Ausgangsdaten: A4-nahe Fläche `0,297 × 0,210 m`, Anfangsdicke `0,0001 m`,
Masse `0,005 kg`. Für den **separaten** Kompressionsfall wird ein anfänglicher
Kugelradius von `0,30 m` angenommen. Das sind gewählte Modellparameter,
keine Messung eines kollabierenden Papierblatts.

Mit `rₛ=2GM/c²` und diesen Parametern liegt die reelle Schwelle bei etwa
`log₂(0,30/rₛ) ≈ 95,03`; die erste ganze Modellstufe unter `rₛ` ist **96**.
Mit `ℓₚ=1,616255×10⁻³⁵ m` beträgt die erste ganze Modellstufe **114**.
Eine reale Entstehung eines schwarzen Lochs oder eine diskrete Raumstruktur
folgt aus diesen Rechnungen nicht. Der Schwarzschild-Vergleich verwendet eine
klassische Formel außerhalb ihres verifizierten Gültigkeitsbereichs für die
extreme angenommene 5-g-Kompression; er ist hier ein formaler Modellmarker.

## CODE-PLANCK als Arbeitsregel

Die Analogie ist eine **fragegebundene Prüfauflösung**, keine physikalische
Konstante und kein globaler Mindestwert. Für „Ist ein Release identisch?“
beginnt die Prüfung bei Commit, Build-Rezept, Artefakt und ausgelieferten
Bytes. Für „Wo entstand die Regression?“ benötigt man eine gebundene
Gegenprobe und danach einen begrenzten Diff. Ein Widerspruch öffnet die nächste
Ebene; fehlende Belege bleiben offen. Git-Commit, Tree, Blob und Ref haben
verschiedene Funktionen; ein Hash ist eine Adresse/Integritätsbindung, kein
Wirkungs- oder Wahrheitsbeweis.

## Quellen und Reproduktion

- [NIST/CODATA 2022: Konstanten und Planck-Länge](https://physics.nist.gov/cuu/pdf/JPCRD2022CODATA.pdf)
- [NASA: Schwarzschildradius](https://imagine.gsfc.nasa.gov/science/objects/black_holes2.html)
- [Git: Objekte, Trees und Commits](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
- [Git: Refs und Branches](https://git-scm.com/book/en/v2/Git-Internals-Git-References)

```sh
node --test branches/fold-resolution-lab/model.test.mjs
python -m http.server 8847 --bind 127.0.0.1
```

Danach `http://127.0.0.1:8847/branches/fold-resolution-lab/` öffnen.
Das Labor sendet keine Daten und benötigt keine Fremdpakete. Code: MIT;
Text: CC BY 4.0 gemäß `LICENSES.md`. Projektleitung: Juri / HALVETH;
Entwicklung mit KI-Unterstützung.
