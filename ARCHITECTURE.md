# System Architecture

**Project:** Philippine Food Discovery and Recipe Assistant  
**Version:** 1.0  
**Date:** October 2026  
**Status:** Draft — aligns with PRD v1.0

---

## 1 Overview

A mobile-first recipe discovery and AI-assisted cooking product for Philippine cuisine. The system comprises:

- A **React Native** mobile app (Android-first)
- A **REST API backend** serving auth, recipes, conversations, and entitlements
- A **PostgreSQL + pgvector** database for structured data and semantic retrieval
- A **server-side AI agent runner** orchestrating RAG retrieval, bounded web research, and structured output
- An **admin interface** for content review and operational oversight
- **Object storage** for approved media assets

---

## 2 Technology Stack

| Layer                          | Primary Choice                                                                                                                                                                                                                                                                                    | Alternative                                                                                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile                         | React Native + Expo + TypeScript                                                                                                                                                                                                                                                                  | —                                                                                                                                                                 | Confirmed in PRD; cross-platform path to iOS                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Local persistence              | SQLite (expo-sqlite) + file system                                                                                                                                                                                                                                                                | MMKV for simple key-value                                                                                                                                         | Offline recipes, favorites, shopping lists                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| API framework                  | **Ktor** (Kotlin)                                                                                                                                                                                                                                                                                 | NestJS (TypeScript)                                                                                                                                               | Ktor chosen as the primary API framework to align with the team's goal of learning in-demand technologies and to leverage the JVM ecosystem. Kotlin coroutines provide first-class structured concurrency, which fits the AI agent runner and long-running request handling. The mobile layer stays in TypeScript; the API publishes an OpenAPI spec consumed by the client via `openapi-typescript`. NestJS remains a fallback if the team prefers a single-language stack later. |
| Database                       | PostgreSQL + pgvector                                                                                                                                                                                                                                                                             | —                                                                                                                                                                 | Structured records, full-text search, and vector similarity in one engine                                                                                                                                                                                                                                                                                                                                                                                                          |
| ORM / Query                    | Exposed (Kotlin SQL DSL)                                                                                                                                                                                                                                                                          | jOOQ or raw SQL for complex queries                                                                                                                               | Type-safe SQL builder aligned with Kotlin; migration via Gradle plugin                                                                                                                                                                                                                                                                                                                                                                                                             |
| AI orchestration               | Ktor-based backend agent runner with typed tool contracts (LangChain4j or custom)                                                                                                                                                                                                                 | —                                                                                                                                                                 | Server-side only; provider keys never leave the backend; Kotlin coroutines for concurrent tool calls                                                                                                                                                                                                                                                                                                                                                                               |
| LLM (reasoning + tool calling) | **Ollama Cloud `gemma3:27b`** (free tier) accessed through the LangChain4j Ollama adapter with a cloud base URL. Secondary cloud option: Minimax for heavier reasoning tasks                                                                                                                      | Local `llama3.1:8b-instruct-q4_K_M` on the same VM (privacy/offline fallback, same SDK, different base URL); Groq free tier or Gemini Flash (hosted escape hatch) | Ollama Cloud offers Gemma 3 27B and Minimax on its free tier — substantially better reasoning, function-calling, and multilingual quality than anything we can run locally on the ARM CPU, and Gemma 3's Tagalog/Cebuano/Ilocano coverage fits the product's language surface directly. Same Ollama client for local and cloud keeps the adapter trivial and preserves the local fallback.                                                                                         |
| Embedding provider             | **Ollama local** `nomic-embed-text` (768-dim) on the pilot VM — unchanged                                                                                                                                                                                                                         | Google AI Studio `text-embedding-004` free tier; Jina embeddings                                                                                                  | Embeddings are cheap on CPU, deterministic, and dimension-stable for pgvector. Keeping them local avoids spending cloud-API rate limits on bulk ingestion batches and reindexing runs.                                                                                                                                                                                                                                                                                             |
| Web search / page extraction   | **SearXNG self-hosted** on the pilot VM for `searchWeb`; native HTTP fetch + readability parsing for `readWebPage`. Engines limited to DuckDuckGo + Brave + Wikipedia (cloud-IP friendly); outbound throttled to 1 req/sec/engine; 24-hour result cache in a Postgres `search_cache` table        | Tavily free tier (1,000 credits/mo); Serper; Brave Search API — all kept behind the same adapter as an escape hatch if SearXNG upstream limits bite               | Zero budget, zero API keys, zero external quota ceiling. SearXNG fits naturally into the Docker Compose topology. Quality tradeoff is small because the agent's `readWebPage` step already fetches and parses each selected URL — the LLM-optimized snippets Tavily would have provided are largely redundant here.                                                                                                                                                                |
| Hosting infrastructure         | **Oracle Cloud Always Free** — ARM Ampere A1 shape (up to 4 OCPU / 24 GB RAM), no expiry, no charge. Runs everything: Ktor API, local Ollama (embeddings only), SearXNG, Postgres + pgvector, Caddy reverse proxy — all as Docker Compose services on one VM. Reasoning LLM runs on Ollama Cloud. | Hetzner CAX11 (~€4/mo) if Oracle tenancy is unavailable; AWS/GCP only after pilot                                                                                 | Truly $0/mo for compute, database, and inference together. Offloading reasoning to Ollama Cloud frees ~6–8 GB of VM RAM (no 8B model loaded locally), which meaningfully reduces single-VM pressure. Credit card required for Oracle identity verification even on free tier.                                                                                                                                                                                                      |
| Media storage                  | Cloudflare R2 free tier (10 GB, no egress fees)                                                                                                                                                                                                                                                   | External image references with attribution only, if storage budget is zero                                                                                        | Approved photos with attribution metadata; R2 has no egress fees                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Background jobs                | Kotlin coroutine-based scheduler + job table in Postgres (no Redis for pilot)                                                                                                                                                                                                                     | Redis-backed worker if throughput requires it                                                                                                                     | Ingestion, indexing, reconciliation, abandoned reservation cleanup — all comfortably handled in-process at pilot scale                                                                                                                                                                                                                                                                                                                                                             |
| Billing                        | RevenueCat (free up to $2,500/mo tracked revenue) or platform-native IAP + server verification                                                                                                                                                                                                    | —                                                                                                                                                                 | Subscription lifecycle; backend is authoritative                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Admin                          | Minimal authenticated web UI (Next.js or separate SPA) — or a Ktor-served admin route group                                                                                                                                                                                                       | CLI-based tooling for earliest ops                                                                                                                                | Content review, publication, reports                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Auth                           | Email + verification tokens; JWT access + refresh (via `ktor-auth-jwt` + `java-jwt` or `jjwt`)                                                                                                                                                                                                    | —                                                                                                                                                                 | No social login in v1                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Pilot Cost Profile (target: strict $0/mo)

