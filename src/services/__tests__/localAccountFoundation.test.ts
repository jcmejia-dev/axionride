import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/src/domain/maintenance";
import {
  FuelType,
  MotorcycleCategory,
  TransmissionType,
  type Motorcycle,
} from "@/src/domain/motorcycle";
import {
  InMemoryMaintenanceRepository,
  InMemoryRiderProgressRepository,
  InMemoryRideRepository,
  type LocalWorkspace,
  type MotorcycleDeleteResult,
  type MotorcycleRepository,
  type MotorcycleWriteResult,
  type WorkspaceRepository,
} from "@/src/repositories";
import { InMemoryFuelRepository } from "@/src/repositories/fuel";
import { InMemoryOilChangeRepository } from "@/src/repositories/maintenance";
import { InMemoryMotorcycleRepository } from "@/src/repositories/motorcycle";
import { InMemoryPlannedTripRepository } from "@/src/repositories/trip";
import { BackupService } from "@/src/services/backup";
import { MaintenanceService } from "@/src/services/maintenance";
import { MotorcycleService } from "@/src/services/motorcycle";
import { RideService } from "@/src/services/ride";
import { RiderProgressService } from "@/src/services/rider-progress";
import { SearchService } from "@/src/services/search";
import { ServiceContext } from "@/src/services/ServiceContext";
import { StatisticsService } from "@/src/services/statistics";
import { DATABASE_MIGRATIONS } from "@/src/storage/sqlite";

/** Framework-neutral contract tests. A future test runner can invoke this suite directly. */
export async function runLocalAccountFoundationContractTests() {
  testMigrationContract();
  await testWorkspaceIsolationAndPrimarySelection();
  await testSearchStatisticsBackupAndGarageReadModel();
  await testRideAndMaintenanceUsePrimaryMotorcycle();
  await testAttachStartFreshAndRetryContracts();
}

async function testAttachStartFreshAndRetryContracts() {
  const fixture = createFixture();
  await fixture.motorcycles.saveMotorcycle(
    makeMotorcycle("anonymous-bike", "Anonymous bike"),
  );
  const claimable = await fixture.workspaces.getClaimableAnonymousWorkspace();
  assert(
    claimable?.id === "workspace-anonymous",
    "anonymous workspace is available for an explicit claim",
  );
  const attached = await fixture.workspaces.linkExternalUser(
    claimable!.id,
    "user-a",
  );
  const attachedRetry = await fixture.workspaces.linkExternalUser(
    claimable!.id,
    "user-a",
  );
  assert(
    attached.externalUserId === "user-a" && attachedRetry.id === attached.id,
    "attach is safe to retry after interruption",
  );
  await fixture.workspaces.createAuthenticatedWorkspace({
    id: "workspace-user-b",
    displayName: "User B",
    externalUserId: "user-b",
  });
  await fixture.workspaces.switchActiveWorkspace("workspace-user-b");
  assert(
    (await fixture.motorcycles.getAllMotorcycles()).length === 0,
    "start fresh activates an isolated empty workspace",
  );
  await fixture.workspaces.switchActiveWorkspace(attached.id);
  assert(
    (await fixture.motorcycles.getAllMotorcycles())[0]?.id === "anonymous-bike",
    "attached anonymous data remains intact",
  );
}

function testMigrationContract() {
  const migration = DATABASE_MIGRATIONS.find((item) => item.version === 2);
  assert(Boolean(migration), "workspace migration exists");
  const sql = migration!.statements.join("\n");
  for (const table of [
    "motorcycles",
    "maintenance_records",
    "rides",
    "ride_points",
    "sync_metadata",
  ]) {
    assert(
      sql.includes(`ALTER TABLE ${table} ADD COLUMN workspace_id`),
      `${table} receives workspace ownership`,
    );
  }
  assert(
    sql.includes("workspace-anonymous"),
    "existing records migrate to the stable anonymous workspace",
  );
  assert(
    sql.includes("idx_primary_motorcycle_per_workspace"),
    "only one primary motorcycle is permitted",
  );
  const appliedVersions = new Set<number>();
  for (const run of [1, 2])
    for (const item of DATABASE_MIGRATIONS) appliedVersions.add(item.version);
  assert(
    appliedVersions.size === DATABASE_MIGRATIONS.length,
    "migration versions remain safe to evaluate more than once",
  );
}

