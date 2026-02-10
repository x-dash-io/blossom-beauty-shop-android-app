import { useState, useMemo, useCallback } from 'react';
import { Product } from '@/types';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
export type PriceRange = 'all' | '0-25' | '25-50' | '50-100' | '100+';
export type RatingFilter = 'all' | '4+' | '3+';

export function useProductFilter(products: Product[]) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

  const filtered = useMemo(() => {
    let result = [...products];

    if (priceRange === '0-25') result = result.filter(p => p.price <= 25);
    else if (priceRange === '25-50') result = result.filter(p => p.price > 25 && p.price <= 50);
    else if (priceRange === '50-100') result = result.filter(p => p.price > 50 && p.price <= 100);
    else if (priceRange === '100+') result = result.filter(p => p.price > 100);

    if (ratingFilter === '4+') result = result.filter(p => p.rating >= 4);
    else if (ratingFilter === '3+') result = result.filter(p => p.rating >= 3);

    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'newest') result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

    return result;
  }, [products, sortBy, priceRange, ratingFilter]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'default') count++;
    if (priceRange !== 'all') count++;
    if (ratingFilter !== 'all') count++;
    return count;
  }, [sortBy, priceRange, ratingFilter]);

  const reset = useCallback(() => {
    setSortBy('default');
    setPriceRange('all');
    setRatingFilter('all');
  }, []);

  return {
    filtered,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    ratingFilter,
    setRatingFilter,
    activeCount,
    reset,
  };
}
