# Philippine Food Discovery and Recipe Assistant

## Product requirements for version one

**Document version:** 1.0 draft  
**Date:** 24 October 2026  
**Platform:** React Native mobile application, Android first  
**Audience:** Product owner, designer, and developer  
**Product name:** Working description; final name undecided

## 1 Product overview

Build a mobile app that helps people discover food across the Philippines and cook from a source-backed recipe collection. Users can freely browse, search, filter, save, and cook published recipes. A paid conversational AI assistant interprets more detailed requests, retrieves information through retrieval augmented generation (RAG), and uses web research tools when the knowledge base cannot adequately support an answer.

Example premium request: “I’m interested in food from Western Visayas. Suggest something less familiar to me, savory, and manageable for a beginner.”

The assistant recommends dishes, explains why they match, presents available recipes and photos, and cites supporting sources. It must distinguish documented regional associations from uncertain origin claims. “Less familiar” depends on the user: ask what they have tried when needed, or clearly state the assumption used.

Version one is a recipe discovery and cooking product. It does not provide restaurant listings, live menus, ordering, delivery, or claims of complete coverage of Philippine cuisine.

## 2 Confirmed direction and proposed defaults

| Decision                 | Version one position                                                               | Status           |
| ------------------------ | ---------------------------------------------------------------------------------- | ---------------- |
| Geographic scope         | Food across the Philippines, with regional discovery                               | Confirmed        |
| Mobile frontend          | React Native                                                                       | Confirmed        |
| Basic features           | Free with no subscription quotas on published content                              | Confirmed        |
| Conversational assistant | Paid feature with a few new-user trials                                            | Confirmed        |
| Research behavior        | Search internal knowledge first; research externally when evidence is insufficient | Confirmed        |
| New-user trial           | Three successful AI requests per verified account, lifetime, no card required      | Proposed default |
| Paid access              | Monthly subscription with a configurable request allowance                         | Proposed default |
| Price and paid allowance | Determine from measured costs and user testing                                     | Open             |
| Launch platform          | Android first; preserve a path to iOS                                              | Proposed default |
| Launch content           | At least 50 reviewed recipes spanning Luzon, Visayas, and Mindanao                 | Proposed minimum |

Proposed defaults make this PRD implementable; they are not previously agreed commitments. Free access has no daily recipe-view, search, favorite, or download quota. Device storage, network availability, and technical abuse protection still apply.

## 3 Problem and intended users

People may know the flavor, region, ingredients, or effort they want without knowing the name of a suitable dish. Recipe discovery also requires separating regional variations, identifying reliable cooking instructions, and moving between search results and a usable cooking view.

Primary users are home cooks deciding what to prepare, beginners needing clear steps, and food enthusiasts exploring regional Philippine cuisine. Secondary users are Filipinos abroad discovering dishes and understanding local ingredient names. Initial research should validate these needs rather than assume demand for a subscription.

## 4 Goals and success measures

Version one should let a user find a suitable published recipe, prepare it using a practical cooking interface, and receive a grounded answer to a more specific conversational request.

| Outcome                     | Measurement                                                       | Initial target                                                      |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Useful basic discovery      | Test participants find a matching recipe without help             | At least 8 of 10 participants                                       |
| Reliable AI recommendations | Human review of 40 representative prompts                         | At least 85% satisfy stated constraints where valid matches exist   |
| Supported regional claims   | Review substantive regional and origin claims against cited pages | At least 95% supported; no fabricated citations                     |
| Correct usage accounting    | Automated entitlement and concurrency scenarios                   | All pass; zero duplicate charges                                    |
| Practical speed             | On a documented test device and network                           | Recipe search p95 under 2 seconds; AI request timeout at 90 seconds |
| Commercial learning         | Trial use, conversion, paid cost per answer, repeat use           | Measure in pilot; targets set after baseline                        |

These are proposed release targets, not measured results. Any critical dietary-exclusion violation in the evaluation blocks release until corrected and retested.

## 5 Version one scope

### Free user features