async function testWorkspaceIsolationAndPrimarySelection() {
  const fixture = createFixture();
  await fixture.motorcycles.saveMotorcycle(makeMotorcycle("a-bike", "A bike"));
  await fixture.workspaces.switchActiveWorkspace("workspace-b");
  assert(
    (await fixture.motorcycles.getAllMotorcycles()).length === 0,
    "workspace B cannot read workspace A motorcycles",
  );
  await fixture.motorcycles.saveMotorcycle(makeMotorcycle("b-one", "B one"));
  await fixture.motorcycles.saveMotorcycle(makeMotorcycle("b-two", "B two"));
  await fixture.motorcycles.setPrimaryMotorcycle("b-two");
  assert(
    (await fixture.motorcycles.getPrimaryMotorcycle())?.id === "b-two",
    "selected motorcycle is primary",
  );
  assert(
    (await fixture.motorcycles.primaryCount("workspace-b")) === 1,
    "workspace has exactly one primary motorcycle",
  );
}

async function testRideAndMaintenanceUsePrimaryMotorcycle() {
  const fixture = createFixture();
  const primary = makeMotorcycle("real-primary", "Real Primary");
  await fixture.motorcycles.saveMotorcycle(primary);
  const context = new ServiceContext({ repositories: fixture.provider });
  const maintenance = await new MaintenanceService(context, {
    maintenance: fixture.provider.maintenance,
    motorcycles: fixture.provider.motorcycles,
    rides: fixture.provider.rides,
  }).createMaintenance({
    motorcycleId: primary.id,
    title: "Oil change",
    type: MaintenanceType.OilChange,
    status: MaintenanceStatus.Upcoming,
    priority: MaintenancePriority.Normal,
    intervalKm: 1500,
  });
  assert(
    maintenance.ok && maintenance.value.maintenance.motorcycleId === primary.id,
    "maintenance uses the selected primary motorcycle",
  );
  assert(
    maintenance.ok &&
      maintenance.value.maintenance.nextDueOdometerKm ===
        primary.odometerKm + 1500,
    "distance-based maintenance receives a trackable due odometer",
  );
  const rideService = new RideService(context);
  const started = await rideService.startRide();
  assert(started.ok, "ride starts when a real primary motorcycle exists");
  const finished = await rideService.finishRide();
  assert(
    finished.ok && finished.value.ride.motorcycleId === primary.id,
    "ride uses the selected primary motorcycle",
  );
  const progressService = new RiderProgressService(context);
  const progress = await progressService.getSnapshot(true);
  const repeatedProgress = await progressService.getSnapshot(true);
  assert(
    progress.ok && progress.value.progress.totalXp === 5,
    "a completed ride is reconciled into rider XP",
  );
  assert(
    repeatedProgress.ok && repeatedProgress.value.progress.totalXp === 5,
    "reconciling completed rides does not duplicate XP",
  );
}

async function testSearchStatisticsBackupAndGarageReadModel() {
  const fixture = createFixture();
  await fixture.motorcycles.saveMotorcycle(
    makeMotorcycle("search-bike", "Workspace Search Bike"),
  );
  const context = new ServiceContext({ repositories: fixture.provider });
  const search = await new SearchService(context).search({
    query: "workspace search",
  });
  assert(
    search.ok && search.value.results.length === 1,
    "search reads only active workspace repositories",
  );
  const statistics = await new StatisticsService(
    context,
  ).getDashboardStatistics();
  assert(
    statistics.ok && statistics.value.motorcycles.totalMotorcycles === 1,
    "statistics are workspace scoped",
  );
  const garage = await new MotorcycleService(context).getOverview();
  assert(
    garage.ok && garage.value.motorcycles[0]?.id === "search-bike",
    "Garage read model reflects repository changes",
  );
  const backup = await new BackupService(context).createBackupPayload();
  assert(
    backup.ok && backup.value.data.motorcycles.length === 1,
    "backup exports active workspace records only",
  );
  assert(
    backup.ok &&
      backup.value.metadata.workspace.sourceWorkspaceId ===
        "workspace-anonymous",
    "backup includes workspace metadata",
  );
}

function createFixture() {
  const workspaces = new FakeWorkspaceRepository();
  const motorcycles = new ScopedMotorcycleRepository(workspaces);
  return {
    workspaces,
    motorcycles,
    provider: {
      workspaces,
      motorcycles,
      maintenance: new InMemoryMaintenanceRepository(),
      rides: new InMemoryRideRepository(),
      fuel: new InMemoryFuelRepository(),
      oilChanges: new InMemoryOilChangeRepository(),
      trips: new InMemoryPlannedTripRepository(),
      riderProgress: new InMemoryRiderProgressRepository(),
    },
  };
}

