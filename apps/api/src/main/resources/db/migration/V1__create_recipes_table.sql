-- V1: recipes table.
-- This is the single source of truth for the schema (Flyway owns DDL).
-- Keep it in lockstep with the Exposed mirror at
--   src/main/kotlin/com/recipeapp/contexts/recipes/infrastructure/RecipesTable.kt
-- Column types map: javaUUID -> UUID, varchar -> VARCHAR, datetime -> TIMESTAMP
-- (Exposed's `datetime` binds to LocalDateTime, i.e. timestamp WITHOUT time zone).

CREATE TABLE IF NOT EXISTS recipes (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    title       VARCHAR(300)  NOT NULL,
    cuisine     VARCHAR(100),
    source_url  VARCHAR(1000),
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recipes_pkey PRIMARY KEY (id)
);

-- List endpoint orders by created_at.
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes (created_at);
