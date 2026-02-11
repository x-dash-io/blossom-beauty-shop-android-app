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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, Bell, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Product } from '@/types';
import { useRecentlyViewed } from '@/providers/RecentlyViewedProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useProducts } from '@/providers/ProductsProvider';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import PromoBanner from '@/components/PromoBanner';
import { HomeContentSkeleton } from '@/components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const {
    getFeaturedProducts,
    getNewProducts,
    getProductById,
    categories,
    banners,
    isLoading,
    hasError,
    refetch,
  } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const { viewedIds } = useRecentlyViewed();

  const featuredProducts = useMemo(() => getFeaturedProducts(), [getFeaturedProducts]);
  const newProducts = useMemo(() => getNewProducts(), [getNewProducts]);
  const recentlyViewedProducts = useMemo(
    () => viewedIds.slice(0, 10).map(id => getProductById(id)).filter((p): p is Product => !!p),
    [viewedIds, getProductById]
  );

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push({ pathname: '/product', params: { id: productId } });
    },
    [router]
  );

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      router.push({ pathname: '/category', params: { id: categoryId } });
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
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.brandName}>Blossom Beauty</Text>
            </View>
            <Pressable
              style={styles.bellButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <Pressable
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            testID="search-bar"
          >
            <Search size={18} color={Colors.textMuted} />
            <Text style={styles.searchPlaceholder}>
              Search products, brands...
            </Text>
          </Pressable>

          <LinearGradient
            colors={[Colors.primary, '#F66BB1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroRow}>
              <View>
                <View style={styles.heroBadge}>
                  <Sparkles size={12} color={Colors.white} />
                  <Text style={styles.heroBadgeText}>Weekly glow pick</Text>
                </View>
                <Text style={styles.heroTitle}>Build your perfect skincare ritual</Text>
                <Text style={styles.heroSubtitle}>Curated formulas for hydration, tone, and barrier repair.</Text>
              </View>
              <Pressable
                style={styles.heroCta}
                onPress={() => router.push('/search')}
              >
                <Text style={styles.heroCtaText}>Explore</Text>
                <ArrowRight size={14} color={Colors.white} />
              </Pressable>
            </View>
          </LinearGradient>

          {hasError && !isLoading && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Limited connectivity</Text>
              <Text style={styles.warningSubtitle}>
                Some products may be from offline catalog. Pull to refresh anytime.
              </Text>
            </View>
          )}

          {isLoading && !refreshing ? (
            <HomeContentSkeleton />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannersContent}
                style={styles.bannersSection}
              >
                {banners.map(banner => (
                  <PromoBanner key={banner.id} banner={banner} />
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shop by Category</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContent}
              >
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onPress={() => handleCategoryPress(category.id)}
                  />
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured for You</Text>
              </View>
              <View style={styles.productGrid}>
                {featuredProducts.map(product => (
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

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Just Landed</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newArrivalsContent}
              >
                {newProducts.map(product => (
                  <View key={product.id} style={{ width: 160, marginRight: 12 }}>
                    <ProductCard
                      product={product}
                      onPress={() => handleProductPress(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                      isFavorite={isFavorite(product.id)}
                    />
                  </View>
                ))}
              </ScrollView>

              {recentlyViewedProducts.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recently Viewed</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.newArrivalsContent}
                  >
                    {recentlyViewedProducts.map(product => (
                      <View key={product.id} style={{ width: 160, marginRight: 12 }}>
                        <ProductCard
                          product={product}
                          onPress={() => handleProductPress(product.id)}
                          onToggleFavorite={() => toggleFavorite(product.id)}
                          isFavorite={isFavorite(product.id)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={styles.footerSpacer} />
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
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  bannersSection: {
    marginBottom: 24,
  },
  bannersContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  newArrivalsContent: {
    paddingHorizontal: 20,
  },

  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  heroRow: {
    gap: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 19,
  },
  heroCta: {
    marginTop: 2,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  heroCtaText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  warningCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.warningLight,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  warningSubtitle: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 17,
  },
  footerSpacer: {
    height: 24,
  },
});
