# SETUP-01 handover

Scope: the React Native + Expo + TypeScript mobile foundation only. No Ktor service,
PostgreSQL provisioning, working authentication, recipe browsing, or AI implementation.
The parent ticket stays open until the manual acceptance items below have evidence.

## Implemented foundations

- Existing Expo SDK 58 starter retained in `apps/mobile`; root npm workspace and
  lockfile, Node 24, TypeScript strict mode, `@/` aliases.
- Working navigation shell with Discover, Saved, Shopping, Assistant, Profile tabs;
  nested recipe and account routes, public discovery, session-gated account routes,
  loading, root error boundary, and not-found handling. Session presence is only a
  navigation convenience; verification and authorization belong to the backend.
- Feature folders for auth, favorites, shopping, storage, downloads, and cooking.
- Public API environment template, Axios public/authenticated clients, timeout,
  safe error messages, TanStack Query lifecycle and connectivity integration.
- SecureStore session persistence on native; browser preview keeps tokens in memory.
  Sign-in is a placeholder; no mock credentials or pretend successful sessions.
- SQLite v1 transactional migration and parameterized favorites/shopping repositories.
- FileSystem helpers to save/read/delete recipe JSON, including saved version/date.
- Keep-awake hook for a future focused cooking screen; HTTPS source-link helper;
  cached image component and neutral missing-image state.
- Central theme tokens, Poppins, Solar Bold icons, safe areas, status bar,
  keyboard-aware scroll layout, accessible buttons/inputs/cards/loading indicator.
- ESLint, Prettier, Jest, component/utility examples, and EAS build profiles.

## Remaining acceptance evidence

- Android launch on emulator and physical device; test all tabs, Back, deep links,
  large text, keyboard, background/foreground, offline launch and reconnection.
- SQLite persistence and file read/delete across actual device restarts.
- Configure team Expo account/EAS project and development/preview/production API
  URLs; create and install an Android development build. EAS configuration is
  committed but account linking, signing, and cloud builds are not done.
- Test a real device request to the Ktor API once SETUP-02 exists. Endpoint DTOs
  and token refresh/expiry/verification behavior need the agreed API contract.
- Commit reviewed starter files and share the README. No commit is created automatically.

## Offline design for follow-up tickets

Favorites store references, not complete offline recipes. Downloads use an independent
JSON snapshot with content version and timestamp. Store only permitted content/images;
image cache is evictable and is not a reliable download. A download repository should
coordinate SQLite metadata and files with staged writes and cleanup recovery in BL-022.
Compare saved and current versions after reconnect; never silently replace a saved
recipe. Explicit deletion must remove metadata, recipe JSON, and permitted image files.
Do not merge shopping quantities unless ingredient and unit compatibility is established.

## Accessibility and UI conventions

Use shared tokens and components; allow text scaling, use 48 dp touch targets,
label all icon-only controls, and convey state through text as well as color.
Keep free discovery available to guests. Light theme follows DESIGN_SYSTEM.md;
dark theme and tablet navigation are not validated by this starter.

App name `Recipe App`, slug `recipe-app`, scheme `recipeapp`, and identifier
`com.recipeapp.mobile` are provisional development values; the product name is
undecided in PRODUCT.md. Expo artwork remains placeholder artwork.

## Automated verification

- TypeScript strict typecheck: passed.
- ESLint: passed.
- Jest: 2 suites, 5 tests passed.
- Expo Doctor: 20/20 checks passed.
- SDK dependency compatibility: passed.
- Android production JS/asset export: passed (this is not a native APK build).
- Prettier format check: passed.
- Android runtime attempt: `Medium_Phone` emulator started. Expo Go download
  completed, but Expo launch failed with `Activity class
{host.exp.exponent/host.exp.exponent.experience.HomeActivity} does not exist`.
  App rendering and Android runtime behavior remain unverified; repair the Expo Go
  installation or use a team development build before closing the ticket.
- Dependency audit: 5 high reports remain in Expo CLI's transitive `node-forge`
  and `zod` chains after compatible `npm audit fix`. npm proposes a breaking
  downgrade to Expo 44; that was not applied. Review upstream fixes before release.
