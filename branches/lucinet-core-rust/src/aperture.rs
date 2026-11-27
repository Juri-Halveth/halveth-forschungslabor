use std::{collections::BTreeSet, error::Error, fmt};

use crate::{ApertureId, FrameId, FrameMoveError, FramePose, ReferenceFrame, SourceSnapshot};

/// One immutable revision of a freely movable perspective.
///
/// An aperture changes only the reference frame from which a snapshot is
/// viewed. It exposes no permission, allow-list, deny-list, or mutation API.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Aperture {
    id: ApertureId,
    lineage_root: ApertureId,
    parent: Option<ApertureId>,
    revision: u64,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    seen_aperture_ids: BTreeSet<ApertureId>,
}

impl Aperture {
    /// Creates revision zero of a perspective over an immutable snapshot.
    #[must_use]
    pub fn root(
        aperture_id: ApertureId,
        source_snapshot: &SourceSnapshot,
        frame: ReferenceFrame,
    ) -> Self {
        Self {
            lineage_root: aperture_id.clone(),
            parent: None,
            revision: 0,
            source_snapshot: source_snapshot.clone(),
            frame,
            seen_aperture_ids: BTreeSet::from([aperture_id.clone()]),
            id: aperture_id,
        }
    }

    /// Derives the next perspective and frame revision.
    ///
    /// # Errors
    ///
    /// Returns [`ApertureMoveError::ReusedApertureId`] when an aperture
    /// identity is reused, [`ApertureMoveError::RevisionOverflow`] when its
    /// revision cannot advance, or [`ApertureMoveError::Frame`] when the
    /// wrapped reference-frame lineage rejects the move.
    pub fn moved(
        &self,
        next_aperture_id: ApertureId,
        next_frame_id: FrameId,
        pose: FramePose,
    ) -> Result<Self, ApertureMoveError> {
        if self.seen_aperture_ids.contains(&next_aperture_id) {
            return Err(ApertureMoveError::ReusedApertureId);
        }
        let revision = self
            .revision
            .checked_add(1)
            .ok_or(ApertureMoveError::RevisionOverflow)?;
        let frame = self
            .frame
            .moved(next_frame_id, pose)
            .map_err(ApertureMoveError::Frame)?;
        let mut seen_aperture_ids = self.seen_aperture_ids.clone();
        seen_aperture_ids.insert(next_aperture_id.clone());
        Ok(Self {
            id: next_aperture_id,
            lineage_root: self.lineage_root.clone(),
            parent: Some(self.id.clone()),
            revision,
            source_snapshot: self.source_snapshot.clone(),
            frame,
            seen_aperture_ids,
        })
    }

    /// Returns this immutable aperture revision's identity.
    #[must_use]
    pub const fn aperture_id(&self) -> &ApertureId {
        &self.id
    }

    /// Returns the first identity in this aperture lineage.
    #[must_use]
    pub const fn lineage_root(&self) -> &ApertureId {
        &self.lineage_root
    }

    /// Returns the preceding aperture revision, if one exists.
    #[must_use]
    pub const fn parent_aperture(&self) -> Option<&ApertureId> {
        self.parent.as_ref()
    }

    /// Returns the monotonically increasing aperture revision.
    #[must_use]
    pub const fn revision(&self) -> u64 {
        self.revision
    }

    /// Returns the immutable snapshot seen by every lineage revision.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns this revision's reference frame.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }
}

/// Structural failure while deriving an aperture revision.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ApertureMoveError {
    /// A new aperture revision needs a new identity.
    ReusedApertureId,
    /// No further aperture revision can be represented.
    RevisionOverflow,
    /// The reference-frame lineage rejected the move.
    Frame(FrameMoveError),
}

impl fmt::Display for ApertureMoveError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ReusedApertureId => formatter.write_str("a moved aperture needs a new identity"),
            Self::RevisionOverflow => formatter.write_str("aperture revision overflow"),
            Self::Frame(error) => write!(formatter, "reference-frame move failed: {error}"),
        }
    }
}

impl Error for ApertureMoveError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Digest256, SnapshotId, SourceId};

    fn source() -> SourceSnapshot {
        SourceSnapshot::new(
            SourceId::new("source").unwrap(),
            SnapshotId::new("snapshot").unwrap(),
            Digest256::new([7; 32]),
        )
    }

    #[test]
    fn moving_an_aperture_moves_only_its_perspective() {
        let source = source();
        let original = source.clone();
        let root = Aperture::root(
            ApertureId::new("aperture-0").unwrap(),
            &source,
            ReferenceFrame::root(FrameId::new("frame-0").unwrap(), FramePose::identity()),
        );
        let moved = root
            .moved(
                ApertureId::new("aperture-1").unwrap(),
                FrameId::new("frame-1").unwrap(),
                FramePose::new([1, 2, 3], [4, 5, 6], [1_000_000; 3]).unwrap(),
            )
            .unwrap();

        assert_eq!(source, original);
        assert_eq!(moved.source_snapshot(), &source);
        assert_eq!(moved.parent_aperture(), Some(root.aperture_id()));
        assert_eq!(moved.frame().parent_frame(), Some(root.frame().frame_id()));
        assert_eq!(moved.revision(), 1);
    }

    #[test]
    fn an_aperture_identity_cannot_be_reused() {
        let source = source();
        let root = Aperture::root(
            ApertureId::new("aperture-0").unwrap(),
            &source,
            ReferenceFrame::root(FrameId::new("frame-0").unwrap(), FramePose::identity()),
        );
        assert_eq!(
            root.moved(
                ApertureId::new("aperture-0").unwrap(),
                FrameId::new("frame-1").unwrap(),
                FramePose::identity(),
            ),
            Err(ApertureMoveError::ReusedApertureId)
        );
    }
}
