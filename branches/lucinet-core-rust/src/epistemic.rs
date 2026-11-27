//! Claim-first epistemic contracts and effect-free promotion gates.
//!
//! The types in this module keep provenance, contest state, assessment,
//! evidence, witnesses, decisions, commits, and effects on separate axes. They
//! perform no I/O and grant no external authority.

use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, BTreeSet},
    error::Error,
    fmt,
};

/// Provenance basis of a claim.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum ClaimBasis {
    /// Provenance basis has not yet been established.
    Unknown,
    /// Directly observed under a bound observation contract.
    Observed,
    /// Reported by a named source but not independently observed here.
    Reported,
    /// Introduced by an explicit definition.
    Defined,
    /// Derived through a named derivation contract.
    Derived,
    /// Assumed inside a bounded argument or model.
    Assumed,
    /// Proposed as a revisable hypothesis.
    Hypothesis,
}

impl ClaimBasis {
    /// Returns the stable contract label.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Unknown => "UNKNOWN",
            Self::Observed => "OBSERVED",
            Self::Reported => "REPORTED",
            Self::Defined => "DEFINED",
            Self::Derived => "DERIVED",
            Self::Assumed => "ASSUMED",
            Self::Hypothesis => "HYPOTHESIS",
        }
    }
}

/// Whether material alternatives to a claim are currently contested.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum ContestState {
    /// Whether a material contest exists has not been resolved.
    Unknown,
    /// No material contest is registered in the bound context.
    Uncontested,
    /// At least one material conflict or alternative is registered.
    Contested,
}

impl ContestState {
    /// Returns the stable contract label.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Unknown => "UNKNOWN",
            Self::Uncontested => "UNCONTESTED",
            Self::Contested => "CONTESTED",
        }
    }
}

/// Current assessment of a claim in one context.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum ClaimAssessment {
    /// Available information does not resolve the claim.
    Unknown,
    /// The exact claim satisfies its bound sufficiency contract.
    Supported,
    /// The exact claim is refuted by bound evidence.
    Refuted,
    /// Material supporting and refuting records remain unresolved.
    Conflict,
}

impl ClaimAssessment {
    /// Returns the stable contract label.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Unknown => "UNKNOWN",
            Self::Supported => "SUPPORTED",
            Self::Refuted => "REFUTED",
            Self::Conflict => "CONFLICT",
        }
    }
}

/// Explicit knowledge state that never turns missing information into a value.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Knowledge<T> {
    /// A value is bound by the surrounding contract.
    Known(T),
    /// No current value is established.
    Unknown,
}

/// Outcome of one required validation check.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum RequirementOutcome {
    /// The requirement was positively established.
    Satisfied,
    /// The requirement was tested and failed.
    Failed,
    /// The requirement could not be resolved.
    Unknown,
    /// Material records disagree about the requirement.
    Conflict,
}

impl RequirementOutcome {
    const fn label(self) -> &'static str {
        match self {
            Self::Satisfied => "SATISFIED",
            Self::Failed => "FAILED",
            Self::Unknown => "UNKNOWN",
            Self::Conflict => "CONFLICT",
        }
    }
}

/// Direction in which an evidence binding bears on one exact claim.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum EvidenceDirection {
    /// Direction relative to the claim is unresolved.
    Unknown,
    /// Supports the bound claim.
    Supports,
    /// Refutes the bound claim.
    Refutes,
    /// Is relevant context but does not resolve the claim.
    Neutral,
}

impl EvidenceDirection {
    const fn label(self) -> &'static str {
        match self {
            Self::Unknown => "UNKNOWN",
            Self::Supports => "SUPPORTS",
            Self::Refutes => "REFUTES",
            Self::Neutral => "NEUTRAL",
        }
    }
}

/// Domain-neutral identity of one predeclared control requirement.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct ControlId(String);

impl ControlId {
    /// Creates a visible control identity. Domain adapters own its semantics.
    ///
    /// # Errors
    ///
    /// Rejects an empty identity.
    pub fn new(value: impl Into<String>) -> Result<Self, EpistemicError> {
        let value = value.into();
        require_visible(&[&value])?;
        Ok(Self(value))
    }

    /// Stable domain-defined label.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// A claim created before evidence is evaluated.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimContract {
    claim_id: String,
    context_id: String,
    sufficiency_contract_id: String,
    statement: String,
    basis: ClaimBasis,
    contest: ContestState,
    assessment: ClaimAssessment,
    evidence_ceiling: String,
    remaining_unknowns: Vec<String>,
}

impl ClaimContract {
    /// Creates a claim only from a complete claim-first address.
    ///
    /// # Errors
    ///
    /// Returns [`EpistemicError::EmptyField`] for any invisible required field
    /// or unknown entry.
    pub fn new(fields: ClaimContractFields) -> Result<Self, EpistemicError> {
        require_visible(&[
            &fields.claim_id,
            &fields.context_id,
            &fields.sufficiency_contract_id,
            &fields.statement,
            &fields.evidence_ceiling,
        ])?;
        require_visible(&fields.remaining_unknowns.iter().collect::<Vec<_>>())?;
        Ok(Self {
            claim_id: fields.claim_id,
            context_id: fields.context_id,
            sufficiency_contract_id: fields.sufficiency_contract_id,
            statement: fields.statement,
            basis: fields.basis,
            contest: fields.contest,
            assessment: fields.assessment,
            evidence_ceiling: fields.evidence_ceiling,
            remaining_unknowns: fields.remaining_unknowns,
        })
    }

    /// Claim identity.
    #[must_use]
    pub fn claim_id(&self) -> &str {
        &self.claim_id
    }

    /// Context identity.
    #[must_use]
    pub fn context_id(&self) -> &str {
        &self.context_id
    }

    /// Sufficiency-contract identity.
    #[must_use]
    pub fn sufficiency_contract_id(&self) -> &str {
        &self.sufficiency_contract_id
    }

    /// Exact claim statement.
    #[must_use]
    pub fn statement(&self) -> &str {
        &self.statement
    }

    /// Claim provenance basis.
    #[must_use]
    pub const fn basis(&self) -> ClaimBasis {
        self.basis
    }

    /// Contest state.
    #[must_use]
    pub const fn contest(&self) -> ContestState {
        self.contest
    }

    /// Current claim assessment.
    #[must_use]
    pub const fn assessment(&self) -> ClaimAssessment {
        self.assessment
    }

    /// Maximum claim allowed by the contract.
    #[must_use]
    pub fn evidence_ceiling(&self) -> &str {
        &self.evidence_ceiling
    }

    /// Material unknowns preserved on the claim.
    #[must_use]
    pub fn remaining_unknowns(&self) -> &[String] {
        &self.remaining_unknowns
    }
}

/// Construction fields for [`ClaimContract`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimContractFields {
    /// Stable claim identity.
    pub claim_id: String,
    /// Complete context identity.
    pub context_id: String,
    /// Sufficiency-contract identity selected before evaluation.
    pub sufficiency_contract_id: String,
    /// Exact proposition, not an unconstrained commentary field.
    pub statement: String,
    /// Provenance basis.
    pub basis: ClaimBasis,
    /// Contest state.
    pub contest: ContestState,
    /// Current assessment.
    pub assessment: ClaimAssessment,
    /// Maximum claim allowed by the contract.
    pub evidence_ceiling: String,
    /// Material unresolved facts.
    pub remaining_unknowns: Vec<String>,
}

/// Immutable observation address, including an event-record commitment.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ObservationRecord {
    observation_id: String,
    source_id: String,
    referent_id: String,
    event_id: String,
    event_record_digest: String,
    content_id: String,
    observer_projection_id: String,
    context_id: String,
    observed_at: String,
}

impl ObservationRecord {
    /// Creates a complete observation address.
    ///
    /// # Errors
    ///
    /// Returns [`EpistemicError::EmptyField`] when any coordinate is invisible.
    pub fn new(fields: ObservationRecordFields) -> Result<Self, EpistemicError> {
        require_visible(&[
            &fields.observation_id,
            &fields.source_id,
            &fields.referent_id,
            &fields.event_id,
            &fields.event_record_digest,
            &fields.content_id,
            &fields.observer_projection_id,
            &fields.context_id,
            &fields.observed_at,
        ])?;
        Ok(Self {
            observation_id: fields.observation_id,
            source_id: fields.source_id,
            referent_id: fields.referent_id,
            event_id: fields.event_id,
            event_record_digest: fields.event_record_digest,
            content_id: fields.content_id,
            observer_projection_id: fields.observer_projection_id,
            context_id: fields.context_id,
            observed_at: fields.observed_at,
        })
    }

    /// Observation identity.
    #[must_use]
    pub fn observation_id(&self) -> &str {
        &self.observation_id
    }

    /// Complete observation context identity.
    #[must_use]
    pub fn context_id(&self) -> &str {
        &self.context_id
    }

    /// Event-record digest; event identity alone need not commit every field.
    #[must_use]
    pub fn event_record_digest(&self) -> &str {
        &self.event_record_digest
    }

    /// Source identity.
    #[must_use]
    pub fn source_id(&self) -> &str {
        &self.source_id
    }

    /// Referent identity.
    #[must_use]
    pub fn referent_id(&self) -> &str {
        &self.referent_id
    }

    /// Event identity.
    #[must_use]
    pub fn event_id(&self) -> &str {
        &self.event_id
    }

