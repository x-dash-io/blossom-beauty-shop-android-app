-- Blossom Beauty Store - Schema Update v4
-- Security Hardening & Audit Logging
-- Run this in Supabase SQL Editor

-- ============================================
-- Audit Logging
-- ============================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id text REFERENCES payments(id),
  order_id text,
  user_id uuid,
  action text NOT NULL, -- 'stk_push_initiated', 'callback_received', 'error'
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only service_role can access logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Security Hardening: Tighten RLS
-- ============================================

-- 1. Remove UPDATE permission on payments for authenticated users
-- They should only be able to view and initiate (INSERT), not modify status.
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

-- 2. Ensure only service_role can update payment status
-- (Service role bypasses RLS, so we just remove the user's ability)

-- 3. Restrict order updates
-- Users should not be able to change order status once placed
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders 
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
  (SELECT status FROM orders WHERE id = orders.id) = 'pending_payment' AND
  status IN ('pending_payment', 'cancelled')
);

-- 4. Restrict reviews UPDATE policy
-- Original policy allows anyone to update any field on any review.
-- Replace with a policy that only allows updating the 'helpful' count.
DROP POLICY IF EXISTS "Reviews helpful can be updated" ON reviews;
CREATE POLICY "Reviews helpful can be updated" ON reviews
FOR UPDATE USING (true)
WITH CHECK (
  rating = (SELECT r.rating FROM reviews r WHERE r.id = reviews.id) AND
  title = (SELECT r.title FROM reviews r WHERE r.id = reviews.id) AND
  body = (SELECT r.body FROM reviews r WHERE r.id = reviews.id) AND
  user_id = (SELECT r.user_id FROM reviews r WHERE r.id = reviews.id) AND
  user_name = (SELECT r.user_name FROM reviews r WHERE r.id = reviews.id) AND
  product_id = (SELECT r.product_id FROM reviews r WHERE r.id = reviews.id)
);

-- ============================================
-- Data Integrity: Reviews Validation
-- ============================================

-- Add constraints to reviews
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_body_length;
ALTER TABLE reviews ADD CONSTRAINT reviews_body_length CHECK (char_length(body) <= 1000);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_title_length;
ALTER TABLE reviews ADD CONSTRAINT reviews_title_length CHECK (char_length(title) <= 100);

-- Ensure users can only review a product once
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_product_unique;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_product_unique UNIQUE (user_id, product_id);
