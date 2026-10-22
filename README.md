# HALVETH Forschungslabor

**Kleine Werkzeuge. Konkrete Modelle. Nachvollziehbare Prüfungen.**

Dieses Repository enthält eine ausgewählte technische Sammlung von Juri Halveth: lokale JavaScript- und Python-Bausteine, ihre Eingaben, Grenzen und Gegenproben.

## Direkt anfangen

Voraussetzungen: **Node.js 24 und Python 3.11 oder neuer**. Keine zusätzlichen Pakete.

```sh
npm test
python branches/normenwerk-rule-universe/universe.py --demo
```

Das Optiklabor kann über einen lokalen HTTP-Server geöffnet werden:

```sh
python -m http.server 8847 --bind 127.0.0.1
```

Danach: `http://127.0.0.1:8847/branches/eye-optics-and-prediction/`.

## Was enthalten ist

### [GENESIS / Zustandslabor – ein Impuls, zwei Perspektiven](branches/genesis-state-lab/)

Interaktiver 100-Agenten-Graph mit typisierten Relationen, deterministischem Replay und einer Gegenprobe: Zwei grob gleiche Zustände können nach demselben Impuls auseinanderlaufen. Die ANTI-DATEI ist eine zweite Ansicht desselben Ereignisses.

### [Belegwege – öffentliche Quellen und offene Prüfkanten](BELEGWEGE.md)

Eine kleine, versionsgebundene Karte zu bereits veröffentlichten Belegen und
zu GENESIS im integrierten Kandidatenstand. [Maschinenlesbare Fassung](catalog/evidence-routes.json).

### [Drei-Gabel – ein dritter Weg im Konflikt](branches/three-actor-fork/)

Interaktives Drei-Akteure-Modell: C tritt zwischen A und B ein; zwei Reaktionen erzeugen prüfbare Kandidaten statt eines vorweggenommenen Sieges.

**Für Programme und KI:** [Lerntunnel mit drei Codebeispielen](branches/three-actor-fork/LERN-TUNNEL.md) — aus einem Zweierstreit eine prüfbare dritte Option entwickeln.



### [Nächster-Schritt-Navigator – Security, Bau, Forschung und Einreichung](branches/next-action-navigator/)

Interaktive Wegkarte mit vollständigen Pflichtachsen, Gegenmodell, kleinster Prüfung und endlichem Arbeitsstand. [Diagramm ansehen](branches/next-action-navigator/diagram.mmd).

### [Projekt Ausgrabungsstätte – alte Quellen und neue Brücken](branches/documents-excavation/)

Begehbare Karte einer begrenzten lokalen Suche, zwei bytegleichen Textfamilien und eines neuen synthetischen Modells für fortwirkende Effekte über Zeit und Kontext. Private Originale bleiben lokal.

### [Focus Kernel – bestätigte Ziele und Vorschläge getrennt halten](branches/focus-kernel/)

Lokaler Zustandskern für bestätigte Ziele, Vorschläge und begrenzte Prüfergebnisse.

### [Referenzprüfer – Format, Zustand und Berechtigung prüfen](branches/document-issue-reference-verifier/)

Synthetischer Referenzprüfer mit Digest-, Schema-, Principal- und Lebenszyklusprüfung.

### [Metadatenprüfung – Freigabekandidaten nachvollziehbar einordnen](branches/bounded-knowledge-reuse-inventory/)

Offline-Prüfung deklarierter Metadaten. Ein positives Ergebnis ist ein Kandidat, keine Publikationsfreigabe.

### [Bildvergleich – Änderungen in gelieferten RGBA-Daten erkennen](branches/pixel-region-change-observer/)

Offline-Vergleich synthetischer Framearrays mit Region, Schwelle und ausgewiesener Beobachtungslücke.

### [Dialogprotokoll – Zustimmung und offene Antworten modellieren](branches/binary-inquiry-loop/)

Deterministisches Protokollmodell für eine gebundene Frage und zwei deklarierte Seiten.

### [Optiklabor – Lichtbrechung und Bewegungsvorhersage](branches/eye-optics-and-prediction/)

Geometrisches Lehrmodell mit Strahlen, Fokus und einem Gegenbeispiel bei plötzlicher Bewegungsumkehr.

### [Zustandsmodell – Stoffanteile und Übergänge berechnen](branches/banana-transition-field/)

Illustratives numerisches Modell mit erhaltener Stoffsumme. Keine validierte biologische Vorhersage.

### [Ereigniskern – Herkunft, Kandidaten und Zustandsänderungen](branches/fegefeuer-provenance-transducer/)

In-Memory-Prototyp mit Ereignisidentität, Kandidatenaufnahme, HOLD und protokollierten Zustandsänderungen.

### [Regelmodell – Konflikte, Vorrang und offene Zustände](branches/normenwerk-rule-universe/)

Python-Regelmodell mit dreiwertiger Logik, explizitem Vorrang und Replay der mitgelieferten Modelle.

### [Berichtsprüfung – Beobachtung und Sicherheitswirkung einordnen](branches/security-impact-learning/)

Lokale synthetische Prüfmodelle für Befundbehauptungen. Keine aktiven Angriffe oder fremden Zielsysteme.

## Technischer Umfang

Die Tests prüfen die implementierten Verträge und synthetischen Gegenbeispiele. Sie sind kein Nachweis einer realen Sicherheitslücke, klinischen Wirkung, externen Infrastruktur oder verliehenen Qualifikation. Ein Datenmodell bewertet die eingegebenen Daten; deren Außenwahrheit ist eine andere Frage.

Gemeinsame Hilfsfunktionen unter `scripts/` prüfen Plain-JSON, Quellenpakete und exakt gebundene Quellspans. Die Sammlung arbeitet lokal; eine Integration in andere Produkte braucht eigene Adapter und Tests.

## Herkunft

Projektleitung: **Juri Halveth / HALVETH**. Entwicklung mit KI-Unterstützung. `SOURCE_PROVENANCE.json` bindet die übernommenen Codebytes und ihre historische Commitfassung. Die bisherigen Lizenzbedingungen gelten weiter; siehe `LICENSES.md`. Frühere nichttechnische Arbeiten werden getrennt privat erhalten.

[Portfolio](https://juri-halveth.github.io/) · [Kontakt](mailto:security@halveth.de)
