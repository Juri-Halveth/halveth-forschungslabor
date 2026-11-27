//! Closed, I/O-free constraints for horizontal-axis glyph reflection.
//!
//! The module deliberately separates exact raster reflection from a later,
//! font-bound character lookup. It does not infer word meaning from shape.

use std::collections::BTreeMap;

#[derive(Clone, Debug, Eq, PartialEq)]
/// Closed rendering address for one horizontal-axis glyph comparison.
pub struct GlyphReflectionContract {
    /// Human-readable font-family label.
    pub font_family: String,
    /// Lowercase SHA-256 of the exact font file.
    pub font_file_sha256: String,
    /// Face index inside the font container.
    pub face_index: u32,
    /// Canonically ordered variation-axis assignments.
    pub variation_axes: Vec<String>,
    /// Requested font size in whole pixels.
    pub font_size_px: u32,
    /// Shaping engine name.
    pub shaping_engine: String,
    /// Shaping engine version.
    pub shaping_engine_version: String,
    /// Script tag used for shaping.
    pub script: String,
    /// Language tag used for shaping.
    pub language: String,
    /// Canonically ordered shaping features.
    pub features: Vec<String>,
    /// Hinting mode.
    pub hinting: String,
    /// Antialiasing mode.
    pub antialiasing: String,
    /// Coordinate-frame identifier.
    pub coordinate_frame: String,
    /// Horizontal axis ordinate in millionths of a pixel.
    pub axis_y_micropx: i64,
    /// Named distance metric for any later candidate search.
    pub distance_metric: GlyphDistanceMetric,
    /// Closed character alphabet considered by a later candidate search.
    pub candidate_alphabet: String,
    /// Candidate acceptance threshold in parts per million.
    pub candidate_threshold_ppm: u32,
    /// Bound source identifier for the contract.
    pub source: String,
    /// Time or version at which the contract applies.
    pub valid_at: String,
}

