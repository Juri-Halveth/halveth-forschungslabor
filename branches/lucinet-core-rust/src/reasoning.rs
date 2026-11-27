//! Typed Definition Lock, Number Address Lock and four-point audit contracts.
//!
//! These contracts are I/O-free. They preserve semantic addresses and refuse
//! to infer biological meaning, graph edges or equality from a glyph alone.

use crate::CanonicalAxes;

/// A decision-relevant linguistic dimension.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum LanguageDimension {
    /// Written spelling or glyph sequence.
    WrittenForm,
    /// Measurable duration of a sound.
    PhoneticDuration,
    /// Kind or quality of a sound.
    PhoneticQuality,
    /// Grammatical form and relation.
    Morphosyntax,
    /// Lexical meaning.
    LexicalSemantics,
    /// Meaning in a concrete use context.
    Pragmatics,
    /// Historically evidenced word origin.
    Etymology,
    /// Evaluation by a speaker or source.
    Evaluation,
    /// Language or social variety.
    SociolinguisticVariety,
    /// Time scope of the statement.
    TemporalScope,
    /// Method used to obtain a value.
    MeasurementMethod,
}

/// Result of comparing two complete definition addresses.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum DefinitionComparison {
    /// Same address, different definitions with a bound incompatibility witness.
    DirectConflict,
    /// Similar surface form, non-comparable addresses.
    ApparentConflict,
    /// Same address and same definition.
    Compatible,
    /// Same address and different definitions without a conflict witness.
    Unknown,
    /// Different terms at different addresses.
    NonComparable,
}

/// Domain-supplied declaration that two exact addressed definitions conflict.
///
/// The core seals both records and the named comparison contract; the domain
/// supplying the declaration remains responsible for incompatibility truth.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DefinitionIncompatibilityWitness {
    left: DefinitionLock,
    right: DefinitionLock,
    contract_id: String,
}

impl DefinitionIncompatibilityWitness {
    /// Binds an incompatibility contract to both definition sources.
    #[must_use]
    pub fn new(
        left: &DefinitionLock,
        right: &DefinitionLock,
        contract_id: impl Into<String>,
    ) -> Option<Self> {
        let witness = Self {
            left: left.clone(),
            right: right.clone(),
            contract_id: contract_id.into(),
        };
        (!witness.contract_id.trim().is_empty()
            && witness.left.compare(&witness.right) == DefinitionComparison::Unknown)
            .then_some(witness)
    }
}

/// Complete address of one term before contradiction is asserted.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DefinitionLock {
    term: String,
    object_or_referent: String,
    dimension: LanguageDimension,
    definition: String,
    language_or_variety: String,
    scope: String,
    measurement_method: String,
    source: String,
    valid_at: String,
}

impl DefinitionLock {
    /// Creates a lock only when every textual address component is present.
    #[must_use]
    pub fn new(fields: DefinitionLockFields) -> Option<Self> {
        let values = [
            &fields.term,
            &fields.object_or_referent,
            &fields.definition,
            &fields.language_or_variety,
            &fields.scope,
            &fields.measurement_method,
            &fields.source,
            &fields.valid_at,
        ];
        values
            .iter()
            .all(|value| !value.trim().is_empty())
            .then_some(Self {
                term: fields.term,
                object_or_referent: fields.object_or_referent,
                dimension: fields.dimension,
                definition: fields.definition,
                language_or_variety: fields.language_or_variety,
                scope: fields.scope,
                measurement_method: fields.measurement_method,
                source: fields.source,
                valid_at: fields.valid_at,
            })
    }

    /// Compares two locks without inventing an incompatibility witness.
    #[must_use]
    pub fn compare(&self, other: &Self) -> DefinitionComparison {
        let same_address = self.term == other.term
            && self.object_or_referent == other.object_or_referent
            && self.dimension == other.dimension
            && self.language_or_variety == other.language_or_variety
            && self.scope == other.scope
            && self.measurement_method == other.measurement_method
            && self.source == other.source
            && self.valid_at == other.valid_at;
        if !same_address && self.term == other.term {
            DefinitionComparison::ApparentConflict
        } else if !same_address {
            DefinitionComparison::NonComparable
        } else if self.definition == other.definition {
            DefinitionComparison::Compatible
        } else {
            DefinitionComparison::Unknown
        }
    }

