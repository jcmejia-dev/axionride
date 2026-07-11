import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import { getSupabaseClient } from '@/src/lib/supabase';
import { AuthOperationLock, AuthService, type AuthResult, type RegistrationResult } from '@/src/services/auth';
import { OnboardingService } from '@/src/services/onboarding';
import { createWorkspaceService, type LocalWorkspace } from '@/src/services';

type AuthContextValue = {
  readonly initialized: boolean;
  readonly configured: boolean;
  readonly configurationError: string | null;
  readonly session: Session | null;
  readonly user: User | null;
  readonly submitting: boolean;
  readonly onboardingCompleted: boolean;
  readonly workspaceDecisionRequired: boolean;
  readonly recoveryMode: boolean;
  login(email: string, password: string): Promise<AuthResult<Session>>;
  register(name: string, email: string, password: string): Promise<AuthResult<RegistrationResult>>;
  requestPasswordReset(email: string): Promise<AuthResult<void>>;
  updatePassword(password: string): Promise<AuthResult<User>>;
  logout(): Promise<AuthResult<void>>;
  refreshSession(): Promise<AuthResult<Session | null>>;
  attachAnonymousData(): Promise<AuthResult<LocalWorkspace>>;
  startFreshWorkspace(): Promise<AuthResult<LocalWorkspace>>;
  completeOnboarding(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const clientResult = useMemo(() => getSupabaseClient(), []);
  const authService = useMemo(() => clientResult.ok ? new AuthService(clientResult.value) : null, [clientResult]);
  const workspaceService = useMemo(() => createWorkspaceService(), []);
  const onboardingService = useMemo(() => new OnboardingService(), []);
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [workspaceDecisionRequired, setWorkspaceDecisionRequired] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const operationLock = useRef(new AuthOperationLock()).current;

  const activateWorkspaceForUser = useCallback(async (user: User) => {
    const linked = await workspaceService.findWorkspaceForExternalUser(user.id);
    if (linked.ok && linked.value) {
      await workspaceService.switchActiveWorkspace(linked.value.id);
      setWorkspaceDecisionRequired(false);
      return;
    }
    const claimable = await workspaceService.getClaimableAnonymousWorkspace();
    if (claimable.ok && claimable.value) { setWorkspaceDecisionRequired(true); return; }
    const created = await workspaceService.createAuthenticatedWorkspace({ id: authenticatedWorkspaceId(user.id), displayName: displayNameForUser(user), externalUserId: user.id });
    if (created.ok) await workspaceService.switchActiveWorkspace(created.value.id);
    else {
      const retryLookup = await workspaceService.findWorkspaceForExternalUser(user.id);
      if (retryLookup.ok && retryLookup.value) await workspaceService.switchActiveWorkspace(retryLookup.value.id);
    }
    setWorkspaceDecisionRequired(false);
  }, [workspaceService]);

  const activateSafeAnonymousWorkspace = useCallback(async () => {
    const workspaces = await workspaceService.listLocalWorkspaces();
    const available = workspaces.ok ? workspaces.value.find((workspace) => workspace.kind === 'anonymous' && workspace.externalUserId === null) : null;
    if (available) { await workspaceService.switchActiveWorkspace(available.id); return; }
    const created = await workspaceService.createAnonymousWorkspace({ id: `workspace-anonymous-${Date.now()}`, displayName: 'Local rider' });
    if (created.ok) await workspaceService.switchActiveWorkspace(created.value.id);
  }, [workspaceService]);

  useEffect(() => {
    let active = true;
    let authSubscription: { unsubscribe(): void } | undefined;
    let linkSubscription: { remove(): void } | undefined;
    async function initialize() {
      setOnboardingCompleted(await onboardingService.isCompleted());
      if (!authService) { if (active) setInitialized(true); return; }
      const initial = await authService.getSession();
      if (initial.ok && active) {
        setSession(initial.value);
        if (initial.value?.user) await activateWorkspaceForUser(initial.value.user);
        else await activateSafeAnonymousWorkspace();
      }
      const { data } = authService.onAuthStateChange((event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
        if (nextSession?.user) void activateWorkspaceForUser(nextSession.user);
        else if (event === 'SIGNED_OUT') void activateSafeAnonymousWorkspace();
      });
      authSubscription = data.subscription;
      const handleUrl = async (url: string) => {
        if (url.includes('reset-password')) setRecoveryMode(true);
        const result = await authService.handleRedirect(url);
        if (result.ok && result.value) {
          setSession(result.value);
          await activateWorkspaceForUser(result.value.user);
        }
      };
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await handleUrl(initialUrl);
      linkSubscription = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
      if (active) setInitialized(true);
    }
    void initialize();
    return () => { active = false; authSubscription?.unsubscribe(); linkSubscription?.remove(); };
  }, [activateSafeAnonymousWorkspace, activateWorkspaceForUser, authService, onboardingService]);

  useEffect(() => {
    if (!authService || Platform.OS === 'web') return;
    const update = (state: string) => state === 'active' ? authService.startAutoRefresh() : authService.stopAutoRefresh();
    update(AppState.currentState);
    const subscription = AppState.addEventListener('change', update);
    return () => { subscription.remove(); authService.stopAutoRefresh(); };
  }, [authService]);

  async function exclusive<T>(operation: () => Promise<AuthResult<T>>): Promise<AuthResult<T>> {
    if (operationLock.isRunning) return operationLock.run(operation);
    setSubmitting(true);
    try { return await operationLock.run(operation); } finally { setSubmitting(false); }
  }

  function unavailable<T>(): AuthResult<T> { return { ok: false, error: { code: 'missing_configuration', message: clientResult.ok ? 'Authentication is unavailable.' : clientResult.message, offline: false } }; }
  const login = (email: string, password: string) => exclusive<Session>(async () => authService ? authService.login(email, password) : unavailable<Session>());
  const register = (name: string, email: string, password: string) => exclusive<RegistrationResult>(async () => authService ? authService.register(name, email, password) : unavailable<RegistrationResult>());
  const requestPasswordReset = (email: string) => exclusive<void>(async () => authService ? authService.requestPasswordReset(email) : unavailable<void>());
  const updatePassword = (password: string) => exclusive(async () => {
    if (!authService) return unavailable<User>();
    const result = await authService.updatePassword(password);
    if (result.ok) setRecoveryMode(false);
    return result;
  });
  const refreshSession = () => exclusive<Session | null>(async () => authService ? authService.refreshSession() : unavailable<Session | null>());
  const logout = () => exclusive<void>(async () => {
    if (!authService) return unavailable<void>();
    const result = await authService.logout();
    if (result.ok) { setSession(null); setWorkspaceDecisionRequired(false); await activateSafeAnonymousWorkspace(); }
    return result;
  });

  const attachAnonymousData = () => exclusive<LocalWorkspace>(async () => {
    const user = session?.user;
    if (!user) return unavailable<LocalWorkspace>();
    const existing = await workspaceService.findWorkspaceForExternalUser(user.id);
    if (existing.ok && existing.value) { await workspaceService.switchActiveWorkspace(existing.value.id); setWorkspaceDecisionRequired(false); return authSuccess(existing.value); }
    const claimable = await workspaceService.getClaimableAnonymousWorkspace();
    if (!claimable.ok || !claimable.value) return authFailure('No anonymous local data is available to attach.');
    const linked = await workspaceService.linkAnonymousWorkspaceToExternalUser({ workspaceId: claimable.value.id, externalUserId: user.id, explicitUserDecision: true });
    if (!linked.ok) return authFailure(linked.error.message);
    await workspaceService.switchActiveWorkspace(linked.value.id); setWorkspaceDecisionRequired(false); return authSuccess(linked.value);
  });

  const startFreshWorkspace = () => exclusive<LocalWorkspace>(async () => {
    const user = session?.user;
    if (!user) return unavailable<LocalWorkspace>();
    const existing = await workspaceService.findWorkspaceForExternalUser(user.id);
    if (existing.ok && existing.value) { await workspaceService.switchActiveWorkspace(existing.value.id); setWorkspaceDecisionRequired(false); return authSuccess(existing.value); }
    const created = await workspaceService.createAuthenticatedWorkspace({ id: authenticatedWorkspaceId(user.id), displayName: displayNameForUser(user), externalUserId: user.id });
    if (!created.ok) {
      const retry = await workspaceService.findWorkspaceForExternalUser(user.id);
      if (retry.ok && retry.value) { await workspaceService.switchActiveWorkspace(retry.value.id); setWorkspaceDecisionRequired(false); return authSuccess(retry.value); }
      return authFailure(created.error.message);
    }
    await workspaceService.switchActiveWorkspace(created.value.id); setWorkspaceDecisionRequired(false); return authSuccess(created.value);
  });

  async function completeOnboarding() { await onboardingService.markCompleted(); setOnboardingCompleted(true); }

  return <AuthContext.Provider value={{ initialized, configured: clientResult.ok, configurationError: clientResult.ok ? null : clientResult.message, session, user: session?.user ?? null, submitting, onboardingCompleted, workspaceDecisionRequired, recoveryMode, login, register, requestPasswordReset, updatePassword, logout, refreshSession, attachAnonymousData, startFreshWorkspace, completeOnboarding }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider.'); return context; }

function authenticatedWorkspaceId(userId: string) { return `workspace-user-${userId}`; }
function displayNameForUser(user: User) { const metadataName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name.trim() : ''; return metadataName || user.email?.split('@')[0] || 'Axion rider'; }
function authSuccess<T>(value: T): AuthResult<T> { return { ok: true, value }; }
function authFailure(message: string): AuthResult<never> { return { ok: false, error: { code: 'workspace_error', message, offline: false } }; }
