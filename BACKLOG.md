# Philippine Food Discovery and Recipe Assistant — Backlog

This backlog turns the version-one scope in [PRD.md](PRD.md) into epics and actionable stories. Work is ordered by the PRD's delivery phases; this is a dependency order, not a dated schedule.

**Status key:** `[ ]` Not started · `[x]` Done. All items begin Not started. No owners, estimates, or dates are assigned here.

**Decision handling:** Requirements marked confirmed in the PRD are implementation scope. Proposed defaults and open questions below must be confirmed before the dependent release work is finalized. The PRD's suggested architecture is a baseline, not a mandate for specific library versions or vendors.

## Project setup - selected technology stack

The setup backlog has **three parent tickets**, one per selected stack component. The 54 Expo checks are subtasks of the Mobile Application ticket, not separate backlog tickets. Overall setup progress starts at **0/3 tickets**.

### Ticket SETUP-01 - Mobile application: React Native + Expo + TypeScript

- [ ] **SETUP-01 - Set up the React Native Expo mobile application**

  Implementation and verification evidence: [mobile handover](apps/mobile/SETUP-01.md).
  The parent remains open until Android device, EAS build, and API acceptance checks are complete.

  **Project initialization**
  - [x] Initialize Expo project with TypeScript.
  - [x] Configure Node.js and package manager.
  - [ ] Set up Android emulator and Expo Go or development build.
  - [x] Configure app name, slug, scheme, and Android package identifier.
  - [ ] Verify app runs on Android.
  - [x] Initialize Git and configure `.gitignore`.

  **Project architecture**
  - [x] Create feature-based folder structure.
  - [x] Configure TypeScript strict mode.
  - [x] Configure path aliases (`@/`).
  - [x] Set up environment variables (`.env.example`).
  - [x] Define shared types and API response models.
  - [x] Set up constants, theme, and reusable utilities.

  **Navigation and screens**
  - [x] Install and configure Expo Router.
  - [x] Set up tab navigation and nested routes.
  - [x] Create placeholder screens for PRD modules.
  - [x] Configure guest and authenticated navigation flows.
  - [x] Set up loading, error, and not-found screens.
  - [x] Configure deep-link scheme.

  **UI and styling**
  - [x] Select styling approach and configure theme.
  - [x] Set up fonts, typography, spacing, and colors.
  - [x] Configure safe areas and status bar.
  - [x] Create reusable buttons, inputs, cards, and loading indicators.
  - [x] Support keyboard handling and screen-size responsiveness.
  - [x] Establish accessibility conventions.

  **API and authentication foundation**
  - [x] Install HTTP client and TanStack Query.
  - [x] Create centralized API client and base URL configuration.
  - [x] Configure request timeout and error handling.
  - [x] Set up secure token storage.
  - [x] Create authentication state and session restoration.
  - [x] Prepare authenticated and public API routes.

  **Local storage and offline foundation**
  - [x] Install `expo-sqlite`.
  - [x] Define local database schema and migrations.
  - [x] Prepare favorites repository.
  - [x] Prepare shopping list repository.
  - [x] Set up `expo-file-system` for recipe downloads.
  - [x] Plan offline images, version tracking, and deletion.

  **Device and feature dependencies**
  - [x] Configure `expo-keep-awake` for cooking mode.
  - [x] Set up `expo-web-browser` for external source links.
  - [x] Set up image handling and caching strategy.
  - [x] Prepare network connectivity detection.
  - [x] Configure Android permissions only as needed.
  - [ ] Test app backgrounding and reconnection.

  **Code quality and testing setup**
  - [x] Configure ESLint and Prettier.
  - [x] Add typecheck and lint scripts.
  - [x] Configure unit testing framework.
  - [x] Create example component and utility tests.
  - [x] Configure environment-specific builds.
  - [x] Document setup instructions in README.

  **Build and handover**
  - [ ] Configure EAS Build.
  - [ ] Create development build for Android.
  - [ ] Validate app on physical Android device.
  - [ ] Confirm API connectivity from device.
  - [ ] Run lint, typecheck, and smoke tests.
  - [ ] Commit starter project and share setup documentation.

  **Done when:** all 54 subtasks are complete, the clean-checkout app launches on Android, and the mobile setup and handover are documented. Preserve a path to iOS without making iOS launch a V1 deliverable.

