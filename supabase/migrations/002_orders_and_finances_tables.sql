-- Orders and Finances Tables Migration
-- Run this in Supabase SQL Editor

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amazon_order_id TEXT NOT NULL,
  purchase_date TIMESTAMPTZ,
  order_status TEXT,
  fulfillment_channel TEXT, -- AFN (FBA) or MFN (Merchant)
  order_total DECIMAL(10,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  items_shipped INTEGER DEFAULT 0,
  items_unshipped INTEGER DEFAULT 0,
  marketplace_id TEXT,
  is_prime BOOLEAN DEFAULT false,
  is_business_order BOOLEAN DEFAULT false,
  ship_city TEXT,
  ship_state TEXT,
  ship_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, amazon_order_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_purchase_date ON orders(purchase_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amazon_order_id TEXT NOT NULL,
  order_item_id TEXT NOT NULL,
  asin TEXT,
  seller_sku TEXT,
  title TEXT,
  quantity_ordered INTEGER DEFAULT 0,
  quantity_shipped INTEGER DEFAULT 0,
  item_price DECIMAL(10,2) DEFAULT 0,
  item_tax DECIMAL(10,2) DEFAULT 0,
  shipping_price DECIMAL(10,2) DEFAULT 0,
  promotion_discount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, order_item_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_amazon_order_id ON order_items(amazon_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_asin ON order_items(asin);

-- RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own order items" ON order_items;
CREATE POLICY "Users can update own order items" ON order_items
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- DAILY METRICS TABLE (Update constraints)
-- =============================================
-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_metrics_user_id_date_key'
  ) THEN
    ALTER TABLE daily_metrics ADD CONSTRAINT daily_metrics_user_id_date_key UNIQUE (user_id, date);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE daily_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      sales DECIMAL(10,2) DEFAULT 0,
      units_sold INTEGER DEFAULT 0,
      refunds DECIMAL(10,2) DEFAULT 0,
      ad_spend DECIMAL(10,2) DEFAULT 0,
      amazon_fees DECIMAL(10,2) DEFAULT 0,
      gross_profit DECIMAL(10,2) DEFAULT 0,
      net_profit DECIMAL(10,2) DEFAULT 0,
      margin DECIMAL(5,2) DEFAULT 0,
      roi DECIMAL(5,2) DEFAULT 0,
      bsr INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      UNIQUE(user_id, date)
    );
END $$;

-- Index for daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);

-- RLS for daily_metrics
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily metrics" ON daily_metrics;
CREATE POLICY "Users can view own daily metrics" ON daily_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily metrics" ON daily_metrics;
CREATE POLICY "Users can insert own daily metrics" ON daily_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily metrics" ON daily_metrics;
CREATE POLICY "Users can update own daily metrics" ON daily_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FINANCIAL SUMMARIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_refunds DECIMAL(12,2) DEFAULT 0,
  total_fees DECIMAL(12,2) DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  margin DECIMAL(5,2) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_start, period_end)
);

-- Index for financial_summaries
CREATE INDEX IF NOT EXISTS idx_financial_summaries_user_id ON financial_summaries(user_id);

-- RLS for financial_summaries
ALTER TABLE financial_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own financial summaries" ON financial_summaries;
CREATE POLICY "Users can view own financial summaries" ON financial_summaries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own financial summaries" ON financial_summaries;
CREATE POLICY "Users can insert own financial summaries" ON financial_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own financial summaries" ON financial_summaries;
CREATE POLICY "Users can update own financial summaries" ON financial_summaries
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- SERVICE ROLE POLICIES (for background sync)
-- =============================================
-- These allow the service role to manage data during sync

DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage order items" ON order_items;
CREATE POLICY "Service role can manage order items" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage daily metrics" ON daily_metrics;
CREATE POLICY "Service role can manage daily metrics" ON daily_metrics
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage financial summaries" ON financial_summaries;
CREATE POLICY "Service role can manage financial summaries" ON financial_summaries
  FOR ALL USING (true) WITH CHECK (true);

-- Success message
SELECT 'Orders and Finances tables created successfully!' as status;