| Service                                          | Provisioning                                                                                            | Expected pilot usage                                                                                       | Cost        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| Oracle Cloud Always Free ARM VM (4 OCPU / 24 GB) | Self-provisioned; runs Ktor + local Ollama (embeddings) + SearXNG + Postgres + Caddy via Docker Compose | 24/7 uptime; single-tenant                                                                                 | **$0**      |
| **Ollama Cloud `gemma3:27b`** (reasoning)        | Managed by Ollama; accessed via API key                                                                 | ~150 trial requests total; comfortably inside free tier rate limits — verify current numbers before launch | **$0**      |
| Ollama local `nomic-embed-text` (embeddings)     | Container on the VM                                                                                     | One-time ingestion of 50–200 recipes; occasional reindex                                                   | **$0**      |
| PostgreSQL + pgvector                            | Container on same VM                                                                                    | Structured data + vector indexes                                                                           | **$0**      |
| SearXNG (web search)                             | Container on same VM; DuckDuckGo + Brave + Wikipedia engines                                            | ~450 searches worst-case (150 requests × 3 max)                                                            | **$0**      |
| Cloudflare R2                                    | Free tier — 10 GB                                                                                       | Recipe photos with attribution                                                                             | **$0**      |
| Resend (email verification)                      | Free tier — 3,000 emails/mo                                                                             | Account verification + password reset                                                                      | **$0**      |
| GitHub Actions (CI/CD)                           | Free tier — 2,000 build minutes/mo                                                                      | Gradle + Expo builds                                                                                       | **$0**      |
| Caddy (reverse proxy + TLS)                      | Container on same VM                                                                                    | Automatic HTTPS certificates                                                                               | **$0**      |
| **Total**                                        |                                                                                                         |                                                                                                            | **$0 / mo** |

**Escape hatch matrix:** every AI provider dependency has a same-client fallback path — no code changes, adapter config only.

| Layer      | Primary                         | Fallback 1                                                                        | Fallback 2                     |
| ---------- | ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Reasoning  | Ollama Cloud `gemma3:27b`       | Local Ollama `llama3.1:8b-instruct` on the same VM (same SDK, different base URL) | Groq free tier or Gemini Flash |
| Embeddings | Local Ollama `nomic-embed-text` | Google `text-embedding-004` free tier (both 768-dim — no reindex)                 | Jina embeddings                |
| Web search | SearXNG self-hosted             | Tavily free tier (1,000 credits/mo)                                               | Serper                         |

If self-hosted inference quality, latency, Ollama Cloud free-tier rate limits, or search upstream limits fall below the PRD bar (85% constraint satisfaction, 90s timeout), swap the corresponding adapter config. Every fallback above is also $0 at pilot scale.

---

## 3 Architecture Diagram (Logical)

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│  React Native / Expo / TypeScript                           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Discovery│ │  Cooking │ │  AI      │ │  Account &    │  │
│  │ & Search │ │  Mode    │ │Assistant │ │  Subscription │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Local Persistence (SQLite + File Storage)          │    │
│  │  Favorites · Shopping List · Offline Recipes        │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / JWT
                             ▼
╔═════════════════════════════════════════════════════════════╗
║   Oracle Cloud Always Free ARM VM  (4 OCPU / 24 GB / $0)   ║
║   All backend services run as Docker Compose containers    ║
║                                                            ║
║  ┌───────────────────────────────────────────────────┐    ║
║  │  Caddy — reverse proxy, auto-TLS, edge routing    │    ║
║  └────────────────────────┬──────────────────────────┘    ║
║                            │                                ║
║                            ▼                                ║
║  ┌───────────────────────────────────────────────────┐    ║
║  │            Ktor API  (Kotlin / JVM)               │    ║
║  │            REST + SSE for job status              │    ║
║  │                                                   │    ║
║  │  Auth · Recipes · Search · Assistant ·            │    ║
║  │  Entitlements · Billing · Reports · Admin ·       │    ║
║  │  Agent Runner (LangChain4j adapter layer)         │    ║
║  │                                                   │    ║
║  │  Tool contracts: searchKnowledgeBase · getRecipe  │    ║
║  │                  searchWeb · readWebPage          │    ║
║  │                  getApprovedImage                 │    ║
║  └───┬─────────────────────────┬─────────────────┬───┘    ║
║      │                         │                 │        ║
║      ▼                         ▼                 ▼        ║
║  ┌──────────────┐   ┌──────────────────┐   ┌───────────┐  ║
║  │  PostgreSQL  │   │  Ollama (local)  │   │ Coroutine │  ║
║  │  + pgvector  │◄──┤  nomic-embed-    │   │ Job       │  ║
║  │              │   │  text only       │   │ Scheduler │  ║
║  │ Structured   │   │                  │   │           │  ║
║  │ Vector       │   │ Embeddings run   │   │ Ingest    │  ║
║  │ Usage Ledger │   │ locally: cheap,  │   │ Index     │  ║
║  │ Conversations│   │ deterministic,   │   │ Reconcile │  ║
║  │ Entitlements │   │ no cloud quota   │   │           │  ║
║  │ search_cache │   └──────────────────┘   └───────────┘  ║
║  └──────▲───────┘                                          ║
║         │                                                  ║
║  ┌──────┴───────────────────────────────────────────────┐  ║
║  │  SearXNG — self-hosted metasearch                    │  ║
║  │  Engines: DuckDuckGo · Brave · Wikipedia             │  ║
║  │  Throttled outbound (1 req/sec/engine)               │  ║
║  │  24h result cache backed by Postgres search_cache    │  ║
║  └──────────────────────────────────────────────────────┘  ║
╚═════════════════════════════════════════════════════════════╝
              │                                    ▲
              │ outbound HTTPS                     │ HTTPS + API key
              │ (Ollama Cloud · search · email)    │
              ▼                                    │
   ┌──────────────────────────┐                    │
   │  Ollama Cloud (managed)  │────────────────────┘
   │                          │
   │  • gemma3:27b (primary)  │
   │  • minimax (secondary)   │
   │  • free tier rate limits │
   │  • same `ollama` SDK     │
   └──────────────────────────┘

   ┌──────────────────────┐        ┌────────────────────────┐
   │  Other External      │        │  Admin Web Interface   │
   │  Free Tiers          │        │  (Next.js SPA or       │
   │                      │        │   Ktor-served routes)  │
   │  • Cloudflare R2     │        │                        │
   │    (media, 10 GB)    │        │  Content review ·      │
   │  • Resend (email)    │        │  Publish · Approve     │
   │  • GitHub Actions    │        │  research candidates   │
   │    (CI/CD)           │        └────────────────────────┘
   └──────────────────────┘
