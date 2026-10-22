# GENESIS / Zustandslabor

Ein ausführbares, endliches und **synthetisches** Modell nach Juris LUCINET- und HALVETH-Idee: Ein Impuls trifft auf einen Zustand, läuft über typisierte Relationen und wird mit Feedback, Kontext und einer aggregierten Schicht beschrieben. Die Oberfläche unter [`index.html`](index.html) zeigt den Graphen, denselben Event aus zwei Perspektiven, die Zeitspur und ein Gegenbeispiel gegen eine zu grobe Zustandsansicht.

Die [Anschlusskarte](BRIDGES.md) zeigt die konkreten Prüfwege zu Ereigniskern, Ausgrabungsstätte, Navigator und Metadatenprüfung samt Forschungsquellen und der offenen Adapterfrage.

Der [Belegsatz](evidence/README.md) verbindet drei lokale Browseraufnahmen,
einen vollständigen Testlog und ein Digest-Receipt mit dem geprüften Quellstand.
Jede Aufnahme trägt nur ihren sichtbaren Ausschnitt der synthetischen Software.

Der lokale [`handoff.js`](handoff.js) verbindet den Replay-Stand mit dem bereits vorhandenen Forschungsnavigator. Sein Ergebnis ist eine Datenprojektion im Browser; der Link zum Navigator öffnet eine separate Seite und überträgt keine Daten dorthin.

## Lokal starten

Vom Repository-Root aus:

```sh
python -m http.server 8847 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8847/branches/genesis-state-lab/` öffnen. Die Anwendung lädt keine externen Ressourcen und sendet keine Requests. Ein HTTP-Server ist nötig, weil Browser ES-Module über `file://` unterschiedlich behandeln. Der gesamte Modellzustand liegt nur im aktuellen Tab und wird beim Neuladen zurückgesetzt.

Tests:

