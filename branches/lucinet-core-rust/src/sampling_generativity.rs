//! Scope-bound observation, sampling, and generativity contracts.
//!
//! A relation fitted to observations is not automatically the dynamics that
//! generated them. This module keeps formal axioms, software locks, bounded
//! observations, finite fits, and empirical hypotheses in separate types.

use std::{collections::BTreeSet, error::Error, fmt};

/// Semantic class of a statement that may otherwise be called "fixed".
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum StatementKind {
    /// Identity and raw content of an already captured evidence record.
    HistoricalEvidenceRecord,
    /// Assumption adopted inside a named formal system.
    FormalAxiom,
    /// Property enforced by a particular software revision.
    SoftwareInvariant,
    /// Architecture or output contract locked for a named version.
    VersionLock,
    /// Variable deliberately held constant in a bounded experiment.
    ExperimentalControl,
    /// Convention used to represent a richer object in a bounded context.
    RepresentationConvention,
    /// Relation fitted to a finite set of observations.
    ObservationalFit,
    /// Revisable claim about the process that generated observations.
    GeneratingDynamicsHypothesis,
}

/// Scope within which a statement may be retained or revised.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum StatementStability {
    /// Preserve the historical record; this does not validate every claim in it.
    EvidencePreserved,
    /// Valid only inside the explicitly named formal system.
    FormalSystemBound,
    /// Enforced only by the explicitly named software or contract version.
    VersionBound,
    /// Held constant only for the explicitly named experiment.
    ExperimentBound,
    /// Valid only at the complete observation address.
    ObservationContextBound,
    /// Open to intervention, falsification, and replacement by evidence.
    RevisableHypothesis,
}

impl StatementKind {
    /// Returns the non-ontological stability implied by this statement class.
    #[must_use]
    pub const fn stability(self) -> StatementStability {
        match self {
            Self::HistoricalEvidenceRecord => StatementStability::EvidencePreserved,
            Self::FormalAxiom => StatementStability::FormalSystemBound,
            Self::SoftwareInvariant | Self::VersionLock => StatementStability::VersionBound,
            Self::ExperimentalControl => StatementStability::ExperimentBound,
            Self::RepresentationConvention | Self::ObservationalFit => {
                StatementStability::ObservationContextBound
            }
            Self::GeneratingDynamicsHypothesis => StatementStability::RevisableHypothesis,
        }
    }
}

/// Complete semantic address for an axiom, lock, fit, or hypothesis.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StatementContract {
    kind: StatementKind,
    term: String,
    object_or_referent: String,
    domain: String,
    definition: String,
    scope: String,
    measurement_method: String,
    source: String,
    valid_at: String,
    boundary_or_falsifier: String,
}

impl StatementContract {
    /// Creates a statement only when its complete address and limit are present.
    #[must_use]
    pub fn new(fields: StatementContractFields) -> Option<Self> {
        let values = [
            &fields.term,
            &fields.object_or_referent,
            &fields.domain,
            &fields.definition,
            &fields.scope,
            &fields.measurement_method,
            &fields.source,
            &fields.valid_at,
            &fields.boundary_or_falsifier,
        ];

        values
            .iter()
            .all(|value| !value.trim().is_empty())
            .then_some(Self {
                kind: fields.kind,
                term: fields.term,
                object_or_referent: fields.object_or_referent,
                domain: fields.domain,
                definition: fields.definition,
                scope: fields.scope,
                measurement_method: fields.measurement_method,
                source: fields.source,
                valid_at: fields.valid_at,
                boundary_or_falsifier: fields.boundary_or_falsifier,
            })
    }

    /// Returns the semantic statement class.
    #[must_use]
    pub const fn kind(&self) -> StatementKind {
        self.kind
    }

    /// Returns the stability scope implied by the statement class.
    #[must_use]
    pub const fn stability(&self) -> StatementStability {
        self.kind.stability()
    }

    /// Returns the addressed term.
    #[must_use]
    pub fn term(&self) -> &str {
        &self.term
    }

