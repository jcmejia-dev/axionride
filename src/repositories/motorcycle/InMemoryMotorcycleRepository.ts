import { validateMotorcycle, type Motorcycle, type MotorcycleId } from '@/src/domain/motorcycle';

import type { MotorcycleRepository } from './MotorcycleRepository';
import type {
  MotorcycleDeleteResult,
  MotorcycleRepositoryError,
  MotorcycleWriteResult,
} from './MotorcycleRepositoryTypes';

/**
 * Deterministic in-memory Motorcycle repository for demos and tests.
 */
export class InMemoryMotorcycleRepository implements MotorcycleRepository {
  private readonly motorcycles = new Map<MotorcycleId, Motorcycle>();
  private primaryId: MotorcycleId | null = null;

  constructor(initialMotorcycles: readonly Motorcycle[] = []) {
    for (const motorcycle of initialMotorcycles) {
      const validation = validateMotorcycle(motorcycle);

      if (validation.valid && !this.motorcycles.has(motorcycle.id)) {
        this.motorcycles.set(motorcycle.id, cloneMotorcycle(motorcycle));
        this.primaryId ??= motorcycle.id;
      }
    }
  }

  async getMotorcycle(id: MotorcycleId): Promise<Motorcycle | null> {
    const motorcycle = this.motorcycles.get(id);
    return motorcycle ? cloneMotorcycle(motorcycle) : null;
  }

  async getAllMotorcycles(): Promise<readonly Motorcycle[]> {
    return Array.from(this.motorcycles.values(), cloneMotorcycle);
  }

  async getPrimaryMotorcycle() {
    return this.primaryId ? this.getMotorcycle(this.primaryId) : null;
  }

  async setPrimaryMotorcycle(id: MotorcycleId): Promise<MotorcycleWriteResult> {
    const motorcycle = await this.getMotorcycle(id);
    if (!motorcycle) return failure({ code: 'not_found', message: `Motorcycle ${id} does not exist.` });
    this.primaryId = id;
    return { ok: true, value: motorcycle };
  }

  async saveMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult> {
    const validationError = validateMotorcycleForWrite(motorcycle);

    if (validationError) {
      return failure(validationError);
    }

    if (this.motorcycles.has(motorcycle.id)) {
      return failure({ code: 'already_exists', message: `Motorcycle ${motorcycle.id} already exists.` });
    }

    const motorcycleCopy = cloneMotorcycle(motorcycle);
    this.motorcycles.set(motorcycle.id, motorcycleCopy);
    this.primaryId ??= motorcycle.id;
    return { ok: true, value: cloneMotorcycle(motorcycleCopy) };
  }

  async updateMotorcycle(motorcycle: Motorcycle): Promise<MotorcycleWriteResult> {
    const validationError = validateMotorcycleForWrite(motorcycle);

    if (validationError) {
      return failure(validationError);
    }

    if (!this.motorcycles.has(motorcycle.id)) {
      return failure({ code: 'not_found', message: `Motorcycle ${motorcycle.id} does not exist.` });
    }

    const motorcycleCopy = cloneMotorcycle(motorcycle);
    this.motorcycles.set(motorcycle.id, motorcycleCopy);
    return { ok: true, value: cloneMotorcycle(motorcycleCopy) };
  }

  async deleteMotorcycle(id: MotorcycleId): Promise<MotorcycleDeleteResult> {
    if (!this.motorcycles.has(id)) {
      return failure({ code: 'not_found', message: `Motorcycle ${id} does not exist.` });
    }

    this.motorcycles.delete(id);
    if (this.primaryId === id) this.primaryId = this.motorcycles.keys().next().value ?? null;
    return { ok: true, value: { id } };
  }

  async motorcycleExists(id: MotorcycleId): Promise<boolean> {
    return this.motorcycles.has(id);
  }

  async clear(): Promise<void> {
    this.motorcycles.clear();
    this.primaryId = null;
  }
}

function validateMotorcycleForWrite(motorcycle: Motorcycle): MotorcycleRepositoryError | null {
  const validation = validateMotorcycle(motorcycle);

  if (validation.valid) {
    return null;
  }

  return {
    code: 'validation_failed',
    message: 'Motorcycle failed domain validation.',
    validationIssues: validation.issues,
  };
}

function cloneMotorcycle(motorcycle: Motorcycle): Motorcycle {
  return { ...motorcycle };
}

function failure(error: MotorcycleRepositoryError) {
  return { ok: false, error } as const;
}
