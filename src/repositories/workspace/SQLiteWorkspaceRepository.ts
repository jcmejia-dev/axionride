import { getFirst, runStatement, SQLITE_TABLES } from '@/src/storage/sqlite';

import type { CreateAnonymousWorkspaceInput, CreateAuthenticatedWorkspaceInput, LocalWorkspace, UpdateWorkspaceProfileInput, WorkspaceRepository } from './WorkspaceRepository';

type WorkspaceRow = {
  readonly id: string;
  readonly kind: 'anonymous' | 'authenticated';
  readonly display_name: string;
  readonly external_user_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly profile_nickname: string | null;
  readonly profile_image_uri: string | null;
};

const WORKSPACE_COLUMNS = 'id, kind, display_name, external_user_id, created_at, updated_at, profile_nickname, profile_image_uri';

export class SQLiteWorkspaceRepository implements WorkspaceRepository {
  async getActiveWorkspace(): Promise<LocalWorkspace> {
    const row = await getFirst<WorkspaceRow>(
      `SELECT w.id, w.kind, w.display_name, w.external_user_id, w.created_at, w.updated_at, w.profile_nickname, w.profile_image_uri
       FROM ${SQLITE_TABLES.workspaces} w
       INNER JOIN ${SQLITE_TABLES.appState} s ON s.active_workspace_id = w.id
       WHERE s.singleton_id = 1 LIMIT 1;`,
    );
    if (!row) throw new Error('Active local workspace is unavailable.');
    return toWorkspace(row);
  }

  async getActiveWorkspaceId() { return (await this.getActiveWorkspace()).id; }

  async listWorkspaces(): Promise<readonly LocalWorkspace[]> {
    const { getAll } = await import('@/src/storage/sqlite');
    const rows = await getAll<WorkspaceRow>(
      `SELECT ${WORKSPACE_COLUMNS}
       FROM ${SQLITE_TABLES.workspaces} ORDER BY created_at ASC;`,
    );
    return rows.map(toWorkspace);
  }

  async createAuthenticatedWorkspace(input: CreateAuthenticatedWorkspaceInput) {
    const now = new Date().toISOString();
    await runStatement(
      `INSERT INTO ${SQLITE_TABLES.workspaces}
       (id, kind, display_name, external_user_id, created_at, updated_at) VALUES (?, 'authenticated', ?, ?, ?, ?);`,
      [input.id, input.displayName, input.externalUserId ?? null, now, now],
    );
    return (await this.getWorkspace(input.id))!;
  }

  async createAnonymousWorkspace(input: CreateAnonymousWorkspaceInput) {
    const now = new Date().toISOString();
    await runStatement(
      `INSERT OR IGNORE INTO ${SQLITE_TABLES.workspaces}
       (id, kind, display_name, external_user_id, created_at, updated_at) VALUES (?, 'anonymous', ?, NULL, ?, ?);`,
      [input.id, input.displayName, now, now],
    );
    const workspace = await this.getWorkspace(input.id);
    if (!workspace) throw new Error('Anonymous workspace could not be created.');
    return workspace;
  }

  async getWorkspaceByExternalUserId(externalUserId: string) {
    const row = await getFirst<WorkspaceRow>(
      `SELECT ${WORKSPACE_COLUMNS}
       FROM ${SQLITE_TABLES.workspaces} WHERE external_user_id = ? LIMIT 1;`, [externalUserId]);
    return row ? toWorkspace(row) : null;
  }

  async getClaimableAnonymousWorkspace() {
    const row = await getFirst<WorkspaceRow>(
      `SELECT w.id, w.kind, w.display_name, w.external_user_id, w.created_at, w.updated_at, w.profile_nickname, w.profile_image_uri
       FROM ${SQLITE_TABLES.workspaces} w
       WHERE w.kind = 'anonymous' AND w.external_user_id IS NULL AND (
         EXISTS (SELECT 1 FROM ${SQLITE_TABLES.motorcycles} m WHERE m.workspace_id = w.id AND m.deleted_at IS NULL) OR
         EXISTS (SELECT 1 FROM ${SQLITE_TABLES.maintenanceRecords} x WHERE x.workspace_id = w.id AND x.deleted_at IS NULL) OR
         EXISTS (SELECT 1 FROM ${SQLITE_TABLES.rides} r WHERE r.workspace_id = w.id AND r.deleted_at IS NULL)
       ) ORDER BY w.created_at ASC LIMIT 1;`);
    return row ? toWorkspace(row) : null;
  }

  async linkExternalUser(workspaceId: string, externalUserId: string) {
    await runStatement(
      `UPDATE ${SQLITE_TABLES.workspaces} SET kind = 'authenticated', external_user_id = ?, updated_at = ? WHERE id = ?;`,
      [externalUserId, new Date().toISOString(), workspaceId],
    );
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace was not found.');
    return workspace;
  }

  async switchActiveWorkspace(workspaceId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace was not found.');
    await runStatement(`UPDATE ${SQLITE_TABLES.appState} SET active_workspace_id = ? WHERE singleton_id = 1;`, [workspaceId]);
    return workspace;
  }

  async hasAnonymousDataToClaim() {
    return (await this.getClaimableAnonymousWorkspace()) !== null;
  }

  async updateActiveProfile(input: UpdateWorkspaceProfileInput) {
    const active = await this.getActiveWorkspace();
    await runStatement(
      `UPDATE ${SQLITE_TABLES.workspaces}
       SET profile_nickname = ?, profile_image_uri = ?, updated_at = ? WHERE id = ?;`,
      [input.nickname.trim(), input.imageUri, new Date().toISOString(), active.id],
    );
    return (await this.getWorkspace(active.id))!;
  }

  private async getWorkspace(id: string) {
    const row = await getFirst<WorkspaceRow>(
      `SELECT ${WORKSPACE_COLUMNS} FROM ${SQLITE_TABLES.workspaces} WHERE id = ? LIMIT 1;`,
      [id],
    );
    return row ? toWorkspace(row) : null;
  }
}

function toWorkspace(row: WorkspaceRow): LocalWorkspace {
  return { id: row.id, kind: row.kind, displayName: row.display_name, externalUserId: row.external_user_id, createdAt: row.created_at, updatedAt: row.updated_at, profileNickname: row.profile_nickname, profileImageUri: row.profile_image_uri };
}