    /// Returns the addressed object or referent.
    #[must_use]
    pub fn object_or_referent(&self) -> &str {
        &self.object_or_referent
    }

    /// Returns the formal, physical, software, or other domain.
    #[must_use]
    pub fn domain(&self) -> &str {
        &self.domain
    }

    /// Returns the bound definition.
    #[must_use]
    pub fn definition(&self) -> &str {
        &self.definition
    }

    /// Returns the bounded scope.
    #[must_use]
    pub fn scope(&self) -> &str {
        &self.scope
    }

    /// Returns the measurement method or explicit non-applicability marker.
    #[must_use]
    pub fn measurement_method(&self) -> &str {
        &self.measurement_method
    }

    /// Returns the source identity.
    #[must_use]
    pub fn source(&self) -> &str {
        &self.source
    }

    /// Returns the time or revision for which the statement is bound.
    #[must_use]
    pub fn valid_at(&self) -> &str {
        &self.valid_at
    }

    /// Returns the explicit domain boundary, revision trigger, or falsifier.
    #[must_use]
    pub fn boundary_or_falsifier(&self) -> &str {
        &self.boundary_or_falsifier
    }
}

/// Construction fields for a complete [`StatementContract`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StatementContractFields {
    /// Semantic statement class.
    pub kind: StatementKind,
    /// Term as written.
    pub term: String,
    /// Addressed object or referent.
    pub object_or_referent: String,
    /// Formal, physical, software, or other domain.
    pub domain: String,
    /// Definition used in the named domain.
    pub definition: String,
    /// Bounded application scope.
    pub scope: String,
    /// Measurement method or `NOT_APPLICABLE`.
    pub measurement_method: String,
    /// Source identity.
    pub source: String,
    /// Time or revision.
    pub valid_at: String,
    /// Domain boundary, revision trigger, or empirical falsifier.
    pub boundary_or_falsifier: String,
}

/// Complete address at which a property was observed or computed.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ObservationContext {
    source_id: String,
    referent_id: String,
    state_id: String,
    scale: String,
    measurement_resolution: String,
    measurement_method: String,
    scope: String,
    observer: String,
    projection: String,
    time_basis: String,
    validity_contract: String,
    observed_at: i64,
}

impl ObservationContext {
    /// Creates a context only when every non-numeric address field is present.
    #[must_use]
    pub fn new(fields: ObservationContextFields) -> Option<Self> {
        let values = [
            &fields.source_id,
            &fields.referent_id,
            &fields.state_id,
            &fields.scale,
            &fields.measurement_resolution,
            &fields.measurement_method,
            &fields.scope,
            &fields.observer,
            &fields.projection,
            &fields.time_basis,
            &fields.validity_contract,
        ];
        values
            .iter()
            .all(|value| !value.trim().is_empty())
            .then_some(Self {
                source_id: fields.source_id,
                referent_id: fields.referent_id,
                state_id: fields.state_id,
                scale: fields.scale,
                measurement_resolution: fields.measurement_resolution,
                measurement_method: fields.measurement_method,
                scope: fields.scope,
                observer: fields.observer,
                projection: fields.projection,
                time_basis: fields.time_basis,
                validity_contract: fields.validity_contract,
                observed_at: fields.observed_at,
            })
    }

    /// Returns the immutable source-lineage identity.
    #[must_use]
    pub fn source_id(&self) -> &str {
        &self.source_id
    }

    /// Returns the observed object or referent identity.
    #[must_use]
    pub fn referent_id(&self) -> &str {
        &self.referent_id
    }

    /// Returns the captured/modelled state identity.
    #[must_use]
    pub fn state_id(&self) -> &str {
        &self.state_id
    }

    /// Returns the declared observation scale.
    #[must_use]
    pub fn scale(&self) -> &str {
        &self.scale
    }

    /// Returns the declared measurement resolution.
    #[must_use]
    pub fn measurement_resolution(&self) -> &str {
        &self.measurement_resolution
    }

    /// Returns the observer identity.
    #[must_use]
    pub fn observer(&self) -> &str {
        &self.observer
    }

