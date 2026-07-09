import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTextInput, EmptyState } from '@/src/components';
import { createSearchService, type SearchResult } from '@/src/services';
import { palette, radius, spacing, typography } from '@/src/theme';

type SearchSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
};

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

      const result = await searchService.search({ query, limit: 12 });

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
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Universal Search</Text>
              <Text style={styles.title}>Find anything local</Text>
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
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Motorcycles, service, rides"
          />

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
                title="Search AxionRide"
                description="Local motorcycles, maintenance records, and rides will appear here."
              />
            )}
          </ScrollView>
        </View>
      </View>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
  },
  sheet: {
    maxHeight: '82%',
    gap: spacing.lg,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
