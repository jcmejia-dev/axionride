import { MaintenanceType } from '@/src/domain/maintenance';

import type {
  MaintenanceRecommendation,
  NearbyCategoryDefinition,
  NearbyServiceCategory,
} from './NearbyServiceTypes';

export const NEARBY_SERVICE_CATEGORIES: readonly NearbyCategoryDefinition[] = [
  { id: 'fuel', label: 'Gas Stations', shortLabel: 'Fuel', googleNearbyType: 'gas_station', textQuery: null },
  { id: 'motorcycle_repair', label: 'Motorcycle Repair', shortLabel: 'Repair', googleNearbyType: null, textQuery: 'motorcycle repair shop' },
  { id: 'oil_change', label: 'Oil Change', shortLabel: 'Oil Change', googleNearbyType: null, textQuery: 'motorcycle oil change service' },
  { id: 'tires', label: 'Tire Shops', shortLabel: 'Tires', googleNearbyType: 'tire_shop', textQuery: null },
  { id: 'battery_electrical', label: 'Battery & Electrical', shortLabel: 'Electrical', googleNearbyType: null, textQuery: 'motorcycle battery electrical shop' },
  { id: 'dealer', label: 'Motorcycle Dealers', shortLabel: 'Dealers', googleNearbyType: null, textQuery: 'motorcycle dealer' },
] as const;

export function getNearbyCategory(category: NearbyServiceCategory) {
  return NEARBY_SERVICE_CATEGORIES.find((item) => item.id === category) ?? NEARBY_SERVICE_CATEGORIES[1];
}

export function recommendCategoryForMaintenance(type: MaintenanceType): MaintenanceRecommendation {
  const category = categoryForMaintenance(type);
  return {
    category,
    label: getNearbyCategory(category).label,
    reason: 'maintenance',
    maintenanceType: type,
  };
}

function categoryForMaintenance(type: MaintenanceType): NearbyServiceCategory {
  switch (type) {
    case MaintenanceType.OilChange:
      return 'oil_change';
    case MaintenanceType.TireCheck:
      return 'tires';
    case MaintenanceType.BatteryCheck:
      return 'battery_electrical';
    case MaintenanceType.ChainService:
    case MaintenanceType.BrakeInspection:
    case MaintenanceType.Coolant:
    case MaintenanceType.GeneralService:
    case MaintenanceType.CustomTask:
      return 'motorcycle_repair';
  }
}