### Ticket SETUP-02 - Backend API: Kotlin + Ktor

- [ ] **SETUP-02 - Set up the Kotlin Ktor backend API**
  - [ ] Create the Kotlin/Ktor service skeleton and build configuration.
  - [ ] Establish API routing and serialization conventions.
  - [ ] Configure environment-specific settings and server-side secrets.
  - [ ] Add a health endpoint and document local startup.
  - **Done when:** the service runs locally, has a working health check and documented startup path, and secrets are not committed. Kotlin + Ktor is the selected stack and supersedes the NestJS/TypeScript suggestion currently in PRD section 9; align that architecture reference during implementation.

### Ticket SETUP-03 - Database: PostgreSQL + pgvector

- [x] **SETUP-03 - Set up PostgreSQL with pgvector**
  - [x] Configure the PostgreSQL development database.
  - [x] Enable pgvector through a repeatable, versioned migration.
  - [x] Establish vector storage and indexing linked to knowledge records and content versions.
  - [x] Verify that a representative vector can be stored and queried.
  - **Done when:** the database is reproducible from migrations and supports vector storage/querying. Embedding provider and dimensions follow the eventual provider choice rather than being hard-coded in the client.

## Phase 1 — Content foundation

### Epic: Content policy, model, and initial collection

- [ ] **BL-001 — Confirm content provenance and reuse policy** (PRD §§8, 16–17). Decide and document acceptable provenance, reuse basis, attribution, and publication evidence. **Done when:** every source/content type has an auditable approval rule; no candidate dataset is treated as approved solely because it is downloadable.
- [ ] **BL-002 — Define canonical dish, recipe, source, ingredient, and photo records** (PRD §10). Keep dish identity separate from recipe variants and cultural claims. **Done when:** the schema captures all minimum fields in §10, claim-to-source support, unknown values, permissions, publication state, and content version.
- [ ] **BL-003 — Define ingredient and geography normalization** (PRD §§5, 8). Normalize ingredient aliases, units, compound ingredients, meal/method/difficulty values, and regional/provincial associations. **Done when:** controlled values and unknown-state behavior support search, matching, filters, and strict exclusions without guessing.
- [ ] **BL-004 — Select and audit initial recipe sources** (PRD §§8, 16–17). Assess candidate datasets and other source material record by record. **Done when:** selected records have recorded provenance, reuse basis, source links, and documented inclusion/exclusion decisions.
- [ ] **BL-005 — Curate the launch recipe collection** (PRD §§2, 8, 14). Review at least 50 recipes spanning Luzon, Visayas, and Mindanao, keeping legitimate variants distinct. **Done when:** every published recipe passes required-field, duplicate, source, permission, and geography review; coverage limitations can be reported honestly.
- [ ] **BL-006 — Approve recipe images and attribution** (PRD §§5, 8, 16). Match photos to dishes/variants and record creator, license, and credit. **Done when:** only permitted, correctly matched images are publishable and unsupported images are omitted.
- [ ] **BL-007 — Build the content ingestion and indexing pipeline** (PRD §8). Validate fields, normalize content, create searchable documents and embeddings linked to record/source versions, and handle updates and withdrawals. **Done when:** only approved content enters retrieval; publication changes reindex and withdrawn records leave the trusted index.
- [ ] **BL-008 — Create the reviewed AI evaluation prompt set** (PRD §§4, 13–14). Cover the required 40 prompt classes and maintain expected behaviors rather than fixed wording. **Done when:** prompts include regional claims, aliases, constraints, follow-ups, missing/conflicting evidence, fabricated dishes, and malicious retrieved instructions.

## Phase 2 — Free cooking experience

