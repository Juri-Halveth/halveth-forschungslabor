# Gegenprüfung des Modelllabors

Arbeitsstand **2026-10-26 · 0.2.0**. Dies ist eine Software-Korrektheitsprüfung des gebundenen
Quellstands; keine Gesamtauditbehauptung für den Host, fremde Systeme oder Biologie.

## Ausgangspunkt

Die 21 mitgelieferten Tests der Version 0.1.0 bestanden. Zusätzliche Gegenfälle
zeigten trotzdem Fehler: partielle Mutation bei vollem Journal, Nachrichtenverlust
zwischen Rezeptoren, numerische Überläufe, Zeitgewinn durch EPS, verspätete
Callbackwirkungen, nicht einheitliche Reads und fehlende Fortsetzungsdaten.

## Reparaturflächen

| Fläche | Reparatur | Entscheidende Gegenprobe |
| --- | --- | --- |
| Budget und Fehler | Atomare Modelländerung, vollständige Call-Rücknahme | Journal füllen, dann fehlgeschlagenen Mehrtickaufruf mit exakter Basis vergleichen |
| Ressourcenkonkurrenz | Gemeinsame Quell- und Routencaps, normierte Gewichte | Zwei konkurrierende Routen; Skalen `1e-300..1e307`, Bestände `1e200` und kleinste positive Bestände |
| Mehrere Rezeptoren | Selektive Inbox-Konsumption | ALPHA/BETA/OTHER gemeinsam zustellen; fremde Nachricht erhalten |
| Prozesszeit | Einheitliche Tickanfangsreads und verfallende Kontexte | Reihenfolge ändern; Async/Promise/retained context abweisen |
| Uhr | Eindeutiger Mikrosekunden-Roundtrip | Nicht kanonische Bruchteile abweisen, 8.001 ms akzeptieren, kein EPS-Zeitgeschenk |
| JSON | Geschlossene Daten, Duplicate-Key- und Unicodeprüfung | Map/Set/Date, Getter, Sparse Array, doppelte dekodierte Schlüssel und unvollständige Surrogate |
| Wiederaufnahme | V2-Snapshot, erlaubte lokale Rezepte, Head-/Manifestbindung | Alle drei Szenarien exportieren, neu aufbauen und gleich weiterrechnen |
| Worker | Eigener Ausführungsloop | Nach START ohne weitere UI-Anfrage Fortschritt empfangen; PAUSE hält den Tick |
| Persistenz | Exklusive Tempdatei, Sync, begrenztes Nachlesen, No-replace-Commit | Bestehendes Ziel erhalten, partielle Schreib-/Syncfehler, vier konkurrierende Worker |

## Laufende Abnahme

Der Repositorylauf unter **Node 24.22.1** enthält **307 JavaScript-Tests:
306 bestanden, 0 fehlgeschlagen, 1 umgebungsbedingt übersprungen**. Zusätzlich
bestanden **49 Python-Tests**. Der übersprungene Fall betrifft das Erzeugen
eines Dateisymlinks unter Windows (`EPERM`); die echte Junction-Gegenprobe wurde
ausgeführt und bestanden. Das zählt nicht als bestandener Dateisymlinktest.

**23/23 Browserprüfungen** bestanden im installierten Chrome mit Playwright 1.62.1.
Darunter sind Desktop, die neuen 320-/390-Pixel-Ansichten, unveränderte Scrollposition
nach einer Antwort, echte Downloads, beschädigte UTF-8-/JSON-Eingaben, Restore,
Bildfreeze bei weiterlaufendem Worker und 1000 synthetische Profile. Das sind
Browser-Viewportprüfungen; eine Abnahme auf einem physischen Mobilgerät ist nicht enthalten.

Eine separate Invariantenprüfung verwendet **300 deterministisch erzeugte
Anforderungsszenarien**. Sie prüft Quell-, Routen- und Bedarfsgrenzen,
Ressourcenbilanz und die Nutzung noch verfügbarer Kapazität. Diese 300 Fixtures
sind Bestandteil eines Tests und werden nicht als 300 zusätzliche Tests gezählt.

