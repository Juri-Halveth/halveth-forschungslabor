# LUCINET Script Lab · Text ist mehr als ein Bild

Dieses eigenständige Rust-Modul trennt den gespeicherten UTF-8-Bytestrom,
Unicode-Skalare, NFC/NFD-Normalisierung, Graphemgruppen und die Anzeigeordnung
nach dem bidirektionalen Textalgorithmus. Ähnliche sichtbare Zeichen werden
dadurch weder zu identischen Bytes noch zu einer gemeinsamen Herkunft.

Die Bibliothek `src/lib.rs` stammt bytegleich aus dem lokalen
LUCINET-Commit `5b7956f40f2fde241a20f9705f1d4f7c1fbc9920`. Auch
`SOURCE_STATUS.md` und der MIT-Lizenztext wurden unverändert übernommen;
`SOURCE_RECEIPT.json` bindet die enthaltenen SHA-256-Werte. Das lokale
Quell-Git ist nicht automatisch von außen abrufbar. Die neue eigenständige
`Cargo.toml`, `Cargo.lock` und die kleine CLI sind eine getrennte
Paketierungsarbeit.

## Direkt ausprobieren

```powershell
cd branches/lucinet-script-lab
cargo run --locked -- --demo
cargo run --locked -- --text "Å"
```

Die CLI liest den ausdrücklich angegebenen Text und schreibt eine
strukturierte JSON-Analyse nach stdout. Sie öffnet keine Dateien und
kontaktiert keinen Server.

```powershell
cargo fmt --all -- --check
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
```

## Gebundene Grenze

Die Referenz ist Unicode 17.0.0 und UAX #9 Revision 51. Die verwendeten
Normalisierungs- und Segmentierungsdaten melden 17.0.0, der konkrete
Bidi-Provider 16.0.0. `full_reference_match` bleibt deshalb `false`.
Die neun Quelltests decken ausgewählte Beispiele ab, nicht die vollständigen
offiziellen Unicode-Conformance-Dateien. Der genaue Ursprungsstand steht in
[SOURCE_STATUS.md](SOURCE_STATUS.md).

**Quelle:** lokaler LUCINET-Commit, Version und Dateihashes im
[Source Receipt](SOURCE_RECEIPT.json). **Lizenz:** [MIT](LICENSE).
Projektleitung und Zusammenstellung: Juri Halveth / HALVETH; neue
Paketierung mit KI-Unterstützung.
