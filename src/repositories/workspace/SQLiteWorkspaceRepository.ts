import { DEFAULT_ANONYMOUS_WORKSPACE_ID, getFirst, runStatement, SQLITE_TABLES } from '@/src/storage/sqlite';

import type { CreateAuthenticatedWorkspaceInput, LocalWorkspace, WorkspaceRepository } from './WorkspaceRepository';

type WorkspaceRow = {
  readonly id: string;
  readonly kind: 'anonymous' | 'authenticated';
  readonly display_name: string;
  readonly external_user_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

export class SQLiteWorkspaceRepository implements WorkspaceRepository {
  async getActiveWorkspace(): Promise<LocalWorkspace> {
    const row = await getFirst<WorkspaceRow>(
      `SELECT w.id, w.kind, w.display_name, w.external_user_id, w.created_at, w.updated_at
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
      `SELECT id, kind, display_name, external_user_id, created_at, updated_at
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
    const row = await getFirst<{ readonly count: number }>(
      `SELECT (
        (SELECT COUNT(*) FROM ${SQLITE_TABLES.motorcycles} WHERE workspace_id = ? AND deleted_at IS NULL) +
        (SELECT COUNT(*) FROM ${SQLITE_TABLES.maintenanceRecords} WHERE workspace_id = ? AND deleted_at IS NULL) +
        (SELECT COUNT(*) FROM ${SQLITE_TABLES.rides} WHERE workspace_id = ? AND deleted_at IS NULL)
      ) AS count;`,
      [DEFAULT_ANONYMOUS_WORKSPACE_ID, DEFAULT_ANONYMOUS_WORKSPACE_ID, DEFAULT_ANONYMOUS_WORKSPACE_ID],
    );
    return (row?.count ?? 0) > 0;
  }

  private async getWorkspace(id: string) {
    const row = await getFirst<WorkspaceRow>(
      `SELECT id, kind, display_name, external_user_id, created_at, updated_at FROM ${SQLITE_TABLES.workspaces} WHERE id = ? LIMIT 1;`,
      [id],
    );
    return row ? toWorkspace(row) : null;
  }
}

function toWorkspace(row: WorkspaceRow): LocalWorkspace {
  return { id: row.id, kind: row.kind, displayName: row.display_name, externalUserId: row.external_user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}
