import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTextInput, EmptyState } from '@/src/components';
import { createSearchService, type SearchResult } from '@/src/services';
import { palette, radius, spacing, typography } from '@/src/theme';

type SearchSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
};

const motorcycleBrands=[
  {name:'Skygo',logo:require('../../../../assets/images/brands/skygo.png')},
  {name:'RUSI',logo:require('../../../../assets/images/brands/rusi.png')},
  {name:'MotorStar',logo:require('../../../../assets/images/brands/motorstar.png')},
  {name:'Bristol',logo:require('../../../../assets/images/brands/bristol.png')},
  {name:'Honda',logo:require('../../../../assets/images/brands/honda.png')},
  {name:'Yamaha',logo:require('../../../../assets/images/brands/yamaha.png')},
  {name:'Kawasaki',logo:require('../../../../assets/images/brands/kawasaki.png')},
  {name:'CFMOTO',logo:require('../../../../assets/images/brands/cfmoto.png')},
  {name:'Keeway',logo:require('../../../../assets/images/brands/keeway.png')},
  {name:'BMW',logo:require('../../../../assets/images/brands/bmw.png')},
  {name:'Ducati',logo:require('../../../../assets/images/brands/ducati.png')},
  {name:'KTM',logo:require('../../../../assets/images/brands/ktm.png')},
  {name:'Triumph',logo:require('../../../../assets/images/brands/triumph.png')},
  {name:'Harley-Davidson',logo:require('../../../../assets/images/brands/harley.png')},
  {name:'Royal Enfield',logo:require('../../../../assets/images/brands/royal_enfield.png')},
  {name:'Aprilia',logo:require('../../../../assets/images/brands/aprilia.png')},
] as const;

export function SearchSheet({ visible, onClose }: SearchSheetProps) {
  const searchService = useMemo(() => createSearchService(), []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let active = true;

    async function runSearch() {
      if (!visible) {
        return;
      }

      const result = await searchService.search({ query, limit: 50 });

      if (!active) {
        return;
      }

      if (result.ok) {
        setResults(result.value.results);
        setSearched(result.value.query.length > 0);
      }
    }

    void runSearch();

    return () => {
      active = false;
    };
  }, [query, searchService, visible]);

  function handleClose() {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS==='ios'?'padding':'height'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Universal Search</Text>
              <Text style={styles.title}>Find your next detail</Text>
            </View>
            <Pressable
              accessibilityLabel="Close search"
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={palette.text} size={18} />
            </Pressable>
          </View>

          <AppTextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search your garage, rides, or service"
            leadingIcon={<SymbolView name={{ios:'magnifyingglass',android:'search',web:'search'}} tintColor={palette.accentOrange} size={20}/>}
          />

          <View><Text style={styles.brandHeading}>MOTORCYCLE BRANDS</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.brands}>{motorcycleBrands.map((brand)=><Pressable key={brand.name} accessibilityRole="button" onPress={()=>setQuery(brand.name)} style={({pressed})=>[styles.brand,query.toLowerCase()===brand.name.toLowerCase()&&styles.brandSelected,pressed&&styles.pressed]}><View style={styles.brandMark}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={brand.logo} style={styles.brandLogo}/></View><Text numberOfLines={1} style={styles.brandName}>{brand.name}</Text></Pressable>)}</ScrollView></View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
            {results.length > 0 ? (
              results.map((result) => <SearchResultRow key={`${result.type}-${result.id}`} result={result} />)
            ) : searched ? (
              <EmptyState
                title="No local results"
                description="Try searching for a motorcycle, maintenance task, or ride title."
              />
            ) : (
              <EmptyState
                title="Your garage is ready"
                description="All local motorcycles appear here by brand. Search to include service records and rides."
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SearchResultRow({ result }: { readonly result: SearchResult }) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultIcon}>
        <SymbolView name={getResultIcon(result.type)} tintColor={palette.text} size={20} />
      </View>
      <View style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{result.title}</Text>
        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
        {result.metadata ? <Text style={styles.resultMeta}>{result.metadata}</Text> : null}
      </View>
      <Text style={styles.typeLabel}>{result.type}</Text>
    </View>
  );
}

function getResultIcon(type: SearchResult['type']) {
  switch (type) {
    case 'motorcycle':
      return { ios: 'wrench.and.screwdriver.fill', android: 'two_wheeler', web: 'two_wheeler' } as const;
    case 'maintenance':
      return { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' } as const;
    case 'ride':
      return { ios: 'road.lanes', android: 'route', web: 'route' } as const;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop:Platform.OS==='ios'?54:34,
    paddingHorizontal:spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
  },
  sheet: {
    maxHeight: '78%',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#090B0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  kicker: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.54)',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.subheading,
    marginTop: spacing.xs,
    color: palette.text,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  results: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  brandHeading:{...typography.label,color:'rgba(248,250,252,.48)',letterSpacing:.8,marginBottom:spacing.sm},brands:{gap:spacing.sm,paddingRight:spacing.xl},brand:{width:104,alignItems:'center',gap:8,padding:10,borderWidth:1,borderColor:'rgba(255,255,255,.08)',borderRadius:16,backgroundColor:'rgba(255,255,255,.04)'},brandSelected:{borderColor:'rgba(255,106,0,.5)',backgroundColor:'rgba(255,106,0,.09)'},brandMark:{width:72,height:48,alignItems:'center',justifyContent:'center',padding:6,borderRadius:12,backgroundColor:'rgba(255,255,255,.92)'},brandLogo:{width:'100%',height:'100%'},brandName:{...typography.label,color:palette.text,textAlign:'center'},
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  resultIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: '800',
  },
  resultSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.62)',
  },
  resultMeta: {
    ...typography.label,
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.42)',
    textTransform: 'uppercase',
  },
  typeLabel: {
    ...typography.label,
    color: 'rgba(248, 250, 252, 0.42)',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});