| ID  | Requirement                         | Acceptance criteria                                                                                                                                                                     |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 | Browse published recipes as a guest | Recipe names, short summaries, and available images appear; pagination does not require payment                                                                                         |
| F02 | Search names and stored aliases     | Search is case insensitive; a known alias returns the associated dish; empty results provide recovery options                                                                           |
| F03 | Explore regional associations       | Users filter by associated region or province; missing geography is labeled unknown rather than guessed                                                                                 |
| F04 | Match available ingredients         | Users select normalized ingredients; results show matched and missing ingredients and distinguish pantry staples                                                                        |
| F05 | Filter recipes                      | Filters cover meal type, main ingredient, maximum total time, cooking method, difficulty, and ingredient exclusions; unknown values are visible and do not silently pass strict filters |
| F06 | Open a complete recipe              | Show recipe variant, quantities, ordered steps, servings, available timing, sources, and photo credits; unavailable fields are explicitly omitted or marked unknown                     |
| F07 | Adjust servings                     | Scale numeric quantities proportionally; retain “to taste” text; do not automatically scale cooking time; warn when a recipe requires batch-size judgment                               |
| F08 | Save favorites                      | Favorites persist locally without an account; there is no plan quota; cloud sync is deferred                                                                                            |
| F09 | Use guided cooking mode             | Show one step at a time, ingredient checkboxes, and keep-awake behavior while active; exiting restores normal device behavior                                                           |
| F10 | Build a shopping list               | Add recipe ingredients, mark items purchased, and merge only compatible ingredient names and units; the user can edit quantities                                                        |
| F11 | Save recipes offline                | Explicitly download text and permitted images; recipes remain readable without a connection; show saved version and a delete-download action                                            |
| F12 | Inspect sources and report problems | Source links open externally; users can report missing or incorrect information; submissions enter an admin review queue                                                                |

Ingredient matching and filters use database/application logic. They do not consume AI requests. Existing saved recipes and favorites remain accessible when trial or paid AI access ends.

### Premium and trial features

| ID  | Requirement                 | Acceptance criteria                                                                                                                   |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P01 | Natural-language discovery  | Interpret requested place, taste, ingredients, difficulty, time, and exclusions; recommend up to three supported matches              |
| P02 | Conversational refinement   | Follow-ups preserve relevant conversation constraints; users can change them explicitly                                               |
| P03 | RAG retrieval               | Search reviewed knowledge and retrieve complete linked recipe records; recommendations reference actual retrieved sources             |
| P04 | External research fallback  | Search and read external pages only when requested facts or suitable candidates lack sufficient internal evidence                     |
| P05 | Explain and cite            | Explain why a dish matches; cite recipe and cultural claims separately when their sources differ                                      |
| P06 | Return optional photos      | Display only approved or otherwise permitted photos with credit; absence of a usable photo does not prevent an answer                 |
| P07 | Save discovered recipes     | Save a usable recipe to favorites/offline storage when its reuse permissions support that; otherwise save the source link and summary |
| P08 | View previous conversations | Signed-in users can reopen their own conversations without consuming another request; they can delete them                            |
| P09 | Display access and usage    | Show remaining lifetime trials or paid allowance, billing-period reset, and upgrade/access status                                     |

## 6 Access and subscription rules

Guest users can use the free collection. A verified account is required to claim trials, use the assistant, view conversation history, and manage paid access. Email registration, verification, sign-in, password recovery, and account deletion are included; social login is deferred.

A request is one substantive user message and its completed, usable assistant answer. Internal searches and page reads do not count separately. A substantive follow-up consumes another request. Necessary clarification-only turns, system errors, no-supported-result responses, retries of the same request, and reopening history consume none. Clarifications must be bounded to prevent an endless free conversation; after two unresolved clarification turns, ask the user to start again with clearer constraints.

Reserve one eligible request atomically before AI execution. Prefer a paid allowance while a subscription is active; preserve unused lifetime trials. Finalize exactly once on a validated successful answer. Release the reservation on failure, cancellation before delivery, or timeout. Persist a completed answer before notifying the client; a reconnect retrieves that answer instead of charging again. A scheduled reconciliation process releases abandoned reservations. AI retries carry the same idempotency key.

Paid allowances reset on confirmed billing periods, not calendar months. No rollover is assumed. Cancellation prevents the next renewal while preserving access through the paid-through date unless the payment platform reports revocation. Provider events are verified and handled idempotently. The backend is authoritative for entitlements; the mobile client and AI model cannot grant or change them.

The payment method must be selected after confirming the distribution platform’s current digital-subscription requirements. Production purchase, restore/reconciliation, cancellation guidance, and sandbox testing are required before charging users. Price and allowance are release configuration, not values embedded in the app.

## 7 Main user journeys

### Discover and cook for free

Open the app → browse or search → filter results → inspect a recipe → save it or add ingredients to the shopping list → enter guided cooking mode. No AI quota check occurs.

### Use a new-user AI trial

Open Assistant → register and verify → see “3 trial requests remaining” → submit a request → see retrieval/research progress → receive recommendations and sources → open a recipe. The counter decreases only after a usable answer is stored.