    /// Returns the projection or measurement operator identity.
    #[must_use]
    pub fn projection(&self) -> &str {
        &self.projection
    }

    /// Returns the explicitly declared time basis.
    #[must_use]
    pub fn time_basis(&self) -> &str {
        &self.time_basis
    }

    /// Returns the coordinate in the declared time basis.
    #[must_use]
    pub const fn observed_at(&self) -> i64 {
        self.observed_at
    }

    /// Returns whether every address coordinate, including time, is equal.
    #[must_use]
    pub fn has_same_observation_address(&self, other: &Self) -> bool {
        self == other
    }

    /// Returns whether two contexts can be compared across time.
    ///
    /// Only the coordinate in the already-bound time basis may differ.
    #[must_use]
    pub fn is_longitudinally_comparable_with(&self, other: &Self) -> bool {
        self.source_id == other.source_id
            && self.referent_id == other.referent_id
            && self.scale == other.scale
            && self.measurement_resolution == other.measurement_resolution
            && self.measurement_method == other.measurement_method
            && self.scope == other.scope
            && self.observer == other.observer
            && self.projection == other.projection
            && self.time_basis == other.time_basis
            && self.validity_contract == other.validity_contract
    }
}

/// Construction fields for a complete [`ObservationContext`].
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ObservationContextFields {
    /// Immutable source-lineage identity.
    pub source_id: String,
    /// Observed object or referent identity.
    pub referent_id: String,
    /// Captured or modelled state identity.
    pub state_id: String,
    /// Spatial, temporal, or semantic observation scale.
    pub scale: String,
    /// Smallest declared distinguishable change.
    pub measurement_resolution: String,
    /// Measurement-method contract.
    pub measurement_method: String,
    /// Bounded scope of the observation.
    pub scope: String,
    /// Observer identity.
    pub observer: String,
    /// Projection or measurement operator identity.
    pub projection: String,
    /// Time basis and unit.
    pub time_basis: String,
    /// Validity interval or revision contract.
    pub validity_contract: String,
    /// Coordinate in the declared time basis.
    pub observed_at: i64,
}

/// Property value bound to source, scale, resolution, observer, projection, and time.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ObservedProperty {
    property: String,
    value: String,
    context: ObservationContext,
}

impl ObservedProperty {
    /// Binds a non-empty property and value to a complete observation context.
    #[must_use]
    pub fn new(
        property: impl Into<String>,
        value: impl Into<String>,
        context: ObservationContext,
    ) -> Option<Self> {
        let property = property.into();
        let value = value.into();
        (!property.trim().is_empty() && !value.trim().is_empty()).then_some(Self {
            property,
            value,
            context,
        })
    }

    /// Returns whether two values address the same property in a longitudinally
    /// comparable context. Exact same-event identity remains separately
    /// available through [`ObservationContext::has_same_observation_address`].
    #[must_use]
    pub fn is_comparable_with(&self, other: &Self) -> bool {
        self.property == other.property
            && self
                .context
                .is_longitudinally_comparable_with(&other.context)
    }

    /// Returns the property name.
    #[must_use]
    pub fn property(&self) -> &str {
        &self.property
    }

    /// Returns the recorded value without reinterpreting it.
    #[must_use]
    pub fn value(&self) -> &str {
        &self.value
    }

    /// Returns the complete observation address.
    #[must_use]
    pub const fn context(&self) -> &ObservationContext {
        &self.context
    }
}

/// One spatial observation at an explicitly named time coordinate.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct SpatialEvent {
    sample_id: String,
    referent_id: String,
    event_record_digest: String,
    position: [i64; 3],
    context: ObservationContext,
}

impl SpatialEvent {
    /// Creates an event with a complete referent and observation address.
    #[must_use]
    pub fn new(fields: SpatialEventFields) -> Option<Self> {
        let complete = [
            &fields.sample_id,
            &fields.referent_id,
            &fields.event_record_digest,
        ]
        .iter()
        .all(|value| !value.trim().is_empty());
        (complete && fields.referent_id == fields.context.referent_id()).then_some(Self {
            sample_id: fields.sample_id,
            referent_id: fields.referent_id,
            event_record_digest: fields.event_record_digest,
            position: fields.position,
            context: fields.context,
        })
    }