    /// Content identity.
    #[must_use]
    pub fn content_id(&self) -> &str {
        &self.content_id
    }

    /// Observer/projection identity.
    #[must_use]
    pub fn observer_projection_id(&self) -> &str {
        &self.observer_projection_id
    }

    /// Observation coordinate in the bound time basis.
    #[must_use]
    pub fn observed_at(&self) -> &str {
        &self.observed_at
    }
}

/// Construction fields for [`ObservationRecord`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ObservationRecordFields {
    /// Observation identity.
    pub observation_id: String,
    /// Source lineage identity.
    pub source_id: String,
    /// Object or referent identity.
    pub referent_id: String,
    /// Event identity.
    pub event_id: String,
    /// Digest of the complete event record.
    pub event_record_digest: String,
    /// Observed content identity.
    pub content_id: String,
    /// Observer and projection identity.
    pub observer_projection_id: String,
    /// Complete context identity.
    pub context_id: String,
    /// Time coordinate and basis.
    pub observed_at: String,
}

/// Immutable evidence artifact referring to one observation.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvidenceRecord {
    evidence_id: String,
    observation_id: String,
    artifact_digest: String,
    provenance_id: String,
}

impl EvidenceRecord {
    /// Creates an immutable evidence artifact address.
    ///
    /// # Errors
    ///
    /// Returns [`EpistemicError::EmptyField`] for incomplete coordinates.
    pub fn new(
        evidence_id: impl Into<String>,
        observation_id: impl Into<String>,
        artifact_digest: impl Into<String>,
        provenance_id: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let record = Self {
            evidence_id: evidence_id.into(),
            observation_id: observation_id.into(),
            artifact_digest: artifact_digest.into(),
            provenance_id: provenance_id.into(),
        };
        require_visible(&[
            &record.evidence_id,
            &record.observation_id,
            &record.artifact_digest,
            &record.provenance_id,
        ])?;
        Ok(record)
    }

    /// Evidence identity.
    #[must_use]
    pub fn evidence_id(&self) -> &str {
        &self.evidence_id
    }

    /// Observation identity referenced by this evidence.
    #[must_use]
    pub fn observation_id(&self) -> &str {
        &self.observation_id
    }

    /// Artifact-integrity digest.
    #[must_use]
    pub fn artifact_digest(&self) -> &str {
        &self.artifact_digest
    }

    /// Provenance-chain identity.
    #[must_use]
    pub fn provenance_id(&self) -> &str {
        &self.provenance_id
    }
}

/// Required evidence checks kept separate from claim assessment.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct EvidenceChecks {
    /// Artifact integrity.
    integrity: RequirementOutcome,
    /// Provenance completeness.
    provenance: RequirementOutcome,
    /// Relevance to the exact claim.
    relevance: RequirementOutcome,
    /// Discrimination against material alternatives.
    discrimination: RequirementOutcome,
    /// Threshold contract.
    threshold: RequirementOutcome,
    /// Freshness or expiry contract.
    freshness: RequirementOutcome,
    /// Evidence-ceiling compatibility.
    ceiling: RequirementOutcome,
}

impl EvidenceChecks {
    /// Creates the complete, independently addressable check ledger.
    #[must_use]
    pub const fn new(
        integrity: RequirementOutcome,
        provenance: RequirementOutcome,
        relevance: RequirementOutcome,
        discrimination: RequirementOutcome,
        threshold: RequirementOutcome,
        freshness: RequirementOutcome,
        ceiling: RequirementOutcome,
    ) -> Self {
        Self {
            integrity,
            provenance,
            relevance,
            discrimination,
            threshold,
            freshness,
            ceiling,
        }
    }

    fn all_satisfied(self) -> bool {
        [
            self.integrity,
            self.provenance,
            self.relevance,
            self.discrimination,
            self.threshold,
            self.freshness,
            self.ceiling,
        ]
        .into_iter()
        .all(|outcome| outcome == RequirementOutcome::Satisfied)
    }

    fn commitment_parts(self) -> [&'static str; 7] {
        [
            self.integrity.label(),
            self.provenance.label(),
            self.relevance.label(),
            self.discrimination.label(),
            self.threshold.label(),
            self.freshness.label(),
            self.ceiling.label(),
        ]
    }
}

/// Claim- and contract-bound interpretation of one immutable evidence record.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvidenceBinding {
    binding_id: String,
    evidence_id: String,
    claim_id: String,
    context_id: String,
    sufficiency_contract_id: String,
    direction: EvidenceDirection,
    checks: EvidenceChecks,
}

impl EvidenceBinding {
    /// Creates an explicit evidence-to-claim relation.
    ///
    /// # Errors
    ///
    /// Returns [`EpistemicError::EmptyField`] for incomplete coordinates.
    pub fn new(fields: EvidenceBindingFields) -> Result<Self, EpistemicError> {
        require_visible(&[
            &fields.binding_id,
            &fields.evidence_id,
            &fields.claim_id,
            &fields.context_id,
            &fields.sufficiency_contract_id,
        ])?;
        Ok(Self {
            binding_id: fields.binding_id,
            evidence_id: fields.evidence_id,
            claim_id: fields.claim_id,
            context_id: fields.context_id,
            sufficiency_contract_id: fields.sufficiency_contract_id,
            direction: fields.direction,
            checks: fields.checks,
        })
    }

    /// Binding identity.
    #[must_use]
    pub fn binding_id(&self) -> &str {
        &self.binding_id
    }

    /// Evidence identity.
    #[must_use]
    pub fn evidence_id(&self) -> &str {
        &self.evidence_id
    }

    /// Claim identity.
    #[must_use]
    pub fn claim_id(&self) -> &str {
        &self.claim_id
    }

    /// Evidence direction.
    #[must_use]
    pub const fn direction(&self) -> EvidenceDirection {
        self.direction
    }
}

/// Construction fields for [`EvidenceBinding`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvidenceBindingFields {
    /// Binding identity.
    pub binding_id: String,
    /// Bound evidence identity.
    pub evidence_id: String,
    /// Bound claim identity.
    pub claim_id: String,
    /// Bound context identity.
    pub context_id: String,
    /// Bound sufficiency-contract identity.
    pub sufficiency_contract_id: String,
    /// Direction relative to the exact claim.
    pub direction: EvidenceDirection,
    /// Individually resolved validation checks.
    pub checks: EvidenceChecks,
}

/// Predeclared sufficiency criteria for one exact claim and context.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SufficiencyContract {
    contract_id: String,
    claim_id: String,
    context_id: String,
    validator_contract_id: String,
    required_controls: BTreeSet<ControlId>,
    minimum_independent_support: usize,
    evidence_ceiling: String,
}

impl SufficiencyContract {
    /// Creates a sufficiency contract before evidence validation.
    ///
    /// # Errors
    ///
    /// Rejects empty coordinates, duplicate controls, or zero required support.
    pub fn new(fields: SufficiencyContractFields) -> Result<Self, EpistemicError> {
        require_visible(&[
            &fields.contract_id,
            &fields.claim_id,
            &fields.context_id,
            &fields.validator_contract_id,
            &fields.evidence_ceiling,
        ])?;
        if fields.minimum_independent_support == 0 {
            return Err(EpistemicError::InsufficientIndependentEvidence);
        }
        let required_controls = fields
            .required_controls
            .iter()
            .cloned()
            .collect::<BTreeSet<_>>();
        if required_controls.len() != fields.required_controls.len() {
            return Err(EpistemicError::DuplicateControl);
        }
        Ok(Self {
            contract_id: fields.contract_id,
            claim_id: fields.claim_id,
            context_id: fields.context_id,
            validator_contract_id: fields.validator_contract_id,
            required_controls,
            minimum_independent_support: fields.minimum_independent_support,
            evidence_ceiling: fields.evidence_ceiling,
        })
    }

    /// Contract identity.
    #[must_use]
    pub fn contract_id(&self) -> &str {
        &self.contract_id
    }

    /// Validator semantics selected before evidence evaluation.
    #[must_use]
    pub fn validator_contract_id(&self) -> &str {
        &self.validator_contract_id
    }

    /// Required controls.
    #[must_use]
    pub const fn required_controls(&self) -> &BTreeSet<ControlId> {
        &self.required_controls
    }
}

/// Construction fields for [`SufficiencyContract`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SufficiencyContractFields {
    /// Contract identity.
    pub contract_id: String,
    /// Exact claim identity.
    pub claim_id: String,
    /// Complete context identity.
    pub context_id: String,
    /// Named validator whose semantics interpret evidence and controls.
    pub validator_contract_id: String,
    /// Controls that must be resolved positively.
    pub required_controls: Vec<ControlId>,
    /// Minimum number of independent supporting records.
    pub minimum_independent_support: usize,
    /// Maximum claim allowed after satisfaction.
    pub evidence_ceiling: String,
}

/// Result of one control in the exact witness context.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ControlResult {
    kind: ControlId,
    outcome: RequirementOutcome,
    evidence_commitment: String,
}

impl ControlResult {
    /// Creates one explicit control result bound to its evaluation evidence.
    ///
    /// # Errors
    ///
    /// Rejects an empty evidence commitment.
    pub fn new(
        kind: ControlId,
        outcome: RequirementOutcome,
        evidence_commitment: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let result = Self {
            kind,
            outcome,
            evidence_commitment: evidence_commitment.into(),
        };
        require_visible(&[&result.evidence_commitment])?;
        Ok(result)
    }

