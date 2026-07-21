import type { ServiceContext } from "./ServiceContext";
import type { ServiceError, ServiceResult } from "./ServiceTypes";

/**
 * Shared abstract base for future application services.
 *
 * Concrete services should orchestrate repositories and engines here instead
 * of letting UI code call repositories or engines directly.
 */
export abstract class BaseService {
  protected readonly context: ServiceContext;

  protected constructor(context: ServiceContext) {
    this.context = context;
  }

  protected success<T>(value: T): ServiceResult<T> {
    return { ok: true, value };
  }

  protected failure<T = never>(
    error: ServiceError | { readonly code: string; readonly message: string },
  ): ServiceResult<T> {
    return { ok: false, error: error as ServiceError };
  }
}