    /// Returns the event identity.
    #[must_use]
    pub fn sample_id(&self) -> &str {
        &self.sample_id
    }

    /// Returns the observed object identity.
    #[must_use]
    pub fn referent_id(&self) -> &str {
        &self.referent_id
    }

    /// Returns the digest of the complete event record.
    #[must_use]
    pub fn event_record_digest(&self) -> &str {
        &self.event_record_digest
    }

    /// Returns the observed spatial position.
    #[must_use]
    pub const fn position(&self) -> [i64; 3] {
        self.position
    }

    /// Returns the coordinate in the surrounding contract's time basis.
    #[must_use]
    pub const fn observed_at(&self) -> i64 {
        self.context.observed_at
    }

    /// Returns the complete observation context.
    #[must_use]
    pub const fn context(&self) -> &ObservationContext {
        &self.context
    }
}

/// Construction fields for [`SpatialEvent`].
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct SpatialEventFields {
    /// Unique event identity.
    pub sample_id: String,
    /// Stable observed object or referent identity.
    pub referent_id: String,
    /// Digest of the complete event record, including logical time.
    pub event_record_digest: String,
    /// Observed spatial position.
    pub position: [i64; 3],
    /// Complete observer, projection, scale, resolution, and time address.
    pub context: ObservationContext,
}

/// Evidence ceiling of a finite exact linear-motion audit.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum LinearMotionEvidence {
    /// Fewer than two events cannot define a temporal secant.
    InsufficientSamples,
    /// Two events define a secant, but do not identify the path between them.
    SecantDefinedGeneratingDynamicsUnderdetermined,
    /// Three or more samples contradict exact uniform linear motion.
    UniformLinearModelFalsifiedBySamples,
    /// Samples fit exact uniform linear motion; the generating dynamics remain unproven.
    UniformLinearFitCompatibleGeneratingDynamicsNotProven,
}

/// Invalid input to a finite motion audit.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MotionAuditError {
    /// Event identities must be unique within one audit.
    DuplicateSampleId,
    /// Time coordinates must be unique within one audit.
    DuplicateTimeCoordinate,
    /// Samples refer to different objects.
    CrossWiredReferent,
    /// Samples use incompatible observation contexts.
    IncomparableObservationContext,
    /// Exact cross multiplication exceeded the supported integer range.
    ArithmeticOverflow,
}

impl fmt::Display for MotionAuditError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DuplicateSampleId => formatter.write_str("sample identities must be unique"),
            Self::DuplicateTimeCoordinate => formatter.write_str("time coordinates must be unique"),
            Self::CrossWiredReferent => {
                formatter.write_str("motion samples must address the same referent")
            }
            Self::IncomparableObservationContext => {
                formatter.write_str("motion samples use incomparable observation contexts")
            }
            Self::ArithmeticOverflow => {
                formatter.write_str("exact motion comparison exceeded the integer range")
            }
        }
    }
}

impl Error for MotionAuditError {}

