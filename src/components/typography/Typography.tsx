import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useColorScheme } from '@/src/components/useColorScheme';
import { semanticColors, typography } from '@/src/theme';

type AppTextProps = TextProps & {
  children: ReactNode;
  muted?: boolean;
};

function AppText({ children, muted = false, style, ...props }: AppTextProps) {
  const colorScheme = useColorScheme();
  const colors = semanticColors[colorScheme];

  return (
    <Text style={[{ color: muted ? colors.textMuted : colors.text }, style]} {...props}>
      {children}
    </Text>
  );
}

/** Large brand or page-level text for premium first impressions. */
export function Display(props: AppTextProps) {
  return <AppText {...props} style={[styles.display, props.style]} />;
}

/** Primary section or screen title text. */
export function Title(props: AppTextProps) {
  return <AppText {...props} style={[styles.title, props.style]} />;
}

/** Secondary heading text used below titles or in cards. */
export function Subtitle(props: AppTextProps) {
  return <AppText {...props} style={[styles.subtitle, props.style]} />;
}

/** Default readable body copy. */
export function Body(props: AppTextProps) {
  return <AppText {...props} style={[styles.body, props.style]} />;
}

/** Supporting metadata or helper text. */
export function Caption(props: AppTextProps) {
  return <AppText {...props} style={[styles.caption, props.style]} />;
}

/** Compact uppercase labels for controls, cards, and badges. */
export function Label(props: AppTextProps) {
  return <AppText {...props} style={[styles.label, props.style]} />;
}

const styles = StyleSheet.create({
  display: typography.display,
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  caption: typography.caption,
  label: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});
