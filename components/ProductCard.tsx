import React, { useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Star, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Product } from '@/types';
import Colors from '@/constants/colors';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  width?: number;
}

export default function ProductCard({
  product,
  onPress,
  onToggleFavorite,
  isFavorite,
  width,
}: ProductCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }, width ? { width } : undefined]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        testID={`product-card-${product.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${product.name} by ${product.brand}`}
      >
        <View style={styles.imageContainer}>
          <Image
            source={product.images[0]}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {!product.inStock && <View style={styles.outOfStockOverlay} />}
          {!product.inStock && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>Out of Stock</Text>
            </View>
          )}
          {product.inStock && product.stockQuantity !== undefined && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <View style={[styles.stockBadge, styles.lowStockBadge]}>
              <Text style={styles.stockBadgeText}>Only {product.stockQuantity} left</Text>
            </View>
          )}
          {product.isNew && (
            <View style={styles.newBadge}>
              <Sparkles size={10} color={Colors.white} />
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
          {onToggleFavorite && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Animated.sequence([
                  Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, friction: 3 }),
                  Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
                ]).start();
                onToggleFavorite();
              }}
              style={styles.heartButton}
              hitSlop={8}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={16}
                  color={isFavorite ? Colors.error : Colors.textMuted}
                  fill={isFavorite ? Colors.error : 'transparent'}
                />
              </Animated.View>
            </Pressable>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={11} color={Colors.rating} fill={Colors.rating} />
            <Text style={styles.ratingText}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.inStock ? <Text style={styles.stockPill}>In stock</Text> : <Text style={styles.stockPillMuted}>Sold out</Text>}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: Colors.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 3,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 1,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(201, 118, 118, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  lowStockBadge: {
    backgroundColor: 'rgba(212, 169, 106, 0.9)',
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  info: {
    padding: 10,
  },

  newBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  brand: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  price: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  stockPill: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.success,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  stockPillMuted: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
});