    /// Compares two locks using an independent incompatibility witness.
    ///
    /// A witness can establish direct conflict only at the same address and
    /// only when it binds both original source identities.
    #[must_use]
    pub fn compare_with_incompatibility_witness(
        &self,
        other: &Self,
        witness: &DefinitionIncompatibilityWitness,
    ) -> DefinitionComparison {
        let unassisted = self.compare(other);
        let records_match = (witness.left == *self && witness.right == *other)
            || (witness.left == *other && witness.right == *self);
        if unassisted == DefinitionComparison::Unknown && records_match {
            DefinitionComparison::DirectConflict
        } else {
            unassisted
        }
    }

    /// Returns the source spelling.
    #[must_use]
    pub fn term(&self) -> &str {
        &self.term
    }

    /// Returns the bound source identity.
    #[must_use]
    pub fn source(&self) -> &str {
        &self.source
    }
}

/// Construction fields for a complete [`DefinitionLock`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DefinitionLockFields {
    /// Term as written.
    pub term: String,
    /// Addressed object or referent.
    pub object_or_referent: String,
    /// Linguistic dimension.
    pub dimension: LanguageDimension,
    /// Definition used in this scope.
    pub definition: String,
    /// Language or variety.
    pub language_or_variety: String,
    /// Bounded scope.
    pub scope: String,
    /// Measurement method or `NOT_APPLICABLE`.
    pub measurement_method: String,
    /// Source identity.
    pub source: String,
    /// Time or revision.
    pub valid_at: String,
}

/// Semantic role of a number.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum NumberRole {
    /// Measured value.
    MeasurementValue,
    /// Position inside a variant notation.
    VariantPosition,
    /// Length of a protein.
    ProteinLength,
    /// Experimental probe position.
    ExperimentalProbePosition,
    /// Count of items or events.
    Count,
    /// Identifier, not magnitude.
    Identifier,
    /// Approximate remembered number.
    ApproximateMemory,
    /// A separately defined role.
    Other,
    /// Role not yet known.
    Unknown,
}

/// Evidence state of a number address.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum NumberEvidence {
    /// Bound to a source.
    SourceBound,
    /// Reported memory.
    ReportedMemory,
    /// Supplied by the current user.
    UserProvided,
    /// Inferred by a model.
    ModelInferred,
    /// Not known.
    Unknown,
}

/// Complete address of one numeric token.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NumberAddressLock {
    raw_number: String,
    unit: String,
    object_or_referent: String,
    level: String,
    notation: String,
    number_role: NumberRole,
    population: String,
    source: String,
    valid_at: String,
    evidence: NumberEvidence,
}

impl NumberAddressLock {
    /// Creates a number address only when every textual field is present.
    #[must_use]
    pub fn new(fields: NumberAddressFields) -> Option<Self> {
        let values = [
            &fields.raw_number,
            &fields.unit,
            &fields.object_or_referent,
            &fields.level,
            &fields.notation,
            &fields.population,
            &fields.source,
            &fields.valid_at,
        ];
        values
            .iter()
            .all(|value| !value.trim().is_empty())
            .then_some(Self {
                raw_number: fields.raw_number,
                unit: fields.unit,
                object_or_referent: fields.object_or_referent,
                level: fields.level,
                notation: fields.notation,
                number_role: fields.number_role,
                population: fields.population,
                source: fields.source,
                valid_at: fields.valid_at,
                evidence: fields.evidence,
            })
    }

