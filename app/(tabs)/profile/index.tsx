import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  User,
  LogIn,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route?: string;
}

function GuestProfileView() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <User size={44} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Blossom</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to access your profile, track orders, and manage your account
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.signInButtonPressed,
            ]}
            testID="guest-sign-in"
          >
            <LogIn size={18} color={Colors.white} />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/signup')}
            style={({ pressed }) => [
              styles.createAccountButton,
              pressed && styles.createAccountButtonPressed,
            ]}
          >
            <Text style={styles.createAccountText}>Create an Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut, isSigningOut } = useAuth();

  const displayName = useMemo(() => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
    if (user?.email) return user.email.split('@')[0];
    return 'Beauty Lover';
  }, [user]);

  const displayEmail = useMemo(() => {
    return user?.email ?? 'Not signed in';
  }, [user]);

  const avatarInitial = useMemo(() => {
    return displayName.charAt(0).toUpperCase();
  }, [displayName]);

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Shopping',
      items: [
        {
          id: 'orders',
          label: 'My Orders',
          icon: <Package size={20} color={Colors.primary} />,
          route: '/orders',
        },
        {
          id: 'favorites',
          label: 'My Favorites',
          icon: <Heart size={20} color={Colors.primary} />,
          route: '/favorites',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'addresses',
          label: 'Saved Addresses',
          icon: <MapPin size={20} color={Colors.secondary} />,
          route: '/addresses',
        },
        {
          id: 'payment',
          label: 'Payment Methods',
          icon: <CreditCard size={20} color={Colors.secondary} />,
          route: '/payment-methods',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell size={20} color={Colors.secondary} />,
          route: '/notifications',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help & Support',
          icon: <HelpCircle size={20} color={Colors.accent} />,
          route: '/help',
        },
        {
          id: 'about',
          label: 'About Blossom',
          icon: <Info size={20} color={Colors.accent} />,
          route: '/about',
        },
      ],
    },
  ];

  const handleMenuPress = useCallback(
    (item: MenuItem) => {
      if (item.route) {
        router.push(item.route as never);
      }
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('[Profile] Signed out');
            } catch (error) {
              console.log('[Profile] Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  if (!isAuthenticated) {
    return <GuestProfileView />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
            <Pressable
              style={styles.editProfileButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </Pressable>
          </View>

          {menuSections.map(section => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleMenuPress(item)}
                    style={[
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconWrapper}>{item.icon}</View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable
            style={styles.logoutButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <LogOut size={18} color={Colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 32,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  guestSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    marginBottom: 14,
  },
  signInButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  createAccountButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  createAccountButtonPressed: {
    opacity: 0.7,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  editProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.errorLight,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
