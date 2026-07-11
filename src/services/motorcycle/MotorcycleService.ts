import type { Motorcycle, MotorcycleId } from '@/src/domain/motorcycle';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

export type MotorcycleOverview = { readonly motorcycles: readonly Motorcycle[]; readonly primaryMotorcycleId: MotorcycleId | null };

export class MotorcycleService extends BaseService {
  constructor(context: ServiceContext) { super(context); }

  async getOverview(): Promise<ServiceResult<MotorcycleOverview>> {
    const [motorcycles, primary] = await Promise.all([
      this.context.repositories.motorcycles.getAllMotorcycles(),
      this.context.repositories.motorcycles.getPrimaryMotorcycle(),
    ]);
    return this.success({ motorcycles, primaryMotorcycleId: primary?.id ?? null });
  }

  async getMotorcycle(id: MotorcycleId): Promise<ServiceResult<Motorcycle>> {
    const motorcycle = await this.context.repositories.motorcycles.getMotorcycle(id);
    return motorcycle ? this.success(motorcycle) : this.failure({ code: 'not_found', message: 'Motorcycle was not found.' });
  }

  async saveMotorcycle(motorcycle: Motorcycle): Promise<ServiceResult<Motorcycle>> {
    const exists = await this.context.repositories.motorcycles.motorcycleExists(motorcycle.id);
    const result = exists
      ? await this.context.repositories.motorcycles.updateMotorcycle(motorcycle)
      : await this.context.repositories.motorcycles.saveMotorcycle(motorcycle);
    return result.ok ? this.success(result.value) : this.failure({ code: result.error.code === 'validation_failed' ? 'validation_failed' : 'repository_error', message: result.error.message, cause: result.error });
  }

  async deleteMotorcycle(id: MotorcycleId): Promise<ServiceResult<{ readonly id: MotorcycleId }>> {
    const result = await this.context.repositories.motorcycles.deleteMotorcycle(id);
    return result.ok ? this.success(result.value) : this.failure({ code: result.error.code === 'not_found' ? 'not_found' : 'repository_error', message: result.error.message, cause: result.error });
  }

  async setPrimaryMotorcycle(id: MotorcycleId): Promise<ServiceResult<Motorcycle>> {
    const result = await this.context.repositories.motorcycles.setPrimaryMotorcycle(id);
    return result.ok ? this.success(result.value) : this.failure({ code: result.error.code === 'not_found' ? 'not_found' : 'repository_error', message: result.error.message, cause: result.error });
  }

  async requirePrimaryMotorcycle(): Promise<ServiceResult<Motorcycle>> {
    const motorcycle = await this.context.repositories.motorcycles.getPrimaryMotorcycle();
    return motorcycle ? this.success(motorcycle) : this.failure({ code: 'not_found', message: 'Add a motorcycle and select it as primary first.' });
  }
}
