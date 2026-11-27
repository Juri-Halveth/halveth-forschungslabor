use std::{collections::BTreeSet, error::Error, fmt};

use crate::{
    BranchId, EntityId, EvidenceId, EvidenceState, MultiFrameReferenceProjection, ProjectionId,
    RelationGraphId, RelationId, SnapshotId, SourceId, SourceSnapshot, SuperpositionView, ViewId,
    ViewRecord,
};

/// Closed entity vocabulary required by the local integration spine.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum EntityKind {
    /// A semantic document.
    Document,
    /// A top-level or nested browser frame.
    Frame,
    /// A bounded semantic DOM element.
    DomElement,
    /// A reference to a resource, not the resource payload itself.
    Resource,
    /// A redacted URL origin.
    Origin,
    /// A navigation occurrence.
    Navigation,
    /// A bounded, explicitly selected text fragment.
    Selection,
}

/// Closed positive relations used by graph adapters.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum RelationKind {
    /// A snapshot belongs to a source lineage.
    SnapshotOf,
    /// One graph entity represents another graph subject.
    Represents,
    /// A container contains a child.
    Contains,
    /// One entity references another without owning it.
    References,
    /// An entity originates at a redacted origin.
    OriginatesAt,
    /// A navigation points to a target.
    NavigatesTo,
    /// A selection is taken from a semantic subject.
    Selects,
    /// A projection produces a view or representation.
    Projects,
    /// A branch derives from an existing snapshot or branch.
    BranchesFrom,
    /// Evidence supports a graph subject without implying validity by itself.
    SupportedBy,
}

/// Typed address of any node that can participate in a relation.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub enum NodeRef {
    /// Source-lineage node.
    Source(SourceId),
    /// Immutable snapshot node.
    Snapshot(SnapshotId),
    /// Semantic entity node.
    Entity(EntityId),
    /// Additive view node.
    View(ViewId),
    /// Positive relation node.
    Relation(RelationId),
    /// Projection node.
    Projection(ProjectionId),
    /// Additive branch node.
    Branch(BranchId),
    /// Evidence node.
    Evidence(EvidenceId),
}

/// Stable source-lineage root of a graph.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SourceNode {
    source_id: SourceId,
}

impl SourceNode {
    /// Returns the graph's source-lineage identity.
    #[must_use]
    pub const fn source_id(&self) -> &SourceId {
        &self.source_id
    }
}

/// Immutable source snapshot root of a graph.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SnapshotNode {
    source_snapshot: SourceSnapshot,
}

impl SnapshotNode {
    /// Returns the complete immutable source snapshot.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }
}

/// A typed semantic entity bound to one immutable snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EntityNode {
    entity_id: EntityId,
    source_snapshot: SourceSnapshot,
    kind: EntityKind,
}

impl EntityNode {
    /// Creates a semantic entity without claiming authority over its payload.
    #[must_use]
    pub fn new(entity_id: EntityId, source_snapshot: &SourceSnapshot, kind: EntityKind) -> Self {
        Self {
            entity_id,
            source_snapshot: source_snapshot.clone(),
            kind,
        }
    }

    /// Returns the entity identity.
    #[must_use]
    pub const fn entity_id(&self) -> &EntityId {
        &self.entity_id
    }

    /// Returns the immutable snapshot represented by this entity.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the closed entity class.
    #[must_use]
    pub const fn kind(&self) -> EntityKind {
        self.kind
    }
}

/// Definition retained by a graph view node.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ViewNodeDefinition {
    /// One existing atomic view-history record.
    Atomic(Box<ViewRecord>),
    /// A new view composed from existing atomic views.
    Superposition(SuperpositionView),
}

/// An additive atomic or superposed view.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ViewNode {
    definition: ViewNodeDefinition,
}

impl ViewNode {
    /// Wraps an existing atomic view-history record.
    #[must_use]
    pub fn atomic(record: &ViewRecord) -> Self {
        Self {
            definition: ViewNodeDefinition::Atomic(Box::new(record.clone())),
        }
    }

    /// Wraps an already validated superposition view.
    #[must_use]
    pub const fn superposition(view: SuperpositionView) -> Self {
        Self {
            definition: ViewNodeDefinition::Superposition(view),
        }
    }

