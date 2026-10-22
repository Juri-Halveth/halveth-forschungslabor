//! Integration tests for the public P0 semantic contracts.

use lucinet_core::{
    Binding, BindingId, CanonicalAxes, Counter, CounterObject, CrossProof, CrossProofError,
    CrossProofId, DerivationId, Determinacy, Digest256, EvidenceId, EvidenceState, Forward,
    FrameId, FrameMoveError, FramePose, Materialization, MaterializationId, ObjectId, ProjectionId,
    ReferenceFrame, Residual, Reversibility, SnapshotId, SourceId, SourceSnapshot, SpaceId,
    TransformContract, TransformId, ViewDirection, ViewHistory, ViewHistoryError, ViewId,
};

fn source(name: &str, digest_byte: u8) -> SourceSnapshot {
    SourceSnapshot::new(
        SourceId::new(format!("source-{name}")).expect("source id"),
        SnapshotId::new(format!("snapshot-{name}")).expect("snapshot id"),
        Digest256::new([digest_byte; 32]),
    )
}

fn frame(name: &str) -> ReferenceFrame {
    ReferenceFrame::root(
        FrameId::new(format!("frame-{name}")).expect("frame id"),
        FramePose::identity(),
    )
}

fn contract(name: &str, reversibility: Reversibility) -> TransformContract {
    TransformContract::new(
        TransformId::new(format!("transform-{name}")).expect("transform id"),
        SpaceId::new("source-space").expect("source space"),
        SpaceId::new("view-space").expect("view space"),
        reversibility,
        reversibility,
    )
}

fn projections(
    source: &SourceSnapshot,
    frame: &ReferenceFrame,
    contract: &TransformContract,
    suffix: &str,
) -> (Forward, Counter) {
    (
        Forward::new(
            ProjectionId::new(format!("forward-{suffix}")).expect("forward id"),
            source,
            frame,
            contract,
            Digest256::new([0xF0; 32]),
        ),
        Counter::new(
            ProjectionId::new(format!("counter-{suffix}")).expect("counter id"),
            source,
            frame,
            contract,
            Digest256::new([0xC0; 32]),
        ),
    )
}

#[test]
fn moving_a_frame_leaves_source_and_previous_frame_unchanged() {
    let source = source("a", 0xAA);
    let source_before = source.clone();
    let first = frame("root");
    let first_before = first.clone();
    let moved_pose =
        FramePose::new([10, -20, 30], [1, 2, 3], [1_000_000; 3]).expect("valid fixed-point pose");

    let second = first
        .moved(FrameId::new("frame-next").expect("frame id"), moved_pose)
        .expect("next frame revision");

    assert_eq!(source, source_before);
    assert_eq!(first, first_before);
    assert_eq!(second.parent_frame(), Some(first.frame_id()));
    assert_eq!(second.lineage_root(), first.lineage_root());
    assert_eq!(second.revision(), 1);
    assert_eq!(second.pose(), moved_pose);
}

#[test]
fn frame_identity_cannot_be_reused_later_in_the_same_lineage() {
    let root_id = FrameId::new("frame-a").unwrap();
    let root = ReferenceFrame::root(root_id.clone(), FramePose::identity());
    let moved = root
        .moved(FrameId::new("frame-b").unwrap(), FramePose::identity())
        .unwrap();
    assert_eq!(
        moved.moved(root_id, FramePose::identity()).unwrap_err(),
        FrameMoveError::ReusedFrameId
    );
}

#[test]
fn view_history_is_additive_and_keeps_the_same_source_snapshot() {
    let source = source("history", 0x11);
    let first_frame = frame("history-root");
    let second_frame = first_frame
        .moved(
            FrameId::new("frame-history-next").expect("frame id"),
            FramePose::new([4, 5, 6], [0; 3], [1_000_000; 3]).expect("pose"),
        )
        .expect("next frame");
    let mut history = ViewHistory::new(&source);

    history
        .append(
            ViewId::new("view-0").expect("view id"),
            &first_frame,
            ViewDirection::Forward,
            CanonicalAxes::default(),
        )
        .expect("first append");
    let first_record = history.entries()[0].clone();
    history
        .append(
            ViewId::new("view-1").expect("view id"),
            &second_frame,
            ViewDirection::Counter,
            CanonicalAxes::default(),
        )
        .expect("second append");

    assert_eq!(history.len(), 2);
    assert_eq!(history.entries()[0], first_record);
    assert_eq!(history.entries()[0].sequence(), 0);
    assert_eq!(history.entries()[1].sequence(), 1);
    assert_eq!(history.entries()[0].source_snapshot(), &source);
    assert_eq!(history.entries()[1].source_snapshot(), &source);
}