### Epic: Mobile and service foundation

- [ ] **BL-009 - Complete the Expo mobile foundation** (PRD sections 2, 9, 11; setup ticket `SETUP-01`). **Done when:** the Mobile Application ticket is complete and the clean-checkout Android launch, route shell, API connectivity, local persistence, and handover are documented; preserve a path to iOS without making iOS launch a V1 deliverable.
- [ ] **BL-010 - Establish cross-stack development integration** (PRD sections 9-10). Connect the Expo app to the Kotlin/Ktor API and PostgreSQL data layer using documented development configuration and shared data/API contracts. **Done when:** a local end-to-end request reaches PostgreSQL through Ktor and returns a published development recipe to the app; startup and migrations are repeatable and no server secrets are in the client.

- [ ] **BL-011 — Implement recipe administration and publication controls** (PRD §§8–11). Provide authenticated internal tools to create/edit dishes and variants, sources, geography, approved photos, and publication status. **Done when:** draft content is validated and only approved/published records are visible to guest discovery and trusted retrieval.

### Epic: Guest discovery and recipe use

- [ ] **BL-012 — Browse the published collection as a guest** (F01; PRD §7). Provide paginated recipe names, summaries, and available images without sign-in or payment. **Done when:** guests can browse all published pages and free access has no subscription quota.
- [ ] **BL-013 — Search recipe names and aliases** (F02). Make search case-insensitive and resolve stored aliases to their associated dish. **Done when:** alias and canonical-name cases pass and empty results offer useful recovery options.
- [ ] **BL-014 — Explore regional and provincial associations** (F03). Filter on documented associations and display unknown geography explicitly. **Done when:** missing geography is never inferred or presented as fact.
- [ ] **BL-015 — Match selected ingredients** (F04). Normalize selected ingredients and show matched and missing ingredients, distinguishing pantry staples. **Done when:** results use application/database logic and do not consume AI requests.
- [ ] **BL-016 — Filter recipes by supported criteria** (F05). Support meal type, main ingredient, maximum total time, cooking method, difficulty, and ingredient exclusions. **Done when:** unknown values are visible and do not silently pass strict filters; exclusions account for known compound ingredients.
- [ ] **BL-017 — Present complete source-backed recipe details** (F06). Show variant, quantities, ordered steps, servings, available timing, sources, and image credits. **Done when:** absent fields are omitted or marked unknown and recipe/source links are valid.
- [ ] **BL-018 — Adjust recipe servings** (F07). Scale numeric ingredient quantities while preserving “to taste” text. **Done when:** cooking time is not automatically scaled and batch-size judgment warnings appear where needed.
- [ ] **BL-019 — Save and reopen local favorites** (F08). Persist favorites locally without account or plan limits. **Done when:** favorites remain available offline and no cloud sync is implied or required.
- [ ] **BL-020 — Build guided cooking mode** (F09). Display one ordered step at a time, ingredient checkboxes, and keep-awake behavior while cooking. **Done when:** leaving the mode restores normal keep-awake behavior and saved recipe access remains available offline.
- [ ] **BL-021 — Build editable shopping lists** (F10). Add recipe ingredients, mark items purchased, and merge only compatible ingredient names/units. **Done when:** quantities remain editable and incompatible units/names stay separate.
- [ ] **BL-022 — Download, refresh, and delete offline recipes** (F11; PRD §§11–12). Store permitted text/images and the saved content version. **Done when:** a download is readable offline, warns when a newer version may exist, and supports explicit refresh and deletion.
- [ ] **BL-023 — Open sources and submit content reports** (F12). Open source links externally and let users report missing/incorrect information. **Done when:** reports are stored in an admin review queue with target and issue details.
- [ ] **BL-024 — Complete mobile screen states and accessibility** (PRD §11). Implement the named free screens and loading, empty, offline, unavailable-image, and error states with readable text, accessible labels, scalable fonts, adequate contrast, and large cooking controls. **Done when:** free screens never imply a subscription is needed for published recipes and key flows work at supported screen sizes.
- [ ] **BL-025 — Meet free discovery performance and usability targets** (PRD §§4, 13). Test search on a documented device/network and validate unaided discovery with participants. **Done when:** search p95 is under 2 seconds and at least 8 of 10 participants find a matching recipe without help, or gaps are recorded for resolution.

