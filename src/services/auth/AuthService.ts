import type { AuthChangeEvent, AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js';

export const AUTH_CALLBACK_URL = 'axionride://login';
export const PASSWORD_RECOVERY_URL = 'axionride://reset-password';

export type AuthFailure = { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly offline: boolean } };
export type AuthSuccess<T> = { readonly ok: true; readonly value: T };
export type AuthResult<T> = AuthSuccess<T> | AuthFailure;
export type RegistrationResult = { readonly user: User | null; readonly session: Session | null; readonly requiresEmailConfirmation: boolean };

export class AuthService {
  constructor(private readonly client: SupabaseClient) {}

  async getSession(): Promise<AuthResult<Session | null>> { const { data, error } = await this.client.auth.getSession(); return error ? failure(error) : success(data.session); }
  async login(email: string, password: string): Promise<AuthResult<Session>> {
    const { data, error } = await this.client.auth.signInWithPassword({ email: email.trim(), password });
    return error || !data.session ? failure(error ?? new Error('No session was returned.')) : success(data.session);
  }
  async register(name: string, email: string, password: string): Promise<AuthResult<RegistrationResult>> {
    const { data, error } = await this.client.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: AUTH_CALLBACK_URL } });
    return error ? failure(error) : success({ user: data.user, session: data.session, requiresEmailConfirmation: data.session === null });
  }
  async requestPasswordReset(email: string): Promise<AuthResult<void>> {
    const { error } = await this.client.auth.resetPasswordForEmail(email.trim(), { redirectTo: PASSWORD_RECOVERY_URL });
    return error ? failure(error) : success(undefined);
  }
  async updatePassword(password: string): Promise<AuthResult<User>> { const { data, error } = await this.client.auth.updateUser({ password }); return error ? failure(error) : success(data.user); }
  async logout(): Promise<AuthResult<void>> { const { error } = await this.client.auth.signOut(); return error ? failure(error) : success(undefined); }
  async refreshSession(): Promise<AuthResult<Session | null>> { const { data, error } = await this.client.auth.refreshSession(); return error ? failure(error) : success(data.session); }
  startAutoRefresh() { this.client.auth.startAutoRefresh(); }
  stopAutoRefresh() { this.client.auth.stopAutoRefresh(); }
  onAuthStateChange(handler: (event: AuthChangeEvent, session: Session | null) => void) { return this.client.auth.onAuthStateChange(handler); }

  async handleRedirect(url: string): Promise<AuthResult<Session | null>> {
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (code) { const { data, error } = await this.client.auth.exchangeCodeForSession(code); return error ? failure(error) : success(data.session); }
      const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      if (accessToken && refreshToken) { const { data, error } = await this.client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }); return error ? failure(error) : success(data.session); }
      return success(null);
    } catch (error) { return failure(error instanceof Error ? error : new Error('Authentication redirect could not be processed.')); }
  }
}

function success<T>(value: T): AuthSuccess<T> { return { ok: true, value }; }
function failure(error: AuthError | Error | null): AuthFailure {
  const raw = error?.message ?? 'Authentication failed.';
  const normalized = raw.toLowerCase();
  const offline = normalized.includes('network') || normalized.includes('fetch') || normalized.includes('offline');
  let message = raw;
  if (offline) message = 'Unable to reach the authentication service. Check your connection and try again.';
  else if (normalized.includes('invalid login credentials')) message = 'The email or password is incorrect.';
  else if (normalized.includes('already registered') || normalized.includes('user already')) message = 'An account already exists for this email.';
  else if (normalized.includes('password')) message = raw;
  return { ok: false, error: { code: 'name' in (error ?? {}) ? String((error as AuthError).name) : 'auth_error', message, offline } };
}
