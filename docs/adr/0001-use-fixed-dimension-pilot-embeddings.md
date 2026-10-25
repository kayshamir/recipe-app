# Use fixed-dimension pilot embeddings

The pilot stores server-owned Ollama `nomic-embed-text` embeddings as
`vector(768)` and indexes them with cosine HNSW. Although an unparameterized
pgvector column can hold mixed dimensions, approximate indexes require
same-dimension vectors or model-specific expression indexes; enforcing the
selected dimension keeps invalid data out and keeps retrieval straightforward.
A future model with different dimensions requires an explicit schema migration
and re-embedding, while the mobile client remains independent of both provider
and vector shape.
