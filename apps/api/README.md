# Recipe App API — Kotlin / Ktor

The backend for the Philippine food discovery app: a Ktor server over
PostgreSQL (Exposed), organized with Domain-Driven Design. Scaffolded from the
[Ktor Project Generator](https://start.ktor.io); the Gradle project name is
still `kuery`.

Start here if Ktor is new to you: **[STRUCTURE.md](./STRUCTURE.md)** explains
this codebase using Laravel concepts as the reference frame.

- [Ktor Documentation](https://ktor.io/docs/home.html)
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — stack decisions
- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) / [PRD.md](../../PRD.md)
- [SETUP-03.md](./SETUP-03.md) — PostgreSQL + pgvector setup and verification

---

## Prerequisites

| Tool           | Version                  | Notes                                                  |
| -------------- | ------------------------ | ------------------------------------------------------ |
| JDK            | 21 (Temurin recommended) | `winget install EclipseAdoptium.Temurin.21.JDK`        |
| Gradle         | none needed              | use the wrapper `./gradlew` (`gradlew.bat` on Windows) |
| Docker Desktop | latest                   | only for running Postgres locally                      |

---

## Quick start

From the repo root, the interactive wizard handles Postgres + the server:

```powershell
npm run start      # → ⚙️ Backend API → 🔥 Run with hot reload
```

Or by hand:

```powershell
# 1) Postgres (pgvector) — from the repo root
docker compose -f infra/docker-compose.yml up -d

# 2) The API — from apps/api  (Flyway applies migrations automatically on boot)
./gradlew run                # http://localhost:8080
./gradlew -t classes         # (2nd terminal) recompile on edit → autoreload
```

The API boots even if Postgres is down; DB-backed routes then return `503`.

---

## Configuration

Settings come from two places (secrets never committed):

- **`application.yaml`** (`src/main/resources/`) — non-secret wiring: the module
  list, port, and `ktor.development: true` (autoreload).
- **Environment variables** — secrets, read in `infrastructure/Database.kt`.
  Copy `.env.example` → `.env`:

| Variable                              | Default                                       | Meaning                                               |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                        | `jdbc:postgresql://localhost:5432/recipe_dev` | JDBC URL                                              |
| `DATABASE_USER` / `DATABASE_PASSWORD` | `recipe` / `recipe`                           | credentials                                           |
| `AUTO_MIGRATE`                        | `true`                                        | run Flyway on boot; set `false` to defer to CI/deploy |
| `JWT_SECRET`                          | dev fallback                                  | **must** be set for production                        |

---

## Database & migrations

- **Flyway owns the schema (DDL).** Migrations live in
  `src/main/resources/db/migration/` (e.g. `V1__create_recipes_table.sql`) and
  run automatically at startup unless `AUTO_MIGRATE=false`.
- **Exposed owns runtime queries (DML) only** — it never creates schema.
  `contexts/recipes/infrastructure/RecipesTable.kt` is a typed _mirror_ of the
  Flyway schema; if they drift, queries fail loudly.
- **Imports use Exposed 1.x's versioned packages** (`org.jetbrains.exposed.v1.*`
  — `v1.core`, `v1.jdbc`, `v1.javatime`). The old `org.jetbrains.exposed.sql.*`
  paths no longer exist.
- **`Database.connect` is lazy** — it never opens a socket, so a startup
  "connected" is not proof of reachability. `configureDatabase()` therefore
  probes for real and logs `Database reachable` or a warning; `/healthz` is the
  authoritative check.
- **Postgres** runs via [`infra/docker-compose.yml`](../../infra/docker-compose.yml)
  (`pgvector/pgvector:0.8.7-pg16`, container `recipe-pg`, credentials matching
  the defaults above). Flyway installs and verifies the `vector` extension;
  Docker initialization scripts do not own schema.
- **Vector storage** uses immutable knowledge-document versions and a
  server-owned Ollama `nomic-embed-text` profile with 768-dimensional cosine
  embeddings. See [SETUP-03.md](./SETUP-03.md) for the schema and smoke test.

---

## API endpoints

All feature routes are namespaced under `/api/v1`.

| Method | Path                      | Purpose                    | Success               | Errors                     |
| ------ | ------------------------- | -------------------------- | --------------------- | -------------------------- |
| GET    | `/`                       | liveness hello             | 200                   | —                          |
| GET    | `/healthz`                | DB connectivity probe      | 200 `{"status":"ok"}` | 503 `database-unavailable` |
| GET    | `/api/v1/recipes?limit=N` | list (limit clamped 1–100) | 200                   | 503 if DB down             |
| POST   | `/api/v1/recipes`         | create `{title, cuisine?}` | 201                   | 400 validation · 503       |
| GET    | `/api/v1/recipes/{id}`    | fetch one                  | 200                   | 404 · 400 bad id · 503     |
| PUT    | `/api/v1/recipes/{id}`    | update `{title, cuisine?}` | 200                   | 404 · 400 · 503            |
| DELETE | `/api/v1/recipes/{id}`    | delete                     | 204                   | 404 · 503                  |

Errors use a consistent envelope: `{"error": "...", "message": "..."}` (see
`infrastructure/StatusPages.kt`).

---

## Building, running, testing

| Task                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `./gradlew run`        | Start Ktor on http://localhost:8080                 |
| `./gradlew -t classes` | Continuous compile — pair with `run` for hot reload |
| `./gradlew test`       | Run the unit + integration tests                    |
| `./gradlew build`      | Compile, test, and build the distribution           |

**Hot reload:** autoreload (`ktor.development: true`) only _restarts_ when
`.class` files change — it does not recompile Kotlin. Run `./gradlew -t classes`
alongside `./gradlew run` (or use the wizard's **🔥 Run with hot reload**, which
stages them so they never compile at the same instant). On a clean boot you'll
see:

```
INFO  Database - Flyway migrations applied
INFO  Database - Database reachable
INFO  Application - Responding at http://127.0.0.1:8080
```

---

## Project layout

See **[STRUCTURE.md](./STRUCTURE.md)** for the full Laravel→Kotlin map, the
four DDD layers, why there are two `infrastructure/` folders, and how the
structure scales.