    /// Control class.
    #[must_use]
    pub const fn kind(&self) -> &ControlId {
        &self.kind
    }

    /// Validation outcome.
    #[must_use]
    pub const fn outcome(&self) -> RequirementOutcome {
        self.outcome
    }

    /// Commitment to the concrete control evaluation.
    #[must_use]
    pub fn evidence_commitment(&self) -> &str {
        &self.evidence_commitment
    }
}

/// Complete inputs to the witness validator.
#[derive(Clone, Copy, Debug)]
pub struct WitnessValidationInput<'a> {
    /// Claim created before evidence evaluation.
    pub claim: &'a ClaimContract,
    /// Sufficiency contract selected by the claim.
    pub sufficiency: &'a SufficiencyContract,
    /// Observation records reachable from evidence.
    pub observations: &'a [ObservationRecord],
    /// Immutable evidence records.
    pub evidence: &'a [EvidenceRecord],
    /// Explicit evidence-to-claim bindings.
    pub bindings: &'a [EvidenceBinding],
    /// Required control outcomes.
    pub controls: &'a [ControlResult],
    /// Claim-bound replay result.
    pub replay: RequirementOutcome,
    /// Commitment to the exact replay execution and outputs.
    pub replay_commitment: &'a str,
    /// Artifact-integrity replay result.
    pub artifact_integrity: RequirementOutcome,
    /// Commitment to the exact integrity verification record.
    pub artifact_integrity_commitment: &'a str,
    /// Material unknowns discovered during validation.
    pub material_unknowns: &'a [String],
}

/// Sealed structural result under one exact named validator contract.
///
/// The type prevents post-validation substitution. The domain adapter remains
/// responsible for the authority and truth of the supplied validator records.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ValidatedWitness {
    witness_id: String,
    claim_id: String,
    context_id: String,
    sufficiency_contract_id: String,
    claim_commitment: String,
    sufficiency_commitment: String,
    evidence_ids: Vec<String>,
}

impl ValidatedWitness {
    /// Witness identity committing the validated inputs.
    #[must_use]
    pub fn witness_id(&self) -> &str {
        &self.witness_id
    }

    /// Exact claim identity.
    #[must_use]
    pub fn claim_id(&self) -> &str {
        &self.claim_id
    }

    /// Exact context identity.
    #[must_use]
    pub fn context_id(&self) -> &str {
        &self.context_id
    }

    /// Sufficiency contract that was satisfied.
    #[must_use]
    pub fn sufficiency_contract_id(&self) -> &str {
        &self.sufficiency_contract_id
    }

    /// Distinct evidence identities covered by the witness.
    #[must_use]
    pub fn evidence_ids(&self) -> &[String] {
        &self.evidence_ids
    }
}

/// Validates the full capture-to-promotion chain and returns a sealed witness.
///
/// `UNKNOWN`, `CONFLICT`, duplicate support, missing controls, stale evidence,
/// and cross-wired identities all fail closed.
///
/// # Errors
///
/// Returns [`EpistemicError`] for the first structural or epistemic violation.
pub fn validate_witness(
    input: WitnessValidationInput<'_>,
) -> Result<ValidatedWitness, EpistemicError> {
    validate_claim_and_replay(input)?;
    validate_controls(input.sufficiency, input.controls)?;
    let observation_origins = validate_observations(input.claim, input.observations)?;
    let evidence_origins = validate_evidence(input.evidence, &observation_origins)?;
    let mut supporting_ids = validate_bindings(
        input.claim,
        input.sufficiency,
        input.bindings,
        &evidence_origins,
    )?;
    supporting_ids.sort();
    let claim_commitment = claim_commitment(input.claim);
    let sufficiency_commitment = sufficiency_commitment(input.sufficiency);
    let mut observation_commitments = input
        .observations
        .iter()
        .map(observation_commitment)
        .collect::<Vec<_>>();
    let mut evidence_commitments = input
        .evidence
        .iter()
        .map(evidence_commitment)
        .collect::<Vec<_>>();
    let mut binding_commitments = input
        .bindings
        .iter()
        .map(binding_commitment)
        .collect::<Vec<_>>();
    let mut control_commitments = input
        .controls
        .iter()
        .map(control_commitment)
        .collect::<Vec<_>>();
    observation_commitments.sort();
    evidence_commitments.sort();
    binding_commitments.sort();
    control_commitments.sort();
    let mut commitment_parts = vec![
        claim_commitment.clone(),
        sufficiency_commitment.clone(),
        input.replay.label().to_owned(),
        input.replay_commitment.to_owned(),
        input.artifact_integrity.label().to_owned(),
        input.artifact_integrity_commitment.to_owned(),
    ];
    commitment_parts.extend(observation_commitments);
    commitment_parts.extend(evidence_commitments);
    commitment_parts.extend(binding_commitments);
    commitment_parts.extend(control_commitments);
    commitment_parts.extend(input.material_unknowns.iter().cloned());
    let commitment_refs = commitment_parts
        .iter()
        .map(String::as_str)
        .collect::<Vec<_>>();
    let witness_id = format!(
        "lucinet:witness-contract-v1:sha256:{}",
        digest_parts("lucinet.witness-contract.v1", &commitment_refs)
    );
    Ok(ValidatedWitness {
        witness_id,
        claim_id: input.claim.claim_id.clone(),
        context_id: input.claim.context_id.clone(),
        sufficiency_contract_id: input.sufficiency.contract_id.clone(),
        claim_commitment,
        sufficiency_commitment,
        evidence_ids: supporting_ids,
    })
}

fn validate_claim_and_replay(input: WitnessValidationInput<'_>) -> Result<(), EpistemicError> {
    let claim = input.claim;
    let contract = input.sufficiency;
    if claim.claim_id != contract.claim_id
        || claim.context_id != contract.context_id
        || claim.sufficiency_contract_id != contract.contract_id
        || claim.evidence_ceiling != contract.evidence_ceiling
    {
        return Err(EpistemicError::CrossWiredIdentity);
    }
    if claim.basis == ClaimBasis::Unknown
        || claim.contest != ContestState::Uncontested
        || claim.assessment != ClaimAssessment::Unknown
    {
        return Err(EpistemicError::UnresolvedClaim);
    }
    if !claim.remaining_unknowns.is_empty() || !input.material_unknowns.is_empty() {
        return Err(EpistemicError::MaterialUnknown);
    }
    if input.replay != RequirementOutcome::Satisfied {
        return Err(EpistemicError::ReplayNotValidated);
    }
    if input.artifact_integrity != RequirementOutcome::Satisfied {
        return Err(EpistemicError::ArtifactIntegrityNotValidated);
    }
    if input.replay_commitment.trim().is_empty()
        || input.artifact_integrity_commitment.trim().is_empty()
    {
        return Err(EpistemicError::EmptyField);
    }
    Ok(())
}

fn validate_controls(
    contract: &SufficiencyContract,
    controls: &[ControlResult],
) -> Result<(), EpistemicError> {
    let mut control_kinds = BTreeSet::new();
    for control in controls {
        if !control_kinds.insert(control.kind.clone()) {
            return Err(EpistemicError::DuplicateControl);
        }
        if control.outcome != RequirementOutcome::Satisfied {
            return Err(EpistemicError::RequiredCheckNotSatisfied);
        }
    }
    if contract.required_controls != control_kinds {
        return Err(EpistemicError::MissingControl);
    }
    Ok(())
}

fn validate_observations(
    claim: &ClaimContract,
    observations: &[ObservationRecord],
) -> Result<BTreeMap<String, String>, EpistemicError> {
    let mut observation_origins = BTreeMap::new();
    let mut event_records = BTreeMap::new();
    let mut complete_records = BTreeSet::new();
    for observation in observations {
        if observation_origins.contains_key(&observation.observation_id) {
            return Err(EpistemicError::DuplicateObservation);
        }
        if observation.context_id != claim.context_id {
            return Err(EpistemicError::CrossWiredIdentity);
        }
        if let Some(existing) = event_records.get(&observation.event_id) {
            if existing != &observation.event_record_digest {
                return Err(EpistemicError::ConflictingEventRecord);
            }
        } else {
            event_records.insert(
                observation.event_id.clone(),
                observation.event_record_digest.clone(),
            );
        }
        let complete_record = (
            observation.source_id.as_str(),
            observation.referent_id.as_str(),
            observation.event_id.as_str(),
            observation.event_record_digest.as_str(),
            observation.content_id.as_str(),
            observation.observer_projection_id.as_str(),
            observation.context_id.as_str(),
            observation.observed_at.as_str(),
        );
        if !complete_records.insert(complete_record) {
            return Err(EpistemicError::DuplicateObservation);
        }
        let origin = digest_parts(
            "lucinet.observation-origin.v1",
            &[
                observation.event_id.as_str(),
                observation.event_record_digest.as_str(),
            ],
        );
        observation_origins.insert(observation.observation_id.clone(), origin);
    }
    Ok(observation_origins)
}

fn validate_evidence(
    evidence: &[EvidenceRecord],
    observation_origins: &BTreeMap<String, String>,
) -> Result<BTreeMap<String, String>, EpistemicError> {
    let mut evidence_origins = BTreeMap::new();
    let mut record_keys = BTreeSet::new();
    for record in evidence {
        let Some(observation_origin) = observation_origins.get(&record.observation_id) else {
            return Err(EpistemicError::MissingObservation);
        };
        let record_key = (
            record.observation_id.as_str(),
            record.artifact_digest.as_str(),
            record.provenance_id.as_str(),
        );
        if evidence_origins.contains_key(&record.evidence_id) || !record_keys.insert(record_key) {
            return Err(EpistemicError::DuplicateEvidence);
        }
        let origin = digest_parts("lucinet.evidence-origin.v1", &[observation_origin.as_str()]);
        evidence_origins.insert(record.evidence_id.clone(), origin);
    }
    Ok(evidence_origins)
}

