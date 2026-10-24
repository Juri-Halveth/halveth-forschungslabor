# Sicherheitswerkzeugkasten – Eingaben, Identitäten und Wirkung prüfen

Projektleitung: **Juri**, Projekt HALVETH. Entwicklung mit KI-Unterstützung.

**[Browser-Prüfplatz öffnen](https://juri-halveth.github.io/halveth-forschungslabor/sicherheitslabor/)**

Sechs ausführbare Prüfbereiche und ein eigener lokaler HTTP-Dienst. Keine zusätzlichen npm-Pakete erforderlich. Die Browseransicht rechnet lokal; die CLI liest ihren tatsächlichen Prozessstand und benutzt reale Node-APIs. Für die folgenden Node.js-Zweige sind die datierten Mindeststände `22.23.4`, `24.22.1` und `26.12.1` dokumentiert. Das Gesamt-Repository benötigt Node.js 24.22.1 oder 26.12.1 sowie Python 3.11 oder neuer.

## Direkt ausführen

Im Repository-Hauptordner:

```sh
node branches/security-workbench/cli.mjs runtime --require-patch
node branches/security-workbench/cli.mjs identity 0127.0.0.1
node branches/security-workbench/cli.mjs selftest
node branches/security-workbench/cli.mjs report
```

`runtime` beobachtet ausschließlich den gestarteten Prozess. `--require-patch` beendet sich mit Exitcode 2, wenn dessen Versionszweig offen ist oder unter der bekannten Patchschwelle liegt. Die separat angezeigte Brotli-Version ist bei Node kein ausreichender Patchindikator: ein Backport kann den Runtimefehler korrigieren, ohne diese Zeichenfolge zu ändern. Fremde Binaries, Container und bereits laufende Dienste werden nicht automatisch inventarisiert.

`identity` vergleicht die reale WHATWG-URL-Auswertung, `net.isIP` und `tls.checkServerIdentity` mit einem festen synthetischen Zertifikatsobjekt. Dabei entsteht keine DNS- oder TLS-Verbindung. Ein akzeptierter Funktionsaufruf belegt noch keinen vertrauenswürdigen TLS-Handshake.

`selftest` startet zwei eigene Listener mit zufälligem Port auf `127.0.0.1`, führt jeweils sieben sequenzielle HTTP-Requests aus und schließt beide Listener. Der absichtlich fehlerhafte Pfad erlaubt synthetische Metadaten für Bob, obwohl Alice angemeldet ist; der korrigierte Pfad weist diesen Zugriff zurück. Beide lehnen falschen Host und fehlenden Laborschlüssel ab und liefern nach vier freigegebenen Requests 429. Die Ausgabe enthält keine Laborschlüssel.

`report` bündelt Prozessbeobachtung, API-Ergebnisse, gültigen Brotli-Roundtrip, Modellkontrollen und HTTP-Selbsttest. Eine Umleitung in eine Datei speichert diese Ausgabe lokal. Sie wird nicht automatisch veröffentlicht.

## Mit Burp am eigenen HTTP-Dienst arbeiten

```sh
node branches/security-workbench/cli.mjs lab
```

Die Konsole zeigt die eigene Adresse und den kurzlebigen Laborschlüssel. In einem separaten Burp-Projekt den Zielbereich genau auf diese Loopback-Adresse und diesen Port beschränken; in Repeater den HTTP-Zielhost entsprechend setzen. Die [offizielle Anleitung](https://portswigger.net/burp/documentation/desktop/getting-started/setting-target-scope) erklärt die Bereichseinstellung.

```http
GET /lab/document HTTP/1.1
Host: 127.0.0.1:PORT_AUS_DEINER_KONSOLE
X-Lab-Token: SCHLUESSEL_AUS_DEINER_KONSOLE
X-Demo-Owner: alice
Connection: close

```

1. Eigenes Objekt und richtiger Schlüssel: `200` mit synthetischen Metadaten.
2. Nur `X-Demo-Owner` auf `bob` ändern: `403` wegen Subjektabweichung.
3. Laborschlüssel entfernen: `401`.
4. Das feste Budget von 64 authentisierten Requests verbrauchen: `429`.
5. Mit `Strg+C` beenden; spätestens nach 15 Minuten schließt der Dienst selbst. Nach 256 gesamten Requests schließt die Sitzung ebenfalls. Es gibt keine Eingabe eines Zielhosts und keine Befehls-, Upload- oder Dateizugriffsroute.

Für die bewusst defekte Gegenprobe dient ein eigener neuer Prozess:

```sh
node branches/security-workbench/cli.mjs lab-defect
```

Dieser Modus ist ausdrücklich eine absichtlich fehlerhafte, lokale Fixture mit festen Beispieldaten. Er demonstriert die fehlende Subjektbindung. Ein dortiges `200` ist kein Befund gegen ein fremdes Produkt. Schlüssel und private Ausgaben bleiben außerhalb von Git.

## Was jeder Prüfplatz tatsächlich tut

| Prüfbereich | Ausführung und Grenze |
|---|---|
| Laufzeitvergleich | Exakte Versionsangaben gegen den datierten Vendor-Katalog; unbekannte Zweige bleiben offen. |
| Parservergleich | Browser-URL-API beziehungsweise lokale Node-APIs; ursprüngliche Schreibweise und berechnete Identität getrennt. |
| Decoderzustand | Endliche Ereignisfolge mit permanentem Fehler und resumierbarer Eingabe. Keine nativen fehlerhaften Brotli-Bytes. |
| Subjektbindung | Zwei feste In-Memory-Subjekte, im CLI auch über echtes eigenes HTTP. |
| Anfragebudget | Deterministischer Tokenbudget-Vergleich. Browsermodell erzeugt keine Netzlast; HTTP-Fixture hat ein festes Requestlimit. |
| Textsichtung | Höchstens 32768 Zeichen, statische Fundstellen mit exaktem Textspan. Kommentare und harmlose Beispiele bleiben mögliche Erklärungen. |

Der Browserexport enthält die eingegebenen Werte und die dazu berechneten Resultate. Vor einer Weitergabe den Inhalt selbst prüfen. Die statische Textsichtung führt keine Probe aus und liefert weder ein Malware- noch ein Unbedenklichkeitsurteil. Es werden keine Trojaner, Viren oder Exploitdateien heruntergeladen.

## Vom Labor zum offiziellen Programm

Die Vorbereitung bindet Ziel, Eigentümer, aktuelle Programmpolicy, exakte Assets, Testidentität, erlaubte Verfahren, Budget, Datenklasse und Abbruchbedingungen. Danach getrennt prüfen: tatsächlicher Verarbeitungspfad, vom Tester kontrollierbare Eingabe, verletzte Eigenschaft, Berechtigungsänderung und kleinste beobachtete Wirkung. Programm-Akzeptanz und Vergütung sind gesonderte Entscheidungen des Programms.

Lastresilienz, Sitzungsgrenzen und Malwareanalyse bleiben Forschungsbereiche mit eigenen Voraussetzungen. Der hier laufende Dienst ist ausschließlich eine eigene synthetische Übung. Eine Programmpolicy muss reale Lasttests, Interception oder weitere Wirkung auf ihren konkreten Zielen selbst erlauben. Die vorhandene Browser-Budgetsimulation ist kein DDoS-Verfahren.

## Prüfen und weiterlernen

```sh
node --test branches/security-workbench/core.test.mjs branches/security-workbench/http-fixture.test.mjs
npm test
node scripts/build-learning-hub.mjs --check
```

Ein neuer Fall ergänzt Eingabe, Erwartung, tatsächlichen Consumer, Gegenhypothese und unterscheidende Kontrolle. Ein Test muss auch den absichtlich defekten Kontrollpfad erkennen. Die Lernkarte bindet Quellen und Tests; sie ist kein selbst trainiertes Modell und kein allgemeiner Sicherheitsnachweis.

## Herkunft

Eigene neue Implementierung, keine übernommene Exploit-Implementierung. [Vendor- und Werkzeugquellen](SOURCES.md). [Repository-Lizenzen](../../LICENSES.md): Code MIT, Erläuterungen CC BY 4.0, Metadaten CC0. Historische Grants und Quellregister bleiben erhalten. Kontakt für Sicherheitskommunikation: `security@halveth.de`.
