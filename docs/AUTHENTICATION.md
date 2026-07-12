# AxionRide Authentication

## Current Boundary

Supabase provides email/password identity and session management only. SQLite remains the runtime source of truth for motorcycles, maintenance, rides, ride points, search, statistics, and backups. No custom Supabase tables or cloud synchronization are part of authentication.

Authentication order:

1. Initialize SQLite and restore the persisted onboarding flag.
2. Restore the Supabase session from secure local storage.
3. Signed-out first-time users complete onboarding, then sign in or register.
4. Map the authenticated Supabase user ID to exactly one isolated local workspace.
5. If anonymous data is available, require an explicit Attach Existing Data or Start Fresh decision.
6. Only then allow access to the main tabs.

On logout, AxionRide activates an unlinked anonymous workspace. It does not delete or upload any workspace.

## Local Environment

Copy `.env.example` to the ignored `.env` file and replace both placeholders:

```powershell
Copy-Item .env.example .env
notepad .env
```

Required names:

```text
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Find both in the Supabase Dashboard project Connect dialog or Project Settings > API. Use the Project URL and publishable key. A legacy anon key is also supported. Never use a service-role or secret key in the app.

## Supabase Dashboard

In Authentication > URL Configuration > Redirect URLs, allow:

```text
axionride://login
axionride://reset-password
```

The first handles email confirmation. The second opens the in-app password-update screen after a recovery email. Keep the existing `axionride` scheme in `app.json`.

Enable the Email provider in Authentication > Providers. Decide whether Confirm email is required. If enabled, registration shows a check-email result and does not claim a workspace until the confirmed session returns to the app.

Set **Email OTP expiration** to `300` seconds in Authentication > Sign In / Providers > Auth Providers > Email. Supabase applies this server-side lifetime to password recovery links as well as other email links. The app also limits a verified recovery session to five minutes and signs it out when that timer expires. Keep the password-reset resend interval at `60` seconds or longer; the UI uses a 60-second cooldown to match Supabase's default per-user recovery-request limit.

No public `profiles` table and no custom `users` table are required. Supabase owns `auth.users`; the submitted display name is stored in Auth user metadata as `display_name`.

## EAS Environments

The EAS profiles explicitly select `development`, `preview`, and `production`. Create both public client variables in each environment, substituting dashboard values:

```powershell
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_PROJECT_URL" --environment development --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY" --environment development --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_PROJECT_URL" --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY" --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_PROJECT_URL" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY" --environment production --visibility plaintext
```

`EXPO_PUBLIC_*` values are bundled into the client and are not server secrets. Supabase security must rely on Auth and future row-level-security policies, never on hiding this public client key. EAS Update commands must use the matching environment so the correct public values are embedded in OTA bundles.

## Recovery and Session Security

Native sessions use a chunked Expo SecureStore adapter. Chunking avoids depending on one oversized SecureStore value and failed writes are cleaned up. Web uses browser local storage. The app never logs credentials, tokens, or session objects.

Supabase token auto-refresh runs only while the native app is active. Auth and deep-link listeners are removed when the provider unmounts. Recovery uses PKCE where supported and exchanges the returned code inside the app.
