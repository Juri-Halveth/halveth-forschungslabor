use std::{error::Error, fmt, str::FromStr};

/// Error returned when a canonical identifier has no visible content.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IdentifierError {
    kind: &'static str,
}

impl IdentifierError {
    /// Returns the identifier type that failed validation.
    #[must_use]
    pub const fn kind(&self) -> &'static str {
        self.kind
    }
}

impl fmt::Display for IdentifierError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{} must contain visible content", self.kind)
    }
}

impl Error for IdentifierError {}

macro_rules! define_id {
    ($name:ident, $documentation:literal) => {
        #[doc = $documentation]
        #[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
        pub struct $name(String);

        impl $name {
            /// Creates an identifier without changing its spelling.
            ///
            /// # Errors
            ///
            /// Returns [`IdentifierError`] when `value` is empty or consists
            /// only of whitespace.
            pub fn new(value: impl Into<String>) -> Result<Self, IdentifierError> {
                let value = value.into();
                if value.trim().is_empty() {
                    Err(IdentifierError {
                        kind: stringify!($name),
                    })
                } else {
                    Ok(Self(value))
                }
            }

            /// Returns the exact identifier spelling supplied at construction.
            #[must_use]
            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str(&self.0)
            }
        }

        impl FromStr for $name {
            type Err = IdentifierError;

            fn from_str(value: &str) -> Result<Self, Self::Err> {
                Self::new(value)
            }
        }
    };
}

define_id!(SourceId, "Stable identity of a source lineage.");
define_id!(SnapshotId, "Identity of one immutable source snapshot.");
define_id!(
    FrameId,
    "Identity of one immutable reference-frame revision."
);
define_id!(ViewId, "Identity of one entry in a view history.");
define_id!(BindingId, "Identity of a positive binding.");
define_id!(DerivationId, "Identity of a known derivation recipe.");
define_id!(
    MaterializationId,
    "Identity of a materialized representation."
);
define_id!(EvidenceId, "Identity of attached evidence.");
define_id!(
    TransformId,
    "Identity of a forward/counter transform contract."
);
define_id!(SpaceId, "Identity of a transform space.");
define_id!(ProjectionId, "Identity of a forward or counter projection.");
define_id!(ObjectId, "Identity of a derived object.");
define_id!(CrossProofId, "Identity of a forward/counter cross-proof.");
define_id!(RelationGraphId, "Identity of an additive relation graph.");
define_id!(
    EntityId,
    "Identity of an entity represented in a relation graph."
);
define_id!(RelationId, "Identity of a positive relation node.");
define_id!(BranchId, "Identity of an additive branch node.");
define_id!(ApertureId, "Identity of one immutable aperture revision.");

#[cfg(test)]
mod tests {
    use super::SourceId;

    #[test]
    fn identifiers_preserve_spelling_and_require_visible_content() {
        let identifier = SourceId::new("Source-A").expect("visible identifier");
        assert_eq!(identifier.as_str(), "Source-A");
        assert!(SourceId::new(" \t ").is_err());
    }
}
