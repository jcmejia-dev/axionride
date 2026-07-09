/**
 * Entity type returned by universal local search.
 */
export type SearchResultType = 'motorcycle' | 'maintenance' | 'ride';

/**
 * Input accepted by the local search service.
 */
export type SearchInput = {
  readonly query: string;
  readonly limit?: number;
};

/**
 * Normalized search result used by UI surfaces.
 */
export type SearchResult = {
  readonly id: string;
  readonly type: SearchResultType;
  readonly title: string;
  readonly subtitle: string;
  readonly metadata?: string;
  readonly relevance: number;
};

/**
 * Search response with normalized query and ordered results.
 */
export type SearchResponse = {
  readonly query: string;
  readonly results: readonly SearchResult[];
};
