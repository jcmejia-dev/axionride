export const PASSWORD_RECOVERY_WINDOW_SECONDS = 5 * 60;
export const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 60;

export function secondsUntil(timestamp: number | null, now = Date.now()): number {
  if (timestamp === null) return 0;
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
}
