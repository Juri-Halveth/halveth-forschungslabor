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

## Ein Blatt als Materialfläche

Die öffentliche Bühne nutzt jetzt `sheet-motion.js` und `sheet-render.js`.
Jeder Punkt besitzt dieselbe `sheetId` und seine ursprünglichen
Materialkoordinaten `(u,v)`. Ein gemeinsames Dreiecksnetz bildet die ganze
Fläche; es wird bei jedem Schritt durch eine gekrümmte Biegezone transformiert.
Die Oberflächenansichten **Raum, Oben, Vorn, Seite** projizieren dieselben
Materialpunkte. M17 ist ein absichtlich sichtbarer, dauerhaft adressierter
Punkt. Das kleine Kantenprofil verwendet einen **eigenen Maßstab**, weil die
reale 0,1-mm-Dicke in der Gesamtansicht kaum sichtbar wäre.

Für die erste Falte ist die Mittelfläche im Biegeband ein Kreisbogen:
`R = 2a/θ`, wobei `2a` die gebundene Materiallänge und `θ` der aktuelle
Faltwinkel ist. Daran schließen zwei ebene Teile positions- und
tangentenstetig an. Der erste Schritt bewahrt damit lokal die Länge der
Mittelfläche. Spätere Schritte transformieren dasselbe Netz mit gespeicherter
Faltfolge; die dyadischen UV-Stützstellen halten die früheren Biegezonen
sichtbar. **Das ist weiterhin eine kinematische Näherung**: Die reale
Schichtordnung, Selbstkontakte, Faserorientierung, Elastizität, Kraft und
bleibende Schäden sind nicht gelöst. Ab der vierten Faltung bleibt zudem die
sichtbare Überdeckung eine Näherung: Die Darstellung hat keinen Tiefenpuffer.
Verdeckte Gitterlinien werden nicht darübergezeichnet, doch die einzelnen
Flächen werden weiterhin nur nach mittlerer Tiefe sortiert. Die Flächenzahl in der Bühne ist die
erhaltene *Materialfläche*, keine gemessene 3D-Oberfläche nach plastischer
Verformung. Painter-Sortierung dient nur der Anzeige und gilt nicht als
Kontaktbeweis.

Das Modell wählt für jedes Umlegen einen konservativen Radius aus der bisherigen
Pakethöhe und prüft, ob sein Halbkreis in die aktuelle Seitenlänge passt.
Bei den gebundenen Standardmaßen ist die **siebte** Kante nicht mehr im
kinematischen Fenster (`sheetLimit() = 6`). Diese Grenze folgt aus dem
gewählten Radius, nicht aus einem universellen Faltgesetz. Das ältere
starre Vergleichsmodell in `fold-motion.js`/`fold-render.js` bleibt als
separate historische Gegenprobe erhalten; es ist nicht mehr die öffentliche
Papierbühne. Sein optimistischer Freiraumindikator lag bei sieben.

Der Regler kann weiter bis 240 laufen. Nach der Blattmodellgrenze zeigt die
Bühne ausdrücklich **keinen** 3D-Körper mehr. So bleiben die Folgen der
**formalen** Extrapolation sichtbar, ohne eine unmögliche Animation zu
behaupten. Nach 111 Halbierungen lautet
`t₁₁₁ = 0,0001 m × 2¹¹¹ ≈ 2,596 × 10²⁹ m`. Das beschreibt kein
herstellbares Papierobjekt. Eine fallende hypothetische Kugelradius-Kurve
gehört weiterhin zum getrennten Kompressionsoperator.

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
- [MIT: Fold Mechanics of Natural and Synthetic Origami Papers](https://dspace.mit.edu/entities/publication/fdc17f87-af15-4b9e-84ee-1e5cb0b95f59)
- [Pradier et al.: gemessene Steifigkeit von Papierfalten](https://doi.org/10.1115/1.4032629)
- [Kwok: Geometrie dicker Origami-Falten](https://users.encs.concordia.ca/~thkwok/publication/JMD20_Origami.pdf)
- [Akitaya, Demaine, Ku: Schichtordnung flach gefalteter Zustände](https://erikdemaine.org/papers/FlatFolder_OSME2024/paper.pdf)
- [Guinness World Records: zwölf Faltungen mit 1.219 m langem Spezialpapier](https://www.guinnessworldrecords.com/world-records/494571-most-times-to-fold-a-piece-of-paper)
- [NASA: Schwarzschildradius](https://imagine.gsfc.nasa.gov/science/objects/black_holes2.html)
- [Git: Objekte, Trees und Commits](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
- [Git: Refs und Branches](https://git-scm.com/book/en/v2/Git-Internals-Git-References)

```sh
node --test branches/fold-resolution-lab/model.test.mjs
node --test branches/fold-resolution-lab/fold-motion.test.mjs
node --test branches/fold-resolution-lab/sheet-motion.test.mjs
python -m http.server 8847 --bind 127.0.0.1
```

Danach `http://127.0.0.1:8847/branches/fold-resolution-lab/` öffnen.
Das Labor sendet keine Daten und benötigt keine Fremdpakete. Code: MIT;
Text: CC BY 4.0 gemäß `LICENSES.md`. Projektleitung: Juri / HALVETH;
Entwicklung mit KI-Unterstützung.
