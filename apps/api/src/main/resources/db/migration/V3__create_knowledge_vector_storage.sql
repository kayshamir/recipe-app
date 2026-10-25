-- V3: provider-aware vector storage for immutable knowledge document versions.
-- Runtime ingestion and retrieval are intentionally deferred to BL-007/BL-032.

CREATE TABLE knowledge_documents (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    review_state  VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT knowledge_documents_pkey PRIMARY KEY (id),
    CONSTRAINT knowledge_documents_review_state_check
        CHECK (review_state IN ('pending', 'published', 'withdrawn'))
);

CREATE INDEX knowledge_documents_review_state_idx
    ON knowledge_documents (review_state);

CREATE TABLE knowledge_document_versions (
    id                     UUID      NOT NULL DEFAULT gen_random_uuid(),
    knowledge_document_id  UUID      NOT NULL,
    version_number         INTEGER   NOT NULL,
    searchable_text        TEXT      NOT NULL,
    content_hash           CHAR(64)  NOT NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT knowledge_document_versions_pkey PRIMARY KEY (id),
    CONSTRAINT knowledge_document_versions_document_fkey
        FOREIGN KEY (knowledge_document_id)
        REFERENCES knowledge_documents (id)
        ON DELETE RESTRICT,
    CONSTRAINT knowledge_document_versions_positive_version_check
        CHECK (version_number > 0),
    CONSTRAINT knowledge_document_versions_searchable_text_check
        CHECK (btrim(searchable_text) <> ''),
    CONSTRAINT knowledge_document_versions_content_hash_check
        CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT knowledge_document_versions_document_version_key
        UNIQUE (knowledge_document_id, version_number),
    CONSTRAINT knowledge_document_versions_document_hash_key
        UNIQUE (knowledge_document_id, content_hash)
);

CREATE INDEX knowledge_document_versions_document_idx
    ON knowledge_document_versions (knowledge_document_id);

CREATE TABLE embedding_models (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    provider         VARCHAR(100) NOT NULL,
    model_name       VARCHAR(200) NOT NULL,
    dimensions       INTEGER      NOT NULL,
    distance_metric  VARCHAR(20)  NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT embedding_models_pkey PRIMARY KEY (id),
    CONSTRAINT embedding_models_identity_key
        UNIQUE (provider, model_name, dimensions),
    CONSTRAINT embedding_models_dimensions_check
        CHECK (dimensions = 768),
    CONSTRAINT embedding_models_distance_metric_check
        CHECK (distance_metric = 'cosine')
);

CREATE UNIQUE INDEX embedding_models_one_active_idx
    ON embedding_models (is_active)
    WHERE is_active;

INSERT INTO embedding_models (
    provider,
    model_name,
    dimensions,
    distance_metric,
    is_active
) VALUES (
    'ollama',
    'nomic-embed-text',
    768,
    'cosine',
    TRUE
);

CREATE TABLE knowledge_embeddings (
    id                             UUID        NOT NULL DEFAULT gen_random_uuid(),
    knowledge_document_version_id  UUID        NOT NULL,
    embedding_model_id             UUID        NOT NULL,
    embedding                      vector(768) NOT NULL,
    created_at                     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT knowledge_embeddings_pkey PRIMARY KEY (id),
    CONSTRAINT knowledge_embeddings_document_version_fkey
        FOREIGN KEY (knowledge_document_version_id)
        REFERENCES knowledge_document_versions (id)
        ON DELETE RESTRICT,
    CONSTRAINT knowledge_embeddings_model_fkey
        FOREIGN KEY (embedding_model_id)
        REFERENCES embedding_models (id)
        ON DELETE RESTRICT,
    CONSTRAINT knowledge_embeddings_version_model_key
        UNIQUE (knowledge_document_version_id, embedding_model_id)
);

CREATE INDEX knowledge_embeddings_document_version_idx
    ON knowledge_embeddings (knowledge_document_version_id);

CREATE INDEX knowledge_embeddings_model_idx
    ON knowledge_embeddings (embedding_model_id);

CREATE INDEX knowledge_embeddings_cosine_hnsw_idx
    ON knowledge_embeddings
    USING hnsw (embedding vector_cosine_ops);
