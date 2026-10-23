# PHP2Shell – technische Erstprüfung und Abhilfe

**Beobachtet am:** 2026-10-23. **Geltungsbereich:** öffentlich dokumentierte PHP-Kernlücken und ein passiver Betreiber-Workflow. **Kein Asset-Befund:** Aus dieser Akte folgt keine Aussage über eine fremde oder lokale Webserver-Installation.

## 1. Mechanismus: zwei verschiedene Fehler

| Referent | Quellgebundener Mechanismus | Relevante Grenze |
| --- | --- | --- |
| [CVE-2026-109618](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) | Beim Erreichen einer Speichergrenze kann PHP die Anfrage verlassen, während interne Daten nur teilweise initialisiert sind. Die Bereinigung kann diese Daten als gültig behandeln. | Request-Initialisierung → Speicherfehler → Cleanup |
| [CVE-2026-109619](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) | Ein wiederverwendeter Worker kann einen Verweis auf bereits freigegebenen, einer früheren Anfrage gehörenden Speicher behalten. Eine spätere Anfrage kann ihn vor der normalen Initialisierung verwenden. | Request A → Worker-Zustand → Request B |

Die zweite Kette erklärt Juris „zwischen zwei Authentifikationen“-Intuition als **Zustandsübertritt zwischen Anfragen**. Der aktuelle Beleg beschreibt keine Person oder Netzwerkkomponente, die TLS-Verkehr abhört oder sich als Vermittler zwischen Logins setzt. Die Vulnerability liegt im PHP-Kern; ein Exploit wurde für Apache `mod_php` vor Anwendungscode demonstriert. Andere SAPIs können betroffen sein, aber Demonstrationsgrad und Bedingungen unterscheiden sich. [PHP-Ankündigung](https://www.php.net/archive/2026.php), [PHP Foundation](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/).

**Was der PHP-Patch im Kern ändert:** Für CVE-2026-109618 ersetzt PHP den gefährlichen sofortigen OOM-Ausstieg per `longjmp()` durch einen verzögerten Soft-OOM an einem sicheren Ausführungspunkt bzw. einen harten Prozessabbruch an einer höheren Schwelle. Für CVE-2026-109619 setzt der vollständige Patch weiteren anfragegebundenen globalen Zustand zurück, bevor eine folgende Anfrage ihn früh verwenden kann. Das sind Änderungen am PHP-Runtime-Code, keine Einstellung einer Login-Anwendung. [OOM-Advisory](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), [State-Advisory](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp).

## 2. Korrigierte Upstream-Versionen

| PHP-Zweig | Erste korrigierte Upstream-Version |
| --- | ---: |
| 8.2 | 8.2.35 |
| 8.3 | 8.3.36 |
| 8.4 | 8.4.27 |
| 8.5 | 8.5.12 |

PHP 8.1 und ältere Zweige bekommen keine regulären PHP-Projektupdates. Distributionen oder LTS-Anbieter können Sicherheitskorrekturen auf ältere Versionsnummern zurückportieren; dafür benötigt der Betreiber einen **konkreten Paket-/Advisory-Beleg**, nicht nur eine Versionszeichenfolge. PHP hat zusätzlich minimale Source-Backports für 7.4, 8.0 und 8.1 bereitgestellt; das ist keine allgemeine Wartungszusage für diese Zweige. [PHP-Ankündigung](https://www.php.net/archive/2026.php), [AWS-Bulletin](https://aws.amazon.com/security/security-bulletins/2026-143-aws/).

## 3. Betreiberablauf: von „Update installiert“ zu „aktive Runtime geprüft“

1. **Abdeckung binden.** Für jede eigene Webanwendung den Betreiber, Host-/Container- oder Hosting-Dienst, die aktive PHP-SAPI (`mod_php`, FPM, CGI, FrankenPHP, LiteSpeed), PHP-Build/Paketquelle, Internet-Erreichbarkeit und verantwortliche Person eintragen. `php -v` einer Shell kann eine andere CLI-Installation zeigen als der Webdienst.
2. **Patchpfad wählen.** Die passende korrigierte Upstream-Version oder den belegten Vendor-Backport installieren. Ein CMS-/Plugin-Update allein adressiert diese Runtime-Lücken nicht. [PHP](https://www.php.net/archive/2026.php), [Cloudflare](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/).
3. **Worker neu starten.** Den betroffenen Web-/PHP-Dienst bzw. das Container-Image so neu starten, dass kein alter Worker weiterläuft. Paketinstallation und laufender Prozess sind verschiedene Zustände. Beim Ausfallrisiko den Wartungs- und Rückrollpfad der jeweiligen Organisation nutzen.
4. **Aktiven Stand nachweisen.** Direkt an der eigenen Laufzeit die neue Build-/Paketkennung und den Startzeitpunkt des laufenden Dienstes prüfen, möglichst über interne Administrationswege. Keine öffentlich erreichbare `phpinfo()`-Seite als Nachweis liegen lassen. Bei Backports Advisory-ID und Paketbuild beifügen.
5. **Benigne Funktion prüfen.** Login, Session, Upload, Formular, Fehlerpfad und zentrale Anwendungspfade innerhalb des autorisierten Systems regressionsprüfen. Das zeigt Funktionsfähigkeit, nicht automatisch Sicherheitsvollständigkeit.
6. **Vergangenheit gesondert prüfen.** AWS meldet einen Exploit-Versuch gegen eigene Honeypots am 17. Oktober 2026, vier Tage vor Veröffentlichung. Betreiber sollten für ihre eigene Infrastruktur erhaltene Logs/EDR/Dateiänderungen ab diesem Datum bis zur nachgewiesenen Patchaktivierung sichten. Ein Versuch im Internet ist kein Beleg eines eigenen Einbruchs; fehlende Logtreffer sind kein Beweis, dass nichts geschah. [AWS Threat Intelligence](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/).

**Abnahme-Receipt pro System:** `asset_id`, `owner`, `observedAt`, `runtime/SAPI`, `package/image digest`, `vendor advisory`, `installedAt`, `workerRestartAt`, `activeRuntimeObservedAt`, `functionalCheck`, `telemetryCoverage`, `gaps`, `reviewer`. Geheime Hostnamen, Tokens und Rohlogs bleiben intern.

## 4. Falls ein Update nicht sofort möglich ist

PHP benennt nur **unvollständige** Überbrückungen: `session.upload_progress.enabled=0` administrativ setzen und alle Worker neu starten; bei PHP 8.5 zusätzlich `fatal_error_backtraces=0` für einen bestätigten Pfad. Für die OOM-Lücke nennt PHP `memory_limit=-1` plus vorgelagerte Größen- und Ressourcenbegrenzungen – das kann Verfügbarkeit und Speicherverbrauch verändern und gehört in einen fachlich geprüften Notfallplan. WAF-Regeln können bestimmte bekannte HTTP-Muster abfangen, sehen aber interne PHP-Worker-Zustände nicht. Vor Blockierung legitime Uploads testen. [PHP-Ankündigung](https://www.php.net/archive/2026.php), [AWS-WAF-Anleitung](https://aws.amazon.com/blogs/security/using-aws-waf-to-apply-mitigations-for-php2shell-rce-vulnerabilities-cve-2026-109618-and-cve-2026-109619/).

Am **23. Oktober** veröffentlichte PHP zusätzlich einen Hinweis zu [CVE-2026-115560](https://www.php.net/archive/2026.php): ein unwahrscheinlicher weiterer Session-Upload-Progress-Pfad bei einer bestimmten Kombination aus `session.serialize_handler`-Konfiguration, Laufzeitwechsel per `ini_set()` vor `session_start()` und aktivem Upload-Progress. PHP empfiehlt für diese Konstellation `session.upload_progress.enabled=0` bis zur nächsten Fehlerkorrektur. Diese neue Information ist bei einer Abnahme vom 21./22. Oktober zu berücksichtigen.

## 5. Was HALVETH hier tatsächlich verbessert

Die bekannten Upstream-Patches **reparieren den PHP-Kern**. Das lokale HALVETH-Angebot wäre eine für Behörden und Unternehmen lesbare **Zustands- und Nachweiskette**:

```text
Inventar der eigenen Runtime
    → passende Patchquelle
    → installierter Build
    → neu gestarteter Worker
    → aktive Runtime beobachtet
    → Funktion geprüft
    → historische Telemetrie gesichtet
    → offene Beleglücken benannt
```

Jeder Pfeil ist eine **Prüfhandlung**, kein automatischer Kausalbeweis. Ein bloßer Dateifund auf GitHub identifiziert keine laufende Serverversion; ein Paketbeleg beweist keinen Neustart; ein Neustart beweist keine vollständige Untersuchung früherer Aktivität. Der beiliegende CSV-Klassifikator sortiert nur deklarierte Versionsstände. Sein Ergebnis kann eine technische Abnahme vorbereiten, aber nicht ersetzen.

**Forschungsast nach der Notfallphase:** In PHP-Erweiterungen und wiederverwendeten Workern kann man in einer eigenen isolierten Testumgebung systematisch prüfen, ob anfragegebundene Referenzen vor Speicherfreigabe abgeräumt werden. Das wäre eine eigene, versionsgebundene Präventionsforschung mit definiertem Test-Orakel. Aus dem bloßen Auftreten eines ähnlichen Musters folgt noch keine neue Sicherheitslücke oder Bounty.

## 6. Angebotsskizze für einen bezahlten Pilot

**Leistungsgegenstand:** Ein ausdrücklich beauftragtes System, nur passive Inventur und vom Betreiber freigegebene Patch-/Verifikationsschritte. **Ergebnis:** ein verständlicher Status pro Laufzeit mit Quellen, Zeiten, Zuständigkeit und offenen Fragen. **Vergütung:** für diese Arbeitsleistung vertraglich vereinbaren; nicht als behauptete Prämie für die bereits veröffentlichten CVEs. **Nächster sinnvoller Pilot:** eine eigene oder schriftlich beauftragte PHP-Webanwendung, mit Vorher-/Nachher-Receipt und klarer Abnahme.

Kein Massen-Scan, kein unaufgeforderter Exploit-Test und keine automatische Nachricht an Behörden oder Dritte.
