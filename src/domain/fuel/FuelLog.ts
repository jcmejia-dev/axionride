/**
 * Fuel log domain type for AxionRide.
 *
 * Records refueling events with price, volume, odometer, and fill-type data.
 */

export type FuelLogId = string;

export type FillType = "full_tank" | "partial_refill";

/**
 * Canonical FuelLog domain model.
 */
export type FuelLog = {
  readonly id: FuelLogId;
  readonly motorcycleId: string;
  readonly recordedAt: string; // ISO-8601
  readonly odometerKm: number;
  readonly pricePerLiter: number; // in PHP
  readonly liters: number;
  readonly totalCost: number; // pricePerLiter * liters
  readonly fillType: FillType;
  readonly stationName?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly notes?: string;
  readonly createdAt: string; // ISO-8601
  readonly updatedAt: string; // ISO-8601
  readonly deletedAt?: string | null; // ISO-8601, soft deletion
};

/**
 * Fuel economy calculation result.
 */
export type FuelEconomyResult = {
  readonly kmPerLiter: number;
  readonly costPerKm: number;
  readonly distanceSinceLastLog: number;
  readonly previousLogOdometer: number | null;
};

/**
 * Fuel summary for display.
 */
export type FuelSummary = {
  readonly totalSpent: number;
  readonly totalLiters: number;
  readonly averageKmPerLiter: number | null;
  readonly averageCostPerKm: number | null;
  readonly monthlySpent: number;
  readonly estimatedFuelRemaining: number | null; // in liters
  readonly lastRefill: FuelLog | null;
  readonly fuelLogs: readonly FuelLog[];
};

/**
 * Fuel tank capacity stored on the motorcycle domain type.
 * Extended via optional field: fuelTankCapacityLiters
 */
export type MotorcycleFuelInfo = {
  readonly fuelTankCapacityLiters?: number;
  readonly estimatedFuelRemaining?: number; // manual override
  readonly estimatedFuelUpdatedAt?: string;
};

/**
 * Input for creating a fuel log.
 */
export type CreateFuelLogInput = {
  readonly motorcycleId: string;
  readonly recordedAt: string;
  readonly odometerKm: number;
  readonly pricePerLiter?: number;
  readonly liters?: number;
  readonly totalCost?: number;
  readonly fillType: FillType;
  readonly stationName?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly notes?: string;
};

/**
 * Input for updating a fuel log.
 */
export type UpdateFuelLogInput = Partial<
  Omit<CreateFuelLogInput, "motorcycleId">
> & {
  readonly id: FuelLogId;
};
