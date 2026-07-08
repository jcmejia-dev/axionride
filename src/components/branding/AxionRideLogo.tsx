import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { palette, radius, semanticColors, spacing, typography } from '@/src/theme';

type AxionRideLogoProps = ViewProps & {
  compact?: boolean;
};

/** Branded AxionRide wordmark placeholder used until final logo assets exist. */
export function AxionRideLogo({ compact = false, style, ...props }: AxionRideLogoProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={[styles.mark, compact ? styles.compactMark : null]}>
        <Text style={[styles.markText, compact ? styles.compactMarkText : null]}>AR</Text>
      </View>
      <Text style={[styles.name, compact ? styles.compactName : null]}>AxionRide</Text>
      <Text style={[styles.tagline, compact ? styles.compactTagline : null]}>Ride Smarter.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mark: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: semanticColors.dark.border,
    backgroundColor: semanticColors.dark.surfaceStrong,
    marginBottom: spacing.lg,
  },
  compactMark: {
    width: 76,
    height: 76,
  },
  markText: {
    ...typography.title,
    color: palette.accentOrange,
  },
  compactMarkText: {
    fontSize: 24,
    lineHeight: 30,
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
    color: palette.accentOrange,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactTagline: {
    ...typography.subtitle,
  },
});
