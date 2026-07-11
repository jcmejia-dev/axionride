export type WorkspaceKind = 'anonymous' | 'authenticated';

export type LocalWorkspace = {
  readonly id: string;
  readonly kind: WorkspaceKind;
  readonly displayName: string;
  readonly externalUserId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateAuthenticatedWorkspaceInput = {
  readonly id: string;
  readonly displayName: string;
  readonly externalUserId?: string;
};

export interface WorkspaceRepository {
  getActiveWorkspace(): Promise<LocalWorkspace>;
  getActiveWorkspaceId(): Promise<string>;
  listWorkspaces(): Promise<readonly LocalWorkspace[]>;
  createAuthenticatedWorkspace(input: CreateAuthenticatedWorkspaceInput): Promise<LocalWorkspace>;
  linkExternalUser(workspaceId: string, externalUserId: string): Promise<LocalWorkspace>;
  switchActiveWorkspace(workspaceId: string): Promise<LocalWorkspace>;
  hasAnonymousDataToClaim(): Promise<boolean>;
}

export type WorkspaceScope = Pick<WorkspaceRepository, 'getActiveWorkspaceId'>;
