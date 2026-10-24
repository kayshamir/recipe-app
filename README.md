# recipe-app

Monorepo for the Philippine food discovery project. Uses Node 24 and npm 11.16.0
workspaces; Kotlin services use Gradle separately.

```text
apps/
  mobile/                 React Native Expo app
  api/                    Kotlin Ktor service (planned, SETUP-02)
  admin/                  Admin web app (future)
packages/
  api-contract/           Shared OpenAPI contract (planned)
package.json              Workspace commands and shared formatting dependency
package-lock.json         Single JavaScript dependency lockfile
.prettierrc.json           Shared formatting rules
.gitignore                Shared ignore rules
```

From the repository root:

```powershell
npm ci
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run mobile -- --go
```

On the current Windows development machine, use `npm run mobile:lan` for Expo Go
on port 8082; port 8081 has an existing Windows forwarding conflict. See the
[iPhone connection troubleshooting notes](apps/mobile/README.md#iphone-timeout-on-the-development-network).

Run `npm run lint`, `npm run typecheck`, and `npm test` from the root to check
all workspaces that provide those scripts. Root commands currently check the
mobile app; API and admin folders are documented placeholders.

Run Expo/EAS commands inside `apps/mobile`. The app keeps its own `package.json`,
`app.json`, `eas.json`, `tsconfig.json`, Jest/ESLint configuration, environment
template, assets, and `src/app` routes. Shared configuration lives at the root.
No pnpm configuration is needed while using npm workspaces.

- [Product requirements](PRD.md)
- [Project backlog](BACKLOG.md)
- [Mobile setup and local run instructions](apps/mobile/README.md)
- [SETUP-01 implementation and remaining acceptance checks](apps/mobile/SETUP-01.md)
