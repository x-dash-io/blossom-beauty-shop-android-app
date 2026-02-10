-- Blossom Beauty Store - Schema Update v3
-- M-Pesa Payment Integration
-- Run this in Supabase SQL Editor

-- ============================================
-- Payments Table
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  order_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'mpesa',
  status text NOT NULL DEFAULT 'pending',
  mpesa_receipt_number text,
  checkout_request_id text,
  merchant_request_id text,
  result_code text,
  result_desc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_request_id ON payments(checkout_request_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Order Table Updates
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash_on_delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id text;

-- Allow order status updates from app (for payment confirmation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;