```sh
node --test branches/genesis-state-lab/*.test.mjs
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

`projectEvent(event, 'forward')` und `projectEvent(event, 'anti')` erstellen zwei sprachliche Ansichten **desselben** Records. Beide tragen dieselbe Event-ID und dieselben Vorher-/Nachher-Referenzen. Die ANTI-DATEI ist hier die modellierte Sicht auf das RELAY-Ziel. Sie ist kein zweiter Zustand, keine Negation der Daten und keine rekonstruktive Umkehrfunktion. Bei geschlossenem Gate zeigt die Gegenansicht ausdrücklich, dass kein Signal zugestellt wurde. `usedRelations` listet geprüfte Relationen; eine gelistete RELAY-Kante bedeutet bei `BLOCKED_BY_CONTEXT` keine Zustellung.

Die Graphmarkierung folgt beim Ansehen eines historischen Events dessen gespeicherter Quelle. Eine spätere Änderung im Ursprungsmenü bereitet nur den **nächsten** Impuls vor und färbt das angezeigte frühere Ereignis nicht um. Am Anfang der Zeitspur zeigt die Markierung die aktuelle Menüauswahl.

Die Vorwärtsregel kann zwei verschiedene vollständige Vorzustände auf denselben Nachzustand abbilden: Bei Ursprungssignal 3 oder 4 entsteht in beiden Fällen Sättigung 4. Der Test hält die übrigen Felder gleich und zeigt die Kollision. Replay benötigt daher den gebundenen Anfangszustand und die Ereignisfolge; aus einer Event-ID oder einem Nachher-Fingerabdruck allein wird der Vorzustand nicht wiederhergestellt.

## Das Scope-Gegenbeispiel

`scopeCounterexample()` konstruiert zwei Zustände mit identischem grobem Bild (`totalSignal`, aktive und gesättigte Agenten). Sie unterscheiden sich nur im verborgenen Gate von A000. Derselbe Impuls auf A000 führt dann zu unterschiedlichem `totalSignal`, weil das offene Gate an A001 weitergibt. Damit ist diese konkrete Makroprojektion für diese konkrete Übergangsregel **nicht kongruent**: Die grobe Ansicht reicht nicht, um den nächsten groben Zustand immer eindeutig vorherzusagen. Das ist ein einzelner ausführbarer Zeuge, kein Vollständigkeitsbeweis über alle möglichen Systeme.

Der Schalter **Nur Signale / Signale + Gate** hält Zustände und Impuls fest und ändert allein den Beobachtungsoperator. `projectionPairAudit()` meldet bei der ersten Linse `COUNTEREXAMPLE`; bei der zweiten sind die beiden Zustände bereits vor dem Impuls unterscheidbar. Das beseitigt genau diesen Gegenzeugen. Eine Aussage über alle Zustände oder alle möglichen Projektionen folgt daraus noch nicht.

## Endliche Scope-Prüfung

`auditFiniteScope()` prüft die Paarfrage systematischer: A000 und A001 erhalten unabhängig voneinander je fünf Signalwerte und zwei Gatewerte. Das ergibt exakt **100 vollständige Zustände**; die anderen 98 Agenten sind im Ausgangszustand fixiert. Für jeden Zustand werden die Impulse A000 und A001 berechnet, also 200 Zustands-Input-Paare. Vier explizite Ansichten gruppieren Zustände nur innerhalb desselben Inputs nach gleicher Vorher-Projektion und prüfen die Folge-Projektion:

| Ansicht | Verschiedene Ansichtsklassen über beide Inputs | Klassen mit unterschiedlicher Folge | Befund im endlichen Scope |
| --- | ---: | ---: | --- |
| Nur aggregierte Signale | 28 | 27 | Gegenzeuge |
| Aggregierte Signale + Gate des handelnden Agenten | 56 | 38 | Gegenzeuge |
| Aggregierte Signale + beide lokalen Gates | 112 | 76 | Gegenzeuge |
| Vollständige lokale Felder von A000 und A001 | 200 | 0 | Kein Gegenzeuge; jede Klasse hat genau einen Zustand |

Die zweite Ansicht repariert das erste Gate-Paar, aber nicht alle anderen Paare: Die Verteilung gleicher Gesamtsignale auf A000 und A001 kann weiterhin verschiedene Folgen erzeugen. Auch beide Gates allein schließen diese Lücke nicht. Der letzte Lauf ist **kein** Closure-Beweis über das Gesamtsystem: Die 200 Klassen sind im geprüften Ausschnitt sämtlich Singletons; Zustände anderer Agenten und weitere Inputs wurden nicht variiert. Die Oberfläche zeigt zu jeder abweichenden Ansicht einen erneut berechneten konkreten Zeugen statt nur eines Statusworts. Der Code in [`scope-audit.js`](scope-audit.js) ist neu geschrieben; der archivierte Scope-Closure-Code wurde nicht kopiert.

## Rückweg mit explizitem Residuum

[`preimage-audit.js`](preimage-audit.js) isoliert eine andere endliche Frage. Beim Impuls A001 sind alle Felder außer dem Vor-Signal dieses Agenten fest; sein Gate steht offen. Die fünf Vorwerte `0,1,2,3,4` führen zu drei vollständigen Nachzuständen. Wegen der Sättigung kollabieren `2,3,4` auf denselben Nachzustand mit A001-Signal `4` und geschlossenem Gate. Diese größte Rückfaser hat drei Elemente. Ein festes Residuum benötigt daher mindestens `ceil(log₂ 3) = 2` Bit, wenn es den Vorwert innerhalb **dieser** Fünferfamilie wiederherstellen soll. Der implementierte Rangcode `00,01,10` rekonstruiert alle fünf aufgezählten Vorwerte; ein fremder Nachzustand oder ungültiger Rang wird abgelehnt.

Der Codec gruppiert nach dem vollständigen kanonischen Nachzustand, nicht nach dem kurzen FNV-Fingerabdruck. Seine exakte Rückrechnung gilt nur für die ausdrücklich variierte Fünferfamilie. Sie ist keine Umkehrfunktion für alle Genesis-Zustände oder für historische Ereignisse außerhalb des aktuellen Tabs. Die ältere lokale Reversibilitätsidee war eine methodische Anregung; Codebytes wurden nicht übernommen.

## Das Residuum durch einen endlichen Flaschenhals

[`residual-transport-audit.js`](residual-transport-audit.js) schließt an die größte Rückfaser mit den drei Vorwerten `2,3,4` an. Der vollständige Nachzustand ist für diese drei gleich; der Zusatzrang `0,1,2` muss daher getrennt übertragen werden. Bei Kanalbreite 2 und einem Takt gibt es nur zwei Symbolfolgen: Rang 0 und 2 kollidieren, sodass der Vorwert 4 fälschlich als 2 rekonstruiert würde. Zwei binäre Takte liefern `00`, `01`, `10` in Sendereihenfolge und rekonstruieren alle drei. Ein Takt mit drei Symbolen reicht ebenso. Die Oberfläche zeigt jede Symbolfolge und den tatsächlich wiedergefundenen Vorwert.

Die Modulprüfung rechnet die drei Rückwege mit dem vorhandenen endlichen Decoder durch; sie verlässt sich nicht nur auf die Formel `Breite^Takte`. Der Befund lautet **Transport dieses Residualrangs in dieser Dreierfamilie**. Er beweist keinen allgemeinen physikalischen Kanal, keine Zeitreise und keine Reversibilität anderer Genesis-Transitionsfolgen. Das alte lokale Flaschenhals-Modul war Konzeptanstoß; der öffentliche Code wurde eigenständig geschrieben.

## Beobachtungsspiegel: Kandidat vor Ergebnis

[`prediction-audit.js`](prediction-audit.js) berechnet für einen gebundenen Anfangszustand und Impuls A000 **einmal** die erwartete Makroansicht. Die Funktion erhält kein späteres Ergebnis als Eingabe. Der Browser hält diesen Kandidaten während dreier synthetischer Kontrollfälle fest: noch keine Beobachtung (`UNKNOWN_NO_OBSERVATION`), dieselbe Modelltransition (`MATCH_IN_MODEL_CONTROL`) und ein künstlich um ein Signal verändertes Nachbild (`MISMATCH_IN_MODEL_CONTROL`). Der letzte Fall ist kein zweiter Anfangszustand und keine gemessene Abweichung. Der Test prüft, dass Kandidat und Fingerabdruck unverändert bleiben und dass die beiden Kontrollwerte in der verwendeten Ansicht wirklich unterscheidbar sind.

Der Fingerabdruck ist nur ein lokaler Änderungsindikator, keine kryptografische Signatur und kein Zeitstempel. Beide `Y`-Werte werden **innerhalb desselben Modells** erzeugt. Ein späterer Abgleich mit der Außenwelt benötigt eine unabhängige Quelle, Zeitpunkt, Messoperator, Kalibrierung, Coverage und einen vorher gebundenen Vergleich. Der archivierte Gedanke der Wahrheitsgrenze und Nichtinterferenz wurde als Frage übernommen; kein privater Code wurde in dieses Modul kopiert.

[`prediction-process-probe.mjs`](prediction-process-probe.mjs) prüft die Trennung zusätzlich mit frischen Node-Prozessen: `generate` erhält keinen Auswertungsmodus und beendet sich nach einem kanonischen Kandidatenrecord. Ein zweiter Prozess liest genau diesen Record und wertet `pending`, `matching` oder `differing` aus. Drei separat gestartete Generatoren liefern bytegleiche Kandidaten; abweichend gebundene oder manipulierte Kandidaten werden abgelehnt. Beispiel vom Repository-Root: `node branches/genesis-state-lab/prediction-process-probe.mjs generate | node branches/genesis-state-lab/prediction-process-probe.mjs evaluate matching`. Das zeigt Prozessisolation in diesem Testaufbau; es beweist weder einen unabhängigen externen Messkanal noch Freiheit von jeder denkbaren gemeinsamen Datei oder Umgebung.

## Gepaarte Scores: positive Summe ist nicht automatisch ein Richtungssieg

[`paired-score-audit.js`](paired-score-audit.js) implementiert unabhängig vom älteren lokalen Archivcode einen strikten Serienvergleich. Die deklarierte Entscheidungsregel verlangt zugleich eine mittlere Differenz von mindestens `0,5` und einen Vorsprung in **mehr als der Hälfte** der Paare. Sie wird spiegelbildlich für die Kontrolle geprüft. Vier synthetische Folgen zeigen Originalvorsprung, Kontrollvorsprung, Abstand unter der Schwelle und einen Mischfall: `Original=[2,0,0]`, `Kontrolle=[0,0,0]` ergibt einen positiven Mittelwert von `2/3`, aber nur ein gewonnenes Paar. Das Resultat heißt deshalb `MIXED_OR_INSUFFICIENT_MAJORITY`; es sagt nicht „Kontrolle besser“.

Die ältere lokale Vergleichsfunktion kann genau diesen Mischfall falsch als `V2_KONTROLLE_BESSER` etikettieren. Ihr Original blieb unverändert; der neue Code und seine Tests wurden ohne Byteübernahme geschrieben. Die Schwelle ist eine **vereinbarte Modellregel**, kein Signifikanztest. Selbst ein erfülltes Kriterium belegt ohne vorab gebundenes Studiendesign, unabhängiges Ergebnis, Zeitstruktur und Baseline keinen Informationskanal.

## Konzeptquellen und Herkunft

- Von Juri im Auftrag verlinkter [Chat-Link zur Genesis-/KOSMOS-X9-Idee](https://chatgpt.com/share/6ada12f4-d720-83eb-95f4-840c4e6a64ad): Impuls → Relation → neuer Zustand, `STATE → TRANSITION → FEEDBACK → CONTEXT → LAYER`, zwei Perspektiven auf ein Geschehen. Der Link ist hier ein Ideengeber; Originaldateien, Entstehungszeit und Außenwirkung wurden in diesem Branch nicht verifiziert.
- Lokal geprüfter Konzepttext **REPLAY_MODEL** (SHA-256 `28462f18c84f2814b76c55693c937789070ac8bf66accaeb76c255241e4e8028`): Anregung für sequenzielles, fehlersensitives Replay. Das dort beschriebene Rust-Journal, SHA-256-Verfahren und seine Testbelege sind hier **nicht** übernommen oder reproduziert.
- Lokal geprüfter Konzepttext **Scope-Closure** (SHA-256 `8b36a82a6228079c938c1866bfead32c57058bc83dc174304f8ed9d2da384c41`): Anregung für eine Probe mit zwei im Scope gleichen Zuständen und divergierender Folge. Dessen Enumeration, Zertifikate und Beweise wurden **nicht** übernommen.

Die Implementierung und die Darstellung wurden für diesen Branch neu geschrieben. Es wurden keine Codebytes aus den beiden lokal geprüften Archiven kopiert und keine privaten Pfade oder Inhalte veröffentlicht. Projektleitung und Konzept: **Juri Halveth / HALVETH**, Entwicklung mit KI-Unterstützung. Die Lizenzzuordnung des Repositories gilt: Code, HTML und CSS unter MIT; diese neu geschriebene Erläuterung unter CC BY 4.0. Die oben genannten Konzeptquellen behalten ihre eigenen Rechte.

## Prüfgrenze

Tests belegen nur den deklarierten lokalen Modellvertrag und das konkrete Gegenbeispiel. Die Visualisierung ist eine 2D-Projektion des Graphen. Ein grünes Replay zeigt Konsistenz des implementierten Ablaufs, nicht tatsächliche Beobachtung eines fremden Systems, unveränderliche Historie, kryptografische Echtheit oder Gültigkeit einer allgemeinen Welttheorie.
