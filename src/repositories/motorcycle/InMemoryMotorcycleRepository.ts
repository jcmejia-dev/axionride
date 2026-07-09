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

  constructor(initialMotorcycles: readonly Motorcycle[] = []) {
    for (const motorcycle of initialMotorcycles) {
      const validation = validateMotorcycle(motorcycle);

      if (validation.valid && !this.motorcycles.has(motorcycle.id)) {
        this.motorcycles.set(motorcycle.id, cloneMotorcycle(motorcycle));
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
    return { ok: true, value: { id } };
  }

  async motorcycleExists(id: MotorcycleId): Promise<boolean> {
    return this.motorcycles.has(id);
  }

  async clear(): Promise<void> {
    this.motorcycles.clear();
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
