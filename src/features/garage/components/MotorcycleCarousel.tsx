import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { spacing } from '@/src/theme';

import { MotorcycleHeroCard } from './MotorcycleHeroCard';

type MotorcycleCarouselProps = {
  motorcycles: readonly Motorcycle[];
  primaryMotorcycleId: string | null;
  onEdit: (id: string) => void;
  onSetPrimary: (id: string) => void;
};

export function MotorcycleCarousel({ motorcycles, primaryMotorcycleId, onEdit, onSetPrimary }: MotorcycleCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.xl * 2, 420);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardWidth + spacing.lg}
        contentContainerStyle={styles.content}>
        {motorcycles.map((motorcycle) => (
          <MotorcycleHeroCard
            key={motorcycle.id}
            motorcycle={motorcycle}
            primary={motorcycle.id === primaryMotorcycleId}
            onPress={() => onEdit(motorcycle.id)}
            onSetPrimary={() => onSetPrimary(motorcycle.id)}
            width={cardWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -spacing.xl,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
