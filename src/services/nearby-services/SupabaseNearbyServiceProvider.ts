import type { SupabaseClient } from '@supabase/supabase-js';

import type { NearbyPlace, NearbySearchRequest, NearbySearchResult, NearbyServiceProvider } from './NearbyServiceTypes';

export class SupabaseNearbyServiceProvider implements NearbyServiceProvider {
  constructor(private readonly client: SupabaseClient) {}

  async search(request: NearbySearchRequest): Promise<NearbySearchResult> {
    const sessionResult = await this.client.auth.getSession();
    if (sessionResult.error || !sessionResult.data.session) {
      return failure('authentication_required', 'Sign in to search for nearby services.');
    }

    try {
      const result = await this.client.functions.invoke('nearby-services', { body: request });
      if (result.error) return mapFunctionError(result.error);
      if (!isNearbyResponse(result.data)) return failure('invalid_response', 'The nearby service returned an invalid response.');
      return { ok: true, places: result.data.places };
    } catch {
      return failure('network_unavailable', 'Nearby services could not be reached. Check your connection and try again.');
    }
  }
}

function isNearbyResponse(value: unknown): value is { readonly places: readonly NearbyPlace[] } {
  if (!isRecord(value) || !Array.isArray(value.places)) return false;
  return value.places.every((place) => isRecord(place)
    && typeof place.id === 'string'
    && typeof place.name === 'string'
    && typeof place.address === 'string'
    && isRecord(place.location)
    && typeof place.location.latitude === 'number'
    && typeof place.location.longitude === 'number'
    && typeof place.distanceMeters === 'number');
}

function mapFunctionError(error: { readonly message: string; readonly context?: unknown }): NearbySearchResult {
  const status = isRecord(error.context) && typeof error.context.status === 'number' ? error.context.status : null;
  if (status === 401) return failure('authentication_required', 'Your session expired. Sign in again to search nearby services.');
  if (status === 429) return failure('rate_limited', 'Too many nearby searches. Wait a minute and try again.');
  if (status === 400) return failure('invalid_request', 'The nearby search request was rejected.');
  if (/network|fetch/i.test(error.message)) return failure('network_unavailable', 'Nearby services could not be reached. Check your connection and try again.');
  return failure('provider_unavailable', 'The nearby provider is temporarily unavailable.');
}

function failure(code: Exclude<NearbySearchResult, { ok: true }>['code'], message: string): NearbySearchResult {
  return { ok: false, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
