//! I/O-free typed transformation audits.
//!
//! The module separates operator algebra from reference, valuation,
//! provenance, and action authority. All checks are pointwise unless a caller
//! supplies separate evidence for an entire domain.

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Determinism declared by an operator contract.
pub enum OperatorDeterminism {
    /// Equal bound inputs produce equal outputs.
    Deterministic,
    /// Equal bound inputs can produce different outputs.
    Nondeterministic,
    /// Determinism has not been established.
    Unknown,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Information behavior declared by an operator contract.
pub enum InformationBehavior {
    /// The declared transformation retains enough information for recovery.
    Lossless,
    /// Distinct inputs can collapse into one output.
    Lossy,
    /// Information behavior has not been established.
    Unknown,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Inverse relationship declared by an operator contract.
pub enum InverseKind {
    /// The same operator is claimed to be its own inverse.
    SelfInverse,
    /// A separately named operator is claimed as inverse.
    InversePair,
    /// No inverse is claimed.
    None,
    /// The inverse relationship is unknown.
    Unknown,
}

#[derive(Clone, Debug, Eq, PartialEq)]
/// Closed type and evidence address for a transformation.
pub struct TypedOperatorContract {
    /// Stable operator name.
    pub operator_id: String,
    /// Operator implementation or specification version.
    pub operator_version: String,
    /// Input type address.
    pub input_type: String,
    /// Output type address.
    pub output_type: String,
    /// Equality relation used by a roundtrip.
    pub equality_relation: String,
    /// Determinism declaration.
    pub determinism: OperatorDeterminism,
    /// Information behavior declaration.
    pub information_behavior: InformationBehavior,
    /// Inverse relationship declaration.
    pub inverse_kind: InverseKind,
    /// Effect on artifact provenance.
    pub provenance_effect: String,
    /// Effect on action authority.
    pub authority_effect: String,
    /// Bound source.
    pub source: String,
    /// Time or version for which the contract is valid.
    pub valid_at: String,
}

impl TypedOperatorContract {
    /// Validates the closed textual fields.
    ///
    /// # Errors
    ///
    /// Returns [`TypedOperatorContractError::MissingField`] when any address
    /// required for interpretation is empty.
    pub fn validate(&self) -> Result<(), TypedOperatorContractError> {
        if [
            &self.operator_id,
            &self.operator_version,
            &self.input_type,
            &self.output_type,
            &self.equality_relation,
            &self.provenance_effect,
            &self.authority_effect,
            &self.source,
            &self.valid_at,
        ]
        .iter()
        .any(|value| value.trim().is_empty())
        {
            return Err(TypedOperatorContractError::MissingField);
        }
        Ok(())
    }

