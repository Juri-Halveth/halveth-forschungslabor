use std::{collections::BTreeSet, error::Error, fmt};

use crate::FrameId;

const IDENTITY_SCALE_PPM: u64 = 1_000_000;

/// Deterministic fixed-point pose of a reference frame.
///
/// Translation uses caller-defined integral units, rotation uses microradians,
/// and scale uses parts per million. Integer coordinates avoid platform-level
/// floating-point differences in canonical values.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub struct FramePose {
    translation: [i64; 3],
    rotation_microradians: [i64; 3],
    scale_parts_per_million: [u64; 3],
}

impl FramePose {
    /// Creates a pose if each scale component is non-zero.
    ///
    /// # Errors
    ///
    /// Returns [`FramePoseError::ZeroScale`] with the first zero-scale axis.
    pub const fn new(
        translation: [i64; 3],
        rotation_microradians: [i64; 3],
        scale_parts_per_million: [u64; 3],
    ) -> Result<Self, FramePoseError> {
        let mut axis = 0;
        while axis < scale_parts_per_million.len() {
            if scale_parts_per_million[axis] == 0 {
                return Err(FramePoseError::ZeroScale { axis });
            }
            axis += 1;
        }

        Ok(Self {
            translation,
            rotation_microradians,
            scale_parts_per_million,
        })
    }

    /// Returns the identity pose.
    #[must_use]
    pub const fn identity() -> Self {
        Self {
            translation: [0; 3],
            rotation_microradians: [0; 3],
            scale_parts_per_million: [IDENTITY_SCALE_PPM; 3],
        }
    }

    /// Returns the translation vector.
    #[must_use]
    pub const fn translation(&self) -> [i64; 3] {
        self.translation
    }

    /// Returns the rotation vector in microradians.
    #[must_use]
    pub const fn rotation_microradians(&self) -> [i64; 3] {
        self.rotation_microradians
    }

    /// Returns the scale vector in parts per million.
    #[must_use]
    pub const fn scale_parts_per_million(&self) -> [u64; 3] {
        self.scale_parts_per_million
    }
}

impl Default for FramePose {
    fn default() -> Self {
        Self::identity()
    }
}

/// Structural error in a frame pose.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FramePoseError {
    /// A scale component was zero.
    ZeroScale {
        /// Zero-based coordinate axis.
        axis: usize,
    },
}

impl fmt::Display for FramePoseError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ZeroScale { axis } => write!(formatter, "scale on axis {axis} must be non-zero"),
        }
    }
}

impl Error for FramePoseError {}

/// One immutable revision of a movable reference frame.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ReferenceFrame {
    frame_id: FrameId,
    lineage_root: FrameId,
    parent_frame: Option<FrameId>,
    revision: u64,
    pose: FramePose,
    seen_frame_ids: BTreeSet<FrameId>,
}

impl ReferenceFrame {
    /// Creates revision zero of a frame lineage.
    #[must_use]
    pub fn root(frame_id: FrameId, pose: FramePose) -> Self {
        let seen_frame_ids = BTreeSet::from([frame_id.clone()]);
        Self {
            lineage_root: frame_id.clone(),
            frame_id,
            parent_frame: None,
            revision: 0,
            pose,
            seen_frame_ids,
        }
    }

    /// Derives the next immutable frame revision.
    ///
    /// # Errors
    ///
    /// Returns [`FrameMoveError::ReusedFrameId`] if the new revision reuses
    /// any identity in its lineage, or [`FrameMoveError::RevisionOverflow`]
    /// when the revision counter cannot advance.
    pub fn moved(&self, next_frame_id: FrameId, pose: FramePose) -> Result<Self, FrameMoveError> {
        if self.seen_frame_ids.contains(&next_frame_id) {
            return Err(FrameMoveError::ReusedFrameId);
        }
        let revision = self
            .revision
            .checked_add(1)
            .ok_or(FrameMoveError::RevisionOverflow)?;

        let mut seen_frame_ids = self.seen_frame_ids.clone();
        seen_frame_ids.insert(next_frame_id.clone());
        Ok(Self {
            frame_id: next_frame_id,
            lineage_root: self.lineage_root.clone(),
            parent_frame: Some(self.frame_id.clone()),
            revision,
            pose,
            seen_frame_ids,
        })
    }

    /// Returns this revision's identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        &self.frame_id
    }

    /// Returns the root identity of the frame lineage.
    #[must_use]
    pub const fn lineage_root(&self) -> &FrameId {
        &self.lineage_root
    }

    /// Returns the preceding frame revision, if one exists.
    #[must_use]
    pub const fn parent_frame(&self) -> Option<&FrameId> {
        self.parent_frame.as_ref()
    }

    /// Returns the monotonically increasing lineage revision.
    #[must_use]
    pub const fn revision(&self) -> u64 {
        self.revision
    }

    /// Returns the pose of this revision.
    #[must_use]
    pub const fn pose(&self) -> FramePose {
        self.pose
    }
}

/// Structural error while deriving a new frame revision.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum FrameMoveError {
    /// A new revision must have its own identity.
    ReusedFrameId,
    /// The lineage revision counter cannot be advanced further.
    RevisionOverflow,
}

impl fmt::Display for FrameMoveError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ReusedFrameId => formatter.write_str("a moved frame needs a new identity"),
            Self::RevisionOverflow => formatter.write_str("frame revision overflow"),
        }
    }
}

impl Error for FrameMoveError {}
