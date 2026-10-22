//! Full coordinate-inversion audits for four-dimensional representations.
//!
//! The operator `(x, y, z, t) -> (-x, -y, -z, -t)` is kept separate from
//! set invariance, curve orientation, field parity, charge conjugation, and
//! physical particle claims.

use std::{error::Error, fmt};

use crate::InvolutionAudit;

/// Failure while negating a bounded integer coordinate.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FullInversionError {
    /// The coordinate at `axis` was `i64::MIN` and has no positive `i64` image.
    CoordinateNegationOverflow {
        /// Zero-based axis in `(x, y, z, t)` order.
        axis: usize,
    },
}

impl fmt::Display for FullInversionError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::CoordinateNegationOverflow { axis } => {
                write!(formatter, "coordinate inversion overflow on axis {axis}")
            }
        }
    }
}

impl Error for FullInversionError {}

/// Applies full central inversion to `(x, y, z, t)`.
///
/// # Errors
///
/// Returns [`FullInversionError::CoordinateNegationOverflow`] when a coordinate
/// is `i64::MIN` and cannot be negated in the chosen representation.
pub fn invert_spacetime_point(point: [i64; 4]) -> Result<[i64; 4], FullInversionError> {
    let mut inverted = point;
    for (axis, coordinate) in inverted.iter_mut().enumerate() {
        *coordinate = coordinate
            .checked_neg()
            .ok_or(FullInversionError::CoordinateNegationOverflow { axis })?;
    }
    Ok(inverted)
}

/// Audits two applications of full coordinate inversion at one point.
///
/// # Errors
///
/// Returns [`FullInversionError`] when either application cannot be represented
/// by the bounded coordinate type.
pub fn audit_full_coordinate_involution(
    point: [i64; 4],
) -> Result<InvolutionAudit, FullInversionError> {
    let once = invert_spacetime_point(point)?;
    let twice = invert_spacetime_point(once)?;
    Ok(if twice == point {
        InvolutionAudit::ExactAtInput
    } else {
        InvolutionAudit::FailedAtInput
    })
}

/// Returns whether a point itself, rather than a set containing it, is fixed.
#[must_use]
pub fn is_full_inversion_fixpoint(point: [i64; 4]) -> bool {
    point == [0; 4]
}

/// Affine line in four coordinates with a real-valued implicit parameter.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AffineLine4 {
    anchor: [i64; 4],
    direction: [i64; 4],
}

impl AffineLine4 {
    /// Creates a line when its direction is non-zero.
    #[must_use]
    pub fn new(anchor: [i64; 4], direction: [i64; 4]) -> Option<Self> {
        direction
            .iter()
            .any(|coordinate| *coordinate != 0)
            .then_some(Self { anchor, direction })
    }

    /// Returns the anchor used by this representation.
    #[must_use]
    pub const fn anchor(&self) -> [i64; 4] {
        self.anchor
    }

    /// Returns the non-zero direction vector.
    #[must_use]
    pub const fn direction(&self) -> [i64; 4] {
        self.direction
    }

    /// Returns whether the represented affine set contains the origin.
    #[must_use]
    pub fn contains_origin(&self) -> bool {
        let Some(pivot) = self
            .direction
            .iter()
            .position(|coordinate| *coordinate != 0)
        else {
            return false;
        };
        self.anchor.iter().enumerate().all(|(axis, coordinate)| {
            i128::from(*coordinate) * i128::from(self.direction[pivot])
                == i128::from(self.direction[axis]) * i128::from(self.anchor[pivot])
        })
    }

    /// Classifies the image set and parameter direction under full inversion.
    #[must_use]
    pub fn inversion_relation(&self) -> AffineLineInversionRelation {
        if self.contains_origin() {
            AffineLineInversionRelation::SameSetParameterDirectionReversed
        } else {
            AffineLineInversionRelation::ParallelDistinctSet
        }
    }
}

/// Set-level result of fully inverting an affine line.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum AffineLineInversionRelation {
    /// The line contains the origin, so the set is unchanged while its parameter reverses.
    SameSetParameterDirectionReversed,
    /// A non-origin affine line maps to a distinct parallel line.
    ParallelDistinctSet,
}

