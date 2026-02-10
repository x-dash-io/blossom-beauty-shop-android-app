import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from '@/lib/supabase-db';

interface AddressForm {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  fullName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  isDefault: false,
};

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

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Addresses] Fetching for user:', user.id);
      return fetchUserAddresses(user.id);
    },
    enabled: !!user?.id,
  });

  const addresses = (addressesQuery.data ?? []) as SavedAddress[];

  const createMutation = useMutation({
    mutationFn: async (addr: AddressForm) => {
      if (!user?.id) throw new Error('Not authenticated');
      console.log('[Addresses] Creating address');
      const success = await createUserAddress(user.id, {
        fullName: addr.fullName,
        street: addr.street,
        city: addr.city,
        state: addr.state || undefined,
        zipCode: addr.zipCode || undefined,
        phone: addr.phone,
        isDefault: addr.isDefault,
      });
      if (!success) throw new Error('Failed to save address');
      return success;
    },
    onSuccess: () => {
      console.log('[Addresses] Created successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save address. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, addr }: { id: number; addr: AddressForm }) => {
      console.log('[Addresses] Updating address:', id);
      const success = await updateUserAddress(id, {
        fullName: addr.fullName,
        street: addr.street,
        city: addr.city,
        state: addr.state || undefined,
        zipCode: addr.zipCode || undefined,
        phone: addr.phone,
        isDefault: addr.isDefault,
      }, user?.id);
      if (!success) throw new Error('Failed to update address');
      return success;
    },
    onSuccess: () => {
      console.log('[Addresses] Updated successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update address. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('[Addresses] Deleting address:', id);
      const success = await deleteUserAddress(id);
      if (!success) throw new Error('Failed to delete');
      return success;
    },
    onSuccess: () => {
      console.log('[Addresses] Deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete address.');
    },
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleEdit = useCallback((address: SavedAddress) => {
    setForm({
      fullName: address.full_name,
      street: address.street,
      city: address.city,
      state: address.state ?? '',
      zipCode: address.zip_code ?? '',
      phone: address.phone,
      isDefault: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  }, []);

  const { mutate: deleteAddr } = deleteMutation;
  const handleDelete = useCallback((id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAddr(id),
        },
      ]
    );
  }, [deleteAddr]);

  const { mutate: createAddr } = createMutation;
  const { mutate: updateAddr } = updateMutation;
  const handleSave = useCallback(() => {
    if (!form.fullName.trim() || !form.street.trim() || !form.city.trim() || !form.phone.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (editingId !== null) {
      updateAddr({ id: editingId, addr: form });
    } else {
      createAddr(form);
    }
  }, [form, editingId, createAddr, updateAddr]);

  const updateField = useCallback(
    (field: keyof AddressForm, value: string | boolean) => {
      setForm(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (showForm) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={resetForm} style={styles.backButton}>
            <X size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>
            {editingId !== null ? 'Edit Address' : 'New Address'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textMuted}
                value={form.fullName}
                onChangeText={v => updateField('fullName', v)}
                testID="addr-fullname"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                placeholderTextColor={Colors.textMuted}
                value={form.street}
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
                  value={form.city}
                  onChangeText={v => updateField('city', v)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor={Colors.textMuted}
                  value={form.state}
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
                  value={form.zipCode}
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
                  value={form.phone}
                  onChangeText={v => updateField('phone', v)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Pressable
              onPress={() => updateField('isDefault', !form.isDefault)}
              style={styles.defaultToggle}
            >
              <View
                style={[
                  styles.checkbox,
                  form.isDefault && styles.checkboxActive,
                ]}
              >
                {form.isDefault && <Check size={14} color={Colors.white} />}
              </View>
              <Text style={styles.defaultLabel}>Set as default address</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingId !== null ? 'Update Address' : 'Save Address'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Saved Addresses</Text>
        <Pressable
          onPress={() => {
            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(true);
          }}
          style={styles.addButton}
        >
          <Plus size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {addressesQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MapPin size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>
            Add an address to speed up your checkout
          </Text>
          <Pressable
            onPress={() => setShowForm(true)}
            style={styles.addFirstButton}
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.addFirstButtonText}>Add Address</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {addresses.map(addr => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => handleEdit(addr)}
              onDelete={() => handleDelete(addr.id)}
            />
          ))}
          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      )}
    </View>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
    <Animated.View style={[styles.addressCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onEdit}>
        <View style={styles.addressCardHeader}>
          <View style={styles.addressIconWrap}>
            <MapPin size={18} color={Colors.primary} />
          </View>
          <View style={styles.addressNameRow}>
            <Text style={styles.addressName}>{address.full_name}</Text>
            {address.is_default && (
              <View style={styles.defaultBadge}>
                <Star size={10} color={Colors.white} fill={Colors.white} />
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.addressBody}>
          <Text style={styles.addressLine}>{address.street}</Text>
          <Text style={styles.addressLine}>
            {address.city}
            {address.state ? `, ${address.state}` : ''}
            {address.zip_code ? ` ${address.zip_code}` : ''}
          </Text>
          <Text style={styles.addressPhone}>{address.phone}</Text>
        </View>
        <View style={styles.addressActions}>
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Pencil size={15} color={Colors.primary} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionButtonDanger}>
            <Trash2 size={15} color={Colors.error} />
            <Text style={styles.actionTextDanger}>Remove</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  addFirstButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  addressBody: {
    paddingLeft: 46,
    marginBottom: 12,
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
  addressActions: {
    flexDirection: 'row',
    paddingLeft: 46,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.errorLight,
  },
  actionTextDanger: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  formContent: {
    padding: 16,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
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
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  defaultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