    /// Returns this additive view's identity.
    #[must_use]
    pub fn view_id(&self) -> &ViewId {
        match &self.definition {
            ViewNodeDefinition::Atomic(record) => record.view_id(),
            ViewNodeDefinition::Superposition(view) => view.view_id(),
        }
    }

    /// Returns the immutable snapshot seen by the view.
    #[must_use]
    pub fn source_snapshot(&self) -> &SourceSnapshot {
        match &self.definition {
            ViewNodeDefinition::Atomic(record) => record.source_snapshot(),
            ViewNodeDefinition::Superposition(view) => view.source_snapshot(),
        }
    }

    /// Returns the complete atomic or superposed definition.
    #[must_use]
    pub const fn definition(&self) -> &ViewNodeDefinition {
        &self.definition
    }

    fn component_views(&self) -> &[ViewRecord] {
        match &self.definition {
            ViewNodeDefinition::Atomic(_) => &[],
            ViewNodeDefinition::Superposition(view) => view.components(),
        }
    }
}

/// One positive relation between two already existing graph nodes.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RelationNode {
    relation_id: RelationId,
    source_snapshot: SourceSnapshot,
    kind: RelationKind,
    from: NodeRef,
    to: NodeRef,
}

impl RelationNode {
    /// Creates a positive relation for later graph validation.
    #[must_use]
    pub fn new(
        relation_id: RelationId,
        source_snapshot: &SourceSnapshot,
        kind: RelationKind,
        from: NodeRef,
        to: NodeRef,
    ) -> Self {
        Self {
            relation_id,
            source_snapshot: source_snapshot.clone(),
            kind,
            from,
            to,
        }
    }

    /// Returns the relation identity.
    #[must_use]
    pub const fn relation_id(&self) -> &RelationId {
        &self.relation_id
    }

    /// Returns the graph snapshot that owns this relation.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the closed positive relation class.
    #[must_use]
    pub const fn kind(&self) -> RelationKind {
        self.kind
    }

    /// Returns the existing source endpoint.
    #[must_use]
    pub const fn from(&self) -> &NodeRef {
        &self.from
    }

    /// Returns the existing target endpoint.
    #[must_use]
    pub const fn to(&self) -> &NodeRef {
        &self.to
    }
}

/// Frame/view membership of a projection node.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProjectionDefinition {
    /// Projection through one existing atomic view and its frame.
    SingleFrame(Box<ViewRecord>),
    /// Projection through at least two validated reference frames.
    MultiFrame(MultiFrameReferenceProjection),
}

/// Projection between two already existing graph nodes.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProjectionNode {
    projection_id: ProjectionId,
    source_snapshot: SourceSnapshot,
    from: NodeRef,
    to: NodeRef,
    definition: ProjectionDefinition,
}

impl ProjectionNode {
    /// Creates a projection through one existing atomic view.
    #[must_use]
    pub fn single_frame(
        projection_id: ProjectionId,
        view: &ViewRecord,
        from: NodeRef,
        to: NodeRef,
    ) -> Self {
        Self {
            projection_id,
            source_snapshot: view.source_snapshot().clone(),
            from,
            to,
            definition: ProjectionDefinition::SingleFrame(Box::new(view.clone())),
        }
    }

    /// Creates a projection through a validated multi-frame reference.
    #[must_use]
    pub fn multi_frame(
        projection: MultiFrameReferenceProjection,
        from: NodeRef,
        to: NodeRef,
    ) -> Self {
        Self {
            projection_id: projection.projection_id().clone(),
            source_snapshot: projection.source_snapshot().clone(),
            from,
            to,
            definition: ProjectionDefinition::MultiFrame(projection),
        }
    }

    /// Returns the projection identity.
    #[must_use]
    pub const fn projection_id(&self) -> &ProjectionId {
        &self.projection_id
    }

    /// Returns the immutable snapshot seen by the projection.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the existing source endpoint.
    #[must_use]
    pub const fn from(&self) -> &NodeRef {
        &self.from
    }

    /// Returns the existing target endpoint.
    #[must_use]
    pub const fn to(&self) -> &NodeRef {
        &self.to
    }

    /// Returns the frame/view definition.
    #[must_use]
    pub const fn definition(&self) -> &ProjectionDefinition {
        &self.definition
    }

    fn component_views(&self) -> Vec<&ViewRecord> {
        match &self.definition {
            ProjectionDefinition::SingleFrame(view) => vec![view],
            ProjectionDefinition::MultiFrame(projection) => {
                projection.components().iter().collect()
            }
        }
    }
}

