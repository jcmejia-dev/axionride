export type AuthRouteState = {
  readonly firstSegment?: string;
  readonly signedIn: boolean;
  readonly onboardingCompleted: boolean;
  readonly workspaceDecisionRequired: boolean;
  readonly recoveryMode: boolean;
};

export function getAuthRedirect(state: AuthRouteState): '/welcome' | '/login' | '/workspace-setup' | '/reset-password' | '/' | null {
  const first = state.firstSegment;
  if (!state.signedIn) {
    if (!state.onboardingCompleted && first !== '(onboarding)') return '/welcome';
    if (state.onboardingCompleted && first !== '(auth)' && first !== '(onboarding)') return '/login';
    return null;
  }
  if (state.recoveryMode && first !== 'reset-password') return '/reset-password';
  if (state.workspaceDecisionRequired && first !== 'workspace-setup') return '/workspace-setup';
  if (!state.workspaceDecisionRequired && !state.recoveryMode && (first === '(auth)' || first === '(onboarding)' || first === 'workspace-setup' || first === 'reset-password')) return '/';
  return null;
}
