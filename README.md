# recipe-app

Monorepo for the Philippine food discovery project. Uses Node 24 and npm 11.16.0
workspaces; Kotlin services use Gradle separately.

---

## Interactive dev guide

Not sure where to start? Run the guided CLI from the repository root — it opens
with the **guided mobile launch wizard**, and still covers every other
workspace, prerequisite checks, and the right commands for each stack:

```powershell
npm ci
npm run start
```

The mobile wizard walks you through four steps: environment check → how the
phone is connected (same Wi-Fi / phone hotspot / tunnel / Android emulator) →
pre-flight checks (Expo login, adb, detected LAN IPs, port availability) →
launch. The menu also reaches the backend API, Docker infrastructure, API
contract type generation, project checks, and environment-file setup.

---

## Repository layout

```text
apps/
  mobile/                 React Native · Expo SDK 58 · TypeScript   [SETUP-01]
  api/                    Kotlin · Ktor · Gradle                     [SETUP-02]
  admin/                  Admin web UI (Next.js or Ktor routes)     [Phase 1]
packages/
  api-contract/           OpenAPI spec · generated TypeScript types [SETUP-02]
infra/
  docker-compose.yml      Postgres+pgvector · Ollama · SearXNG      [SETUP-03]
scripts/
  dev.mjs                 Interactive dev guide (npm run start)
  allow-expo-lan.ps1      Windows firewall rule for Metro port 8082
```

---

## Quick start

From the repository root:

```powershell
npm ci
npm run start
```

The wizard creates `.env` if it is missing, handles the Expo sign-in that tunnel
mode needs, and launches the dev server. Prefer raw commands: `npm run mobile:lan`
(port 8082) or `npm run mobile:tunnel` (port 8083). On this machine port 8081 has
an existing forwarding conflict, which is why LAN uses 8082. See
[apps/mobile/README.md](apps/mobile/README.md#troubleshooting).

---

## Root npm scripts

| Script                  | What it does                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run start`         | Interactive guide — mobile-first wizard                           |
| `npm run mobile`        | Start Expo dev server (default LAN)                               |
| `npm run mobile:lan`    | Expo LAN on port 8082                                             |
| `npm run mobile:tunnel` | Expo tunnel on port 8083 (requires `npx expo login --no-browser`) |
| `npm run android`       | Launch on connected Android emulator                              |
| `npm run lint`          | ESLint all workspaces                                             |
| `npm run typecheck`     | TypeScript check all workspaces                                   |
| `npm test`              | Jest all workspaces                                               |
| `npm run format`        | Prettier write                                                    |
| `npm run format:check`  | Prettier check                                                    |

---

## Documentation

- [Product requirements](PRD.md)
- [System architecture](ARCHITECTURE.md)
- [Design system](DESIGN_SYSTEM.md)
- [Backlog](BACKLOG.md)
- [Mobile app README](apps/mobile/README.md)
- [SETUP-01 handover](apps/mobile/SETUP-01.md)