/// An additive simulation state whose parent already exists.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BranchNode {
    branch_id: BranchId,
    source_snapshot: SourceSnapshot,
    parent: NodeRef,
    view_id: Option<ViewId>,
}

impl BranchNode {
    /// Creates a branch-root node over an existing snapshot.
    #[must_use]
    pub fn root(
        branch_id: BranchId,
        source_snapshot: &SourceSnapshot,
        parent_snapshot: SnapshotId,
    ) -> Self {
        Self {
            branch_id,
            source_snapshot: source_snapshot.clone(),
            parent: NodeRef::Snapshot(parent_snapshot),
            view_id: None,
        }
    }

    /// Creates a derived branch that points to an existing parent and view.
    #[must_use]
    pub fn derived(
        branch_id: BranchId,
        source_snapshot: &SourceSnapshot,
        parent: NodeRef,
        view_id: ViewId,
    ) -> Self {
        Self {
            branch_id,
            source_snapshot: source_snapshot.clone(),
            parent,
            view_id: Some(view_id),
        }
    }

    /// Returns the branch identity.
    #[must_use]
    pub const fn branch_id(&self) -> &BranchId {
        &self.branch_id
    }

    /// Returns the immutable parent snapshot shared by the branch tree.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the snapshot or branch parent.
    #[must_use]
    pub const fn parent(&self) -> &NodeRef {
        &self.parent
    }

    /// Returns the additive view produced for a derived branch.
    #[must_use]
    pub const fn view_id(&self) -> Option<&ViewId> {
        self.view_id.as_ref()
    }
}

/// Evidence attached to an existing graph node.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvidenceNode {
    evidence_id: EvidenceId,
    source_snapshot: SourceSnapshot,
    subject: NodeRef,
    state: EvidenceState,
}

impl EvidenceNode {
    /// Creates an evidence node for later graph validation.
    #[must_use]
    pub fn new(
        evidence_id: EvidenceId,
        source_snapshot: &SourceSnapshot,
        subject: NodeRef,
        state: EvidenceState,
    ) -> Self {
        Self {
            evidence_id,
            source_snapshot: source_snapshot.clone(),
            subject,
            state,
        }
    }

    /// Returns the evidence identity.
    #[must_use]
    pub const fn evidence_id(&self) -> &EvidenceId {
        &self.evidence_id
    }

    /// Returns the immutable snapshot covered by this evidence.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the existing subject covered by the evidence.
    #[must_use]
    pub const fn subject(&self) -> &NodeRef {
        &self.subject
    }

    /// Returns the explicitly supplied evidence state.
    #[must_use]
    pub const fn state(&self) -> &EvidenceState {
        &self.state
    }
}

/// Any node retained in append order by a [`RelationGraph`].
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GraphNode {
    /// Source-lineage root.
    Source(SourceNode),
    /// Immutable snapshot root.
    Snapshot(SnapshotNode),
    /// Semantic entity.
    Entity(EntityNode),
    /// Additive view.
    View(ViewNode),
    /// Positive relation.
    Relation(RelationNode),
    /// Reference projection.
    Projection(ProjectionNode),
    /// Additive branch.
    Branch(BranchNode),
    /// Attached evidence.
    Evidence(EvidenceNode),
}

impl GraphNode {
    /// Returns the typed address of this node.
    #[must_use]
    pub fn node_ref(&self) -> NodeRef {
        match self {
            Self::Source(node) => NodeRef::Source(node.source_id.clone()),
            Self::Snapshot(node) => NodeRef::Snapshot(node.source_snapshot.snapshot_id().clone()),
            Self::Entity(node) => NodeRef::Entity(node.entity_id.clone()),
            Self::View(node) => NodeRef::View(node.view_id().clone()),
            Self::Relation(node) => NodeRef::Relation(node.relation_id.clone()),
            Self::Projection(node) => NodeRef::Projection(node.projection_id.clone()),
            Self::Branch(node) => NodeRef::Branch(node.branch_id.clone()),
            Self::Evidence(node) => NodeRef::Evidence(node.evidence_id.clone()),
        }
    }
}

/// Append-only-in-API graph over one immutable source snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RelationGraph {
    graph_id: RelationGraphId,
    source_snapshot: SourceSnapshot,
    nodes: Vec<GraphNode>,
    node_refs: BTreeSet<NodeRef>,
}

