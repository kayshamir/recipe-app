-- V2: pgvector is database schema, so Flyway owns it like every other DDL change.
-- The container supplies the extension binaries; this migration installs and
-- verifies the expected extension version inside the current database.

CREATE EXTENSION IF NOT EXISTS vector;

DO $$
DECLARE
    installed_version TEXT;
BEGIN
    SELECT extversion
      INTO installed_version
      FROM pg_extension
     WHERE extname = 'vector';

    IF installed_version IS NULL THEN
        RAISE EXCEPTION 'pgvector extension was not installed';
    END IF;

    IF installed_version <> '0.8.7' THEN
        EXECUTE 'ALTER EXTENSION vector UPDATE TO ''0.8.7''';

        SELECT extversion
          INTO installed_version
          FROM pg_extension
         WHERE extname = 'vector';
    END IF;

    IF installed_version <> '0.8.7' THEN
        RAISE EXCEPTION 'Expected pgvector 0.8.7, found %', installed_version;
    END IF;
END
$$;
