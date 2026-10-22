use std::{error::Error, fmt};

use crate::{
    CrossProofId, Digest256, FrameId, ObjectId, ProjectionId, ReferenceFrame, SourceSnapshot,
    SpaceId, TransformId,
};

/// Deterministic, non-negative residual in contract-defined integral units.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct Residual(u64);

impl Residual {
    /// Exact return to the starting value.
    pub const ZERO: Self = Self(0);

    /// Creates a residual in the unit declared by the surrounding contract.
    #[must_use]
    pub const fn new(units: u64) -> Self {
        Self(units)
    }

    /// Returns the integral residual units.
    #[must_use]
    pub const fn units(self) -> u64 {
        self.0
    }
}

/// Reversibility requirement for one round trip.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum Reversibility {
    /// The round trip must have zero residual.
    Exact,
    /// The round trip may have a residual up to and including `maximum`.
    Bounded {
        /// Inclusive maximum residual.
        maximum: Residual,
    },
}

impl Reversibility {
    /// Returns whether a measured residual satisfies this requirement.
    #[must_use]
    pub const fn accepts(self, residual: Residual) -> bool {
        match self {
            Self::Exact => residual.0 == 0,
            Self::Bounded { maximum } => residual.0 <= maximum.0,
        }
    }
}

/// Declarative contract joining a forward and a counter transformation.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct TransformContract {
    transform_id: TransformId,
    source_space: SpaceId,
    view_space: SpaceId,
    forward_then_counter: Reversibility,
    counter_then_forward: Reversibility,
}

impl TransformContract {
    /// Creates a bidirectional transform contract.
    #[must_use]
    pub const fn new(
        transform_id: TransformId,
        source_space: SpaceId,
        view_space: SpaceId,
        forward_then_counter: Reversibility,
        counter_then_forward: Reversibility,
    ) -> Self {
        Self {
            transform_id,
            source_space,
            view_space,
            forward_then_counter,
            counter_then_forward,
        }
    }

    /// Returns the contract identity.
    #[must_use]
    pub const fn transform_id(&self) -> &TransformId {
        &self.transform_id
    }

    /// Returns the source-space identity.
    #[must_use]
    pub const fn source_space(&self) -> &SpaceId {
        &self.source_space
    }

    /// Returns the projected view-space identity.
    #[must_use]
    pub const fn view_space(&self) -> &SpaceId {
        &self.view_space
    }

    /// Returns the forward-then-counter reversibility requirement.
    #[must_use]
    pub const fn forward_then_counter(&self) -> Reversibility {
        self.forward_then_counter
    }

    /// Returns the counter-then-forward reversibility requirement.
    #[must_use]
    pub const fn counter_then_forward(&self) -> Reversibility {
        self.counter_then_forward
    }
}

/// Observed residuals for both round trips of a transform pair.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct Involution {
    forward_then_counter: Residual,
    counter_then_forward: Residual,
}

impl Involution {
    /// Creates an involution observation for both composition orders.
    #[must_use]
    pub const fn new(forward_then_counter: Residual, counter_then_forward: Residual) -> Self {
        Self {
            forward_then_counter,
            counter_then_forward,
        }
    }

    /// Creates an exact involution observation.
    #[must_use]
    pub const fn exact() -> Self {
        Self::new(Residual::ZERO, Residual::ZERO)
    }

    /// Returns the residual after forward then counter.
    #[must_use]
    pub const fn forward_then_counter(self) -> Residual {
        self.forward_then_counter
    }

    /// Returns the residual after counter then forward.
    #[must_use]
    pub const fn counter_then_forward(self) -> Residual {
        self.counter_then_forward
    }

    /// Returns whether both round trips are exact.
    #[must_use]
    pub const fn is_exact(self) -> bool {
        self.forward_then_counter.0 == 0 && self.counter_then_forward.0 == 0
    }
}

/// A typed source-to-view projection result.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct Forward {
    projection_id: ProjectionId,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    contract: TransformContract,
    representation_digest: Digest256,
}

impl Forward {
    /// Binds an already computed forward result to its canonical context.
    #[must_use]
    pub fn new(
        projection_id: ProjectionId,
        source: &SourceSnapshot,
        frame: &ReferenceFrame,
        contract: &TransformContract,
        representation_digest: Digest256,
    ) -> Self {
        Self {
            projection_id,
            source_snapshot: source.clone(),
            frame: frame.clone(),
            contract: contract.clone(),
            representation_digest,
        }
    }

