import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { premiumColors, radius, spacing, touchSizes, typography } from '@/src/theme';

type PremiumScreenProps = ScrollViewProps & {
  readonly children: ReactNode;
  readonly scroll?: boolean;
};

export function PremiumScreen({ children, scroll = true, contentContainerStyle, style, ...props }: PremiumScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={[styles.screen, style]}>
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={[styles.scroll, style]} contentContainerStyle={[styles.content, contentContainerStyle]} {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type PremiumHeaderProps = ViewProps & {
  readonly title: string;
  readonly subtitle?: string;
  readonly eyebrow?: string;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
};

export function PremiumHeader({ title, subtitle, eyebrow, leading, trailing, style, ...props }: PremiumHeaderProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {leading}
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

type SectionHeaderProps = ViewProps & {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action, style, ...props }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]} {...props}>
      <View style={styles.headerCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.sectionAction}>{action}</View> : null}
    </View>
  );
}

type RowProps = PressableProps & {
  readonly title: string;
  readonly subtitle?: string;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
};

export function ActionRow({ title, subtitle, leading, trailing, disabled, style, ...props }: RowProps) {
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={(state) => [
        styles.row,
        state.pressed && !isDisabled ? styles.rowPressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {leading ? <View style={styles.rowLeading}>{leading}</View> : null}
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.rowTrailing}>{trailing}</View> : null}
    </Pressable>
  );
}

export function SettingsRow(props: RowProps) {
  return <ActionRow {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: premiumColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 132,
    gap: spacing.xl,
  },
  header: {
    minHeight: touchSizes.large,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.label,
    color: premiumColors.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...typography.heading,
    color: premiumColors.textPrimary,
  },
  headerSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  sectionAction: {
    flexShrink: 0,
  },
  row: {
    minHeight: touchSizes.large,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.lg,
    backgroundColor: premiumColors.surfaceGlass,
  },
  rowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  rowLeading: {
    flexShrink: 0,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
  },
  rowSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  rowTrailing: {
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.42,
  },
});