#[test]
fn view_history_rejects_only_structural_identity_reuse() {
    let source = source("view-id", 0x12);
    let frame = frame("view-id");
    let mut history = ViewHistory::new(&source);
    let view_id = ViewId::new("view-reused").expect("view id");
    history
        .append(
            view_id.clone(),
            &frame,
            ViewDirection::Forward,
            CanonicalAxes::default(),
        )
        .expect("first append");

    assert_eq!(
        history.append(
            view_id,
            &frame,
            ViewDirection::Counter,
            CanonicalAxes::default(),
        ),
        Err(ViewHistoryError::DuplicateViewId)
    );
    assert_eq!(history.len(), 1);
}

#[test]
fn all_four_axes_remain_orthogonal() {
    let bindings = [
        Binding::Unbound,
        Binding::Bound(BindingId::new("binding").expect("binding id")),
    ];
    let determinacies = [
        Determinacy::Indeterminate,
        Determinacy::Derivable(DerivationId::new("recipe").expect("derivation id")),
        Determinacy::Determinate,
    ];
    let materializations = [
        Materialization::Unmaterialized,
        Materialization::Materialized(
            MaterializationId::new("representation").expect("materialization id"),
        ),
    ];
    let evidence_states = [
        EvidenceState::Unknown,
        EvidenceState::Valid(EvidenceId::new("evidence-valid").expect("evidence id")),
        EvidenceState::Invalid(EvidenceId::new("evidence-invalid").expect("evidence id")),
        EvidenceState::Conflict(EvidenceId::new("evidence-conflict").expect("evidence id")),
    ];

    let mut combinations = 0;
    for binding in &bindings {
        for determinacy in &determinacies {
            for materialization in &materializations {
                for evidence in &evidence_states {
                    let axes = CanonicalAxes::new(
                        binding.clone(),
                        determinacy.clone(),
                        materialization.clone(),
                        evidence.clone(),
                    );
                    assert_eq!(axes.binding(), binding);
                    assert_eq!(axes.determinacy(), determinacy);
                    assert_eq!(axes.materialization(), materialization);
                    assert_eq!(axes.evidence(), evidence);

                    let should_have_witness = matches!(determinacy, Determinacy::Derivable(_))
                        && matches!(materialization, Materialization::Unmaterialized);
                    assert_eq!(
                        axes.derivable_unmaterialized().is_some(),
                        should_have_witness
                    );
                    combinations += 1;
                }
            }
        }
    }

    assert_eq!(combinations, 48);
}

#[test]
fn derivable_unmaterialized_preserves_binding_and_evidence() {
    let axes = CanonicalAxes::new(
        Binding::Bound(BindingId::new("binding-a").expect("binding id")),
        Determinacy::Derivable(DerivationId::new("recipe-a").expect("derivation id")),
        Materialization::Unmaterialized,
        EvidenceState::Valid(EvidenceId::new("evidence-a").expect("evidence id")),
    );

    let witness = axes
        .derivable_unmaterialized()
        .expect("named cross-axis witness");
    assert_eq!(witness.binding(), axes.binding());
    assert_eq!(witness.evidence(), axes.evidence());
    assert_eq!(witness.into_axes(), axes);
}

#[test]
fn exact_forward_counter_pair_builds_cross_proof_and_counter_object() {
    let source = source("exact", 0x21);
    let frame = frame("exact");
    let contract = contract("exact", Reversibility::Exact);
    let (forward, counter) = projections(&source, &frame, &contract, "exact");
    let proof = CrossProof::new(
        CrossProofId::new("proof-exact").expect("proof id"),
        &contract,
        &forward,
        &counter,
        lucinet_core::Involution::exact(),
    )
    .expect("exact cross-proof");
    let object = CounterObject::from_cross_proof(
        ObjectId::new("counter-object-exact").expect("object id"),
        &counter,
        &proof,
    )
    .expect("counter object covered by proof");

    assert!(proof.involution().is_exact());
    assert_eq!(proof.forward_projection(), forward.projection_id());
    assert_eq!(proof.counter_projection(), counter.projection_id());
    assert_eq!(object.source_snapshot(), &source);
    assert_eq!(object.counter_projection(), counter.projection_id());
    assert_eq!(object.cross_proof(), proof.proof_id());
}

