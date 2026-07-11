import 'react-native-url-polyfill/auto';

import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getSupabaseConfig } from '@/src/config/supabase';
import { secureSessionStorage } from '@/src/lib/secureStorage';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.ok) return { ok: false as const, message: config.message };
  client ??= createClient(config.value.url, config.value.anonKey, {
    auth: {
      ...(Platform.OS === 'web' ? {} : { storage: secureSessionStorage }),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      lock: processLock,
    },
  });
  return { ok: true as const, value: client };
}
