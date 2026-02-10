import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { Order, OrderStatus } from '@/types';
import Colors from '@/constants/colors';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: '#F59E0B', bg: '#FEF3C7' },
  processing: { label: 'Processing', color: Colors.warning, bg: Colors.warningLight },
  shipped: { label: 'Shipped', color: Colors.secondary, bg: Colors.secondaryLight },
  delivered: { label: 'Delivered', color: Colors.success, bg: Colors.successLight },
  cancelled: { label: 'Cancelled', color: Colors.error, bg: Colors.errorLight },
};

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const status = statusConfig[order.status];
  const previewImages = order.items.slice(0, 3);
  const formattedDate = new Date(order.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Pressable onPress={onPress} style={styles.container} testID={`order-${order.id}`}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.itemsRow}>
        <View style={styles.imageStack}>
          {previewImages.map((item, index) => (
            <View
              key={item.productId}
              style={[
                styles.imageWrapper,
                { marginLeft: index > 0 ? -12 : 0, zIndex: previewImages.length - index },
              ]}
            >
              <Image
                source={item.productImage}
                style={styles.itemImage}
                contentFit="cover"
              />
            </View>
          ))}
          {order.items.length > 3 && (
            <View style={[styles.imageWrapper, styles.moreItems, { marginLeft: -12 }]}>
              <Text style={styles.moreText}>+{order.items.length - 3}</Text>
            </View>
          )}
        </View>
        <View style={styles.totalArea}>
          <Text style={styles.totalLabel}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageStack: {
    flexDirection: 'row',
    flex: 1,
  },
  imageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.card,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  moreItems: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  totalArea: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
});
