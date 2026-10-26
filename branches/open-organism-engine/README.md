# Lebende Systeme · Modelllabor

**Engine 0.2.0 · lokaler Entwicklungskandidat · Lizenzentscheidung offen**

Eine ausführbare Umgebung für verschachtelte Bereiche, gerichtete Ressourcenflüsse,
verzögerte Signale und überprüfbare Zustandswechsel. Die Berechnung läuft in einem
eigenen Browser-Worker. Die Oberfläche beobachtet erhaltene Zustände; ein eingefrorenes
Bild hält die Berechnung nicht an. **Anhalten** stoppt den Modelllauf.

Projektleitung: **Juri · HALVETH**, Entwicklung mit KI-Unterstützung.

## Was du unmittelbar ausprobieren kannst

1. **Ein Tick** führt genau einen Modellschritt aus. **20 Ticks** bilden ein
   gemeinsames Buchungsfenster. Die Detailansicht zeigt Vorher + Eingang − Ausgang = Nachher.
2. **Flüsse** zeigt echte verbuchte Transfers und die dazu definierten Routen.
   Eine vorhandene Route bedeutet noch keinen tatsächlich erfolgten Transfer.
3. **Signale** zeigt eigene gerichtete Kanäle und ihre Verzögerung. Eine Nachricht
   transportiert Daten; sie erzeugt keinen Ressourcenbestand.
4. **Starten** aktiviert die Berechnung. **Bild einfrieren** hält nur die Anzeige
   fest. Nach dem Auftauen erscheint die jüngste erhaltene Projektion.
5. **Verlauf** macht Modell-Ticks, Beobachtungslücken, Journalfenster und den
   Prüfstand sichtbar. Ein Audit gilt für den dazugehörigen Journal-Head und
   wird nach einer weiteren Änderung als veraltet gekennzeichnet.
6. **Checkpoint exportieren** speichert Daten und ein Prozessmanifest. Der Import
   prüft Format, Größen, Digests, Journal, Szenariorezept und lokale Callbackbindung,
   bevor die bisherige Welt ersetzt wird. Ein abgewiesener Import erhält den Stand.

Die geplante öffentliche Route lautet `systeme/`. Die lokale Vorschau wird über
die explizite Dateiliste des Repositorys bedient. Ein `file://`-Doppelklick ist
kein unterstützter Startweg für Module-Worker.

## Drei Szenarien

| Szenario | Ausführbare Mechanik | Aussagegrenze |
| --- | --- | --- |
| Verschachtelte Bereiche | 19 Bereiche, 24 gerichtete Routen, 3 Kanäle, 31 Prozesse; sättigbare Flüsse, Bedarfe, selektive Rezeptoren und ein Codon-Referenzschritt | Abstrakte Modellmengen und ausdrücklich gesetzte Parameter; keine physiologische Kalibrierung |
| Konkurrenz um einen Bestand | Eine gemeinsame Reserve, drei Bedarfe mit unterschiedlichen Gewichten und Kapazitäten, explizite Rückrouten und Signalfeedback | Gewichtete Zuteilung ist eine Modellregel; sie beweist weder Fairness noch eine wirtschaftliche Rendite |
| Softwareprofile & Nachrichten | Selbst erzeugte Datenprofile und deterministische Nachrichtenprozesse; 69 oder 1000 Profile in der Oberfläche | Profile sind Daten und lokale Regeln; keine externen KI-Agenten, kein Training und kein Bewusstseinsnachweis |

68 war die Anzahl eines früher betrachteten Registers. Die Engine verwendet Maps
und explizite Ressourcenbudgets. Der Browser begrenzt das synthetische Szenario auf
1000 Profile; das ist eine Betriebsgrenze dieser Ansicht, keine Definition möglicher Entitäten.

## Modellvertrag

- **Identität und Zustand:** `id`, `origin`, Elternbeziehung, Rolle und Quelle bleiben
  von Beständen und Dimensionen getrennt. Neue Browserbereiche entstehen leer und
  führen `USER_DECLARED_LOCAL_NODE` als Herkunft.
