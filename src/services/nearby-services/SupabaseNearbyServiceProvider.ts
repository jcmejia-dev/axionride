import type { SupabaseClient } from '@supabase/supabase-js';

import type { NearbyPlace, NearbySearchRequest, NearbySearchResult, NearbyServiceProvider } from './NearbyServiceTypes';

export class SupabaseNearbyServiceProvider implements NearbyServiceProvider {
  constructor(private readonly client: SupabaseClient) {}

  async search(request: NearbySearchRequest): Promise<NearbySearchResult> {
    const { data, error } = await this.client.auth.getSession();
    const session = data.session;
    if (error || !session) {
      return failure('auth_required', 'Sign in to search for nearby services.');
    }

    try {
      const result = await this.client.functions.invoke('nearby-services', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (result.error) return await mapFunctionError(result.error);
      if (!isNearbyResponse(result.data)) {
        return failure('invalid_response', 'No usable nearby results were returned. Try Google Maps instead.');
      }
      return { ok: true, places: result.data.places };
    } catch {
      return failure('network_error', 'Nearby services could not be reached. Check your connection and try again.');
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
    && typeof place.distanceMeters === 'number'
    && (place.hoursStatus === 'available' || place.hoursStatus === 'unknown'));
}

async function mapFunctionError(error: { readonly message: string; readonly context?: unknown }): Promise<NearbySearchResult> {
  const status = getResponseStatus(error.context);
  const backendCode = await getBackendErrorCode(error.context);

  if (status === 401 || status === 403) return failure('auth_required', 'Your session expired. Sign in again to search nearby services.');
  if (status === 429) return failure('rate_limited', 'Too many nearby searches. Wait a minute and try again.');
  if (status === 400) return failure('invalid_request', 'The nearby search request was rejected.');
  if (status === 504 || backendCode === 'timeout') return failure('timeout', 'The nearby search timed out. Try again or search in Google Maps.');
  if (/network|fetch/i.test(error.message)) return failure('network_error', 'Nearby services could not be reached. Check your connection and try again.');
  return failure('provider_unavailable', 'The nearby provider is temporarily unavailable. Search in Google Maps instead.');
}

function getResponseStatus(context: unknown) {
  if (context instanceof Response) return context.status;
  return isRecord(context) && typeof context.status === 'number' ? context.status : null;
}

async function getBackendErrorCode(context: unknown) {
  if (!(context instanceof Response)) return null;

  try {
    const body: unknown = await context.clone().json();
    return isRecord(body) && typeof body.error === 'string'
      ? body.error
      : isRecord(body) && typeof body.code === 'string'
        ? body.code
        : null;
  } catch {
    return null;
  }
}

function failure(code: Exclude<NearbySearchResult, { ok: true }>['code'], message: string): NearbySearchResult {
  return { ok: false, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