### Research a missing regional dish

Submit a regional request → retrieve partial internal results → identify missing evidence → search the web → read selected pages → assess relevance and source support → return a grounded result or explain that evidence is insufficient. Retrieved pages become review candidates, not automatically trusted knowledge.

### Reach the AI access limit

Submit after trials and paid allowance are unavailable → show an upgrade or renewal message before calling AI tools → preserve the typed message. Browsing, saved recipes, and prior answers continue working.

## 8 AI agent and RAG requirements

### Knowledge ingestion

1. Import only content with recorded provenance and a documented reuse basis. Public download availability alone is insufficient for publication approval.
2. Validate required recipe fields, normalize ingredient aliases and units, identify duplicates, and keep legitimate variants separate.
3. Separate dish identity, recipe variant, cultural description, and sources. Preserve uncertain or disputed origin information.
4. Create searchable documents from reviewed names, aliases, descriptions, ingredients, techniques, and geographic associations. Keep ordered instructions and quantities in complete structured recipe records.
5. Embed searchable text and store vectors linked to record IDs, content versions, and source IDs. Reindex on publication changes and remove withdrawn content from retrieval.
6. Only approved records enter the trusted retrieval index. Start with at least 50 reviewed recipes; do not advertise comprehensive national coverage.

### Per-request agent flow

1. Backend authenticates the user, validates input, reserves usage, and loads relevant conversation context.
2. Agent extracts hard constraints and softer preferences. Ask a clarification when ambiguity prevents a useful answer.
3. Search with keyword matching, vector similarity, and structured filters. Fetch complete records for selected candidates.
4. Assess evidence coverage: are the candidates appropriate, do they meet hard constraints, and do sources support the required regional and recipe claims? Similarity scores alone do not establish sufficiency.
5. Research only the missing candidates or claims when coverage is insufficient. Prefer sources with identifiable authorship and explicit recipe information; seek corroboration for uncertain cultural claims.
6. Produce structured results, validate recipe/source links and exclusions, then store and deliver the answer. If support is inadequate, return uncertainty or alternatives without inventing details.
7. Record tool usage, timing, cost, source IDs, and accounting outcome. Keep new research separate from reviewed content.

### Allowed agent tools

| Tool                | Purpose                                                                  | Boundary                                               |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| searchKnowledgeBase | Retrieve reviewed candidates with structured filters and semantic search | Published records only                                 |
| getRecipe           | Fetch complete recipe, variant, and provenance                           | Never combine steps from unrelated variants            |
| searchWeb           | Discover candidate sources for unanswered needs                          | Maximum three searches per request by default          |
| readWebPage         | Extract relevant text and source metadata                                | Maximum five pages; bounded content length and timeout |
| getApprovedImage    | Retrieve permitted photo metadata                                        | No arbitrary image scraping or invented URLs           |

Initial limits: 10 total tool calls, 90 seconds end-to-end, bounded model tokens, and a configurable monetary ceiling per request. Stop when any limit is reached. Exact vendor prices and model selection are implementation decisions to benchmark. No recursive agents or multi-agent orchestration in version one.

### Answer contract

Return a user-facing summary and structured recommendations containing dish ID when known, name, variant, regional association, reason for match, recipe ID or source link, supported timing/difficulty, image or null, citation IDs, and uncertainty notes. Store research status separately as internal-only, web-assisted, or insufficient-evidence.

Provide a full recipe only when the source supports its required ingredients and steps and content reuse is permitted. Otherwise explain the dish and link to the recipe. Never fabricate quantities, photos, source URLs, provenance, or regional origins. Clearly label substitutions and adaptations rather than presenting them as the source’s original version.

### Research cache and review

Cache reusable public research by normalized topic and source, not by exposing another user’s conversation. Retain retrieval date, content hash, licensing status, and review status. Provisional cache entries may support later research after source checks; they remain separate from the trusted index. A proposed 30-day cache expiry triggers revalidation. Admin approval is required before publishing researched content into the free collection.

### Tool safety and dietary handling

Treat retrieved text as evidence, never as instructions that can override the system or request more privileges. Block private/local network URLs, unsafe redirects, executable content, and excessive downloads. Tools are read-only and have no access to payment or entitlement mutation.

Check explicit ingredient exclusions against full ingredient lists, including known compound ingredients. Avoid guaranteeing that a dish is allergen-free when composition or cross-contact is unknown. Unknown ingredient information cannot satisfy a strict exclusion filter. Medical diet advice and unsupported nutrition calculations are outside scope.

## 9 Suggested technical architecture