fn validate_bindings(
    claim: &ClaimContract,
    contract: &SufficiencyContract,
    bindings: &[EvidenceBinding],
    evidence_origins: &BTreeMap<String, String>,
) -> Result<Vec<String>, EpistemicError> {
    let mut binding_ids = BTreeSet::new();
    let mut bound_evidence = BTreeSet::new();
    let mut independent_support = BTreeSet::new();
    let mut supporting_ids = Vec::new();
    for binding in bindings {
        if !binding_ids.insert(binding.binding_id.clone())
            || !bound_evidence.insert(binding.evidence_id.clone())
        {
            return Err(EpistemicError::DuplicateEvidence);
        }
        if binding.claim_id != claim.claim_id
            || binding.context_id != claim.context_id
            || binding.sufficiency_contract_id != contract.contract_id
            || !evidence_origins.contains_key(&binding.evidence_id)
        {
            return Err(EpistemicError::CrossWiredIdentity);
        }
        if !binding.checks.all_satisfied() {
            return Err(EpistemicError::RequiredCheckNotSatisfied);
        }
        match binding.direction {
            EvidenceDirection::Unknown => return Err(EpistemicError::MaterialUnknown),
            EvidenceDirection::Supports => {
                let origin = evidence_origins
                    .get(&binding.evidence_id)
                    .ok_or(EpistemicError::CrossWiredIdentity)?;
                if independent_support.insert(origin.clone()) {
                    supporting_ids.push(binding.evidence_id.clone());
                }
            }
            EvidenceDirection::Refutes => return Err(EpistemicError::ConflictingEvidence),
            EvidenceDirection::Neutral => {}
        }
    }
    if independent_support.len() < contract.minimum_independent_support {
        return Err(EpistemicError::InsufficientIndependentEvidence);
    }
    Ok(supporting_ids)
}

fn claim_commitment(claim: &ClaimContract) -> String {
    let mut parts = vec![
        claim.claim_id.as_str(),
        claim.context_id.as_str(),
        claim.sufficiency_contract_id.as_str(),
        claim.statement.as_str(),
        claim.basis.label(),
        claim.contest.label(),
        claim.assessment.label(),
        claim.evidence_ceiling.as_str(),
    ];
    parts.extend(claim.remaining_unknowns.iter().map(String::as_str));
    digest_parts("lucinet.claim-contract.v1", &parts)
}

fn sufficiency_commitment(contract: &SufficiencyContract) -> String {
    let mut parts = vec![
        contract.contract_id.as_str(),
        contract.claim_id.as_str(),
        contract.context_id.as_str(),
        contract.validator_contract_id.as_str(),
        contract.evidence_ceiling.as_str(),
    ];
    let minimum = contract.minimum_independent_support.to_string();
    parts.push(minimum.as_str());
    parts.extend(contract.required_controls.iter().map(ControlId::as_str));
    digest_parts("lucinet.sufficiency-contract.v1", &parts)
}

fn observation_commitment(observation: &ObservationRecord) -> String {
    digest_parts(
        "lucinet.observation-record.v1",
        &[
            observation.observation_id.as_str(),
            observation.source_id.as_str(),
            observation.referent_id.as_str(),
            observation.event_id.as_str(),
            observation.event_record_digest.as_str(),
            observation.content_id.as_str(),
            observation.observer_projection_id.as_str(),
            observation.context_id.as_str(),
            observation.observed_at.as_str(),
        ],
    )
}

fn evidence_commitment(evidence: &EvidenceRecord) -> String {
    digest_parts(
        "lucinet.evidence-record.v1",
        &[
            evidence.evidence_id.as_str(),
            evidence.observation_id.as_str(),
            evidence.artifact_digest.as_str(),
            evidence.provenance_id.as_str(),
        ],
    )
}

fn binding_commitment(binding: &EvidenceBinding) -> String {
    let checks = binding.checks.commitment_parts();
    let mut parts = vec![
        binding.binding_id.as_str(),
        binding.evidence_id.as_str(),
        binding.claim_id.as_str(),
        binding.context_id.as_str(),
        binding.sufficiency_contract_id.as_str(),
        binding.direction.label(),
    ];
    parts.extend(checks);
    digest_parts("lucinet.evidence-binding.v1", &parts)
}

fn control_commitment(control: &ControlResult) -> String {
    digest_parts(
        "lucinet.control-result.v1",
        &[
            control.kind.as_str(),
            control.outcome.label(),
            control.evidence_commitment.as_str(),
        ],
    )
}

/// Promoted claim that can only be constructed from a matching sealed witness.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimPromotion {
    promotion_id: String,
    claim_id: String,
    witness_id: String,
    assessment: ClaimAssessment,
}

impl ClaimPromotion {
    /// Promotes exactly the claim covered by a validated witness.
    ///
    /// # Errors
    ///
    /// Rejects identity mismatch, contested/refuted claims, or material unknowns.
    pub fn from_witness(
        claim: &ClaimContract,
        sufficiency: &SufficiencyContract,
        witness: &ValidatedWitness,
    ) -> Result<Self, EpistemicError> {
        if claim.claim_id != witness.claim_id
            || claim.context_id != witness.context_id
            || claim.sufficiency_contract_id != witness.sufficiency_contract_id
            || sufficiency.contract_id != witness.sufficiency_contract_id
            || claim_commitment(claim) != witness.claim_commitment
            || sufficiency_commitment(sufficiency) != witness.sufficiency_commitment
        {
            return Err(EpistemicError::CrossWiredIdentity);
        }
        if claim.basis == ClaimBasis::Unknown
            || claim.contest != ContestState::Uncontested
            || matches!(
                claim.assessment,
                ClaimAssessment::Refuted | ClaimAssessment::Conflict
            )
        {
            return Err(EpistemicError::UnresolvedClaim);
        }
        if !claim.remaining_unknowns.is_empty() {
            return Err(EpistemicError::MaterialUnknown);
        }
        let promotion_id = format!(
            "lucinet:claim-promotion:sha256:{}",
            digest_parts(
                "lucinet.claim-promotion.v1",
                &[claim.claim_id.as_str(), witness.witness_id.as_str()]
            )
        );
        Ok(Self {
            promotion_id,
            claim_id: claim.claim_id.clone(),
            witness_id: witness.witness_id.clone(),
            assessment: ClaimAssessment::Supported,
        })
    }

    /// Promotion identity.
    #[must_use]
    pub fn promotion_id(&self) -> &str {
        &self.promotion_id
    }

    /// Promoted claim identity.
    #[must_use]
    pub fn claim_id(&self) -> &str {
        &self.claim_id
    }

    /// Witness that authorized the promotion.
    #[must_use]
    pub fn witness_id(&self) -> &str {
        &self.witness_id
    }

    /// Promoted assessment.
    #[must_use]
    pub const fn assessment(&self) -> ClaimAssessment {
        self.assessment
    }
}

/// Time-indexed state that preserves the last observation without guessing now.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TemporalAssessment<T> {
    last_observed_state: T,
    last_observed_at: i64,
    current_time: i64,
    current_inferred_state: Knowledge<T>,
    current_physical_state: Knowledge<T>,
}

impl<T: Clone> TemporalAssessment<T> {
    /// Creates an assessment at the instant of a direct observation.
    #[must_use]
    pub fn observed(state: T, observed_at: i64) -> Self {
        Self {
            last_observed_state: state.clone(),
            last_observed_at: observed_at,
            current_time: observed_at,
            current_inferred_state: Knowledge::Known(state),
            current_physical_state: Knowledge::Unknown,
        }
    }

    /// Advances time without inferring either change or constancy.
    ///
    /// # Errors
    ///
    /// Rejects equal or decreasing time coordinates.
    pub fn advance_time(&self, current_time: i64) -> Result<Self, EpistemicError> {
        if current_time <= self.current_time {
            return Err(EpistemicError::NonAdvancingTime);
        }
        Ok(Self {
            last_observed_state: self.last_observed_state.clone(),
            last_observed_at: self.last_observed_at,
            current_time,
            current_inferred_state: Knowledge::Unknown,
            current_physical_state: Knowledge::Unknown,
        })
    }

    /// Last directly observed state.
    #[must_use]
    pub const fn last_observed_state(&self) -> &T {
        &self.last_observed_state
    }

    /// Current physical state, which becomes unknown after time-only advance.
    #[must_use]
    pub const fn current_physical_state(&self) -> &Knowledge<T> {
        &self.current_physical_state
    }

    /// Current inferred state, never filled by time advance alone.
    #[must_use]
    pub const fn current_inferred_state(&self) -> &Knowledge<T> {
        &self.current_inferred_state
    }

    /// Current time coordinate.
    #[must_use]
    pub const fn current_time(&self) -> i64 {
        self.current_time
    }
}

/// Effect of removing one information component.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RemovalEffect {
    /// Reproducible divergence remains equivalent after removal.
    DivergenceUnchanged,
    /// Reproducible divergence changes or disappears after removal.
    DivergenceChanged,
    /// The removal result is unresolved.
    Unknown,
}

