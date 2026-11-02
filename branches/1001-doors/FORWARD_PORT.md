# 1001 Türen: selektive Übernahme

Die Ausgangsbasis dieser Übernahme ist `halveth-forschungslabor/main` bei
`867c07b7935b08945f51b8a33d9bc9f21680c7af`. Die ältere, weiter offene
Entwurfsfassung stammt aus PR #15,
`codex/1001-doors-lab-20261023@a3b83c97b114f1129ed26c4ff4a47e89745bfb24`.
Die 1001-Türen-Dateien wurden auf eine frische Basis übernommen. Andere, seither
hinzugekommene Forschungszweige bleiben auf dem aktuellen Hauptzweig erhalten.
Es wurde kein Gesamtmerge des Entwurfszweigs durchgeführt.

Die Übernahme ergänzt die aktuelle Zweig- und Lernpfadregistrierung, einen
direkten Repository-Einstieg, die explizite Pages-Dateiliste und CI-Prüfungen.
Für die lokale Vorschau wurde der HTTP-Zugriff auf benannte Browserdateien
begrenzt; die Host-Prüfung verweigert Anfragen über fremde Hostnamen. Der
Browser selbst führt keine Hintergrundabfragen aus. Externe Quellenlinks werden
erst durch einen Klick geöffnet. Eigene Forschungsnotizen können ausdrücklich
im Speicher desselben Browser-Ursprungs gesichert oder als JSON exportiert
werden; andere Seiten auf demselben Ursprung teilen technisch diesen Speicher.

`SOURCE_RECEIPT.json`, `NUMBER_RESEARCH_RECEIPT.json` und
`ROLE_JOURNEY_RECEIPT.json` sind historische Belege ihrer jeweils datierten
Fassungen. Ihre Dateidigest-Angaben gelten nicht rückwirkend für die hier
angepassten README-, HTML- und Serverdateien. Der Commit dieser Übernahme
bindet die neue Quellfassung; ein Pages-Build erhält einen eigenen
Datei- und Commitbeleg. Ein erfolgreicher lokaler Build ist noch kein
Nachweis einer öffentlichen Veröffentlichung.

Prüfungen im Repository:

```sh
node branches/1001-doors/generate.mjs --check
node --test branches/1001-doors/*.test.mjs
python -m unittest scripts/test_1001_preview.py
npm test
node scripts/build-learning-hub.mjs --check
```

Die 1001 Einträge sind berechnete Zahlenrecords und keine 1001 laufenden
Agenten. Das 999-Stimmenmodell erzeugt nur ein lokales Modellereignis.
