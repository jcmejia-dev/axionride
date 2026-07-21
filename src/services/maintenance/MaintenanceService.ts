import type {
  CreateMaintenanceInput as DomainCreateMaintenanceInput,
  UpdateMaintenanceInput as DomainUpdateMaintenanceInput,
  Maintenance
} from "@/src/domain/maintenance";
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/src/domain/maintenance";
import type { MaintenanceRepository } from "@/src/repositories/maintenance";
import type { MotorcycleRepository } from "@/src/repositories/motorcycle";
import type { RideRepository } from "@/src/repositories/ride";
import { RideStatus } from "@/src/domain/ride";
import { BaseService } from "../BaseService";
import type { ServiceContext, ServiceResult } from "../ServiceContext";
import type {
  CompleteMaintenanceInput as ServiceCompleteMaintenanceInput,
  CreateMaintenanceInput as ServiceCreateMaintenanceInput,
  MaintenanceListItem as ServiceMaintenanceListItem,
  UpdateMaintenanceInput as ServiceUpdateMaintenanceInput,
} from "./MaintenanceServiceTypes";

export class MaintenanceService extends BaseService {
  constructor(
    context: ServiceContext,
    private readonly repositories: {
      readonly maintenance: MaintenanceRepository;
      readonly motorcycles: MotorcycleRepository;
      readonly rides: RideRepository;
    },
  ) {
    super(context);
  }

  async createMaintenance(
    input: ServiceCreateMaintenanceInput,
  ): Promise<ServiceResult<ServiceMaintenanceListItem>> {
    const motorcycle = input.motorcycleId
      ? await this.repositories.motorcycles.getMotorcycle(input.motorcycleId)
      : await this.repositories.motorcycles.getPrimaryMotorcycle();
    const motorcycleId = motorcycle?.id;

    if (!motorcycleId) {
      return this.failure({
        code: "validation_failed",
        message: "A primary motorcycle is required to create maintenance.",
      });
    }

    const createInput: DomainCreateMaintenanceInput = {
      motorcycleId,
      title: input.title,
      description: input.description,
      type: input.type ?? MaintenanceType.GeneralService,
      status: input.status ?? MaintenanceStatus.Upcoming,
      priority: input.priority ?? MaintenancePriority.Normal,
      intervalKm: input.intervalKm,
      intervalDays: input.intervalDays,
      lastServiceOdometerKm:
        input.lastServiceOdometerKm ??
        (input.intervalKm ? motorcycle.odometerKm : undefined),
      lastServiceDate: input.lastServiceDate,
      nextDueOdometerKm:
        input.nextDueOdometerKm ??
        (input.intervalKm ? motorcycle.odometerKm + input.intervalKm : undefined),
      nextDueDate: input.nextDueDate,
      cost: input.cost,
      notes: input.notes,
    };

    const result = await this.repositories.maintenance.create(createInput);
    if (!result.ok) {
      return this.failure(result.error);
    }

    return this.success(this.toServiceListItem(result.value));
  }

  async updateMaintenance(
    input: ServiceUpdateMaintenanceInput,
  ): Promise<ServiceResult<ServiceMaintenanceListItem>> {
    const updateInput: DomainUpdateMaintenanceInput = {
      ...input,
    };

    const result = await this.repositories.maintenance.update(updateInput);
    if (!result.ok) {
      return this.failure(result.error);
    }

    return this.success(this.toServiceListItem(result.value));
  }

  async deleteMaintenance(id: string): Promise<ServiceResult<void>> {
    const result = await this.repositories.maintenance.softDelete(id);
    if (!result.ok) {
      return this.failure(result.error);
    }
    return this.success(undefined);
  }

  async getUpcomingMaintenance(): Promise<
    ServiceResult<readonly ServiceMaintenanceListItem[]>
  > {
    const maintenanceRecords =
      await this.repositories.maintenance.getAllMaintenance();
    const activeRecords = maintenanceRecords
      .filter(
        (maintenance) =>
          maintenance.status !== MaintenanceStatus.Completed &&
          maintenance.status !== MaintenanceStatus.Skipped,
      );
    const items = await Promise.all(
      activeRecords.map((maintenance) => this.toTrackedServiceListItem(maintenance)),
    );

    return this.success(items);
  }

