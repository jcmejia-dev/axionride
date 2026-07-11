import { validateSupabaseConfig } from '@/src/config/supabase';
import { getAuthRedirect } from '@/src/navigation/AuthRoutePolicy';
import { AuthOperationLock } from '@/src/services/auth';
import { AUTH_CALLBACK_URL, PASSWORD_RECOVERY_URL } from '@/src/services/auth/AuthService';
import { AuthService } from '@/src/services/auth/AuthService';
import type { AuthResult } from '@/src/services/auth';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

/** Framework-neutral auth contract suite; callable when the project adopts a test runner. */
export async function runSupabaseAuthFoundationContractTests() {
  testMissingConfiguration();
  testRouteProtection();
  testRecoveryConfiguration();
  await testDuplicateSubmissionProtection();
  await testAuthServiceOutcomes();
}

async function testAuthServiceOutcomes() {
  const session = { access_token: 'test-access', refresh_token: 'test-refresh', user: { id: 'user-a', email: 'a@example.com' } } as Session;
  const successful = new AuthService(fakeClient({
    getSession: async () => ({ data: { session }, error: null }),
    signInWithPassword: async () => ({ data: { session, user: session.user }, error: null }),
    signUp: async () => ({ data: { session: null, user: session.user }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
  }));
  assert((await successful.getSession()).ok, 'existing session is restored');
  assert((await successful.login('a@example.com', 'password')).ok, 'successful login returns a session');
  const registration = await successful.register('Rider', 'a@example.com', 'password');
  assert(registration.ok && registration.value.requiresEmailConfirmation, 'registration without a session requires email confirmation');
  assert((await successful.requestPasswordReset('a@example.com')).ok, 'password recovery request succeeds');
  assert((await successful.logout()).ok, 'logout succeeds');

  const invalid = new AuthService(fakeClient({ signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Invalid login credentials') }) }));
  const invalidResult = await invalid.login('a@example.com', 'wrong');
  assert(!invalidResult.ok && invalidResult.error.message.includes('incorrect'), 'invalid login is normalized');
  const offline = new AuthService(fakeClient({ signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Network request failed') }) }));
  const offlineResult = await offline.login('a@example.com', 'password');
  assert(!offlineResult.ok && offlineResult.error.offline, 'network failures are marked offline');
}

type FakeAuthOverrides = Record<string, (...args: never[]) => Promise<unknown>>;
function fakeClient(overrides: FakeAuthOverrides): SupabaseClient {
  const defaults = {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Invalid login credentials') }),
    signUp: async () => ({ data: { session: null, user: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: { user: null }, error: new Error('No user') }),
    signOut: async () => ({ error: null }),
    refreshSession: async () => ({ data: { session: null, user: null }, error: null }),
    startAutoRefresh: () => undefined,
    stopAutoRefresh: () => undefined,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    exchangeCodeForSession: async () => ({ data: { session: null, user: null }, error: null }),
    setSession: async () => ({ data: { session: null, user: null }, error: null }),
    ...overrides,
  };
  // Test boundary: only AuthService's auth methods are exercised by this fake.
  return { auth: defaults } as unknown as SupabaseClient;
}

function testMissingConfiguration() {
  assert(!validateSupabaseConfig(undefined, undefined).ok, 'missing environment configuration is rejected');
  assert(!validateSupabaseConfig('YOUR_SUPABASE_PROJECT_URL', 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY').ok, 'placeholder configuration is rejected');
  assert(validateSupabaseConfig('https://project.supabase.co', 'test-key').ok, 'configured public values are accepted');
}

function testRouteProtection() {
  assert(getAuthRedirect({ firstSegment: '(tabs)', signedIn: false, onboardingCompleted: true, workspaceDecisionRequired: false, recoveryMode: false }) === '/login', 'direct tab navigation is blocked while signed out');
  assert(getAuthRedirect({ firstSegment: '(auth)', signedIn: true, onboardingCompleted: true, workspaceDecisionRequired: false, recoveryMode: false }) === '/', 'signed-in users leave auth routes');
  assert(getAuthRedirect({ firstSegment: '(tabs)', signedIn: true, onboardingCompleted: true, workspaceDecisionRequired: true, recoveryMode: false }) === '/workspace-setup', 'workspace decision blocks app routes');
  assert(getAuthRedirect({ firstSegment: '(tabs)', signedIn: true, onboardingCompleted: true, workspaceDecisionRequired: false, recoveryMode: true }) === '/reset-password', 'recovery mode opens password update');
}

function testRecoveryConfiguration() {
  assert(AUTH_CALLBACK_URL === 'axionride://login', 'email confirmation returns to login');
  assert(PASSWORD_RECOVERY_URL === 'axionride://reset-password', 'password recovery returns to reset screen');
}

async function testDuplicateSubmissionProtection() {
  const lock = new AuthOperationLock();
  let release: () => void = () => undefined;
  const pending = lock.run<void>(() => new Promise<AuthResult<void>>((resolve) => { release = () => resolve({ ok: true, value: undefined }); }));
  const duplicate = await lock.run(async () => ({ ok: true, value: undefined }));
  assert(!duplicate.ok && duplicate.error.code === 'duplicate_submission', 'duplicate auth operations are rejected');
  release();
  await pending;
}

function assert(condition: boolean, message: string): asserts condition { if (!condition) throw new Error(`Supabase auth contract failed: ${message}`); }
