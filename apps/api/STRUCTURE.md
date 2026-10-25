# API Structure — A Migration Guide for Laravel Developers

> This document explains the Kotlin/Ktor codebase in `apps/api` using Laravel
> concepts as the reference frame. If you know where a piece of code "lives" in
> Laravel, you'll know where it lives here.
>
> For build/run instructions see [README.md](./README.md). For stack decisions
> see [ARCHITECTURE.md](../../ARCHITECTURE.md).

---

## 1. The one mental model shift

Laravel is a **convention framework**: it ships the structure (folders,
service container, facades, Artisan generators) and you fill it in.

Ktor is a **HTTP kernel**: it ships routing, plugins, and an application
builder — and *nothing else*. You compose the structure yourself with plain
Kotlin functions. There is no container, no facade layer, no `php artisan
make:controller`. That absence feels scary for a week, then liberating:
every dependency is visible, and the structure can evolve without fighting
a framework's opinions.

**Rule of thumb:** wherever Laravel uses *magic resolution*
(`app()`, facades, type-hinted constructor injection), this codebase uses
*explicit references* (module functions listed in `application.yaml`, a
global `database` val, direct function calls).

---

## 2. Request lifecycle

One request, top to bottom. Each step shows **Laravel → here**. Read it as a
single vertical line — a request enters at the top and leaves at the bottom.

```
1. Boot
   Laravel : public/index.php → bootstrap/app.php → Http\Kernel
   Here    : main() → application.yaml lists modules → Netty starts

2. Middleware / plugins (run on EVERY request)
   Laravel : Http\Kernel middleware group
   Here    : install(CORS), install(Compression),
             install(ContentNegotiation), install(StatusPages)

3. Route match
   Laravel : routes/api.php  →  Route::get('/recipes', ...)
   Here    : Routing.kt  →  route("/api/v1") { recipesRoutes() }
             → RecipesRoutes.kt  →  get { listRecipes(call) }

4. Controller (thin — parse + delegate)
   Laravel : RecipeController@index
   Here    : interfaces/RecipesController.kt  →  listRecipes(call)

5. Use case / application service (orchestration + rules)
   Laravel : an Action or Service you inject
   Here    : application/RecipeService.kt  (List/Get/Create/Update/Delete)

6. Data access  ←  THE BIG DIFFERENCE
   Laravel : Recipe::where(...)->get()   (Eloquent = Active Record)
   Here    : domain/RecipeRepository.kt  is a PORT (interface only)
             infrastructure/ExposedRecipeRepository.kt runs
             RecipesTable.selectAll().where { }.map { Recipe(...) }

7. Transform to output shape
   Laravel : RecipeResource (API Resource)
   Here    : interfaces/RecipeDto.kt  →  Recipe.toSummary()

8. Respond (auto-serialized to JSON)
   Laravel : return response()->json(...)
   Here    : call.respond(listOfDtos)  →  kotlinx.serialization
```

Steps 1–4 and 7–8 map almost 1:1 to Laravel. Step 6 is where DDD differs:
the domain **asks** for recipes via an interface, and a separate
infrastructure adapter answers with SQL. The controller never touches the
database directly — that indirection is what lets you unit-test step 5 with
a fake repository and no database (see `ListRecipesUseCaseTest`).

The dependency direction inside a context:

```
   interfaces  ──▶  application  ──▶  domain  ◀──  infrastructure
   (HTTP)            (use case)      (model+port)    (Exposed/Postgres)

   Arrows point toward the domain. The domain imports NOTHING but Kotlin.
```

---

## 3. Concept map (the cheat sheet)

