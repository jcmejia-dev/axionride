import type { MaintenanceType } from "@/src/domain/maintenance";

export type NearbyServiceCategory =
  | "fuel"
  | "motorcycle_repair"
  | "oil_change"
  | "tires"
  | "battery_electrical"
  | "dealer";

export type NearbyCoordinate = {
  readonly latitude: number;
  readonly longitude: number;
};

export type NearbyPlace = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly location: NearbyCoordinate;
  readonly distanceMeters: number;
  readonly hoursStatus: "available" | "unknown";
  readonly rating: number | null;
  readonly reviewCount: number | null;
  readonly phoneNumber: string | null;
  readonly googleMapsUri: string | null;
};

export type NearbySearchRequest = NearbyCoordinate & {
  readonly category: NearbyServiceCategory;
  readonly radiusMeters?: number;
};

export type NearbySearchErrorCode =
  | "auth_required"
  | "invalid_request"
  | "network_error"
  | "timeout"
  | "provider_unavailable"
  | "rate_limited"
  | "invalid_response"
  | "missing_configuration";

export type NearbySearchResult =
  | { readonly ok: true; readonly places: readonly NearbyPlace[] }
  | {
      readonly ok: false;
      readonly code: NearbySearchErrorCode;
      readonly message: string;
    };

export type NearbyServiceProvider = {
  search(request: NearbySearchRequest): Promise<NearbySearchResult>;
};

export type NearbyCategoryDefinition = {
  readonly id: NearbyServiceCategory;
  readonly label: string;
  readonly shortLabel: string;
  readonly textQuery: string | null;
};

export type MaintenanceRecommendation = {
  readonly category: NearbyServiceCategory;
  readonly label: string;
  readonly reason: "maintenance";
  readonly maintenanceType: MaintenanceType;
};
