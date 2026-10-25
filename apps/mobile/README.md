# Recipe App mobile

SETUP-01: React Native + Expo SDK 58 + TypeScript, Android first.
The product name and application identifiers are provisional. Feature screens are
placeholders; this ticket does not implement the Ktor API or product features.

## Run locally (Windows PowerShell)

Use Node 24 and npm 11.16.0. From the repository root:

```powershell
npm ci
npm run start
```

That is the whole setup. The guided wizard checks Node, the Expo CLI and `.env`
(creating `.env` from `.env.example` if missing), asks how your phone is
connected, signs you in to Expo only when the answer requires it, then starts
Metro and prints a QR code. Scan it with the phone camera, open in Expo Go.
Ta-da.

> `npm ci` may fail with `EBUSY` if Metro is still running. Stop the Metro
> terminal first, then retry.

### What each connection choice means

| Wizard choice           | Under the hood                | Notes                                                       |
| ----------------------- | ----------------------------- | ----------------------------------------------------------- |
| 🌐 Tunnel (recommended) | port 8083, `exp://exp.host/…` | phone needs internet only; one-time Expo sign-in            |
| 📶 Same Wi-Fi           | port 8082                     | firewall rule already applied on this machine               |
| 🔥 Phone's own hotspot  | port 8082                     | wizard shows the laptop's hotspot IP; profile may be Public |
| 🤖 Android emulator     | `npm run android`, port 8081  | start an AVD in Android Studio first                        |

### Raw commands (wizard optional)

All from the repository root; each one ultimately calls `expo start`.

| Command                 | What it does             | When to use                                                          |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- |
| `npm run mobile`        | LAN on default port 8081 | Default; phone and laptop on same Wi-Fi                              |
| `npm run mobile:lan`    | LAN on port 8082         | Port 8081 is blocked or forwarded; firewall rules already applied    |
| `npm run mobile:tunnel` | Tunnel on port 8083      | Phone on a different network, blocked LAN, or any cross-network case |

Inside `apps/mobile` the equivalents are `npx expo start --go`,
`npx expo start --go --port 8082`, and `npx expo start --go --tunnel --port 8083`.
`npx expo start` defaults to Expo Go; press `a` for a running Android emulator.
The emulator needs Android Studio with its SDK/platform tools and a started AVD;
check `adb devices` if Expo cannot find it. No custom development client is
installed and Expo Go must support SDK 58.
`npm run web` is a convenience preview; native SQLite, SecureStore and offline
behavior must be validated on Android.

## Troubleshooting

### Phone cannot reach Metro over LAN

Windows may classify a phone hotspot as a **Public** network profile, while
`scripts/allow-expo-lan.ps1` only targets **Private**. From an Administrator
PowerShell at the repository root:

```powershell
# allow Node on TCP 8082 for Public networks too
New-NetFirewallRule -DisplayName "Metro 8082 (Public)" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8082 `
  -Program (Get-Command node).Source -Profile Public
```

To confirm reachability, open `http://<laptop-ip>:8082/status` in the phone's
browser — a running Metro answers `packager-status:running`. On this machine port
8081 also has an IPv4 forwarding rule aimed at an internal address, so Metro can
answer on localhost while the phone times out; that is why LAN uses 8082. If it
still fails, compare the phone's Wi-Fi IP/subnet/router, check the app's Local
Network permission, and look for router guest/client isolation or a VPN. Do not
disable the firewall or delete unrelated forwarding rules.

### Tunnel will not start: Expo session

SDK 58 requires an Expo login for the built-in tunnel provider. The wizard signs
you in when you pick tunnel. By hand, from `apps/mobile`:

```powershell
npx expo login --no-browser   # password typed in the terminal
npx expo whoami               # should print your username
```

Avoid plain `npx expo login`: its default browser flow runs
`cmd /c start "" <url>`, and because the sign-in URL contains `&` but no spaces,
Node leaves it unquoted, `cmd.exe` splits it at every `&`, and the command exits
`1` — killing the login. If you want the browser route (Google SSO), set
`BROWSER=none` and pass `--browser` so Expo prints the link and waits for the
callback instead of launching the browser itself:

