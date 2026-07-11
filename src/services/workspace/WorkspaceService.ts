import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';
import type { CreateAnonymousWorkspaceInput, CreateAuthenticatedWorkspaceInput, LocalWorkspace } from '@/src/repositories';

export class WorkspaceService extends BaseService {
  constructor(context: ServiceContext) { super(context); }

  async getActiveWorkspace(): Promise<ServiceResult<LocalWorkspace>> { return this.wrap(() => this.context.repositories.workspaces.getActiveWorkspace()); }
  async listLocalWorkspaces(): Promise<ServiceResult<readonly LocalWorkspace[]>> { return this.wrap(() => this.context.repositories.workspaces.listWorkspaces()); }
  async findWorkspaceForExternalUser(externalUserId: string): Promise<ServiceResult<LocalWorkspace | null>> { return this.wrap(() => this.context.repositories.workspaces.getWorkspaceByExternalUserId(externalUserId)); }
  async getClaimableAnonymousWorkspace(): Promise<ServiceResult<LocalWorkspace | null>> { return this.wrap(() => this.context.repositories.workspaces.getClaimableAnonymousWorkspace()); }
  async createAuthenticatedWorkspace(input: CreateAuthenticatedWorkspaceInput): Promise<ServiceResult<LocalWorkspace>> { return this.wrap(() => this.context.repositories.workspaces.createAuthenticatedWorkspace(input)); }
  async createAnonymousWorkspace(input: CreateAnonymousWorkspaceInput): Promise<ServiceResult<LocalWorkspace>> { return this.wrap(() => this.context.repositories.workspaces.createAnonymousWorkspace(input)); }
  async linkAnonymousWorkspaceToExternalUser(input: { readonly workspaceId: string; readonly externalUserId: string; readonly explicitUserDecision: boolean }): Promise<ServiceResult<LocalWorkspace>> {
    if (!input.explicitUserDecision) return this.failure({ code: 'validation_failed', message: 'Claiming anonymous data requires an explicit user decision.' });
    return this.wrap(() => this.context.repositories.workspaces.linkExternalUser(input.workspaceId, input.externalUserId));
  }
  async switchActiveWorkspace(workspaceId: string): Promise<ServiceResult<LocalWorkspace>> { return this.wrap(() => this.context.repositories.workspaces.switchActiveWorkspace(workspaceId)); }
  async hasAnonymousDataToClaim(): Promise<ServiceResult<boolean>> { return this.wrap(() => this.context.repositories.workspaces.hasAnonymousDataToClaim()); }

  private async wrap<T>(operation: () => Promise<T>): Promise<ServiceResult<T>> {
    try { return this.success(await operation()); }
    catch (cause) { return this.failure({ code: 'repository_error', message: 'Local workspace operation failed.', cause }); }
  }
}
