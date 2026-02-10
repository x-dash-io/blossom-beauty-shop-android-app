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
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useReviews } from '@/providers/ReviewsProvider';
import { useProducts } from '@/providers/ProductsProvider';

export default function WriteReviewScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addReview, hasUserReviewed } = useReviews();

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const starScales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;
  const { getProductById } = useProducts();

  const product = getProductById(productId || '');

  const alreadyReviewed = user ? hasUserReviewed(productId || '', user.id) : false;

  const handleStarPress = useCallback((star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(star);
    Animated.sequence([
      Animated.timing(starScales[star - 1], {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starScales[star - 1], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [starScales]);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please add a title for your review.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Review Required', 'Please write your review.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addReview({
      id: `rev_${Date.now()}`,
      productId: productId || '',
      userId: user?.id || 'guest',
      userName: user?.user_metadata?.full_name || 'Anonymous',
      rating,
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString(),
      helpful: 0,
    });

    Alert.alert('Thank you!', 'Your review has been submitted.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [rating, title, body, productId, user, addReview, router]);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.productPreview}>
            <Image
              source={product.images[0]}
              style={styles.productImage}
              contentFit="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
            </View>
          </View>

          {alreadyReviewed && (
            <View style={styles.alreadyReviewedBanner}>
              <Text style={styles.alreadyReviewedText}>
                You have already reviewed this product.
              </Text>
            </View>
          )}

          <View style={styles.ratingSection}>
            <Text style={styles.sectionLabel}>Your Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Pressable
                  key={star}
                  onPress={() => handleStarPress(star)}
                  hitSlop={8}
                >
                  <Animated.View style={{ transform: [{ scale: starScales[star - 1] }] }}>
                    <Star
                      size={36}
                      color={Colors.rating}
                      fill={star <= rating ? Colors.rating : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
            )}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Review Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Summarize your experience"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              testID="review-title"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Your Review</Text>
            <TextInput
              style={styles.bodyInput}
              placeholder="What did you like or dislike? How did this product work for you?"
              placeholderTextColor={Colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
              testID="review-body"
            />
            <Text style={styles.charCount}>{body.length}/1000</Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleSubmit}
            style={[styles.submitButton, alreadyReviewed && styles.submitButtonDisabled]}
            disabled={alreadyReviewed}
            testID="submit-review"
          >
            <Send size={18} color={Colors.white} />
            <Text style={styles.submitText}>Submit Review</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  errorButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  alreadyReviewedBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alreadyReviewedText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  ratingSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.rating,
    marginTop: 10,
  },
  inputSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  titleInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bodyInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 140,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
