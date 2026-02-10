import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Shield,
  Leaf,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const VALUES = [
  {
    icon: Leaf,
    color: Colors.success,
    bg: Colors.successLight,
    title: 'Clean Beauty',
    description: 'Every product is free from harmful chemicals and cruelty-free certified.',
  },
  {
    icon: Heart,
    color: Colors.primary,
    bg: Colors.primaryLight,
    title: 'Inclusive',
    description: 'Beauty for everyone — curated for all skin types, tones, and preferences.',
  },
  {
    icon: Shield,
    color: Colors.secondary,
    bg: Colors.secondaryLight,
    title: 'Trusted Brands',
    description: 'We partner only with vetted, reputable brands that share our values.',
  },
  {
    icon: Sparkles,
    color: Colors.rating,
    bg: Colors.warningLight,
    title: 'Expert Curated',
    description: 'Our team of beauty experts handpicks every product in our catalog.',
  },
];

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.heroSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.brandName}>Blossom</Text>
          <Text style={styles.tagline}>Beauty, simplified.</Text>
        </View>

        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>Our Story</Text>
          <Text style={styles.storyText}>
            Blossom was born from a simple idea: finding great beauty products shouldn{"'"}t be overwhelming. We curate the best in skincare, makeup, and wellness so you can discover products you{"'"}ll truly love — without the noise.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Our Values</Text>
        <View style={styles.valuesGrid}>
          {VALUES.map(value => {
            const IconComponent = value.icon;
            return (
              <View key={value.title} style={styles.valueCard}>
                <View style={[styles.valueIcon, { backgroundColor: value.bg }]}>
                  <IconComponent size={20} color={value.color} />
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.linksCard}>
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://example.com/terms')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <ExternalLink size={14} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.linkDivider} />
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ExternalLink size={14} color={Colors.textMuted} />
          </Pressable>
          <View style={styles.linkDivider} />
          <Pressable
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://example.com/licenses')}
          >
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <ExternalLink size={14} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
          <Text style={styles.footerCopy}>Made with love by the Blossom team</Text>
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
    gap: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  storyCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  storyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueCard: {
    width: '47%' as const,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    flexGrow: 1,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  valueDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  linksCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  linkDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 18,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  footerCopy: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