This is a proposed implementation baseline, not a mandate for specific library versions or AI vendors.

| Layer             | Proposed implementation                                                     | Responsibility                                             |
| ----------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Mobile            | React Native, Expo, TypeScript                                              | Discovery, cooking, local saves, assistant UI              |
| Local persistence | SQLite and permitted local file storage                                     | Favorites, shopping lists, downloaded recipe versions      |
| API               | NestJS and TypeScript                                                       | Accounts, recipes, access checks, conversations            |
| Database          | PostgreSQL with pgvector                                                    | Structured records, keyword/vector retrieval, usage ledger |
| AI orchestration  | Backend agent runner with typed tool contracts                              | Retrieval decisions, bounded research, structured output   |
| Providers         | Swappable language model, embedding, search, and page extraction adapters   | External AI/research capabilities                          |
| Media             | Object storage or approved external image references                        | Permitted photos and attribution                           |
| Background work   | Durable job processing and reconciliation                                   | Ingestion, indexing, research jobs, abandoned reservations |
| Admin             | Minimal authenticated web interface or equivalent secure internal interface | Content review, publication, reports                       |
| Billing           | Platform-compatible purchase provider and server verification               | Subscription lifecycle and entitlements                    |

Request path: mobile app → authenticated API → entitlement reservation → agent → internal retrieval and optional research → validation → persisted answer and usage finalization → mobile result.

Keep provider keys on the server. Long-running requests expose job IDs and status so app backgrounding or disconnection does not lose a completed answer. Streaming is optional for version one; useful progress states are required.

## 10 Core data model

| Entity                   | Minimum information                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| User                     | ID, verified identity, preferences, creation date                                                               |
| Dish                     | Canonical name, aliases, description, regional associations with evidence                                       |
| Recipe                   | Dish ID, variant, servings, ordered ingredient quantities and steps, times, method, difficulty, status, version |
| Ingredient               | Canonical name, aliases, unit relationships, documented compound ingredients                                    |
| Source                   | URL, title, author/publisher when available, retrieved date, reuse basis, supported claims                      |
| Photo                    | Dish/recipe association, URL or storage key, creator, license, attribution                                      |
| KnowledgeDocument        | Linked entity, text, embedding, content version, review state                                                   |
| Conversation and Message | User ownership, messages, result payload, citation references                                                   |
| AIRequest                | Idempotency key, job status, reservation, tools, cost, error category, timestamps                               |
| UsageLedger              | User, access bucket, reserved/finalized/released state, billing period                                          |
| Subscription             | Provider reference, plan, entitlement status, allowance, period boundaries                                      |
| ResearchCandidate        | Extracted information, provenance, expiry, review decision                                                      |
| ContentReport            | Target recipe/source, issue description, review status                                                          |

Favorites, shopping lists, and offline copies are local in version one. Financial records remain minimal and are kept separate from conversations; no raw card details are stored by the application.

## 11 Screens and operational requirements

Mobile screens: Home, Search and Filters, Regional Explorer, Recipe Details, Cooking Mode, Saved Recipes and Downloads, Shopping List, AI Assistant and History, Sign In and Verification, Subscription and Usage, and Settings.

Admin capabilities: create/edit recipes, manage aliases and regional evidence, attach approved photos, approve/reject research candidates, publish/unpublish, review user reports, and inspect request failures and usage without exposing unnecessary personal information. Admin review is an operational requirement, not a public community feature.

Empty, loading, unavailable-photo, offline, expired-access, and research-failure states must be designed. Free screens must never imply the user needs a subscription to open a published recipe. Use readable text, accessible labels, scalable fonts, adequate contrast, and large cooking controls.

## 12 Quality and privacy requirements

- Enforce ownership checks on every conversation and account endpoint; separate admin access.
- Use secure authentication, encrypted transport, server-side secret storage, and bounded request inputs.
- Retain local downloads after ordinary connection loss. Warn that newer recipe versions may exist; support refresh and deletion.
- Collect operational events without logging full conversation content by default. Send only necessary context to AI/search providers.
- Explain external processing before first assistant use. Provide conversation deletion and account deletion controls; document any required billing-record retention.
- Track AI failure rates, latency, retrieval coverage, cost per completed answer, research fallback rate, and trial conversion. Analytics should avoid storing sensitive free-text queries unnecessarily.
- Back up published content and server-side account/usage records. Monitor failed jobs and entitlement reconciliation.

## 13 Evaluation and release acceptance

