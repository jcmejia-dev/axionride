import {
  FuelType,
  MotorcycleCategory,
  TransmissionType,
  type Motorcycle,
} from '@/src/domain/motorcycle';

export const mockMotorcycle: Motorcycle = {
  id: 'moto-demo-skygo-boss-150',
  nickname: 'Daily Boss',
  brand: 'Skygo',
  model: 'Boss 150',
  year: 2024,
  engineCc: 150,
  category: MotorcycleCategory.Underbone,
  fuelType: FuelType.Gasoline,
  transmission: TransmissionType.Manual,
  color: 'Matte Graphite',
  plateNumber: 'ABC 1234',
  vin: 'SKYBOSS15020240001',
  odometerKm: 12430,
  purchaseDate: '2024-02-14',
  purchasePrice: 65000,
  imageUri: undefined,
  notes: 'Primary city and weekend ride.',
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};
