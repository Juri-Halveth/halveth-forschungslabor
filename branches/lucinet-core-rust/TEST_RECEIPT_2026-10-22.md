# LUCINET Core / lokaler Standalone-Test

**Datum:** 22. Oktober 2026.

**Quelle:** lokaler LUCINET-Git-Commit
`5b7956f40f2fde241a20f9705f1d4f7c1fbc9920`.

**Auswahl:** 19 bytegleich kopierte Rust-Quell- und Testdateien.

**Anpassung:** neues eigenständiges `Cargo.toml` und daraus erzeugtes
`Cargo.lock`; Original-MIT-Lizenz erhalten.

| Prüfung | Ergebnis |
| --- | --- |
| `cargo test --locked --manifest-path branches/lucinet-core-rust/Cargo.toml` | 60 Unit- und 10 Integrationstests bestanden; 0 fehlgeschlagen |
| `cargo fmt --check --manifest-path branches/lucinet-core-rust/Cargo.toml` | bestanden |
| `cargo clippy --locked --manifest-path branches/lucinet-core-rust/Cargo.toml --all-targets -- -D warnings` | bestanden |
| Repository-`npm test` | 120 Node- und 49 Python-Tests bestanden, einschließlich Quellreceipt-Prüfung |

**Lokale Toolchain:** cargo 1.97.0; rustc 1.97.0. Die drei vollständigen
lokalen Terminal-Logs bleiben im privaten Arbeitsatlas, weil die Cargo-Ausgabe
absolute lokale Buildpfade enthält. Ihre SHA-256-Digests sind:

- Cargo-Testlog: `2d1a939247deac62d9a7114a437b7a590370a4209314678e67465dd658b74214`
- Clippy-Log: `b51a6a0731e8a58bdc3e049b14b6297fccfc6bc5159ad6bfbf2e654a7b88e1d5`
- Repository-Testlog: `18c7372f19c43e0fb41b917e98cb4aec41013b8a12382f772c492de4548fc021`

Der erste GitHub-Workflow verwendete am 22. Oktober 2026 `stable` (1.99.0):
Format und 70 Tests bestanden, aber eine in 1.99 neu hinzugekommene
Clippy-Regel beanstandete eine unveränderte Test-Assertion. Die CI-Toolchain
wurde daraufhin auf den lokal vollständig geprüften Stand 1.97.0 gebunden.

Das ist ein lokaler Code- und Testbeleg für diesen Slice. Der gesamte
LUCINET-Installer, Browseradapter, lokale Modelle, reale Webziele und
externe Wirkungen waren nicht Teil dieses Standalone-Laufs.