    /// Equal digits are comparable only when the semantic address also matches.
    #[must_use]
    pub fn is_comparable_with(&self, other: &Self) -> bool {
        self.unit == other.unit
            && self.object_or_referent == other.object_or_referent
            && self.level == other.level
            && self.notation == other.notation
            && self.number_role == other.number_role
            && self.population == other.population
            && self.valid_at == other.valid_at
    }

    /// Returns the unchanged source token.
    #[must_use]
    pub fn raw_number(&self) -> &str {
        &self.raw_number
    }

    /// Returns the evidence axis of the address.
    #[must_use]
    pub const fn evidence(&self) -> NumberEvidence {
        self.evidence
    }

    /// Returns the bound source identity.
    #[must_use]
    pub fn source(&self) -> &str {
        &self.source
    }
}

/// Construction fields for a complete [`NumberAddressLock`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NumberAddressFields {
    /// Numeric token as written.
    pub raw_number: String,
    /// Unit or `UNSPECIFIED`.
    pub unit: String,
    /// Addressed object or referent.
    pub object_or_referent: String,
    /// Semantic or technical level.
    pub level: String,
    /// Notation system.
    pub notation: String,
    /// Semantic number role.
    pub number_role: NumberRole,
    /// Population or sample scope.
    pub population: String,
    /// Source identity.
    pub source: String,
    /// Time or revision.
    pub valid_at: String,
    /// Evidence state.
    pub evidence: NumberEvidence,
}

/// One point in a four-reference audit.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReferenceAuditPoint {
    id: String,
    axes: CanonicalAxes,
    state_slots: [String; 2],
}

impl ReferenceAuditPoint {
    /// Creates a point with two opaque, non-empty state labels.
    #[must_use]
    pub fn new(
        id: impl Into<String>,
        axes: CanonicalAxes,
        state_slots: [String; 2],
    ) -> Option<Self> {
        let point = Self {
            id: id.into(),
            axes,
            state_slots,
        };
        (!point.id.trim().is_empty()
            && point.state_slots.iter().all(|slot| !slot.trim().is_empty()))
        .then_some(point)
    }

    /// Returns the point identity.
    #[must_use]
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Returns all four independent LUCINET axes.
    #[must_use]
    pub const fn axes(&self) -> &CanonicalAxes {
        &self.axes
    }

    /// Returns two opaque labels without importing biological meaning.
    #[must_use]
    pub fn state_slots(&self) -> &[String; 2] {
        &self.state_slots
    }
}

/// Exactly four reference points. No edge or center authority is implied.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FourPointReferenceAudit {
    points: [ReferenceAuditPoint; 4],
}

impl FourPointReferenceAudit {
    /// Accepts exactly four points with distinct identities.
    #[must_use]
    pub fn new(points: [ReferenceAuditPoint; 4]) -> Option<Self> {
        let distinct = points.iter().enumerate().all(|(index, point)| {
            points
                .iter()
                .skip(index + 1)
                .all(|other| point.id != other.id)
        });
        distinct.then_some(Self { points })
    }

    /// Returns the four points; no graph edges are synthesized.
    #[must_use]
    pub const fn points(&self) -> &[ReferenceAuditPoint; 4] {
        &self.points
    }

