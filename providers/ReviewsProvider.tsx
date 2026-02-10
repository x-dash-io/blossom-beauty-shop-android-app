import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Review } from '@/types';
import { fetchAllReviews, createReview, updateReviewHelpful } from '@/lib/supabase-db';

const REVIEWS_KEY = 'beauty_reviews';

export const [ReviewsProvider, useReviews] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [reviews, setReviews] = useState<Review[]>([]);

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      console.log('[Reviews] Fetching from Supabase...');
      const dbReviews = await fetchAllReviews();
      if (dbReviews.length > 0) {
        console.log('[Reviews] Got', dbReviews.length, 'from Supabase');
        return dbReviews;
      }
      console.log('[Reviews] Falling back to local storage');
      const stored = await AsyncStorage.getItem(REVIEWS_KEY);
      return stored ? (JSON.parse(stored) as Review[]) : [];
    },
  });

  const { mutate: syncLocal } = useMutation({
    mutationFn: async (newReviews: Review[]) => {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(newReviews));
      return newReviews;
    },
  });

  useEffect(() => {
    if (reviewsQuery.data) {
      setReviews(reviewsQuery.data);
    }
  }, [reviewsQuery.data]);

  const addReview = useCallback((review: Review) => {
    console.log('[Reviews] Adding review for product:', review.productId);
    setReviews(prev => {
      const updated = [review, ...prev];
      syncLocal(updated);
      return updated;
    });

    createReview(review).then(success => {
      if (success) {
        console.log('[Reviews] Review saved to Supabase');
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      } else {
        console.log('[Reviews] Failed to save to Supabase, kept in local storage');
      }
    });
  }, [syncLocal, queryClient]);

  const getProductReviews = useCallback(
    (productId: string) => reviews.filter(r => r.productId === productId),
    [reviews]
  );

  const getAverageRating = useCallback(
    (productId: string) => {
      const productReviews = reviews.filter(r => r.productId === productId);
      if (productReviews.length === 0) return 0;
      return productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    },
    [reviews]
  );

  const hasUserReviewed = useCallback(
    (productId: string, userId: string) =>
      reviews.some(r => r.productId === productId && r.userId === userId),
    [reviews]
  );

  const markHelpful = useCallback((reviewId: string) => {
    setReviews(prev => {
      const review = prev.find(r => r.id === reviewId);
      const newCount = (review?.helpful ?? 0) + 1;
      const updated = prev.map(r =>
        r.id === reviewId ? { ...r, helpful: newCount } : r
      );
      syncLocal(updated);

      updateReviewHelpful(reviewId, newCount).then(success => {
        if (success) {
          console.log('[Reviews] Helpful count updated in Supabase');
        }
      });

      return updated;
    });
  }, [syncLocal]);

  return {
    reviews,
    addReview,
    getProductReviews,
    getAverageRating,
    hasUserReviewed,
    markHelpful,
    isLoading: reviewsQuery.isLoading,
  };
});
