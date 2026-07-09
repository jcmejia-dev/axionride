import type { MotorcycleId } from '@/src/domain/motorcycle';

export type GarageMotorcycleStatus = {
  readonly motorcycleId: MotorcycleId;
  readonly rideReady: boolean;
  readonly oilStatus: string;
  readonly lastRide: string;
};
