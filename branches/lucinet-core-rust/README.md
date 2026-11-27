# LUCINET Core / Rust-Quellslice

Dieser Ordner ist eine **eigenständig testbare Auswahl** aus dem lokalen
LUCINET-Git-Commit `5b7956f40f2fde241a20f9705f1d4f7c1fbc9920`.
Die 19 Dateien unter `src/` und `tests/` wurden bytegleich übernommen.
`Cargo.toml` wurde für diesen Standalone-Build neu gefasst, weil das lokale
Gesamtprojekt weitere Crates über benachbarte Ordner einbindet. Die ursprüngliche
[MIT-Lizenz](LICENSE) und ihr Copyright-Hinweis sind erhalten.

## Was der Slice modelliert

`SourceSnapshot`, `ReferenceFrame`, Projektionen, RelationGraphen, typisierte
Transformationen und claimgebundene Evidenzzustände. Die Crate enthält keine
Datei-, Netzwerk-, Prozess-, Geräte-, UI- oder Installationsadapter. Sie ist
der semantische Kern, kein vollständiger LUCINET-Installer.

## Lokal prüfen

Voraussetzung: Rust 1.85 oder neuer.
Der CI-Lauf ist für reproduzierbare Format- und Clippy-Prüfungen auf Rust
1.97.0 festgelegt; neue Clippy-Versionen können zusätzliche Lints einführen.

```sh
cargo test --locked --manifest-path branches/lucinet-core-rust/Cargo.toml
```

`SOURCE_RECEIPT.json` führt Quellcommit, Dateigrößen und SHA-256-Digests der
übernommenen Dateien. `source_receipt.test.mjs` prüft, dass die hier liegenden
Bytes dazu passen. Ein Digest belegt die vorliegende Kopie; das bisher nur
lokale Quellrepo kann ein externer Leser nicht unabhängig aus dem Commitnamen
abrufen. Cargo-Tests belegen die kodierten Verträge, keine vollständige
Produktabnahme oder physische Wirkung.

Der [lokale Test-Receipt vom 22. Oktober 2026](TEST_RECEIPT_2026-10-22.md)
bindet den ersten Standalone-Lauf. Der GitHub-Workflow wiederholt Format,
Tests und Clippy auf dem PR-Branch.

Projektleitung: Juri Halveth / HALVETH. Der übernommene Lizenztext nennt
HALVETH / LUCINET contributors; Entwicklung mit KI-Unterstützung.
