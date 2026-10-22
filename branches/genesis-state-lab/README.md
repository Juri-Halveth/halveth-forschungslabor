# GENESIS / Zustandslabor

Ein ausführbares, endliches und **synthetisches** Modell nach Juris LUCINET- und HALVETH-Idee: Ein Impuls trifft auf einen Zustand, läuft über typisierte Relationen und wird mit Feedback, Kontext und einer aggregierten Schicht beschrieben. Die Oberfläche unter [`index.html`](index.html) zeigt den Graphen, denselben Event aus zwei Perspektiven, die Zeitspur und ein Gegenbeispiel gegen eine zu grobe Zustandsansicht.

## Lokal starten

Vom Repository-Root aus:

```sh
python -m http.server 8847 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8847/branches/genesis-state-lab/` öffnen. Die Anwendung lädt keine externen Ressourcen und sendet keine Requests. Ein HTTP-Server ist nötig, weil Browser ES-Module über `file://` unterschiedlich behandeln. Der gesamte Modellzustand liegt nur im aktuellen Tab und wird beim Neuladen zurückgesetzt.

Tests:

```sh
node --test branches/genesis-state-lab/model.test.mjs
npm test
```

## Vertrag des Modells

| Element | Gebundene Bedeutung |
| --- | --- |
| `STATE` | Ein einziges Array mit genau 100 Agenten, jeweils Signal `0…4` und Kontext-Gate `0/1`. |
| `TRANSITION` | `applyImpulse` erhöht das Signal eines gewählten Agenten um 2, höchstens bis 4. |
| `FEEDBACK` | Eine gerichtete `RELAY`-Kante liefert bei offenem Gate ein Signal an den nächsten Agenten. Eine der 20 `ECHO`-Kanten kann das Gate eines anderen Agenten umschalten. |
| `CONTEXT` | Das Gate entscheidet über die Weitergabe; bei Sättigung des Ursprungsagenten schließt es. |
| `LAYER` | Drei Signalgruppen beschreiben den neuen Zustand. Sie sind eine Projektion, kein zusätzliches Universum. |

Die 100 Agenten und 120 Kanten sind ein **fester Testdatensatz**. Sie behaupten weder 100 unabhängige KI-Instanzen noch eine physikalische oder soziale Dynamik. Die fünf Wörter benennen Felder eines Ereignisvertrags; der Code erzeugt keine fünf unabhängigen Zwischenzustände.

Eine Session enthält `initialState`, die append-only Reihen `events` und `states` sowie einen festen Graphen. Jeder Event bindet Sequenz, Eltern-Event-ID, Urheber-Agent, Graph-ID, vorherigen und folgenden Inhalts-Fingerabdruck, genutzte Relations-IDs und die Auswertung. `replay` berechnet jede Transition erneut und vergleicht Event und Zustand exakt. Unterschiedliche Event-IDs können auf denselben Inhaltszustand zeigen: **Ereignisidentität und Inhaltsgleichheit sind getrennt.** Der 64-Bit-FNV-1a-Fingerabdruck ist nur ein lokaler Reproduzierbarkeits- und Veränderungsindikator; er belegt keine Autorschaft, Originaldatei, Geheimhaltung oder externe Wahrheit.

## Vorwärtsansicht und ANTI-DATEI

`projectEvent(event, 'forward')` und `projectEvent(event, 'anti')` erstellen zwei sprachliche Ansichten **desselben** Records. Beide tragen dieselbe Event-ID und dieselben Vorher-/Nachher-Referenzen. Die ANTI-DATEI ist hier die Empfängerperspektive auf einen RELAY-Versuch. Sie ist kein zweiter Zustand, keine Negation der Daten und keine rekonstruktive Umkehrfunktion. Bei geschlossenem Gate zeigt die Gegenansicht ausdrücklich, dass kein Signal empfangen wurde.

Die Vorwärtsregel kann zwei verschiedene vollständige Vorzustände auf denselben Nachzustand abbilden: Bei Ursprungssignal 3 oder 4 entsteht in beiden Fällen Sättigung 4. Der Test hält die übrigen Felder gleich und zeigt die Kollision. Replay benötigt daher den gebundenen Anfangszustand und die Ereignisfolge; aus einer Event-ID oder einem Nachher-Fingerabdruck allein wird der Vorzustand nicht wiederhergestellt.

## Das Scope-Gegenbeispiel

`scopeCounterexample()` konstruiert zwei Zustände mit identischem grobem Bild (`totalSignal`, aktive und gesättigte Agenten). Sie unterscheiden sich nur im verborgenen Gate von A000. Derselbe Impuls auf A000 führt dann zu unterschiedlichem `totalSignal`, weil das offene Gate an A001 weitergibt. Damit ist diese konkrete Makroprojektion für diese konkrete Übergangsregel **nicht kongruent**: Die grobe Ansicht reicht nicht, um den nächsten groben Zustand immer eindeutig vorherzusagen. Das ist ein einzelner ausführbarer Zeuge, kein Vollständigkeitsbeweis über alle möglichen Systeme.

## Konzeptquellen und Herkunft

- Von Juri im Auftrag verlinkter [Chat-Link zur Genesis-/KOSMOS-X9-Idee](https://chatgpt.com/share/6ada12f4-d720-83eb-95f4-840c4e6a64ad): Impuls → Relation → neuer Zustand, `STATE → TRANSITION → FEEDBACK → CONTEXT → LAYER`, zwei Perspektiven auf ein Geschehen. Der Link ist hier ein Ideengeber; Originaldateien, Entstehungszeit und Außenwirkung wurden in diesem Branch nicht verifiziert.
- Lokal geprüfter Konzepttext **REPLAY_MODEL** (SHA-256 `28462f18c84f2814b76c55693c937789070ac8bf66accaeb76c255241e4e8028`): Anregung für sequenzielles, fehlersensitives Replay. Das dort beschriebene Rust-Journal, SHA-256-Verfahren und seine Testbelege sind hier **nicht** übernommen oder reproduziert.
- Lokal geprüfter Konzepttext **Scope-Closure** (SHA-256 `8b36a82a6228079c938c1866bfead32c57058bc83dc174304f8ed9d2da384c41`): Anregung für eine Probe mit zwei im Scope gleichen Zuständen und divergierender Folge. Dessen Enumeration, Zertifikate und Beweise wurden **nicht** übernommen.

Die Implementierung und die Darstellung wurden für diesen Branch neu geschrieben. Es wurden keine Codebytes aus den beiden lokal geprüften Archiven kopiert und keine privaten Pfade oder Inhalte veröffentlicht. Projektleitung und Konzept: **Juri Halveth / HALVETH**, Entwicklung mit KI-Unterstützung. Die Lizenzzuordnung des Repositories gilt: Code, HTML und CSS unter MIT; diese neu geschriebene Erläuterung unter CC BY 4.0. Die oben genannten Konzeptquellen behalten ihre eigenen Rechte.

## Prüfgrenze

Tests belegen nur den deklarierten lokalen Modellvertrag und das konkrete Gegenbeispiel. Die Visualisierung ist eine 2D-Projektion des Graphen. Ein grünes Replay zeigt Konsistenz des implementierten Ablaufs, nicht tatsächliche Beobachtung eines fremden Systems, unveränderliche Historie, kryptografische Echtheit oder Gültigkeit einer allgemeinen Welttheorie.
