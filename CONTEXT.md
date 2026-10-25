# Philippine Food Discovery and Recipe Assistant

This context defines the core language for reviewed recipe knowledge used by discovery and retrieval.

## Knowledge retrieval

**Knowledge Document**:
A stable, reviewable unit of searchable knowledge derived from a domain record. It owns one or more immutable content versions.
_Avoid_: Knowledge record, vector record

**Knowledge Document Version**:
An immutable snapshot of the searchable text for a Knowledge Document. A new snapshot is created whenever searchable content materially changes.
_Avoid_: Mutable document text, embedding version

**Embedding**:
A vector representation of one Knowledge Document Version produced by a named embedding model. It is derived data and can be regenerated without changing the content version.
_Avoid_: Knowledge Document, content version

**Review State**:
The lifecycle classification that records whether a Knowledge Document is awaiting review, published as trusted knowledge, or withdrawn from trusted retrieval.
_Avoid_: Approval flag, visibility

**Withdrawn Knowledge Document**:
A retained Knowledge Document that is no longer eligible for trusted retrieval. Withdrawal preserves its history instead of deleting it.
_Avoid_: Deleted document
