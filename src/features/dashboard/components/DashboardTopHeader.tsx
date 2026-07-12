import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { iconSizes, premiumColors, spacing, typography } from '@/src/theme';

type DashboardTopHeaderProps = {
  readonly greeting: string;
  readonly riderName: string;
  readonly onOpenSettings: () => void;
};

export function DashboardTopHeader({ greeting, riderName, onOpenSettings }: DashboardTopHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logoSpacer} />
        <View accessibilityRole="image" accessibilityLabel="AxionRide" style={styles.wordmark}>
          <Text style={styles.wordmarkAxion}>AXION</Text>
          <Text style={styles.wordmarkRide}>RIDE</Text>
        </View>
        <Pressable accessibilityLabel="Search motorcycles, rides, and maintenance" accessibilityRole="search" onPress={onOpenSettings} style={({pressed})=>[styles.searchButton,pressed&&styles.pressed]}><SymbolView name={{ios:'magnifyingglass',android:'search',web:'search'}} size={20} tintColor={premiumColors.textSecondary}/><Text style={styles.searchText}>Search</Text></Pressable>
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.greeting}>
          {greeting}, <Text style={styles.name}>{riderName}</Text>
        </Text>
        <Text style={styles.subtitle}>Ride safe. Ride smart.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  logoRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSpacer: { display:'none' },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkAxion: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: premiumColors.textPrimary,
  },
  wordmarkRide: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: premiumColors.primaryBright,
  },
  searchButton: {
    minWidth:126,
    minHeight:46,
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    paddingHorizontal:15,
    borderRadius:16,
    borderWidth:1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
  },
  searchText:{...typography.caption,color:premiumColors.textSecondary,fontWeight:'800'},pressed:{opacity:.72,transform:[{scale:.98}]},
  copy: {
    gap: 3,
  },
  greeting: {
    ...typography.title,
    color: premiumColors.textPrimary,
  },
  name: {
    color: premiumColors.primaryBright,
  },
  subtitle: {
    ...typography.body,
    fontWeight: '700',
    color: premiumColors.textSecondary,
  },
});