/// Intended role of one component in a minimal information ground.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ComponentDisposition {
    /// Component is claimed necessary.
    Retained,
    /// Component is claimed redundant in the final bound context.
    Removed,
}

/// One final-context removal trial.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InformationComponentTrial {
    ground_contract_commitment: String,
    component_id: String,
    disposition: ComponentDisposition,
    removal_effect: RemovalEffect,
    reproducible: bool,
    loss_witness_id: Option<String>,
    evaluation_commitment: String,
}

impl InformationComponentTrial {
    /// Seals one domain-evaluator trial record without asserting its truth.
    ///
    /// # Errors
    ///
    /// Rejects invisible component or witness identities.
    pub fn new(
        contract: &MinimalGroundContract,
        component_id: impl Into<String>,
        disposition: ComponentDisposition,
        removal_effect: RemovalEffect,
        reproducible: bool,
        loss_witness_id: Option<String>,
        evaluation_commitment: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let component_id = component_id.into();
        let evaluation_commitment = evaluation_commitment.into();
        require_visible(&[&component_id, &evaluation_commitment])?;
        if loss_witness_id
            .as_ref()
            .is_some_and(|value| value.trim().is_empty())
        {
            return Err(EpistemicError::EmptyField);
        }
        Ok(Self {
            ground_contract_commitment: contract.contract_commitment.clone(),
            component_id,
            disposition,
            removal_effect,
            reproducible,
            loss_witness_id,
            evaluation_commitment,
        })
    }
}

/// Sealed structural result for one domain-supplied final-context trial set.
///
/// This prevents trial substitution. The named domain evaluator remains
/// responsible for the truth of the recorded trials and loss witnesses.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MinimalPredictiveGround {
    contract_id: String,
    claim_id: String,
    effect_contract_id: String,
    context_id: String,
    ground_commitment: String,
    retained_components: Vec<String>,
    removed_components: Vec<String>,
}

/// Closed universe and context against which one-minimality is evaluated.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MinimalGroundContract {
    contract_id: String,
    claim_id: String,
    effect_contract_id: String,
    context_id: String,
    evaluator_contract_id: String,
    observation_contract_id: String,
    final_context_digest: String,
    component_universe: BTreeSet<String>,
    contract_commitment: String,
}

/// Complete coordinates for one minimal-ground contract.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MinimalGroundContractFields {
    /// Stable contract identity.
    pub contract_id: String,
    /// Exact claim whose effect is minimized.
    pub claim_id: String,
    /// Exact reproducible-effect contract.
    pub effect_contract_id: String,
    /// Bound execution context.
    pub context_id: String,
    /// Domain evaluator responsible for trial semantics.
    pub evaluator_contract_id: String,
    /// Observation equality and threshold contract.
    pub observation_contract_id: String,
    /// Digest of the final minimized context.
    pub final_context_digest: String,
    /// Closed universe that must receive exactly one removal trial each.
    pub components: Vec<String>,
}

impl MinimalGroundContract {
    /// Declares every component that must receive a final-context trial.
    ///
    /// # Errors
    ///
    /// Rejects empty coordinates, an empty universe, or duplicate components.
    pub fn new(fields: MinimalGroundContractFields) -> Result<Self, EpistemicError> {
        let MinimalGroundContractFields {
            contract_id,
            claim_id,
            effect_contract_id,
            context_id,
            evaluator_contract_id,
            observation_contract_id,
            final_context_digest,
            components,
        } = fields;
        require_visible(&[
            &contract_id,
            &claim_id,
            &effect_contract_id,
            &context_id,
            &evaluator_contract_id,
            &observation_contract_id,
            &final_context_digest,
        ])?;
        require_visible(&components.iter().collect::<Vec<_>>())?;
        let component_count = components.len();
        let component_universe = components.into_iter().collect::<BTreeSet<_>>();
        if component_universe.is_empty() || component_universe.len() != component_count {
            return Err(EpistemicError::DuplicateComponent);
        }
        let mut commitment_parts = vec![
            contract_id.as_str(),
            claim_id.as_str(),
            effect_contract_id.as_str(),
            context_id.as_str(),
            evaluator_contract_id.as_str(),
            observation_contract_id.as_str(),
            final_context_digest.as_str(),
        ];
        commitment_parts.extend(component_universe.iter().map(String::as_str));
        let contract_commitment =
            digest_parts("lucinet.minimal-ground-contract.v1", &commitment_parts);
        Ok(Self {
            contract_id,
            claim_id,
            effect_contract_id,
            context_id,
            evaluator_contract_id,
            observation_contract_id,
            final_context_digest,
            component_universe,
            contract_commitment,
        })
    }
}

impl MinimalPredictiveGround {
    /// Validates one-minimality in the tested final context.
    ///
    /// # Errors
    ///
    /// Rejects duplicates, unresolved trials, unstable results, retained
    /// components without loss witnesses, and removed components that matter.
    pub fn validate(
        contract: &MinimalGroundContract,
        trials: &[InformationComponentTrial],
    ) -> Result<Self, EpistemicError> {
        let mut seen = BTreeSet::new();
        let mut retained = Vec::new();
        let mut removed = Vec::new();
        let mut trial_commitments = Vec::new();
        for trial in trials {
            if trial.ground_contract_commitment != contract.contract_commitment {
                return Err(EpistemicError::CrossWiredIdentity);
            }
            if !seen.insert(trial.component_id.clone()) {
                return Err(EpistemicError::DuplicateComponent);
            }
            if !trial.reproducible || trial.removal_effect == RemovalEffect::Unknown {
                return Err(EpistemicError::RequiredCheckNotSatisfied);
            }
            trial_commitments.push(digest_parts(
                "lucinet.information-component-trial.v1",
                &[
                    trial.ground_contract_commitment.as_str(),
                    trial.component_id.as_str(),
                    match trial.disposition {
                        ComponentDisposition::Retained => "RETAINED",
                        ComponentDisposition::Removed => "REMOVED",
                    },
                    match trial.removal_effect {
                        RemovalEffect::DivergenceUnchanged => "DIVERGENCE_UNCHANGED",
                        RemovalEffect::DivergenceChanged => "DIVERGENCE_CHANGED",
                        RemovalEffect::Unknown => "UNKNOWN",
                    },
                    if trial.reproducible {
                        "REPRODUCIBLE"
                    } else {
                        "NOT_REPRODUCIBLE"
                    },
                    trial.loss_witness_id.as_deref().unwrap_or("NONE"),
                    trial.evaluation_commitment.as_str(),
                ],
            ));
            match trial.disposition {
                ComponentDisposition::Retained
                    if trial.removal_effect == RemovalEffect::DivergenceChanged
                        && trial.loss_witness_id.is_some() =>
                {
                    retained.push(trial.component_id.clone());
                }
                ComponentDisposition::Removed
                    if trial.removal_effect == RemovalEffect::DivergenceUnchanged
                        && trial.loss_witness_id.is_none() =>
                {
                    removed.push(trial.component_id.clone());
                }
                ComponentDisposition::Retained | ComponentDisposition::Removed => {
                    return Err(EpistemicError::InvalidMinimalGround);
                }
            }
        }
        if seen != contract.component_universe {
            return Err(EpistemicError::InvalidMinimalGround);
        }
        trial_commitments.sort();
        retained.sort();
        removed.sort();
        let trial_set_commitment = trial_commitments.join("|");
        let mut ground_parts = vec![contract.contract_commitment.as_str(), "RETAINED"];
        ground_parts.extend(retained.iter().map(String::as_str));
        ground_parts.push("REMOVED");
        ground_parts.extend(removed.iter().map(String::as_str));
        ground_parts.extend(["TRIAL_SET", trial_set_commitment.as_str()]);
        Ok(Self {
            contract_id: contract.contract_id.clone(),
            claim_id: contract.claim_id.clone(),
            effect_contract_id: contract.effect_contract_id.clone(),
            context_id: contract.context_id.clone(),
            ground_commitment: digest_parts("lucinet.minimal-predictive-ground.v1", &ground_parts),
            retained_components: retained,
            removed_components: removed,
        })
    }

    /// Components with reproducible final-context loss witnesses.
    #[must_use]
    pub fn retained_components(&self) -> &[String] {
        &self.retained_components
    }

    /// Components shown redundant by their recorded removal trials.
    #[must_use]
    pub fn removed_components(&self) -> &[String] {
        &self.removed_components
    }

    /// Commitment to the exact contract and complete final-context trial set.
    #[must_use]
    pub fn ground_commitment(&self) -> &str {
        &self.ground_commitment
    }
}

/// Local component states plus their global relation and one projection.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RelationalState {
    local_states: Vec<(String, String)>,
    global_relation_digest: String,
    projection_digest: String,
}

impl RelationalState {
    /// Creates a relational state without inventing an extra physical object.
    ///
    /// # Errors
    ///
    /// Rejects empty/duplicate component identities or incomplete digests.
    pub fn new(
        mut local_states: Vec<(String, String)>,
        global_relation_digest: impl Into<String>,
        projection_digest: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let global_relation_digest = global_relation_digest.into();
        let projection_digest = projection_digest.into();
        require_visible(&[&global_relation_digest, &projection_digest])?;
        let mut ids = BTreeSet::new();
        for (id, state) in &local_states {
            require_visible(&[id, state])?;
            if !ids.insert(id.as_str()) {
                return Err(EpistemicError::DuplicateComponent);
            }
        }
        local_states.sort();
        Ok(Self {
            local_states,
            global_relation_digest,
            projection_digest,
        })
    }
}

