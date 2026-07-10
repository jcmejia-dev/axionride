# Development Build

AxionRide uses Expo SDK 57 with EAS Build for Android development builds. A development build is required for native modules that are unavailable or limited in Expo Go, including local notification testing.

## Prerequisites

- Expo account access.
- EAS CLI available through `npx eas-cli`.
- Android device or emulator for installation.
- Project dependencies installed.

## Login And Configure

```powershell
npx eas-cli login
npx eas-cli build:configure
```

The project already includes `eas.json`; `build:configure` should only be needed when linking the project to an Expo account or EAS project for the first time.

## Create An Android Development Build

```powershell
npx eas-cli build --platform android --profile development
```

The `development` profile creates an internal Android APK with `developmentClient: true`.

## Install The APK

After the EAS build completes, install it from the EAS CLI prompt, Expo dashboard, Expo Orbit, or manually with Android platform tools:

```powershell
adb install path\to\axionride.apk
```

## Start Metro For The Development Client

```powershell
npx expo start --dev-client
```

Open the installed AxionRide development build and connect it to the Metro server.

## When To Rebuild

Rebuild the development client after native dependency changes, config plugin changes, permission/config changes in `app.json`, or EAS profile changes that affect the native binary.

Normal JavaScript and TypeScript changes do not require rebuilding the native app. Restart Metro or reload the development client instead.

## Expo Go Vs Development Build

Expo Go is useful for JavaScript-only Expo APIs, but it cannot include AxionRide's exact native dependency set. The development build is AxionRide's own native client and supports installed native modules and app configuration.

## Local Notification Testing

Local notifications should be tested in the development build, not Expo Go:

```powershell
npx expo start --dev-client
```

Then open Profile > Settings > Notifications and use the test notification action. Android notification permission and channel behavior must be verified on the installed development build.
