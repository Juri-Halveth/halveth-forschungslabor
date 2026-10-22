//! I/O-free bridge audit from representations to testable physical proposals.

/// Failure to address a one-based index in its declared closed domain.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MirrorIndexError {
    /// The declared closed domain has no positions.
    EmptyDomain,
    /// The requested one-based index is outside the declared domain.
    OutsideDomain,
}

/// Mirror a one-based atomic-number index inside a closed `1..=maximum` domain.
///
/// This function transforms only the index. It does not claim to transform or
/// create an element, a particle, energy, binding, mass, or matter.
///
/// # Errors
///
/// Returns [`MirrorIndexError::EmptyDomain`] when `maximum` is zero and
/// [`MirrorIndexError::OutsideDomain`] when the requested one-based index is
/// not inside `1..=maximum`.
pub fn mirror_atomic_number(atomic_number: u16, maximum: u16) -> Result<u16, MirrorIndexError> {
    if maximum == 0 {
        return Err(MirrorIndexError::EmptyDomain);
    }
    if atomic_number == 0 || atomic_number > maximum {
        return Err(MirrorIndexError::OutsideDomain);
    }
    Ok(maximum + 1 - atomic_number)
}

/// Epistemic state of the bridge between a representation and a physical test.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MaterializationState {
    /// Only a representation operator has been defined.
    RepresentationOnly,
    /// At least one required physical bridge field is absent or empty.
    MissingMaterializationBridge,
    /// Every bridge field is non-empty; no physical effect is implied.
    TestablePhysicalProposal,
}

/// Typed address for the bridge between a representation and a proposed
/// physical state transition. Observation is deliberately outside this type:
/// a complete proposal is still not an observed effect.
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct MaterializationAudit<'a> {
    /// Physical, biological, legal, security, or software object under audit.
    pub object: Option<&'a str>,
    /// Domain in which both operators are defined.
    pub domain: Option<&'a str>,
    /// Operator that changes only a representation.
    pub representation_operator: Option<&'a str>,
    /// Proposed operator that changes the addressed state.
    pub state_operator: Option<&'a str>,
    /// Measured or otherwise bound prestate.
    pub input_state: Option<&'a str>,
    /// Predicted poststate.
    pub output_state: Option<&'a str>,
    /// Quantities or relations predicted to remain invariant.
    pub invariants: Option<&'a str>,
    /// Bound source of energy for the proposed transition.
    pub energy_source: Option<&'a str>,
    /// Explicit accounting of applicable conserved quantities.
    pub conservation_ledger: Option<&'a str>,
    /// Testable mechanism connecting input and predicted output.
    pub mechanism: Option<&'a str>,
    /// Measurements predicted by the proposal.
    pub predicted_observables: Option<&'a str>,
    /// Predeclared outcomes that reject the proposal.
    pub falsifiers: Option<&'a str>,
    /// Authorized and bounded safe test scope.
    pub safety_scope: Option<&'a str>,
    /// Sources supporting definitions and parameter choices.
    pub source_basis: Option<&'a str>,
    /// Current evidence class; it must not imply observation by itself.
    pub evidence_state: Option<&'a str>,
}

impl MaterializationAudit<'_> {
    /// Classify only bridge completeness, never an observed physical effect.
    #[must_use]
    pub fn classify(&self) -> MaterializationState {
        if self.representation_operator.is_some()
            && self.state_operator.is_none()
            && self.mechanism.is_none()
        {
            return MaterializationState::RepresentationOnly;
        }

        if [
            self.object,
            self.domain,
            self.representation_operator,
            self.state_operator,
            self.input_state,
            self.output_state,
            self.invariants,
            self.energy_source,
            self.conservation_ledger,
            self.mechanism,
            self.predicted_observables,
            self.falsifiers,
            self.safety_scope,
            self.source_basis,
            self.evidence_state,
        ]
        .iter()
        .all(|field| field.is_some_and(|value| !value.trim().is_empty()))
        {
            MaterializationState::TestablePhysicalProposal
        } else {
            MaterializationState::MissingMaterializationBridge
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn closed_118_index_domain_forms_59_involutive_pairs() {
        let mut pairs = Vec::new();
        for z in 1..=118 {
            let mirrored = mirror_atomic_number(z, 118).unwrap();
            assert_eq!(mirror_atomic_number(mirrored, 118).unwrap(), z);
            if z < mirrored {
                pairs.push((z, mirrored));
            }
        }
        assert_eq!(pairs.len(), 59);
        assert_eq!(pairs.first(), Some(&(1, 118)));
        assert_eq!(pairs.last(), Some(&(59, 60)));
    }

    #[test]
    fn a_table_reordering_is_representation_only() {
        let audit = MaterializationAudit {
            representation_operator: Some("mirror_Z(z) = 119 - z"),
            ..Default::default()
        };
        assert_eq!(audit.classify(), MaterializationState::RepresentationOnly);
    }

    #[test]
    fn an_incomplete_bridge_stays_explicitly_open() {
        let audit = MaterializationAudit {
            object: Some("candidate physical system"),
            representation_operator: Some("index mirror"),
            state_operator: Some("unknown"),
            ..Default::default()
        };
        assert_eq!(
            audit.classify(),
            MaterializationState::MissingMaterializationBridge
        );
    }

    #[test]
    fn a_closed_address_is_testable_but_not_observed() {
        let audit = MaterializationAudit {
            object: Some("bounded synthetic sample"),
            domain: Some("declared physical domain"),
            representation_operator: Some("declared representation"),
            state_operator: Some("declared physical operation"),
            input_state: Some("measured prestate"),
            output_state: Some("predicted poststate"),
            invariants: Some("declared invariants"),
            energy_source: Some("measured source"),
            conservation_ledger: Some("closed ledger"),
            mechanism: Some("testable mechanism"),
            predicted_observables: Some("measurable signal"),
            falsifiers: Some("predeclared rejection condition"),
            safety_scope: Some("bounded safe scope"),
            source_basis: Some("bound sources"),
            evidence_state: Some("proposal only"),
        };
        assert_eq!(
            audit.classify(),
            MaterializationState::TestablePhysicalProposal
        );
    }
}
