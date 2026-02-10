import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, CreditCard, Truck, ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { useOrders } from '@/providers/OrdersProvider';
import { useAuth } from '@/providers/AuthProvider';
import { fetchUserAddresses } from '@/lib/supabase-db';
import { Address, Order, PaymentMethod } from '@/types';
import { isValidKenyanPhone } from '@/lib/mpesa';

interface SavedAddress {
  id: number;
  user_id: string;
  full_name: string;
  street: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  phone: string;
  is_default: boolean;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[Checkout] Guest user redirected to login');
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const [address, setAddress] = useState<Address>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState<string>('');

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchUserAddresses(user.id);
    },
    enabled: !!user?.id,
  });

  const savedAddresses = useMemo(
    () => (addressesQuery.data ?? []) as SavedAddress[],
    [addressesQuery.data]
  );

  const hasAutoSelected = React.useRef(false);
  useEffect(() => {
    if (savedAddresses.length > 0 && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      const defaultAddr = savedAddresses.find(a => a.is_default) ?? savedAddresses[0];
      if (defaultAddr) {
        setSelectedSavedId(defaultAddr.id);
        setAddress({
          fullName: defaultAddr.full_name,
          street: defaultAddr.street,
          city: defaultAddr.city,
          state: defaultAddr.state ?? '',
          zipCode: defaultAddr.zip_code ?? '',
          phone: defaultAddr.phone,
        });
      }
    }
  }, [savedAddresses]);

  useEffect(() => {
    if (address.phone && paymentMethod === 'mpesa') {
      const cleaned = address.phone.replace(/[\s\-\+]/g, '');
      if (/^(0[17]\d{8}|254[17]\d{8})$/.test(cleaned) && !mpesaPhone) {
        setMpesaPhone(address.phone);
      }
    }
  }, [address.phone, paymentMethod, mpesaPhone]);

  const selectSavedAddress = useCallback((saved: SavedAddress) => {
    setSelectedSavedId(saved.id);
    setAddress({
      fullName: saved.full_name,
      street: saved.street,
      city: saved.city,
      state: saved.state ?? '',
      zipCode: saved.zip_code ?? '',
      phone: saved.phone,
    });
    setShowPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const selectedSavedLabel = useMemo(() => {
    if (!selectedSavedId) return null;
    const found = savedAddresses.find(a => a.id === selectedSavedId);
    return found ? `${found.full_name} — ${found.street}` : null;
  }, [selectedSavedId, savedAddresses]);

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const updateField = useCallback(
    (field: keyof Address, value: string) => {
      setSelectedSavedId(null);
      setAddress(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handlePlaceOrder = useCallback(() => {
    if (!address.fullName.trim() || !address.street.trim() || !address.city.trim() || !address.phone.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required address fields.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    if (paymentMethod === 'mpesa' && !isValidKenyanPhone(mpesaPhone)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Safaricom M-Pesa phone number (e.g. 0712 345 678).');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date().toISOString();
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 5);
    const newOrderId = `ORD${Date.now()}`;
    const payId = `PAY${Date.now()}`;

    const isMpesa = paymentMethod === 'mpesa';

    const order: Order = {
      id: newOrderId,
      items: items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0],
        productBrand: item.product.brand,
        price: item.product.price,
        quantity: item.quantity,
      })),
      subtotal,
      shipping,
      total,
      status: isMpesa ? 'pending_payment' : 'processing',
      date: now,
      address,
      trackingEvents: [
        {
          status: isMpesa ? 'pending_payment' : 'processing',
          date: now,
          description: isMpesa
            ? 'Waiting for M-Pesa payment confirmation.'
            : 'Your order has been placed and is being prepared.',
        },
      ],
      estimatedDelivery: estimatedDate.toISOString(),
      paymentMethod,
      paymentId: isMpesa ? payId : undefined,
    };

    addOrder(order);
    clearCart();

    if (isMpesa) {
      router.push({
        pathname: '/mpesa-payment',
        params: {
          orderId: newOrderId,
          paymentId: payId,
          phone: mpesaPhone,
          amount: total.toString(),
        },
      });
    } else {
      router.replace({
        pathname: '/confirmation',
        params: { orderId: newOrderId, paymentMethod: 'cash_on_delivery' },
      });
    }
  }, [address, items, subtotal, shipping, total, paymentMethod, mpesaPhone, addOrder, clearCart, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          {savedAddresses.length > 0 && (
            <View style={styles.savedPickerWrap}>
              <Pressable
                onPress={() => setShowPicker(!showPicker)}
                style={styles.savedPickerButton}
              >
                <Text
                  style={[
                    styles.savedPickerText,
                    !selectedSavedLabel && styles.savedPickerPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedSavedLabel ?? 'Select a saved address'}
                </Text>
                <ChevronDown size={18} color={Colors.textMuted} />
              </Pressable>

              {showPicker && (
                <View style={styles.pickerDropdown}>
                  {savedAddresses.map(saved => (
                    <Pressable
                      key={saved.id}
                      onPress={() => selectSavedAddress(saved)}
                      style={[
                        styles.pickerItem,
                        selectedSavedId === saved.id && styles.pickerItemSelected,
                      ]}
                    >
                      <View style={styles.pickerItemContent}>
                        <Text style={styles.pickerItemName}>{saved.full_name}</Text>
                        <Text style={styles.pickerItemLine} numberOfLines={1}>
                          {saved.street}, {saved.city}
                          {saved.state ? `, ${saved.state}` : ''}
                        </Text>
                      </View>
                      {selectedSavedId === saved.id && (
                        <Check size={16} color={Colors.primary} />
                      )}
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => {
                      setSelectedSavedId(null);
                      setAddress({ fullName: '', street: '', city: '', state: '', zipCode: '', phone: '' });
                      setShowPicker(false);
                    }}
                    style={styles.pickerItemNew}
                  >
                    <Text style={styles.pickerItemNewText}>Enter new address</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textMuted}
              value={address.fullName}
              onChangeText={v => updateField('fullName', v)}
              testID="input-fullname"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your street address"
              placeholderTextColor={Colors.textMuted}
              value={address.street}
              onChangeText={v => updateField('street', v)}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
                value={address.city}
                onChangeText={v => updateField('city', v)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={Colors.textMuted}
                value={address.state}
                onChangeText={v => updateField('state', v)}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Zip Code</Text>
              <TextInput
                style={styles.input}
                placeholder="00000"
                placeholderTextColor={Colors.textMuted}
                value={address.zipCode}
                onChangeText={v => updateField('zipCode', v)}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                value={address.phone}
                onChangeText={v => updateField('phone', v)}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <CreditCard size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <Pressable
            onPress={() => {
              setPaymentMethod('mpesa');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.paymentMethodCard,
              paymentMethod === 'mpesa' && styles.paymentMethodCardActive,
            ]}
          >
            <View style={paymentMethod === 'mpesa' ? styles.radioSelected : styles.radioEmpty} />
            <View style={styles.paymentMethodInfo}>
              <View style={styles.paymentMethodHeader}>
                <Text style={styles.paymentText}>M-Pesa</Text>
                <View style={styles.mpesaBadge}>
                  <Text style={styles.mpesaBadgeText}>M-PESA</Text>
                </View>
              </View>
              <Text style={styles.paymentSubtext}>Pay via Safaricom M-Pesa</Text>
            </View>
          </Pressable>

          {paymentMethod === 'mpesa' && (
            <View style={styles.mpesaPhoneSection}>
              <Text style={styles.inputLabel}>M-Pesa Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="0712 345 678"
                placeholderTextColor={Colors.textMuted}
                value={mpesaPhone}
                onChangeText={setMpesaPhone}
                keyboardType="phone-pad"
                maxLength={13}
                testID="mpesa-phone"
              />
            </View>
          )}

          <Pressable
            onPress={() => {
              setPaymentMethod('cash_on_delivery');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.paymentMethodCard,
              paymentMethod === 'cash_on_delivery' && styles.paymentMethodCardActive,
            ]}
          >
            <View style={paymentMethod === 'cash_on_delivery' ? styles.radioSelected : styles.radioEmpty} />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentText}>Cash on Delivery</Text>
              <Text style={styles.paymentSubtext}>Pay when your order arrives</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Truck size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          {items.map(item => (
            <View key={item.product.id} style={styles.orderItemRow}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.product.name} x{item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.orderItemRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.orderItemRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.orderItemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Pressable
          onPress={handlePlaceOrder}
          style={styles.placeOrderButton}
          testID="place-order"
        >
          <Text style={styles.placeOrderText}>{paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place Order'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  savedPickerWrap: {
    marginBottom: 16,
  },
  savedPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  savedPickerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    flex: 1,
    marginRight: 8,
  },
  savedPickerPlaceholder: {
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  pickerDropdown: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  pickerItemLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pickerItemNew: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerItemNewText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  paymentMethodCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  paymentSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  mpesaBadge: {
    backgroundColor: '#00A550',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mpesaBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mpesaPhoneSection: {
    marginBottom: 10,
    paddingLeft: 44,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },

});
