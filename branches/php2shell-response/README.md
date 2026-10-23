# PHP2Shell / HALVETH: Quellen und Betreiberhilfe

**Stand:** 23. Oktober 2026. **Autor/Projekt:** Juri Janovski / HALVETH, mit KI-Unterstützung. Dieser Branch enthält eine quellengebundene Ersthilfe zu [CVE-2026-109618](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) und [CVE-2026-109619](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp). Die PHP-Kernkorrekturen stammen vom PHP-Projekt; HALVETH beansprucht ihre Entdeckung oder Entwicklung nicht.

## Einstieg

- [Ein-Seiten-Ansicht](index.html): Mechanismus, Patchstand und sechs Betreiberhandlungen.
- [Technisches Briefing](TECHNICAL_BRIEF.md): Patchgrenzen, Worker-Nachweis, Rückblick und getrennte Claim-Decken.
- [Quellenprüfung](SOURCE_AUDIT.md): Aussagen aus einer eingebrachten Nachricht gegen Primärquellen geprüft.
- [Passives Inventarwerkzeug](inventory_triage.py): sortiert **deklarierte** PHP-Versionen aus einer Betreiber-CSV; keine Hostanfragen oder Exploitversuche.

```sh
python branches/php2shell-response/inventory_triage.py branches/php2shell-response/sample_inventory.csv
python -m unittest discover -s branches/php2shell-response -p 'test_*.py' -v
```

Die Beispieldaten sind synthetisch. Ein Klassifikatorstatus belegt weder die tatsächlich aktive Webruntime noch einen Worker-Neustart oder das Ausbleiben früherer Angriffe. Upstream nennt 8.2.35, 8.3.36, 8.4.27 und 8.5.12 als erste korrigierte Versionen; Vendor-Backports benötigen eigene Belege. [PHP-Sicherheitsmeldung](https://www.php.net/archive/2026.php).

**Herkunft und Rechte:** Die Erläuterungen, HTML-Ansicht, Python-Dateien und synthetischen CSV-Daten wurden für diesen Forschungsstand neu zusammengestellt. Externe Quellen bleiben verlinkt und behalten ihre eigenen Rechte. Für die im Repository liegenden Dateien gelten die dateitypbezogenen Bedingungen aus [LICENSES.md](../../LICENSES.md); der historische `SOURCE_PROVENANCE.json`-Transfer bezieht sich nicht auf diesen neu erstellten Branch.