| Laravel | Here | Where |
|---|---|---|
| `public/index.php` | `fun main()` | `main.kt` |
| `bootstrap/app.php` (providers, middleware, exceptions registration) | `application.yaml` → `ktor.application.modules` list | `src/main/resources/` |
| `app/Http/Kernel.php` middleware groups | Ktor **plugins** installed in module functions | `Http.kt`, `Serialization.kt`, `Security.kt` |
| `routes/api.php` | `routing { }` inside `configureRouting()` | `Routing.kt` |
| Controller class + action method | thin handler functions taking `ApplicationCall` | `contexts/recipes/interfaces/RecipesController.kt` |
| Form Request validation | `@Serializable` DTO + explicit checks in the use case | `interfaces/RecipeDto.kt` + `application/RecipeService.kt` |
| Eloquent Model (`Recipe`) | **three separate pieces**: `Recipe` (domain model), `RecipesTable` (schema mirror), `ExposedRecipeRepository` (queries) | `domain/Recipe.kt` · `infrastructure/RecipesTable.kt` |
| Query Builder (`Recipe::query()`) | Exposed DSL: `RecipesTable.selectAll().where { }.limit()` | `infrastructure/ExposedRecipeRepository.kt` |
| API Resource (`RecipeResource`) | `@Serializable data class RecipeSummary` / `RecipeDetail` | `interfaces/RecipeDto.kt` |
| `config/database.php` + `.env` | `connectToDatabase()` reading env vars | `Database.kt` |
| `config/*.php` generally | `application.yaml` (non-secret) + env vars (secrets) | `src/main/resources/` |
| `php artisan migrate` | Flyway runs at startup (`AUTO_MIGRATE`), or on demand | `infrastructure/Database.kt` |
| `database/migrations/xxxx_create_recipes_table.php` | `V1__create_recipes_table.sql` | `src/main/resources/db/migration/` |
| `php artisan serve` | `./gradlew run` | — |
| `php artisan make:*` | nothing — copy an existing domain folder and edit | — |
| Auth guard / Sanctum | `authentication { jwt { ... } }` | `Security.kt` |
| `Handler.php` / `withExceptions()` | `install(StatusPages)` exception→response map | `StatusPages.kt` |
| Service Container / DI | explicit globals + function parameters (boring on purpose) | everywhere |
| Facades (`DB::`, `Route::`) | don't exist; import and call the real thing | — |
| Jobs + queue worker (`dispatch(new X)`) | coroutine scheduler + `jobs` table in Postgres | future module |
| Artisan tinker / `php -a` | Gradle test tasks + `main()` | — |
| `composer.json` | `build.gradle.kts` + `gradle/libs.versions.toml` (version catalog = `require` block) | project root |
| Packagist | Maven Central | — |

---

## 4. Why the files look the way they do

