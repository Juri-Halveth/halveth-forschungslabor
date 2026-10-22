# Drei-Gabel-Lerntunnel für Code und KI

**Kernfrage:** Wenn A und B um dieselbe Entscheidung streiten, welche eigenständige Option C wird durch ihren Gegensatz sichtbar? C ist ein neuer Kandidat, kein automatischer Gewinner.

Dieser Lernpfad verwendet das [interaktive Labor](index.html) und dessen reinen [`evaluateFork`-Evaluator](model.js). Die Namen A, B und C sind Rollen. Das Modell liefert Zustandsnamen und Folgefragen aus deklarierten Eingaben; es beobachtet keine wirklichen Personen oder Systeme.

## Vier Schritte

1. **A und B benennen:** Was ist die konkrete gemeinsame Entscheidung? Welche zwei Vorschläge, Beobachtungen oder Implementierungen stehen im Konflikt? Herkunft und Zeitpunkt je Seite festhalten.
2. **C konstruieren:** Eine dritte, eigenständige Route formulieren. Sie muss als ausführbarer Vorschlag oder prüfbare Frage beschrieben werden, nicht bloß als Mischung oder Umbenennung von A und B.
3. **Reaktionen deklarieren:** Für A und B getrennt `offen`, `kooperiert` oder `blockiert` wählen. Das sind Eingaben für eine Was-wäre-wenn-Simulation, keine Vermutungen über echte Zustimmung.
4. **Gegenprobe und Entscheidung:** Einen Fall suchen, in dem C scheitert. Erst mit einem passenden Test, einer zuständigen Entscheidung und einer beobachteten Folgehandlung darf aus dem Kandidaten eine umgesetzte Lösung werden.

## Drei Anwendungen

| Zweierstreit | Dritter Weg C | Entscheidende Prüfung |
| --- | --- | --- |
| Zwei Programmteile erwarten verschiedene Datenformate. | Ein typisierter Adapter erhält beide Originaleingaben und konvertiert nur nach expliziter Regel. | Roundtrip, Verlustledger und Fehlfälle gegen beide Schnittstellen testen. |
| Zwei Parser geben für dieselben Bytes verschiedene Bedeutungen aus. | Ein unabhängiges Referenz-Orakel bindet Bytes, Version, Grammatik und erwarteten Wert. | Prüfen, welcher Parser vom gebundenen Vertrag abweicht; ein drittes Resultat ist selbst noch kein Beweis. |
| Zwei KI-Antworten widersprechen einander. | Ein dritter Pfad zerlegt beide in überprüfbare Claims und fragt nach der fehlenden Quelle oder Definition. | Claims gegen dieselbe Primärquelle und denselben Scope prüfen; bei fehlender Quelle `UNKNOWN` erhalten. |

## Vorlage für einen KI-Assistenten

```text
Gemeinsame Entscheidung: ...
A: Aussage/Vorschlag ... | Quelle ... | Status OBSERVED/HYPOTHESIS/UNKNOWN
B: Aussage/Vorschlag ... | Quelle ... | Status OBSERVED/HYPOTHESIS/UNKNOWN
C: eigenständiger prüfbarer Weg ...
Reaktion von A auf C: offen/kooperiert/blockiert/UNKNOWN
Reaktion von B auf C: offen/kooperiert/blockiert/UNKNOWN
Gegenbeispiel: ...
Kleinster zulässiger Test: ...
Beobachtetes Ergebnis: ... oder UNKNOWN
Entscheidungsautorität: ... oder UNKNOWN
Nächste Frage: ...
```

Nur die drei bekannten Reaktionswerte dürfen als Eingabe an `evaluateFork` übergeben werden. Bei `UNKNOWN` bleibt die Reaktion außerhalb des Evaluators offen; sie wird nicht heimlich zu `offen` umgeschrieben. Ein Agent kann den Lernpfad als Prompt- oder Workflow-Baustein nutzen. Automatisches Modelltraining, eine externe KI-API und eine produktive Entscheidungsautomatik sind hier nicht implementiert.