```

---

## 4 API Design Principles

- **RESTful** with versioned endpoints (`/api/v1/...`)
- **JWT** access tokens (short-lived) + refresh tokens for session continuity
- **Idempotency keys** on all AI request submissions and billing operations
- **Server-side entitlement checks** before AI execution — client never grants access
- **SSE or polling** for long-running AI job status (job ID pattern)
- **Pagination** on all list endpoints (cursor-based for recipes)
- **Rate limiting** per IP and per authenticated user for abuse protection

### Key Endpoint Groups

| Group                    | Examples                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Auth                     | `POST /auth/register`, `POST /auth/verify`, `POST /auth/login`, `POST /auth/refresh`, `DELETE /account`                        |
| Recipes                  | `GET /recipes`, `GET /recipes/:id`, `GET /regions`, `GET /ingredients`                                                         |
| Search                   | `POST /search/recipes`, `POST /search/by-ingredients`                                                                          |
| Favorites (local v1)     | `GET /favorites`, `POST /favorites`, `DELETE /favorites/:id`                                                                   |
| Shopping List (local v1) | `POST /shopping-list`, `PATCH /shopping-list/:id`                                                                              |
| Assistant                | `POST /assistant/request`, `GET /assistant/jobs/:id`, `GET /assistant/conversations`, `DELETE /assistant/conversations/:id`    |
| Entitlements             | `GET /entitlements`, `GET /entitlements/usage`                                                                                 |
| Billing                  | `POST /billing/purchase`, `POST /billing/restore`, `POST /billing/webhook`                                                     |
| Reports                  | `POST /reports`                                                                                                                |
| Admin                    | `POST /admin/recipes`, `PATCH /admin/recipes/:id/publish`, `GET /admin/reports`, `POST /admin/research-candidates/:id/approve` |

---

## 5 Data Model Summary

| Entity                                     | Storage                              | Notes                                                                                  |
| ------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| User                                       | PostgreSQL                           | Email-verified; JWT tokens; preferences                                                |
| Dish                                       | PostgreSQL                           | Canonical name, aliases, regional associations, evidence links                         |
| Recipe                                     | PostgreSQL                           | Dish FK, versioned, status (draft/published/withdrawn), structured steps & ingredients |
| Ingredient                                 | PostgreSQL                           | Canonical + aliases, unit relationships, compound ingredients                          |
| Source                                     | PostgreSQL                           | URL, title, author, retrieved_date, reuse_basis, supported_claims                      |
| Photo                                      | Object storage + PostgreSQL metadata | License, attribution, approved status                                                  |
| KnowledgeDocument                          | PostgreSQL + pgvector                | Embedding column, content_version, review_state                                        |
| Conversation / Message                     | PostgreSQL                           | User-owned; structured result payload; citation refs                                   |
| AIRequest                                  | PostgreSQL                           | Idempotency key, status enum, tool log, cost, error_category                           |
| UsageLedger                                | PostgreSQL                           | Reserved → Finalized / Released state machine; billing_period FK                       |
| Subscription                               | PostgreSQL                           | Provider ref, plan, status, allowance, period boundaries                               |
| ResearchCandidate                          | PostgreSQL                           | Extracted content, provenance, expiry, review_decision                                 |
| ContentReport                              | PostgreSQL                           | Target FK, description, status                                                         |
| Favorites / ShoppingList / OfflineDownload | SQLite (local)                       | Per-device; no cloud sync in v1                                                        |

---

## 6 AI Agent Flow

```
User submits request
       │
       ▼
[Backend] Authenticate → Validate input → Reserve entitlement (atomic)
       │
       ▼
[Agent Runner] Load conversation context → Extract constraints
       │
       ▼
[RAG Retrieval] Keyword + vector + structured filter search
       │
       ▼
[Evidence Assessment] Sufficient? ──── Yes ────► Structure answer → Validate links/exclusions
       │                                                      │
      No                                                      ▼
       │                                            [Backend] Finalize usage → Persist answer
       ▼                                                      │
[Web Research] searchWeb (max 3) → readWebPage (max 5)        ▼
       │                                             [Mobile] Display result
       ▼
[Re-assess] Sufficient now? ── Yes ──► Continue
       │
      No
       ▼