    /// Returns the projection identity.
    #[must_use]
    pub const fn projection_id(&self) -> &ProjectionId {
        &self.projection_id
    }

    /// Returns the source snapshot identity.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the frame identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        self.frame.frame_id()
    }

    /// Returns the complete immutable reference-frame revision.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }

    /// Returns the transform contract identity.
    #[must_use]
    pub const fn transform_id(&self) -> &TransformId {
        self.contract.transform_id()
    }

    /// Returns the complete transform contract.
    #[must_use]
    pub const fn contract(&self) -> &TransformContract {
        &self.contract
    }

    /// Returns the digest of the computed representation.
    #[must_use]
    pub const fn representation_digest(&self) -> Digest256 {
        self.representation_digest
    }
}

/// A typed view-to-counterpart projection result.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct Counter {
    projection_id: ProjectionId,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    contract: TransformContract,
    representation_digest: Digest256,
}

impl Counter {
    /// Binds an already computed counter result to its canonical context.
    #[must_use]
    pub fn new(
        projection_id: ProjectionId,
        source: &SourceSnapshot,
        frame: &ReferenceFrame,
        contract: &TransformContract,
        representation_digest: Digest256,
    ) -> Self {
        Self {
            projection_id,
            source_snapshot: source.clone(),
            frame: frame.clone(),
            contract: contract.clone(),
            representation_digest,
        }
    }

    /// Returns the projection identity.
    #[must_use]
    pub const fn projection_id(&self) -> &ProjectionId {
        &self.projection_id
    }

    /// Returns the source snapshot identity.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the frame identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        self.frame.frame_id()
    }

    /// Returns the complete immutable reference-frame revision.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }

    /// Returns the transform contract identity.
    #[must_use]
    pub const fn transform_id(&self) -> &TransformId {
        self.contract.transform_id()
    }

    /// Returns the complete transform contract.
    #[must_use]
    pub const fn contract(&self) -> &TransformContract {
        &self.contract
    }

    /// Returns the digest of the computed representation.
    #[must_use]
    pub const fn representation_digest(&self) -> Digest256 {
        self.representation_digest
    }
}

/// Proof that forward and counter results share one context and meet a contract.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct CrossProof {
    proof_id: CrossProofId,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    contract: TransformContract,
    forward_projection: ProjectionId,
    counter_projection: ProjectionId,
    involution: Involution,
}

impl CrossProof {
    /// Validates and constructs a cross-proof.
    ///
    /// # Errors
    ///
    /// Returns [`CrossProofError`] when source, frame, or transform identities
    /// differ, or when either observed residual exceeds its contract.
    pub fn new(
        proof_id: CrossProofId,
        contract: &TransformContract,
        forward: &Forward,
        counter: &Counter,
        involution: Involution,
    ) -> Result<Self, CrossProofError> {
        if forward.source_snapshot != counter.source_snapshot {
            return Err(CrossProofError::SourceMismatch);
        }
        if forward.frame != counter.frame {
            return Err(CrossProofError::FrameMismatch);
        }
        if &forward.contract != contract || &counter.contract != contract {
            return Err(CrossProofError::TransformMismatch);
        }
        if !contract
            .forward_then_counter
            .accepts(involution.forward_then_counter)
        {
            return Err(CrossProofError::ForwardCounterResidualOutsideContract);
        }
        if !contract
            .counter_then_forward
            .accepts(involution.counter_then_forward)
        {
            return Err(CrossProofError::CounterForwardResidualOutsideContract);
        }

        Ok(Self {
            proof_id,
            source_snapshot: forward.source_snapshot.clone(),
            frame: forward.frame.clone(),
            contract: contract.clone(),
            forward_projection: forward.projection_id.clone(),
            counter_projection: counter.projection_id.clone(),
            involution,
        })
    }

    /// Returns the proof identity.
    #[must_use]
    pub const fn proof_id(&self) -> &CrossProofId {
        &self.proof_id
    }