/// Orthogonal change ledger between two relational states.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RelationalChange {
    /// At least one local component changed.
    pub local_state_changed: bool,
    /// The global/composite relation changed.
    pub global_relation_changed: bool,
    /// The projection changed.
    pub projection_changed: bool,
}

/// Compares local and global information without conflating projection identity.
#[must_use]
pub fn compare_relational_states(
    before: &RelationalState,
    after: &RelationalState,
) -> RelationalChange {
    RelationalChange {
        local_state_changed: before.local_states != after.local_states,
        global_relation_changed: before.global_relation_digest != after.global_relation_digest,
        projection_changed: before.projection_digest != after.projection_digest,
    }
}

/// Effect-free decision derived from a promoted claim.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DecisionRecord {
    decision_id: String,
    promotion_id: String,
    proposed_action: String,
    decision_commitment: String,
}

impl DecisionRecord {
    /// Creates a decision without granting commit authority.
    ///
    /// # Errors
    ///
    /// Rejects empty decision identity or action.
    pub fn from_promotion(
        decision_id: impl Into<String>,
        promotion: &ClaimPromotion,
        proposed_action: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let decision_id = decision_id.into();
        let promotion_id = promotion.promotion_id.clone();
        let proposed_action = proposed_action.into();
        let decision_commitment = digest_parts(
            "lucinet.decision-record.v1",
            &[
                decision_id.as_str(),
                promotion_id.as_str(),
                proposed_action.as_str(),
            ],
        );
        let decision = Self {
            decision_id,
            promotion_id,
            proposed_action,
            decision_commitment,
        };
        require_visible(&[&decision.decision_id, &decision.proposed_action])?;
        Ok(decision)
    }

    /// Decision identity.
    #[must_use]
    pub fn decision_id(&self) -> &str {
        &self.decision_id
    }

    /// Exact promoted claim and action commitment.
    #[must_use]
    pub fn decision_commitment(&self) -> &str {
        &self.decision_commitment
    }
}

/// Immutable record of a domain verifier's authorization for one decision.
///
/// This is not an operating-system capability and does not itself establish
/// that the named verifier had external authority. Effectful adapters must
/// validate that domain fact before constructing or consuming this record.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommitAuthorization {
    commit_id: String,
    decision_id: String,
    decision_commitment: String,
    authority_scope: String,
    authority_verifier_id: String,
    verification_evidence_id: String,
    authorization_commitment: String,
}

impl CommitAuthorization {
    /// Records a positive domain-verifier outcome for one exact decision.
    ///
    /// This performs no effect and cannot be consumed as an authority
    /// capability without separate domain verification.
    ///
    /// # Errors
    ///
    /// Rejects empty commit or authority coordinates.
    pub fn authorize(
        commit_id: impl Into<String>,
        decision: &DecisionRecord,
        authority_scope: impl Into<String>,
        authority_verifier_id: impl Into<String>,
        verification_evidence_id: impl Into<String>,
        verification: RequirementOutcome,
    ) -> Result<Self, EpistemicError> {
        if verification != RequirementOutcome::Satisfied {
            return Err(EpistemicError::RequiredCheckNotSatisfied);
        }
        let commit_id = commit_id.into();
        let decision_id = decision.decision_id.clone();
        let decision_commitment = decision.decision_commitment.clone();
        let authority_scope = authority_scope.into();
        let authority_verifier_id = authority_verifier_id.into();
        let verification_evidence_id = verification_evidence_id.into();
        require_visible(&[
            &commit_id,
            &authority_scope,
            &authority_verifier_id,
            &verification_evidence_id,
        ])?;
        let authorization_commitment = digest_parts(
            "lucinet.commit-authorization.v1",
            &[
                commit_id.as_str(),
                decision_id.as_str(),
                decision_commitment.as_str(),
                authority_scope.as_str(),
                authority_verifier_id.as_str(),
                verification_evidence_id.as_str(),
            ],
        );
        let authorization = Self {
            commit_id,
            decision_id,
            decision_commitment,
            authority_scope,
            authority_verifier_id,
            verification_evidence_id,
            authorization_commitment,
        };
        Ok(authorization)
    }

    /// Commit identity.
    #[must_use]
    pub fn commit_id(&self) -> &str {
        &self.commit_id
    }

    /// Decision identity receiving authority.
    #[must_use]
    pub fn decision_id(&self) -> &str {
        &self.decision_id
    }

    /// Commitment to the exact decision and domain-verifier record.
    #[must_use]
    pub fn authorization_commitment(&self) -> &str {
        &self.authorization_commitment
    }

    /// Domain verifier named by this immutable attestation record.
    #[must_use]
    pub fn authority_verifier_id(&self) -> &str {
        &self.authority_verifier_id
    }

    /// Domain evidence record asserted for the authority check.
    #[must_use]
    pub fn verification_evidence_id(&self) -> &str {
        &self.verification_evidence_id
    }

    /// Verifies that this authorization names the exact decision content.
    #[must_use]
    pub fn authorizes(&self, decision: &DecisionRecord) -> bool {
        self.decision_id == decision.decision_id
            && self.decision_commitment == decision.decision_commitment
    }
}

/// Post-effect receipt that necessarily names an explicit commit authorization.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EffectReceipt {
    effect_id: String,
    commit_id: String,
    authorization_commitment: String,
    observed_effect: String,
    postcondition_evidence_id: String,
    effect_commitment: String,
}

impl EffectReceipt {
    /// Records a post-effect observation against an explicit authorization.
    ///
    /// This constructor performs no effect and grants no authority.
    ///
    /// # Errors
    ///
    /// Rejects incomplete effect or postcondition coordinates.
    pub fn record(
        effect_id: impl Into<String>,
        authorization: &CommitAuthorization,
        observed_effect: impl Into<String>,
        postcondition_evidence_id: impl Into<String>,
    ) -> Result<Self, EpistemicError> {
        let effect_id = effect_id.into();
        let commit_id = authorization.commit_id.clone();
        let authorization_commitment = authorization.authorization_commitment.clone();
        let observed_effect = observed_effect.into();
        let postcondition_evidence_id = postcondition_evidence_id.into();
        require_visible(&[&effect_id, &observed_effect, &postcondition_evidence_id])?;
        let effect_commitment = digest_parts(
            "lucinet.effect-receipt.v1",
            &[
                effect_id.as_str(),
                commit_id.as_str(),
                authorization_commitment.as_str(),
                observed_effect.as_str(),
                postcondition_evidence_id.as_str(),
            ],
        );
        let receipt = Self {
            effect_id,
            commit_id,
            authorization_commitment,
            observed_effect,
            postcondition_evidence_id,
            effect_commitment,
        };
        Ok(receipt)
    }

    /// Exact commit authorization consumed by the receipt.
    #[must_use]
    pub fn commit_id(&self) -> &str {
        &self.commit_id
    }

    /// Commitment to the exact authorization and observed postcondition.
    #[must_use]
    pub fn effect_commitment(&self) -> &str {
        &self.effect_commitment
    }

    /// Verifies that the receipt names the exact authorization record.
    #[must_use]
    pub fn matches_authorization(&self, authorization: &CommitAuthorization) -> bool {
        self.commit_id == authorization.commit_id
            && self.authorization_commitment == authorization.authorization_commitment
    }
}

/// Structural or epistemic contract failure.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EpistemicError {
    /// A required coordinate has no visible content.
    EmptyField,
    /// Claim, context, contract, observation, or evidence identities differ.
    CrossWiredIdentity,
    /// An evidence identity or binding was counted more than once.
    DuplicateEvidence,
    /// An observation identity was repeated.
    DuplicateObservation,
    /// One event identity was associated with incompatible complete records.
    ConflictingEventRecord,
    /// A required control was repeated.
    DuplicateControl,
    /// An information component was repeated.
    DuplicateComponent,
    /// An evidence record names no supplied observation.
    MissingObservation,
    /// A required control is absent.
    MissingControl,
    /// A required validation check is not positively satisfied.
    RequiredCheckNotSatisfied,
    /// Too few independent supporting records remain.
    InsufficientIndependentEvidence,
    /// Material refuting evidence is present.
    ConflictingEvidence,
    /// Contest or claim assessment remains unresolved.
    UnresolvedClaim,
    /// A material unknown remains.
    MaterialUnknown,
    /// Claim-bound replay was not validated.
    ReplayNotValidated,
    /// Artifact-integrity replay was not validated.
    ArtifactIntegrityNotValidated,
    /// Time did not advance.
    NonAdvancingTime,
    /// Component trials do not establish one-minimality.
    InvalidMinimalGround,
}

