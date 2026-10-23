# Zahlen in Rollen, Wege mit Herkunft, ein lokales Hive

Recherche vom **23. Oktober 2026**. Projektentwurf: **Juri Halveth / HALVETH**;
Quellenanalyse und Implementation mit KI-Unterstützung. Die zitierten Begriffe,
historischen Befunde und mathematischen Sätze behalten ihre Quellenautoren.

## Der untersuchbare Kern der neuen Idee

Eine Zahl kann in verschiedenen Zusammenhängen als Wert, Stellenbeitrag,
Anzahl, Indexgrenze, Codepunkt oder zugewiesene Kennung auftreten. Ein
Verarbeitungslauf kann diese Rollen, seine Quellen und seine Veränderungen
mitführen. Das schafft ein wachsendes Rollenprofil mit nachvollziehbarer
Herkunft.

Das Nutzerwort **„Seele“** bleibt in seiner darüber hinausgehenden Bedeutung
offen. In dieser technischen Untersuchung werden konkrete Rollen,
Darstellungen, Operationen und Belege definiert. Ein heutiges Zahlenprofil
enthält keine automatisch rekonstruierte historische Reise und keinen
automatisch vorgegebenen Zielpunkt.

Der bestehende Bereich ist `0..1000`, also **1001 Ganzzahlen**. Der inklusive
Bereich `0..1001` enthielte **1002 Ganzzahlen**. Die Erweiterungsfrage bleibt
erhalten; die bisherigen Registerbytes werden dafür nicht still verändert.

## 1. Stellenwert: Ein Zeichen erhält eine Positionsrolle

```text
507 = 5 × 10² + 0 × 10¹ + 7 × 10⁰
```

Die Ziffer 5 trägt hier 500 bei; die 0 hält die Zehnerstelle frei; die 7 trägt
sieben Einer bei. Beim Verschieben derselben Ziffer kann sich ihr Beitrag
ändern. Diese Stellenwertregel lässt sich für jede Zahl des Registers prüfen.