The project was scaffolded by [start.ktor.io](https://start.ktor.io), which
follows a **"one file per framework concern"** layout:

| File | Laravel equivalent role |
|---|---|
| `main.kt` | `public/index.php` — literally three lines, starts the engine |
| `Http.kt` | middleware registration (CORS, compression, default headers) |
| `Serialization.kt` | the "Accept: application/json" transformer (ContentNegotiation + kotlinx JSON) |
| `Security.kt` | auth guard configuration |
| `StatusPages.kt` | exception handler |
| `Routing.kt` | `routes/api.php` |
| `Database.kt` | `config/database.php` + a tiny bit of `DB` bootstrap |
| ~~`Recipes.kt`~~ | the generator's single flat domain file — since split across the four DDD layers in `contexts/recipes/` (see § 6) |

`application.yaml` is the glue that Laravel keeps in PHP code: the `modules:`
list is the ordered "boot these functions at startup" register, exactly like
`providers => [...]` in `config/app.php`. **Adding a framework concern =
write a `fun Application.configureX()`, add it to that list.**

The package root is `com.recipeapp` (the generator's bare `com` default was
renamed). App-wide framework wiring lives in `com.recipeapp.infrastructure/`,
and each bounded context has its own `infrastructure/` layer too — see § 6 for
why there are two folders with the same name.

---

## 5. Eloquent vs Exposed — the part that will surprise you most

Laravel (Active Record — the model *is* the query and *is* the row):

```php
$recipes = Recipe::query()
    ->where('cuisine', 'Filipino')
    ->orderBy('created_at')
    ->limit(20)
    ->get();          // Collection<Recipe>, each row knows how to save/delete itself
```

Exposed (DSL — table object builds a query, rows are plain maps, you
convert to your own types):

```kotlin
transaction(db) {
    RecipesTable
        .selectAll()
        .where { RecipesTable.cuisine eq "Filipino" }
        .orderBy(RecipesTable.createdAt)
        .limit(20)
        .map { row ->
            RecipeSummary(                       // explicit, typed conversion
                id = row[RecipesTable.id].toString(),
                title = row[RecipesTable.title],
                cuisine = row[RecipesTable.cuisine],
            )
        }
}
```

Key differences to burn in:

1. **No lazy model magic.** `RecipesTable` never touches the database by
   itself; it's a description. The `transaction { }` block is where SQL
   actually executes — the analogue of Laravel opening a DB connection when
   you call `->get()`.
2. **No `->save()` on rows.** Inserts/updates are explicit statements:
   `RecipesTable.insert { it[title] = "..." }`. There is no object that
   "remembers" it came from the DB.
3. **Schema is NOT owned by the model.** In Laravel, `Schema::create` lives in
   migration files and the Model mirrors it by convention. Same split here:
   Flyway SQL migrations own the schema, `RecipesTable` mirrors it in Kotlin.
   If they drift, queries fail loudly — no silent `Column not found` surprises
   at runtime like Eloquent's `$fillable` guessing.
4. **Versioning gotcha:** Exposed 1.x moved every import from
   `org.jetbrains.exposed.sql.*` to `org.jetbrains.exposed.v1.*`
   (`v1.core`, `v1.jdbc`, `v1.javatime`). Old tutorials are wrong.

---

## 6. Scaling the structure — three stages

The current flat layout is **Stage 1**. It is correct for now. Don't build
Stage 3 on day one — but here is the map so you know where each Laravel
concept will land when the app grows.

### Stage 1 — single developer, ≤ ~10 endpoints (the generator scaffold's starting point)

```
src/main/kotlin/
├── main.kt, Http.kt, Serialization.kt, Security.kt,
├── StatusPages.kt, Routing.kt, Database.kt, Recipes.kt
```

Everything in one package. Fine. The cost of structure is ceremony; the cost
of *no* structure is only paid when files multiply.

### Stage 2 — bounded contexts with DDD layers (ADOPTED — this is the current layout)

The service is now organized by **bounded context** (a DDD term for a business
sub-domain with its own model), and inside each context the code is split into
four **layers** that enforce a one-way dependency arrow. This is the structure
you'll extend for every new feature (assistant, shopping, downloads, auth...).

```
src/main/kotlin/com/recipeapp/
├── main.kt                         # public/index.php — starts EngineMain
├── Routing.kt                      # routes/api.php — mounts each context's routes
├── infrastructure/                 # APP-WIDE wiring (bootstrap/app.php + Http\Kernel)
│   ├── Http.kt                     #   CORS, compression, default headers
│   ├── Serialization.kt            #   ContentNegotiation + kotlinx JSON
│   ├── Security.kt                 #   JWT guard (config/auth.php)
│   ├── StatusPages.kt              #   exception handler + ApiError envelope
│   └── Database.kt                 #   Exposed connection + Flyway migrate + /healthz
└── contexts/                       # one folder per bounded context
    └── recipes/
        ├── domain/                 # LAYER 1 — pure Kotlin, imports nothing else
        │   ├── Recipe.kt           #   the model + invariants (business rules)
        │   └── RecipeRepository.kt #   PORT: findById/list/save/delete — no DB knowledge
        ├── application/            # LAYER 2 — use cases, orchestrate the port
        │   └── RecipeService.kt    #   List/Get/Create/Update/Delete use cases
        ├── infrastructure/         # LAYER 3 — CONTEXT adapters (see note below)
        │   ├── RecipesTable.kt     #   Exposed schema mirror (queries only)
        │   └── ExposedRecipeRepository.kt  # the ONLY file that knows Postgres
        └── interfaces/             # LAYER 4 — HTTP-facing (the outside world)
            ├── RecipesRoutes.kt    #   route paths for this context
            ├── RecipesController.kt#   thin handlers (parse → use case → respond)
            └── RecipeDto.kt        #   @Serializable request + response shapes

src/main/resources/
├── application.yaml                # module list, port, ktor.development
└── db/migration/                   # Flyway DDL — the real CREATE TABLE
    └── V1__create_recipes_table.sql
```

**The dependency rule (the whole point of DDD):** arrows point inward.
`interfaces → application → domain` and `infrastructure → domain`. The domain
imports no Ktor, no Exposed, nothing. That is what makes
`ListRecipesUseCaseTest` runnable with a 6-line fake repository and no database
— see `src/test/kotlin/.../application/`. In Laravel you'd reach for
`RefreshDatabase` or a mocked facade to test the same rule.

Layer cheat sheet vs. Laravel instinct:

| Layer | Holds | May import | Laravel analogue |
|---|---|---|---|
| `domain/` | model + rules + port interfaces | only Kotlin stdlib | the business logic you *wish* lived outside `Model.php` |
| `application/` | use-case classes | domain | `app/Actions` / service classes |
| `infrastructure/` (context) | DB/external adapters | domain + framework | Eloquent model + a bound repository impl |
| `interfaces/` | routes, controllers, DTOs | application + framework | `routes/api.php` + Controller + Resource |

Adding a new context (say `assistant/`) = create the folder, mirror these four
layers, add one `assistantRoutes()` mount line in `Routing.kt`. A context is
delete-able: removing the folder should break exactly one mount line.

### Why there are two `infrastructure/` folders

"Infrastructure" is a **layer name**, not a globally unique folder — it means
"the technical, swappable details." It legitimately appears at two scopes:

| Folder | Scope | Holds | Laravel analogue |
|---|---|---|---|
| `com/recipeapp/infrastructure/` | whole **application** | HTTP, JSON, JWT, the DB *connection*, exception mapping — cross-cutting plumbing every feature shares | `bootstrap/app.php`, `config/*.php`, providers, `Handler.php` |
| `com/recipeapp/contexts/<name>/infrastructure/` | one **bounded context** | that feature's adapters — the Exposed table mirror + the repository implementing the domain port | a module's `models/` + bound `Repositories/Eloquent…Repository` |

Both obey the same dependency rule: infrastructure points inward to the domain;
the domain never points back. If the shared name reads as confusing, a common
tidy-up is to rename the **context-level** folder to `persistence/` (it only
ever holds tables + repository adapters), and/or the **app-level** one to
`platform/` / `shared/`. Purely cosmetic — pick one and stay consistent.

### Stage 3 — only if the pilot succeeds and teams grow

Gradle **multi-module** split, ≈ breaking a Laravel monolith into a
platform + packages:

```
apps/api/
├── settings.gradle.kts             # includes all modules
├── server/                         # composition root: main(), plugins, routing glue
├── core-domain/                    # entities, pure logic — no Ktor, no Exposed
├── persistence/                    # Exposed tables, queries, Flyway migrations
├── ai/                             # agent runner, provider adapters (Ollama/SearXNG)
└── ingestion/                      # pipeline + `./gradlew ingest` CLI (ARCHITECTURE § 16)
```

The compiler then enforces what Laravel enforces by convention:
`server/` may depend on everything; `core-domain/` depends on nothing.
**Do not build this now** — the single module with Stage 2 folders compiles
fast, deploys one artifact, and matches the one-VM pilot topology
(ARCHITECTURE § 10).

---

## 7. Structure status (what's done vs. deferred)

| Item | Status | Note |
|---|---|---|
| Package `com` → `com.recipeapp` | ✅ done | generator default replaced |
| Flat files → DDD bounded contexts | ✅ done | `recipes/` is the reference context |
| Handlers extracted from `Routing.kt` into `interfaces/` | ✅ done | routes → controller → use case → DTO |
| Repository port + adapter split | ✅ done | domain owns the port, infra owns Exposed |
| Recipe CRUD endpoints (list/get/create/update/delete) | ✅ done | under `/api/v1/recipes`; 201/400/404/204/503 |
| Request-body DTOs + validation | ✅ done | `CreateRecipeRequest`/`UpdateRecipeRequest`; rules live in the use cases |
| Flyway migrations | ✅ done | `V1__create_recipes_table.sql`; runs at boot (`AUTO_MIGRATE`) |
| Local Postgres | ✅ done | `infra/docker-compose.yml` (pgvector/pg16) |
| Dev mode + hot reload | ✅ done | `ktor.development`; the wizard staggers `run` + `-t classes` |
| Honest DB startup logging | ✅ done | `configureDatabase()` probes, so logs match `/healthz` |
| Global `database` val instead of injected | keep | fine at pilot scale; use cases already take the repo via constructor |
| `anyHost()` in CORS | ⏩ fix before deploy | restrict to admin/mobile origins |
| JWT secret | ⏩ env-var with dev fallback | production must set `JWT_SECRET` |
| API Dockerfile (prod image) | ⏩ deferred | dev runs native; add when targeting the Oracle Cloud VM |

---

## 8. Where to put the next thing you write

| You're adding... | It goes in... | Laravel instinct that's right |
|---|---|---|
| A new endpoint | `Routing.kt` (Stage 1) → `XRoutes.kt` (Stage 2) | `routes/api.php` |
| A new table | a migration SQL + a mirrored `XTable` object | migration + Model pair |
| A reusable query | function next to its table object | query scopes on the Model |
| Request/response shape | `@Serializable data class` next to its domain | Form Request / Resource |
| Auth requirement on a route | `authenticate { }` block wrapping routes | `->middleware('auth:sanctum')` |
| Background work | coroutine job + `jobs` table row (SETUP later) | `dispatch(new Job)` |
| Framework wiring (logging format, new plugin) | a `configureX()` in a plugins file + `application.yaml` | `config/app.php` + a ServiceProvider |

When in doubt: **routes → controller-ish function → query function → DTO**,
four honest layers, no magic — the same request flow you already know, just
with the wiring visible.