class FakeWorkspaceRepository implements WorkspaceRepository {
  private activeId = "workspace-anonymous";
  private readonly items = new Map<string, LocalWorkspace>([
    ["workspace-anonymous", workspace("workspace-anonymous", "anonymous")],
    ["workspace-b", workspace("workspace-b", "authenticated")],
  ]);
  async getActiveWorkspace() {
    return this.items.get(this.activeId)!;
  }
  async getActiveWorkspaceId() {
    return this.activeId;
  }
  async listWorkspaces() {
    return [...this.items.values()];
  }
  async getWorkspaceByExternalUserId(externalUserId: string) {
    return (
      [...this.items.values()].find(
        (item) => item.externalUserId === externalUserId,
      ) ?? null
    );
  }
  async getClaimableAnonymousWorkspace() {
    return (
      [...this.items.values()].find(
        (item) => item.kind === "anonymous" && item.externalUserId === null,
      ) ?? null
    );
  }
  async createAuthenticatedWorkspace(input: {
    readonly id: string;
    readonly displayName: string;
    readonly externalUserId?: string;
  }) {
    const value = workspace(
      input.id,
      "authenticated",
      input.displayName,
      input.externalUserId ?? null,
    );
    this.items.set(input.id, value);
    return value;
  }
  async createAnonymousWorkspace(input: {
    readonly id: string;
    readonly displayName: string;
  }) {
    const value = workspace(input.id, "anonymous", input.displayName);
    this.items.set(input.id, value);
    return value;
  }
  async linkExternalUser(id: string, externalUserId: string) {
    const value = {
      ...this.items.get(id)!,
      kind: "authenticated" as const,
      externalUserId,
    };
    this.items.set(id, value);
    return value;
  }
  async switchActiveWorkspace(id: string) {
    if (!this.items.has(id)) throw new Error("missing");
    this.activeId = id;
    return this.items.get(id)!;
  }
  async hasAnonymousDataToClaim() {
    return true;
  }
}

class ScopedMotorcycleRepository implements MotorcycleRepository {
  private readonly stores = new Map<string, InMemoryMotorcycleRepository>();
  constructor(private readonly workspaces: FakeWorkspaceRepository) {}
  private async current() {
    const id = await this.workspaces.getActiveWorkspaceId();
    let store = this.stores.get(id);
    if (!store) {
      store = new InMemoryMotorcycleRepository();
      this.stores.set(id, store);
    }
    return store;
  }
  async primaryCount(workspaceId: string) {
    return (await this.stores.get(workspaceId)?.getPrimaryMotorcycle()) ? 1 : 0;
  }
  async getMotorcycle(id: string) {
    return (await this.current()).getMotorcycle(id);
  }
  async getAllMotorcycles() {
    return (await this.current()).getAllMotorcycles();
  }
  async getPrimaryMotorcycle() {
    return (await this.current()).getPrimaryMotorcycle();
  }
  async setPrimaryMotorcycle(id: string): Promise<MotorcycleWriteResult> {
    return (await this.current()).setPrimaryMotorcycle(id);
  }
  async saveMotorcycle(value: Motorcycle): Promise<MotorcycleWriteResult> {
    return (await this.current()).saveMotorcycle(value);
  }
  async updateMotorcycle(value: Motorcycle): Promise<MotorcycleWriteResult> {
    return (await this.current()).updateMotorcycle(value);
  }
  async deleteMotorcycle(id: string): Promise<MotorcycleDeleteResult> {
    return (await this.current()).deleteMotorcycle(id);
  }
  async motorcycleExists(id: string) {
    return (await this.current()).motorcycleExists(id);
  }
  async clear() {
    return (await this.current()).clear();
  }
}

function workspace(
  id: string,
  kind: LocalWorkspace["kind"],
  displayName = id,
  externalUserId: string | null = null,
): LocalWorkspace {
  return {
    id,
    kind,
    displayName,
    externalUserId,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
function makeMotorcycle(id: string, nickname: string): Motorcycle {
  return {
    id,
    nickname,
    brand: "Honda",
    model: "Test",
    year: 2026,
    engineCc: 150,
    category: MotorcycleCategory.Naked,
    fuelType: FuelType.Gasoline,
    transmission: TransmissionType.Manual,
    color: "Black",
    odometerKm: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
function assert(condition: boolean, message: string): asserts condition {
  if (!condition)
    throw new Error(`Local foundation contract failed: ${message}`);
}
