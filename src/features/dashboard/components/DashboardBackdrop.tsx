import { StyleSheet, View } from 'react-native';

const GRADIENT_BANDS = ['#070A0F', '#080B10', '#090C11', '#0A0E13', '#0B0F14'] as const;

/** Dependency-free dark gradient approximation for the dashboard background. */
export function DashboardBackdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      {GRADIENT_BANDS.map((color, index) => (
        <View
          key={color}
          style={[
            styles.gradientBand,
            {
              top: `${index * 20}%`,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      <View style={styles.coolGlow} />
      <View style={styles.orangeGlow} />
      <View style={styles.topHairline} />
      <View style={styles.sideRail} />
      <View style={styles.sideRailCap} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#070A0F',
  },
  gradientBand: {
    position: 'absolute',
    right: 0,
    left: 0,
    height: '22%',
  },
  coolGlow: {
    position: 'absolute',
    top: -170,
    right: -135,
    width: 390,
    height: 390,
    borderRadius: 195,
    backgroundColor: 'rgba(36, 68, 88, 0.075)',
  },
  orangeGlow: {
    position: 'absolute',
    top: 295,
    left: -165,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(255, 122, 26, 0.026)',
  },
  topHairline: {
    position: 'absolute',
    top: 112,
    right: 18,
    left: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  sideRail: {
    position: 'absolute',
    top: 178,
    left: 8,
    width: 1,
    height: 86,
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
  },
  sideRailCap: {
    position: 'absolute',
    top: 178,
    left: 8,
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 122, 26, 0.32)',
  },
});
