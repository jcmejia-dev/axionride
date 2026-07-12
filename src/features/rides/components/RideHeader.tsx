import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function RideHeader({ onStartRide }: { readonly onStartRide: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.accent} />
        <View style={styles.copy}>
          <Text style={styles.title}>Rides</Text>
          <Text style={styles.subtitle}>Track your journeys</Text>
        </View>
        <Pressable onPress={onStartRide} accessibilityRole="button" accessibilityLabel="Start a ride" style={({pressed}) => [styles.start, pressed && styles.pressed]}>
          <SymbolView name={{ios:'plus',android:'add',web:'add'}} tintColor={palette.accentOrange} size={23}/>
          <Text style={styles.startText}>Start Ride</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  headingRow:{flexDirection:'row',alignItems:'center',gap:spacing.md},
  accent:{width:5,height:34,borderRadius:3,backgroundColor:palette.accentOrange},
  copy:{flex:1,minWidth:0},
  start:{minHeight:48,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14,borderRadius:18,backgroundColor:'rgba(249,115,22,0.16)',borderWidth:1,borderColor:'rgba(249,115,22,0.18)'},
  startText:{...typography.button,color:palette.accentOrange},
  pressed:{opacity:.8,transform:[{scale:.98}]},
  title: {
    ...typography.heading,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    marginTop:2,
    color: 'rgba(248, 250, 252, 0.68)',
  },
});
