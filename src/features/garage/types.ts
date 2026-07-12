import type { MotorcycleId } from '@/src/domain/motorcycle';

export type GarageMotorcycleStatus = {
  readonly motorcycleId: MotorcycleId;
  readonly rideReady: boolean;
  readonly oilStatus: string;
  readonly lastRide: string;
};

export type GarageMaintenanceSummary = {
  readonly statusLabel: string;
  readonly statusTone: 'success' | 'warning' | 'danger' | 'neutral';
  readonly nextMaintenanceLabel: string;
  readonly lastOilChangeLabel: string;
  readonly progressPercent: number | null;
};
