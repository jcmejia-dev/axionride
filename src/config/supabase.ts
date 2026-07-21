import Constants from "expo-constants";

export type SupabasePublicConfig = { readonly url: string; readonly anonKey: string };
export type SupabaseConfigResult = { readonly ok: true; readonly value: SupabasePublicConfig } | { readonly ok: false; readonly message: string };

export function getSupabaseConfig(): SupabaseConfigResult {
  const runtimeConfig = readRuntimeSupabaseConfig(Constants.expoConfig?.extra);
  return validateSupabaseConfig(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? runtimeConfig.url,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? runtimeConfig.publishableKey,
  );
}

function readRuntimeSupabaseConfig(extra: Record<string, unknown> | undefined) {
  const value = extra?.supabase;
  if (!value || typeof value !== "object") {
    return { url: undefined, publishableKey: undefined };
  }
  const supabase = value as Record<string, unknown>;
  return {
    url: typeof supabase.url === "string" ? supabase.url : undefined,
    publishableKey:
      typeof supabase.publishableKey === "string"
        ? supabase.publishableKey
        : undefined,
  };
}

export function validateSupabaseConfig(rawUrl: string | undefined, rawAnonKey: string | undefined): SupabaseConfigResult {
  const url = rawUrl?.trim();
  const anonKey = rawAnonKey?.trim();
  if (!url || !anonKey || url.startsWith('YOUR_') || anonKey.startsWith('YOUR_')) {
    return { ok: false, message: 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the app environment.' };
  }
  try { new URL(url); } catch { return { ok: false, message: 'EXPO_PUBLIC_SUPABASE_URL is not a valid URL.' }; }
  return { ok: true, value: { url, anonKey } };
}
