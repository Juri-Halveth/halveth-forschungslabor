use std::{collections::BTreeSet, error::Error, fmt};

use crate::{FrameId, ProjectionId, SourceSnapshot, ViewId, ViewRecord};

/// A new additive view composed from existing views of one snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SuperpositionView {
    view_id: ViewId,
    source_snapshot: SourceSnapshot,
    components: Vec<ViewRecord>,
}

impl SuperpositionView {
    /// Builds a superposition from at least two distinct existing views.
    ///
    /// # Errors
    ///
    /// Returns [`CompositeViewError`] when too few views are supplied, a
    /// component identity is duplicated, the new identity reuses a component
    /// identity, or components refer to different snapshots.
    pub fn new(view_id: ViewId, components: &[ViewRecord]) -> Result<Self, CompositeViewError> {
        validate_components(components)?;
        if components
            .iter()
            .any(|component| component.view_id() == &view_id)
        {
            return Err(CompositeViewError::OutputReusesComponentId);
        }
        Ok(Self {
            view_id,
            source_snapshot: components[0].source_snapshot().clone(),
            components: components.to_vec(),
        })
    }

    /// Returns the new, additive view identity.
    #[must_use]
    pub const fn view_id(&self) -> &ViewId {
        &self.view_id
    }

    /// Returns the immutable snapshot shared by all components.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns component views without replacing them.
    #[must_use]
    pub fn components(&self) -> &[ViewRecord] {
        &self.components
    }
}

/// A projection that references at least two distinct frames of one snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MultiFrameReferenceProjection {
    projection_id: ProjectionId,
    source_snapshot: SourceSnapshot,
    components: Vec<ViewRecord>,
}

impl MultiFrameReferenceProjection {
    /// Builds a multi-frame projection from existing atomic views.
    ///
    /// # Errors
    ///
    /// Returns [`CompositeViewError`] for invalid view components or when the
    /// components do not cover at least two distinct frame identities.
    pub fn new(
        projection_id: ProjectionId,
        components: &[ViewRecord],
    ) -> Result<Self, CompositeViewError> {
        validate_components(components)?;
        let frames: BTreeSet<&FrameId> = components.iter().map(ViewRecord::frame_id).collect();
        if frames.len() < 2 {
            return Err(CompositeViewError::TooFewDistinctFrames);
        }
        Ok(Self {
            projection_id,
            source_snapshot: components[0].source_snapshot().clone(),
            components: components.to_vec(),
        })
    }

    /// Returns this projection's identity.
    #[must_use]
    pub const fn projection_id(&self) -> &ProjectionId {
        &self.projection_id
    }

    /// Returns the immutable snapshot shared by all component frames.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns component views in caller-supplied order.
    #[must_use]
    pub fn components(&self) -> &[ViewRecord] {
        &self.components
    }
}

fn validate_components(components: &[ViewRecord]) -> Result<(), CompositeViewError> {
    if components.len() < 2 {
        return Err(CompositeViewError::TooFewViews);
    }
    let source = components[0].source_snapshot();
    if components
        .iter()
        .any(|component| component.source_snapshot() != source)
    {
        return Err(CompositeViewError::SnapshotMismatch);
    }
    let view_ids: BTreeSet<&ViewId> = components.iter().map(ViewRecord::view_id).collect();
    if view_ids.len() != components.len() {
        return Err(CompositeViewError::DuplicateViewId);
    }
    Ok(())
}

/// Structural failure while constructing a composite view or projection.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CompositeViewError {
    /// At least two component views are required.
    TooFewViews,
    /// Component view identities must be distinct.
    DuplicateViewId,
    /// A new superposition identity cannot reuse a component identity.
    OutputReusesComponentId,
    /// Every component must see the same immutable snapshot.
    SnapshotMismatch,
    /// A multi-frame projection requires at least two distinct frames.
    TooFewDistinctFrames,
}

impl fmt::Display for CompositeViewError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::TooFewViews => "at least two component views are required",
            Self::DuplicateViewId => "component view identities must be distinct",
            Self::OutputReusesComponentId => {
                "a superposition identity must differ from every component identity"
            }
            Self::SnapshotMismatch => "component views refer to different source snapshots",
            Self::TooFewDistinctFrames => {
                "a multi-frame projection requires at least two distinct frames"
            }
        })
    }
}

impl Error for CompositeViewError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        CanonicalAxes, Digest256, FrameId, FramePose, ReferenceFrame, SnapshotId, SourceId,
        ViewDirection, ViewHistory,
    };

    fn source(name: &str) -> SourceSnapshot {
        SourceSnapshot::new(
            SourceId::new(name).unwrap(),
            SnapshotId::new(format!("{name}-snapshot")).unwrap(),
            Digest256::new([u8::try_from(name.len()).unwrap(); 32]),
        )
    }

    fn views(source: &SourceSnapshot) -> Vec<ViewRecord> {
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
    fn superposition_is_new_and_keeps_components_unchanged() {
        let source = source("source");
        let views = views(&source);
        let original = views.clone();
        let superposition =
            SuperpositionView::new(ViewId::new("view-superposed").unwrap(), &views).unwrap();
        assert_eq!(views, original);
        assert_eq!(superposition.components(), views);
        assert_eq!(superposition.source_snapshot(), &source);
    }

    #[test]
    fn multi_frame_projection_requires_distinct_frames() {
        let source = source("source");
        let views = views(&source);
        assert!(
            MultiFrameReferenceProjection::new(ProjectionId::new("projection").unwrap(), &views,)
                .is_ok()
        );

        let repeated_frame = vec![views[0].clone(), {
            let mut history = ViewHistory::new(&source);
            let frame = views[0].frame().clone();
            history
                .append(
                    ViewId::new("view-other").unwrap(),
                    &frame,
                    ViewDirection::Counter,
                    CanonicalAxes::default(),
                )
                .unwrap()
                .clone()
        }];
        assert_eq!(
            MultiFrameReferenceProjection::new(
                ProjectionId::new("projection").unwrap(),
                &repeated_frame,
            ),
            Err(CompositeViewError::TooFewDistinctFrames)
        );
    }

    #[test]
    fn composite_views_reject_cross_snapshot_components() {
        let first_source = source("first");
        let second_source = source("second");
        let components = vec![
            views(&first_source)[0].clone(),
            views(&second_source)[0].clone(),
        ];
        assert_eq!(
            SuperpositionView::new(ViewId::new("combined").unwrap(), &components),
            Err(CompositeViewError::SnapshotMismatch)
        );
    }
}