- **Zeit:** Ein Tick besitzt ganze Millisekunden. Eingaben für `advance()`/`gap()`
  müssen eindeutig auf ganze Mikrosekunden zurückpassen. Nicht passende Zahlen
  werden abgewiesen. Es gibt keine EPS-bedingte zusätzliche Zeit.
- **Prozesse:** Alle `ctx.read()`-Aufrufe eines Ticks lesen denselben Tickanfang.
  Updates eines Prozesses verändern nicht heimlich die Lesegrundlage späterer Prozesse.
  Kontexte verfallen nach dem synchronen Callback; Async-/Generatorprozesse sind ausgeschlossen.
- **Flüsse:** Eine Route bindet Quelle, Ziel, Ressource, `vmax` und `km`.
  Anforderungen werden gemeinsam durch Quellbestand und Routenkapazität begrenzt.
  Ungenutzte Anteile gesättigter Routen werden weiterverteilt. Gleitkommazahlen
  bleiben Näherungen; die Bilanzprüfung führt einen relativen Toleranzvertrag.
- **Signale:** Inbox-Einträge und Transit werden protokolliert. `receive({signal})`
  konsumiert nur den angegebenen Signaltyp. Volle Queues erzeugen einen sichtbaren
  Kapazitätseintrag; ein konsumierender Prozess löscht keine fremden Signaltypen.
- **Atomare Modellaufrufe:** Ein fehlgeschlagenes `advance()` stellt die gesamte
  Aufrufbasis einschließlich Zeit, Beständen, Dimensionen, Nachrichten und Journal
  wieder her. Das gilt für den Modellzustand. Umgebungswirkungen beliebiger
  vertrauenswürdiger Node-Callbacks werden dadurch nicht zurückgenommen.
- **Daten:** Geschlossene Plain-JSON-Werte, endliche Zahlen und wohlgeformtes Unicode.
  Doppelte dekodierte JSON-Schlüssel, Accessoren, Map/Set/Date, Sparse Arrays,
  `undefined` und zyklische Daten werden nicht still normalisiert.

## Ausführung, Beobachtung und Grenzen

Der Worker besitzt einen eigenen Eventloop. Sein Scheduler führt feste Ticks aus
und holt höchstens fünf Ticks pro beobachtetem Intervall nach. Weitere vollständige
Tickintervalle werden als Lücke erfasst. Gemessene verstrichene Laufzeit, ausgeführte
Modellzeit und nicht ausgeführte Lücken bleiben getrennte Zahlen.

Ein Browser kann Hintergrundtabs drosseln oder schließen. Ein Dedicated Worker
ist kein unabhängig vom Browser dauerhaft installierter Dienst. **Fortsetzung
nach einem geschlossenen Prozess erfolgt nur aus einem tatsächlich gespeicherten
Checkpoint.** Keine reale Null-Lücken- oder Stromausfallgarantie wird behauptet.

Das Journal wird nicht still gekürzt oder rotiert. Bei `maxEvents` stoppt die
Engine kontrolliert. Der Verlauf zeigt höchstens die letzten 180 Events und nennt
den ausgelassenen Präfix; ein vollständiger Checkpoint enthält das gesamte Journal.
Import/Export sind auf **16 MiB UTF-8** begrenzt. Ein großer Langzeitbetrieb mit
segmentiertem Journal und verifizierter Kompaktion bleibt ein eigener Ausbauzweig.

## Wiederaufnahme statt bloßer JSON-Vorschau

`halveth.open-organism.v2` bindet Konfiguration, Instanznamespace, Mikrosekundenrest,
Anfragen, Nachrichten, Inboxes, Zähler, Prozessparameter und Callback-Quelldigests.
`halveth.organism-checkpoint.v1` ergänzt das versionsgebundene Szenariorezept.

Ein Import lädt **keine Funktionen aus JSON**. Er verwendet ausschließlich die
vorhandenen lokalen Prozessrezepte. Alte V1-Snapshots besitzen keinen hinreichenden
Fortsetzungsvertrag und werden nicht als wiederhergestellte Engine ausgegeben.

