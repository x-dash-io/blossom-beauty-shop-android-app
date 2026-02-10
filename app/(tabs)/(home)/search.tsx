import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useProducts } from '@/providers/ProductsProvider';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';
import { useProductFilter } from '@/hooks/useProductFilter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function SearchScreen() {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { searchProducts } = useProducts();
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<TextInput>(null);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchProducts(query.trim());
  }, [query, searchProducts]);

  const {
    filtered,
    sortBy, setSortBy,
    priceRange, setPriceRange,
    ratingFilter, setRatingFilter,
    activeCount, reset,
  } = useProductFilter(results);

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({ pathname: '/product', params: { id: productId } });
    },
    [router]
  );

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.searchHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.searchInputWrapper}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search products, brands..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              testID="search-input"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); reset(); }} hitSlop={8}>
                <X size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {hasResults && (
          <FilterBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            ratingFilter={ratingFilter}
            onRatingChange={setRatingFilter}
            activeCount={activeCount}
            onReset={reset}
          />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {!hasQuery ? (
            <View style={styles.emptyState}>
              <Search size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Search for beauty</Text>
              <Text style={styles.emptySubtitle}>
                Find your favorite products by name, brand, or category
              </Text>
            </View>
          ) : !hasResults ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {activeCount > 0 ? ` (filtered from ${results.length})` : ''}
              </Text>
              <View style={styles.productGrid}>
                {filtered.map(product => (
                  <View key={product.id} style={{ width: CARD_WIDTH }}>
                    <ProductCard
                      product={product}
                      onPress={() => handleProductPress(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                      isFavorite={isFavorite(product.id)}
                    />
                  </View>
                ))}
              </View>
              {filtered.length === 0 && results.length > 0 && (
                <View style={styles.noFilterResults}>
                  <Text style={styles.noFilterResultsText}>No products match your filters</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  noFilterResults: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  noFilterResultsText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