Historisch beschreibt die [Bodleian-Mitteilung zum Bakhshālī-Manuskript](https://www.glam.ox.ac.uk/article/carbon-dating-finds-bakhshali-manuscript-contains-oldest-recorded-origins-symbol-zero)
einen Punkt als Vorläufer des Nullzeichens und als Platzhalter. Die
[Originaluntersuchung von Plofker, Keller, Hayashi, Montelle und Wujastyk](https://hssa-journal.org/index.php/hssa/article/view/22)
widerspricht Teilen dieser Interpretation: Die Autoren argumentieren auch für
arithmetische Nullverwendungen und trennen das Alter des Birkenrindenmaterials
vom Schreib- und Inhaltsdatum. Beide Quellen werden mit ihren unterschiedlichen
Aussagen erhalten. Ein pauschaler Rekord „älteste geschriebene Null“ wird hier
aus der Materialdatierung nicht abgeleitet.

**Anschluss:** Eine Ziffernposition kann Platzhalterfunktion haben. Andere
Rollen, etwa Zahlenwert oder Kennung, erhalten jeweils eine eigene Definition.

## 2. Schreibweise und Wert: eine echte Darstellungsbrücke

[W3C XSD 1.1, Abschnitt 2](https://www.w3.org/TR/xmlschema11-2/#dt-lexical-space)
unterscheidet Wertebereich, gültige Schreibweisen und deren Abbildung.
Verschiedene Schreibweisen können denselben Wert bezeichnen. Die Abbildung
benötigt ihren Datentyp und gegebenenfalls Kontext.

```text
33 als Integer
  → "100001" mit Basis 2
  → "21" mit Basis 16
  → 33 als Integer
```

Jeder Übergang der neuen Demo bindet Ein- und Ausgabetyp, Operatorversion,
Parameter, genaue Endpunkte und Inhaltsdigests. Der Wert kann gleich bleiben,
während die Darstellung wechselt. Ein eigenes Zustandsvorkommen bleibt auch
dann erhalten, wenn der Inhaltsdigest am Ende wieder derselbe ist.

**Anschluss:** Decoder, Dateiformate und Schnittstellen lassen sich anhand
erhaltener Werte, veränderter Schreibweisen und benannter Verluste vergleichen.

## 3. Yoneda: ein Objekt über sein vollständiges Beziehungsprofil bestimmen

In einer lokal kleinen Kategorie ist die Yoneda-Einbettung voll und treu.
Natürlich isomorphe repräsentierbare Funktoren entsprechen isomorphen Objekten.
Die Voraussetzung betrifft das gesamte relevante Hom-Funktor-Verhalten mit
seiner Kompatibilität; eine beliebige Sammlung ähnlicher Merkmale reicht dafür
nicht aus. Primärquelle: [Tom Leinster, *Basic Category Theory*, Kapitel 4](https://arxiv.org/abs/1612.09375).
Gelesen wurden die Abschnitte zur Yoneda-Einbettung und zur Isomorphie
repräsentierbarer Funktoren einschließlich der dortigen Gegenbeispiele für
unvollständige Ansichten.

Ein elementares, vollständig endliches Beispiel für unser Register lautet:

```text
Objekte:    0, 1, ..., 1000
Beziehung: p ≤ n
Probe:     Gilt p ≤ n?
Profil(n): alle Antworten für p = 0, ..., 1000
```

Dieses Profil bestimmt `n` eindeutig im festgelegten Ordnungsmodell:
Wenn die Profile von `a` und `b` gleich sind, liefert die Probe `p=a` die
Aussage `a≤b`; die Probe `p=b` liefert `b≤a`. Antisymmetrie ergibt `a=b`.
Das ist eine eigene elementare Rechnung zum Beispiel, kein Ersatzbeweis für
das allgemeine Yoneda-Lemma.

Die neue Prüfung untersucht **1001×1001 = 1.002.001 Ordnungsproben** und findet
1001 verschiedene Profile. Die kompakte Beschreibung speichert die Regel und
Bereichsgrenzen; ein schweres Millionenfelder-Register ist dafür unnötig.

In der entsprechenden dünnen Kategorie gibt es genau eine Abbildung `p→n`,
wenn `p≤n`; Identitäten und Komposition folgen aus der reflexiven und
transitiven Ordnungsrelation. Damit existieren **501.501** solche Abbildungen
einschließlich der 1001 Identitäten. Dies ist ein mathematisches Modell,
keine Beobachtung von 501.501 realen Ereignissen.

**Anschluss:** Ein explizites Prüfprofil kann Gegenstände innerhalb seines
Modells unterscheiden. Die Relation und ihre Coverage sind Teil des Ergebnisses.

## 4. X nach Y nach Z: Die Reihenfolge verändert das Ergebnis

Mit `f(n)=n+1` und `g(n)=2n` gilt:

```text
g(f(n)) = 2n + 2
f(g(n)) = 2n + 1
```

Beide Wege starten bei derselben Zahl und verwenden dieselben Operationen;
ihre Ergebnisse unterscheiden sich stets um eins. Für `n=33` entstehen 68 und
67. Für alle 1001 Eingabewerte wird diese Rechnung geprüft.

Ein Weg braucht deshalb eine gebundene Reihenfolge. Ein Ziel wird vom gewählten
Rechenauftrag gesetzt. Eine Formel weist einer Zahl nicht automatisch einen
historischen Lebensweg zu.

**Anschluss:** Datenpipelines, Spielzustände und KI-Werkzeugfolgen können
Operatorreihenfolgen explizit vergleichen. Die Rechenwerte dürfen den
ursprünglichen Registerbereich überschreiten; sie werden dadurch keine neuen
historisch recherchierten Registereinträge.

## 5. Projektion: Mehrere Ursprünge können am selben Punkt erscheinen

```text
6 mod 12 = 6
18 mod 12 = 6
```

Das Teilprofil „Rest modulo 12“ unterscheidet beide Zahlen nicht. Das volle
Ordnungsprofil tut es bereits bei der Probe `p=7`:

```text
7 ≤ 6  ist falsch
7 ≤ 18 ist wahr
```

Der Moduloweg liefert alle und nur die passenden Ursprungswerte innerhalb von
`0..1000`. Die Kandidaten bleiben erhalten; die Demo wählt keinen Ursprung
heimlich aus. Der ursprüngliche Input bleibt separat im Lauf gespeichert.
Das ist eine Rückkehrmöglichkeit über die erhaltene Herkunft, keine eindeutige
Inverse aus dem Rest allein.

[W3C SKOS](https://www.w3.org/TR/skos-reference/#mapping) unterscheidet nahe,
exakte, hierarchische und assoziative Konzeptzuordnungen. `closeMatch` ist
ausdrücklich nicht als transitiv definiert, um Verkettungsfehler zu begrenzen;
`exactMatch` trägt im SKOS-Modell andere algebraische Eigenschaften.

**Anschluss:** Ähnliche Zahlen, Labels und Teilprofile erzeugen zunächst eine
Prüffrage. Gleichheit, Nähe und Ableitung bekommen eigene Relationstypen.

## 6. Zahlenwert und Einheit: Die Rolle hängt am Größenbezug

Die [SI-Broschüre des BIPM](https://www.bipm.org/en/publications/si-brochure)
beschreibt einen Größenwert als Produkt aus Zahlenwert und Einheit. Derselbe
Geschwindigkeitswert kann beispielsweise als `5 m/s` oder `18 km/h` erscheinen.
Die Zahl 5 in einer anderen Einheit wäre ein anderer Größenwert.

**Anschluss:** Ein Simulationswert benötigt Größe, Einheit und Bezugsrahmen.
Die neue Rollenreise führt reine Integeroperationen aus; physikalische
Größentransformationen bleiben ein eigener Adapter.

## 7. Herkunft: „Pollen“ als gesammelte Quellen- und Übergangsinformation

[W3C PROV-O](https://www.w3.org/TR/prov-o/#description-starting-point-terms)
trennt Entitäten, Aktivitäten und verantwortliche Agenten. Ableitungen können
über benannte Aktivitäten und Eingaben nachvollzogen werden. Alternative
Darstellungen, Spezialisierungen und echte Ableitungen haben eigene Beziehungen.

Die neue Demo erhält deshalb:

- den ursprünglichen Modellinput;
- Inhalte mit Digests und getrennte Zustandsvorkommen;
- gerichtete, getypte Übergänge mit vollständigen Endpoint-Adressen;
- Operatorversion, Parameter und Verlustangabe;
- eine deklarierte Modellreihenfolge;
- Aufzeichnungszeit und ausdrücklich unbekannte externe Ereigniszeit;
- Quellenverweise und offene Ursprungsmengen.

Das resultierende JSON ist das lokale „Pollenpaket“: ein nachvollziehbarer
Rechenlauf mit seiner Herkunft. Die Referenzen auf Standards behaupten keine
W3C-Zertifizierung dieser Implementation.

## 8. Hive: Koordination über ein gemeinsames Journal

Der [Originalabstract von Theraulaz und Bonabeau 1999](https://santafe.edu/research/results/papers/1112-a-brief-history-of-stigmergy)
beschreibt Stigmergie als Mechanismen der vermittelten Interaktion in
Insektengesellschaften. Der Anschluss an unser Journal ist ein eigener
Softwareentwurf. Das Journal reproduziert keine gesamte Bienenbiologie.

Das lokale Hive sammelt ausgewählte geprüfte Modellläufe:

- Derselbe unveränderte Lauf wird idempotent erkannt.
- Ein neuer Lauf desselben Rechenwegs bleibt als weiterer Zeuge erhalten.
- Gleichartige Rechenbefunde werden gruppiert.
- Wiederholte Läufe desselben Modells bleiben in **einem Modell-Provenienzcluster**.
- Andere Quellen werden durch wiederholte Modellrechnung nicht unabhängig
  bestätigt.
- Export ist möglich; die Sammlung bleibt in dieser Browser-Sitzung.

**Anschluss:** Ein gemeinsamer Wissensstand lässt sich erweitern, ohne
Wiederholungen, neue Fakten, Herkunft und bloße Zustimmung gleichzusetzen.

## Reproduzierbar ausführen

Im Labor bei einer Zahl **„Rollenreise öffnen“** wählen. Die vier Wege sind
Darstellungswechsel, beide Rechenreihenfolgen und Modulo mit allen Urbildern.
Danach lässt sich der Lauf als JSON exportieren oder ins Sitzungshive sammeln.

```sh
node --test branches/1001-doors/role-journey.test.mjs
npm test
```

Endlicher Forschungsstand: Typ- und Ordnungsmodell, vollständige lokale
Rechenproben im genannten Bereich und quellengebundene Fachanschlüsse.
Andere Bedeutungen des Nutzerwortes „Seele“, weitere historische Zahlenwege
und ein zwischen mehreren Browsern geteilter Hive bleiben eigene offene Äste.
