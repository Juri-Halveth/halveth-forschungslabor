//! Script identity analysis for the local LUCINET Script Lab.
//!
//! This crate separates stored bytes, scalar values, normalization,
//! grapheme clusters, bidi display order, and asserted historical relations.
//! It does not equate visual similarity with identity or provenance.

use serde::Serialize;
use std::fmt::Write as _;
use unicode_bidi::{BidiInfo, UNICODE_VERSION as BIDI_DATA_VERSION};
use unicode_normalization::{UNICODE_VERSION as NORMALIZATION_DATA_VERSION, UnicodeNormalization};
use unicode_segmentation::{UNICODE_VERSION as SEGMENTATION_DATA_VERSION, UnicodeSegmentation};

/// Canonical Unicode reference selected by the owner prompt.
pub const REFERENCE_UNICODE_VERSION: (u8, u8, u8) = (17, 0, 0);

/// Revision of UAX #9 issued for Unicode 17.0.0.
pub const REFERENCE_UAX9_REVISION: u8 = 51;

/// Data-version report kept separate for every algorithm provider.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
pub struct EngineVersions {
    /// Product reference version.
    pub reference_unicode: (u8, u8, u8),
    /// Data embedded by `unicode-normalization`.
    pub normalization: (u8, u8, u8),
    /// Data embedded by `unicode-segmentation`.
    pub segmentation: (u64, u64, u64),
    /// Data embedded by `unicode-bidi`.
    pub bidi: (u64, u64, u64),
    /// Product reference revision for UAX #9.
    pub reference_uax9_revision: u8,
    /// Whether every embedded provider matches the selected reference.
    pub full_reference_match: bool,
}

impl EngineVersions {
    /// Reads versions compiled into the selected libraries.
    #[must_use]
    pub fn current() -> Self {
        let reference = REFERENCE_UNICODE_VERSION;
        let normalization = NORMALIZATION_DATA_VERSION;
        let segmentation = SEGMENTATION_DATA_VERSION;
        let bidi = BIDI_DATA_VERSION;
        Self {
            reference_unicode: reference,
            normalization,
            segmentation,
            bidi,
            reference_uax9_revision: REFERENCE_UAX9_REVISION,
            full_reference_match: normalization == reference
                && segmentation == tuple_u64(reference)
                && bidi == tuple_u64(reference),
        }
    }
}

const fn tuple_u64(value: (u8, u8, u8)) -> (u64, u64, u64) {
    (value.0 as u64, value.1 as u64, value.2 as u64)
}

/// Orthogonal identities and display properties of one text sample.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct ScriptAnalysis {
    /// Input retained in logical order.
    pub logical_text: String,
    /// Exact UTF-8 byte sequence.
    pub utf8_hex: String,
    /// Unicode scalar values in logical order.
    pub scalars: Vec<String>,
    /// Canonical composition.
    pub nfc: String,
    /// Canonical decomposition.
    pub nfd: String,
    /// Extended grapheme clusters.
    pub graphemes: Vec<String>,
    /// UAX #9 display ordering produced by the available Bidi engine.
    pub bidi_display: String,
    /// Resolved embedding level at each scalar boundary.
    pub bidi_levels: Vec<u8>,
    /// Contextual Arabic joining roles when the curated demonstrator applies.
    pub arabic_joining: Vec<ArabicJoiningRole>,
    /// Explicit identity assertions; no historical relation is inferred.
    pub assertions: IdentityAssertions,
    /// Exact versions of embedded providers.
    pub engines: EngineVersions,
}

/// Identity relations that the analyzer can establish directly.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct IdentityAssertions {
    /// Bytes and scalar values are different identity layers.
    pub bytes_vs_scalars: IdentityRelation,
    /// Scalar values and glyph selection are different identity layers.
    pub scalars_vs_glyphs: IdentityRelation,
    /// Visual resemblance supplies no historical relationship by itself.
    pub visual_similarity_vs_history: IdentityRelation,
    /// NFC equality is reported independently from byte equality.
    pub canonical_equivalence_vs_bytes: IdentityRelation,
}

