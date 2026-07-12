import type { Motorcycle } from '@/src/domain/motorcycle';

export type MotorcycleFormField =
  | 'nickname'
  | 'brand'
  | 'model'
  | 'year'
  | 'category'
  | 'engineCc'
  | 'fuelType'
  | 'transmission'
  | 'color'
  | 'plateNumber'
  | 'vin'
  | 'purchaseDate'
  | 'purchasePrice'
  | 'odometerKm'
  | 'notes'
  | 'imageUri';

export type MotorcycleFormValues = {
  readonly nickname: string;
  readonly brand: string;
  readonly model: string;
  readonly year: string;
  readonly category: Motorcycle['category'];
  readonly engineCc: string;
  readonly fuelType: Motorcycle['fuelType'];
  readonly transmission: Motorcycle['transmission'];
  readonly color: string;
  readonly plateNumber: string;
  readonly vin: string;
  readonly purchaseDate: string;
  readonly purchasePrice: string;
  readonly odometerKm: string;
  readonly notes: string;
  readonly imageUri: string;
};

export type MotorcycleFormErrors = Partial<Record<MotorcycleFormField, string>>;