impl RelationGraph {
    /// Starts a graph with its source and immutable snapshot roots.
    #[must_use]
    pub fn new(graph_id: RelationGraphId, source_snapshot: &SourceSnapshot) -> Self {
        let source = GraphNode::Source(SourceNode {
            source_id: source_snapshot.source_id().clone(),
        });
        let snapshot = GraphNode::Snapshot(SnapshotNode {
            source_snapshot: source_snapshot.clone(),
        });
        let node_refs = BTreeSet::from([source.node_ref(), snapshot.node_ref()]);
        Self {
            graph_id,
            source_snapshot: source_snapshot.clone(),
            nodes: vec![source, snapshot],
            node_refs,
        }
    }

    /// Returns the graph identity.
    #[must_use]
    pub const fn graph_id(&self) -> &RelationGraphId {
        &self.graph_id
    }

    /// Returns the immutable snapshot shared by all graph nodes.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns every node in append order, including the two roots.
    #[must_use]
    pub fn nodes(&self) -> &[GraphNode] {
        &self.nodes
    }

    /// Returns whether a typed node address already exists.
    #[must_use]
    pub fn contains(&self, node_ref: &NodeRef) -> bool {
        self.node_refs.contains(node_ref)
    }

    /// Looks up one node by typed address.
    #[must_use]
    pub fn node(&self, node_ref: &NodeRef) -> Option<&GraphNode> {
        self.nodes.iter().find(|node| node.node_ref() == *node_ref)
    }

