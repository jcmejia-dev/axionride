import { getSupabaseClient } from '@/src/lib/supabase';

import { SupabaseNearbyServiceProvider } from './SupabaseNearbyServiceProvider';
import type { NearbySearchRequest, NearbySearchResult, NearbyServiceProvider } from './NearbyServiceTypes';

const SEARCH_CACHE_TTL_MS = 30_000;
const searchCache = new Map<string, { readonly cachedAt: number; readonly result: NearbySearchResult }>();

export class NearbyServicesService {
  constructor(private readonly provider: NearbyServiceProvider | null = createDefaultProvider()) {}

  async search(request: NearbySearchRequest): Promise<NearbySearchResult> {
    if (!isValidRequest(request)) {
      return { ok: false, code: 'invalid_request', message: 'Choose a valid category and location.' };
    }
    if (!this.provider) {
      return { ok: false, code: 'missing_configuration', message: 'Supabase is not configured for nearby services.' };
    }
    const normalizedRequest = { ...request, radiusMeters: request.radiusMeters ?? 5000 };
    const cacheKey = createCacheKey(normalizedRequest);
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < SEARCH_CACHE_TTL_MS) return cached.result;

    const result = await this.provider.search(normalizedRequest);
    if (result.ok) searchCache.set(cacheKey, { cachedAt: Date.now(), result });
    return result;
  }
}

function createCacheKey(request: NearbySearchRequest) {
  return [
    request.category,
    request.radiusMeters ?? 5000,
    request.latitude.toFixed(4),
    request.longitude.toFixed(4),
  ].join(':');
}

export function isValidRequest(request: NearbySearchRequest) {
  return Number.isFinite(request.latitude)
    && request.latitude >= -90
    && request.latitude <= 90
    && Number.isFinite(request.longitude)
    && request.longitude >= -180
    && request.longitude <= 180
    && (!request.radiusMeters || (request.radiusMeters >= 250 && request.radiusMeters <= 10000));
}

function createDefaultProvider() {
  const result = getSupabaseClient();
  return result.ok ? new SupabaseNearbyServiceProvider(result.value) : null;
}