/// Positive classification of a relation between two identity layers.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum IdentityRelation {
    /// The values belong to different identity layers.
    DifferentLayers,
    /// No relation follows from the measured property.
    NoInference,
    /// Both values are reported on orthogonal axes.
    Orthogonal,
}

/// Joining position for a curated Arabic demonstrator.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ArabicJoiningRole {
    /// Character does not participate in cursive joining.
    NonJoining,
    /// No adjacent join is established.
    Isolated,
    /// Joins to the following logical character.
    Initial,
    /// Joins on both sides.
    Medial,
    /// Joins to the preceding logical character.
    Final,
}

/// Analyzes one logical text value without rewriting the input.
#[must_use]
pub fn analyze(text: &str) -> ScriptAnalysis {
    let bidi = BidiInfo::new(text, None);
    let bidi_display = if bidi.paragraphs.is_empty() {
        text.to_owned()
    } else {
        bidi.paragraphs
            .iter()
            .map(|paragraph| {
                bidi.reorder_line(paragraph, paragraph.range.clone())
                    .into_owned()
            })
            .collect()
    };
    let bidi_levels = text
        .char_indices()
        .map(|(byte_index, _)| {
            bidi.levels
                .get(byte_index)
                .map_or(0, unicode_bidi::Level::number)
        })
        .collect();

    ScriptAnalysis {
        logical_text: text.to_owned(),
        utf8_hex: bytes_hex(text.as_bytes()),
        scalars: text
            .chars()
            .map(|value| format!("U+{:04X}", value as u32))
            .collect(),
        nfc: text.nfc().collect(),
        nfd: text.nfd().collect(),
        graphemes: text.graphemes(true).map(str::to_owned).collect(),
        bidi_display,
        bidi_levels,
        arabic_joining: arabic_joining_roles(text),
        assertions: IdentityAssertions {
            bytes_vs_scalars: IdentityRelation::DifferentLayers,
            scalars_vs_glyphs: IdentityRelation::DifferentLayers,
            visual_similarity_vs_history: IdentityRelation::NoInference,
            canonical_equivalence_vs_bytes: IdentityRelation::Orthogonal,
        },
        engines: EngineVersions::current(),
    }
}

fn bytes_hex(bytes: &[u8]) -> String {
    let mut output = String::with_capacity(bytes.len() * 3);
    for (index, byte) in bytes.iter().enumerate() {
        if index > 0 {
            output.push(' ');
        }
        let _ = write!(output, "{byte:02X}");
    }
    output
}

fn arabic_joining_roles(text: &str) -> Vec<ArabicJoiningRole> {
    let characters: Vec<char> = text.chars().collect();
    characters
        .iter()
        .enumerate()
        .map(|(index, character)| {
            if !is_curated_arabic_joining_letter(*character) {
                return ArabicJoiningRole::NonJoining;
            }
            let joins_previous = index > 0
                && is_curated_arabic_joining_letter(characters[index - 1])
                && can_join_forward(characters[index - 1]);
            let joins_next = index + 1 < characters.len()
                && can_join_forward(*character)
                && is_curated_arabic_joining_letter(characters[index + 1]);
            match (joins_previous, joins_next) {
                (true, true) => ArabicJoiningRole::Medial,
                (false, true) => ArabicJoiningRole::Initial,
                (true, false) => ArabicJoiningRole::Final,
                (false, false) => ArabicJoiningRole::Isolated,
            }
        })
        .collect()
}

fn is_curated_arabic_joining_letter(value: char) -> bool {
    matches!(value as u32, 0x0620..=0x063F | 0x0641..=0x064A)
}

fn can_join_forward(value: char) -> bool {
    !matches!(
        value,
        'ا' | 'أ' | 'إ' | 'آ' | 'د' | 'ذ' | 'ر' | 'ز' | 'و' | 'ؤ'
    )
}

