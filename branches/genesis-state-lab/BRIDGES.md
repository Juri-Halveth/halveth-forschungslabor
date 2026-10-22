# GENESIS / Anschlüsse und nächste Prüfungen

Dieses Blatt verbindet das neue Zustandslabor mit **vorhandenen öffentlichen Modulen**. Jede Zeile benennt den gemeinsamen Begriff, die tatsächlich unterschiedliche Funktion und den kleinsten nächsten Test. Die archivierten privaten Originale bleiben an ihren Quellorten; hier stehen nur neu geschriebene Ableitungen und öffentliche Links.

## Der technische Kern

Für einen vollständigen Zustand `s`, einen Impuls `u`, eine definierte Transition `T` und eine grobe Ansicht `P` gilt im Labor:

```text
vollständig:  s ──T(u)──▶ s'
               │           │
             P │           │ P
               ▼           ▼
grob:         m          m'
```

Die Gegenprobe konstruiert `s₁` und `s₂` mit `P(s₁) = P(s₂)`. Bei demselben Impuls gilt danach `P(T(s₁,u)) ≠ P(T(s₂,u))`. Der einzige vorbereitete Unterschied ist ein Gate, das `P` ausblendet. Deshalb kann **diese** grobe Ansicht **diese** Transition nicht allein vorhersagen. Das ist ein konkret ausführbarer Gegenfall im endlichen Modell. Er definiert weder Emergenz im wissenschaftlichen Sinn noch eine Aussage über Atome, Raumzeit oder fremde Systeme.

