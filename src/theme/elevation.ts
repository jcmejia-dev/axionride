import type { ViewStyle } from 'react-native';

export const elevation = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  } satisfies ViewStyle,
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 26,
    elevation: 8,
  } satisfies ViewStyle,
  glowOrange: {
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  metallic: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 30,
    elevation: 10,
  } satisfies ViewStyle,
};
