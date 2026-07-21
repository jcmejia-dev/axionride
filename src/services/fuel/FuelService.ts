import type {
  FuelLog,
  FuelSummary,
  MotorcycleFuelInfo,
} from "@/src/domain/fuel";
import type { FuelRepository } from "@/src/repositories/fuel";
import type { MotorcycleRepository } from "@/src/repositories/motorcycle";
import type { RideRepository } from "@/src/repositories/ride";
import { RideStatus } from "@/src/domain/ride";
import { BaseService } from "../BaseService";
import type { ServiceContext } from "../ServiceContext";
import type { ServiceResult } from "../ServiceTypes";

export type CreateFuelLogInput = {
  readonly motorcycleId: string;
  readonly recordedAt: string;
  readonly odometerKm: number;
  readonly pricePerLiter?: number;
  readonly liters?: number;
  readonly totalCost?: number;
  readonly fillType: "full_tank" | "partial_refill";
  readonly stationName?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly notes?: string;
};

export type UpdateFuelLogInput = Partial<
  Omit<CreateFuelLogInput, "motorcycleId">
> & {
  readonly id: string;
};

export class FuelService extends BaseService {
  constructor(
    context: ServiceContext,
    private readonly repositories: {
      readonly fuel: FuelRepository;
      readonly motorcycles: MotorcycleRepository;
      readonly rides: RideRepository;
    },
  ) {
    super(context);
  }

  async createFuelLog(
    input: CreateFuelLogInput,
  ): Promise<ServiceResult<FuelLog>> {
    const validation = this.validateFuelLogInput(input);
    if (!validation.valid) {
      return this.failure(validation.error);
    }

    const calculated = this.calculateMissingFields(input);
    const odometerCheck = await this.checkOdometerLogic(
      input.motorcycleId,
      input.odometerKm,
      input.fillType,
    );
    if (!odometerCheck.ok) {
      return this.failure(odometerCheck.error);
    }

    const fuelLog = await this.repositories.fuel.create({
      ...input,
      pricePerLiter: calculated.pricePerLiter,
      liters: calculated.liters,
      totalCost: calculated.totalCost,
    });

    if (input.fillType === "full_tank") {
      await this.setFuelBaselineFromLog(fuelLog);
    }

    return this.success(fuelLog);
  }

  async updateFuelLog(
    input: UpdateFuelLogInput,
  ): Promise<ServiceResult<FuelLog>> {
    if (!input.id) {
      return this.failure({
        code: "validation_failed",
        message: "Fuel log id is required.",
      });
    }

    const existing = await this.repositories.fuel.getById(input.id);
    if (!existing) {
      return this.failure({
        code: "not_found",
        message: "Fuel log not found.",
      });
    }

    const merged = { ...existing, ...input };
    const validation = this.validateFuelLogInput(merged);
    if (!validation.valid) {
      return this.failure(validation.error);
    }

    const calculated = this.calculateMissingFields(merged);
    const updated = await this.repositories.fuel.update({
      ...input,
      pricePerLiter: calculated.pricePerLiter,
      liters: calculated.liters,
      totalCost: calculated.totalCost,
    });

    if (merged.fillType === "full_tank") {
      await this.updateEstimatedFuel(merged.motorcycleId);
    }

    return this.success(updated);
  }

  async deleteFuelLog(id: string): Promise<ServiceResult<void>> {
    const existing = await this.repositories.fuel.getById(id);
    if (!existing) {
      return this.failure({
        code: "not_found",
        message: "Fuel log not found.",
      });
    }

    await this.repositories.fuel.softDelete(id);
    await this.updateEstimatedFuel(existing.motorcycleId);
    return this.success(undefined);
  }

  async getFuelHistory(
    motorcycleId: string,
  ): Promise<ServiceResult<readonly FuelLog[]>> {
    const logs = await this.repositories.fuel.getByMotorcycleId(motorcycleId);
    return this.success(logs);
  }

  async getFuelSummary(
    motorcycleId: string,
  ): Promise<ServiceResult<FuelSummary>> {
    const logs = await this.repositories.fuel.getByMotorcycleId(motorcycleId);
    const lastRefill = logs[0] ?? null;

    const totalSpent = logs.reduce((total, log) => total + log.totalCost, 0);
    const totalLiters = logs.reduce((total, log) => total + log.liters, 0);

    const economy = this.calculateFuelEconomy(logs);
    const monthlySpent = this.calculateMonthlySpending(logs);
    const costPerKm = this.calculateCostPerKm(logs);
    const estimatedFuelRemainingResult =
      await this.getEstimatedFuelRemaining(motorcycleId);
    const estimatedFuelRemaining = estimatedFuelRemainingResult.ok
      ? estimatedFuelRemainingResult.value
      : null;

    return this.success({
      totalSpent,
      totalLiters,
      averageKmPerLiter: economy.kmPerLiter,
      averageCostPerKm: costPerKm,
      monthlySpent,
      estimatedFuelRemaining,
      lastRefill,
      fuelLogs: logs,
    });
  }

