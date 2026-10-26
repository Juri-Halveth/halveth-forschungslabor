# LAGEFADEN · echte Daten ohne eigene Sensoren

Stand 26. Oktober 2026. Dies ist eine endliche, quellengebundene Auswahl öffentlicher Datenwege für einen lesenden Prototypen. Kein Anbieter ist ein Ersatz für einen konkret benannten CIHBw-Use-Case oder für ein autorisiertes Testsystem.

| Quelle | Was der offizielle Zugang liefert | Erster LAGEFADEN-Test | Stand und Grenze |
| --- | --- | --- | --- |
| [USGS-Erdbebenfeed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | Häufig aktualisierte GeoJSON-Übersicht und Event-Detail | **Implementiert:** Zwei Antworten zu derselben Event-ID, getrennte Abruf-/Ereignis-/Änderungszeit und Rohantwort-Hashes | Ein USGS-Katalogfall, kein Nachweis zweier unabhängiger Sensoren oder einer militärischen Lage. [USGS-Datenlizenz](https://www.usgs.gov/data-management/data-licensing) wird beachtet. |
| [NASA EONET v3](https://eonet.gsfc.nasa.gov/docs/v3) | Kuratierte Naturereignisse mit Geometriezeiten und Verweisen auf Quellen | Nächster reiner Leseadapter: Event-ID, Quellverweise und eventuelle Datums-Defaults getrennt halten | **Noch nicht implementiert.** Ein Quellenlink ist weder ein authentisierter Ursprung noch eine unabhängige Messung. |
| [Copernicus Emergency Management Service](https://emergency.copernicus.eu/data/) | Frei abrufbare Produkte zu Bränden, Fluten, Dürren und Aktivierungskarten | Georeferenzierte Produkte mit Veröffentlichungs-/Beobachtungszeit und Version an eine sichtbare Datenlinie binden | **Noch nicht implementiert.** Zugang und Nutzungsbedingungen sind pro Produkt zu prüfen; eine Aktivierung des Dienstes hat eigene Befugnisse. |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/content/active_fire/) | Aktuelle satellitengestützte Branddetektionen; unterschiedliche Produktstände und Verzögerungen | Zwei zeitlich unterschiedliche Produkte desselben Gebiets vergleichen, ohne ältere Messungen zu „frischen“ | **Noch nicht implementiert.** API und Downloads können Map Key/Earthdata-Login erfordern; FIRMS warnt vor Unterschieden zwischen NRT- und späteren Science-Daten. |

## Warum dies ein Produktkandidat sein kann

Juri muss keine Drohne, keinen Radar und keinen Satelliten besitzen. Die erste anzubietende Funktion wäre die **Datenweg-Prüfung vor einer menschlichen Entscheidung**: Woher kam eine Meldung, wann wurde das Ereignis beobachtet, wann erfasst und weitergegeben, und welche scheinbar zweite Meldung ist nur eine andere Darstellung derselben Quelle? Eine Behörde oder ein Krisenteam könnte diese Funktion gegen seinen bisherigen Ablauf testen. Ob der CIHBw einen passenden Bedarf im Feld Software Defined Defence sieht, muss dessen zuständige Seite bestimmen; für cUxS und EW gibt es aus den öffentlichen Daten derzeit keine belegte Passung.

Ein Partner-Test beginnt mit einer freigegebenen Datenklasse und einer einfachen Vergleichsliste. Vorher werden Anzahl korrekter Kopienerkennungen, falsch unabhängige Hinweise, übersehene Zeitabweichungen, Bearbeitungszeit und unnötige Alarme festgelegt. Dieselben Fälle werden einmal mit Liste und einmal mit LAGEFADEN bearbeitet. Ein besserer Effekt ist zu messen, nicht aus der Existenz des Codes abzuleiten. Der USGS-Snapshot ist eine **reale Datenweg-Gegenprobe**, kein solcher Nutzertest.

## Nächste Umsetzungskante

1. EONET als zweite *Plattform* hinzufügen, ohne Plattformzahl und physische Quellenzahl zu vermischen. Für einen gemeinsamen Ereignisvergleich brauchen beide Systeme eine belegte Ereigniszuordnung; räumliche und zeitliche Nähe reichen allein nicht.
2. Einen kurzen, quellengebundenen Benchmark mit öffentlich reproduzierbaren Revisionen und bewusst fehlerhaften Weiterleitungen erstellen. Rohantworten oder unveränderliche Test-Fixtures müssen für einen exakten Replay gesondert bewahrt werden; der heutige Snapshot speichert nur Felder und Hashes.
3. Mit einer zuständigen Stelle einen relevanten Arbeitsablauf und einen lesenden Testadapter vereinbaren. Erst dort werden Datenrechte, Quellenidentität, Leistungsmetrik, Ausfallverhalten und Abnahme verbindlich gebunden.
