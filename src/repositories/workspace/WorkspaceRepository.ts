export type WorkspaceKind = 'anonymous' | 'authenticated';

export type LocalWorkspace = {
  readonly id: string;
  readonly kind: WorkspaceKind;
  readonly displayName: string;
  readonly externalUserId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly profileNickname?: string | null;
  readonly profileImageUri?: string | null;
};

export type UpdateWorkspaceProfileInput = {
  readonly nickname: string;
  readonly imageUri: string | null;
};

export type CreateAuthenticatedWorkspaceInput = {
  readonly id: string;
  readonly displayName: string;
  readonly externalUserId?: string;
};

export type CreateAnonymousWorkspaceInput = { readonly id: string; readonly displayName: string };

export interface WorkspaceRepository {
  getActiveWorkspace(): Promise<LocalWorkspace>;
  getActiveWorkspaceId(): Promise<string>;
  listWorkspaces(): Promise<readonly LocalWorkspace[]>;
  getWorkspaceByExternalUserId(externalUserId: string): Promise<LocalWorkspace | null>;
  getClaimableAnonymousWorkspace(): Promise<LocalWorkspace | null>;
  createAuthenticatedWorkspace(input: CreateAuthenticatedWorkspaceInput): Promise<LocalWorkspace>;
  createAnonymousWorkspace(input: CreateAnonymousWorkspaceInput): Promise<LocalWorkspace>;
  linkExternalUser(workspaceId: string, externalUserId: string): Promise<LocalWorkspace>;
  switchActiveWorkspace(workspaceId: string): Promise<LocalWorkspace>;
  hasAnonymousDataToClaim(): Promise<boolean>;
  updateActiveProfile?(input: UpdateWorkspaceProfileInput): Promise<LocalWorkspace>;
}

export type WorkspaceScope = Pick<WorkspaceRepository, 'getActiveWorkspaceId'>;
