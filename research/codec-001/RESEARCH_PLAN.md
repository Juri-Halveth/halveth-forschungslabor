# CODEC-001 · Forschungsplan 1.0.0

Projektleitung und Forschungsrichtung: **Juri Halveth / HALVETH**. Ausarbeitung mit KI-Unterstützung. Lizenz: CC BY 4.0.

Status am 24. Oktober 2026: **Geplante Untersuchungen; keine Ergebnisse dieser Versuche materialisiert.** Der gleichzeitig vorhandene Integritätsprüfer prüft nur das Veröffentlichungsmanifest.

## Gemeinsamer Versuchsvertrag

Ein Softwareversuch soll ausschließlich synthetische Daten in einer isolierten lokalen Ausführung verwenden. Definiert werden Eingabeformat, Implementierung und Version, Anfangszustand, erlaubte Transformation, Vergleichsrelation, erwartetes Ergebnis und Gegenprobe. Es werden keine Netzverbindungen, Shell-Befehle oder realen Transaktionen aus Testdaten ausgeführt.

Vorgeschlagene Zeitfelder: `eventAt`, `receivedAt`, `processedAt`, `presentedAt`, jeweils mit eigener Quelle beziehungsweise als ausdrücklich synthetische Modellzeit. Eine unbekannte Zeit bleibt unbekannt. Quellinstanz, Zustandsversion und Referenzabhängigkeiten bleiben eigene Felder.

## Fünf erhaltene Äste

| ID | Hypothese | Gegenmodell / mögliche Widerlegung | Kleinster nächster Versuch |
| --- | --- | --- | --- |
| C001 | Zwei explizit verschiedene Regeln können dieselbe Eingabe anders strukturieren. | Beide Regeln liefern im gewählten Inputbereich dieselbe Bedeutung. | First- und Last-Value-Regel an harmlosen Farbnamen vergleichen; gleiche Regel als Kontrolle. |
| C002 | Ein gespeicherter Referenzzustand kann die Rekonstruktion neuer Daten verändern. | Der gewählte Decoder ist zustandslos oder verwirft den Referenzzustand vor der Nutzung. | Ein eigener, vollständig deklarierter Delta-Decoder mit zwei benannten Referenzen; keine fremde Codec-Implementierung als implizite Referenz. |
| C003 | Verarbeitungs- und Darstellungsreihenfolge können bei erhaltenen Abhängigkeiten verschieden sein. | Eine benötigte Referenz ist zum Verarbeitungszeitpunkt nicht verfügbar. | Drei synthetische Bildobjekte und ein sichtbarer Abhängigkeitsgraph; fehlende Referenz muss als fehlend erscheinen. |
| C004 | Ein Zustand darf nur innerhalb seines erklärten Gültigkeitsbereichs wiederverwendet werden. | Der Versuch führt einen angeblich fremden Zustand selbst über einen erlaubten Adapter ein. | Zwei eigene Sitzungsinstanzen mit dokumentierter Initialisierung und Rücksetzung; Herkunft jeder Zustandsänderung protokollieren. |
| C005 | Eine physische Wirkung kann durch ein Medium vermittelt werden. | Die beobachtete Wirkung entsteht durch direkten Kontakt oder einen anderen unkontrollierten Einfluss. | Zunächst vorhandene Originalmessungen quellengebunden vergleichen. Eine neue physische Versuchsanordnung benötigt einen eigenen Mess- und Sicherheitsvertrag. |

Alle fünf Äste sind Forschungsfragen. Die Vorrangordnung lautet: zuerst C001/C002 als kleine Softwarevergleiche, danach C003/C004 mit vollständiger Zustandsbindung. C005 bleibt Quellenarbeit, bis ein konkreter fachlich geeigneter Messaufbau vorliegt. Diese Reihenfolge ist umkehrbar und behauptet keine wissenschaftliche Rangordnung.

## Akzeptanz und Gegenprüfung

Eine lokale Abweichung zählt nur für die gebundenen Regeln, Versionen, Eingaben und Zustände. Der Versuch muss mindestens eine Gleichheitskontrolle und eine vorher festgelegte unterscheidende Eingabe enthalten. Abbruch, unbekannte Referenz, ungültige Eingabe und Beobachtungslücke bleiben eigene Ergebnisse.

Für einen späteren Sicherheitsclaim wären zusätzlich gewöhnliche Angreiferkontrolle, ein konkreter geschützter Verbraucher, eine unerlaubte Wirkungsänderung und der aktuelle autorisierte Scope erforderlich. Eine absichtlich verschieden konfigurierte lokale Gegenprobe ersetzt diese Belege nicht.

Der Forschungsplan beansprucht keine erstmalige Entdeckung von Codecs, Referenzbildern, Parser-Differenzen, Zustandsmaschinen oder hydrodynamischen Effekten. Der eigene Beitrag dieser Fassung ist die ausdrücklich zugeschriebene Forschungsrichtung, die Zusammenstellung und die getrennte Prüfplanung.

## Wiederaufnahme

Ein neuer Auftrag kann einen Ast und dessen Datenvertrag auswählen. Erst dann entstehen die betreffende Implementierung und ihre Ergebnisdateien. Die vorliegende Veröffentlichung erzeugt keine automatische Ausführung, kein Modelltraining und keine Berechtigung für fremde Systeme.
