-- Runs automatically on first container start (empty data dir).
-- Enables pgvector so the future search-cache embeddings (ARCHITECTURE.md)
-- have the extension available. Harmless if unused for now.
CREATE EXTENSION IF NOT EXISTS vector;
