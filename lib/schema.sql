-- Blossom Beauty Store - Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL,
  price numeric NOT NULL,
  description text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  category text NOT NULL,
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  image text NOT NULL DEFAULT '',
  product_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL,
  shipping numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  date timestamptz NOT NULL DEFAULT now(),
  address jsonb NOT NULL,
  tracking_events jsonb NOT NULL DEFAULT '[]',
  estimated_delivery timestamptz,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  product_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  helpful integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text,
  zip_code text,
  phone text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Reviews helpful can be updated" ON reviews FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own addresses" ON user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own addresses" ON user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON user_addresses FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Categories
-- ============================================

INSERT INTO categories (id, name, image, product_count) VALUES
  ('skincare', 'Skincare', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&h=200&fit=crop', 4),
  ('makeup', 'Makeup', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', 3),
  ('fragrance', 'Fragrance', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop', 1),
  ('haircare', 'Haircare', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&h=200&fit=crop', 2),
  ('tools', 'Tools', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop', 1),
  ('bodycare', 'Body Care', 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=200&h=200&fit=crop', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED DATA - Products
-- ============================================

INSERT INTO products (id, name, brand, price, description, images, category, rating, review_count, tags, in_stock, is_featured, is_new) VALUES
  ('p1', 'Hydrating Rose Serum', 'Petal Luxe', 48.00,
   'A lightweight, fast-absorbing serum infused with rose extract and hyaluronic acid. Deeply hydrates and plumps skin for a radiant, dewy complexion. Suitable for all skin types.',
   ARRAY['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop','https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop'],
   'skincare', 4.8, 234, ARRAY['Hydrating','Anti-aging','Vegan'], true, true, false),

  ('p2', 'Velvet Matte Lipstick', 'Rouge Belle', 32.00,
   'Rich, creamy lipstick that delivers intense color with a velvety matte finish. Long-wearing formula keeps lips moisturized all day. Available in 12 stunning shades.',
   ARRAY['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop','https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop'],
   'makeup', 4.6, 189, ARRAY['Matte','Long-wearing','Cruelty-free'], true, true, false),

  ('p3', 'Midnight Bloom Eau de Parfum', 'Maison Flora', 120.00,
   'An enchanting fragrance that opens with notes of jasmine and bergamot, melting into a heart of tuberose and vanilla. The base of sandalwood and musk lingers beautifully.',
   ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop','https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop'],
   'fragrance', 4.9, 312, ARRAY['Floral','Long-lasting','Luxury'], true, true, true),

  ('p4', 'Gentle Foam Cleanser', 'Petal Luxe', 28.00,
   'A pH-balanced foaming cleanser that gently removes impurities without stripping the skin. Enriched with chamomile and green tea extracts for a soothing cleanse.',
   ARRAY['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop'],
   'skincare', 4.5, 156, ARRAY['Gentle','pH-balanced','All skin types'], true, false, false),

  ('p5', 'Luminous Foundation SPF 30', 'Glow Studio', 42.00,
   'A buildable, medium-coverage foundation that creates a natural, luminous finish. Infused with SPF 30 and nourishing botanicals to protect and perfect your complexion.',
   ARRAY['https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=400&h=400&fit=crop'],
   'makeup', 4.4, 98, ARRAY['SPF 30','Buildable','Natural finish'], true, false, true),

  ('p6', 'Silk Hair Repair Oil', 'Tresse', 36.00,
   'Lightweight, non-greasy hair oil that repairs and strengthens damaged hair. Formulated with argan oil, vitamin E, and silk proteins for incredible shine and softness.',
   ARRAY['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop'],
   'haircare', 4.7, 203, ARRAY['Repairing','Lightweight','Silky'], true, true, false),

  ('p7', 'Professional Brush Set', 'Artisan Beauty', 65.00,
   'A curated set of 12 essential brushes crafted with ultra-soft synthetic bristles. Includes brushes for foundation, powder, contour, eyeshadow, and blending.',
   ARRAY['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop'],
   'tools', 4.8, 267, ARRAY['Professional','Synthetic','Complete set'], true, false, false),

  ('p8', 'Vitamin C Brightening Cream', 'Derma Glow', 55.00,
   'A potent brightening cream featuring stabilized vitamin C, niacinamide, and licorice extract. Targets dark spots, uneven skin tone, and dullness for a radiant complexion.',
   ARRAY['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop'],
   'skincare', 4.6, 178, ARRAY['Brightening','Vitamin C','Anti-spot'], true, false, true),

  ('p9', 'Eyeshadow Palette - Sunset', 'Rouge Belle', 52.00,
   'A stunning palette of 18 highly pigmented shades ranging from warm nudes to rich coppers. Features a mix of matte, shimmer, and metallic finishes for endless looks.',
   ARRAY['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop'],
   'makeup', 4.7, 221, ARRAY['Pigmented','Versatile','Long-wearing'], true, true, false),

  ('p10', 'Nourishing Body Butter', 'Velvet Skin Co.', 34.00,
   'A rich, whipped body butter infused with shea butter, cocoa butter, and sweet almond oil. Deeply moisturizes and leaves skin feeling incredibly soft and supple.',
   ARRAY['https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=400&fit=crop'],
   'bodycare', 4.5, 143, ARRAY['Nourishing','Rich','Natural'], true, false, false),

  ('p11', 'Rose Petal Face Mist', 'Petal Luxe', 22.00,
   'A refreshing face mist made with pure rose water and hyaluronic acid. Hydrates, soothes, and sets makeup beautifully. Perfect for an instant pick-me-up throughout the day.',
   ARRAY['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=400&fit=crop'],
   'skincare', 4.3, 89, ARRAY['Refreshing','Hydrating','Setting spray'], true, false, true),

  ('p12', 'Curl Defining Cream', 'Tresse', 28.00,
   'A moisturizing cream that defines curls, reduces frizz, and adds bounce. Formulated with coconut oil, shea butter, and botanical extracts for naturally beautiful curls.',
   ARRAY['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop'],
   'haircare', 4.4, 112, ARRAY['Curl-defining','Anti-frizz','Moisturizing'], true, false, false)
ON CONFLICT (id) DO NOTHING;
