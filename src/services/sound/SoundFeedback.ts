export type SoundCue = 'toast';

/**
 * Stable sound-feedback hook for premium UI events.
 *
 * Audio is intentionally disabled until the product adds a user-controlled
 * sound setting and an approved asset. Call sites can use this boundary now
 * without taking a dependency on an audio package.
 */
export function playSound(_cue: SoundCue) {
  // Reserved for a future opt-in sound implementation.
}
