# Quellen und datierte Einordnung

Geprüfter Quellenstand: 24. Oktober 2026. Die ursprüngliche Nutzerzusammenstellung bleibt eine getrennte private Quelle. Die Implementierung und die folgenden lokalen Kontrollen sind neu geschrieben.

| Primärquelle | Gebundener Inhalt |
|---|---|
| [Node.js: Oktober-Sicherheitsupdates](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) | Zehn CVEs, jeweilige Releasezweige und Vendor-Einstufungen; Mechanismen für DNS, TLS, Brotli, HTTP, Snapshots, ZIP und Berechtigungen. |
| [Node.js 24.22.1](https://nodejs.org/en/blog/release/v24.22.1) | Datierter Sicherheitsrelease und direkt zurückportierter Brotli-Fix. |
| [Google Brotli 1.2.1](https://github.com/google/brotli/releases/tag/v1.2.1) | Sicherheitsrelease für CVE-2026-111497. |
| [Bun GHSA-663w-cv8g-jj2p](https://github.com/oven-sh/bun/security/advisories/GHSA-663w-cv8g-jj2p) | Bun 1.0.21 bis vor 1.4.4; Brotli-Bereiche und korrigierte Backportlinien 1.0.10, 1.1.1 und 1.2.1. |
| [PortSwigger: Target Scope](https://portswigger.net/burp/documentation/desktop/getting-started/setting-target-scope) | Offizieller Einstieg zur Begrenzung eines Burp-Projekts auf den eigenen Testbereich. |
| [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/stable/) | Methodischer Referenzrahmen für die weitere autorisierte Prüfung. |

Der Katalog behauptet ausschließlich den aufgeführten Patchstand. Ein höherer Versionsstring beweist keine authentische Binärdatei und keine sichere Anwendung. Ein alter Stand benennt Wartungsbedarf; die tatsächliche Erreichbarkeit einer betroffenen Funktion ist ein gesonderter Prüfpfad.

Die Decoder- und Budgetmodelle illustrieren Prüfinvarianten. Sie reproduzieren weder einen nativen Speicherfehler noch einen DDoS. Der HTTP-Vergleich beobachtet eine absichtlich erzeugte Subjektgrenze in derselben Hostumgebung; er beweist keinen Übergang zu anderen Geräten oder Produkten.

Quellen werden verlinkt, nicht als Exploitkorpus gespiegelt. Kein neuer unabhängiger Produktsicherheitsfund und keine externe Einreichung werden aus diesem Modul abgeleitet.
