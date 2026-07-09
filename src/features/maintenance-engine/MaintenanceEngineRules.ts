/**
 * Default percent of interval used where a task becomes due soon.
 */
export const DEFAULT_DUE_SOON_THRESHOLD_PERCENT = 80;

/**
 * Optional fallback distance window for due-soon checks.
 */
export const DEFAULT_DUE_SOON_THRESHOLD_KM = 500;

/**
 * Optional fallback day window for due-soon checks.
 */
export const DEFAULT_DUE_SOON_THRESHOLD_DAYS = 14;

/**
 * Milliseconds in one day, used for deterministic date interval math.
 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