/// Orientation effect of a transformation on a named structure.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum OrientationEffect {
    /// Orientation is retained.
    Preserved,
    /// Orientation is reversed.
    Reversed,
}

/// Orientation signature of full `(x, y, z, t)` inversion.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct FullInversionOrientation {
    spatial_orientation: OrientationEffect,
    time_orientation: OrientationEffect,
    four_dimensional_orientation: OrientationEffect,
    external_curve_parameter: OrientationEffect,
}

impl FullInversionOrientation {
    /// Returns the orientation change in the three spatial coordinates.
    #[must_use]
    pub const fn spatial_orientation(self) -> OrientationEffect {
        self.spatial_orientation
    }

    /// Returns the orientation change of the time coordinate.
    #[must_use]
    pub const fn time_orientation(self) -> OrientationEffect {
        self.time_orientation
    }

    /// Returns the orientation change of the complete four-dimensional map.
    #[must_use]
    pub const fn four_dimensional_orientation(self) -> OrientationEffect {
        self.four_dimensional_orientation
    }

    /// Returns the effect on an external curve parameter not included in the map.
    #[must_use]
    pub const fn external_curve_parameter(self) -> OrientationEffect {
        self.external_curve_parameter
    }
}

/// Returns the exact orientation signature of the diagonal map `diag(-1,-1,-1,-1)`.
#[must_use]
pub const fn full_inversion_orientation() -> FullInversionOrientation {
    FullInversionOrientation {
        spatial_orientation: OrientationEffect::Reversed,
        time_orientation: OrientationEffect::Reversed,
        four_dimensional_orientation: OrientationEffect::Preserved,
        external_curve_parameter: OrientationEffect::Preserved,
    }
}

/// Constant-amplitude plane-wave representation under a negated phase.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum PlaneWaveForm {
    /// Real `cos(theta)` representation.
    RealCosine,
    /// Real `sin(theta)` representation.
    RealSine,
    /// Complex `A * exp(i theta)` representation.
    ComplexExponential,
}

/// Constraint on the constant amplitude of a complex plane wave.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum ComplexAmplitudeClass {
    /// Amplitude is real, including unit amplitude.
    Real,
    /// Amplitude may itself have a non-zero complex phase.
    UnrestrictedComplex,
}

/// Field-value result when full coordinate inversion negates the wave phase.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum PlaneWaveInversionEffect {
    /// Even cosine returns the same real value.
    ValueInvariant,
    /// Odd sine returns the negative real value.
    SignReversed,
    /// A real-amplitude complex exponential becomes its complex conjugate.
    ComplexConjugated,
    /// The phase reverses, but arbitrary complex amplitude blocks that conclusion.
    PhaseReversedNotGenerallyConjugated,
}

/// Classifies a constant-amplitude plane wave after `theta -> -theta`.
#[must_use]
pub const fn classify_plane_wave_inversion(
    form: PlaneWaveForm,
    amplitude: ComplexAmplitudeClass,
) -> PlaneWaveInversionEffect {
    match form {
        PlaneWaveForm::RealCosine => PlaneWaveInversionEffect::ValueInvariant,
        PlaneWaveForm::RealSine => PlaneWaveInversionEffect::SignReversed,
        PlaneWaveForm::ComplexExponential => match amplitude {
            ComplexAmplitudeClass::Real => PlaneWaveInversionEffect::ComplexConjugated,
            ComplexAmplitudeClass::UnrestrictedComplex => {
                PlaneWaveInversionEffect::PhaseReversedNotGenerallyConjugated
            }
        },
    }
}

/// Highest physical conclusion supplied by this purely coordinate-level audit.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum FullInversionEvidenceCeiling {
    /// PT coordinate involution only; charge conjugation and particle identity are absent.
    PtCoordinateInvolutionOnly,
}

