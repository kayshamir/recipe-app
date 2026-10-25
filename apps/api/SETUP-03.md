# SETUP-03 — PostgreSQL + pgvector

SETUP-03 provides a reproducible PostgreSQL 16 development database with
pgvector 0.8.7, versioned Flyway migrations, provider-aware vector storage, and
an automated similarity-query proof.

## What owns what

- Docker supplies PostgreSQL and the pgvector extension binaries.
- Flyway owns all database DDL, including `CREATE EXTENSION vector`.
- Exposed owns runtime DML for implemented contexts; it never creates schema.
- The mobile client does not know the embedding provider or dimensions.

The pilot embedding profile is server-owned: Ollama `nomic-embed-text`, 768
dimensions, and cosine distance. A provider change with a different dimension
requires a migration and re-embedding rather than mixing dimensions in one
index.

## Prerequisites

- JDK 21
- Docker Desktop or another Docker-compatible daemon

No Ollama process, model download, API key, or network call is needed for the
database integration test. It uses deterministic fixture vectors.

## Start the development database

From the repository root:

```powershell
docker compose -f infra/docker-compose.yml up -d db
docker compose -f infra/docker-compose.yml ps
```

The defaults are:

| Setting   | Value                                         |
| --------- | --------------------------------------------- |
| JDBC URL  | `jdbc:postgresql://localhost:5432/recipe_dev` |
| Database  | `recipe_dev`                                  |
| User      | `recipe`                                      |
| Password  | `recipe`                                      |
| Container | `recipe-pg`                                   |
| Image     | `pgvector/pgvector:0.8.7-pg16`                |

Start the API from `apps/api` with `./gradlew run`. Flyway applies pending
migrations by default. Set `AUTO_MIGRATE=false` only when another deployment
step is responsible for migrations.

If PostgreSQL is unavailable, local API startup remains degraded and
`/healthz` returns `503`. If PostgreSQL is reachable but authentication,
extension, checksum, or migration validation fails, startup fails instead of
running against an incompatible schema.

## Migration sequence

| Migration                                 | Result                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `V1__create_recipes_table.sql`            | Minimal recipe storage from SETUP-02                                            |
| `V2__enable_vector_extension.sql`         | Installs and verifies pgvector 0.8.7                                            |
| `V3__create_knowledge_vector_storage.sql` | Knowledge documents, immutable versions, embedding models, vectors, and indexes |

The vector schema has four responsibilities:

- `knowledge_documents`: stable identity and `pending`, `published`, or
  `withdrawn` review state.
- `knowledge_document_versions`: immutable searchable text identified by a
  positive version number and SHA-256 content hash.
- `embedding_models`: provider, model, dimensions, distance metric, and active
  profile state.
- `knowledge_embeddings`: one vector per document version and embedding model.

Foreign keys restrict deletion so document history cannot disappear through an
accidental cascade. Dish, final Recipe, and Source associations remain deferred
to BL-002.

## Verify storage and querying

From `apps/api`:

```powershell
./gradlew test
```

`DatabaseMigrationTest` starts the same pinned pgvector image with
Testcontainers, applies all migrations to an empty database, reruns Flyway to
prove there is no pending work, and verifies:

- pgvector 0.8.7 is installed;
- the Ollama `nomic-embed-text` profile is active;
- representative 768-dimensional vectors can be inserted;
- cosine nearest-neighbor search returns the expected document version;
- invalid dimensions are rejected; and
- the HNSW `vector_cosine_ops` index exists.

The nearest-neighbor query contract is:

```sql
SELECT 1 - (embedding <=> :query_vector) AS similarity
FROM knowledge_embeddings
ORDER BY embedding <=> :query_vector
LIMIT :result_count;
```

Ordering must use cosine distance ascending for PostgreSQL to consider the
matching index. Application retrieval must also restrict results to published
Knowledge Documents; implementing that repository belongs to BL-032.

## Reset local data

To stop PostgreSQL while retaining data:

```powershell
docker compose -f infra/docker-compose.yml down
```

To deliberately discard the development database and replay all migrations:

```powershell
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d db
```

The `-v` operation permanently deletes the local Docker volume. It is for
disposable development data only.

## Troubleshooting

- **Docker is unavailable:** start Docker Desktop, then rerun `./gradlew test`.
- **Port 5432 is occupied:** stop the conflicting PostgreSQL instance or set a
  different host port and matching `DATABASE_URL`.
- **Extension migration fails:** confirm the database uses the pinned pgvector
  image; the ordinary PostgreSQL image does not include pgvector binaries.
- **Existing volume has an incompatible extension:** back up any needed local
  data, recreate the disposable volume, and rerun Flyway.
