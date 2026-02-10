import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const currentName = (user?.user_metadata?.full_name as string) || '';
  const currentEmail = user?.email || '';

  const [fullName, setFullName] = useState<string>(currentName);
  const [phone, setPhone] = useState<string>(
    (user?.user_metadata?.phone as string) || ''
  );

  const successScale = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const avatarInitial = fullName.charAt(0).toUpperCase() || currentEmail.charAt(0).toUpperCase() || 'B';

  const hasChanges = fullName !== currentName || phone !== ((user?.user_metadata?.phone as string) || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      console.log('[EditProfile] Updating user metadata...');
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      });
      if (error) throw error;
      console.log('[EditProfile] Profile updated successfully');
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      Animated.sequence([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(successScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
        router.back();
      });
    },
    onError: (error: Error) => {
      console.log('[EditProfile] Update error:', error.message);
      Alert.alert('Update Failed', error.message || 'Could not update profile. Please try again.');
    },
  });

  const { mutate: updateProfile, isPending: isUpdating } = updateMutation;

  const handleSave = useCallback(() => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    updateProfile();
  }, [fullName, updateProfile]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
              <View style={styles.cameraButton}>
                <Camera size={14} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                testID="edit-name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{currentEmail}</Text>
                <Text style={styles.readOnlyBadge}>Verified</Text>
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                testID="edit-phone"
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Account Security</Text>
            <Text style={styles.infoText}>
              To change your password, use the {"\""}Forgot Password{"\""} option on the login screen. A reset link will be sent to your email.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleSave}
            style={[
              styles.saveButton,
              !hasChanges && styles.saveButtonDisabled,
            ]}
            disabled={!hasChanges || isUpdating}
            testID="save-profile"
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Check size={18} color={Colors.white} />
                <Text style={styles.saveText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {showSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            { transform: [{ scale: successScale }], opacity: successScale },
          ]}
        >
          <View style={styles.successCircle}>
            <Check size={32} color={Colors.white} />
          </View>
          <Text style={styles.successText}>Profile Updated</Text>
        </Animated.View>
      )}
    </View>
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
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontWeight: '500' as const,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
  },
  readOnlyBadge: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.success,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textMuted,
    paddingLeft: 2,
  },
  infoCard: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