/// Audits whether finite events are compatible with exact uniform linear motion.
///
/// This can falsify that bounded model, but can never promote a finite fit to
/// proof of the process that generated the events.
///
/// # Errors
///
/// Returns [`MotionAuditError`] when event identities or time coordinates are
/// duplicated.
pub fn audit_uniform_linear_motion(
    samples: &[SpatialEvent],
) -> Result<LinearMotionEvidence, MotionAuditError> {
    let mut sample_ids = BTreeSet::new();
    let mut event_record_digests = BTreeSet::new();
    let mut time_coordinates = BTreeSet::new();
    let first = samples.first();
    for sample in samples {
        if !sample_ids.insert(sample.sample_id.as_str()) {
            return Err(MotionAuditError::DuplicateSampleId);
        }
        if !event_record_digests.insert(sample.event_record_digest.as_str()) {
            return Err(MotionAuditError::DuplicateSampleId);
        }
        if !time_coordinates.insert(sample.observed_at()) {
            return Err(MotionAuditError::DuplicateTimeCoordinate);
        }
        if first.is_some_and(|origin| origin.referent_id != sample.referent_id) {
            return Err(MotionAuditError::CrossWiredReferent);
        }
        if first.is_some_and(|origin| {
            !origin
                .context
                .is_longitudinally_comparable_with(&sample.context)
        }) {
            return Err(MotionAuditError::IncomparableObservationContext);
        }
    }

    if samples.len() < 2 {
        return Ok(LinearMotionEvidence::InsufficientSamples);
    }
    if samples.len() == 2 {
        return Ok(LinearMotionEvidence::SecantDefinedGeneratingDynamicsUnderdetermined);
    }

    let origin = &samples[0];
    let baseline = &samples[1];
    let baseline_time = i128::from(baseline.observed_at()) - i128::from(origin.observed_at());
    let baseline_position: [i128; 3] = std::array::from_fn(|axis| {
        i128::from(baseline.position[axis]) - i128::from(origin.position[axis])
    });

    for sample in samples.iter().skip(2) {
        let sample_time = i128::from(sample.observed_at()) - i128::from(origin.observed_at());
        for (axis, coordinate) in sample.position.iter().enumerate() {
            let sample_position = i128::from(*coordinate) - i128::from(origin.position[axis]);
            let observed_delta = sample_position
                .checked_mul(baseline_time)
                .ok_or(MotionAuditError::ArithmeticOverflow)?;
            let model_delta = baseline_position[axis]
                .checked_mul(sample_time)
                .ok_or(MotionAuditError::ArithmeticOverflow)?;
            if observed_delta != model_delta {
                return Ok(LinearMotionEvidence::UniformLinearModelFalsifiedBySamples);
            }
        }
    }

    Ok(LinearMotionEvidence::UniformLinearFitCompatibleGeneratingDynamicsNotProven)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(id: &str, position: [i64; 3], observed_at: i64) -> SpatialEvent {
        SpatialEvent::new(SpatialEventFields {
            sample_id: id.into(),
            referent_id: "OBJECT_A".into(),
            event_record_digest: format!("EVENT_RECORD_{id}"),
            position,
            context: context("MACRO", observed_at),
        })
        .unwrap()
    }

    fn context(scale: &str, observed_at: i64) -> ObservationContext {
        ObservationContext::new(ObservationContextFields {
            source_id: "RULER_SOURCE".into(),
            referent_id: "OBJECT_A".into(),
            state_id: format!("RULER_EDGE_STATE_{observed_at}"),
            scale: scale.into(),
            measurement_resolution: "1_UNIT".into(),
            measurement_method: "BOUND_POSITION_PROBE_V1".into(),
            scope: "RULER_EDGE_MOTION_TEST".into(),
            observer: "OBSERVER_A".into(),
            projection: "BEST_FIT_LINE".into(),
            time_basis: "LOGICAL_TICKS".into(),
            validity_contract: "TEST_RUN_V1".into(),
            observed_at,
        })
        .unwrap()
    }

    #[test]
    fn statement_class_controls_stability_without_claiming_eternal_truth() {
        assert_eq!(
            StatementKind::HistoricalEvidenceRecord.stability(),
            StatementStability::EvidencePreserved
        );
        assert_eq!(
            StatementKind::VersionLock.stability(),
            StatementStability::VersionBound
        );
        assert_eq!(
            StatementKind::GeneratingDynamicsHypothesis.stability(),
            StatementStability::RevisableHypothesis
        );
    }

    #[test]
    fn property_comparison_requires_the_same_contract_but_allows_time_to_advance() {
        let coarse_scale =
            ObservedProperty::new("STRAIGHTNESS", "WITHIN_TOLERANCE", context("MACRO", 0)).unwrap();
        let atomic_scale =
            ObservedProperty::new("STRAIGHTNESS", "ROUGH", context("ATOMIC", 0)).unwrap();
        let later =
            ObservedProperty::new("STRAIGHTNESS", "WITHIN_TOLERANCE", context("MACRO", 1)).unwrap();

        assert!(!coarse_scale.is_comparable_with(&atomic_scale));
        assert!(coarse_scale.is_comparable_with(&later));
        assert!(
            !coarse_scale
                .context()
                .has_same_observation_address(later.context())
        );
    }

    #[test]
    fn spatial_event_rejects_referent_cross_wiring_at_construction() {
        assert!(
            SpatialEvent::new(SpatialEventFields {
                sample_id: "EVENT_A".into(),
                referent_id: "OBJECT_B".into(),
                event_record_digest: "EVENT_RECORD_A".into(),
                position: [0, 0, 0],
                context: context("MACRO", 0),
            })
            .is_none()
        );
    }

    #[test]
    fn two_events_define_only_a_secant() {
        let samples = [event("A", [0, 0, 0], 0), event("B", [10, 0, 0], 10)];
        assert_eq!(
            audit_uniform_linear_motion(&samples).unwrap(),
            LinearMotionEvidence::SecantDefinedGeneratingDynamicsUnderdetermined
        );
    }

    #[test]
    fn three_non_linear_samples_falsify_uniform_linear_motion() {
        let samples = [
            event("A", [0, 0, 0], 0),
            event("B", [10, 0, 0], 10),
            event("C", [20, 1, 0], 20),
        ];
        assert_eq!(
            audit_uniform_linear_motion(&samples).unwrap(),
            LinearMotionEvidence::UniformLinearModelFalsifiedBySamples
        );
    }

    #[test]
    fn finite_collinear_samples_do_not_prove_generating_dynamics() {
        let samples = [
            event("A", [0, 0, 0], 0),
            event("B", [10, -2, 4], 10),
            event("C", [25, -5, 10], 25),
            event("D", [-5, 1, -2], -5),
        ];
        assert_eq!(
            audit_uniform_linear_motion(&samples).unwrap(),
            LinearMotionEvidence::UniformLinearFitCompatibleGeneratingDynamicsNotProven
        );
    }

    #[test]
    fn same_position_at_different_times_remains_two_events() {
        let samples = [event("A", [7, 7, 7], 0), event("B", [7, 7, 7], 1)];
        assert_ne!(samples[0], samples[1]);
        assert_eq!(
            audit_uniform_linear_motion(&samples).unwrap(),
            LinearMotionEvidence::SecantDefinedGeneratingDynamicsUnderdetermined
        );
    }

    #[test]
    fn duplicate_time_coordinates_fail_closed() {
        let samples = [event("A", [0, 0, 0], 0), event("B", [1, 0, 0], 0)];
        assert_eq!(
            audit_uniform_linear_motion(&samples),
            Err(MotionAuditError::DuplicateTimeCoordinate)
        );
    }

    #[test]
    fn arithmetic_overflow_fails_closed() {
        let samples = [
            event("A", [i64::MIN, 0, 0], i64::MIN),
            event("B", [i64::MIN, 0, 0], i64::MAX),
            event("C", [i64::MAX, 0, 0], i64::MAX - 1),
        ];
        assert_eq!(
            audit_uniform_linear_motion(&samples),
            Err(MotionAuditError::ArithmeticOverflow)
        );
    }

    #[test]
    fn cross_wired_referents_and_observers_fail_closed() {
        let first = event("A", [0, 0, 0], 0);
        let mut other_referent = event("B", [1, 0, 0], 1);
        other_referent.referent_id = "OBJECT_B".into();
        assert_eq!(
            audit_uniform_linear_motion(&[first.clone(), other_referent]),
            Err(MotionAuditError::CrossWiredReferent)
        );
        let mut other_observer = event("C", [1, 0, 0], 1);
        other_observer.context.observer = "OBSERVER_B".into();
        assert_eq!(
            audit_uniform_linear_motion(&[first, other_observer]),
            Err(MotionAuditError::IncomparableObservationContext)
        );
    }
}
