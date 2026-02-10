import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const MAX_ITEMS = 20;

export const [RecentlyViewedProvider, useRecentlyViewed] = createContextHook(() => {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: async () => {
      console.log('[RecentlyViewed] Loading from storage');
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  const { mutate: sync } = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
      return ids;
    },
  });

  useEffect(() => {
    if (query.data) {
      setViewedIds(query.data);
    }
  }, [query.data]);

  const addRecentlyViewed = useCallback((productId: string) => {
    setViewedIds(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      sync(updated);
      return updated;
    });
  }, [sync]);

  const clearRecentlyViewed = useCallback(() => {
    setViewedIds([]);
    sync([]);
  }, [sync]);

  return {
    viewedIds,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
});