impl fmt::Display for EpistemicError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::EmptyField => "epistemic coordinates must contain visible content",
            Self::CrossWiredIdentity => "epistemic identities are cross-wired",
            Self::DuplicateEvidence => "evidence must not be counted twice",
            Self::DuplicateObservation => "observation identities must be unique",
            Self::ConflictingEventRecord => {
                "one event identity cannot name conflicting complete records"
            }
            Self::DuplicateControl => "control classes must be unique",
            Self::DuplicateComponent => "information component identities must be unique",
            Self::MissingObservation => "evidence references a missing observation",
            Self::MissingControl => "a required control is missing",
            Self::RequiredCheckNotSatisfied => "a required check is not satisfied",
            Self::InsufficientIndependentEvidence => "independent support is insufficient",
            Self::ConflictingEvidence => "material refuting evidence blocks promotion",
            Self::UnresolvedClaim => "claim contest or assessment remains unresolved",
            Self::MaterialUnknown => "a material unknown blocks promotion",
            Self::ReplayNotValidated => "claim-bound replay is not validated",
            Self::ArtifactIntegrityNotValidated => "artifact integrity is not validated",
            Self::NonAdvancingTime => "new time must be greater than current time",
            Self::InvalidMinimalGround => "component trials do not establish one-minimality",
        })
    }
}

impl Error for EpistemicError {}

fn require_visible(values: &[&String]) -> Result<(), EpistemicError> {
    if values.iter().any(|value| value.trim().is_empty()) {
        Err(EpistemicError::EmptyField)
    } else {
        Ok(())
    }
}

