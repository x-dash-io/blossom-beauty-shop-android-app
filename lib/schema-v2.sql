-- Blossom Beauty Store - Schema Update v2
-- Run this in Supabase SQL Editor to add stock tracking and cart persistence

-- ============================================
-- Stock Quantity
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 100;

UPDATE products SET stock_quantity = 0, in_stock = false WHERE id = 'p10';
UPDATE products SET stock_quantity = 3 WHERE id = 'p11';
UPDATE products SET stock_quantity = 5 WHERE id = 'p4';

-- ============================================
-- Cart Items (persistent cart for logged-in users)
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);
