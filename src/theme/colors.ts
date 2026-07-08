export const palette = {
  darkPrimary: '#111827',
  darkBackground: '#070A0F',
  slate: '#1F2937',
  slateLight: '#334155',
  surface: 'rgba(17, 24, 39, 0.78)',
  surfaceStrong: 'rgba(31, 41, 55, 0.9)',
  border: 'rgba(148, 163, 184, 0.2)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accentOrange: '#F97316',
  accentBlue: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export const colorScheme = {
  light: {
    text: palette.darkPrimary,
    background: '#F8FAFC',
    tint: palette.accentOrange,
    tabIconDefault: '#64748B',
    tabIconSelected: palette.accentOrange,
  },
  dark: {
    text: palette.text,
    background: palette.darkBackground,
    tint: palette.accentOrange,
    tabIconDefault: '#64748B',
    tabIconSelected: palette.accentOrange,
  },
};

export const semanticColors = {
  light: {
    background: '#F8FAFC',
    surface: 'rgba(255, 255, 255, 0.86)',
    surfaceStrong: '#FFFFFF',
    border: 'rgba(15, 23, 42, 0.12)',
    text: palette.darkPrimary,
    textMuted: '#64748B',
    primary: palette.darkPrimary,
    primaryText: '#FFFFFF',
    accent: palette.accentOrange,
    accentSoft: 'rgba(249, 115, 22, 0.12)',
    cyanSoft: 'rgba(34, 211, 238, 0.12)',
    dangerSoft: 'rgba(239, 68, 68, 0.12)',
    successSoft: 'rgba(34, 197, 94, 0.12)',
    warningSoft: 'rgba(245, 158, 11, 0.14)',
  },
  dark: {
    background: palette.darkBackground,
    surface: palette.surface,
    surfaceStrong: palette.surfaceStrong,
    border: palette.border,
    text: palette.text,
    textMuted: palette.textMuted,
    primary: palette.accentOrange,
    primaryText: palette.darkBackground,
    accent: palette.accentOrange,
    accentSoft: 'rgba(249, 115, 22, 0.14)',
    cyanSoft: 'rgba(34, 211, 238, 0.12)',
    dangerSoft: 'rgba(239, 68, 68, 0.16)',
    successSoft: 'rgba(34, 197, 94, 0.14)',
    warningSoft: 'rgba(245, 158, 11, 0.16)',
  },
};

export type AppColorName = keyof typeof palette;
export type ThemeName = keyof typeof semanticColors;
