# Primärquellen und Übertragungsgrenzen

Stand der Quellenarbeit: **2026-10-25**. Die URL-Liste steht maschinenlesbar in
`catalog.mjs`. Dieses Dokument ist eine neue Zusammenfassung; fremde Reports
und Artikel werden verlinkt und behalten ihre Rechte.

## Veröffentlichte Erfolgsanalysen

| Fall | Primärbeleg | Übertragbare Prüffrage |
| --- | --- | --- |
| GitLab, CVE-2023-7028 | [HackerOne #2293343](https://hackerone.com/reports/2293343), [GitLab-Sicherheitsrelease](https://docs.gitlab.com/releases/patches/patch-release-gitlab-16-7-2-released/) | Bleibt der tatsächliche Reset-Empfänger an die verifizierte Identität gebunden? |
| Valve / Smart2Pay | [HackerOne #1295844](https://hackerone.com/reports/1295844) | Erhält der signierte Input Feldgrenzen und die spätere Zahlungsbedeutung? |
| Polygon Consensus Bypass | [Immunefi-Bugfix-Analyse](https://immunefi.com/blog/bug-fix-reviews/polygon-consensus-bypass-bugfix-review/) | Können zwei Lifecycle-Pfade dieselbe Stimmkraftänderung doppelt verbuchen? |
| Wormhole Uninitialized Proxy | [Immunefi-Bugfix-Analyse](https://immunefi.com/blog/bug-fix-reviews/wormhole-uninitialized-proxy-bugfix-review/), [EIP-6780](https://eips.ethereum.org/EIPS/eip-6780) | Ist auch die Implementierung gegen unerlaubte Initialisierung geschützt, und welche Fork-Regeln gelten? |

Der Wormhole-Whitehat-Fall vom Februar 2022 ist ein anderer Vorgang als der
öffentliche Wormhole-Diebstahl vom 2. Februar 2022. Die hier besprochene
Prämie gehört zum verantwortungsvoll gemeldeten Initialisierungsproblem.

## PHP und vorhandener Code

Die [PHP-Meldungen vom 21. und 23. Oktober 2026](https://www.php.net/archive/2026.php)
und die [PHP Foundation](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/)
beschreiben CVE-2026-109618 und CVE-2026-109619. Das Modell in diesem Hub zeigt
nur einen abstrakten Request-Zustand. Es ist keine Reproduktion von nativer
Speicherbeschädigung oder Remote-Code-Ausführung. Verbindliche Patchhinweise
werden aus der jeweils aktuellen Herstellerquelle gelesen.

Der [HALVETH-TRON-Forschungsfork](https://github.com/Juri-Halveth/halveth-tron-security-lab)
bleibt mit seiner Upstream-Herkunft verknüpft. Die öffentliche Existenz des Forks
belegt keinen externen Sicherheitsimpact. Vertrauliche Reports werden aus
diesem Hub weder referenziert noch abgerufen.

## Plattformregeln

- [HackerOne: Reports einreichen](https://docs.hackerone.com/en/articles/8473994-submitting-reports)
- [HackerOne: Disclosure Guidelines](https://www.hackerone.com/terms/disclosure-guidelines)
- [HackerOne: Safe Harbor](https://docs.hackerone.com/en/articles/8494502-safe-harbor-overview-faq)
- [Immunefi: aktuelle Regeln](https://immunefi.com/rules/)
- [Immunefi: vollständiger Report und lokaler PoC](https://immunefi.com/blog/security-guides/how-to-submit-bug-reports-that-get-paid/)

Der frühere Zendesk-Link zu Immunefis PoC-Regeln leitete beim Abruf auf ein
Loginformular. Er wird deshalb nicht als gelesener technischer Regeltext
verwendet. Die offen erreichbaren Regeln und die konkrete Programmpolicy sind
separate Quellen. Angaben zu Scope, Erfolg, Severity, Vergütung und
Publikationsfreigabe bleiben voneinander getrennt.

Werkzeughinweise verweisen auf die jeweilige offizielle Dokumentation. Die
Einträge sind keine Aussage darüber, welche Programme auf einem bestimmten
Rechner installiert oder gegen einen bestimmten Anbieter autorisiert sind.
