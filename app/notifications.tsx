import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Tag,
  Star,
  MessageCircle,
  Megaphone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'orders',
      label: 'Order Updates',
      description: 'Get notified about order status changes and delivery updates',
      icon: <ShoppingBag size={20} color={Colors.primary} />,
      enabled: true,
    },
    {
      id: 'shipping',
      label: 'Shipping Alerts',
      description: 'Real-time tracking notifications for your shipments',
      icon: <Truck size={20} color={Colors.secondary} />,
      enabled: true,
    },
    {
      id: 'deals',
      label: 'Deals & Offers',
      description: 'Exclusive discounts and flash sale notifications',
      icon: <Tag size={20} color={Colors.accent} />,
      enabled: true,
    },
    {
      id: 'reviews',
      label: 'Review Reminders',
      description: 'Reminders to review products you\'ve purchased',
      icon: <Star size={20} color={Colors.rating} />,
      enabled: false,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      description: 'Personalized product suggestions based on your preferences',
      icon: <MessageCircle size={20} color={Colors.success} />,
      enabled: false,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description: 'New product launches and brand announcements',
      icon: <Megaphone size={20} color={Colors.warning} />,
      enabled: false,
    },
  ]);

  const handleToggle = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    console.log('[Notifications] Toggled:', id);
  }, []);

  const enabledCount = settings.filter(s => s.enabled).length;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{enabledCount}</Text>
          <Text style={styles.summaryLabel}>
            of {settings.length} notification types enabled
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Notification Preferences</Text>

        <View style={styles.settingsCard}>
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.settingRow,
                index < settings.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={styles.settingIcon}>{setting.icon}</View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <Text style={styles.settingDescription}>
                  {setting.description}
                </Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => handleToggle(setting.id)}
                trackColor={{
                  false: Colors.border,
                  true: Colors.primaryLight,
                }}
                thumbColor={setting.enabled ? Colors.primary : Colors.textMuted}
                testID={`toggle-${setting.id}`}
              />
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Push notifications require device permissions. You can manage system-level permissions in your device settings.
          </Text>
        </View>
      </ScrollView>
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
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  summaryNumber: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.primary,
    lineHeight: 44,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  noteCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    padding: 14,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