## Phase 3 — Internal AI assistant

### Epic: Accounts, access, and request accounting

- [ ] **BL-026 — Implement verified email accounts and lifecycle** (PRD §§6–7). Support registration, verification, sign-in, password recovery, and account deletion. **Done when:** only verified accounts can access assistant/trial/history/subscription features and guests retain free discovery.
- [ ] **BL-027 — Implement secure session handling** (PRD §§9, 12). Keep provider credentials server-side, protect client session material, enforce encrypted transport, and bound inputs. **Done when:** secrets are absent from the mobile app and auth failures do not expose protected data.
- [ ] **BL-028 — Implement owned conversations and message history** (P08; PRD §§6, 10, 12). Persist assistant conversations, structured results, and citations with user ownership checks. **Done when:** users can reopen/delete their own conversations without a new charge and cannot access another user's records.
- [ ] **BL-029 — Confirm and configure trial policy** (PRD §§2, 6–7). Validate the proposed default of three successful lifetime requests per verified account, no card required. **Done when:** the product decision is recorded and the backend configuration/tests reflect the confirmed policy; unused lifetime trials remain preserved when paid access is preferred.
- [ ] **BL-030 — Implement atomic reservations and usage ledger** (PRD §§6, 10, 13). Reserve eligible usage before execution, finalize once only for a validated usable answer, and release on failure/cancellation/timeout. **Done when:** idempotent retries, reconnects, simultaneous requests, and abandoned-reservation reconciliation cannot double-charge or lose eligible usage.
- [ ] **BL-031 — Implement durable assistant jobs and reconnect behavior** (PRD §§7, 9, 13). Return job IDs/status for long-running work and persist completed answers before notifying clients. **Done when:** app backgrounding, timeout, and reconnect retrieve the same completed result without a second usage finalization.

### Epic: Retrieval, grounded answers, and mobile assistant

- [ ] **BL-032 — Implement reviewed knowledge retrieval** (P03; PRD §8). Search published knowledge using keyword, vector, and structured filters, then fetch complete linked recipe records. **Done when:** withdrawn/unreviewed content cannot be returned as trusted knowledge and candidates retain record, version, and source links.
- [ ] **BL-033 — Interpret constraints and manage clarification** (P01–P02; PRD §§1, 8). Extract hard constraints and softer preferences, preserve relevant conversation context, and ask bounded clarifications. **Done when:** explicit follow-ups can change constraints and the flow restarts after two unresolved clarification turns.
- [ ] **BL-034 — Assess evidence and validate exclusions** (PRD §§8, 13). Check candidate suitability, source support for recipe/regional claims, and full ingredient lists against hard exclusions. **Done when:** similarity alone is insufficient, unsupported candidates are rejected or qualified, and unknown ingredients cannot satisfy strict exclusions.
- [ ] **BL-035 — Produce and validate structured assistant answers** (P01, P05; PRD §8). Return up to three supported recommendations with required identity, variant, region, match explanation, recipe/source link, supported attributes, citations, image/null, and uncertainty notes. **Done when:** output conforms to the answer contract and never invents quantities, photos, provenance, source URLs, or origins; adaptations are labeled.
- [ ] **BL-036 — Return permitted photos and saveable discoveries** (P06–P07; PRD §§5, 8). Show only approved/permitted credited images; save a reusable recipe only when its permissions allow it. **Done when:** without reuse permission the app saves a source link and summary instead; missing photos do not block a supported answer.
- [ ] **BL-037 — Build assistant, progress, and history screens** (P02, P08; PRD §§7, 9, 11). Implement assistant conversation/refinement, retrieval/research progress, recommendations, sources, and history. **Done when:** users can open a linked recipe, see progress for long jobs, and reopen/delete their own history.
- [ ] **BL-038 — Display access status and preserve blocked requests** (P09; PRD §§6–7). Show trials/allowance, reset period, and upgrade/access state; gate before calling AI tools when no access remains. **Done when:** the typed request is preserved, free browsing/saves/history continue, and counter decreases only after a usable answer is stored.
- [ ] **BL-039 — Enforce AI request limits and record operational usage** (PRD §§4, 8). Apply initial 10-tool-call and 90-second limits, bounded tokens, and configurable monetary ceiling. Record tool usage, timing, cost, sources, and accounting outcome without logging full prompt text by default. **Done when:** work stops at configured limits and operational metrics can be calculated.