Create a fixed set of 40 prompts covering regional requests, alias search, preferences, time limits, ingredient exclusions, follow-ups, missing knowledge, conflicting evidence, fabricated dish requests, and malicious instructions in retrieved pages. Maintain reviewed expected behaviors, not exact answer wording.

| Scenario                                                | Required behavior                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Internal evidence is sufficient                         | Supported answer; no unnecessary web research                                     |
| Recipe exists but regional evidence is missing          | Research that claim or acknowledge uncertainty                                    |
| No trustworthy result is found                          | Explain the gap; do not fabricate; release usage                                  |
| Ingredients conflict with a hard exclusion              | Reject candidate or clearly say no supported match exists                         |
| Photo unavailable                                       | Complete supported text answer with no fake photo                                 |
| Request duplicated or client reconnects                 | Retrieve the same job/result; finalize usage once                                 |
| Two messages compete for one remaining trial            | At most one reservation succeeds                                                  |
| Provider fails or research times out                    | Clear failure state, preserved user text, no consumed request                     |
| Retrieved page contains instructions to bypass rules    | Ignore instructions; tools remain within their boundaries                         |
| External result lacks publication permission            | Provide an appropriate source link/summary; do not publish it into the collection |
| Subscription changes or duplicate billing event arrives | Reconcile entitlements once without duplicating allowance                         |
| Device is offline                                       | Saved recipes work; AI explains connection requirement                            |

Launch requires free-feature acceptance tests, retrieval and grounding evaluation, concurrency/idempotency tests, billing sandbox checks, content/license review, and manual Android testing of offline storage and cooking mode. No production charging before purchase verification and restore/reconciliation work end to end.

## 14 Delivery sequence

1. **Content foundation:** finalize metadata, permissions workflow, 50 reviewed recipes, source links, and evaluation prompts.
2. **Free cooking experience:** implement browse, search, ingredient matching, recipe details, saves, shopping list, cooking mode, and offline access.
3. **Internal assistant:** add accounts, lifetime trials, RAG retrieval, citations, request reservations, history, and evaluation.
4. **Bounded research agent:** add search/page tools, evidence checks, source-linked answers, cache, admin review, and operational limits.
5. **Paid pilot:** choose price and allowance from measured costs, integrate compliant billing, verify lifecycle behavior, and test with a small user group.

These are dependency milestones rather than calendar promises. Release only after the complete core path works: discovery → source-backed answer → recipe → cooking, with correct access accounting.

## 15 Deferred features

Restaurant recommendations and maps; ordering or delivery; photo-based ingredient recognition; automatic AI meal planning; nutrition or medical advice; public recipe submissions and social feeds; ratings and comments; automatic translations; voice interaction; cloud sync of local collections; advanced cooking timers; public cultural essays and glossary beyond the recipe metadata; automatic publication of agent research; iOS launch; and unlimited paid AI usage.

## 16 Risks and decisions before launch

| Risk or open decision                  | Required action                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Dataset permission is unclear          | Confirm original provenance and reuse permissions before ingestion/publication                          |
| Regional coverage is uneven            | Audit geography and variants; show coverage honestly                                                    |
| Taste and authenticity are subjective  | Explain matches; attribute traditions and avoid unsupported origin claims                               |
| External research is slow or expensive | Measure latency/cost, enforce budgets, reuse reviewed content                                           |
| New-account trial abuse                | Verify accounts, apply proportionate server-side protections, monitor abuse without blocking normal use |
| Subscription value is uncertain        | Test whether regional research improves outcomes enough for users to pay                                |
| Image rights or matching are uncertain | Use approved photos; omit images when permission or dish identity is unclear                            |
| Pricing and paid request allowance     | Measure representative RAG-only and research-assisted requests, then set sustainable values             |
| Distribution and payment provider      | Confirm current platform requirements before implementation and production sales                        |
| Retention and content ownership policy | Define conversation, research-cache, download, and account-deletion behavior before launch              |

## 17 Planning notes and reference candidates

This PRD records product decisions and proposed implementation behavior; it does not certify a dataset license, historical claim, payment policy, or provider capability. Reference candidates discussed during planning include the following. Recheck their terms and inspect actual records before use.

- Filipino Recipes 2K: https://huggingface.co/datasets/joackimagno/FILIPINO_RECIPES_2K
- Filipino Recipes 2K V2: https://huggingface.co/datasets/joackimagno/FILIPINO_RECIPES_2K_V2
- Wikimedia Commons Philippine cuisine collection: https://commons.wikimedia.org/wiki/Category:Cuisine_of_the_Philippines

The complete recipe records and their permissions must be assessed independently of model or dataset repository labels. No specific external dataset is approved by this PRD.
