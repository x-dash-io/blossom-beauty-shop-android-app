import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Product } from '@/types';
import { fetchProducts, fetchCategories } from '@/lib/supabase-db';
import { products as mockProducts } from '@/mocks/products';
import { categories as mockCategories } from '@/mocks/categories';
import { banners } from '@/mocks/banners';

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('[Products] Fetching from Supabase...');
      const dbProducts = await fetchProducts();
      if (dbProducts.length > 0) {
        console.log('[Products] Using', dbProducts.length, 'products from Supabase');
        return dbProducts;
      }
      console.log('[Products] No Supabase data, using mock products');
      return mockProducts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('[Products] Fetching categories from Supabase...');
      const dbCategories = await fetchCategories();
      if (dbCategories.length > 0) {
        console.log('[Products] Using', dbCategories.length, 'categories from Supabase');
        return dbCategories;
      }
      console.log('[Products] No Supabase data, using mock categories');
      return mockCategories;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = productsQuery.data ?? mockProducts;
  const categories = categoriesQuery.data ?? mockCategories;

  const getProductById = useCallback(
    (id: string): Product | undefined => products.find(p => p.id === id),
    [products]
  );

  const getFeaturedProducts = useCallback(
    (): Product[] => products.filter(p => p.isFeatured),
    [products]
  );

  const getNewProducts = useCallback(
    (): Product[] => products.filter(p => p.isNew),
    [products]
  );

  const getProductsByCategory = useCallback(
    (category: string): Product[] => products.filter(p => p.category === category),
    [products]
  );

  const searchProducts = useCallback(
    (query: string): Product[] => {
      const lower = query.toLowerCase();
      return products.filter(
        p =>
          p.name.toLowerCase().includes(lower) ||
          p.brand.toLowerCase().includes(lower) ||
          p.tags.some(t => t.toLowerCase().includes(lower)) ||
          p.category.toLowerCase().includes(lower)
      );
    },
    [products]
  );

  return {
    products,
    categories,
    banners,
    getProductById,
    getFeaturedProducts,
    getNewProducts,
    getProductsByCategory,
    searchProducts,
    isLoading: productsQuery.isLoading,
    refetch: async () => {
      await productsQuery.refetch();
      await categoriesQuery.refetch();
    },
  };
});
