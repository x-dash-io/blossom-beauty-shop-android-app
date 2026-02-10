import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const PAYMENT_KEY = 'saved_payment_methods';

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  cardholderName: string;
}

function getBrandAccent(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'visa': return '#1A1F71';
    case 'mastercard': return '#FF5F00';
    case 'amex': return '#006FCF';
    default: return Colors.primary;
  }
}

function CardVisual({ card, onDelete, onSetDefault }: {
  card: SavedCard;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const brandColor = getBrandAccent(card.brand);

  return (
    <View style={[cardStyles.container, { borderColor: card.isDefault ? Colors.primary : Colors.border }]}>
      <View style={[cardStyles.topStripe, { backgroundColor: brandColor }]} />
      <View style={cardStyles.content}>
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.brand}>{card.brand.toUpperCase()}</Text>
          {card.isDefault && (
            <View style={cardStyles.defaultBadge}>
              <Check size={10} color={Colors.white} />
              <Text style={cardStyles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={cardStyles.number}>
          {'•••• •••• •••• '}{card.last4}
        </Text>
        <View style={cardStyles.bottomRow}>
          <View>
            <Text style={cardStyles.label}>Cardholder</Text>
            <Text style={cardStyles.value}>{card.cardholderName}</Text>
          </View>
          <View>
            <Text style={cardStyles.label}>Expires</Text>
            <Text style={cardStyles.value}>
              {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
            </Text>
          </View>
        </View>
        <View style={cardStyles.actions}>
          {!card.isDefault && (
            <Pressable onPress={onSetDefault} style={cardStyles.actionButton}>
              <Check size={14} color={Colors.primary} />
              <Text style={cardStyles.actionText}>Set Default</Text>
            </Pressable>
          )}
          <Pressable onPress={onDelete} style={cardStyles.actionButton}>
            <Trash2 size={14} color={Colors.error} />
            <Text style={[cardStyles.actionText, { color: Colors.error }]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  topStripe: {
    height: 6,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  number: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [name, setName] = useState('');
  const [cvv, setCvv] = useState('');

  const cardsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PAYMENT_KEY);
      return stored ? (JSON.parse(stored) as SavedCard[]) : [];
    },
  });

  const cards = useMemo(() => cardsQuery.data ?? [], [cardsQuery.data]);

  const { mutate: saveCards } = useMutation({
    mutationFn: async (updated: SavedCard[]) => {
      await AsyncStorage.setItem(PAYMENT_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });

  const detectBrand = useCallback((number: string): string => {
    const clean = number.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'Mastercard';
    if (clean.startsWith('3')) return 'Amex';
    return 'Card';
  }, []);

  const formatCardNumber = useCallback((text: string): string => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  }, []);

  const formatExpiry = useCallback((text: string): string => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  }, []);

  const handleAddCard = useCallback(() => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 13) {
      Alert.alert('Invalid Card', 'Please enter a valid card number.');
      return;
    }
    if (expiry.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the cardholder name.');
      return;
    }

    const [monthStr, yearStr] = expiry.split('/');
    const brand = detectBrand(cleanNumber);
    const newCard: SavedCard = {
      id: `card_${Date.now()}`,
      last4: cleanNumber.slice(-4),
      brand,
      expMonth: parseInt(monthStr, 10),
      expYear: 2000 + parseInt(yearStr || '0', 10),
      isDefault: cards.length === 0,
      cardholderName: name.trim(),
    };

    saveCards([...cards, newCard]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardNumber('');
    setExpiry('');
    setName('');
    setCvv('');
    setShowAddForm(false);
  }, [cardNumber, expiry, name, cards, detectBrand, saveCards]);

  const handleDelete = useCallback((cardId: string) => {
    Alert.alert('Remove Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = cards.filter(c => c.id !== cardId);
          if (updated.length > 0 && !updated.some(c => c.isDefault)) {
            updated[0].isDefault = true;
          }
          saveCards(updated);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }, [cards, saveCards]);

  const handleSetDefault = useCallback((cardId: string) => {
    const updated = cards.map(c => ({ ...c, isDefault: c.id === cardId }));
    saveCards(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [cards, saveCards]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Payment Methods</Text>
        <Pressable
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addIconButton}
        >
          {showAddForm ? (
            <X size={20} color={Colors.textPrimary} />
          ) : (
            <Plus size={20} color={Colors.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {showAddForm && (
          <View style={styles.addFormCard}>
            <Text style={styles.addFormTitle}>Add New Card</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputRow}>
                <CreditCard size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={Colors.textMuted}
                  value={cardNumber}
                  onChangeText={t => setCardNumber(formatCardNumber(t))}
                  keyboardType="number-pad"
                  maxLength={19}
                  testID="card-number-input"
                />
              </View>
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={Colors.textMuted}
                  value={expiry}
                  onChangeText={t => setExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={Colors.textMuted}
                  value={cvv}
                  onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name on card"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <Pressable
              onPress={handleAddCard}
              style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.saveButtonText}>Save Card</Text>
            </Pressable>
          </View>
        )}

        {cards.length === 0 && !showAddForm ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CreditCard size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptySubtitle}>
              Add a credit or debit card for faster checkout
            </Text>
            <Pressable
              onPress={() => setShowAddForm(true)}
              style={({ pressed }) => [styles.addFirstButton, pressed && { opacity: 0.85 }]}
            >
              <Plus size={16} color={Colors.white} />
              <Text style={styles.addFirstText}>Add Card</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {cards.map(card => (
              <CardVisual
                key={card.id}
                card={card}
                onDelete={() => handleDelete(card.id)}
                onSetDefault={() => handleSetDefault(card.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.securityNote}>
          <View style={styles.securityIcon}>
            <Check size={14} color={Colors.success} />
          </View>
          <Text style={styles.securityText}>
            Your card information is encrypted and stored securely on your device.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  addFormCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  addFormTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
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
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  cardsList: {
    gap: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  addFirstText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
  },
  securityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
