use std::{error::Error, fmt};

use crate::{CanonicalAxes, FrameId, ReferenceFrame, SourceSnapshot, ViewId};

/// Direction represented by a view record.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum ViewDirection {
    /// Source-to-view projection.
    Forward,
    /// View-to-counterpart projection.
    Counter,
}

/// One immutable entry in an additive view history.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct ViewRecord {
    view_id: ViewId,
    sequence: u64,
    source_snapshot: SourceSnapshot,
    frame: ReferenceFrame,
    direction: ViewDirection,
    axes: CanonicalAxes,
}

impl ViewRecord {
    /// Returns the view identity.
    #[must_use]
    pub const fn view_id(&self) -> &ViewId {
        &self.view_id
    }

    /// Returns the zero-based append sequence.
    #[must_use]
    pub const fn sequence(&self) -> u64 {
        self.sequence
    }

    /// Returns the immutable source snapshot seen by this view.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns the reference-frame revision identity.
    #[must_use]
    pub const fn frame_id(&self) -> &FrameId {
        self.frame.frame_id()
    }

    /// Returns the reference-frame revision number.
    #[must_use]
    pub const fn frame_revision(&self) -> u64 {
        self.frame.revision()
    }

    /// Returns the complete immutable reference-frame revision.
    #[must_use]
    pub const fn frame(&self) -> &ReferenceFrame {
        &self.frame
    }

    /// Returns the view direction.
    #[must_use]
    pub const fn direction(&self) -> ViewDirection {
        self.direction
    }

    /// Returns the four independent canonical axes.
    #[must_use]
    pub const fn axes(&self) -> &CanonicalAxes {
        &self.axes
    }
}

/// Append-only-in-API history of views over one source snapshot.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ViewHistory {
    source_snapshot: SourceSnapshot,
    entries: Vec<ViewRecord>,
}

impl ViewHistory {
    /// Starts an empty history bound to one immutable source snapshot.
    #[must_use]
    pub fn new(source: &SourceSnapshot) -> Self {
        Self {
            source_snapshot: source.clone(),
            entries: Vec::new(),
        }
    }

    /// Appends a new view and assigns its sequence internally.
    ///
    /// No replacement or removal operation is exposed by this type.
    ///
    /// # Errors
    ///
    /// Returns [`ViewHistoryError::DuplicateViewId`] for an existing view
    /// identity, or [`ViewHistoryError::SequenceOverflow`] when no further
    /// `u64` sequence can be represented.
    pub fn append(
        &mut self,
        view_id: ViewId,
        frame: &ReferenceFrame,
        direction: ViewDirection,
        axes: CanonicalAxes,
    ) -> Result<&ViewRecord, ViewHistoryError> {
        if self.entries.iter().any(|record| record.view_id == view_id) {
            return Err(ViewHistoryError::DuplicateViewId);
        }

        let sequence =
            u64::try_from(self.entries.len()).map_err(|_| ViewHistoryError::SequenceOverflow)?;
        self.entries.push(ViewRecord {
            view_id,
            sequence,
            source_snapshot: self.source_snapshot.clone(),
            frame: frame.clone(),
            direction,
            axes,
        });
        self.entries
            .last()
            .ok_or(ViewHistoryError::SequenceOverflow)
    }

    /// Returns the immutable source snapshot identity shared by every entry.
    #[must_use]
    pub const fn source_snapshot(&self) -> &SourceSnapshot {
        &self.source_snapshot
    }

    /// Returns all entries in append order.
    #[must_use]
    pub fn entries(&self) -> &[ViewRecord] {
        &self.entries
    }

    /// Returns the number of appended views.
    #[must_use]
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Returns whether the history has no entries.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

/// Structural error while appending to a view history.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ViewHistoryError {
    /// The supplied view identity is already present.
    DuplicateViewId,
    /// The append sequence cannot be represented by `u64`.
    SequenceOverflow,
}

impl fmt::Display for ViewHistoryError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DuplicateViewId => formatter.write_str("view identity already exists"),
            Self::SequenceOverflow => formatter.write_str("view sequence overflow"),
        }
    }
}

impl Error for ViewHistoryError {}
