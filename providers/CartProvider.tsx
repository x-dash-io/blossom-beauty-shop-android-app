import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CartItem, Product } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { fetchUserCart, syncUserCart } from '@/lib/supabase-db';

const CART_KEY = 'beauty_cart';

export const [CartProvider, useCart] = createContextHook(() => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const cartQuery = useQuery({
    queryKey: ['cart', user?.id ?? 'local'],
    queryFn: async () => {
      if (user?.id) {
        console.log('[Cart] Fetching from Supabase for user:', user.id);
        const remoteCart = await fetchUserCart(user.id);
        if (remoteCart.length > 0) {
          console.log('[Cart] Got', remoteCart.length, 'items from Supabase');
          return remoteCart;
        }
        console.log('[Cart] Remote cart empty, checking local storage');
        const stored = await AsyncStorage.getItem(CART_KEY);
        const localCart = stored ? (JSON.parse(stored) as CartItem[]) : [];
        if (localCart.length > 0) {
          console.log('[Cart] Pushing', localCart.length, 'local items to Supabase');
          await syncUserCart(user.id, localCart);
        }
        return localCart;
      }
      const stored = await AsyncStorage.getItem(CART_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    },
  });

  const { mutate: syncCart } = useMutation({
    mutationFn: async (newItems: CartItem[]) => {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
      if (user?.id) {
        console.log('[Cart] Syncing', newItems.length, 'items to Supabase');
        await syncUserCart(user.id, newItems);
      }
      return newItems;
    },
  });

  useEffect(() => {
    if (cartQuery.data) {
      setItems(cartQuery.data);
    }
  }, [cartQuery.data]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        updated = [...prev, { product, quantity }];
      }
      syncCart(updated);
      return updated;
    });
  }, [syncCart]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.product.id !== productId);
      syncCart(updated);
      return updated;
    });
  }, [syncCart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => {
        const updated = prev.filter(i => i.product.id !== productId);
        syncCart(updated);
        return updated;
      });
      return;
    }
    setItems(prev => {
      const updated = prev.map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      );
      syncCart(updated);
      return updated;
    });
  }, [syncCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    syncCart([]);
  }, [syncCart]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    isLoading: cartQuery.isLoading,
  };
});
