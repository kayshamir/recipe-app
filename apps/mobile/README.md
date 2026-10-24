# Recipe App mobile

SETUP-01: React Native + Expo SDK 58 + TypeScript, Android first.
The product name and application identifiers are provisional. Feature screens are
placeholders; this ticket does not implement the Ktor API or product features.

## Run locally (Windows PowerShell)

Use Node 24 and npm 11.16.0. From the repository root:

```powershell
npm ci
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run mobile -- --go
```

Run Expo commands below from `apps/mobile` (`cd apps/mobile`).
`npx expo start` defaults to Expo Go. Scan its QR code with the iPhone Camera
and open the link in Expo Go; keep the phone and computer on the same network.
Press `a` for a running Android emulator. No custom development client is installed.
Expo Go must support SDK 58. `npm run web` is a convenience preview; native
SQLite, SecureStore, and offline behavior must be validated on Android.

Install Android Studio, its SDK/platform tools, and an Android Virtual Device;
start the AVD in Device Manager before running the Android command. Check
`adb devices` if Expo cannot find it. A physical Android phone can use a compatible
Expo Go app on the same network. Allow Metro through the Windows firewall if needed.

## iPhone timeout on the development network

From the repository root, run `npm run mobile:lan` to use port 8082.
Inside `apps/mobile`, the equivalent is `npx expo start --go --port 8082`.
Scan the new QR with the iPhone Camera and open it in Expo Go.

On this Windows machine, port 8081 has a separate IPv4 forwarding rule targeting
an internal address; Metro can respond on localhost while the phone times out.
The Wi-Fi network is Private, while the original Node firewall allow rules applied
to Public networks. `scripts/allow-expo-lan.ps1`, run from an Administrator
PowerShell at the repository root, adds a Node-only TCP 8082 rule limited to the
Private profile and local subnet. This rule is now applied on the current machine.
If the phone still cannot connect, compare the phone's Wi-Fi IP/subnet/router,
check app Local Network permission, and check router guest/client isolation or VPN.
Do not disable the firewall or delete unrelated forwarding rules. To diagnose LAN
access, open `http://<computer-LAN-IP>:8082/status` from the phone; a reachable
Metro server responds with `packager-status:running`.

If that status page works on the laptop but times out on the phone, use Expo's
built-in tunnel instead of repeating LAN launches. SDK 58 requires an Expo login
for this tunnel provider. From `apps/mobile`, run `npx expo login` interactively;
then from the repository root run `npm run mobile:tunnel`. It starts Expo Go on
port 8083 with a tunnel URL. Scan that session's new QR; the old `192.168...` URL
still uses the blocked LAN path. No ngrok package is required for this provider.
The tunnel requires internet access on both devices. iPhone rendering remains
unverified until the phone successfully loads the project.

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