impl GlyphReflectionContract {
    /// Validates all closed contract fields.
    ///
    /// # Errors
    ///
    /// Returns a typed error when a required field is missing, the digest is
    /// not canonical lowercase SHA-256, or a numeric field is out of range.
    pub fn validate(&self) -> Result<(), GlyphReflectionContractError> {
        for value in [
            &self.font_family,
            &self.shaping_engine,
            &self.shaping_engine_version,
            &self.script,
            &self.language,
            &self.hinting,
            &self.antialiasing,
            &self.coordinate_frame,
            &self.candidate_alphabet,
            &self.source,
            &self.valid_at,
        ] {
            if value.trim().is_empty() {
                return Err(GlyphReflectionContractError::MissingField);
            }
        }
        if self.font_size_px == 0 || self.candidate_threshold_ppm > 1_000_000 {
            return Err(GlyphReflectionContractError::OutOfRange);
        }
        if self
            .variation_axes
            .iter()
            .chain(&self.features)
            .any(|value| value.trim().is_empty())
        {
            return Err(GlyphReflectionContractError::MissingField);
        }
        if self.font_file_sha256.len() != 64
            || !self
                .font_file_sha256
                .bytes()
                .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
        {
            return Err(GlyphReflectionContractError::InvalidFontDigest);
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Closed distance metrics for raster-candidate comparison.
pub enum GlyphDistanceMetric {
    /// Jaccard-style disagreement over active pixels.
    JaccardXor,
    /// Hamming disagreement normalized by raster area.
    NormalizedHamming,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Validation failure for a glyph-reflection contract.
pub enum GlyphReflectionContractError {
    /// A required textual field is empty.
    MissingField,
    /// The font digest is not canonical lowercase SHA-256.
    InvalidFontDigest,
    /// A numeric value is outside its closed range.
    OutOfRange,
}

#[derive(Clone, Debug, Eq, PartialEq)]
/// One shaped glyph at its preserved sequence position.
pub struct GlyphRun {
    /// Zero-based position in the shaped sequence.
    pub sequence_index: usize,
    /// Full rendered-glyph address, not merely a Unicode code point.
    pub glyph_key: String,
    /// Source text represented by this run.
    pub source_text: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
/// Bound output for one reflected glyph.
pub enum BoundGlyph {
    /// Partner established inside the same closed rendering contract.
    KnownPartner(String),
    /// Reusable unknown variable when no partner is established.
    BoundUnknown(String),
}

#[derive(Clone, Debug, Eq, PartialEq)]
/// Position-preserving constraint emitted for one source glyph.
pub struct GlyphConstraint {
    /// Original zero-based sequence position.
    pub sequence_index: usize,
    /// Full rendered-glyph key.
    pub glyph_key: String,
    /// Source text retained without semantic reinterpretation.
    pub source_text: String,
    /// Known partner or bound unknown.
    pub reflected: BoundGlyph,
}

/// Reflects a binary raster about its horizontal centre line.
///
/// Applying the function twice returns the original bytes exactly.
#[must_use]
pub fn reflect_binary_mask_horizontally(
    mask: &[u8],
    width: usize,
    height: usize,
) -> Option<Vec<u8>> {
    if width == 0 || height == 0 || mask.len() != width.checked_mul(height)? {
        return None;
    }
    let mut reflected = vec![0; mask.len()];
    for y in 0..height {
        let source = y * width;
        let target = (height - 1 - y) * width;
        reflected[target..target + width].copy_from_slice(&mask[source..source + width]);
    }
    Some(reflected)
}

/// Preserves sequence positions and binds equal glyph addresses to one unknown.
///
/// # Errors
///
/// Returns [`GlyphConstraintError::InvalidSequence`] when indices are not
/// contiguous from zero or a glyph key is empty.
pub fn bind_position_preserving_constraints(
    glyphs: &[GlyphRun],
    known_partners: &BTreeMap<String, String>,
) -> Result<Vec<GlyphConstraint>, GlyphConstraintError> {
    if glyphs
        .iter()
        .enumerate()
        .any(|(index, glyph)| glyph.sequence_index != index || glyph.glyph_key.trim().is_empty())
    {
        return Err(GlyphConstraintError::InvalidSequence);
    }

    let mut unknowns = BTreeMap::<String, String>::new();
    let mut next_unknown = 1usize;
    Ok(glyphs
        .iter()
        .map(|glyph| {
            let reflected = if let Some(partner) = known_partners.get(&glyph.glyph_key) {
                BoundGlyph::KnownPartner(partner.clone())
            } else {
                let variable = unknowns.entry(glyph.glyph_key.clone()).or_insert_with(|| {
                    let value = format!("U{next_unknown}");
                    next_unknown += 1;
                    value
                });
                BoundGlyph::BoundUnknown(variable.clone())
            };
            GlyphConstraint {
                sequence_index: glyph.sequence_index,
                glyph_key: glyph.glyph_key.clone(),
                source_text: glyph.source_text.clone(),
                reflected,
            }
        })
        .collect())
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Constraint-building failure.
pub enum GlyphConstraintError {
    /// Sequence indices or glyph addresses violate the closed input contract.
    InvalidSequence,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn raster_reflection_is_an_exact_involution() {
        let source = vec![1, 0, 0, 1, 1, 1];
        let once = reflect_binary_mask_horizontally(&source, 2, 3).unwrap();
        assert_eq!(once, vec![1, 1, 0, 1, 1, 0]);
        assert_eq!(
            reflect_binary_mask_horizontally(&once, 2, 3).unwrap(),
            source
        );
    }

    #[test]
    fn repeated_glyph_address_reuses_one_unknown_without_reordering() {
        let glyphs = vec![
            GlyphRun {
                sequence_index: 0,
                glyph_key: "font-a:glyph-17".into(),
                source_text: "m".into(),
            },
            GlyphRun {
                sequence_index: 1,
                glyph_key: "font-a:glyph-17".into(),
                source_text: "m".into(),
            },
        ];
        let constraints = bind_position_preserving_constraints(&glyphs, &BTreeMap::new()).unwrap();
        assert_eq!(
            constraints[0].reflected,
            BoundGlyph::BoundUnknown("U1".into())
        );
        assert_eq!(
            constraints[1].reflected,
            BoundGlyph::BoundUnknown("U1".into())
        );
        assert_eq!(constraints[1].sequence_index, 1);
    }

    #[test]
    fn a_partner_is_bound_to_the_full_glyph_key() {
        let glyphs = vec![
            GlyphRun {
                sequence_index: 0,
                glyph_key: "font-a:i".into(),
                source_text: "i".into(),
            },
            GlyphRun {
                sequence_index: 1,
                glyph_key: "font-b:i".into(),
                source_text: "i".into(),
            },
        ];
        let known = BTreeMap::from([("font-a:i".into(), "font-a:!".into())]);
        let constraints = bind_position_preserving_constraints(&glyphs, &known).unwrap();
        assert!(matches!(
            constraints[0].reflected,
            BoundGlyph::KnownPartner(_)
        ));
        assert_eq!(
            constraints[1].reflected,
            BoundGlyph::BoundUnknown("U1".into())
        );
    }

    #[test]
    fn incomplete_rendering_contract_fails_closed() {
        let contract = GlyphReflectionContract {
            font_family: String::new(),
            font_file_sha256: "0".repeat(64),
            face_index: 0,
            variation_axes: Vec::new(),
            font_size_px: 20,
            shaping_engine: "test".into(),
            shaping_engine_version: "1".into(),
            script: "Latn".into(),
            language: "de".into(),
            features: Vec::new(),
            hinting: "none".into(),
            antialiasing: "grayscale".into(),
            coordinate_frame: "raster-top-left".into(),
            axis_y_micropx: 10_000_000,
            distance_metric: GlyphDistanceMetric::JaccardXor,
            candidate_alphabet: "i!".into(),
            candidate_threshold_ppm: 50_000,
            source: "test-fixture".into(),
            valid_at: "v1".into(),
        };
        assert_eq!(
            contract.validate(),
            Err(GlyphReflectionContractError::MissingField)
        );
    }
}
