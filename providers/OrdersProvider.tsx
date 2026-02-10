import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Order } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { fetchUserOrders, createOrder } from '@/lib/supabase-db';

const ORDERS_KEY = 'beauty_orders';

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);

  const ordersQuery = useQuery({
    queryKey: ['orders', user?.id ?? 'local'],
    queryFn: async () => {
      if (user?.id) {
        console.log('[Orders] Fetching from Supabase for user:', user.id);
        const dbOrders = await fetchUserOrders(user.id);
        if (dbOrders.length > 0) {
          console.log('[Orders] Got', dbOrders.length, 'orders from Supabase');
          return dbOrders;
        }
      }
      console.log('[Orders] Falling back to local storage');
      const stored = await AsyncStorage.getItem(ORDERS_KEY);
      return stored ? (JSON.parse(stored) as Order[]) : [];
    },
  });

  const { mutate: syncLocal } = useMutation({
    mutationFn: async (newOrders: Order[]) => {
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
      return newOrders;
    },
  });

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data);
    }
  }, [ordersQuery.data]);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => {
      const updated = [order, ...prev];
      syncLocal(updated);
      return updated;
    });

    if (user?.id) {
      console.log('[Orders] Saving order to Supabase');
      createOrder(user.id, order).then(success => {
        if (success) {
          console.log('[Orders] Order saved to Supabase');
          queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
        } else {
          console.log('[Orders] Failed to save to Supabase, kept in local storage');
        }
      });
    }
  }, [user, syncLocal, queryClient]);

  return {
    orders,
    addOrder,
    isLoading: ordersQuery.isLoading,
    refetch: async () => {
      await ordersQuery.refetch();
    },
  };
});