    /// A complete undirected graph over four points requires six declared relations.
    #[must_use]
    pub const fn complete_graph_edge_count(&self) -> usize {
        6
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn number(role: NumberRole, object: &str, unit: &str) -> NumberAddressLock {
        NumberAddressLock::new(NumberAddressFields {
            raw_number: "49,9".into(),
            unit: unit.into(),
            object_or_referent: object.into(),
            level: "DISPLAY_METRIC".into(),
            notation: "DECIMAL_COMMA".into(),
            number_role: role,
            population: "UNSPECIFIED".into(),
            source: "SCREENSHOT".into(),
            valid_at: "OBSERVED_FRAME".into(),
            evidence: NumberEvidence::SourceBound,
        })
        .unwrap()
    }

    #[test]
    fn thousands_of_likes_are_not_a_dna_percentage() {
        let likes = number(NumberRole::Count, "comment likes", "THOUSAND");
        let dna = number(NumberRole::MeasurementValue, "DNA quality", "PERCENT");
        assert!(!likes.is_comparable_with(&dna));
    }

    #[test]
    fn same_word_different_dimension_is_not_a_direct_conflict() {
        let fields = DefinitionLockFields {
            term: "kurz".into(),
            object_or_referent: "Vokal".into(),
            dimension: LanguageDimension::PhoneticDuration,
            definition: "geringe Dauer".into(),
            language_or_variety: "de-DE".into(),
            scope: "PHONETICS".into(),
            measurement_method: "ACOUSTIC_DURATION".into(),
            source: "SOURCE_A".into(),
            valid_at: "REV_1".into(),
        };
        let first = DefinitionLock::new(fields.clone()).unwrap();
        let second = DefinitionLock::new(DefinitionLockFields {
            dimension: LanguageDimension::PhoneticQuality,
            definition: "Unterrichtskategorie".into(),
            ..fields
        })
        .unwrap();
        assert_eq!(
            first.compare(&second),
            DefinitionComparison::ApparentConflict
        );
    }

    #[test]
    fn differing_definitions_need_an_incompatibility_witness_for_direct_conflict() {
        let fields = DefinitionLockFields {
            term: "state".into(),
            object_or_referent: "OBJECT_A".into(),
            dimension: LanguageDimension::LexicalSemantics,
            definition: "definition one".into(),
            language_or_variety: "en".into(),
            scope: "SCOPE".into(),
            measurement_method: "NOT_APPLICABLE".into(),
            source: "SOURCE_A".into(),
            valid_at: "REV_1".into(),
        };
        let left = DefinitionLock::new(fields.clone()).unwrap();
        let right = DefinitionLock::new(DefinitionLockFields {
            definition: "definition two".into(),
            ..fields.clone()
        })
        .unwrap();
        assert_eq!(left.compare(&right), DefinitionComparison::Unknown);
        let witness = DefinitionIncompatibilityWitness::new(&left, &right, "CONTRACT_1").unwrap();
        assert_eq!(
            left.compare_with_incompatibility_witness(&right, &witness),
            DefinitionComparison::DirectConflict
        );

        let foreign_source = DefinitionLock::new(DefinitionLockFields {
            definition: "definition two".into(),
            source: "SOURCE_B".into(),
            ..fields
        })
        .unwrap();
        assert_eq!(
            left.compare(&foreign_source),
            DefinitionComparison::ApparentConflict
        );
        assert!(
            DefinitionIncompatibilityWitness::new(&left, &foreign_source, "CONTRACT_2").is_none()
        );
    }

    #[test]
    fn four_points_keep_axes_and_labels_opaque() {
        let point = |id: &str| {
            ReferenceAuditPoint::new(id, CanonicalAxes::default(), ["XX".into(), "XY".into()])
                .unwrap()
        };
        let audit =
            FourPointReferenceAudit::new([point("P1"), point("P2"), point("P3"), point("P4")])
                .unwrap();
        assert_eq!(audit.points().len(), 4);
        assert_eq!(audit.complete_graph_edge_count(), 6);
        assert_eq!(audit.points()[0].state_slots(), &["XX", "XY"]);
    }

    #[test]
    fn incomplete_addresses_fail_closed() {
        let mut fields = NumberAddressFields {
            raw_number: "180".into(),
            unit: "UNSPECIFIED".into(),
            object_or_referent: "unknown".into(),
            level: "UNKNOWN".into(),
            notation: "PLAIN_TOKEN".into(),
            number_role: NumberRole::ApproximateMemory,
            population: "UNSPECIFIED".into(),
            source: "USER_MEMORY".into(),
            valid_at: "CURRENT_REQUEST".into(),
            evidence: NumberEvidence::ReportedMemory,
        };
        fields.source.clear();
        assert!(NumberAddressLock::new(fields).is_none());
    }
}