Return uncertainty or alternatives. Release reservation. No fabrication.
```

### Tool Boundaries

| Tool                | Max calls per request | Constraint                      |
| ------------------- | --------------------- | ------------------------------- |
| searchKnowledgeBase | Included in 10 total  | Published/approved records only |
| getRecipe           | Included in 10 total  | Never combine variants          |
| searchWeb           | 3 searches            | Bounded per PRD                 |
| readWebPage         | 5 pages               | Content length + timeout limits |
| getApprovedImage    | Included in 10 total  | No scraping or invented URLs    |

Global limits: 10 tool calls, 90 seconds end-to-end, configurable token/monetary ceiling.

### Answer Contract

Every assistant response is stored and delivered as a typed structure satisfying PRD § 8 "Answer contract." The shape is defined once as a Kotlin sealed class in the API and mirrored in the OpenAPI schema, so the mobile client generates matching TypeScript types via the § 11 pipeline. This is the contract that all § 13 evaluation gates and § 15 tests score against.

**`AssistantAnswer`** — top-level response

| Field               | Type                                                               | Notes                                                               |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `summary_text`      | String                                                             | User-facing prose reply; no structured data here                    |
| `recommendations`   | Array<Recommendation>                                              | Max 3 per PRD P01                                                   |
| `research_status`   | Enum: `internal-only` \| `web-assisted` \| `insufficient-evidence` | Stored internally per PRD § 8; not shown as a raw field to the user |
| `uncertainty_notes` | Array<String>                                                      | Free-text caveats surfaced when evidence is incomplete              |
| `citations`         | Array<Citation>                                                    | Every substantive claim in the answer maps to a citation            |

**`Recommendation`** — one suggested dish

| Field                  | Type          | Notes                                                                                        |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `dish_id`              | UUID?         | Null when the answer references a research-derived candidate without a published dish record |
| `name`                 | String        | Canonical or documented variant name                                                         |
| `variant`              | String?       | Region/style variant qualifier; null when not applicable                                     |
| `regional_association` | Array<String> | Empty array means unknown — never fabricated (PRD F03)                                       |
| `reason_for_match`     | String        | Why this fits the user's stated constraints; must reference citation IDs                     |
| `recipe_id`            | UUID?         | Present when the recommendation maps to a published recipe                                   |
| `source_link`          | URL?          | Present when the recommendation is external; mutually exclusive with `recipe_id` in v1       |
| `timing`               | Object?       | Prep/cook/total where documented; null when unknown                                          |
| `difficulty`           | Enum?         | `beginner` \| `intermediate` \| `advanced` \| null                                           |
| `image_url`            | URL?          | Only populated from `getApprovedImage`; null otherwise — never fabricated                    |
| `citation_ids`         | Array<UUID>   | References into `AssistantAnswer.citations` backing this recommendation                      |

**`Citation`** — one source reference

| Field                  | Type                                         | Notes                                                                                                      |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID                                         | Stable across serialization                                                                                |
| `kind`                 | Enum: `recipe` \| `source` \| `external-web` | Determines which validation rules apply                                                                    |
| `url`                  | URL?                                         | Required for `external-web`; nullable for internal records                                                 |
| `title`                | String                                       | Human-readable                                                                                             |
| `author` / `publisher` | String?                                      | Only when documented by the source                                                                         |
| `retrieved_at`         | Timestamp                                    | For external citations                                                                                     |
| `reuse_basis`          | String                                       | Free text; must be non-empty for anything that could become a published recipe                             |
| `supported_claims`     | Array<String>                                | Which specific claims in the answer this citation backs — enables per-claim verification during evaluation |

### Contract Validation (Enforced Before Persistence)

1. Every `recipe_id` resolves to a published recipe in the collection.
2. Every `dish_id` resolves to a known dish, or is null and paired with a `source_link`.
3. Every `citation_id` refers to a `Citation` stored on the same `AssistantAnswer`.
4. Every non-empty `regional_association` has at least one supporting citation with a matching `supported_claims` entry.
5. `recommendations.length` ≤ 3 (enforces PRD P01 bound).
6. User-stated dietary exclusions are re-checked against the full ingredient lists of any `recipe_id` present. A violation blocks persistence.
7. No `image_url` from an unapproved source. Fabricated URLs are hard-failed.

Any validation failure blocks persistence, **releases the reserved entitlement** (no usage consumed), and returns a graceful uncertainty response per PRD § 8. The failure is logged with the offending field path so evaluation runs can spot regressions by cause.

### Hybrid Ollama Notes

Reasoning runs on **Ollama Cloud** (`gemma3:27b`, Minimax as a secondary option). Embeddings run on **local Ollama** (`nomic-embed-text`). Both paths use the same `ollama` client SDK — only the base URL differs, so adapter configuration is a one-line change.

- **Concurrency.** Local Ollama still uses `OLLAMA_NUM_PARALLEL=2` for embeddings, but bulk ingestion is a background job so a single slot is usually enough. Ollama Cloud handles reasoning concurrency server-side; the pilot's ~150 total requests are well inside its free-tier rate limits. Verify current limits before launch and add exponential-backoff retry in the adapter.
- **Latency budget.** Cloud inference is GPU-hosted and comfortably fits the 90s PRD window even for research-flow requests (3 searches + 5 page reads + a reasoning loop). Local fallback (`llama3.1:8b-instruct`) would be tight in the same scenario — treat it as a degraded-mode path, not the default.
- **Tool-calling reliability.** Gemma 3 27B and Minimax are substantially better at structured function calls than a local 8B. The agent runner still validates tool-call shape and retries once on malformed calls, but the retry rate should be low enough that the plain-text fallback is rarely reached.
- **Multilingual fit.** Gemma 3's Tagalog/Cebuano/Ilocano coverage directly benefits regional Philippine dish queries — this is a primary reason for the cloud choice over a local 8B.
- **Local model weights** (for the `llama3.1:8b-instruct` fallback and `nomic-embed-text`) are pulled during deployment bootstrap; bake into a persistent volume to avoid re-downloading on restart.
- **API key handling.** `OLLAMA_CLOUD_API_KEY` lives in `.env` on the VM, never in the repo, and is only read by the Ktor adapter — never sent to mobile clients.

### Self-Hosted Search Notes

The `searchWeb` tool calls SearXNG running as a container on the same VM:

- **Engine selection.** Enable DuckDuckGo, Brave, and Wikipedia only. Google, Bing, and Yandex aggressively rate-limit or CAPTCHA cloud IP ranges (Oracle IPs are flagged). Tradeoff: slightly less ranking diversity for a big quality gain in reliability.
- **Outbound throttling.** Cap at 1 request per second per engine, enforced via a token-bucket filter in the Ktor adapter or SearXNG's built-in `rate_limit` setting. Without this, upstreams will start returning empty result sets.
- **Result caching.** Store normalized query → result JSON with a 24-hour TTL in a Postgres `search_cache` table. Cited per PRD § 8 "Research cache and review" — cache is topic+source-keyed, not user-keyed, so it's shared across requests without exposing another user's conversation.
- **Failure handling.** If all engines return empty results or SearXNG is unreachable, treat as "no external evidence available" — do not retry across engines beyond one pass, and return a graceful uncertainty answer per PRD.
- **Content extraction.** SearXNG returns titles, URLs, and short snippets only. The `readWebPage` tool fetches and parses each selected URL — that path is unchanged and independent of the search provider swap.
- **If SearXNG reliability becomes a production blocker,** swap the adapter to Tavily free tier (1,000 credits/mo). No code changes; the `searchWeb` tool contract stays the same.

---

## 7 Entitlement and Usage State Machine

```
[Available] ──reserve──► [Reserved] ──finalize──► [Consumed]
                              │
                         release/error/timeout
                              │
                              ▼
                         [Released] → back to Available
