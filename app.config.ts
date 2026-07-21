import type { ConfigContext, ExpoConfig } from "expo/config";

type SupabaseExtra = {
  readonly url?: string;
  readonly publishableKey?: string;
};

/**
 * Expo evaluates this file in Node before bundling the app. The bridge keeps
 * older local NEXT_PUBLIC names working without exposing or rewriting the
 * ignored .env file. New environments should use the EXPO_PUBLIC names from
 * .env.example.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const supabase: SupabaseExtra = {
    url:
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  return {
    ...config,
    name: config.name ?? "AxionRide",
    slug: config.slug ?? "axionride",
    extra: {
      ...config.extra,
      supabase,
    },
  };
};
