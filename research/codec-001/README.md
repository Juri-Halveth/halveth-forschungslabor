# CODEC-001 · Darstellung, Gedächtnis und vermittelte Wirkung

**Forschungsrichtung und Projektleitung: Juri Halveth / HALVETH. Ausarbeitung mit KI-Unterstützung.**

Fassung 1.0.0 · 24. Oktober 2026 · **Quellengebundener Forschungsentwurf**

Wie verändert sich eine Information auf ihrem Weg durch Encoder, gespeicherte Referenzen, Parser und Empfänger? Und welche andere Art von Veränderung entsteht, wenn ein physisches Medium Kräfte zwischen Objekten vermittelt?

Dieses Dossier erhält beide Fragen als getrennte Forschungsäste. Es verbindet sie über explizite Ein- und Ausgaben, Zustand, Zeit und Beobachtung. Der Ausdruck „Codec als Wesen“ ist die gestalterische Perspektive des Projekts: Ein konkreter technischer Codec besitzt die jeweils implementierten Funktionen; zusätzliche Fähigkeiten werden nicht aus dem Namen abgeleitet.

## Drei konkrete Situationen

### Eine Ansicht verwendet bereits verfügbare Referenzen

Bei prädiktiver Videocodierung können Referenzbilder zur Rekonstruktion beitragen. Decodierreihenfolge und Darstellungsreihenfolge können voneinander abweichen. Ein Bild mit späterem Darstellungszeitpunkt kann deshalb beim Decodieren eines früher dargestellten Bildes bereits vorliegen. B-Slices erfordern nicht in jedem Fall eine solche zeitlich spätere Referenz.

[ITU-T H.264, insbesondere Bildreihenfolge, Referenzlisten und Decoded Picture Buffer](https://www.itu.int/dms_pubrec/itu-t/rec/h/T-REC-H.264-202408-I%21%21TOC-HTM-E.htm) ist Vorarbeit. CODEC-001 implementiert keinen H.264-Decoder.

### Dieselben Zeichen erhalten verschiedene Strukturen

Für das synthetische Beispiel `color=blue&color=red` kann eine ausdrücklich definierte First-Value-Regel `blue` auswählen und eine Last-Value-Regel `red`. Das Beispiel ist ein erklärter Regelvergleich, kein beobachteter Fehler eines Produkts.

Die Forschungsfrage lautet: Ist die tatsächlich verwendete Bedeutung durch die vorherige Prüfung gedeckt? Beide Komponenten müssen nicht identische interne Objekte erzeugen. Erforderlich ist die gebundene, sicherheitsrelevante Übereinstimmung über Referent, erlaubte Transformation, Zustand und Gültigkeit.

[RFC 3986, Abschnitt 2.4 und 7.3](https://www.rfc-editor.org/rfc/rfc3986.html) beschreibt verwandte Grenzen beim Zerlegen und Decodieren von URIs. Ein Bedeutungsunterschied allein beweist keine ausnutzbare Sicherheitslücke und keinen Bounty-Anspruch.

### Ein Medium überträgt eine mechanische Wirkung

In einer Laborarbeit von Roberts und Kollegen wurden Biofilme auf Hydroxylapatit-Scheiben untersucht. Die aktiven Bürstenelemente waren in Zahnpasta-Flüssigkeit eingetaucht und drei Millimeter von der Oberfläche entfernt. Im beschriebenen Versuch trat Biofilmentfernung ohne Borstenkontakt auf; die kombinierte Schall-/Ultraschallbetriebsart entfernte am meisten.

[Roberts et al., 2010](https://pubmed.ncbi.nlm.nih.gov/20608294/) belegt diesen begrenzten In-vitro-Befund. Flüssigkeitsbewegung und chemische Materialeigenschaften sind andere Mechanismen als symbolisches Decodieren. Das Dossier enthält weder eine biologische Simulation noch eine Produkt- oder Behandlungsempfehlung.

## Was der Entwurf zusammenführt

| Forschungsachse | Gebundene Objekte | Unterscheidende Frage |
| --- | --- | --- |
| Darstellung | Rohdaten, Transformation und empfangenes Objekt | Welche Information bleibt erhalten, welche geht verloren? |
| Referenzgedächtnis | Bereits vorhandene Daten und Abhängigkeiten | Welche Referenz benötigt der Empfänger tatsächlich? |
| Zeit | Ereignis-, Empfangs-, Verarbeitungs- und Darstellungszeit | Welche Reihenfolgen unterscheiden sich, unter welchem Zeitvertrag? |
| Prüfung und Verwendung | Geprüfter Referent und verwendeter Referent | Deckt die Prüfung die spätere Bedeutung und Wirkung? |
| Physische Vermittlung | Quelle, Medium, Ziel und gemessene Wirkung | Welche messbare Kopplung trägt die Wirkung? |

„Matrix“ bezeichnet hier je nach gebundener Domäne eine mathematische Anordnung, eine biologische Struktur oder ein Erzählmotiv. Eine gemeinsame Bezeichnung ist kein Mechanismuswechsel. Eine Verknüpfung dieser Äste bleibt eine zu prüfende Modellentscheidung.

## Nachvollziehbar weiterarbeiten

Der [Forschungsplan](RESEARCH_PLAN.md) trennt Hypothesen, Gegenmodelle und nächste lokale Versuche. Er enthält noch keine Versuchsergebnisse. [SOURCES.json](SOURCES.json) nennt Vorarbeiten, Quellenart und Claim-Grenzen.

Der [Zeitanker](ANCHOR.json) bindet diese Fassung über Dateipfade, Bytezahlen und SHA-256. Lokal vom Repository-Stamm prüfen:

```sh
node research/codec-001/verify.mjs
node --test scripts/codec-anchor.test.mjs
```

Ein positiver Prüflauf belegt die Übereinstimmung mit dem vorliegenden Manifest. Für eine historische Prüfung muss zusätzlich die gewünschte Git-Revision gebunden werden. Der Hash beweist weder eine externe Wirkung noch einen unabhängigen Entstehungszeitpunkt oder Rechtsinhaberschaft.

## Beitrag, Nutzung und Zitation

Juri Halveth initiiert die Forschungsrichtung und stellt die Fragen sowie die Verbindungen zwischen Zeit, Darstellung und vermittelter Wirkung. Auswahl, Quellenabgleich und Formulierung dieser Fassung erfolgten mit KI-Unterstützung. Diese Zuschreibung ist transparent dokumentiert; sie ist keine unabhängige Feststellung des Umfangs urheberrechtlich geschützter menschlicher Beiträge.

Zitiervorschlag: **Juri Halveth / HALVETH (2026): CODEC-001 — Darstellung, Gedächtnis und vermittelte Wirkung. Version 1.0.0. HALVETH Forschungslabor.** Ergänze den tatsächlich verwendeten vollständigen Git-Commit und diesen Dokumentpfad.

Neue Erläuterungen: **CC BY 4.0**, mit Namensnennung gemäß Lizenz. Prüfer und Tests: **MIT**. JSON-Metadaten: **CC0 1.0**. Die [Rechtezuordnung](RIGHTS.md) erhält bestehende Freigaben und grenzt Vorarbeiten ab.

[Zur Sammlung](../../README.md) · [Bestehendes Signallabor](../../branches/encounter-systems/SIGNAL_RESEARCH.md) · [Lizenzkarte](../../LICENSES.md)