```powershell
$env:BROWSER = 'none'
npx expo login --browser      # prints "visit this link…", waits for the callback
Remove-Item Env:BROWSER
```

Then `npm run mobile:tunnel` from the repository root. Scan that session's QR —
the old `192.168…` URL is still the blocked LAN path. No ngrok package is required
for this provider; both devices need internet. iPhone rendering remains unverified
until the phone successfully loads the project.

## API environment

`EXPO_PUBLIC_API_URL` is bundled public configuration. Never put database passwords,
provider keys, signing secrets, or other private values in mobile environment files.

- Android emulator: `http://10.0.2.2:8080` reaches a backend on the host PC.
- Physical phone: use the computer's LAN address, for example `http://192.168.1.20:8080`.
- Android USB option: `adb reverse tcp:8080 tcp:8080`, then use `http://127.0.0.1:8080`.
- Production: use HTTPS. Local HTTP is for development clients only.

Restart Metro after changing the environment. With no API URL, the shell still
starts and API requests fail explicitly. There is no live API connectivity claim:
SETUP-02 must supply a reachable backend and an agreed endpoint contract first.

## Project structure

```text
src/app/          Expo Router routes and layouts only
src/components/   Shared accessible UI primitives and image handling
src/constants/    Design tokens
src/features/     Auth, storage, favorites, shopping, downloads, cooking foundations
src/lib/          API, configuration, query lifecycle, source links
src/types/        Provisional shared models (replace DTOs with generated OpenAPI types)
```

Public discovery remains available to guests. SecureStore restores a token on
native; protected account routes depend on session presence. Actual email
verification, token validation/refresh, and server authorization are future work.
No working sign-in is simulated. The browser keeps session material in memory only.

## Checks

```powershell
npm run typecheck
npm run lint
npm run test:ci
npm run format:check
npx expo-doctor
npx expo export --platform android
```

Commit the repository-root `package-lock.json`; run `npm ci` from the repository
root on clean checkouts. Do not create an app-local lockfile. Use `npx expo install`
for new dependencies to select SDK-compatible versions. Ignore local `.env`,
`.expo`, generated `android`/`ios`, build outputs, and credentials.

The repository root owns npm workspace configuration, Node/package-manager versions,
Prettier configuration, and Git ignore rules. Expo, TypeScript, Jest, and ESLint
configuration stays here because it applies specifically to the mobile app.

## Android development build and EAS

1. When ready to use custom development builds, first run `npx expo install expo-dev-client`.
   This changes the default launch target; use `--go` to explicitly select Expo Go afterward.
2. Sign in with the team's account: `npx eas-cli@latest login`.
3. Link this mobile app to the team's project: `npx eas-cli@latest init`.
4. Set public API URLs in EAS environments `development`, `preview`, `production`.
5. Build: `npx eas-cli@latest build --platform android --profile development`.
6. Install the returned APK, then run `npx expo start --dev-client`.

`eas.json` supplies development-client, preview APK, and production profiles.
Account/project linking, signing, and cloud build execution require the team's
Expo account and are still pending. Review `com.recipeapp.mobile`, `recipeapp`,
and `recipe-app` before linking or publishing. Native projects are generated by
Expo; do not maintain them by hand. No extra runtime permissions are requested.

To inspect a route in a development build:
`adb shell am start -a android.intent.action.VIEW -d "recipeapp://recipe/example"`.
Expo Go uses its `exp://` development URL instead of the custom scheme.

## Handover

See [SETUP-01.md](SETUP-01.md) for implemented foundations, offline design, and
remaining acceptance checks. Run through those checks on a physical Android phone
before closing SETUP-01. iOS configuration is preserved; iOS launch is outside V1.
Poppins and Solar are third-party assets; retain their bundled license notices
(Solar icons: 480 Design, CC BY 4.0; wrapper: MIT). Expo artwork is temporary.
