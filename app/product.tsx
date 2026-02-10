import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, Star, ShoppingBag, Check, Pencil, ThumbsUp, ChevronRight, Share2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useReviews } from '@/providers/ReviewsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useProducts } from '@/providers/ProductsProvider';
import { Review } from '@/types';
import { useRecentlyViewed } from '@/providers/RecentlyViewedProvider';
import ImageZoomModal from '@/components/ImageZoomModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: () => void }) {
  const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {review.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{review.userName}</Text>
          <Text style={styles.reviewDate}>{formattedDate}</Text>
        </View>
        <View style={styles.reviewStarsSmall}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={12}
              color={Colors.rating}
              fill={star <= review.rating ? Colors.rating : 'transparent'}
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewTitle}>{review.title}</Text>
      <Text style={styles.reviewBody}>{review.body}</Text>
      <Pressable onPress={onHelpful} style={styles.helpfulButton}>
        <ThumbsUp size={13} color={Colors.textMuted} />
        <Text style={styles.helpfulText}>
          Helpful{review.helpful > 0 ? ` (${review.helpful})` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.ratingBarCount}>{count}</Text>
    </View>
  );
}

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getProductReviews, markHelpful } = useReviews();
  const { isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { addRecentlyViewed } = useRecentlyViewed();

  const { getProductById } = useProducts();
  const product = useMemo(() => getProductById(id || ''), [id, getProductById]);
  const reviews = useMemo(() => getProductReviews(id || ''), [id, getProductReviews]);

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const key = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof typeof dist;
      dist[key]++;
    });
    return dist;
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return product?.rating ?? 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews, product]);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  useEffect(() => {
    if (id) {
      addRecentlyViewed(id);
    }
  }, [id, addRecentlyViewed]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      setCurrentImageIndex(index);
    },
    []
  );

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem(product);
    setAddedToCart(true);
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, addItem, buttonScale]);

  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(product.id);
  }, [product, toggleFavorite]);

  const handleWriteReview = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push({ pathname: '/write-review', params: { productId: id || '' } });
  }, [isAuthenticated, router, id]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} by ${product.brand} on Blossom! ${product.price.toFixed(2)}`,
        title: product.name,
      });
    } catch (error) {
      console.log('[Product] Share error:', error);
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const favorite = isFavorite(product.id);
  const totalReviewCount = reviews.length > 0 ? reviews.length : product.reviewCount;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((img, index) => (
              <Pressable key={index} onPress={() => setZoomIndex(index)}>
                <Image
                  source={img}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={300}
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.overlayTop, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.overlayButton}>
              <ArrowLeft size={20} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.overlayRight}>
              <Pressable onPress={handleShare} style={styles.overlayButton}>
                <Share2 size={20} color={Colors.textPrimary} />
              </Pressable>
              <Pressable onPress={handleToggleFavorite} style={styles.overlayButton}>
                <Heart
                  size={20}
                  color={favorite ? Colors.error : Colors.textPrimary}
                  fill={favorite ? Colors.error : 'transparent'}
                />
              </Pressable>
            </View>
          </View>

          {product.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <Pressable onPress={() => { /* scroll to reviews */ }} style={styles.ratingRow}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={14}
                  color={Colors.rating}
                  fill={
                    star <= Math.round(avgRating)
                      ? Colors.rating
                      : 'transparent'
                  }
                />
              ))}
            </View>
            <Text style={styles.ratingValue}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({totalReviewCount} reviews)
            </Text>
          </Pressable>

          <Text style={styles.price}>${product.price.toFixed(2)}</Text>

          {!product.inStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
            </View>
          )}
          {product.inStock && product.stockQuantity !== undefined && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Only {product.stockQuantity} left in stock</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {product.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.reviewsDivider} />

          <View style={styles.reviewsSectionHeader}>
            <Text style={styles.reviewsSectionTitle}>Reviews</Text>
            <Pressable onPress={handleWriteReview} style={styles.writeReviewButton}>
              <Pencil size={14} color={Colors.primary} />
              <Text style={styles.writeReviewText}>Write</Text>
            </Pressable>
          </View>

          {reviews.length > 0 ? (
            <>
              <View style={styles.ratingOverview}>
                <View style={styles.ratingOverviewLeft}>
                  <Text style={styles.ratingBig}>{avgRating.toFixed(1)}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        color={Colors.rating}
                        fill={star <= Math.round(avgRating) ? Colors.rating : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingTotal}>{reviews.length} reviews</Text>
                </View>
                <View style={styles.ratingBars}>
                  {([5, 4, 3, 2, 1] as const).map(star => (
                    <RatingBar
                      key={star}
                      label={`${star}`}
                      count={ratingDistribution[star]}
                      total={reviews.length}
                    />
                  ))}
                </View>
              </View>

              {displayedReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onHelpful={() => markHelpful(review.id)}
                />
              ))}

              {reviews.length > 3 && !showAllReviews && (
                <Pressable
                  onPress={() => setShowAllReviews(true)}
                  style={styles.showAllButton}
                >
                  <Text style={styles.showAllText}>
                    See all {reviews.length} reviews
                  </Text>
                  <ChevronRight size={16} color={Colors.primary} />
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.noReviews}>
              <Star size={24} color={Colors.border} />
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsSubtext}>
                Be the first to share your experience
              </Text>
              <Pressable onPress={handleWriteReview} style={styles.firstReviewButton}>
                <Pencil size={14} color={Colors.white} />
                <Text style={styles.firstReviewButtonText}>Write a Review</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Price</Text>
          <Text style={styles.bottomPriceValue}>
            ${product.price.toFixed(2)}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.addToCartWrapper,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <Pressable
            onPress={product.inStock ? handleAddToCart : undefined}
            style={[
              styles.addToCartButton,
              addedToCart && styles.addedButton,
              !product.inStock && styles.disabledButton,
            ]}
            testID="add-to-cart"
          >
            {addedToCart ? (
              <Check size={20} color={Colors.white} />
            ) : (
              <ShoppingBag size={20} color={!product.inStock ? Colors.textMuted : Colors.white} />
            )}
            <Text style={[styles.addToCartText, !product.inStock && styles.disabledButtonText]}>
              {!product.inStock ? 'Out of Stock' : addedToCart ? 'Added' : 'Add to Cart'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
      <ImageZoomModal
        visible={zoomIndex !== null}
        images={product.images}
        initialIndex={zoomIndex ?? 0}
        onClose={() => setZoomIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  errorButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  imageSection: {
    backgroundColor: Colors.card,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  overlayRight: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  overlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.5,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: Colors.primary,
    width: 20,
  },
  infoSection: {
    padding: 20,
  },
  brand: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reviewsDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 20,
    marginBottom: 20,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  writeReviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingOverview: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  ratingOverviewLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    gap: 4,
  },
  ratingBig: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  ratingTotal: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  ratingBars: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    width: 12,
    textAlign: 'center',
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.rating,
  },
  ratingBarCount: {
    fontSize: 11,
    color: Colors.textMuted,
    width: 20,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  reviewMeta: {
    flex: 1,
    marginLeft: 10,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  reviewStarsSmall: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reviewBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 4,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  firstReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    marginTop: 8,
  },
  firstReviewButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPrice: {
    marginRight: 16,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addToCartWrapper: {
    flex: 1,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  addedButton: {
    backgroundColor: Colors.success,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  outOfStockBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    marginBottom: 12,
  },
  outOfStockBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  lowStockBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    marginBottom: 12,
  },
  lowStockBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  disabledButtonText: {
    color: Colors.textMuted,
  },
});
