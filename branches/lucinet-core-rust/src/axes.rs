use crate::{BindingId, DerivationId, EvidenceId, MaterializationId};

/// Whether a semantic value is attached to a named counterpart.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub enum Binding {
    /// No binding has been established.
    Unbound,
    /// A positive binding has been established.
    Bound(BindingId),
}

/// What is presently known about derivability of a value.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub enum Determinacy {
    /// No derivation is presently identified.
    Indeterminate,
    /// A derivation is known even if its value has not been materialized.
    Derivable(DerivationId),
    /// The value is already determinate independently of a derivation recipe.
    Determinate,
}

/// Whether a representation has been materialized.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub enum Materialization {
    /// No representation exists yet.
    Unmaterialized,
    /// A representation exists under the supplied identity.
    Materialized(MaterializationId),
}

/// Validity state of evidence associated with the semantic value.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub enum EvidenceState {
    /// No validity determination is presently available.
    Unknown,
    /// Evidence under the supplied identity validates the value.
    Valid(EvidenceId),
    /// Evidence under the supplied identity invalidates the value.
    Invalid(EvidenceId),
    /// Evidence under the supplied identity records a conflict.
    Conflict(EvidenceId),
}

/// Four independent axes of canonical state.
///
/// Construction performs no cross-axis normalization. In particular, binding
/// and evidence do not imply materialization or determinacy.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct CanonicalAxes {
    binding: Binding,
    determinacy: Determinacy,
    materialization: Materialization,
    evidence: EvidenceState,
}

impl CanonicalAxes {
    /// Creates an explicit point in the four-axis state space.
    #[must_use]
    pub const fn new(
        binding: Binding,
        determinacy: Determinacy,
        materialization: Materialization,
        evidence: EvidenceState,
    ) -> Self {
        Self {
            binding,
            determinacy,
            materialization,
            evidence,
        }
    }

    /// Returns the binding axis.
    #[must_use]
    pub const fn binding(&self) -> &Binding {
        &self.binding
    }

    /// Returns the determinacy axis.
    #[must_use]
    pub const fn determinacy(&self) -> &Determinacy {
        &self.determinacy
    }

    /// Returns the materialization axis.
    #[must_use]
    pub const fn materialization(&self) -> &Materialization {
        &self.materialization
    }

    /// Returns the evidence axis.
    #[must_use]
    pub const fn evidence(&self) -> &EvidenceState {
        &self.evidence
    }

    /// Projects this state into the named derivable/unmaterialized witness.
    #[must_use]
    pub fn derivable_unmaterialized(&self) -> Option<DerivableUnmaterialized> {
        match (&self.determinacy, &self.materialization) {
            (Determinacy::Derivable(derivation_id), Materialization::Unmaterialized) => {
                Some(DerivableUnmaterialized {
                    binding: self.binding.clone(),
                    derivation_id: derivation_id.clone(),
                    evidence: self.evidence.clone(),
                })
            }
            _ => None,
        }
    }
}

impl Default for CanonicalAxes {
    fn default() -> Self {
        Self::new(
            Binding::Unbound,
            Determinacy::Indeterminate,
            Materialization::Unmaterialized,
            EvidenceState::Unknown,
        )
    }
}

/// Witness that a value is derivable while remaining unmaterialized.
///
/// Binding and evidence are carried through unchanged because those dimensions
/// are orthogonal to derivability and materialization.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct DerivableUnmaterialized {
    binding: Binding,
    derivation_id: DerivationId,
    evidence: EvidenceState,
}

impl DerivableUnmaterialized {
    /// Creates the witness without constraining binding or evidence.
    #[must_use]
    pub const fn new(
        binding: Binding,
        derivation_id: DerivationId,
        evidence: EvidenceState,
    ) -> Self {
        Self {
            binding,
            derivation_id,
            evidence,
        }
    }

    /// Returns the independent binding state.
    #[must_use]
    pub const fn binding(&self) -> &Binding {
        &self.binding
    }

    /// Returns the derivation identity.
    #[must_use]
    pub const fn derivation_id(&self) -> &DerivationId {
        &self.derivation_id
    }

    /// Returns the independent evidence state.
    #[must_use]
    pub const fn evidence(&self) -> &EvidenceState {
        &self.evidence
    }

    /// Expands the witness back to its explicit four-axis representation.
    #[must_use]
    pub fn into_axes(self) -> CanonicalAxes {
        CanonicalAxes::new(
            self.binding,
            Determinacy::Derivable(self.derivation_id),
            Materialization::Unmaterialized,
            self.evidence,
        )
    }
}