Ein SHA-256-Digest bindet die entsprechende Serialisierung. Er ist keine Signatur,
Authentisierung, Urheberbestätigung oder Garantie für richtige Eingabedaten. Wer
eine ganze Datenkette neu erzeugt, kann auch neue Digests berechnen. Die Rezeptbindung
und das Journalreplay prüfen definierte lokale Invarianten; sie beweisen keine
vollständige Außenhistorie. Callbacktext und Parameter erfassen keinen unbekannten
Closurezustand. Die mitgelieferten Rezepte verwenden explizite unveränderliche Parameter.

## Lokaler Node-Start

Voraussetzung: Node **24.22.1** beziehungsweise der im Repository erlaubte gepatchte
Runtime. Keine Abhängigkeiten für die Engine. Die einzige externe Testabhängigkeit
ist das bereits separat gesperrte Playwright-Werkzeug des Repositorys.

```powershell
node --test branches/open-organism-engine/tests/*.test.mjs
node branches/open-organism-engine/examples/demo.mjs
node branches/open-organism-engine/examples/profile-index.mjs 1000
```

Ein eigener, bereits bestehender Ausgabeordner ist für den persistenten Runner
Pflicht. Er erzeugt neue Dateien und ersetzt vorhandene Ziele nicht:

```powershell
node branches/open-organism-engine/examples/persisted-runner.mjs --output C:\MEIN_MODELLLAUF --duration-ms 60000 --checkpoint-ms 10000 --scenario profiles --profiles 8 --tick-ms 1000
```

Ein zweiter Prozess kann denselben Modellstand in einem **anderen neuen Ausgabeordner**
fortsetzen. Szenarioparameter werden dann aus dem Checkpoint übernommen:

```powershell
node branches/open-organism-engine/examples/persisted-runner.mjs --output C:\MEIN_FOLGELAUF --resume C:\MEIN_MODELLLAUF\final.json --duration-ms 60000
```

Schreiben erfolgt über eine exklusive Tempdatei, Dateisync, begrenztes Nachlesen
und exklusive Veröffentlichung. Explizites `overwrite:true` im Bibliotheks-API
nutzt Rename ohne vorheriges Entfernen des akzeptierten Ziels. Der CLI benötigt
diese Ersetzung nicht. Verzeichnissync und seine möglichen Fehler werden getrennt
im Receipt genannt. Stabile eigene Elternordner bleiben Voraussetzung; portable
Node-APIs bieten keinen universellen Schutz vor böswillig ausgetauschten Vorfahren.

## Quellregister als Daten

`parseRegistryText()` akzeptiert begrenztes JSON oder den exakt definierten statischen
Wrapper `window.HalvethUniverse = …;`. Es gibt kein `eval` und keinen Import
fremden Register-JavaScripts. Der Receipt bindet die gelesenen UTF-8-Bytes; ursprüngliche
Profilfelder bleiben im Datenmodell erhalten. Eigene Eingaben behalten ihre Rechte.
Das öffentliche Beispiel lädt ausschließlich selbst erzeugte synthetische Profile.

## Prüfung und nächste offene Äste

Die Regressionen enthalten die ursprünglichen 21 Prüfungen, Budget-/Callbackfehler,
konkurrierende Anforderungen, Zahlenextreme, selektiven Nachrichtenempfang,
Uhrgrenzen, beschädigte Checkpoints, Rezeptbindung, echte Worker, persistentes
Nachlesen und konkurrierende Dateischreiber. Der aktuelle konkrete Lauf steht
in [AUDIT.md](AUDIT.md). Quellen: [SOURCES.md](SOURCES.md), Übernahme: [SOURCE.json](SOURCE.json).
Die [Architektur](ARCHITECTURE.md) bindet die Ausführungswege und offenen Ausbauäste.

Offen bleiben unter anderem segmentierte Journale, adaptive kontinuierliche Solver,
skalierte Beobachtungsprojektionen über 1000 Profilen, echte gelernte Regeln und
domänenspezifische Kalibrierung. Das sind getrennte Ausbauaufträge mit eigenen
Testoracles. Ein grüner lokaler Test ist kein Nachweis dieser Eigenschaften.

Die Lizenzentscheidung für dieses neue Modul ist noch offen; siehe
[LICENSE-STATUS.md](LICENSE-STATUS.md). Frühere Dateifreigaben anderer Module bleiben erhalten.