    /// Returns the shared source snapshot identity.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the shared frame identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        self.frame.frame_id()
    }

    /// Returns the complete shared reference-frame revision.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }

    /// Returns the shared transform identity.
    #[must_use]
    pub const fn transform_id(&self) -> &TransformId {
        self.contract.transform_id()
    }

    /// Returns the complete shared transform contract.
    #[must_use]
    pub const fn contract(&self) -> &TransformContract {
        &self.contract
    }

    /// Returns the forward projection identity.
    #[must_use]
    pub const fn forward_projection(&self) -> &ProjectionId {
        &self.forward_projection
    }

    /// Returns the counter projection identity.
    #[must_use]
    pub const fn counter_projection(&self) -> &ProjectionId {
        &self.counter_projection
    }

    /// Returns both round-trip residuals.
    #[must_use]
    pub const fn involution(&self) -> Involution {
        self.involution
    }
}

/// Structural inconsistency while constructing a cross-proof.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CrossProofError {
    /// Forward and counter refer to different source snapshots.
    SourceMismatch,
    /// Forward and counter refer to different frame revisions.
    FrameMismatch,
    /// A projection does not refer to the supplied transform contract.
    TransformMismatch,
    /// The forward-then-counter residual exceeds the contract.
    ForwardCounterResidualOutsideContract,
    /// The counter-then-forward residual exceeds the contract.
    CounterForwardResidualOutsideContract,
}

impl fmt::Display for CrossProofError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::SourceMismatch => formatter.write_str("forward and counter sources differ"),
            Self::FrameMismatch => formatter.write_str("forward and counter frames differ"),
            Self::TransformMismatch => {
                formatter.write_str("projection and transform contract differ")
            }
            Self::ForwardCounterResidualOutsideContract => {
                formatter.write_str("forward-counter residual is outside the contract")
            }
            Self::CounterForwardResidualOutsideContract => {
                formatter.write_str("counter-forward residual is outside the contract")
            }
        }
    }
}

impl Error for CrossProofError {}

/// Materialized semantic object produced by a counter projection.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct CounterObject {
    object_id: ObjectId,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    contract: TransformContract,
    counter_projection: ProjectionId,
    representation_digest: Digest256,
    cross_proof: CrossProofId,
}

impl CounterObject {
    /// Binds a counter representation to the cross-proof that covers it.
    ///
    /// # Errors
    ///
    /// Returns [`CounterObjectError::ProofContextMismatch`] when the supplied
    /// proof does not cover the counter projection and its complete context.
    pub fn from_cross_proof(
        object_id: ObjectId,
        counter: &Counter,
        proof: &CrossProof,
    ) -> Result<Self, CounterObjectError> {
        if counter.projection_id != proof.counter_projection
            || counter.source_snapshot != proof.source_snapshot
            || counter.frame != proof.frame
            || counter.contract != proof.contract
        {
            return Err(CounterObjectError::ProofContextMismatch);
        }

        Ok(Self {
            object_id,
            source_snapshot: counter.source_snapshot.clone(),
            frame: counter.frame.clone(),
            contract: counter.contract.clone(),
            counter_projection: counter.projection_id.clone(),
            representation_digest: counter.representation_digest,
            cross_proof: proof.proof_id.clone(),
        })
    }

    /// Returns the counter-object identity.
    #[must_use]
    pub const fn object_id(&self) -> &ObjectId {
        &self.object_id
    }

    /// Returns the immutable source snapshot identity.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the frame identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        self.frame.frame_id()
    }

    /// Returns the complete reference-frame revision.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }

    /// Returns the transform contract identity.
    #[must_use]
    pub const fn transform_id(&self) -> &TransformId {
        self.contract.transform_id()
    }

    /// Returns the complete transform contract.
    #[must_use]
    pub const fn contract(&self) -> &TransformContract {
        &self.contract
    }

    /// Returns the counter projection identity.
    #[must_use]
    pub const fn counter_projection(&self) -> &ProjectionId {
        &self.counter_projection
    }

    /// Returns the representation digest.
    #[must_use]
    pub const fn representation_digest(&self) -> Digest256 {
        self.representation_digest
    }

    /// Returns the cross-proof identity.
    #[must_use]
    pub const fn cross_proof(&self) -> &CrossProofId {
        &self.cross_proof
    }
}

/// Structural inconsistency while constructing a counter object.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CounterObjectError {
    /// The supplied proof does not cover the supplied counter result.
    ProofContextMismatch,
}

impl fmt::Display for CounterObjectError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ProofContextMismatch => {
                formatter.write_str("cross-proof does not cover the counter result")
            }
        }
    }
}

impl Error for CounterObjectError {}
