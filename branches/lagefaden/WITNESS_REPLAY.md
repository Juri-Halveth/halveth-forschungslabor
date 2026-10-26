# LAGEFADEN × C-DROHNE · Drei virtuelle Beobachter

Eine Weitergabe, eine Reaktion und eine eigene Sichtung enthalten verschiedene Informationen. Das [durchklickbare Replay](index.html#witness) stellt diese Unterschiede im zivilen Beispiel eines Hilfswegs nach einem erfundenen Unwetter dar. Es verarbeitet feste synthetische Nachrichten. Alle dargestellten Zeiten sind Modellzeit in UTC.

## Die belegte Verbindung zur Vorarbeit

Am 27. Oktober 2026 wurde der öffentliche C-DROHNE-Stand [`89398fccf993ad361a5230a6adefb8b559f547d8`](https://github.com/Juri-Halveth/c-drohne-red-room/tree/89398fccf993ad361a5230a6adefb8b559f547d8) gelesen. Sein [Fallpaket](https://github.com/Juri-Halveth/c-drohne-red-room/blob/89398fccf993ad361a5230a6adefb8b559f547d8/dist/case-fixtures.json) enthält bereits A mit einem möglicherweise blockierten Hilfsweg, B als Weitergabe von A und C mit einer älteren Freimeldung. Die [Quellenkarte](https://github.com/Juri-Halveth/c-drohne-red-room/blob/89398fccf993ad361a5230a6adefb8b559f547d8/SOURCE_MAP.md) dokumentiert GUARDIAN als konzeptionelle Vorarbeit und trennt die Website vom privaten Forschungszweig.

| Gelesene öffentliche Datei | SHA-256 |
| --- | --- |
| `dist/case-fixtures.json` | `a6fe303d07c565e8b97a54125df69ca6105f18f5b32bed24fb0d845d7b55d667` |
| `SOURCE_MAP.md` | `b92e12cafcaf984db2b7e36ff76bf7f40a8a00ae31e4f170d18bcca5f4f40d40` |

Zusätzlich wurde die frühere GUARDIAN-Beschreibung lokal gelesen: Sie unterscheidet eigene Beobachtungen, empfangene Meldungen und beobachtete Handlungen anderer Einheiten. Dieses Replay setzt die konzeptionelle Trennung mit neuem Code um. Historische Filme, Folien, Pilotresultate und deren Lizenzen bleiben an ihrer Quelle. Eine lückenlose Entstehungsgeschichte und sämtliche im Gespräch genannten historischen Testnamen wurden damit nicht rekonstruiert.

**Tatsächliche Integration:** `witness-replay.mjs` übersetzt gebundene Wegsichtungen und Weitergaben in das bestehende `evaluatePacket` aus `model.mjs`. Die ursprünglichen fünf Modellfälle und die drei öffentlichen Katalogsnapshots bleiben erhalten. Reaktionen und Sichtstatus werden als eigene Ereignistypen ausgewertet und nie als neue Wegsichtung an den Kern übergeben. Die Probe übernimmt keinen Flug-, Sensor- oder GUARDIAN-Laufzeitcode.

## Nachrichtenvertrag

Version: `halveth.lagefaden.witness-replay.v1`. Ein Paket enthält genau eine synthetische `routeId`, Anfang, Endzeitpunkt, Frischefenster, Verfügbarkeit einer menschlichen Prüfung, deklarierte Knoten und höchstens 64 Ereignisse. Vorwärtsreferenzen, doppelte IDs, unbekannte Felder und rückläufige Eingangszeiten werden abgelehnt. Auch bei Ansicht eines Präfixes wird der gesamte Eingabevertrag validiert.

| Ereignistyp | Information | Beitrag zu eigenen Wegsichtungen |
| --- | --- | --- |
| `OBSERVATION` | Eigener Wegbefund mit angegebener Beobachtungszeit; unbekannte Zeit bleibt sichtbar | Eine deklarierte Sichtung |
| `FORWARD` | Referenz auf eine frühere Sichtung oder Weitergabe; Befund und Beobachtungszeit kommen vom Ursprung | Keine neue Sichtung |
| `REACTION` | Nachricht über eine Reaktion auf einen vorhandenen Eintrag | Keine Wegsichtung |
| `PEER_ACTION_OBSERVATION` | Eigene Beobachtung einer als Reaktion gemeldeten Handlung eines anderen Knotens | Beobachtung der Handlung, keine des Hilfswegs |
| `VIEW_LOST` | Gemeldeter Sichtverlust | Keine Wegsichtung; Lücke bleibt sichtbar |
| `VIEW_RESTORED` | Gemeldete Wiederherstellung | Neue Wegsichtung steht weiterhin aus |

Eine ausdrücklich fehlende Referenz (`null`) bleibt als Herkunftslücke erhalten. Eine nicht auflösbare Weitergabe und weitere Kopien davon werden nicht in den Wegprüfer importiert. Neue Kennungen authentisieren keine Sensoren. Eine alte Originalbeobachtung bleibt auch nach späterem Empfang alt. Die Frische wird gegen den Zeitpunkt des jeweiligen Replay-Schritts berechnet. Eine Wiederherstellung schließt kein unbeobachtetes Intervall rückwirkend.

Die Knotenansicht zeigt gemeldeten Sichtstatus. Ein Wegbefund kann noch im Frischefenster liegen, obwohl danach Sichtverlust gemeldet wurde; beide Angaben bleiben erhalten. Eine nach Sichtverlust eintreffende Beobachtung ersetzt ohne Wiederherstellungsmeldung nicht den offenen Sichtstatus. Das sind offengelegte Modellannahmen dieses Vertrags.

## Sechs endliche Gegenproben

1. **Alte Gegensicht:** Fünf Nachrichten, zwei eigene Wegsichtungen, eine Weitergabe, zwei Peer-Signale. Cs Sicht ist alt. Die reale Weglage bleibt unbekannt.
2. **Aktueller Widerspruch:** Nur Cs Beobachtungszeit ändert sich. A und C widersprechen sich jetzt im Zeitfenster.
3. **Fehlender Ursprung:** Bs Weitergabe enthält keinen Ursprungsbeleg. Eine Reaktion ergänzt ihn nicht.
4. **Sichtverlust und Wiederaufnahme:** Nach der Wiederherstellung steht eine neue Beobachtung aus. Erst deren Eingang liefert einen neuen Wegbefund.
5. **Prüfung nicht verfügbar:** Die Auswertung bleibt lesbar; der menschliche Arbeitsablauf bleibt offen. Es wird kein Gerät gestoppt oder freigegeben.
6. **Verdeckte Abhängigkeit:** Drei Kennungen behaupten übereinstimmende eigene Sichten. Der Fallautor legt einen gemeinsamen Controller fest. Diese Hintergrundinformation gehört nicht zur Prüfeingabe. Der Prüfer kann die Abhängigkeit nicht erkennen; tatsächliche Unabhängigkeit bleibt `UNKNOWN`.

Die Erwartungen in `witness-cases.mjs` sind Testvorgaben des Fallautors. Der Prüfer liest nur das Nachrichtenpaket. Sie sind keine unabhängige Bewertung oder Bestätigung der Meldungen.

## Menschlicher Checklistenvergleich: vorbereitet

**Prüffrage:** Verringert die Ansicht Fehler beim Unterscheiden von eigener Wegsichtung, Weitergabe und Peer-Reaktion, ohne falsche Sicherheit oder unangemessene Mehrarbeit zu erzeugen?

Beide Bedingungen erhalten dieselben vollständigen Nachrichtenfelder und Zeitstände:

- **A · Checkliste:** Texttabelle und fünf Fragen. Keine errechneten Wurzeln oder Statuskarten.
- **B · LAGEFADEN:** Dasselbe Paket in dieser Ansicht; Antworten werden vor Aufklappen der Autorenhinweise notiert.

Die fünf Fragen: Welche Einträge enthalten eine eigene Wegsichtung? Welche geben nur andere Einträge weiter? Welche beziehen sich auf Handlungen anderer Knoten? Welche Originalbeobachtungen sind am Prüfzeitpunkt alt oder undatiert? Welche Herkunft, Sicht oder menschliche Prüfung fehlt?

Vor dem Vergleich sind fachliche Ansprechperson, Teilnehmende, Einwilligung, Reihenfolge und Auswertung festzulegen. Verwandte Fallpaare werden auf beide Bedingungen verteilt, die Reihenfolge ausgeglichen. Niemand bearbeitet denselben Fall zuerst mit der aufgelösten Ansicht und danach als vermeintlich unbeeinflusste Baseline. Fallautoren dürfen nicht als verblindete Teilnehmende gelten. Neue zurückgehaltene Pakete werden von einer zweiten Person verfasst und vor Beginn klassifiziert. Strittige Sollantworten werden ausgewiesen.

| Messgröße | Definition |
| --- | --- |
| Fehlzählung eigener Sichtungen | Falsch klassifizierte Einträge / alle vorgelegten Einträge, getrennt nach Typ |
| Erkanntes Alter / Herkunftslücke | Richtig erkannte markierte Lücken / vorab markierte Lücken; Fehlalarme zusätzlich zählen |
| Falsche Unabhängigkeitsannahme | Als authentisiert unabhängig eingestufte Kennungsgruppen / alle dazu befragten Gruppen |
| Bearbeitungszeit | Monotone Start-/Abgabezeit je Aufgabe; Unterbrechungen separat |
| Verständlichkeit | Vorab formulierte Rückfrage und konkrete Bedienprobleme, zusammen mit Fehlantworten |

**Ergebnisstand: `PROTOCOL_PREPARED_NOT_RUN`.** Lokale Vertrags- und Browsertests prüfen Rechenregeln und Bedienung. Anwendernutzen ist noch nicht gemessen. Gleichstand, Mehrarbeit und zusätzliche Fehlgewissheit ändern die Produktthese.

## Reifegrad und nächste Anbindung

Erreicht ist ein reproduzierbarer Nachrichten-Replay ohne Flughardware. Ein passender cUxS-Anwendungsfall ist eine zu prüfende Anschlussrichtung. Die vom Nutzer bereitgestellte CIHBw-Antwort nennt TRL mindestens 6 und Use-Case-Fit als Voraussetzungen. Dieses Replay trägt selbst keine TRL-6-Einstufung oder institutionelle Abnahme.

Die nächste Brücke ist ein mit einer zuständigen Stelle vereinbarter, lesender Arbeitsablauf mit repräsentativen Meldungen, überprüfbarer Herkunft und dokumentiertem Vergleich. Aufgezeichnete reale Meldungen wären ein eigener Datensatz mit Freigabe, Schema und Quellenbindung. Die jetzige Probe enthält ausschließlich synthetische Nachrichten. USGS, EONET und CEMS bleiben getrennte Datenwegproben und werden nicht zu Drohnensensoren umbenannt.

Tests: `node --test branches/lagefaden/witness-replay.test.mjs`; Browserprobe über die bestehende Encounter-Testsuite. Der lokal erzeugte JSON-Download enthält den vollständigen synthetischen Eingabevertrag, den ausgewählten Replay-Stand und den offenen Vergleichsstatus. Code MIT, neue Dokumentation CC BY 4.0 gemäß der Lizenzkarte dieses Repositorys.