## Phase 4 — Bounded research agent

### Epic: External evidence and safe research

- [ ] **BL-040 — Add bounded web search and page reading tools** (P04; PRD §8). Implement read-only source discovery/page extraction with metadata, timeouts, and content bounds. **Done when:** defaults cap searches at three and pages at five per request and research is invoked only for missing evidence.
- [ ] **BL-041 — Assess research sources and maintain a separate research cache** (PRD §§8, 13). Track retrieval date, content hash, licensing, review status, and claim support; keep provisional candidates separate from the trusted index. **Done when:** cache keys use normalized topics/sources rather than another user's conversation and a confirmed expiry/revalidation policy is applied (30 days is only a proposed default).
- [ ] **BL-042 — Enforce research tool safety boundaries** (PRD §§8, 13). Treat page text as untrusted evidence; block private/local URLs, unsafe redirects, executable content, and excessive downloads. Keep tools read-only with no entitlement/payment mutation access. **Done when:** malicious page instructions cannot change tool permissions or system behavior.
- [ ] **BL-043 — Review research candidates before publication** (PRD §§7–8, 11, 13). Add admin approve/reject workflow for researched material and reports. **Done when:** no externally researched candidate enters the free collection/trusted index without provenance, reuse review, and explicit admin approval.
- [ ] **BL-044 — Run durable background ingestion and reconciliation work** (PRD §§8–10, 12). Support ingestion/index jobs and scheduled release of abandoned usage reservations. **Done when:** failed jobs are observable, safely retryable, and do not publish partial/unreviewed data or duplicate accounting updates.
- [ ] **BL-045 — Monitor research quality, latency, and cost** (PRD §§4, 8, 12). Track failures, latency, retrieval coverage, fallback rate, per-answer cost, trial conversion, and job/reconciliation health. **Done when:** operators can investigate failures without routine exposure of full conversation content.

## Phase 5 — Paid pilot and release

### Epic: Commercial decisions and subscription lifecycle

- [ ] **BL-046 — Validate user demand and subscription value** (PRD §§3–4, 16). Test whether the assistant/research benefit justifies paid access. **Done when:** pilot findings on trial use, conversion, repeat use, and user value are documented for pricing decisions.
- [ ] **BL-047 — Set price and paid allowance from measured cost** (PRD §§2, 6, 14, 16). Benchmark representative retrieval-only and research-assisted requests and select sustainable values. **Done when:** price and configurable allowance are approved as release configuration, not hard-coded into the app.
- [ ] **BL-048 — Confirm distribution rules and select a billing provider** (PRD §§6, 16). Check current platform requirements before implementing production sales. **Done when:** provider choice and compliance approach are documented for Android launch and preserve the agreed iOS path.
- [ ] **BL-049 — Implement purchase and server-side entitlement verification** (PRD §§6, 9–10). Process provider events idempotently and make the backend authoritative for subscription access. **Done when:** the client/model cannot grant entitlements, periods follow confirmed billing boundaries, and allowances do not roll over unless explicitly decided.
- [ ] **BL-050 — Implement restore, renewal, cancellation, and reconciliation** (PRD §§6, 13). Handle restore, duplicate events, cancellation, paid-through access, revocation, and provider reconciliation. **Done when:** lifecycle events are verified and handled once; cancellation preserves access through paid-through date unless the provider reports revocation.
- [ ] **BL-051 — Complete subscription and usage experience** (P09; PRD §§6–7, 11). Provide purchase/access status, allowance reset, renewal/cancellation guidance, and restore path. **Done when:** users see accurate server-confirmed status and retain access to free features after AI access ends.
- [ ] **BL-052 — Complete billing sandbox and production charging gate** (PRD §§6, 13). Exercise purchase, restore, lifecycle, duplicate-event, and failure scenarios in sandbox. **Done when:** all billing and entitlement tests pass end to end; production charging remains disabled until purchase verification and restore/reconciliation are complete.

