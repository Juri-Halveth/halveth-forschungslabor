//! I/O-free canonical semantics for the LUCINET P0 core.
//!
//! The crate models source identity, movable reference frames, additive view
//! history, orthogonal state axes, and typed forward/counter cross-proofs. It
//! deliberately contains no adapters for files, networks, processes, devices,
//! user interfaces, or installation.

mod aperture;
mod axes;
mod digest;
mod epistemic;
mod frame;
mod full_inversion;
mod glyph_reflection;
mod graph;
mod identifiers;
mod physical_materialization;
mod reasoning;
mod sampling_generativity;
mod source;
mod superposition;
mod transform;
mod typed_transformation;
mod view;

pub use aperture::{Aperture, ApertureMoveError};
pub use axes::{
    Binding, CanonicalAxes, DerivableUnmaterialized, Determinacy, EvidenceState, Materialization,
};
pub use digest::Digest256;
pub use epistemic::{
    ClaimAssessment, ClaimBasis, ClaimContract, ClaimContractFields, ClaimPromotion,
    CommitAuthorization, ComponentDisposition, ContestState, ControlId, ControlResult,
    DecisionRecord, EffectReceipt, EpistemicError, EvidenceBinding, EvidenceBindingFields,
    EvidenceChecks, EvidenceDirection, EvidenceRecord, InformationComponentTrial, Knowledge,
    MinimalGroundContract, MinimalGroundContractFields, MinimalPredictiveGround, ObservationRecord,
    ObservationRecordFields, RelationalChange, RelationalState, RemovalEffect, RequirementOutcome,
    SufficiencyContract, SufficiencyContractFields, TemporalAssessment, ValidatedWitness,
    WitnessValidationInput, compare_relational_states, validate_witness,
};
pub use frame::{FrameMoveError, FramePose, FramePoseError, ReferenceFrame};
pub use full_inversion::{
    AffineLine4, AffineLineInversionRelation, ComplexAmplitudeClass, FullInversionError,
    FullInversionEvidenceCeiling, FullInversionOrientation, OrientationEffect, PlaneWaveForm,
    PlaneWaveInversionEffect, audit_full_coordinate_involution, classify_plane_wave_inversion,
    full_inversion_evidence_ceiling, full_inversion_orientation, invert_spacetime_point,
    is_full_inversion_fixpoint,
};
pub use glyph_reflection::{
    BoundGlyph, GlyphConstraint, GlyphConstraintError, GlyphDistanceMetric,
    GlyphReflectionContract, GlyphReflectionContractError, GlyphRun,
    bind_position_preserving_constraints, reflect_binary_mask_horizontally,
};
pub use graph::{
    BranchNode, EntityKind, EntityNode, EvidenceNode, GraphNode, NodeRef, ProjectionDefinition,
    ProjectionNode, RelationGraph, RelationGraphError, RelationKind, RelationNode, SnapshotNode,
    SourceNode, ViewNode, ViewNodeDefinition,
};
pub use identifiers::{
    ApertureId, BindingId, BranchId, CrossProofId, DerivationId, EntityId, EvidenceId, FrameId,
    IdentifierError, MaterializationId, ObjectId, ProjectionId, RelationGraphId, RelationId,
    SnapshotId, SourceId, SpaceId, TransformId, ViewId,
};
pub use physical_materialization::{
    MaterializationAudit, MaterializationState, MirrorIndexError, mirror_atomic_number,
};
pub use reasoning::{
    DefinitionComparison, DefinitionIncompatibilityWitness, DefinitionLock, DefinitionLockFields,
    FourPointReferenceAudit, LanguageDimension, NumberAddressFields, NumberAddressLock,
    NumberEvidence, NumberRole, ReferenceAuditPoint,
};
pub use sampling_generativity::{
    LinearMotionEvidence, MotionAuditError, ObservationContext, ObservationContextFields,
    ObservedProperty, SpatialEvent, SpatialEventFields, StatementContract, StatementContractFields,
    StatementKind, StatementStability, audit_uniform_linear_motion,
};
pub use source::SourceSnapshot;
pub use superposition::{CompositeViewError, MultiFrameReferenceProjection, SuperpositionView};
pub use transform::{
    Counter, CounterObject, CounterObjectError, CrossProof, CrossProofError, Forward, Involution,
    Residual, Reversibility, TransformContract,
};
pub use typed_transformation::{
    CommutationAudit, FourStateAudit, InformationBehavior, InverseKind, InvolutionAudit,
    OperatorDeterminism, TypedOperatorContract, TypedOperatorContractError, audit_commutation,
    audit_four_state_system, audit_inverse_pair, audit_involution,
    reflect_point_across_horizontal_axis, reflect_point_across_vertical_axis,
    reverse_sequence_units,
};
pub use view::{ViewDirection, ViewHistory, ViewHistoryError, ViewRecord};