    /// Iterates semantic entities in append order.
    pub fn entities(&self) -> impl Iterator<Item = &EntityNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::Entity(entity) => Some(entity),
            _ => None,
        })
    }

    /// Iterates views in append order.
    pub fn views(&self) -> impl Iterator<Item = &ViewNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::View(view) => Some(view),
            _ => None,
        })
    }

    /// Iterates positive relations in append order.
    pub fn relations(&self) -> impl Iterator<Item = &RelationNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::Relation(relation) => Some(relation),
            _ => None,
        })
    }

    /// Iterates projections in append order.
    pub fn projections(&self) -> impl Iterator<Item = &ProjectionNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::Projection(projection) => Some(projection),
            _ => None,
        })
    }

    /// Iterates branches in append order.
    pub fn branches(&self) -> impl Iterator<Item = &BranchNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::Branch(branch) => Some(branch),
            _ => None,
        })
    }

    /// Iterates evidence nodes in append order.
    pub fn evidence(&self) -> impl Iterator<Item = &EvidenceNode> {
        self.nodes.iter().filter_map(|node| match node {
            GraphNode::Evidence(evidence) => Some(evidence),
            _ => None,
        })
    }

    /// Appends a semantic entity.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for a snapshot mismatch or duplicate ID.
    pub fn append_entity(&mut self, node: EntityNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        self.append(GraphNode::Entity(node))
    }

    /// Appends an atomic or superposed view.
    ///
    /// Superposition components must already exist as graph views.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for a snapshot mismatch, missing
    /// component, or duplicate ID.
    pub fn append_view(&mut self, node: ViewNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        for component in node.component_views() {
            self.ensure_atomic_view_matches(component)?;
        }
        self.append(GraphNode::View(node))
    }

    /// Appends a relation whose endpoints already exist.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for a snapshot mismatch, dangling
    /// endpoint, or duplicate ID.
    pub fn append_relation(&mut self, node: RelationNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        self.ensure_endpoint(node.from())?;
        self.ensure_endpoint(node.to())?;
        if !self.relation_endpoints_are_valid(&node) {
            return Err(RelationGraphError::InvalidRelationEndpoints);
        }
        self.append(GraphNode::Relation(node))
    }

    /// Appends a projection whose endpoints and component views already exist.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for a snapshot mismatch, dangling
    /// endpoint/view, or duplicate ID.
    pub fn append_projection(&mut self, node: ProjectionNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        self.ensure_endpoint(node.from())?;
        self.ensure_endpoint(node.to())?;
        for view in node.component_views() {
            self.ensure_atomic_view_matches(view)?;
        }
        self.append(GraphNode::Projection(node))
    }

    /// Appends a branch after its parent and optional derived view exist.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for invalid parents, a snapshot
    /// mismatch, a missing view, or duplicate ID.
    pub fn append_branch(&mut self, node: BranchNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        if !matches!(node.parent(), NodeRef::Snapshot(_) | NodeRef::Branch(_)) {
            return Err(RelationGraphError::InvalidBranchParent);
        }
        self.ensure_endpoint(node.parent())?;
        if let Some(view_id) = node.view_id() {
            self.ensure_endpoint(&NodeRef::View(view_id.clone()))?;
        }
        self.append(GraphNode::Branch(node))
    }

    /// Appends evidence after its subject exists.
    ///
    /// # Errors
    ///
    /// Returns [`RelationGraphError`] for a snapshot mismatch, dangling
    /// subject, mismatched state identity, or duplicate ID.
    pub fn append_evidence(&mut self, node: EvidenceNode) -> Result<(), RelationGraphError> {
        self.ensure_snapshot(node.source_snapshot())?;
        self.ensure_endpoint(node.subject())?;
        match node.state() {
            EvidenceState::Unknown => {}
            EvidenceState::Valid(id) | EvidenceState::Invalid(id) | EvidenceState::Conflict(id) => {
                if id != node.evidence_id() {
                    return Err(RelationGraphError::EvidenceIdentityMismatch);
                }
            }
        }
        self.append(GraphNode::Evidence(node))
    }

    fn ensure_snapshot(&self, source_snapshot: &SourceSnapshot) -> Result<(), RelationGraphError> {
        if source_snapshot == &self.source_snapshot {
            Ok(())
        } else {
            Err(RelationGraphError::SnapshotMismatch)
        }
    }

    fn ensure_endpoint(&self, node_ref: &NodeRef) -> Result<(), RelationGraphError> {
        if self.contains(node_ref) {
            Ok(())
        } else {
            Err(RelationGraphError::DanglingEndpoint)
        }
    }

    fn ensure_atomic_view_matches(&self, expected: &ViewRecord) -> Result<(), RelationGraphError> {
        let node_ref = NodeRef::View(expected.view_id().clone());
        self.ensure_endpoint(&node_ref)?;
        match self.node(&node_ref) {
            Some(GraphNode::View(ViewNode {
                definition: ViewNodeDefinition::Atomic(stored),
            })) if stored.as_ref() == expected => Ok(()),
            _ => Err(RelationGraphError::ViewDefinitionMismatch),
        }
    }

    fn relation_endpoints_are_valid(&self, relation: &RelationNode) -> bool {
        let from = relation.from();
        let to = relation.to();
        match relation.kind() {
            RelationKind::SnapshotOf => {
                matches!((from, to), (NodeRef::Snapshot(_), NodeRef::Source(_)))
            }
            RelationKind::Represents => match from {
                NodeRef::View(_) => matches!(to, NodeRef::Entity(_) | NodeRef::Snapshot(_)),
                NodeRef::Entity(_) => {
                    self.entity_kind(from) == Some(EntityKind::Document)
                        && matches!(to, NodeRef::Snapshot(_))
                }
                _ => false,
            },
            RelationKind::Contains => {
                matches!(
                    self.entity_kind(from),
                    Some(EntityKind::Document | EntityKind::Frame | EntityKind::DomElement)
                ) && matches!(
                    self.entity_kind(to),
                    Some(EntityKind::Document | EntityKind::Frame | EntityKind::DomElement)
                )
            }
            RelationKind::References => {
                matches!(
                    self.entity_kind(from),
                    Some(EntityKind::Document | EntityKind::DomElement)
                ) && self.entity_kind(to) == Some(EntityKind::Resource)
            }
            RelationKind::OriginatesAt => {
                matches!(from, NodeRef::Entity(_))
                    && self.entity_kind(from) != Some(EntityKind::Origin)
                    && self.entity_kind(to) == Some(EntityKind::Origin)
            }
            RelationKind::NavigatesTo => {
                self.entity_kind(from) == Some(EntityKind::Navigation)
                    && matches!(
                        self.entity_kind(to),
                        Some(EntityKind::Document | EntityKind::Origin)
                    )
            }
            RelationKind::Selects => {
                self.entity_kind(from) == Some(EntityKind::Selection)
                    && matches!(
                        self.entity_kind(to),
                        Some(EntityKind::Document | EntityKind::DomElement)
                    )
            }
            RelationKind::Projects => {
                matches!(to, NodeRef::View(_) | NodeRef::Entity(_))
                    && matches!(
                        self.node(from),
                        Some(GraphNode::Projection(projection)) if projection.to() == to
                    )
            }
            RelationKind::BranchesFrom => {
                matches!(
                    self.node(from),
                    Some(GraphNode::Branch(branch)) if branch.parent() == to
                )
            }
            RelationKind::SupportedBy => {
                !matches!(from, NodeRef::Evidence(_))
                    && matches!(
                        self.node(to),
                        Some(GraphNode::Evidence(evidence)) if evidence.subject() == from
                    )
            }
        }
    }

    fn entity_kind(&self, node_ref: &NodeRef) -> Option<EntityKind> {
        match self.node(node_ref) {
            Some(GraphNode::Entity(entity)) => Some(entity.kind()),
            _ => None,
        }
    }

    fn append(&mut self, node: GraphNode) -> Result<(), RelationGraphError> {
        let node_ref = node.node_ref();
        if !self.node_refs.insert(node_ref) {
            return Err(RelationGraphError::DuplicateNode);
        }
        self.nodes.push(node);
        Ok(())
    }
}

