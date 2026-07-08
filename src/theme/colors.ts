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

export type AppColorName = keyof typeof palette;
