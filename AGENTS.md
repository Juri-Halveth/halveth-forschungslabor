# Arbeitsregeln

Zuerst README, SOURCE_PROVENANCE.json und die betroffenen Module lesen.
Quellübernahmen, Modellannahmen und beobachtete Laufzeitergebnisse trennen.
`npm test` prüft die mitgelieferten lokalen Verträge. Modelltests sind keine
externen Sicherheitsnachweise. Keine Netztests gegen fremde Ziele, Secrets oder privaten Belege.
Der ausdrücklich beauftragte `security-workbench` darf ausschließlich seine
eigenen kurzlebigen HTTP-Fixtures auf `127.0.0.1` mit festen synthetischen
Konten prüfen. Host, Port und Netzlast fremder Ziele sind keine Parameter.
Änderungen in kleinen nachvollziehbaren Branches führen. Bestehende Lizenzen
und Attribution erhalten. Veröffentlichung benötigt einen Benutzerauftrag.

Namenszuordnung: Die Person heißt Juri; HALVETH ist der Projektname.
`IDENTITY.md` bindet die aktuelle Zuschreibung. Die GitHub-Kennung
`Juri-Halveth` bleibt ein technischer Identifikator.
