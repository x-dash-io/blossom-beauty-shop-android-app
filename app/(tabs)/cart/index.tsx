import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import CartItemCard from '@/components/CartItemCard';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const checkoutScale = useRef(new Animated.Value(1)).current;

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleCheckoutPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(checkoutScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(checkoutScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        router.push('/checkout');
      }
    });
  }, [checkoutScale, isAuthenticated, router]);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Browse our collection and add your favorite products
            </Text>
            <Pressable
              onPress={() => router.navigate('/' as never)}
              style={styles.shopButton}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.itemCount}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.itemsList}>
            {items.map(item => (
              <CartItemCard
                key={item.product.id}
                item={item}
                onUpdateQuantity={qty => updateQuantity(item.product.id, qty)}
                onRemove={() => removeItem(item.product.id)}
              />
            ))}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </Text>
            </View>
            {shipping > 0 && (
              <Text style={styles.freeShippingNote}>
                Add ${(50 - subtotal).toFixed(2)} more for free shipping
              </Text>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.checkoutSection}>
          <Animated.View style={{ transform: [{ scale: checkoutScale }] }}>
            <Pressable
              onPress={handleCheckoutPress}
              style={styles.checkoutButton}
              testID="checkout-button"
            >
              <Text style={styles.checkoutButtonText}>
                Proceed to Checkout
              </Text>
            </Pressable>
          </Animated.View>
        </View>
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
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  freeShippingNote: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 10,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  checkoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
