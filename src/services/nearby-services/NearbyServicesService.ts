import { getSupabaseClient } from '@/src/lib/supabase';

import { SupabaseNearbyServiceProvider } from './SupabaseNearbyServiceProvider';
import type { NearbySearchRequest, NearbySearchResult, NearbyServiceProvider } from './NearbyServiceTypes';

export class NearbyServicesService {
  constructor(private readonly provider: NearbyServiceProvider | null = createDefaultProvider()) {}

  async search(request: NearbySearchRequest): Promise<NearbySearchResult> {
    if (!isValidRequest(request)) {
      return { ok: false, code: 'invalid_request', message: 'Choose a valid category and location.' };
    }
    if (!this.provider) {
      return { ok: false, code: 'missing_configuration', message: 'Supabase is not configured for nearby services.' };
    }
    return this.provider.search({ ...request, radiusMeters: request.radiusMeters ?? 5000 });
  }
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
