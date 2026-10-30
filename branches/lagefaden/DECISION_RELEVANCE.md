# Entscheidungsrelevante Lücken · drei Beispiel-Prüfprofile

Parent: `0e62a9181cd4b294e960d554ad4290c78bc6e051`.
Vertrag: `halveth.lagefaden.decision-relevance.v1`.
Die bestehende W-Coverage v1 und die drei Snapshotbytes bleiben erhalten.
Dieser ergänzende Layer beantwortet: **Welche offenen Teilfragen betreffen
die benötigten Eingaben einer ausdrücklich gewählten Prüffrage?**

## Drei deklarierte Profile

| Profil | Benötigte Facetten | Ergebnis mit den gespeicherten Beispielen |
| --- | --- | --- |
| `CATALOG_COORDINATES` | Koordinaten aus `DATA`, Katalog-/Geometriezeit aus `DATA` oder `DERIVED`, Abrufreceipts aus `RECEIPT` | EONET: Eingaben vorhanden. USGS/CEMS: Koordinaten offen. Bei CEMS bleibt zusätzlich eine Zeitinterpretation prüfbar. |
| `CATALOG_REVISIONS` | Katalogkennung aus `DATA`, Änderungszeit aus `DATA` oder `DERIVED`, Abrufzeit aus `RECEIPT` | USGS: Eingaben vorhanden. EONET: Änderungszeit offen. CEMS: UTC-Interpretation/abweichende Zeitstände sichtbar, Ableitung prüfen. |
| `PHYSICAL_INDEPENDENCE` | Sensoridentität aus `DATA`, authentisierte Messkette aus `DATA` oder `RECEIPT`, unabhängige Messzahl aus `DATA` oder `DERIVED` | Alle drei Fälle: drei erforderliche Herkunftsfragen offen. Darstellungs- und Referenzzahlen schließen diese Lücken nicht. |

Die Profile sind `LOCAL_DESIGN_PROFILE`. Anforderungen und akzeptierte
Antwortbasis stehen im Code, in der Oberfläche und im Export. Sie sind
Beispiele für eine Datenprüfung; eine zuständige Nutzergruppe kann andere
Anforderungen für ihren realen Ablauf definieren. Ein neues Profil braucht
eine eigene gebundene Definition und Gegenbeispiele. Der Layer führt keine
betriebliche Entscheidung aus.

## Zustände statt Gesamtscore

`INPUT_REQUIREMENTS_BOUND`: alle benötigten Eingaben tragen im Profil
akzeptierte direkte Daten oder Receipts. `REVIEW_DERIVED_INPUTS`: mindestens
eine benötigte Antwort liegt als akzeptierte Ableitung vor. Ihre Annahmen
bleiben prüfbar. `REVIEW_OPEN_REQUIREMENTS`: mindestens eine benötigte Antwort
fehlt oder besitzt eine im Profil nicht akzeptierte Basis. `PENDING` und
`UNAVAILABLE` bleiben Zustände fehlender Quellenauswertung.

Eine in einem Profil nicht benötigte Facette bleibt in der Coverage und im
Lückeninventar erhalten. Sie wird weder global irrelevant noch ausreichend
beantwortet. Es gibt keine Gesamtnote und keine Abdeckungsquote. Die Anzahl
offener Pflichteingaben bezieht sich ausschließlich auf die drei benannten
Anforderungen des jeweiligen Profils. Wiederholtes Auftreten einer Facette
in mehreren W-Zeilen wird pro Quelle einmal gezählt.

## Bedingte Sensitivität

Für jede offene Pflichteingabe nennt der Layer die übrigen offenen
Pflichteingaben unter derselben Regel. „Letzte offene Pflichtfrage“ ist eine
logische Eigenschaft dieses endlichen Profils. Eine Ergänzung wird dabei nur
als Bedingung beschrieben. Es werden weder Quelldaten ergänzt noch Beweise
erfunden oder Außenwirkungen erzeugt. Bereits vorhandene Ableitungen bleiben
prüfbar. Ein belegter Produktnutzen oder tatsächlicher Einfluss auf menschliche
Entscheidungen braucht einen eigenen Nutzertest.

## Quellenbindung und Übergabe

Die Auswertung erfolgt spaltenweise und übernimmt nur die Facetten des
jeweiligen Quell-/Fallpaars. Koordinaten von EONET erfüllen keine Anforderung
des anderen USGS- oder CEMS-Falls. Der Eingang ist die lokal erzeugte
Coverage-Matrix; es gibt keine Importfunktion für fremde Entscheidungsdaten.
Inkonsistente wiederholte Facetten und Fallwechsel werden zurückgewiesen.
Eine Belegbasis ist innerhalb dieses Vertrags eine Angabe aus der
vorhergehenden Snapshotauswertung, keine neue Authentisierung der Außenwelt.

Der bestehende Coverage-Download bleibt im Vertrag unverändert. Der zusätzliche
Download `halveth.lagefaden.review-export.v1` enthält Coverage und ausgewähltes
Prüfprofil zusammen, einschließlich Anforderungen, Belegbasis, Quellen-/Fall-IDs,
Snapshotreceipts und bedingter Lückensensitivität.

## Nachfolger-Prüfstand

| Software-Achse | Zustand in diesem Nachfolger | Beleg/Front |
| --- | --- | --- |
| `USER_OUTCOME` | `STABLE` | Benötigte Eingaben eines gewählten Beispiels sichtbar machen; realer Nutzen bleibt eigene Front. |
| `INTERFACE` | `MATERIAL_CANDIDATE` | Auswahl, Quellkarten, benötigte Zellen und eigenständiger Export. |
| `STATE_DATA` | `MATERIAL_CANDIDATE` | Profile, Antwortbasis, Fallbindung und bedingte Restanforderungen. |
| `INTEGRATION` | `STABLE` | Vorhandene drei Snapshotbytes und Coverage v1 bleiben die Eingabe. |
| `FAILURE_RECOVERY` | `STABLE` | Ausfall bleibt ungeprüfte Quelle; keine erfundene Lückensensitivität. |
| `SECURITY_PRIVACY` | `STABLE` | Nur die bestehenden minimierten öffentlichen Fälle, keine Fremdimporte oder Aktionsschnittstelle. |
| `ACCESSIBILITY` | `STABLE` | Native Auswahl, Tastatur, Mobilansicht und lesbare Zustände im Browser erneut geprüft. |
| `DELIVERY_OBSERVABILITY` | `STABLE` | Explizite Publikationsdateiliste, lokale Gegenbeispiele und bestehender Draft-PR. |

Der Relevanzstatus verändert keine Quellantwort.

Die beiden materiellen Kandidaten `STATE_DATA` und `INTERFACE` besitzen den
gemeinsamen Bezug „benötigte Eingaben pro deklarierter Prüffrage“. Der
Paarvergleich priorisiert den Datenvertrag vor seiner Darstellung: zuerst
Anforderung/Basis/Fallbindung, danach Auswahl, Karten und Zellmarkierung.
Vertikale Vorschau des Vertrags: Anforderung → gebundene Facette → offene
Restanforderungen → endliche bedingte Sensitivität. Vorschau der Oberfläche:
Profilwahl → Quellkarte → Belegstelle → eigenständiger Export. Offene Front:
ein realer Nutzerworkflow und ein Vergleich mit einer einfachen Checkliste.
Die Priorität für den ersten Bauabschnitt lautet STATE_DATA, danach INTERFACE;
dies ist eine Suchheuristik auf Basis ihrer Abhängigkeit, kein Wirkungsbeleg.
