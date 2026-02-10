import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  Package,
  RotateCcw,
  User,
  ShoppingBag,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    id: 'orders',
    title: 'Orders & Shipping',
    icon: <Package size={18} color={Colors.primary} />,
    items: [
      {
        question: 'How do I track my order?',
        answer: 'Go to the Orders tab in the bottom navigation. Tap on any order to see real-time tracking updates including processing, shipping, and delivery status.',
      },
      {
        question: 'What are the shipping costs?',
        answer: 'We offer free standard shipping on all orders over $50. For orders under $50, a flat rate of $5.99 applies. Express shipping is available at checkout for an additional fee.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 3-7 business days. Express delivery takes 1-3 business days. Delivery times may vary based on your location.',
      },
      {
        question: 'Can I change my delivery address after placing an order?',
        answer: "If your order hasn't been shipped yet, contact our support team immediately and we'll try to update the address. Once shipped, address changes are not possible.",
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: <RotateCcw size={18} color={Colors.secondary} />,
    items: [
      {
        question: 'What is your return policy?',
        answer: "We accept returns within 30 days of delivery for unused, unopened products in their original packaging. Opened beauty products can be returned within 14 days if you're not satisfied.",
      },
      {
        question: 'How do I request a refund?',
        answer: "Contact our support team via email or phone with your order number. We'll provide a return shipping label and process your refund within 5-7 business days after receiving the returned item.",
      },
      {
        question: 'Can I exchange a product?',
        answer: "Yes! Contact us within 30 days of delivery. We'll arrange a free exchange for the same product in a different shade or variant, subject to availability.",
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: <User size={18} color={Colors.accent} />,
    items: [
      {
        question: 'How do I reset my password?',
        answer: 'Tap "Forgot Password?" on the login screen and enter your email address. You\'ll receive a password reset link within minutes.',
      },
      {
        question: 'How do I update my profile information?',
        answer: 'Go to Profile > Edit Profile to update your name, email, and other personal information. Changes are saved automatically.',
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Absolutely. We use industry-standard encryption and never store your full card details on our servers. All transactions are processed through secure payment gateways.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    icon: <ShoppingBag size={18} color={Colors.success} />,
    items: [
      {
        question: 'Are all products authentic?',
        answer: 'Yes. We source directly from authorized distributors and brands. Every product is 100% authentic with a satisfaction guarantee.',
      },
      {
        question: 'How do I find products for my skin type?',
        answer: 'Use the search and filter features to narrow down products by category, skin type, and concerns. Product descriptions also include skin type recommendations.',
      },
      {
        question: 'Can I get notified when a product is back in stock?',
        answer: 'Currently, we recommend checking back periodically or enabling notifications in your profile settings to stay updated on product availability.',
      },
    ],
  },
];

function FAQAccordionItem({ item, isExpanded, onToggle }: {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handleToggle = useCallback(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    onToggle();
  }, [isExpanded, onToggle, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable onPress={handleToggle} style={styles.faqItem}>
      <View style={styles.faqQuestionRow}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={16} color={Colors.textMuted} />
        </Animated.View>
      </View>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </Pressable>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredSections = useMemo(() => {
    if (!search.trim()) return FAQ_DATA;
    const lower = search.toLowerCase();
    return FAQ_DATA.map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          item.question.toLowerCase().includes(lower) ||
          item.answer.toLowerCase().includes(lower)
      ),
    })).filter(section => section.items.length > 0);
  }, [search]);

  const toggleItem = useCallback((key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleEmail = useCallback(() => {
    Linking.openURL('mailto:support@blossom.com');
  }, []);

  const handlePhone = useCallback(() => {
    Linking.openURL('tel:18002567766');
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            testID="help-search"
          />
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactLabel}>Contact Us</Text>
          <View style={styles.contactRow}>
            <Pressable
              onPress={handleEmail}
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primaryLight }]}>
                <Mail size={20} color={Colors.primary} />
              </View>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactDetail}>support@blossom.com</Text>
            </Pressable>

            <Pressable
              onPress={handlePhone}
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Phone size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.contactTitle}>Phone</Text>
              <Text style={styles.contactDetail}>1-800-BLOSSOM</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.contactCard, pressed && styles.contactCardPressed]}
              onPress={() => {}}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.successLight }]}>
                <MessageCircle size={20} color={Colors.success} />
              </View>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDetail}>Coming soon</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.faqSectionLabel}>Frequently Asked Questions</Text>

        {filteredSections.length === 0 ? (
          <View style={styles.noResults}>
            <Search size={32} color={Colors.border} />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        ) : (
          filteredSections.map(section => (
            <View key={section.id} style={styles.faqSection}>
              <View style={styles.faqSectionHeader}>
                {section.icon}
                <Text style={styles.faqSectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.faqCard}>
                {section.items.map((item, idx) => {
                  const key = `${section.id}-${idx}`;
                  return (
                    <React.Fragment key={key}>
                      {idx > 0 && <View style={styles.faqDivider} />}
                      <FAQAccordionItem
                        item={item}
                        isExpanded={expandedItems.has(key)}
                        onToggle={() => toggleItem(key)}
                      />
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            Our support team is available Monday-Friday, 9am-6pm EST.
            We typically respond within 24 hours.
          </Text>
          <Pressable
            onPress={handleEmail}
            style={({ pressed }) => [styles.emailButton, pressed && { opacity: 0.85 }]}
          >
            <Mail size={16} color={Colors.white} />
            <Text style={styles.emailButtonText}>Send us an email</Text>
          </Pressable>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contactSection: {
    gap: 12,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  contactCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  contactDetail: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  faqSectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  faqSection: {
    gap: 8,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  faqSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
  },
  faqDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  stillNeedHelp: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  stillNeedHelpTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  stillNeedHelpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
