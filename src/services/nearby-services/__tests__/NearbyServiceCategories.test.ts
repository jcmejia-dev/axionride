import { MaintenanceType } from "@/src/domain/maintenance";

import { recommendCategoryForMaintenance } from "../NearbyServiceCategories";
import type { NearbyServiceCategory } from "../NearbyServiceTypes";

/**
 * Framework-neutral contract tests for maintenance-to-service-category mapping.
 *
 * Run via: `runNearbyServiceCategoriesContractTests()`
 */
export async function runNearbyServiceCategoriesContractTests() {
  mapsOilChangeToOilChangeCategory();
  mapsTireCheckToTiresCategory();
  mapsBatteryCheckToBatteryElectricalCategory();
  mapsChainServiceToMotorcycleRepairCategory();
  mapsBrakeInspectionToMotorcycleRepairCategory();
  mapsCoolantToMotorcycleRepairCategory();
  mapsGeneralServiceToMotorcycleRepairCategory();
  mapsCustomTaskToMotorcycleRepairCategory();
  returnsMaintenanceReasonForAllTypes();
}

function mapsOilChangeToOilChangeCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.OilChange);
  assert(
    result.category === ("oil_change" satisfies NearbyServiceCategory),
    "OilChange maps to oil_change",
  );
  assert(result.reason === "maintenance", "reason is maintenance");
  assert(result.label === "Oil Change", "label is Oil Change");
}

function mapsTireCheckToTiresCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.TireCheck);
  assert(
    result.category === ("tires" satisfies NearbyServiceCategory),
    "TireCheck maps to tires",
  );
}

function mapsBatteryCheckToBatteryElectricalCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.BatteryCheck);
  assert(
    result.category === ("battery_electrical" satisfies NearbyServiceCategory),
    "BatteryCheck maps to battery_electrical",
  );
}

function mapsChainServiceToMotorcycleRepairCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.ChainService);
  assert(
    result.category === ("motorcycle_repair" satisfies NearbyServiceCategory),
    "ChainService maps to motorcycle_repair",
  );
}

function mapsBrakeInspectionToMotorcycleRepairCategory() {
  const result = recommendCategoryForMaintenance(
    MaintenanceType.BrakeInspection,
  );
  assert(
    result.category === ("motorcycle_repair" satisfies NearbyServiceCategory),
    "BrakeInspection maps to motorcycle_repair",
  );
}

function mapsCoolantToMotorcycleRepairCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.Coolant);
  assert(
    result.category === ("motorcycle_repair" satisfies NearbyServiceCategory),
    "Coolant maps to motorcycle_repair",
  );
}

function mapsGeneralServiceToMotorcycleRepairCategory() {
  const result = recommendCategoryForMaintenance(
    MaintenanceType.GeneralService,
  );
  assert(
    result.category === ("motorcycle_repair" satisfies NearbyServiceCategory),
    "GeneralService maps to motorcycle_repair",
  );
}

function mapsCustomTaskToMotorcycleRepairCategory() {
  const result = recommendCategoryForMaintenance(MaintenanceType.CustomTask);
  assert(
    result.category === ("motorcycle_repair" satisfies NearbyServiceCategory),
    "CustomTask maps to motorcycle_repair",
  );
}

function returnsMaintenanceReasonForAllTypes() {
  const allTypes = Object.values(MaintenanceType);
  for (const type of allTypes) {
    const result = recommendCategoryForMaintenance(type);
    assert(
      result.reason === "maintenance",
      `reason is maintenance for ${type}`,
    );
    assert(
      result.maintenanceType === type,
      `maintenanceType matches for ${type}`,
    );
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition)
    throw new Error(`Nearby service categories contract failed: ${message}`);
}