```

- Trial: 3 lifetime requests; no card required; requires verified account.
- Paid: Monthly allowance; resets on confirmed billing period boundaries.
- Backend is authoritative; client and AI model cannot mutate entitlements.
- Scheduled reconciliation releases abandoned reservations after timeout.

---

## 8 Offline and Local-First Features

| Feature             | Mechanism                                             | Sync                                            |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Favorites           | SQLite local table                                    | None in v1                                      |
| Shopping List       | SQLite local table                                    | None in v1                                      |
| Offline Recipes     | Explicit download to file system + SQLite metadata    | Version tracking; refresh available when online |
| Guided Cooking Mode | Local; keep-awake via react-native-keep-awake or Expo | N/A                                             |

---

## 9 Security and Privacy

- All transport over HTTPS (TLS 1.3).
- Provider API keys stored server-side only; never sent to client.
- JWT access tokens (short expiry) stored in secure enclave/Keychain/Keystore.
- Request input validation and length bounding before AI processing.
- Ownership checks on all conversation and account endpoints.
- Separate admin auth path with role-based access.
- No full conversation content logged by default in analytics.
- Account and conversation deletion supported.
- Retrieved external text is **evidence only** — never executable instructions.
- Block private/local network URLs in web tools.

---

## 10 Deployment and Infrastructure

Everything runs as Docker Compose services on a single Oracle Cloud Always Free ARM VM.

| Concern                    | Approach                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host VM**                | Oracle Cloud Always Free — ARM Ampere A1 shape (4 OCPU, 24 GB RAM, 200 GB block storage). Ubuntu 24.04 LTS. Provisioned once; no expiry.                                                                                                                                                                                                                                   |
| **Reverse proxy + TLS**    | **Caddy** container on port 443/80; automatic Let's Encrypt certificates; routes `/api/*` to Ktor, `/admin/*` to admin UI.                                                                                                                                                                                                                                                 |
| **API service**            | Ktor container built from `eclipse-temurin:21-jre` (or GraalVM native build if cold-start matters). Restart policy `unless-stopped`.                                                                                                                                                                                                                                       |
| **Ollama service (local)** | Official `ollama/ollama` image (ARM64 tag); persistent volume for `nomic-embed-text` weights and the `llama3.1:8b-instruct` fallback model. Env `OLLAMA_NUM_PARALLEL=2`, `OLLAMA_MAX_LOADED_MODELS=1`. Internal-only network — not exposed publicly. Serves embeddings only at steady state; reasoning normally goes to Ollama Cloud.                                      |
| **Ollama Cloud access**    | Reached via HTTPS from the Ktor adapter. `OLLAMA_CLOUD_API_KEY` in `.env` on the VM; base URL configured per-model (`gemma3:27b` primary, `minimax` secondary, `llama3.1:8b-instruct` fallback points back at the local container). Free-tier rate limits verified against pilot volume (~150 requests total) before launch.                                               |
| **SearXNG service**        | Official `searxng/searxng` image; `settings.yml` mounted from repo pinning engines to DuckDuckGo + Brave + Wikipedia; `limiter: true` to protect your own instance; JSON format enabled for API access. Internal-only network — Caddy does not route to it. Ktor adapter enforces 1 req/sec/engine outbound throttle. Results cached in Postgres `search_cache` (24h TTL). |
| **Database**               | `postgres:16` image with `pgvector` extension (use `ankane/pgvector` or install extension in a custom image); persistent volume; nightly `pg_dump` to object storage.                                                                                                                                                                                                      |
| **Object storage**         | Cloudflare R2 free tier (10 GB, no egress fees) for approved photos.                                                                                                                                                                                                                                                                                                       |
| **Job queue**              | Coroutine scheduler + `jobs` table in Postgres. No Redis at pilot scale.                                                                                                                                                                                                                                                                                                   |
| **Email**                  | Resend free tier (3,000 emails/mo) behind a `Mailer` interface; swap adapter later if needed.                                                                                                                                                                                                                                                                              |
| **CI/CD**                  | GitHub Actions → Gradle build → test → Docker image publish → SSH deploy to VM → `docker compose pull && docker compose up -d`. Separate workflow for Expo mobile builds.                                                                                                                                                                                                  |
| **Backups**                | Nightly `pg_dump` + media bucket sync to a second free-tier location (Cloudflare R2 duplicate or Oracle Object Storage free tier). Restore drill quarterly.                                                                                                                                                                                                                |
| **Monitoring**             | Structured logs to stdout (Logback + `kotlin-logging`) collected by Uptime Kuma (self-hosted on same VM) or a free-tier log service. Health endpoint `/healthz` polled. Sentry free tier optional for crash reporting.                                                                                                                                                     |
| **Environment config**     | `.env` file on the VM, gitignored. Secrets (`OLLAMA_CLOUD_API_KEY`, JWT signing keys, Resend key, R2 credentials) never committed. Rotate on any suspected exposure.                                                                                                                                                                                                       |
| **Disaster recovery**      | Docker Compose file + `.env.example` + Postgres backup in object storage = full stack rebuild on a new VM in <30 minutes.                                                                                                                                                                                                                                                  |
| **Later (post-pilot)**     | Split Ktor, Ollama, and Postgres onto separate hosts; move to managed Postgres; consider paid inference API behind the same adapter if quality/latency requires it.                                                                                                                                                                                                        |

---

## 11 API Type Contract (Kotlin ↔ TypeScript)

Because the API is in Kotlin and the mobile client is in TypeScript, a shared type contract is required:

| Concern          | Approach                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Source of truth  | Ktor server code with `ktor-openapi` (or `swagger-generator`) producing an OpenAPI 3 spec on build             |
| Client types     | `openapi-typescript` generates TS types into `apps/mobile/src/api-types/` via a CI step                        |
| Validation       | Kotlin uses `kotlinx.serialization` + custom validators; TS client validates responses against generated types |
| Breaking changes | Spec diffs in PR; versioned path prefix `/api/v1/...`                                                          |
| Alternative      | Manually maintained OpenAPI YAML + `ktor-swagger-ui` if codegen becomes noisy                                  |

This contract keeps the polyglot split manageable and lets mobile developers work against a typed API surface without touching Kotlin.

### Provider Escape Hatch

All AI provider access (Ollama, Groq, Gemini, Tavily, etc.) flows through the LangChain4j adapter layer. Swapping from self-hosted Ollama to a hosted free tier is a config change (`provider=ollama` → `provider=groq`) plus a `.env` update — no application code changes. Reindexing is only required if the embedding provider's output dimensions change (see § 2 rationale for keeping embeddings on `nomic-embed-text` at 768-dim to match `text-embedding-004`).

---

## 12 NestJS Alternative (If the Team Prefers a Single-Language Stack Later)

If the team decides to consolidate on one language for v1:

| Aspect          | Impact                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Type sharing    | Native — TS types flow from API DTOs to mobile without codegen                     |
| AI/ML ecosystem | Uses HTTP SDKs (Vercel AI SDK, LangChain JS) instead of LangChain4j                |
| Concurrency     | Node event loop + worker threads                                                   |
| Build tooling   | Shared npm workspaces monorepo with mobile                                         |
| ORM             | TypeORM or Prisma                                                                  |
| Deployment      | Node container; smaller memory footprint than JVM                                  |
| Tradeoff        | Less exposure to Kotlin/JVM market skills; agent runner loses coroutine ergonomics |

This remains documented as a valid fallback but is **not** the current direction.

---

## 13 Delivery Sequence (Architecture View)

| Phase                      | Deliverable                                           | Architectural Impact                                  |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| 1. Content foundation      | Ingestion pipeline, schema, 50+ recipes               | DB schema, admin interface, object storage            |
| 2. Free cooking experience | Browse, search, recipe detail, offline, shopping list | API server, mobile app, local SQLite                  |
| 3. Internal assistant      | Auth, trials, RAG retrieval, citations, history       | Agent runner, entitlement system, AI adapters         |
| 4. Bounded research agent  | Web search/read tools, cache, review queue            | Tool adapters, research cache, admin approval         |
| 5. Paid pilot              | Billing integration, subscription lifecycle, usage UI | Billing module, reconciliation jobs, webhook handlers |

---

## 14 Open Decisions

| Decision                         | Status                                                                     | Blocker                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API framework                    | **Resolved — Ktor (Kotlin) primary**                                       | Team has chosen Ktor to pursue new technologies and JVM ecosystem access                                                                                                                                      |
| Deployment scope                 | **Resolved — small pilot, strict $0 budget**                               | Single Oracle Cloud Always Free ARM VM running all services via Docker Compose                                                                                                                                |
| LLM provider (pilot)             | **Resolved — Ollama Cloud `gemma3:27b` (free tier), Minimax as secondary** | Same `ollama` SDK as local; free-tier quality far exceeds what the ARM CPU can run locally; multilingual Gemma 3 fits Tagalog/Cebuano queries. Fallback chain: local `llama3.1:8b-instruct` → Groq free tier. |
| Embedding provider (pilot)       | **Resolved — local Ollama `nomic-embed-text` (768-dim)**                   | Cheap and deterministic on CPU; keeps bulk ingestion off cloud quota. Same 768-dim shape as Google `text-embedding-004` so a fallback swap requires no reindexing.                                            |
| Web search provider (pilot)      | **Resolved — SearXNG self-hosted**                                         | Runs on the same Oracle VM; DuckDuckGo + Brave + Wikipedia engines; Tavily free tier documented as escape hatch behind the same adapter                                                                       |
| Payment/billing provider         | Open                                                                       | Platform compliance check required                                                                                                                                                                            |
| Price and paid request allowance | Open                                                                       | Measured costs + user testing                                                                                                                                                                                 |
| Hosting infrastructure           | **Resolved — Oracle Cloud Always Free ARM VM**                             | Truly $0; single VM runs Ktor + Ollama + Postgres/pgvector + Caddy                                                                                                                                            |

---

## 15 Testing and Evaluation

PRD § 13 defines release-acceptance gates that require more than unit tests. This section names the concrete layers, tools, and CI wiring for each so the acceptance criteria are measurable rather than aspirational.

### Test Pyramid

| Layer                       | Tool                                                                                        | CI Trigger              | What It Proves                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kotlin unit                 | JUnit5 + Kotest                                                                             | Every PR                | Pure functions: ingredient scaling (F07), unit conversion, alias normalization, reservation state machine transitions, tool-call shape validation |
| Kotlin integration          | JUnit5 + Testcontainers (Postgres 16 + pgvector; stubbed SearXNG; recorded Ollama fixtures) | Every PR                | Repository queries, pgvector similarity recall, entitlement reservation atomicity, job-table persistence, JWT auth flow                           |
| OpenAPI contract            | `kotlinx-coroutines-test` + Prism or Dredd against generated spec                           | Every PR touching Ktor  | API responses match the OpenAPI shape the mobile client depends on; no silent breaking changes                                                    |
| TypeScript client           | Vitest                                                                                      | Every PR                | Generated types compile; fetch client returns expected shapes                                                                                     |
| Mobile unit                 | Jest + @testing-library/react-native                                                        | Every PR                | Component and hook logic; local SQLite persistence for favorites, shopping list, downloads                                                        |
| Mobile E2E                  | Maestro (free tier covers pilot)                                                            | Nightly on `main`       | F01–F12 journeys on emulated Android; guided cooking mode, offline behavior, keep-awake                                                           |
| AI evaluation harness       | Kotlin runner (see next subsection)                                                         | Weekly + before release | PRD § 13 targets: 85% constraint satisfaction, 95% supported regional claims, zero dietary-exclusion violations, zero fabricated citations        |
| Concurrency & idempotency   | Kotlin multi-threaded harness against ephemeral stack                                       | Before release          | PRD § 13 scenarios: "two messages compete for one remaining trial"; idempotency-key deduplication; reconnect retrieves persisted answer           |
| Billing sandbox             | RevenueCat test mode or platform test accounts                                              | Before charging users   | Purchase, restore, cancellation, duplicate webhook, refund                                                                                        |
| Manual Android device tests | Physical device checklist                                                                   | Before release          | Offline storage, cooking mode keep-awake, real network conditions                                                                                 |

### AI Evaluation Harness

The eval set is a versioned file at `docs/eval-prompts.md` containing **40 fixed prompts** with paired **behavior contracts** (expected behaviors, not exact wording — PRD § 13 is explicit).

Each prompt entry specifies:

- The user request text
- The user's stated constraints (region, taste, difficulty, exclusions, etc.)
- The expected retrieval class: internal-sufficient / research-required / no-valid-result / refusal
- Required output features: recipe_id present, citation kinds, uncertainty required, dietary-exclusion rejection, etc.
- Forbidden behaviors: fabricated origin, invented photo URL, unsourced regional claim, unrestricted recipe publication

**Harness steps:**

1. Seed an ephemeral eval database with the published recipe collection + fixture users.
2. Load each prompt, fire it through the Agent Runner directly (bypass HTTP auth for speed and to keep the eval deterministic).
3. Capture the structured `AssistantAnswer` per § 6 contract.
4. Score each behavior contract as pass/fail.
5. Emit a JSON report: pass/fail per prompt, latency, tool-call trace, model used, citation set, estimated token cost.
6. **Block release** if any critical dietary-exclusion violation is present (PRD § 4 explicitly gates release on this).

**Model comparison mode:** the harness accepts a `--model` flag so the same suite runs against `gemma3:27b`, `llama3.1:8b-instruct`, or `minimax` for a controlled quality comparison before any provider swap.

**Cost budgeting:** at ~40 prompts × weekly × 4 = 160 reasoning calls/mo, plus ad-hoc runs during development — well inside Ollama Cloud's free tier at pilot scale. Tavily/SearXNG usage for eval research-triggered prompts fits inside the search budget too.

### PRD § 13 Failure-Mode Coverage Matrix

Every row in the PRD's evaluation table maps to a named test file so regressions fail the build visibly:

| PRD Scenario                                 | Test Name                          | Harness Layer                 |
| -------------------------------------------- | ---------------------------------- | ----------------------------- |
| Internal evidence sufficient                 | `EvalPrompt01_InternalOnlySuccess` | AI eval                       |
| Regional evidence missing                    | `EvalPrompt07_ResearchTriggered`   | AI eval                       |
| No trustworthy result                        | `EvalPrompt15_UncertainAnswer`     | AI eval                       |
| Ingredient conflict with hard exclusion      | `EvalPrompt22_DietaryReject`       | AI eval + contract validation |
| Photo unavailable                            | `EvalPrompt18_NullImage`           | AI eval                       |
| Duplicate request / reconnect                | `ReservationIdempotencyTest`       | Concurrency                   |
| Two messages, one remaining trial            | `ReservationAtomicityTest`         | Concurrency                   |
| Provider fail / timeout                      | `AgentTimeoutReleasesTest`         | Integration                   |
| Retrieved page has bypass instructions       | `PromptInjectionResistanceTest`    | AI eval                       |
| External result lacks publication permission | `SourceLinkOnlyFallbackTest`       | AI eval                       |
| Duplicate billing event                      | `WebhookIdempotencyTest`           | Billing sandbox               |
| Device offline                               | `OfflineRecipeAccessMaestroFlow`   | Mobile E2E                    |

### CI Wiring

GitHub Actions workflow shape:

- **On PR:** unit + integration + contract tests. Blocks merge on failure.
- **On `main` merge:** same, plus mobile E2E (Maestro) against a fresh Expo build.
- **Nightly on `main`:** full AI eval against the current primary model; results uploaded as an artifact for review.
- **Pre-release tag:** concurrency + billing sandbox + manual Android checklist gate.

### What Is _Not_ Tested in v1

Explicitly out of scope so the team does not chase it prematurely:

- Load testing beyond pilot concurrency (~5 concurrent users is sufficient)
- Chaos engineering on the single Oracle VM (recovery runbook is enough)
- Penetration testing (deferred until billing is live)
- Localization of the app UI (v1 is English-only per PRD scope)

---

## 16 Content Ingestion Pipeline

PRD § 8 lists six ingestion requirements. This section maps them to concrete pipeline stages, each running as a Kotlin coroutine job callable from the admin UI or a Gradle CLI task.

### Pipeline Shape

```
[Source Acquisition] → [Staging] → [Normalization] → [Deduplication]
        → [Identity / Variant / Cultural Separation] → [Embedding]
        → [Review Queue] → [Publication]
```

### Stage Responsibilities

| Stage                                        | Responsibility                                                                                                                                                                                                                                                                                                                                                                  | Storage Effect                                                                                           | Idempotency Key                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Source Acquisition**                       | Load raw candidate records from a dataset export, curated URL list, or manual entry. Every record must carry a `provenance` object: original source URL, retrieved_at, license statement, and reuse basis. Records lacking these are **rejected at intake** (PRD § 8: "Import only content with recorded provenance and a documented reuse basis").                             | Write raw JSON to `ingestion_raw` table; enqueue downstream stages                                       | `(source_url, content_hash)`   |
| **Normalization**                            | Canonicalize ingredient names against the `Ingredient` alias table; convert unit strings; parse "to taste" and other non-numeric quantities; split compound ingredients; extract timing/method/difficulty where present. Missing fields stay null, never guessed.                                                                                                               | Populate a structured `Recipe` record draft                                                              | `(raw_id)`                     |
| **Deduplication**                            | Detect near-identical dishes via embedding similarity + name/alias overlap. Legitimate variants (regional tonsq vs. Ilocano pinikpikan, etc.) stay separate. Genuine duplicates link with `possible_duplicate_of` for admin review — **never auto-merge**.                                                                                                                      | Write duplicate links for admin review; do not modify records destructively                              | `(draft_recipe_id)`            |
| **Identity / Variant / Cultural Separation** | Populate three concerns independently: `Dish` (canonical name, aliases, description, regional associations with evidence links), `Recipe` (variant + steps + quantities + timings + difficulty), and `Source` (per-claim backing). Uncertain or disputed origin info is preserved verbatim; the pipeline never collapses multiple origin narratives into a single "true" field. | Writes to `Dish`, `Recipe`, and `Source` with per-claim source links                                     | `(recipe_id)`                  |
| **Embedding**                                | Compute 768-dim `nomic-embed-text` vectors for **searchable documents only** — names, aliases, descriptions, ingredients, techniques, geographic associations. Ordered instructions and quantities are **not** embedded; they stay in the structured recipe record per PRD § 8.                                                                                                 | Write `KnowledgeDocument` rows with `content_version`; store vectors linked to record IDs and source IDs | `(record_id, content_version)` |
| **Review Queue**                             | Any newly published or materially changed content enters the admin review queue. Nothing enters the trusted retrieval index without explicit approval.                                                                                                                                                                                                                          | `KnowledgeDocument.review_state = pending`; approved transitions to `published`                          | N/A — human state              |
| **Publication**                              | Only approved records appear in `searchKnowledgeBase` results. Reindex on publication changes; withdrawn content is removed from retrieval immediately (PRD § 8 step 5).                                                                                                                                                                                                        | `Recipe.status = published`; `KnowledgeDocument.review_state = published`                                | `(record_id)`                  |

### Failure and Recovery Semantics

- **Idempotent re-runs.** Re-processing the same source with an unchanged content hash is a no-op. Changing content hash triggers re-normalization from the affected stage forward; earlier cached stages are reused.
- **Partial failure isolation.** If embedding fails mid-batch, the affected records stay in `pending_embedding` state; publication refuses them. Admin UI surfaces the stuck count with a Retry action.
- **Withdrawal.** Setting `Recipe.status = withdrawn` triggers a background job to remove linked `KnowledgeDocument` rows from the vector index and invalidate any `search_cache` entries referencing them. Withdraw is atomic with index removal — no window where a withdrawn recipe appears in retrieval.
- **Dataset updates.** If a source changes upstream, the pipeline compares new vs. old content hashes per record and only reprocesses diffs, keeping ingestion cost bounded.
- **Versioning.** Every published `Recipe` carries a `version` integer. Admin edits increment it; offline mobile copies track the version they downloaded so the app can warn about newer versions (PRD F11).

### Admin Workflow

- **Phase 1 (bootstrap):** CLI task `./gradlew ingest --source=<path>` for the initial 50-recipe load. Faster than building UI first.
- **Phase 1 end (operational):** admin UI at `/admin/ingestion` with the review queue. Required before publishing anything user-facing.
- **Actions available:** Approve / Reject / Edit-and-republish / Withdraw. Each writes an audit row (who, what, when, before/after snapshot).
- **Research candidates** produced by the bounded research agent (PRD § 8 "Research cache and review") enter the same review queue with an added "promote to free collection" option — approval required before publication per PRD.

### Provenance and Licensing Gate

PRD § 17 lists two HuggingFace dataset candidates. Neither is approved by this architecture. Before either enters the pipeline:

1. **Original provenance** is verified independently of the dataset repository's label.
2. **Per-recipe reuse basis** is documented and stored as `Source.reuse_basis`.
3. **Legal review notes** are recorded per source, not per dataset.
4. Only records passing all three gates enter staging.

This is an operational gate, but the pipeline enforces it structurally: any ingest record missing a `provenance` object is rejected at intake, not queued for review.

### Phase 1 Exit Criteria

The pipeline is considered complete for Phase 1 when:

- ≥ 50 recipes are `published`, spanning Luzon, Visayas, and Mindanao (PRD § 2 launch minimum)
- Every recipe has at least one `Source` with a documented `reuse_basis`
- Ingredient alias table covers all ingredients used by those 50 recipes
- Regional association evidence links exist for every non-`unknown` geography (PRD F03)
- The admin review queue is functional and the CLI path has been used at least once end-to-end
- Retracted content demonstrably disappears from `searchKnowledgeBase` within one reindex cycle

---

## 17 Related Documents

Planned repo artifacts referenced throughout this architecture:

| Artifact                      | Location                                                                                                                               | Referenced In |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Product Requirements Document | `docs/PRD.md` (currently pasted in README thread)                                                                                      | All sections  |
| Data schema migrations        | `apps/api/src/main/kotlin/.../db/migrations/` (Flyway or Exposed — final choice is a Phase 1 decision)                                 | § 5, § 16     |
| AI evaluation prompt set      | `docs/eval-prompts.md`                                                                                                                 | § 15          |
| Evaluation runner             | `apps/api/src/test/kotlin/.../eval/`                                                                                                   | § 15          |
| OpenAPI spec                  | Generated at build; published as `packages/api-contract/openapi.yaml` for mobile consumption                                           | § 11          |
| Docker Compose topology       | `deploy/docker-compose.yml` at repo root                                                                                               | § 10          |
| `.env.example`                | `deploy/.env.example` — lists every secret named in § 10 Environment config                                                            | § 10          |
| Ingestion CLI                 | Gradle task `./gradlew ingest` in the API service module                                                                               | § 16          |
| Operational runbook           | `docs/RUNBOOK.md` — pending; should cover VM-down, Ollama Cloud quota-exhausted, SearXNG-blocked, Postgres-replica-promotion scenarios | § 10, § 15    |

### Not Yet Written (Flagged Follow-Ups)

This architecture still defers four things the team should produce before Phase 3:

1. **Retention policy document** — per PRD § 12, needs concrete numbers for conversation retention, research cache expiry, offline copy expiry behavior, and account-deletion cascade rules.
2. **Metrics catalog** — per PRD § 12, needs a list of every metric emitted (failure rates, latency p50/p95/p99, retrieval coverage, cost per completed answer, research fallback rate, trial conversion) with names, units, and collection points.
3. **Repository layout** — single monorepo with `apps/api/` (Ktor, planned), `apps/mobile/` (Expo), `apps/admin/` (future web app), and `packages/api-contract/` (planned OpenAPI + TS types). Root npm workspaces manage JavaScript applications and shared packages; the API retains Gradle tooling. Deployment files belong in `deploy/` when implemented.
4. **Feature-flag strategy** — required for pilot rollout (e.g., "enable bounded research for X% of users") and for A/B pricing tests in Phase 5. Simplest fit: a Postgres-backed `feature_flags` table checked by the Ktor middleware; no external service at $0 budget.
