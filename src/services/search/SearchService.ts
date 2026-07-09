import type { Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import type { Ride } from '@/src/domain/ride';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

import type { SearchInput, SearchResponse, SearchResult } from './SearchServiceTypes';

const DEFAULT_LIMIT = 20;

/**
 * Local universal search service.
 *
 * Searches repositories only. UI callers receive normalized results and never
 * query SQLite, Supabase, or concrete repositories directly.
 */
export class SearchService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }

  async search(input: SearchInput): Promise<ServiceResult<SearchResponse>> {
    const query = normalizeQuery(input.query);
    const limit = normalizeLimit(input.limit);

    if (!query) {
      return this.success({ query, results: [] });
    }

    const [motorcycles, maintenanceRecords, rides] = await Promise.all([
      this.context.repositories.motorcycles.getAllMotorcycles(),
      this.context.repositories.maintenance.getAllMaintenance(),
      this.context.repositories.rides.getAllRides(),
    ]);
    const results = [
      ...motorcycles.map((motorcycle) => searchMotorcycle(motorcycle, query)),
      ...maintenanceRecords.map((maintenance) => searchMaintenance(maintenance, query)),
      ...rides.map((ride) => searchRide(ride, query)),
    ]
      .filter((result): result is SearchResult => result !== null)
      .sort(compareResults)
      .slice(0, limit);

    return this.success({ query, results });
  }
}

function searchMotorcycle(motorcycle: Motorcycle, query: string): SearchResult | null {
  const searchableText = [
    motorcycle.nickname,
    motorcycle.brand,
    motorcycle.model,
    motorcycle.year,
    motorcycle.category,
    motorcycle.fuelType,
    motorcycle.transmission,
    motorcycle.color,
    motorcycle.plateNumber,
    motorcycle.notes,
  ].join(' ');
  const relevance = calculateRelevance(query, searchableText, motorcycle.nickname);

  if (relevance === 0) {
    return null;
  }

  return {
    id: motorcycle.id,
    type: 'motorcycle',
    title: motorcycle.nickname,
    subtitle: `${motorcycle.brand} ${motorcycle.model} • ${motorcycle.year}`,
    metadata: `${formatNumber(motorcycle.odometerKm)} km • ${motorcycle.engineCc}cc`,
    relevance,
  };
}

function searchMaintenance(maintenance: Maintenance, query: string): SearchResult | null {
  const searchableText = [
    maintenance.title,
    maintenance.description,
    maintenance.type,
    maintenance.status,
    maintenance.priority,
    maintenance.notes,
  ].join(' ');
  const relevance = calculateRelevance(query, searchableText, maintenance.title);

  if (relevance === 0) {
    return null;
  }

  return {
    id: maintenance.id,
    type: 'maintenance',
    title: maintenance.title,
    subtitle: `${maintenance.type} • ${maintenance.status}`,
    metadata: formatMaintenanceMetadata(maintenance),
    relevance,
  };
}

function searchRide(ride: Ride, query: string): SearchResult | null {
  const searchableText = [
    ride.title,
    ride.description,
    ride.type,
    ride.status,
    ride.weather?.condition,
    ride.notes,
  ].join(' ');
  const relevance = calculateRelevance(query, searchableText, ride.title);

  if (relevance === 0) {
    return null;
  }

  return {
    id: ride.id,
    type: 'ride',
    title: ride.title,
    subtitle: `${formatNumber(ride.distanceKm)} km • ${formatDuration(ride.durationSeconds)}`,
    metadata: ride.endTime ? formatDate(ride.endTime) : formatDate(ride.startTime),
    relevance,
  };
}

function calculateRelevance(query: string, searchableText: string, title: string) {
  const normalizedSearchableText = searchableText.toLowerCase();
  const normalizedTitle = title.toLowerCase();
  const terms = query.split(' ').filter(Boolean);

  if (terms.length === 0) {
    return 0;
  }

  return terms.reduce((score, term) => {
    if (normalizedTitle === term) {
      return score + 120;
    }

    if (normalizedTitle.startsWith(term)) {
      return score + 80;
    }

    if (normalizedTitle.includes(term)) {
      return score + 60;
    }

    if (normalizedSearchableText.includes(term)) {
      return score + 30;
    }

    return score;
  }, 0);
}

function compareResults(first: SearchResult, second: SearchResult) {
  if (first.relevance !== second.relevance) {
    return second.relevance - first.relevance;
  }

  return first.title.localeCompare(second.title);
}

function formatMaintenanceMetadata(maintenance: Maintenance) {
  if (maintenance.nextDueOdometerKm !== undefined) {
    return `Due at ${formatNumber(maintenance.nextDueOdometerKm)} km`;
  }

  if (maintenance.nextDueDate) {
    return `Due ${formatDate(maintenance.nextDueDate)}`;
  }

  return maintenance.priority;
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || limit === undefined || limit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, 50);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
