import type { AuthResult } from './AuthService';

export class AuthOperationLock {
  private active = false;
  get isRunning() { return this.active; }
  async run<T>(operation: () => Promise<AuthResult<T>>): Promise<AuthResult<T>> {
    if (this.active) return { ok: false, error: { code: 'duplicate_submission', message: 'Please wait for the current request to finish.', offline: false } };
    this.active = true;
    try { return await operation(); } finally { this.active = false; }
  }
}