    /// Reports whether the operator is closed over one declared type.
    #[must_use]
    pub fn is_closed_over_one_type(&self) -> bool {
        self.input_type == self.output_type
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Contract validation failure.
pub enum TypedOperatorContractError {
    /// A required type, operator, equality, provenance, authority, or source field is empty.
    MissingField,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Pointwise result of applying one operator twice.
pub enum InvolutionAudit {
    /// The second application recovered the bound input exactly.
    ExactAtInput,
    /// The second application did not recover the bound input.
    FailedAtInput,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Pointwise result of comparing both operator orders.
pub enum CommutationAudit {
    /// Both compositions were equal at the bound input.
    CommutesAtInput,
    /// Both compositions differed at the bound input.
    NonCommutingAtInput,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
/// Pointwise classification of two proposed involutions.
pub enum FourStateAudit {
    /// Both involutions commute and generate four distinct states at the input.
    FourStateClosedAtInput,
    /// Both involutions commute but generate fewer than four states.
    DegenerateClosedAtInput(usize),
    /// At least one operator is not involutive at the input.
    InvolutionNotEstablished,
    /// Operator order changes the result at the input.
    NonCommutingAtInput,
}

/// Reverses an explicitly segmented sequence without normalizing its units.
#[must_use]
pub fn reverse_sequence_units<T: Clone>(units: &[T]) -> Vec<T> {
    units.iter().rev().cloned().collect()
}

/// Reflects a 2D point across a horizontal axis.
#[must_use]
pub fn reflect_point_across_horizontal_axis((x, y): (i64, i64), axis_y: i64) -> (i64, i64) {
    (x, 2 * axis_y - y)
}

/// Reflects a 2D point across a vertical axis.
#[must_use]
pub fn reflect_point_across_vertical_axis((x, y): (i64, i64), axis_x: i64) -> (i64, i64) {
    (2 * axis_x - x, y)
}

/// Tests one operator twice at a bound input.
#[must_use]
pub fn audit_involution<T, F>(input: &T, apply: F) -> InvolutionAudit
where
    T: Clone + Eq,
    F: Fn(&T) -> T,
{
    let once = apply(input);
    let twice = apply(&once);
    if &twice == input {
        InvolutionAudit::ExactAtInput
    } else {
        InvolutionAudit::FailedAtInput
    }
}

/// Tests a separately named forward and backward operator at a bound input.
#[must_use]
pub fn audit_inverse_pair<T, U, F, G>(input: &T, forward: F, backward: G) -> bool
where
    T: Eq,
    F: Fn(&T) -> U,
    G: Fn(&U) -> T,
{
    backward(&forward(input)) == *input
}

/// Compares both orders of two same-domain operators at a bound input.
#[must_use]
pub fn audit_commutation<T, F, G>(input: &T, first: F, second: G) -> CommutationAudit
where
    T: Eq,
    F: Fn(&T) -> T,
    G: Fn(&T) -> T,
{
    if first(&second(input)) == second(&first(input)) {
        CommutationAudit::CommutesAtInput
    } else {
        CommutationAudit::NonCommutingAtInput
    }
}

/// Audits the pointwise closure generated by two proposed involutions.
#[must_use]
pub fn audit_four_state_system<T, F, G>(input: &T, first: F, second: G) -> FourStateAudit
where
    T: Clone + Eq,
    F: Fn(&T) -> T,
    G: Fn(&T) -> T,
{
    if audit_involution(input, &first) != InvolutionAudit::ExactAtInput
        || audit_involution(input, &second) != InvolutionAudit::ExactAtInput
    {
        return FourStateAudit::InvolutionNotEstablished;
    }
    if audit_commutation(input, &first, &second) != CommutationAudit::CommutesAtInput {
        return FourStateAudit::NonCommutingAtInput;
    }

    let states = [
        input.clone(),
        first(input),
        second(input),
        first(&second(input)),
    ];
    let mut unique = Vec::new();
    for state in states {
        if !unique.contains(&state) {
            unique.push(state);
        }
    }
    if unique.len() == 4 {
        FourStateAudit::FourStateClosedAtInput
    } else {
        FourStateAudit::DegenerateClosedAtInput(unique.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gold_and_dlog_form_a_pointwise_reversal_orbit() {
        let gold = Vec::from(['G', 'O', 'L', 'D']);
        assert_eq!(
            reverse_sequence_units(&gold),
            Vec::from(['D', 'L', 'O', 'G'])
        );
        assert_eq!(
            audit_involution(&gold, |value| reverse_sequence_units(value)),
            InvolutionAudit::ExactAtInput
        );
    }

    #[test]
    fn xxx_is_a_fixpoint_only_for_the_bound_reversal() {
        let xxx = Vec::from(['X', 'X', 'X']);
        assert_eq!(reverse_sequence_units(&xxx), xxx);
    }

    #[test]
    fn geometric_axis_pair_generates_a_180_degree_composition() {
        let input = (7_i64, 8_i64);
        let horizontal = |point: &(i64, i64)| reflect_point_across_horizontal_axis(*point, 3);
        let vertical = |point: &(i64, i64)| reflect_point_across_vertical_axis(*point, 5);
        assert_eq!(
            audit_four_state_system(&input, horizontal, vertical),
            FourStateAudit::FourStateClosedAtInput
        );
        assert_eq!(horizontal(&vertical(&input)), (3, -2));
        assert_eq!(vertical(&horizontal(&input)), (3, -2));
    }

    #[test]
    fn involutions_need_not_commute() {
        assert_eq!(
            audit_commutation(&2_i32, |value| -value, |value| 1 - value),
            CommutationAudit::NonCommutingAtInput
        );
    }

    #[test]
    fn distinct_operators_can_form_an_inverse_pair() {
        assert!(audit_inverse_pair(
            &7_i32,
            |value| value + 1,
            |value| value - 1
        ));
    }
}