fn digest_parts(domain: &str, parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(domain.as_bytes());
    hasher.update([0]);
    for part in parts {
        hasher.update(
            u64::try_from(part.len())
                .expect("string length fits u64")
                .to_le_bytes(),
        );
        hasher.update(part.as_bytes());
    }
    let bytes = hasher.finalize();
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        use std::fmt::Write as _;
        let _ = write!(output, "{byte:02x}");
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    fn claim(contest: ContestState, unknowns: Vec<String>) -> ClaimContract {
        ClaimContract::new(ClaimContractFields {
            claim_id: "claim.1".into(),
            context_id: "context.1".into(),
            sufficiency_contract_id: "sufficiency.1".into(),
            statement: "the bound branch digest reproduces".into(),
            basis: ClaimBasis::Derived,
            contest,
            assessment: ClaimAssessment::Unknown,
            evidence_ceiling: "BOUND_REPLAY".into(),
            remaining_unknowns: unknowns,
        })
        .unwrap()
    }

    fn sufficiency(minimum: usize) -> SufficiencyContract {
        SufficiencyContract::new(SufficiencyContractFields {
            contract_id: "sufficiency.1".into(),
            claim_id: "claim.1".into(),
            context_id: "context.1".into(),
            validator_contract_id: "validator.structural-test.v1".into(),
            required_controls: control_ids(),
            minimum_independent_support: minimum,
            evidence_ceiling: "BOUND_REPLAY".into(),
        })
        .unwrap()
    }

    fn control_ids() -> Vec<ControlId> {
        ["negative", "projection", "environment", "order"]
            .into_iter()
            .map(|value| ControlId::new(format!("test.control.{value}")))
            .collect::<Result<Vec<_>, _>>()
            .unwrap()
    }

    fn observation(id: &str) -> ObservationRecord {
        ObservationRecord::new(ObservationRecordFields {
            observation_id: id.into(),
            source_id: format!("source.{id}"),
            referent_id: "branch.1".into(),
            event_id: format!("event.{id}"),
            event_record_digest: format!("event-record-digest.{id}"),
            content_id: format!("content.{id}"),
            observer_projection_id: "projection.1".into(),
            context_id: "context.1".into(),
            observed_at: "logical:1".into(),
        })
        .unwrap()
    }

    fn evidence(id: &str, observation_id: &str) -> EvidenceRecord {
        EvidenceRecord::new(
            id,
            observation_id,
            format!("digest.{id}"),
            format!("provenance.{observation_id}"),
        )
        .unwrap()
    }

    fn binding_with_checks(id: &str, evidence_id: &str, checks: EvidenceChecks) -> EvidenceBinding {
        EvidenceBinding::new(EvidenceBindingFields {
            binding_id: id.into(),
            evidence_id: evidence_id.into(),
            claim_id: "claim.1".into(),
            context_id: "context.1".into(),
            sufficiency_contract_id: "sufficiency.1".into(),
            direction: EvidenceDirection::Supports,
            checks,
        })
        .unwrap()
    }

    fn binding(id: &str, evidence_id: &str) -> EvidenceBinding {
        binding_with_checks(
            id,
            evidence_id,
            EvidenceChecks::new(
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
                RequirementOutcome::Satisfied,
            ),
        )
    }

    fn controls() -> Vec<ControlResult> {
        control_ids()
            .into_iter()
            .map(|kind| {
                let evidence = format!("control-evidence.{}", kind.as_str());
                ControlResult::new(kind, RequirementOutcome::Satisfied, evidence).unwrap()
            })
            .collect()
    }

    fn validate<'a>(
        claim: &'a ClaimContract,
        contract: &'a SufficiencyContract,
        observations: &'a [ObservationRecord],
        evidence: &'a [EvidenceRecord],
        bindings: &'a [EvidenceBinding],
        controls: &'a [ControlResult],
    ) -> Result<ValidatedWitness, EpistemicError> {
        validate_witness(WitnessValidationInput {
            claim,
            sufficiency: contract,
            observations,
            evidence,
            bindings,
            controls,
            replay: RequirementOutcome::Satisfied,
            replay_commitment: "replay.commitment.1",
            artifact_integrity: RequirementOutcome::Satisfied,
            artifact_integrity_commitment: "artifact-integrity.commitment.1",
            material_unknowns: &[],
        })
    }

    #[test]
    fn provenance_contest_and_assessment_are_orthogonal() {
        let reported = ClaimContract::new(ClaimContractFields {
            basis: ClaimBasis::Reported,
            contest: ContestState::Contested,
            assessment: ClaimAssessment::Unknown,
            ..ClaimContractFields {
                claim_id: "claim".into(),
                context_id: "context".into(),
                sufficiency_contract_id: "contract".into(),
                statement: "statement".into(),
                basis: ClaimBasis::Observed,
                contest: ContestState::Uncontested,
                assessment: ClaimAssessment::Supported,
                evidence_ceiling: "ceiling".into(),
                remaining_unknowns: vec![],
            }
        })
        .unwrap();
        assert_eq!(reported.basis().label(), "REPORTED");
        assert_eq!(reported.contest().label(), "CONTESTED");
        assert_eq!(reported.assessment().label(), "UNKNOWN");
    }

    #[test]
    fn exact_claim_promotes_only_after_complete_witness_validation() {
        let claim = claim(ContestState::Uncontested, vec![]);
        let contract = sufficiency(1);
        let observations = [observation("observation.1")];
        let evidence = [evidence("evidence.1", "observation.1")];
        let bindings = [binding("binding.1", "evidence.1")];
        let controls = controls();
        let witness = validate(
            &claim,
            &contract,
            &observations,
            &evidence,
            &bindings,
            &controls,
        )
        .unwrap();
        let promotion = ClaimPromotion::from_witness(&claim, &contract, &witness).unwrap();
        assert_eq!(promotion.claim_id(), claim.claim_id());
        assert_eq!(promotion.assessment(), ClaimAssessment::Supported);

        let mut substituted = claim.clone();
        substituted.statement = "a different proposition with reused IDs".into();
        assert_eq!(
            ClaimPromotion::from_witness(&substituted, &contract, &witness),
            Err(EpistemicError::CrossWiredIdentity)
        );
    }

    #[test]
    fn unknown_or_contested_claim_state_blocks_promotion() {
        let contract = sufficiency(2);
        let observations = [observation("observation.1"), observation("observation.2")];
        let evidence_records = [
            evidence("evidence.1", "observation.1"),
            evidence("evidence.2", "observation.2"),
        ];
        let independent = [
            binding("binding.1", "evidence.1"),
            binding("binding.2", "evidence.2"),
        ];
        let controls = controls();
        assert!(
            validate(
                &claim(ContestState::Uncontested, vec![]),
                &contract,
                &observations,
                &evidence_records,
                &independent,
                &controls,
            )
            .is_ok()
        );
        for contest in [ContestState::Unknown, ContestState::Contested] {
            assert_eq!(
                validate(
                    &claim(contest, vec![]),
                    &contract,
                    &observations,
                    &evidence_records,
                    &independent,
                    &controls,
                ),
                Err(EpistemicError::UnresolvedClaim)
            );
        }
        assert_eq!(
            validate(
                &claim(ContestState::Uncontested, vec!["freshness".into()]),
                &contract,
                &observations,
                &evidence_records,
                &independent,
                &controls,
            ),
            Err(EpistemicError::MaterialUnknown)
        );
    }

    #[test]
    fn duplicate_and_cross_wired_event_support_fails_closed() {
        let contract = sufficiency(2);
        let observations = [observation("observation.1"), observation("observation.2")];
        let evidence_records = [
            evidence("evidence.1", "observation.1"),
            evidence("evidence.2", "observation.2"),
        ];
        let independent = [
            binding("binding.1", "evidence.1"),
            binding("binding.2", "evidence.2"),
        ];
        let controls = controls();
        let duplicate = [
            evidence("evidence.1", "observation.1"),
            evidence("evidence.1", "observation.2"),
        ];
        assert_eq!(
            validate(
                &claim(ContestState::Uncontested, vec![]),
                &sufficiency(1),
                &observations,
                &duplicate,
                &[binding("binding.1", "evidence.1")],
                &controls,
            ),
            Err(EpistemicError::DuplicateEvidence)
        );

        let mut duplicate_event = observations[0].clone();
        duplicate_event.observation_id = "observation.2".into();
        assert_eq!(
            validate(
                &claim(ContestState::Uncontested, vec![]),
                &contract,
                &[observations[0].clone(), duplicate_event],
                &evidence_records,
                &independent,
                &controls,
            ),
            Err(EpistemicError::DuplicateObservation)
        );

        let mut second_projection = observations[0].clone();
        second_projection.observation_id = "observation.2".into();
        second_projection.observer_projection_id = "projection.2".into();
        assert_eq!(
            validate(
                &claim(ContestState::Uncontested, vec![]),
                &contract,
                &[observations[0].clone(), second_projection],
                &evidence_records,
                &independent,
                &controls,
            ),
            Err(EpistemicError::InsufficientIndependentEvidence)
        );

        let mut conflicting_event = observation("observation.2");
        conflicting_event.event_id = observations[0].event_id.clone();
        assert_eq!(
            validate(
                &claim(ContestState::Uncontested, vec![]),
                &contract,
                &[observations[0].clone(), conflicting_event],
                &evidence_records,
                &independent,
                &controls,
            ),
            Err(EpistemicError::ConflictingEventRecord)
        );
    }

    #[test]
    fn refutation_unknown_freshness_and_missing_controls_block_promotion() {
        let claim = claim(ContestState::Uncontested, vec![]);
        let contract = sufficiency(1);
        let observations = [observation("observation.1")];
        let evidence = [evidence("evidence.1", "observation.1")];
        let mut refuting = binding("binding.1", "evidence.1");
        refuting.direction = EvidenceDirection::Refutes;
        let controls = controls();
        let mut unknown_basis = claim.clone();
        unknown_basis.basis = ClaimBasis::Unknown;
        assert_eq!(
            validate(
                &unknown_basis,
                &contract,
                &observations,
                &evidence,
                &[binding("binding.1", "evidence.1")],
                &controls,
            ),
            Err(EpistemicError::UnresolvedClaim)
        );
        let mut unknown_direction = binding("binding.1", "evidence.1");
        unknown_direction.direction = EvidenceDirection::Unknown;
        assert_eq!(
            validate(
                &claim,
                &contract,
                &observations,
                &evidence,
                &[unknown_direction],
                &controls,
            ),
            Err(EpistemicError::MaterialUnknown)
        );
        assert_eq!(
            validate(
                &claim,
                &contract,
                &observations,
                &evidence,
                &[refuting],
                &controls,
            ),
            Err(EpistemicError::ConflictingEvidence)
        );

        let mut stale = binding("binding.1", "evidence.1");
        stale.checks.freshness = RequirementOutcome::Unknown;
        assert_eq!(
            validate(
                &claim,
                &contract,
                &observations,
                &evidence,
                &[stale],
                &controls,
            ),
            Err(EpistemicError::RequiredCheckNotSatisfied)
        );

        assert_eq!(
            validate(
                &claim,
                &contract,
                &observations,
                &evidence,
                &[binding("binding.1", "evidence.1")],
                &controls[..controls.len() - 1],
            ),
            Err(EpistemicError::MissingControl)
        );
    }

    #[test]
    fn time_advance_implies_neither_change_nor_constancy() {
        let observed = TemporalAssessment::observed(0_u8, 1);
        let later = observed.advance_time(2).unwrap();
        assert_eq!(later.last_observed_state(), &0);
        assert_eq!(later.current_inferred_state(), &Knowledge::Unknown);
        assert_eq!(later.current_physical_state(), &Knowledge::Unknown);
        assert_eq!(later.current_time(), 2);
    }

    #[test]
    fn minimal_ground_requires_a_loss_witness_for_every_retained_component() {
        let contract = MinimalGroundContract::new(MinimalGroundContractFields {
            contract_id: "ground.1".into(),
            claim_id: "claim.1".into(),
            effect_contract_id: "effect.1".into(),
            context_id: "context.1".into(),
            evaluator_contract_id: "evaluator.1".into(),
            observation_contract_id: "observation-contract.1".into(),
            final_context_digest: "final-context-digest.1".into(),
            components: vec!["relation".into(), "capture".into()],
        })
        .unwrap();
        let trials = [
            InformationComponentTrial::new(
                &contract,
                "relation",
                ComponentDisposition::Retained,
                RemovalEffect::DivergenceChanged,
                true,
                Some("loss-witness.1".into()),
                "evaluation.relation.1",
            )
            .unwrap(),
            InformationComponentTrial::new(
                &contract,
                "capture",
                ComponentDisposition::Removed,
                RemovalEffect::DivergenceUnchanged,
                true,
                None,
                "evaluation.capture.1",
            )
            .unwrap(),
        ];
        let ground = MinimalPredictiveGround::validate(&contract, &trials).unwrap();
        assert_eq!(ground.retained_components(), &["relation"]);
        let reversed = [trials[1].clone(), trials[0].clone()];
        let same_ground = MinimalPredictiveGround::validate(&contract, &reversed).unwrap();
        assert_eq!(ground.ground_commitment(), same_ground.ground_commitment());
        let foreign_contract = MinimalGroundContract::new(MinimalGroundContractFields {
            contract_id: "ground.1".into(),
            claim_id: "claim.1".into(),
            effect_contract_id: "effect.1".into(),
            context_id: "context.foreign".into(),
            evaluator_contract_id: "evaluator.1".into(),
            observation_contract_id: "observation-contract.1".into(),
            final_context_digest: "final-context-digest.1".into(),
            components: vec!["relation".into(), "capture".into()],
        })
        .unwrap();
        assert_eq!(
            MinimalPredictiveGround::validate(&foreign_contract, &trials),
            Err(EpistemicError::CrossWiredIdentity)
        );
        let invalid = [InformationComponentTrial::new(
            &contract,
            "relation",
            ComponentDisposition::Retained,
            RemovalEffect::DivergenceChanged,
            true,
            None,
            "evaluation.invalid.1",
        )
        .unwrap()];
        assert_eq!(
            MinimalPredictiveGround::validate(&contract, &invalid),
            Err(EpistemicError::InvalidMinimalGround)
        );

        let all_redundant = [
            InformationComponentTrial::new(
                &contract,
                "relation",
                ComponentDisposition::Removed,
                RemovalEffect::DivergenceUnchanged,
                true,
                None,
                "evaluation.relation.redundant.1",
            )
            .unwrap(),
            InformationComponentTrial::new(
                &contract,
                "capture",
                ComponentDisposition::Removed,
                RemovalEffect::DivergenceUnchanged,
                true,
                None,
                "evaluation.capture.redundant.1",
            )
            .unwrap(),
        ];
        let empty_ground = MinimalPredictiveGround::validate(&contract, &all_redundant).unwrap();
        assert!(empty_ground.retained_components().is_empty());
        assert_eq!(empty_ground.removed_components(), &["capture", "relation"]);
    }

    #[test]
    fn global_relation_can_change_while_all_local_states_stay_fixed() {
        let before = RelationalState::new(
            vec![("A".into(), "0".into()), ("B".into(), "0".into())],
            "relation.before",
            "projection.same",
        )
        .unwrap();
        let hidden = RelationalState::new(
            vec![("A".into(), "0".into()), ("B".into(), "0".into())],
            "relation.after",
            "projection.same",
        )
        .unwrap();
        let visible = RelationalState::new(
            vec![("A".into(), "0".into()), ("B".into(), "0".into())],
            "relation.after",
            "projection.changed",
        )
        .unwrap();
        assert_eq!(
            compare_relational_states(&before, &hidden),
            RelationalChange {
                local_state_changed: false,
                global_relation_changed: true,
                projection_changed: false,
            }
        );
        assert_eq!(
            compare_relational_states(&before, &visible),
            RelationalChange {
                local_state_changed: false,
                global_relation_changed: true,
                projection_changed: true,
            }
        );
    }

    #[test]
    fn decision_commit_and_effect_receipt_remain_separate_types() {
        let claim = claim(ContestState::Uncontested, vec![]);
        let contract = sufficiency(1);
        let observations = [observation("observation.1")];
        let evidence = [evidence("evidence.1", "observation.1")];
        let bindings = [binding("binding.1", "evidence.1")];
        let controls = controls();
        let witness = validate(
            &claim,
            &contract,
            &observations,
            &evidence,
            &bindings,
            &controls,
        )
        .unwrap();
        let promotion = ClaimPromotion::from_witness(&claim, &contract, &witness).unwrap();
        let decision =
            DecisionRecord::from_promotion("decision.1", &promotion, "local reversible action")
                .unwrap();
        let authorization = CommitAuthorization::authorize(
            "commit.1",
            &decision,
            "LOCAL_TEST_SCOPE",
            "test-authority-verifier.v1",
            "authority-evidence.1",
            RequirementOutcome::Satisfied,
        )
        .unwrap();
        let substituted_decision =
            DecisionRecord::from_promotion("decision.1", &promotion, "different action").unwrap();
        assert!(authorization.authorizes(&decision));
        assert!(!authorization.authorizes(&substituted_decision));
        let receipt = EffectReceipt::record(
            "effect.1",
            &authorization,
            "postcondition observed",
            "evidence.postcondition.1",
        )
        .unwrap();
        assert_eq!(authorization.decision_id(), decision.decision_id());
        assert_eq!(receipt.commit_id(), authorization.commit_id());
        assert!(receipt.matches_authorization(&authorization));
        assert_eq!(
            authorization.authority_verifier_id(),
            "test-authority-verifier.v1"
        );
        assert_eq!(
            authorization.verification_evidence_id(),
            "authority-evidence.1"
        );
    }
}