/// Structural failure while extending a relation graph.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RelationGraphError {
    /// A node identity already exists in the graph.
    DuplicateNode,
    /// A child references a node that has not been appended.
    DanglingEndpoint,
    /// A node belongs to a different immutable snapshot.
    SnapshotMismatch,
    /// A branch parent is neither a snapshot nor another branch.
    InvalidBranchParent,
    /// A determinate evidence state refers to another evidence identity.
    EvidenceIdentityMismatch,
    /// A composite or projection supplied a different definition for an
    /// existing view identity.
    ViewDefinitionMismatch,
    /// A closed relation kind was combined with incompatible endpoint types.
    InvalidRelationEndpoints,
}

impl fmt::Display for RelationGraphError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::DuplicateNode => "graph node identity already exists",
            Self::DanglingEndpoint => "graph child references a missing parent or endpoint",
            Self::SnapshotMismatch => "graph node belongs to another source snapshot",
            Self::InvalidBranchParent => "branch parent must be a snapshot or branch node",
            Self::EvidenceIdentityMismatch => {
                "evidence state identity does not match the evidence node"
            }
            Self::ViewDefinitionMismatch => {
                "view identity exists, but its complete stored definition differs"
            }
            Self::InvalidRelationEndpoints => {
                "relation kind is incompatible with the supplied endpoint types"
            }
        })
    }
}

