import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/src/theme';

export function MaintenanceHeader({ onAdd }: { readonly onAdd: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}><View style={styles.accent}/><View style={styles.copy}><Text style={styles.title}>Maintenance</Text><Text style={styles.subtitle}>Keep your ride in perfect condition</Text></View><Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add maintenance" style={({pressed})=>[styles.add,pressed&&styles.pressed]}><SymbolView name={{ios:'plus',android:'add',web:'add'}} tintColor={palette.accentOrange} size={28}/></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row:{flexDirection:'row',alignItems:'center',gap:spacing.md},
  accent:{width:5,height:34,borderRadius:3,backgroundColor:palette.accentOrange},
  copy:{flex:1,minWidth:0},
  add:{width:52,height:52,alignItems:'center',justifyContent:'center',borderRadius:26,backgroundColor:'rgba(255,255,255,.055)'},
  pressed:{opacity:.75,transform:[{scale:.96}]},
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