#[test]
fn bounded_residual_is_inclusive_and_checked_in_both_orders() {
    let source = source("bounded", 0x22);
    let frame = frame("bounded");
    let contract = contract(
        "bounded",
        Reversibility::Bounded {
            maximum: Residual::new(5),
        },
    );
    let (forward, counter) = projections(&source, &frame, &contract, "bounded");

    let accepted = CrossProof::new(
        CrossProofId::new("proof-bounded").expect("proof id"),
        &contract,
        &forward,
        &counter,
        lucinet_core::Involution::new(Residual::new(5), Residual::new(4)),
    );
    assert!(accepted.is_ok());

    let outside_forward = CrossProof::new(
        CrossProofId::new("proof-outside-forward").expect("proof id"),
        &contract,
        &forward,
        &counter,
        lucinet_core::Involution::new(Residual::new(6), Residual::ZERO),
    );
    assert_eq!(
        outside_forward,
        Err(CrossProofError::ForwardCounterResidualOutsideContract)
    );

    let outside_counter = CrossProof::new(
        CrossProofId::new("proof-outside-counter").expect("proof id"),
        &contract,
        &forward,
        &counter,
        lucinet_core::Involution::new(Residual::ZERO, Residual::new(6)),
    );
    assert_eq!(
        outside_counter,
        Err(CrossProofError::CounterForwardResidualOutsideContract)
    );
}

#[test]
fn cross_proof_requires_independently_matching_source_frame_and_contract() {
    let source_a = source("cross-a", 0x31);
    let source_b = source("cross-b", 0x32);
    let frame_a = frame("cross-a");
    let frame_b = frame("cross-b");
    let contract_a = contract("cross-a", Reversibility::Exact);
    let contract_b = contract("cross-b", Reversibility::Exact);
    let forward = Forward::new(
        ProjectionId::new("forward-cross").expect("projection id"),
        &source_a,
        &frame_a,
        &contract_a,
        Digest256::new([1; 32]),
    );

    let source_mismatch = Counter::new(
        ProjectionId::new("counter-source").expect("projection id"),
        &source_b,
        &frame_a,
        &contract_a,
        Digest256::new([2; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-source").expect("proof id"),
            &contract_a,
            &forward,
            &source_mismatch,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::SourceMismatch)
    );

    let frame_mismatch = Counter::new(
        ProjectionId::new("counter-frame").expect("projection id"),
        &source_a,
        &frame_b,
        &contract_a,
        Digest256::new([3; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-frame").expect("proof id"),
            &contract_a,
            &forward,
            &frame_mismatch,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::FrameMismatch)
    );

    let transform_mismatch = Counter::new(
        ProjectionId::new("counter-transform").expect("projection id"),
        &source_a,
        &frame_a,
        &contract_b,
        Digest256::new([4; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-transform").expect("proof id"),
            &contract_a,
            &forward,
            &transform_mismatch,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::TransformMismatch)
    );
}

#[test]
fn cross_proof_binds_complete_values_instead_of_trusting_reused_ids() {
    let canonical_source = source("canonical", 0x41);
    let aliased_source = SourceSnapshot::new(
        canonical_source.source_id().clone(),
        canonical_source.snapshot_id().clone(),
        Digest256::new([0x42; 32]),
    );
    let canonical_frame = frame("canonical");
    let aliased_frame = ReferenceFrame::root(
        canonical_frame.frame_id().clone(),
        FramePose::new([1, 0, 0], [0; 3], [1_000_000; 3]).expect("pose"),
    );
    let canonical_contract = contract("canonical", Reversibility::Exact);
    let aliased_contract = TransformContract::new(
        canonical_contract.transform_id().clone(),
        canonical_contract.source_space().clone(),
        SpaceId::new("different-view-space").expect("space id"),
        Reversibility::Exact,
        Reversibility::Exact,
    );
    let forward = Forward::new(
        ProjectionId::new("forward-canonical").expect("projection id"),
        &canonical_source,
        &canonical_frame,
        &canonical_contract,
        Digest256::new([1; 32]),
    );

    let counter_with_aliased_source = Counter::new(
        ProjectionId::new("counter-aliased-source").expect("projection id"),
        &aliased_source,
        &canonical_frame,
        &canonical_contract,
        Digest256::new([2; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-aliased-source").expect("proof id"),
            &canonical_contract,
            &forward,
            &counter_with_aliased_source,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::SourceMismatch)
    );

    let counter_with_aliased_frame = Counter::new(
        ProjectionId::new("counter-aliased-frame").expect("projection id"),
        &canonical_source,
        &aliased_frame,
        &canonical_contract,
        Digest256::new([3; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-aliased-frame").expect("proof id"),
            &canonical_contract,
            &forward,
            &counter_with_aliased_frame,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::FrameMismatch)
    );

    let counter_with_aliased_contract = Counter::new(
        ProjectionId::new("counter-aliased-contract").expect("projection id"),
        &canonical_source,
        &canonical_frame,
        &aliased_contract,
        Digest256::new([4; 32]),
    );
    assert_eq!(
        CrossProof::new(
            CrossProofId::new("proof-aliased-contract").expect("proof id"),
            &canonical_contract,
            &forward,
            &counter_with_aliased_contract,
            lucinet_core::Involution::exact(),
        ),
        Err(CrossProofError::TransformMismatch)
    );
}