impl Error for RelationGraphError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        CanonicalAxes, Digest256, FrameId, FramePose, ReferenceFrame, ViewDirection, ViewHistory,
    };

    fn source(name: &str) -> SourceSnapshot {
        SourceSnapshot::new(
            SourceId::new(name).unwrap(),
            SnapshotId::new(format!("{name}-snapshot")).unwrap(),
            Digest256::new([u8::try_from(name.len()).unwrap(); 32]),
        )
    }

    fn records(source: &SourceSnapshot) -> Vec<ViewRecord> {
        let mut history = ViewHistory::new(source);
        let first = ReferenceFrame::root(FrameId::new("frame-0").unwrap(), FramePose::identity());
        let second = first
            .moved(FrameId::new("frame-1").unwrap(), FramePose::identity())
            .unwrap();
        history
            .append(
                ViewId::new("view-0").unwrap(),
                &first,
                ViewDirection::Forward,
                CanonicalAxes::default(),
            )
            .unwrap();
        history
            .append(
                ViewId::new("view-1").unwrap(),
                &second,
                ViewDirection::Counter,
                CanonicalAxes::default(),
            )
            .unwrap();
        history.entries().to_vec()
    }

    #[test]
    fn graph_is_additive_and_keeps_parent_snapshot_unchanged() {
        let source = source("source");
        let original = source.clone();
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        let document = EntityNode::new(
            EntityId::new("document").unwrap(),
            &source,
            EntityKind::Document,
        );
        graph.append_entity(document).unwrap();
        let views = records(&source);
        graph.append_view(ViewNode::atomic(&views[0])).unwrap();
        graph.append_view(ViewNode::atomic(&views[1])).unwrap();
        let superposition =
            SuperpositionView::new(ViewId::new("view-combined").unwrap(), &views).unwrap();
        graph
            .append_view(ViewNode::superposition(superposition))
            .unwrap();

        assert_eq!(source, original);
        assert_eq!(graph.source_snapshot(), &source);
        assert_eq!(graph.nodes().len(), 6);
        assert_eq!(graph.views().count(), 3);
        assert!(graph.contains(&NodeRef::View(ViewId::new("view-0").unwrap())));
    }

    #[test]
    fn dangling_duplicate_and_cross_snapshot_nodes_fail_closed() {
        let source_snapshot = source("source");
        let other = source("other");
        let mut graph =
            RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source_snapshot);

        assert_eq!(
            graph.append_relation(RelationNode::new(
                RelationId::new("relation").unwrap(),
                &source_snapshot,
                RelationKind::Contains,
                NodeRef::Snapshot(source_snapshot.snapshot_id().clone()),
                NodeRef::Entity(EntityId::new("missing").unwrap()),
            )),
            Err(RelationGraphError::DanglingEndpoint)
        );
        graph
            .append_entity(EntityNode::new(
                EntityId::new("document").unwrap(),
                &source_snapshot,
                EntityKind::Document,
            ))
            .unwrap();
        assert_eq!(
            graph.append_entity(EntityNode::new(
                EntityId::new("document").unwrap(),
                &source_snapshot,
                EntityKind::Document,
            )),
            Err(RelationGraphError::DuplicateNode)
        );
        assert_eq!(
            graph.append_entity(EntityNode::new(
                EntityId::new("other-document").unwrap(),
                &other,
                EntityKind::Document,
            )),
            Err(RelationGraphError::SnapshotMismatch)
        );
    }

    #[test]
    fn projection_branch_and_evidence_require_existing_context() {
        let source = source("source");
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        graph
            .append_entity(EntityNode::new(
                EntityId::new("document").unwrap(),
                &source,
                EntityKind::Document,
            ))
            .unwrap();
        let views = records(&source);
        graph.append_view(ViewNode::atomic(&views[0])).unwrap();
        let projection = ProjectionNode::single_frame(
            ProjectionId::new("projection").unwrap(),
            &views[0],
            NodeRef::Snapshot(source.snapshot_id().clone()),
            NodeRef::Entity(EntityId::new("document").unwrap()),
        );
        graph.append_projection(projection).unwrap();
        let root = BranchNode::root(
            BranchId::new("branch-root").unwrap(),
            &source,
            source.snapshot_id().clone(),
        );
        graph.append_branch(root).unwrap();
        let derived = BranchNode::derived(
            BranchId::new("branch-1").unwrap(),
            &source,
            NodeRef::Branch(BranchId::new("branch-root").unwrap()),
            views[0].view_id().clone(),
        );
        graph.append_branch(derived).unwrap();
        let evidence_id = EvidenceId::new("evidence").unwrap();
        graph
            .append_evidence(EvidenceNode::new(
                evidence_id.clone(),
                &source,
                NodeRef::Branch(BranchId::new("branch-1").unwrap()),
                EvidenceState::Valid(evidence_id),
            ))
            .unwrap();
        graph
            .append_relation(RelationNode::new(
                RelationId::new("branch-parent").unwrap(),
                &source,
                RelationKind::BranchesFrom,
                NodeRef::Branch(BranchId::new("branch-1").unwrap()),
                NodeRef::Branch(BranchId::new("branch-root").unwrap()),
            ))
            .unwrap();
        graph
            .append_relation(RelationNode::new(
                RelationId::new("branch-evidence").unwrap(),
                &source,
                RelationKind::SupportedBy,
                NodeRef::Branch(BranchId::new("branch-1").unwrap()),
                NodeRef::Evidence(EvidenceId::new("evidence").unwrap()),
            ))
            .unwrap();
        assert_eq!(
            graph.append_relation(RelationNode::new(
                RelationId::new("false-branch-parent").unwrap(),
                &source,
                RelationKind::BranchesFrom,
                NodeRef::Branch(BranchId::new("branch-1").unwrap()),
                NodeRef::Snapshot(source.snapshot_id().clone()),
            )),
            Err(RelationGraphError::InvalidRelationEndpoints)
        );
        assert_eq!(
            graph.append_relation(RelationNode::new(
                RelationId::new("false-evidence-subject").unwrap(),
                &source,
                RelationKind::SupportedBy,
                NodeRef::Snapshot(source.snapshot_id().clone()),
                NodeRef::Evidence(EvidenceId::new("evidence").unwrap()),
            )),
            Err(RelationGraphError::InvalidRelationEndpoints)
        );

        assert_eq!(graph.projections().count(), 1);
        assert_eq!(graph.branches().count(), 2);
        assert_eq!(graph.evidence().count(), 1);
        assert_eq!(graph.relations().count(), 2);
    }

    #[test]
    fn graph_rejects_superposition_before_component_views() {
        let source = source("source");
        let views = records(&source);
        let superposition =
            SuperpositionView::new(ViewId::new("view-combined").unwrap(), &views).unwrap();
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        assert_eq!(
            graph.append_view(ViewNode::superposition(superposition)),
            Err(RelationGraphError::DanglingEndpoint)
        );
    }

    #[test]
    fn composite_and_projection_require_the_complete_stored_view_definition() {
        let source = source("source");
        let stored = records(&source);
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        graph
            .append_entity(EntityNode::new(
                EntityId::new("document").unwrap(),
                &source,
                EntityKind::Document,
            ))
            .unwrap();
        graph.append_view(ViewNode::atomic(&stored[0])).unwrap();
        graph.append_view(ViewNode::atomic(&stored[1])).unwrap();

        let forged_frame =
            ReferenceFrame::root(FrameId::new("forged-frame").unwrap(), FramePose::identity());
        let mut forged_history = ViewHistory::new(&source);
        let forged = forged_history
            .append(
                stored[0].view_id().clone(),
                &forged_frame,
                ViewDirection::Counter,
                CanonicalAxes::default(),
            )
            .unwrap()
            .clone();

        let superposition = SuperpositionView::new(
            ViewId::new("superposition").unwrap(),
            &[forged.clone(), stored[1].clone()],
        )
        .unwrap();
        assert_eq!(
            graph.append_view(ViewNode::superposition(superposition)),
            Err(RelationGraphError::ViewDefinitionMismatch)
        );

        let projection = ProjectionNode::single_frame(
            ProjectionId::new("projection").unwrap(),
            &forged,
            NodeRef::Snapshot(source.snapshot_id().clone()),
            NodeRef::Entity(EntityId::new("document").unwrap()),
        );
        assert_eq!(
            graph.append_projection(projection),
            Err(RelationGraphError::ViewDefinitionMismatch)
        );
    }

    #[test]
    fn relation_kinds_enforce_their_endpoint_contracts() {
        let source = source("source");
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        graph
            .append_entity(EntityNode::new(
                EntityId::new("document").unwrap(),
                &source,
                EntityKind::Document,
            ))
            .unwrap();
        graph
            .append_entity(EntityNode::new(
                EntityId::new("selection").unwrap(),
                &source,
                EntityKind::Selection,
            ))
            .unwrap();
        graph
            .append_relation(RelationNode::new(
                RelationId::new("snapshot-of").unwrap(),
                &source,
                RelationKind::SnapshotOf,
                NodeRef::Snapshot(source.snapshot_id().clone()),
                NodeRef::Source(source.source_id().clone()),
            ))
            .unwrap();
        graph
            .append_relation(RelationNode::new(
                RelationId::new("selection-of-document").unwrap(),
                &source,
                RelationKind::Selects,
                NodeRef::Entity(EntityId::new("selection").unwrap()),
                NodeRef::Entity(EntityId::new("document").unwrap()),
            ))
            .unwrap();
        assert_eq!(
            graph.append_relation(RelationNode::new(
                RelationId::new("invalid-selection").unwrap(),
                &source,
                RelationKind::Selects,
                NodeRef::Source(source.source_id().clone()),
                NodeRef::Entity(EntityId::new("document").unwrap()),
            )),
            Err(RelationGraphError::InvalidRelationEndpoints)
        );
    }

    #[test]
    fn evidence_state_must_use_the_node_identity() {
        let source = source("source");
        let mut graph = RelationGraph::new(RelationGraphId::new("graph").unwrap(), &source);
        assert_eq!(
            graph.append_evidence(EvidenceNode::new(
                EvidenceId::new("evidence-node").unwrap(),
                &source,
                NodeRef::Snapshot(source.snapshot_id().clone()),
                EvidenceState::Valid(EvidenceId::new("different-evidence").unwrap()),
            )),
            Err(RelationGraphError::EvidenceIdentityMismatch)
        );
    }
}
