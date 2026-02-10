import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { ArrowDownUp, Star, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { SortOption, PriceRange, RatingFilter } from '@/hooks/useProductFilter';

const SORT_CYCLE: SortOption[] = ['default', 'price_asc', 'price_desc', 'rating', 'newest'];
const SORT_LABELS: Record<SortOption, string> = {
  default: 'Sort',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
  rating: 'Top Rated',
  newest: 'Newest',
};

const PRICE_CYCLE: PriceRange[] = ['all', '0-25', '25-50', '50-100', '100+'];
const PRICE_LABELS: Record<PriceRange, string> = {
  all: 'Price',
  '0-25': 'Under $25',
  '25-50': '$25–50',
  '50-100': '$50–100',
  '100+': '$100+',
};

const RATING_CYCLE: RatingFilter[] = ['all', '4+', '3+'];
const RATING_LABELS: Record<RatingFilter, string> = {
  all: 'Rating',
  '4+': '4★+',
  '3+': '3★+',
};

function cycleNext<T>(current: T, options: T[]): T {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length];
}

function Chip({ label, active, onPress, icon }: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  priceRange: PriceRange;
  onPriceChange: (p: PriceRange) => void;
  ratingFilter: RatingFilter;
  onRatingChange: (r: RatingFilter) => void;
  activeCount: number;
  onReset: () => void;
}

export default function FilterBar({
  sortBy,
  onSortChange,
  priceRange,
  onPriceChange,
  ratingFilter,
  onRatingChange,
  activeCount,
  onReset,
}: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip
        label={SORT_LABELS[sortBy]}
        active={sortBy !== 'default'}
        onPress={() => onSortChange(cycleNext(sortBy, SORT_CYCLE))}
        icon={
          <ArrowDownUp
            size={13}
            color={sortBy !== 'default' ? Colors.white : Colors.textSecondary}
          />
        }
      />
      <Chip
        label={PRICE_LABELS[priceRange]}
        active={priceRange !== 'all'}
        onPress={() => onPriceChange(cycleNext(priceRange, PRICE_CYCLE))}
      />
      <Chip
        label={RATING_LABELS[ratingFilter]}
        active={ratingFilter !== 'all'}
        onPress={() => onRatingChange(cycleNext(ratingFilter, RATING_CYCLE))}
        icon={
          <Star
            size={12}
            color={ratingFilter !== 'all' ? Colors.white : Colors.textSecondary}
            fill={ratingFilter !== 'all' ? Colors.white : 'transparent'}
          />
        }
      />
      {activeCount > 0 && (
        <Chip
          label="Clear"
          active={false}
          onPress={onReset}
          icon={<X size={13} color={Colors.error} />}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
});
