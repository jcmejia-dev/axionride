import {
  FuelType,
  MotorcycleCategory,
  TransmissionType,
  type Motorcycle,
} from '@/src/domain/motorcycle';

import type { GarageMotorcycleStatus } from '../types';

export const mockMotorcycles: readonly Motorcycle[] = [
  {
    id: 'moto-skygo-boss-150',
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
  },
  {
    id: 'moto-honda-click-125',
    nickname: 'City Glide',
    brand: 'Honda',
    model: 'Click 125',
    year: 2023,
    engineCc: 125,
    category: MotorcycleCategory.Scooter,
    fuelType: FuelType.Gasoline,
    transmission: TransmissionType.Automatic,
    color: 'Pearl White',
    plateNumber: 'NCR 8421',
    vin: 'HONCLICK12520230017',
    odometerKm: 8720,
    purchaseDate: '2023-09-02',
    purchasePrice: 82000,
    imageUri: undefined,
    notes: 'Errands, commute, and quick urban rides.',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
  },
  {
    id: 'moto-kawasaki-z400',
    nickname: 'Night Circuit',
    brand: 'Kawasaki',
    model: 'Z400',
    year: 2022,
    engineCc: 399,
    category: MotorcycleCategory.Naked,
    fuelType: FuelType.Gasoline,
    transmission: TransmissionType.Manual,
    color: 'Ebony Black',
    plateNumber: 'RDE 4020',
    vin: 'KAWZ400202200048',
    odometerKm: 18940,
    purchaseDate: '2022-12-18',
    purchasePrice: 279000,
    imageUri: undefined,
    notes: 'Weekend expressway and mountain-road machine.',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
  },
];

export const mockGarageStatuses: readonly GarageMotorcycleStatus[] = [
  {
    motorcycleId: 'moto-skygo-boss-150',
    rideReady: true,
    oilStatus: 'Oil 78%',
    lastRide: 'Yesterday',
  },
  {
    motorcycleId: 'moto-honda-click-125',
    rideReady: true,
    oilStatus: 'Oil 64%',
    lastRide: '3 days ago',
  },
  {
    motorcycleId: 'moto-kawasaki-z400',
    rideReady: false,
    oilStatus: 'Service due',
    lastRide: 'Last Sunday',
  },
];

export function getGarageStatus(motorcycleId: Motorcycle['id']) {
  return mockGarageStatuses.find((status) => status.motorcycleId === motorcycleId);
}
