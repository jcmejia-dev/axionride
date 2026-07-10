import { Image, StyleSheet, Text, View, type ImageStyle, type ViewProps } from 'react-native';

import { palette, premiumColors, radius, semanticColors, spacing, typography } from '@/src/theme';

type AxionRideLogoProps = ViewProps & {
  compact?: boolean;
  variant?: 'full' | 'symbol' | 'wordmark';
  imageStyle?: ImageStyle;
};

/** Branded AxionRide mark using the shared logo asset. */
export function AxionRideLogo({
  compact = false,
  variant = 'full',
  imageStyle,
  style,
  ...props
}: AxionRideLogoProps) {
  const showSymbol = variant === 'full' || variant === 'symbol';
  const showWordmark = variant === 'full' || variant === 'wordmark';

  return (
    <View style={[styles.container, style]} {...props}>
      {showSymbol ? (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require('../../../assets/images/logo.png')}
          style={[styles.logoAsset, compact ? styles.compactLogoAsset : null, imageStyle]}
        />
      ) : null}
      {showWordmark ? <Text style={[styles.name, compact ? styles.compactName : null]}>AxionRide</Text> : null}
      {variant === 'full' ? <Text style={[styles.tagline, compact ? styles.compactTagline : null]}>Ride Smarter.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoAsset: {
    width: 118,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  compactLogoAsset: {
    width: 82,
    height: 50,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading,
    color: semanticColors.dark.text,
    textAlign: 'center',
  },
  compactName: {
    ...typography.display,
  },
  tagline: {
    ...typography.subheading,
    color: premiumColors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactTagline: {
    ...typography.subtitle,
  },
});