### Epic: Privacy, evaluation, and launch readiness

- [ ] **BL-053 — Finalize retention and deletion behavior** (PRD §§6, 12, 16). Define conversation, research cache, local download, account deletion, and required billing-record retention behavior. **Done when:** policy and implementation are consistent, conversation/account deletion controls work, and financial records remain minimal and separate.
- [ ] **BL-054 — Enforce privacy, access control, and data minimization** (PRD §12). Apply ownership checks, separate admin access, explain external processing before first assistant use, and send only necessary context to providers. **Done when:** sensitive free-text is not unnecessarily logged and unauthorized access tests fail safely.
- [ ] **BL-055 — Back up and monitor production data and jobs** (PRD §12). Back up published content and server-side account/usage records; monitor failed jobs and entitlement reconciliation. **Done when:** backup/restore and operational alert procedures are documented and exercised.
- [ ] **BL-056 — Run the full quality and release evaluation** (PRD §§4, 13–14). Execute free-feature acceptance, 40-prompt grounding review, concurrency/idempotency, content/license, and device/offline/cooking tests. **Done when:** AI constraint satisfaction is at least 85% where valid matches exist, regional/origin support is at least 95% with no fabricated citations, accounting has zero duplicate charges, and any critical dietary-exclusion violation is fixed and retested.
- [ ] **BL-057 — Validate Android launch targets and complete the core journey** (PRD §§4, 13–14). Verify search p95 under 2 seconds, AI timeout at 90 seconds, offline saved recipes, and the path from discovery through source-backed answer, recipe, and cooking. **Done when:** the core journey works on the documented Android device/network and release blockers are resolved; no comprehensive cuisine coverage is claimed.

## Coverage map

| PRD area                                                                             | Backlog coverage                                                                        |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| F01–F05: browse, search, region, ingredients, filters                                | BL-012–BL-016                                                                           |
| F06–F12: details, serving adjustment, favorites, cooking, shopping, offline, reports | BL-017–BL-023                                                                           |
| P01–P05: discovery, refinement, retrieval, research, citations                       | BL-032–BL-035, BL-040–BL-042                                                            |
| P06–P09: photos, saving, history, access display                                     | BL-028, BL-036–BL-038, BL-051                                                           |
| Access, trials, accounting, billing                                                  | BL-026–BL-031, BL-038, BL-047–BL-052                                                    |
| Ingestion, knowledge, admin, API, and core data                                      | BL-001-BL-008, BL-010-BL-011, BL-041, BL-043-BL-044                                     |
| Project setup by selected stack component                                            | SETUP-01 Mobile application (54 Expo subtasks), SETUP-02 Backend API, SETUP-03 Database |
| Privacy, security, operations, evaluation, release                                   | BL-024–BL-025, BL-027, BL-039, BL-045, BL-053–BL-057                                    |

## Explicitly excluded from this V1 backlog

Restaurant listings/maps, ordering/delivery, photo-based ingredient recognition, automatic AI meal planning, nutrition/medical advice, public submissions/social feeds, ratings/comments, automatic translations, voice interaction, cloud sync of local collections, advanced cooking timers, public cultural essays/glossary beyond recipe metadata, automatic publication of agent research, iOS launch, and unlimited paid AI usage (PRD §15).
