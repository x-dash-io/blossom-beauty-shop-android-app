import { Product } from '@/types';

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Hydrating Rose Serum',
    brand: 'Petal Luxe',
    price: 48.00,
    description: 'A lightweight, fast-absorbing serum infused with rose extract and hyaluronic acid. Deeply hydrates and plumps skin for a radiant, dewy complexion. Suitable for all skin types.',
    images: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop',
    ],
    category: 'skincare',
    rating: 4.8,
    reviewCount: 234,
    tags: ['Hydrating', 'Anti-aging', 'Vegan'],
    inStock: true,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Velvet Matte Lipstick',
    brand: 'Rouge Belle',
    price: 32.00,
    description: 'Rich, creamy lipstick that delivers intense color with a velvety matte finish. Long-wearing formula keeps lips moisturized all day. Available in 12 stunning shades.',
    images: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop',
    ],
    category: 'makeup',
    rating: 4.6,
    reviewCount: 189,
    tags: ['Matte', 'Long-wearing', 'Cruelty-free'],
    inStock: true,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Midnight Bloom Eau de Parfum',
    brand: 'Maison Flora',
    price: 120.00,
    description: 'An enchanting fragrance that opens with notes of jasmine and bergamot, melting into a heart of tuberose and vanilla. The base of sandalwood and musk lingers beautifully.',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop',
    ],
    category: 'fragrance',
    rating: 4.9,
    reviewCount: 312,
    tags: ['Floral', 'Long-lasting', 'Luxury'],
    inStock: true,
    isFeatured: true,
    isNew: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p4',
    name: 'Gentle Foam Cleanser',
    brand: 'Petal Luxe',
    price: 28.00,
    description: 'A pH-balanced foaming cleanser that gently removes impurities without stripping the skin. Enriched with chamomile and green tea extracts for a soothing cleanse.',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    ],
    category: 'skincare',
    rating: 4.5,
    reviewCount: 156,
    tags: ['Gentle', 'pH-balanced', 'All skin types'],
    inStock: true,
    isFeatured: false,
    isNew: false,
    stockQuantity: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p5',
    name: 'Luminous Foundation SPF 30',
    brand: 'Glow Studio',
    price: 42.00,
    description: 'A buildable, medium-coverage foundation that creates a natural, luminous finish. Infused with SPF 30 and nourishing botanicals to protect and perfect your complexion.',
    images: [
      'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=400&h=400&fit=crop',
    ],
    category: 'makeup',
    rating: 4.4,
    reviewCount: 98,
    tags: ['SPF 30', 'Buildable', 'Natural finish'],
    inStock: true,
    isFeatured: false,
    isNew: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p6',
    name: 'Silk Hair Repair Oil',
    brand: 'Tresse',
    price: 36.00,
    description: 'Lightweight, non-greasy hair oil that repairs and strengthens damaged hair. Formulated with argan oil, vitamin E, and silk proteins for incredible shine and softness.',
    images: [
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop',
    ],
    category: 'haircare',
    rating: 4.7,
    reviewCount: 203,
    tags: ['Repairing', 'Lightweight', 'Silky'],
    inStock: true,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p7',
    name: 'Professional Brush Set',
    brand: 'Artisan Beauty',
    price: 65.00,
    description: 'A curated set of 12 essential brushes crafted with ultra-soft synthetic bristles. Includes brushes for foundation, powder, contour, eyeshadow, and blending.',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
    ],
    category: 'tools',
    rating: 4.8,
    reviewCount: 267,
    tags: ['Professional', 'Synthetic', 'Complete set'],
    inStock: true,
    isFeatured: false,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p8',
    name: 'Vitamin C Brightening Cream',
    brand: 'Derma Glow',
    price: 55.00,
    description: 'A potent brightening cream featuring stabilized vitamin C, niacinamide, and licorice extract. Targets dark spots, uneven skin tone, and dullness for a radiant complexion.',
    images: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop',
    ],
    category: 'skincare',
    rating: 4.6,
    reviewCount: 178,
    tags: ['Brightening', 'Vitamin C', 'Anti-spot'],
    inStock: true,
    isFeatured: false,
    isNew: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p9',
    name: 'Eyeshadow Palette - Sunset',
    brand: 'Rouge Belle',
    price: 52.00,
    description: 'A stunning palette of 18 highly pigmented shades ranging from warm nudes to rich coppers. Features a mix of matte, shimmer, and metallic finishes for endless looks.',
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop',
    ],
    category: 'makeup',
    rating: 4.7,
    reviewCount: 221,
    tags: ['Pigmented', 'Versatile', 'Long-wearing'],
    inStock: true,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p10',
    name: 'Nourishing Body Butter',
    brand: 'Velvet Skin Co.',
    price: 34.00,
    description: 'A rich, whipped body butter infused with shea butter, cocoa butter, and sweet almond oil. Deeply moisturizes and leaves skin feeling incredibly soft and supple.',
    images: [
      'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=400&fit=crop',
    ],
    category: 'bodycare',
    rating: 4.5,
    reviewCount: 143,
    tags: ['Nourishing', 'Rich', 'Natural'],
    inStock: false,
    isFeatured: false,
    isNew: false,
    stockQuantity: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p11',
    name: 'Rose Petal Face Mist',
    brand: 'Petal Luxe',
    price: 22.00,
    description: 'A refreshing face mist made with pure rose water and hyaluronic acid. Hydrates, soothes, and sets makeup beautifully. Perfect for an instant pick-me-up throughout the day.',
    images: [
      'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=400&fit=crop',
    ],
    category: 'skincare',
    rating: 4.3,
    reviewCount: 89,
    tags: ['Refreshing', 'Hydrating', 'Setting spray'],
    inStock: true,
    isFeatured: false,
    isNew: true,
    stockQuantity: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p12',
    name: 'Curl Defining Cream',
    brand: 'Tresse',
    price: 28.00,
    description: 'A moisturizing cream that defines curls, reduces frizz, and adds bounce. Formulated with coconut oil, shea butter, and botanical extracts for naturally beautiful curls.',
    images: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    ],
    category: 'haircare',
    rating: 4.4,
    reviewCount: 112,
    tags: ['Curl-defining', 'Anti-frizz', 'Moisturizing'],
    inStock: true,
    isFeatured: false,
    isNew: false,
    createdAt: new Date().toISOString(),
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.isFeatured);
}

export function getNewProducts(): Product[] {
  return products.filter(p => p.isNew);
}

export function searchProducts(query: string): Product[] {
  const lower = query.toLowerCase();
  return products.filter(
    p =>
      p.name.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower) ||
      p.tags.some(t => t.toLowerCase().includes(lower)) ||
      p.category.toLowerCase().includes(lower)
  );
}
