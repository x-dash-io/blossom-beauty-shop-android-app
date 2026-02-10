import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useProducts } from '@/providers/ProductsProvider';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';
import { useProductFilter } from '@/hooks/useProductFilter';
import { ProductGridSkeleton } from '@/components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { categories, getProductsByCategory, isLoading, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const category = useMemo(() => categories.find(c => c.id === id), [id, categories]);
  const categoryProducts = useMemo(
    () => getProductsByCategory(id || ''),
    [id, getProductsByCategory]
  );

  const {
    filtered,
    sortBy, setSortBy,
    priceRange, setPriceRange,
    ratingFilter, setRatingFilter,
    activeCount, reset,
  } = useProductFilter(categoryProducts);

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({ pathname: '/product', params: { id: productId } });
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: category?.name || 'Products' }} />
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <>
            <Text style={styles.resultCount}>
              {filtered.length} product
              {filtered.length !== 1 ? 's' : ''}
              {activeCount > 0 ? ` (filtered from ${categoryProducts.length})` : ''}
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
            {filtered.length === 0 && categoryProducts.length > 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No products match your filters</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
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
  noResults: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
