/// A caller-supplied 256-bit digest.
///
/// The core stores and compares digest bytes but intentionally performs no
/// hashing or I/O itself.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct Digest256([u8; 32]);

impl Digest256 {
    /// Creates a digest from its canonical bytes.
    #[must_use]
    pub const fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Returns the canonical digest bytes.
    #[must_use]
    pub const fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}