  async getEstimatedFuelRemaining(
    motorcycleId: string,
  ): Promise<ServiceResult<number | null>> {
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) {
      return this.failure({
        code: "not_found",
        message: "Motorcycle not found.",
      });
    }

    const fuelInfo = this.readMotorcycleFuelInfo(motorcycle);
    const estimated = await this.estimateFuelFromLogs(motorcycleId);
    return this.success(estimated);
  }

  async correctEstimatedFuel(
    motorcycleId: string,
    liters: number,
  ): Promise<ServiceResult<number | null>> {
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) {
      return this.failure({
        code: "not_found",
        message: "Motorcycle not found.",
      });
    }

    const fuelInfo = this.readMotorcycleFuelInfo(motorcycle);
    const tankCapacity = fuelInfo.fuelTankCapacityLiters;
    if (typeof tankCapacity === "number" && liters > tankCapacity) {
      return this.failure({
        code: "validation_failed",
        message: "Estimated fuel cannot exceed tank capacity.",
      });
    }

    const updated = await this.repositories.motorcycles.updateMotorcycle({
      ...motorcycle,
      estimatedFuelRemaining: liters,
      estimatedFuelUpdatedAt: new Date().toISOString(),
    } as Parameters<MotorcycleRepository["updateMotorcycle"]>[0]);

    if (updated.ok) {
      return this.success(liters);
    }

    return this.failure({
      code: "update_failed",
      message: "Could not update estimated fuel.",
    });
  }

  async resetEstimatedFuel(
    motorcycleId: string,
  ): Promise<ServiceResult<number | null>> {
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) {
      return this.failure({
        code: "not_found",
        message: "Motorcycle not found.",
      });
    }

    const updated = await this.repositories.motorcycles.updateMotorcycle({
      ...motorcycle,
      estimatedFuelRemaining: undefined,
      estimatedFuelUpdatedAt: undefined,
    } as Parameters<MotorcycleRepository["updateMotorcycle"]>[0]);

    if (updated.ok) {
      const estimated = await this.estimateFuelFromLogs(motorcycleId);
      return this.success(estimated);
    }

    return this.failure({
      code: "update_failed",
      message: "Could not reset estimated fuel.",
    });
  }

  private validateFuelLogInput(input: {
    readonly liters?: number;
    readonly pricePerLiter?: number;
    readonly totalCost?: number;
    readonly odometerKm: number;
    readonly fillType: "full_tank" | "partial_refill";
  }) {
    if (typeof input.liters === "number" && input.liters <= 0) {
      return {
        valid: false as const,
        error: {
          code: "validation_failed",
          message: "Liters must be greater than zero.",
        },
      };
    }

    if (typeof input.pricePerLiter === "number" && input.pricePerLiter < 0) {
      return {
        valid: false as const,
        error: {
          code: "validation_failed",
          message: "Price per liter cannot be negative.",
        },
      };
    }

    if (typeof input.totalCost === "number" && input.totalCost < 0) {
      return {
        valid: false as const,
        error: {
          code: "validation_failed",
          message: "Total cost cannot be negative.",
        },
      };
    }

    if (input.odometerKm < 0) {
      return {
        valid: false as const,
        error: {
          code: "validation_failed",
          message: "Odometer cannot be negative.",
        },
      };
    }

    return { valid: true as const };
  }

  private calculateMissingFields(input: {
    readonly pricePerLiter?: number;
    readonly liters?: number;
    readonly totalCost?: number;
  }) {
    let pricePerLiter = input.pricePerLiter ?? 0;
    let liters = input.liters ?? 0;
    let totalCost = input.totalCost ?? 0;

    if (input.pricePerLiter && input.liters && !input.totalCost) {
      totalCost = input.pricePerLiter * input.liters;
    } else if (input.pricePerLiter && input.totalCost && !input.liters) {
      liters = input.totalCost / input.pricePerLiter;
    } else if (input.liters && input.totalCost && !input.pricePerLiter) {
      pricePerLiter = input.totalCost / input.liters;
    }

    return { pricePerLiter, liters, totalCost };
  }

  private async checkOdometerLogic(
    motorcycleId: string,
    odometerKm: number,
    fillType: "full_tank" | "partial_refill",
  ) {
    if (fillType === "partial_refill") {
      return { ok: true as const };
    }

    const logs = await this.repositories.fuel.getByMotorcycleId(motorcycleId);
    const previousFull = logs.find((log) => log.fillType === "full_tank");
    if (!previousFull) {
      return { ok: true as const };
    }

    if (odometerKm < previousFull.odometerKm) {
      return {
        ok: false as const,
        error: {
          code: "validation_failed",
          message: "Odometer is lower than the previous full-tank entry.",
        },
      };
    }

    return { ok: true as const };
  }

  private calculateFuelEconomy(logs: readonly FuelLog[]): {
    kmPerLiter: number | null;
  } {
    const fullTankLogs = logs.filter((log) => log.fillType === "full_tank");
    if (fullTankLogs.length < 2) {
      return { kmPerLiter: null };
    }

    const sorted = [...fullTankLogs].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    );
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    const distance = latest.odometerKm - previous.odometerKm;
    if (distance <= 0 || latest.liters <= 0) {
      return { kmPerLiter: null };
    }

    const kmPerLiter = distance / latest.liters;
    return { kmPerLiter: Number.isFinite(kmPerLiter) ? kmPerLiter : null };
  }

  private calculateMonthlySpending(logs: readonly FuelLog[]): number {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    return logs
      .filter((log) => {
        const date = new Date(log.recordedAt);
        return (
          date.getUTCMonth() === currentMonth &&
          date.getUTCFullYear() === currentYear
        );
      })
      .reduce((total, log) => total + log.totalCost, 0);
  }

  private calculateCostPerKm(logs: readonly FuelLog[]): number | null {
    const fullTankLogs = logs.filter((log) => log.fillType === "full_tank");
    if (fullTankLogs.length < 2) {
      return null;
    }

    const sorted = [...fullTankLogs].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    );
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    const distance = latest.odometerKm - previous.odometerKm;
    if (distance <= 0) {
      return null;
    }

    const costPerKm = latest.totalCost / distance;
    return Number.isFinite(costPerKm) ? costPerKm : null;
  }

  private async updateEstimatedFuel(motorcycleId: string): Promise<void> {
    const estimated = await this.estimateFuelFromLogs(motorcycleId);
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) {
      return;
    }

    const fuelInfo = this.readMotorcycleFuelInfo(motorcycle);
    const tankCapacity = fuelInfo.fuelTankCapacityLiters;
    const clamped =
      typeof tankCapacity === "number"
        ? Math.min(estimated, tankCapacity)
        : estimated;

    await this.repositories.motorcycles.updateMotorcycle({
      ...motorcycle,
      estimatedFuelRemaining: clamped,
      estimatedFuelUpdatedAt: new Date().toISOString(),
    } as Parameters<MotorcycleRepository["updateMotorcycle"]>[0]);
  }

  private async estimateFuelFromLogs(motorcycleId: string): Promise<number> {
    const logs = await this.repositories.fuel.getByMotorcycleId(motorcycleId);
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) return 0;
    const fuelInfo = this.readMotorcycleFuelInfo(motorcycle);
    const fullTankLogs = logs.filter((log) => log.fillType === "full_tank");

    if (
      typeof fuelInfo.estimatedFuelRemaining !== "number" &&
      fullTankLogs.length === 0
    ) {
      return 0;
    }

    const sorted = [...fullTankLogs].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    );
    const latest = sorted[sorted.length - 1];
    const baselineAt = fuelInfo.estimatedFuelUpdatedAt ?? latest?.recordedAt;
    const baselineLiters =
      typeof fuelInfo.estimatedFuelRemaining === "number"
        ? fuelInfo.estimatedFuelRemaining
        : fuelInfo.fuelTankCapacityLiters ?? latest?.liters ?? 0;
    if (!baselineAt) return baselineLiters;
    const rides = await this.repositories.rides.getAllRides();
    const distanceSinceBaseline = rides
      .filter(
        (ride) =>
          ride.motorcycleId === motorcycleId &&
          ride.status === RideStatus.Completed &&
          Date.parse(ride.endTime ?? ride.updatedAt) > Date.parse(baselineAt),
      )
      .reduce((total, ride) => total + Math.max(0, ride.distanceKm), 0);
    const efficiency = motorcycle.fuelEfficiencyKmPerLiter ?? 40;
    return Math.max(0, baselineLiters - distanceSinceBaseline / efficiency);
  }

  private async setFuelBaselineFromLog(log: FuelLog): Promise<void> {
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(log.motorcycleId);
    if (!motorcycle) return;
    const fuelInfo = this.readMotorcycleFuelInfo(motorcycle);
    const baseline = fuelInfo.fuelTankCapacityLiters ?? log.liters;
    await this.repositories.motorcycles.updateMotorcycle({
      ...motorcycle,
      estimatedFuelRemaining: baseline,
      estimatedFuelUpdatedAt: log.recordedAt,
    } as Parameters<MotorcycleRepository["updateMotorcycle"]>[0]);
  }

  private readMotorcycleFuelInfo(motorcycle: {
    readonly fuelTankCapacityLiters?: number;
    readonly estimatedFuelRemaining?: number;
    readonly estimatedFuelUpdatedAt?: string;
  }): MotorcycleFuelInfo {
    return {
      fuelTankCapacityLiters: motorcycle.fuelTankCapacityLiters,
      estimatedFuelRemaining: motorcycle.estimatedFuelRemaining,
      estimatedFuelUpdatedAt: motorcycle.estimatedFuelUpdatedAt,
    };
  }
}
