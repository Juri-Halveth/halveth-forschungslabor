# HALVETH – Vom Beispiel zum Regressionswissen

Projektleitung: Juri · Projekt HALVETH · Entwicklung mit KI-Unterstützung.

Der öffentliche Einstieg unter `wissen/` verknüpft alle aktuellen Modul- und
Forschungsordner dieses Repositorys mit konkreten Quellen und Tests. Sein
Umfang ist dieses Repository. Andere Projekte werden darüber nicht als geprüft
ausgegeben.

## Ein neuer Fall

1. Frage, Modellversion und erwartete Eigenschaft benennen.
2. Eine Eingabe und ein unterscheidendes Gegenbeispiel angeben.
3. Beobachtetes Ergebnis und Erwartung getrennt festhalten.
4. Einen Test ergänzen, der die gebrochene Eigenschaft tatsächlich erkennt.
5. Den Änderungsvorschlag prüfen und die vorhandenen Vergleiche wiederholen.

```sh
npm test
node scripts/build-learning-hub.mjs --check
```

Die Quelle des Verzeichnisses liegt in `catalog/learning-paths.json`.
`scripts/build-learning-hub.mjs --write` erzeugt daraus die lesbare Übersicht,
die Dateibindungen und das ENDECK-Wissensregister. Die Prüfung schlägt fehl,
wenn eine verknüpfte Quelle fehlt, sich ihre Bytes geändert haben oder ein
aktueller Modulordner keinen Einstieg besitzt. Historische Herkunftsregister
bleiben davon getrennt erhalten.

Bei einem neuen Fund sollte die Meldung die geöffnete Seite, Schritte,
Erwartung, tatsächliches Verhalten und den Quellstand aus `release.json`
enthalten. Die Issue-Vorlage bereitet diese Felder vor; sie sendet selbst keine
Meldung und übernimmt keine Browserdaten.

## Persönlicher Lernstand

ENDECK bietet vier kleine Aufgaben. Nur eine richtige Antwort ergänzt den
zugehörigen lokalen Lernstand; Wiederholungen erhöhen die Zahl nicht.
Der Stand wird im Browser gespeichert und kann dort zurückgesetzt werden.
Er ist eine Lernhilfe und kein Prüfungszertifikat. Eine ungültige gespeicherte
Fassung wird sichtbar verworfen. Der persönliche Stand wird nicht an GitHub
übertragen.

Das wachsende Projektwissen besteht aus versionierten Regeln, Beispielen und
Tests. Ein selbstlernendes KI-Modell oder eine Änderung von Modellgewichten
wird hierdurch nicht implementiert.