Der Browser-/Node-Gegenvergleich bindet auf beiden Seiten dieselben unveränderten
ESM-Dateien. Alle drei Rezepte lieferten bei 20 Ticks denselben vollständigen
Snapshot; die Fortsetzung auf Tick 21 stimmte ebenfalls überein. Ein früherer
Versuch über Playwrights transformierte Direktimporte änderte Callback-Quelldigests
und wurde als Testaufbauartefakt erkannt. Die Lösung ist der Vergleich mit einem
normalen Node-Prozess, kein Aufweichen der Quelltextbindung.

## Vollständig gelesener Originalcontainer

Alle **22 Dateimitglieder / 14.170.461 unkomprimierten Bytes** des bereitgestellten
Archivs wurden gelesen. **22/22 CRC32** und **22/22 SHA-256** stimmen mit dem
gebundenen Archivreceipt überein; die 20 erhaltenen Quelldateien blieben bytegleich.
Die zwei großen generierten JSON-Dateien wurden ausschließlich im Speicher als
Daten geprüft und nicht in den Kandidaten kopiert.

| Ursprüngliches V1-Datenmitglied | Events | Tick / Modellzeit | Statische Prüfung |
| --- | --- | --- | --- |
| `assets/model-snapshot.json` | 20.515 | 600 / 30.000 ms | ursprüngliche Hashkette, Sequenz, Inventarreplay und Bilanz konsistent |
| `assets/live-checkpoint-short.json` | 616 | 15 / 750 ms, Rest 5,238292999999956 ms | ursprüngliche Hashkette, Sequenz, Inventarreplay und Bilanz konsistent |

Die Dateien waren im Original-ZIP vorhanden und wurden anfangs lediglich nicht
mit den 20 Quelldateien materialisiert. Die Erzeugungsläufe dieser archivierten
Daten wurden nicht beobachtet. V1 besitzt keinen vollständigen Konfigurations-
oder Callbackvertrag; die statische Konsistenz ist kein Wiederaufnahmenachweis.

## Laufzeit- und Persistenzbeobachtung

Ein tatsächlich gestarteter erster Prozess lief **15 Minuten**, von Tick 0 auf
900. Sein Endcheckpoint wurde gespeichert, nachgelesen und erfolgreich wieder
aufgebaut. Er bindet den damaligen, etwas früheren Kandidatenstand über fünf
deklarierte Dateidigests.

Ein zweiter Prozess hat denselben gespeicherten Modellstand auf Tick 900
übernommen und führt einen geplanten 45-Minuten-Lauf aus. Ein Endergebnis wird
erst nach dessen Abschluss eingetragen. Die fünf Startdigests dieses Laufs sind
keine vollständige Dependency-Provenienz. Die spätere Runnerfassung bindet zwölf
eigene Dateien und benennt auch dafür die Grenze eines nach dem Import gelesenen
Quellinventars gegenüber einer atomaren Loader-Attestierung.

Dateisync, Nachlesen und Wiederaufnahme werden getrennt quittiert. Der beobachtete
Windows-Verzeichnissync wird als nicht abgeschlossen gemeldet. Daraus wird weder
Stromausfallfestigkeit noch ein falsches Rollback abgeleitet. Zwischen zwei
Prozessen liegt ein eigenes Beobachtungsfenster; externe Uhrdrift und nicht
beobachtete Zwischenzustände bleiben offen.

Die Veröffentlichungsprüfung stoppt bei der offenen Lizenzzuordnung. Ein explizites
`LOCAL_DRAFT_ONLY`-Artefakt dient der lokalen Abnahme und ist kein öffentlicher Release.
Historische Originalreceipts, fehlgeschlagene Gegenproben und spätere erfolgreiche
Rechecks bleiben getrennt erhalten.