  async getMaintenanceHistory(): Promise<
    ServiceResult<readonly ServiceMaintenanceListItem[]>
  > {
    const maintenanceRecords =
      await this.repositories.maintenance.getAllMaintenance();
    const items = maintenanceRecords
      .filter(
        (maintenance) => maintenance.status === MaintenanceStatus.Completed,
      )
      .map((maintenance) => this.toServiceListItem(maintenance));

    return this.success(items);
  }

  async completeMaintenance(
    input: ServiceCompleteMaintenanceInput,
  ): Promise<ServiceResult<ServiceMaintenanceListItem>> {
    const maintenance = await this.repositories.maintenance.getMaintenance(
      input.id,
    );
    if (!maintenance) {
      return this.failure({
        code: "not_found",
        message: `Maintenance ${input.id} does not exist.`,
      });
    }

    const updateInput: DomainUpdateMaintenanceInput = {
      id: input.id,
      status: MaintenanceStatus.Completed,
      cost: input.cost,
      notes: input.notes,
      lastServiceOdometerKm: input.odometerKm,
      lastServiceDate: input.completedAt
        ? input.completedAt.slice(0, 10)
        : maintenance.lastServiceDate,
    };

    const result = await this.repositories.maintenance.update(updateInput);
    if (!result.ok) {
      return this.failure(result.error);
    }

    return this.success(this.toServiceListItem(result.value));
  }

  private toServiceListItem(
    maintenance: Maintenance,
  ): ServiceMaintenanceListItem {
    return {
      maintenance,
      statusLabel: maintenance.status,
      colorKey: getStatusColorKey(maintenance.status),
      remainingKm: null,
      remainingDays: null,
      progress: maintenance.status === MaintenanceStatus.Completed ? 1 : 0,
    };
  }

  private async toTrackedServiceListItem(
    maintenance: Maintenance,
  ): Promise<ServiceMaintenanceListItem> {
    if (
      maintenance.intervalKm === undefined ||
      maintenance.lastServiceOdometerKm === undefined ||
      maintenance.nextDueOdometerKm === undefined
    ) {
      return this.toServiceListItem(maintenance);
    }

    const rides = await this.repositories.rides.getAllRides();
    const baselineTime = maintenance.lastServiceDate
      ? Date.parse(`${maintenance.lastServiceDate}T00:00:00.000Z`)
      : Date.parse(maintenance.createdAt);
    const riddenDistanceKm = rides
      .filter(
        (ride) =>
          ride.motorcycleId === maintenance.motorcycleId &&
          ride.status === RideStatus.Completed &&
          Date.parse(ride.endTime ?? ride.updatedAt) > baselineTime,
      )
      .reduce((total, ride) => total + Math.max(0, ride.distanceKm), 0);
    const currentOdometerKm = maintenance.lastServiceOdometerKm + riddenDistanceKm;
    const remainingKm = maintenance.nextDueOdometerKm - currentOdometerKm;
    const progress = Math.min(1, Math.max(0, riddenDistanceKm / maintenance.intervalKm));
    const status = remainingKm <= 0
      ? MaintenanceStatus.Overdue
      : progress >= 0.8
        ? MaintenanceStatus.DueSoon
        : MaintenanceStatus.Upcoming;

    return {
      maintenance,
      statusLabel: status,
      colorKey: getStatusColorKey(status),
      remainingKm,
      remainingDays: null,
      progress,
    };
  }
}

function getStatusColorKey(status: MaintenanceStatus) {
  switch (status) {
    case MaintenanceStatus.Overdue:
      return "danger";
    case MaintenanceStatus.DueSoon:
      return "warning";
    case MaintenanceStatus.Completed:
      return "success";
    default:
      return "muted";
  }
}
