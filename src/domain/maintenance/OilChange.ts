import type { ISODateString, ISODateTimeString } from "./Maintenance";

/**
 * Oil change record domain type for AxionRide.
 */

export type OilChangeId = string;

/**
 * Canonical OilChange domain model.
 */
export type OilChange = {
  readonly id: OilChangeId;
  readonly motorcycleId: string;
  readonly performedAt: ISODateTimeString;
  readonly odometerKm: number;
  readonly oilBrand?: string;
  readonly oilViscosity?: string;
  readonly oilLiters?: number;
  readonly price?: number;
  readonly serviceShop?: string;
  readonly notes?: string;
  readonly nextDueOdometerKm?: number;
  readonly nextDueDate?: ISODateString;
  readonly createdAt: ISODateTimeString;
  readonly updatedAt: ISODateTimeString;
  readonly deletedAt?: ISODateTimeString | null;
};

/**
 * Input for creating an oil change record.
 */
export type CreateOilChangeInput = {
  readonly motorcycleId: string;
  readonly performedAt: ISODateTimeString;
  readonly odometerKm: number;
  readonly oilBrand?: string;
  readonly oilViscosity?: string;
  readonly oilLiters?: number;
  readonly price?: number;
  readonly serviceShop?: string;
  readonly notes?: string;
  readonly nextDueOdometerKm?: number;
  readonly nextDueDate?: ISODateString;
};

/**
 * Input for updating an oil change record.
 */
export type UpdateOilChangeInput = Partial<
  Omit<CreateOilChangeInput, "motorcycleId">
> & {
  readonly id: OilChangeId;
};