Für eine wissenschaftliche Makrovariable wären Dynamik, Messoperator, Skala, Nullmodell und Unsicherheit zusätzlich zu binden. Die Forschung zu [dynamischer Unabhängigkeit makroskopischer Prozesse](https://arxiv.org/abs/2106.06511) und zu [Lumping/Informationsverlust bei Markov-Ketten](https://arxiv.org/abs/1212.4375) liefert dafür begriffliche und mathematische Vergleichsmaßstäbe. Unser deterministisches Gate-Beispiel ist keine Reproduktion dieser Arbeiten.

Ein zweiter Literaturabgleich schärft die beiden ausführbaren Fragen des Labors:

| Primärquelle | Relevanter Befund aus der Quelle | Unsere engere Anwendung |
| --- | --- | --- |
| [M. Nilsson Jacobi, *Quotient Manifold Projections and Hierarchical Dynamics* (2006)](https://arxiv.org/abs/math-ph/0606016) | Hierarchische Ebenen werden über Projektionen beschrieben, deren höhere Dynamik mit der unteren verträglich sein muss. | `auditFiniteScope()` prüft eine diskrete, endliche Verträglichkeitsbedingung für vier konkrete Beobachtungsoperatoren. Es konstruiert weder Quotientenmannigfaltigkeiten noch eine allgemeine Hierarchie. |
| [C. H. Bennett, *Logical Reversibility of Computation* (1973)](https://doi.org/10.1147/rd.176.0525) | Eine logisch irreversible Berechnung kann durch Bewahren der sonst verlorenen Information reversibel eingebettet werden; der ursprüngliche Input bleibt dabei erhalten. | `saturationFiberAudit()` zählt die Vorzustände eines vollständigen Nachzustands in einer Fünferfamilie. Das Zwei-Bit-Residuum unterscheidet deren größte Rückfaser. Es ist keine thermodynamische Bilanz und keine Umkehr aller Genesis-Transitionsfolgen. |

Die Quellen belegen die mathematische Forschungsrichtung. Die konkreten Zahlen `100`, `200`, `28/27` bis `200/0` und `ceil(log₂ 3)=2` folgen dagegen aus der offengelegten lokalen Enumeration und ihren Tests, nicht aus diesen Publikationen.

## Anschlussmatrix

| Genesis-Begriff | Bestehende öffentliche Stelle | Exakter Anschluss | Nächster prüfbarer Schritt |
| --- | --- | --- | --- |
| `eventId` gegenüber `contentId` | [Ereigniskern](../fegefeuer-provenance-transducer/) | Beide Modelle trennen Ereignis und Zustand. Sie besitzen verschiedene Records und derzeit keinen gemeinsamen Adapter. | Zwei synthetische Events mit gleichem Nachzustand als getrennte Kandidaten in einer neuen, typisierten Brücke darstellen; keinen historischen Event überschreiben. |
| `P(s)` und verborgene Gate-Differenz | [Ausgrabungsstätte](../documents-excavation/) | Deren `ANÁDYSIS`-Ast fragt nach Schätzer, Skala und Nullmodell. Genesis prüft zusätzlich 100 Zustände und zwei Inputs mit vier Linsen. Das Akteurs-Gate repariert das erste Paar, aber weitere Gegenzeugen bleiben. | Varianz anderer Agenten, weitere Inputs oder eine explizite Scope-Erweiterung prüfen; die endliche Stichmenge nicht zur globalen Kongruenz hochstufen. |
| Offene Erkenntniskante | [Nächster-Schritt-Navigator](../next-action-navigator/) | [`handoff.js`](handoff.js) berechnet aus dem Genesis-Replay einen Forschungsstand mit allen Pflichtachsen. Außenübertragbarkeit, Wirkung und unbekannte Front bleiben `UNKNOWN`. | Den Linsenvergleich als separat gebundenen Beobachtungsoperator in einen künftigen Handoff aufnehmen. Der Browserlink öffnet den Navigator separat und überträgt keine Daten automatisch. |
| Historische Quelle gegenüber öffentlicher Ableitung | [Metadatenprüfung](../bounded-knowledge-reuse-inventory/) | Ein Archivfund kann ein Konzept anregen. Die Metadatenprüfung erteilt aus ihren Angaben keine Publikationsfreigabe. | Einen synthetischen Quellenrecord durch deren Gate schicken und `HOLD`, `DERIVATIVE_ONLY` oder `ELIGIBLE_CANDIDATE` lesen; Originalbytes nicht automatisch importieren. |
| Zwei Perspektiven auf ein Ereignis | [Dialogprotokoll](../binary-inquiry-loop/) | Genesis projiziert einen Event-Record zweimal. Das Dialogprotokoll bindet dagegen zwei deklarierte Seiten und deren Zustimmung. | Testen, ob beide Ansichten dieselbe Event-ID behalten; Zustimmung und unabhängige Zeugen bleiben außerhalb von Genesis. |
| Vorhersage gegenüber späterem Ergebnis | [Beobachtungsspiegel](prediction-audit.js) | Ein Modellkandidat bleibt bei fehlender, passender und abweichender **synthetischer** Kontrollbeobachtung unverändert. Die Evaluation ist ein anderer Record. | Ein externes `Y` erst mit Quelle, Zeitbasis, Messoperator und vorab gebundenem Vergleich anschließen; ohne diese Brücke keine Außenbestätigung. |
| Gepaarte Scorefolgen | [Serienvergleich](paired-score-audit.js) | Eine positive mittlere Differenz bei fehlender Mehrheit ist ein Mischfall, kein Vorsprung der Kontrolle. Vier synthetische Beispiele trennen Original, Kontrolle, unter Schwelle und Mischfall. | Echte Serien benötigen vorab definierten Vergleich, Zeitstruktur, unabhängige Kontrolle und statistische Auswertung; das Statuslabel beweist keinen Informationskanal. |
| Nachprüfbarer Verlauf | [Referenzprüfer](../document-issue-reference-verifier/) | Genesis-Replay rekonstruiert eine In-Memory-Folge aus einem gebundenen Anfang. Der Referenzprüfer hat andere Lebenszyklus-, Principal- und Digest-Fragen. | Exportformat und Quellenautorität getrennt spezifizieren, bevor ein Record zwischen den Modulen wandert. |

Das Labor speichert nur im aktuellen Tab. [Event Sourcing](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing-pattern.html) kennt dauerhafte Event-Speicher, konkurrierende Writer, Versionierung und Wiederherstellung; diese Eigenschaften sind hier noch keine Laufzeitfunktion.

## Zwei Minuszeichen: welcher Operator?

Die Frage „`-T` zweimal“ hat mindestens zwei verschiedene Lesarten:

- Für eine **Zahl** `t` ist `(-t) × (-t) = t²`. Bei einer Zeitgröße wäre die Einheit Zeit².
- Für einen **Negationsoperator** `N(x) = -x` über derselben passenden Domäne ist `N(N(x)) = x`. Das ist eine Selbstinvolution.

Multiplikation von Werten und Komposition von Operatoren sind getrennte Rechnungen. Für den gesamten Genesis-Zustandsraum gibt es keinen definierten Operator `-T` und keine inverse Transition; die Sättigungsregel löscht unterscheidende Vorzustandsinformation. Der [enge Rückweg](preimage-audit.js) zeigt für fünf fixierte Vorzustände, wie ein Zwei-Bit-Residuum die verlorene Unterscheidung innerhalb genau dieser Familie trägt. Domäne, Fixierungen und Gegenbeispiele gehören zum Vertrag; daraus entsteht kein globaler Rückweg.

## Status und Rechte

Stand: 22. Oktober 2026, `MODEL_BRIDGE_CANDIDATE`. Die verlinkten Module sind öffentliche Quellstände dieses Repositories; ihre individuelle Lizenz- und Herkunftszuordnung steht in [`LICENSES.md`](../../LICENSES.md) und [`SOURCE_PROVENANCE.json`](../../SOURCE_PROVENANCE.json). Aus den privaten Desktop- und Root-Archiven wurde hier kein Code und kein Bild kopiert. Der [geteilte Genesis-Chat](https://chatgpt.com/share/6ada12f4-d720-83eb-95f4-840c4e6a64ad) ist ein vom Nutzer genannter Konzeptanker, keine unabhängig verifizierte Originaldatei.
