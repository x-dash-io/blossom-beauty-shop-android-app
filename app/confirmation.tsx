import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ShoppingBag, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ConfirmationScreen() {
  const { orderId, paymentMethod, receiptNumber: receiptNum } = useLocalSearchParams<{
    orderId: string;
    paymentMethod?: string;
    receiptNumber?: string;
  }>();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleContinueShopping = () => {
    router.dismissAll();
  };

  const handleViewOrders = () => {
    router.dismissAll();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.checkCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.checkInner}>
              <Check size={40} color={Colors.white} strokeWidth={3} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
            <Text style={styles.title}>
              {paymentMethod === 'mpesa' ? 'Payment Successful' : 'Order Confirmed'}
            </Text>
            <Text style={styles.subtitle}>
              {paymentMethod === 'mpesa'
                ? 'Your M-Pesa payment has been confirmed and your order is being prepared.'
                : 'Your order has been placed successfully. We will send you a notification when it ships.'}
            </Text>

            {orderId && (
              <View style={styles.orderIdCard}>
                <Text style={styles.orderIdLabel}>Order Number</Text>
                <Text style={styles.orderIdValue}>
                  #{orderId.slice(-6).toUpperCase()}
                </Text>
              </View>
            )}

            {receiptNum ? (
              <View style={styles.receiptCard}>
                <Text style={styles.receiptLabel}>M-Pesa Receipt</Text>
                <Text style={styles.receiptValue}>{receiptNum}</Text>
              </View>
            ) : null}

            <View style={styles.deliveryInfo}>
              <Package size={16} color={Colors.textMuted} />
              <Text style={styles.deliveryText}>
                Estimated delivery: 3-5 business days
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
            <Pressable
              onPress={handleContinueShopping}
              style={styles.primaryButton}
            >
              <ShoppingBag size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Continue Shopping</Text>
            </Pressable>

            <Pressable
              onPress={handleViewOrders}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>View Orders</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  checkInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  orderIdCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderIdLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  receiptCard: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  receiptLabel: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  receiptValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1B5E20',
    letterSpacing: 1,
  },
});
