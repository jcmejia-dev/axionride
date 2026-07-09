import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { spacing } from '@/src/theme';

import { getGarageStatus } from '../data/mockGarage';
import { MotorcycleHeroCard } from './MotorcycleHeroCard';

type MotorcycleCarouselProps = {
  motorcycles: readonly Motorcycle[];
};

export function MotorcycleCarousel({ motorcycles }: MotorcycleCarouselProps) {
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
            status={getGarageStatus(motorcycle.id)}
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