/// Returns the evidence ceiling without promoting PT to C, CPT, or antiparticles.
#[must_use]
pub const fn full_inversion_evidence_ceiling() -> FullInversionEvidenceCeiling {
    FullInversionEvidenceCeiling::PtCoordinateInvolutionOnly
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_coordinate_inversion_is_an_exact_pointwise_involution() {
        let point = [2, 1, 3, 4];
        assert_eq!(invert_spacetime_point(point).unwrap(), [-2, -1, -3, -4]);
        assert_eq!(
            audit_full_coordinate_involution(point).unwrap(),
            InvolutionAudit::ExactAtInput
        );
    }

    #[test]
    fn only_the_origin_is_a_pointwise_fixpoint() {
        assert!(is_full_inversion_fixpoint([0, 0, 0, 0]));
        assert!(!is_full_inversion_fixpoint([1, 0, 0, 1]));
    }

    #[test]
    fn a_line_through_the_origin_is_setwise_but_not_pointwise_invariant() {
        let line = AffineLine4::new([2, 0, 0, 2], [1, 0, 0, 1]).unwrap();
        assert!(line.contains_origin());
        assert_eq!(
            line.inversion_relation(),
            AffineLineInversionRelation::SameSetParameterDirectionReversed
        );
        assert_ne!(invert_spacetime_point([2, 0, 0, 2]).unwrap(), [2, 0, 0, 2]);
    }

    #[test]
    fn a_non_origin_affine_line_maps_to_a_parallel_distinct_set() {
        let line = AffineLine4::new([0, 1, 0, 0], [1, 0, 0, 1]).unwrap();
        assert!(!line.contains_origin());
        assert_eq!(
            line.inversion_relation(),
            AffineLineInversionRelation::ParallelDistinctSet
        );
    }

    #[test]
    fn external_parameter_and_transformed_time_have_different_orientation_roles() {
        let signature = full_inversion_orientation();
        assert_eq!(
            signature.external_curve_parameter(),
            OrientationEffect::Preserved
        );
        assert_eq!(signature.time_orientation(), OrientationEffect::Reversed);
        assert_eq!(signature.spatial_orientation(), OrientationEffect::Reversed);
        assert_eq!(
            signature.four_dimensional_orientation(),
            OrientationEffect::Preserved
        );
    }

    #[test]
    fn central_inversion_preserves_xy_turn_order_for_the_same_external_parameter() {
        let first = [1_i64, 0_i64, 0, 0];
        let second = [0_i64, 1_i64, 0, 1];
        let inverted_first = invert_spacetime_point(first).unwrap();
        let inverted_second = invert_spacetime_point(second).unwrap();
        let signed_turn = |from: [i64; 4], to: [i64; 4]| from[0] * to[1] - from[1] * to[0];

        assert_eq!(signed_turn(first, second), 1);
        assert_eq!(signed_turn(inverted_first, inverted_second), 1);
        assert_eq!(signed_turn(inverted_second, inverted_first), -1);
    }

    #[test]
    fn cosine_sine_and_complex_phase_have_distinct_inversion_effects() {
        assert_eq!(
            classify_plane_wave_inversion(PlaneWaveForm::RealCosine, ComplexAmplitudeClass::Real),
            PlaneWaveInversionEffect::ValueInvariant
        );
        assert_eq!(
            classify_plane_wave_inversion(PlaneWaveForm::RealSine, ComplexAmplitudeClass::Real),
            PlaneWaveInversionEffect::SignReversed
        );
        assert_eq!(
            classify_plane_wave_inversion(
                PlaneWaveForm::ComplexExponential,
                ComplexAmplitudeClass::Real,
            ),
            PlaneWaveInversionEffect::ComplexConjugated
        );
    }

    #[test]
    fn arbitrary_complex_amplitude_blocks_automatic_conjugation() {
        assert_eq!(
            classify_plane_wave_inversion(
                PlaneWaveForm::ComplexExponential,
                ComplexAmplitudeClass::UnrestrictedComplex,
            ),
            PlaneWaveInversionEffect::PhaseReversedNotGenerallyConjugated
        );
    }

    #[test]
    fn bounded_coordinate_overflow_fails_closed() {
        assert_eq!(
            invert_spacetime_point([0, 0, 0, i64::MIN]),
            Err(FullInversionError::CoordinateNegationOverflow { axis: 3 })
        );
    }

    #[test]
    fn coordinate_inversion_does_not_promote_itself_to_cpt() {
        assert_eq!(
            full_inversion_evidence_ceiling(),
            FullInversionEvidenceCeiling::PtCoordinateInvolutionOnly
        );
    }
}
