use crate::{Digest256, SnapshotId, SourceId};

/// An immutable identity record for one observed version of a source.
///
/// Payload acquisition and digest calculation live outside this crate. Private
/// fields and the absence of setters keep an established snapshot unchanged.
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct SourceSnapshot {
    source_id: SourceId,
    snapshot_id: SnapshotId,
    content_digest: Digest256,
}

impl SourceSnapshot {
    /// Creates a source snapshot from already established canonical values.
    #[must_use]
    pub const fn new(
        source_id: SourceId,
        snapshot_id: SnapshotId,
        content_digest: Digest256,
    ) -> Self {
        Self {
            source_id,
            snapshot_id,
            content_digest,
        }
    }

    /// Returns the stable source-lineage identity.
    #[must_use]
    pub const fn source_id(&self) -> &SourceId {
        &self.source_id
    }

    /// Returns the identity of this immutable snapshot.
    #[must_use]
    pub const fn snapshot_id(&self) -> &SnapshotId {
        &self.snapshot_id
    }

    /// Returns the digest bound to this snapshot.
    #[must_use]
    pub const fn content_digest(&self) -> Digest256 {
        self.content_digest
    }
}
