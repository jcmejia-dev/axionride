import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AxionRideLogo } from '@/src/components';
import { palette, radius, spacing, typography } from '@/src/theme';

const highlights = [
  { title: 'Your garage', description: 'Keep every motorcycle organized and ready.', icon: { ios: 'motorcycle.fill', android: 'two_wheeler', web: 'two_wheeler' } },
  { title: 'Ride tracking', description: 'Capture routes, distance, time, and speed.', icon: { ios: 'road.lanes', android: 'route', web: 'route' } },
  { title: 'Maintenance', description: 'Stay ahead of service with local records.', icon: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' } },
  { title: 'Rider insights', description: 'Turn real rides into useful statistics.', icon: { ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' } },
] as const;

export function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glow} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AxionRideLogo variant="symbol" style={styles.logo} imageStyle={styles.logoImage} />
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Built for the road</Text>
          <Text style={styles.title}>Own every ride.</Text>
          <Text style={styles.description}>Your private, offline-first command center for motorcycles, routes, and maintenance.</Text>
        </View>
        <View style={styles.card}>
          {highlights.map((item, index) => (
            <View key={item.title} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.iconWrap}><SymbolView name={item.icon} tintColor={palette.accentOrange} size={22} /></View>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowDescription}>{item.description}</Text></View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="rgba(247,248,250,.28)" size={18} />
            </View>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/tour')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Explore AxionRide</Text><SymbolView name={{ios:'arrow.right',android:'arrow_forward',web:'arrow_forward'}} tintColor="#fff" size={20}/></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:palette.darkBackground},screen:{flex:1},content:{flexGrow:1,paddingHorizontal:spacing.xl,paddingTop:spacing.xl,paddingBottom:spacing.xxxl,gap:spacing.xl},
  glow:{position:'absolute',top:-150,right:-130,width:330,height:330,borderRadius:165,backgroundColor:'rgba(255,106,0,.08)'},
  logo:{alignSelf:'center',marginTop:spacing.md},logoImage:{width:190,height:104,marginBottom:0},
  hero:{gap:spacing.sm},eyebrow:{...typography.label,color:palette.accentOrange,textTransform:'uppercase',letterSpacing:1.5},title:{color:palette.text,fontSize:38,lineHeight:43,fontWeight:'900',letterSpacing:-1.2},description:{...typography.body,color:palette.textMuted,lineHeight:24,maxWidth:520},
  card:{overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.10)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.88)'},
  row:{minHeight:82,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.lg,paddingVertical:spacing.md},rowBorder:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.07)'},iconWrap:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'rgba(255,106,0,.12)'},rowCopy:{flex:1,minWidth:0,gap:3},rowTitle:{...typography.body,color:palette.text,fontWeight:'800'},rowDescription:{...typography.caption,color:palette.textMuted},
  button:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,borderRadius:radius.lg,backgroundColor:palette.accentOrange,shadowColor:palette.accentOrange,shadowOpacity:.28,shadowRadius:18,elevation:5},buttonText:{...typography.button,color:'#fff'},pressed:{opacity:.86,transform:[{scale:.985}]},
});
