import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CartItem } from '@/types';
import Colors from '@/constants/colors';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export default function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const qtyScale = useRef(new Animated.Value(1)).current;
  const prevQty = useRef(item.quantity);

  useEffect(() => {
    if (item.quantity !== prevQty.current) {
      prevQty.current = item.quantity;
      Animated.sequence([
        Animated.spring(qtyScale, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
        Animated.spring(qtyScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start();
    }
  }, [item.quantity, qtyScale]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onRemove());
  }, [fadeAnim, onRemove]);

  const handleQuantityChange = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdateQuantity(item.quantity + delta);
    },
    [item.quantity, onUpdateQuantity]
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={item.product.images[0]}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.details}>
        <View style={styles.topRow}>
          <View style={styles.textArea}>
            <Text style={styles.brand}>{item.product.brand}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.product.name}
            </Text>
          </View>
          <Pressable onPress={handleRemove} hitSlop={8} style={styles.removeButton}>
            <Trash2 size={16} color={Colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            ${(item.product.price * item.quantity).toFixed(2)}
          </Text>
          <View style={styles.quantityControl}>
            <Pressable
              onPress={() => handleQuantityChange(-1)}
              style={[styles.qtyButton, item.quantity <= 1 && styles.qtyButtonDisabled]}
              disabled={item.quantity <= 1}
            >
              <Minus size={14} color={item.quantity <= 1 ? Colors.textMuted : Colors.textPrimary} />
            </Pressable>
            <Animated.Text style={[styles.quantityText, { transform: [{ scale: qtyScale }] }]}>{item.quantity}</Animated.Text>
            <Pressable
              onPress={() => handleQuantityChange(1)}
              style={styles.qtyButton}
            >
              <Plus size={14} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textArea: {
    flex: 1,
    marginRight: 8,
  },
  brand: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
