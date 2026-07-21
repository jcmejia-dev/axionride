import type {
  CreateOilChangeInput,
  OilChange,
  UpdateOilChangeInput,
} from "@/src/domain/maintenance";
import type { OilChangeRepository } from "@/src/repositories/maintenance";
import type { MotorcycleRepository } from "@/src/repositories/motorcycle";
import type { RideRepository } from "@/src/repositories/ride";
import { RideStatus } from "@/src/domain/ride";
import { BaseService } from "../BaseService";
import type { ServiceContext } from "../ServiceContext";
import type { ServiceResult } from "../ServiceTypes";

export class OilChangeService extends BaseService {
  constructor(
    context: ServiceContext,
    private readonly repositories: {
      readonly oilChanges: OilChangeRepository;
      readonly motorcycles: MotorcycleRepository;
      readonly rides: RideRepository;
    },
  ) {
    super(context);
  }

  async createOilChange(
    input: CreateOilChangeInput,
  ): Promise<ServiceResult<OilChange>> {
    const oilChange = await this.repositories.oilChanges.create(input);
    return this.success(oilChange);
  }

  async updateOilChange(
    input: UpdateOilChangeInput,
  ): Promise<ServiceResult<OilChange>> {
    const oilChange = await this.repositories.oilChanges.update(input);
    return this.success(oilChange);
  }

  async deleteOilChange(id: string): Promise<ServiceResult<void>> {
    await this.repositories.oilChanges.softDelete(id);
    return this.success(undefined);
  }

  async getOilChangeHistory(
    motorcycleId: string,
  ): Promise<ServiceResult<readonly OilChange[]>> {
    const items =
      await this.repositories.oilChanges.getByMotorcycleId(motorcycleId);
    return this.success(items);
  }

  async getTrackedOdometer(
    motorcycleId: string,
  ): Promise<ServiceResult<number>> {
    const motorcycle =
      await this.repositories.motorcycles.getMotorcycle(motorcycleId);
    if (!motorcycle) {
      return this.failure({ code: "not_found", message: "Motorcycle not found." });
    }

    const [rides, oilChanges] = await Promise.all([
      this.repositories.rides.getAllRides(),
      this.repositories.oilChanges.getByMotorcycleId(motorcycleId),
    ]);
    const latestOilChange = [...oilChanges].sort((first, second) =>
      second.performedAt.localeCompare(first.performedAt),
    )[0];
    const odometerAnchor = latestOilChange?.odometerKm ?? motorcycle.odometerKm;
    const anchorTime = latestOilChange?.performedAt ?? motorcycle.createdAt;
    const trackedDistanceKm = rides
      .filter(
        (ride) =>
          ride.motorcycleId === motorcycleId &&
          ride.status === RideStatus.Completed &&
          Date.parse(ride.endTime ?? ride.updatedAt) > Date.parse(anchorTime),
      )
      .reduce((total, ride) => total + Math.max(0, ride.distanceKm), 0);
    return this.success(odometerAnchor + trackedDistanceKm);
  }

  async getOilChangeTracker(
    motorcycleId: string,
  ): Promise<ServiceResult<OilChangeTracker>> {
    const [historyResult, odometerResult, rides] = await Promise.all([
      this.getOilChangeHistory(motorcycleId),
      this.getTrackedOdometer(motorcycleId),
      this.repositories.rides.getAllRides(),
    ]);
    if (!historyResult.ok) return historyResult;
    if (!odometerResult.ok) return odometerResult;

    const latest = [...historyResult.value].sort((first, second) =>
      second.performedAt.localeCompare(first.performedAt),
    )[0] ?? null;
    if (!latest) {
      return this.success({
        latest: null,
        trackedOdometerKm: odometerResult.value,
        distanceSinceChangeKm: 0,
        intervalKm: DEFAULT_OIL_CHANGE_INTERVAL_KM,
        remainingKm: DEFAULT_OIL_CHANGE_INTERVAL_KM,
        progress: 0,
        status: "not_started",
      });
    }

    const distanceSinceChangeKm = rides
      .filter(
        (ride) =>
          ride.motorcycleId === motorcycleId &&
          ride.status === RideStatus.Completed &&
          Date.parse(ride.endTime ?? ride.updatedAt) > Date.parse(latest.performedAt),
      )
      .reduce((total, ride) => total + Math.max(0, ride.distanceKm), 0);
    const intervalKm = latest.nextDueOdometerKm
      ? Math.max(1, latest.nextDueOdometerKm - latest.odometerKm)
      : DEFAULT_OIL_CHANGE_INTERVAL_KM;
    const remainingKm = Math.max(0, intervalKm - distanceSinceChangeKm);
    const ratio = distanceSinceChangeKm / intervalKm;

    return this.success({
      latest,
      trackedOdometerKm: Math.max(odometerResult.value, latest.odometerKm + distanceSinceChangeKm),
      distanceSinceChangeKm,
      intervalKm,
      remainingKm,
      progress: Math.min(1, Math.max(0, ratio)),
      status: ratio >= 1 ? "due" : ratio >= 0.8 ? "due_soon" : "good",
    });
  }
}

export const DEFAULT_OIL_CHANGE_INTERVAL_KM = 1_500;

export type OilChangeTracker = {
  readonly latest: OilChange | null;
  readonly trackedOdometerKm: number;
  readonly distanceSinceChangeKm: number;
  readonly intervalKm: number;
  readonly remainingKm: number;
  readonly progress: number;
  readonly status: "not_started" | "good" | "due_soon" | "due";
};