/// Curated multilingual product demo used by `lucinet script-lab demo`.
#[must_use]
pub fn demo_cases() -> Vec<(&'static str, &'static str)> {
    vec![
        ("latin", "Å A\u{030A}"),
        ("greek", "ά α\u{0301}"),
        ("arabic-bidi", "مرحبا 123"),
        ("hebrew-bidi", "שלום 123"),
        ("arabic-shaping", "باب"),
        ("devanagari-conjunct", "क्षि"),
        ("han-variation", "葛\u{E0100}"),
        ("hangul", "각 \u{1100}\u{1161}\u{11A8}"),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn providers_report_their_real_versions() {
        let versions = EngineVersions::current();
        assert_eq!(versions.reference_unicode, (17, 0, 0));
        assert_eq!(versions.normalization, (17, 0, 0));
        assert_eq!(versions.segmentation, (17, 0, 0));
        assert_eq!(versions.bidi, (16, 0, 0));
        assert!(!versions.full_reference_match);
    }

    #[test]
    fn arabic_and_hebrew_keep_embedded_ltr_number_order() {
        for sample in ["مرحبا 123", "שלום 123"] {
            let analysis = analyze(sample);
            assert!(analysis.bidi_display.contains("123"));
            assert!(analysis.bidi_levels.iter().any(|level| level % 2 == 1));
            assert!(analysis.bidi_levels.iter().any(|level| level % 2 == 0));
        }
    }

    #[test]
    fn bidi_display_retains_every_paragraph() {
        let analysis = analyze("first\n\u{05E9}\u{05DC}\u{05D5}\u{05DD} 123\nlast");
        assert!(analysis.bidi_display.contains("first"));
        assert!(analysis.bidi_display.contains("123"));
        assert!(analysis.bidi_display.contains("last"));
        assert_eq!(analysis.bidi_display.lines().count(), 3);
    }

    #[test]
    fn arabic_context_changes_joining_role_not_scalar_identity() {
        let analysis = analyze("باب");
        assert_eq!(analysis.scalars, ["U+0628", "U+0627", "U+0628"]);
        assert_eq!(
            analysis.arabic_joining,
            [
                ArabicJoiningRole::Initial,
                ArabicJoiningRole::Final,
                ArabicJoiningRole::Isolated
            ]
        );
        assert_eq!(
            analysis.assertions.scalars_vs_glyphs,
            IdentityRelation::DifferentLayers
        );
    }

    #[test]
    fn devanagari_conjunct_and_mark_form_one_grapheme() {
        let analysis = analyze("क्षि");
        assert_eq!(analysis.graphemes, ["क्षि"]);
        assert!(analysis.scalars.len() > analysis.graphemes.len());
    }

    #[test]
    fn han_variation_sequence_retains_base_and_selector() {
        let analysis = analyze("葛\u{E0100}");
        assert_eq!(analysis.scalars, ["U+845B", "U+E0100"]);
        assert_eq!(analysis.graphemes, ["葛\u{E0100}"]);
    }

    #[test]
    fn hangul_decomposition_and_composition_are_distinct_layers() {
        let composed = analyze("각");
        let decomposed = analyze("\u{1100}\u{1161}\u{11A8}");
        assert_eq!(composed.nfd, decomposed.nfd);
        assert_eq!(composed.nfc, decomposed.nfc);
        assert_ne!(composed.utf8_hex, decomposed.utf8_hex);
    }

    #[test]
    fn latin_and_greek_canonical_equivalence_does_not_equal_bytes() {
        for (composed, decomposed) in [("Å", "A\u{030A}"), ("ά", "α\u{0301}")] {
            let left = analyze(composed);
            let right = analyze(decomposed);
            assert_eq!(left.nfc, right.nfc);
            assert_ne!(left.utf8_hex, right.utf8_hex);
        }
    }

    #[test]
    fn similarity_never_creates_historical_relation() {
        let latin = analyze("A");
        let greek = analyze("Α");
        assert_ne!(latin.scalars, greek.scalars);
        assert_eq!(
            latin.assertions.visual_similarity_vs_history,
            IdentityRelation::NoInference
        );
    }
}
