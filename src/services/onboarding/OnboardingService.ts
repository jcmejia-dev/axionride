import { secureSessionStorage } from '@/src/lib/secureStorage';

const ONBOARDING_KEY = 'axionride.onboarding.completed';

export class OnboardingService {
  async isCompleted() { return (await secureSessionStorage.getItem(ONBOARDING_KEY)) === 'true'; }
  async markCompleted() { await secureSessionStorage.setItem(ONBOARDING_KEY, 'true'); }
}
