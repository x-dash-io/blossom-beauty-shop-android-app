import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import { fetchUserFavoriteIds, addFavorite, removeFavorite } from '@/lib/supabase-db';

const FAVORITES_KEY = 'beauty_favorites';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const favQuery = useQuery({
    queryKey: ['favorites', user?.id ?? 'local'],
    queryFn: async () => {
      if (user?.id) {
        console.log('[Favorites] Fetching from Supabase for user:', user.id);
        const dbFavs = await fetchUserFavoriteIds(user.id);
        if (dbFavs.length > 0) {
          console.log('[Favorites] Got', dbFavs.length, 'from Supabase');
          return dbFavs;
        }
      }
      console.log('[Favorites] Using local storage');
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  const { mutate: syncLocal } = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      return ids;
    },
  });

  useEffect(() => {
    if (favQuery.data) {
      setFavoriteIds(favQuery.data);
    }
  }, [favQuery.data]);

  const toggleFavorite = useCallback((productId: string) => {
    const isCurrentlyFavorite = favoriteIds.includes(productId);
    const updated = isCurrentlyFavorite
      ? favoriteIds.filter(id => id !== productId)
      : [...favoriteIds, productId];

    setFavoriteIds(updated);
    syncLocal(updated);

    if (user?.id) {
      if (isCurrentlyFavorite) {
        removeFavorite(user.id, productId).then(success => {
          if (success) console.log('[Favorites] Removed from Supabase');
        });
      } else {
        addFavorite(user.id, productId).then(success => {
          if (success) console.log('[Favorites] Added to Supabase');
        });
      }
    }
  }, [favoriteIds, user, syncLocal]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    isLoading: favQuery.isLoading,
    refetch: async () => {
      await favQuery.refetch();
    },
  };
});
