import React, { useMemo, useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useProducts } from '@/providers/ProductsProvider';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds, toggleFavorite, isFavorite, isLoading: favLoading, refetch: refetchFavs } = useFavorites();
  const { products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = favLoading || productsLoading;

  const favoriteProducts = useMemo(
    () => products.filter(p => favoriteIds.includes(p.id)),
    [favoriteIds, products]
  );

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({ pathname: '/product', params: { id: productId } });
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFavs(), refetchProducts()]);
    setRefreshing(false);
  }, [refetchFavs, refetchProducts]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Favorites</Text>
          {favoriteProducts.length > 0 && (
            <Text style={styles.itemCount}>
              {favoriteProducts.length} item
              {favoriteProducts.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

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
          ) : favoriteProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Heart size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptySubtitle}>
                Save products you love by tapping the heart icon
              </Text>
              <Pressable
                onPress={() => router.navigate('/' as never)}
                style={styles.shopButton}
              >
                <Text style={styles.shopButtonText}>Browse Products</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {favoriteProducts.map(product => (
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
