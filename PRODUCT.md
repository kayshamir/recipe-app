# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

- Mobile: React Native, Expo, and TypeScript.
- API: Ktor with Kotlin.
- Data: PostgreSQL with pgvector; SQLite and permitted local file storage on device.
- Operations: a small pilot deployment on Oracle Cloud Always Free using Docker Compose; object storage for approved media.

## Users

- Home cooks deciding what to prepare, including beginners who need clear, practical cooking steps.
- Food enthusiasts exploring regional Philippine cuisine.
- Filipinos abroad who want to discover dishes and understand local ingredient names.

Users may know a flavour, place, ingredient, effort level, or exclusion they want, without knowing a suitable dish by name.

## Product Purpose

The product helps people discover food from across the Philippines and cook from a source-backed recipe collection. People can browse, search, filter, save, download, and cook published recipes without a subscription.

A conversational assistant supports more detailed discovery requests by retrieving reviewed knowledge and, only when its evidence is insufficient, conducting bounded external research. Its recommendations explain the match and cite the supporting sources. Success means a user can find a suitable recipe, prepare it through a practical cooking flow, and receive grounded answers to specific discovery requests.

## Positioning

Recipe discovery is grounded in reviewed recipes, provenance, and explicit uncertainty rather than unsupported cultural or origin claims. The assistant separates recipe evidence from cultural claims, returns only supported recommendations, and can say when evidence is insufficient.

## Operating Context

- Discovery happens through browsing, search, regional and ingredient filters, and recipe details.
- Cooking includes serving adjustment, an editable shopping list, downloads for offline use, and a focused guided-cooking mode with one step at a time.
- Guests use the published collection; a verified account is needed for the assistant, its trial, conversation history, and paid access.
- Content is reviewed before publication. Sources, reuse basis, regional associations, image permissions, and attribution are retained; user-reported issues enter an admin review queue.
- The assistant searches reviewed knowledge before limited, read-only web research. Research results remain separate from the trusted collection until reviewed.

## Capabilities and Constraints

- Free discovery includes recipe browsing, name and alias search, regional and province exploration, ingredient matching, structured filters, favorites, shopping lists, offline downloads, sources, and content reports.
- The cooking view supports ordered steps, ingredient checklists, and keep-awake behaviour while active.
- The assistant can interpret place, taste, ingredients, difficulty, time, and exclusions; recommend up to three supported matches; preserve relevant follow-up constraints; and return citations and approved photos where available.
- Strict ingredient exclusions are checked against full ingredient lists and known compound ingredients. The product must not guarantee allergen safety when composition or cross-contact is unknown, or provide medical diet advice.
- Never fabricate quantities, photos, source URLs, provenance, regional origins, or citations. Missing and uncertain facts are labelled rather than guessed.
- Assistant usage is accounted for server-side and idempotently. Browsing, local favorites, saved recipes, and prior conversations remain available when AI access ends.
- Version one excludes restaurant listings, ordering or delivery, nutrition advice, social features, automatic translation, voice interaction, cloud sync, iOS launch, and unlimited paid AI usage.
- Product name is undecided.
- Trial policy, paid allowance, price, billing provider, and the final commitment to Android-first launch remain open or proposed decisions.

## Evidence on Hand

- [PRD.md](PRD.md): version-one product requirements, feature scope, acceptance criteria, quality goals, and explicitly proposed/open decisions.
- [ARCHITECTURE.md](ARCHITECTURE.md): selected pilot architecture and implementation boundaries.
- [BACKLOG.md](BACKLOG.md): phased implementation backlog and delivery criteria.
- No final product name, brand assets, visual reference, approved recipe imagery, testimonials, customer claims, or launch performance results are on hand. These must not be fabricated.

## Product Principles

1. Make the free path to discover and cook published recipes genuinely useful.
2. Treat source support and uncertainty as part of the product, especially for regional and origin claims.
3. Preserve practical cooking context: actionable steps, adjustable quantities, offline access, and clear constraints.
4. Keep AI research bounded, transparent, and separate from reviewed knowledge.
5. Protect users from misleading access, dietary, and billing outcomes through explicit states and server-authoritative accounting.

## Accessibility & Inclusion

Provide readable text, accessible labels, scalable fonts, adequate contrast, and large controls for cooking. Design loading, empty, unavailable-image, offline, expired-access, and research-failure states; do not imply that a subscription is needed to open a published recipe.
