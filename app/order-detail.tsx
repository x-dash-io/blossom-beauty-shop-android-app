import React, { useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Copy,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useOrders } from '@/providers/OrdersProvider';
import { useCart } from '@/providers/CartProvider';
import { useProducts } from '@/providers/ProductsProvider';
import { OrderStatus, OrderTrackingEvent } from '@/types';

const STATUS_STEPS: OrderStatus[] = ['processing', 'shipped', 'delivered'];

const statusMeta: Record<OrderStatus, { icon: typeof Package; label: string; color: string }> = {
  pending_payment: { icon: Clock, label: 'Awaiting Payment', color: '#F59E0B' },
  processing: { icon: Clock, label: 'Processing', color: Colors.warning },
  shipped: { icon: Truck, label: 'Shipped', color: Colors.secondary },
  delivered: { icon: CheckCircle, label: 'Delivered', color: Colors.success },
  cancelled: { icon: XCircle, label: 'Cancelled', color: Colors.error },
};

function getStepIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.indexOf(status);
}

function TimelineStep({
  step,
  index,
  currentIndex,
  isLast,
  event,
}: {
  step: OrderStatus;
  index: number;
  currentIndex: number;
  isLast: boolean;
  event?: OrderTrackingEvent;
}) {
  const isActive = index <= currentIndex;
  const isCurrent = index === currentIndex;
  const meta = statusMeta[step];
  const IconComponent = meta.icon;
  const dotScale = useRef(new Animated.Value(0)).current;
  const lineHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.spring(dotScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
    if (isActive && !isLast) {
      Animated.sequence([
        Animated.delay(index * 200 + 150),
        Animated.timing(lineHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isActive, index, isLast, dotScale, lineHeight]);

  const formattedDate = event
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineDotColumn}>
        <Animated.View
          style={[
            styles.timelineDot,
            isActive && { backgroundColor: meta.color, borderColor: meta.color },
            isCurrent && styles.timelineDotCurrent,
            { transform: [{ scale: isActive ? dotScale : 1 }] },
          ]}
        >
          {isActive && <IconComponent size={14} color={Colors.white} />}
        </Animated.View>
        {!isLast && (
          <View style={styles.timelineLineTrack}>
            <Animated.View
              style={[
                styles.timelineLineFill,
                {
                  backgroundColor: isActive ? meta.color : Colors.border,
                  height: lineHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </View>
      <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
        <Text
          style={[
            styles.timelineLabel,
            isActive && { color: Colors.textPrimary, fontWeight: '700' as const },
          ]}
        >
          {meta.label}
        </Text>
        {event && (
          <>
            <Text style={styles.timelineDate}>{formattedDate}</Text>
            <Text style={styles.timelineDescription}>{event.description}</Text>
          </>
        )}
        {!event && !isActive && (
          <Text style={styles.timelinePending}>Pending</Text>
        )}
      </View>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders } = useOrders();
  const { addItem } = useCart();
  const { getProductById } = useProducts();

  const order = useMemo(
    () => orders.find(o => o.id === id),
    [orders, id]
  );

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const formattedDate = new Date(order.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleReorder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    order.items.forEach(item => {
      const product = getProductById(item.productId);
      if (product) {
        addItem(product, item.quantity);
      }
    });
    router.back();
  };

  const handleCopyTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: isCancelled ? Colors.errorLight : statusMeta[order.status].color + '18' },
            ]}
          >
            {React.createElement(statusMeta[order.status].icon, {
              size: 28,
              color: statusMeta[order.status].color,
            })}
          </View>
          <Text style={styles.statusTitle}>
            {isCancelled ? 'Order Cancelled' : `Order ${statusMeta[order.status].label}`}
          </Text>
          <Text style={styles.orderDate}>{formattedDate}</Text>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        </View>

        {order.trackingNumber && (
          <Pressable onPress={handleCopyTracking} style={styles.trackingCard}>
            <View style={styles.trackingRow}>
              <View>
                <Text style={styles.trackingLabel}>Tracking Number</Text>
                <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
              </View>
              <Copy size={18} color={Colors.textMuted} />
            </View>
          </Pressable>
        )}

        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Timeline</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const event = order.trackingEvents?.find(e => e.status === step);
                return (
                  <TimelineStep
                    key={step}
                    step={step}
                    index={index}
                    currentIndex={currentStepIndex}
                    isLast={index === STATUS_STEPS.length - 1}
                    event={event}
                  />
                );
              })}
            </View>
          </View>
        )}

        {isCancelled && order.trackingEvents?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancellation Details</Text>
            {order.trackingEvents
              .filter(e => e.status === 'cancelled')
              .map((event, idx) => (
                <View key={idx} style={styles.cancelInfo}>
                  <XCircle size={16} color={Colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cancelDate}>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.cancelDescription}>{event.description}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {order.estimatedDelivery && !isCancelled && order.status !== 'delivered' && (
          <View style={styles.deliveryEstimate}>
            <Truck size={16} color={Colors.success} />
            <Text style={styles.deliveryEstimateText}>
              Estimated delivery:{' '}
              {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Items ({order.items.length})
          </Text>
          {order.items.map((item, index) => (
            <View
              key={item.productId}
              style={[
                styles.itemRow,
                index < order.items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <Image
                source={item.productImage}
                style={styles.itemImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemBrand}>{item.productBrand}</Text>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.itemQty}>× {item.quantity}</Text>
                </View>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <MapPin size={16} color={Colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressName}>{order.address.fullName}</Text>
              <Text style={styles.addressLine}>{order.address.street}</Text>
              <Text style={styles.addressLine}>
                {order.address.city}
                {order.address.state ? `, ${order.address.state}` : ''}
                {order.address.zipCode ? ` ${order.address.zipCode}` : ''}
              </Text>
              <Text style={styles.addressPhone}>{order.address.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

        <Pressable onPress={handleReorder} style={styles.reorderButton}>
          <RotateCcw size={18} color={Colors.white} />
          <Text style={styles.reorderText}>Reorder Items</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  statusHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    gap: 6,
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderId: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trackingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineDotColumn: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCurrent: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineLineTrack: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
    borderRadius: 1,
    overflow: 'hidden',
  },
  timelineLineFill: {
    width: '100%',
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 28,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  timelineDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  timelinePending: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
  },
  cancelInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  cancelDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cancelDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deliveryEstimateText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemBrand: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  addressPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  reorderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

});
