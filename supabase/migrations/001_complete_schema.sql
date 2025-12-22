-- ============================================================================
-- SellerGenix - Complete Database Schema
-- Comprehensive Amazon Seller Analytics Platform
-- ============================================================================

-- Clean slate (opsiyonel - sadece development için!)
-- PRODUCTION'DA BUNU KULLANMA!
-- DROP TABLE IF EXISTS ppc_campaigns CASCADE;
-- DROP TABLE IF EXISTS daily_metrics CASCADE;
-- DROP TABLE IF EXISTS monthly_expenses CASCADE;
-- DROP TABLE IF EXISTS product_cogs_history CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  amazon_seller_id TEXT UNIQUE,
  marketplace_ids TEXT[], -- ['ATVPDKIKX0DER', 'A1PA6795UKMFR9']
  subscription_tier TEXT DEFAULT 'free', -- 'free' | 'starter' | 'professional' | 'enterprise'
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 2. PRODUCTS (Amazon Listings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  sku TEXT,
  title TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  marketplace TEXT DEFAULT 'US', -- 'US', 'UK', 'DE', etc.

  -- Inventory
  fba_stock INTEGER DEFAULT 0,
  fbm_stock INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,

  -- Cost of Goods Sold
  cogs DECIMAL(10,2),
  cogs_type TEXT DEFAULT 'constant', -- 'constant' | 'period-based'

  -- Product specs (for fee calculation)
  weight_lbs DECIMAL(8,2),
  length_inches DECIMAL(8,2),
  width_inches DECIMAL(8,2),
  height_inches DECIMAL(8,2),

  -- Category
  product_category TEXT, -- 'Home & Kitchen', 'Electronics', etc.

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, asin, marketplace)
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Row Level Security for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PRODUCT COGS HISTORY (Period-based cost tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_cogs_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  cogs DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_cogs_history_product_id ON product_cogs_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cogs_history_dates ON product_cogs_history(start_date, end_date);

-- Row Level Security
ALTER TABLE product_cogs_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product COGS history" ON product_cogs_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product COGS history" ON product_cogs_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. MONTHLY EXPENSES (Indirect business expenses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- '2025-03-01'
  category TEXT NOT NULL, -- 'software', 'photography', 'accounting', 'shipping', 'va', 'other'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, month, category, description)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_month ON monthly_expenses(user_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_category ON monthly_expenses(category);

-- Row Level Security
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON monthly_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON monthly_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON monthly_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON monthly_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. DAILY METRICS (Sales, profits, performance data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Sales data
  sales DECIMAL(10,2) DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,

  -- Returns & refunds
  refunds DECIMAL(10,2) DEFAULT 0,
  refund_units INTEGER DEFAULT 0,

  -- Amazon fees (from Finances API)
  referral_fee DECIMAL(10,2) DEFAULT 0,
  fba_fulfillment_fee DECIMAL(10,2) DEFAULT 0,
  storage_fee DECIMAL(10,2) DEFAULT 0,
  other_fees DECIMAL(10,2) DEFAULT 0,
  amazon_fees DECIMAL(10,2) DEFAULT 0, -- Total

  -- Advertising
  ad_spend DECIMAL(10,2) DEFAULT 0,
  ad_sales DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Profit calculations
  gross_profit DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  margin DECIMAL(5,2), -- Profit margin %
  roi DECIMAL(5,2), -- Return on investment %

  -- Performance metrics
  bsr INTEGER, -- Best Seller Rank
  sessions INTEGER, -- Page views
  conversion_rate DECIMAL(5,2), -- %

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, product_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_product_date ON daily_metrics(product_id, date);

-- Row Level Security
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON daily_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON daily_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. PPC CAMPAIGNS (Amazon Advertising)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ppc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL, -- Amazon campaign ID
  campaign_name TEXT,
  campaign_type TEXT, -- 'sponsored_products', 'sponsored_brands', 'sponsored_display'

  -- Status
  status TEXT DEFAULT 'Active', -- 'Active' | 'Paused' | 'Archived'

  -- Budget & bidding
  daily_budget DECIMAL(10,2),
  current_bid DECIMAL(5,2),

  -- Performance (daily snapshot)
  date DATE NOT NULL,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,

  -- Metrics
  acos DECIMAL(5,2), -- Advertising Cost of Sales
  cpc DECIMAL(5,2), -- Cost per click
  ctr DECIMAL(5,2), -- Click-through rate
  cvr DECIMAL(5,2), -- Conversion rate
  roas DECIMAL(5,2), -- Return on ad spend

  -- Automation
  automation_enabled BOOLEAN DEFAULT false,
  break_even_acos DECIMAL(5,2),
  target_acos DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, campaign_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ppc_campaigns_user_date ON ppc_campaigns(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ppc_campaigns_campaign_id ON ppc_campaigns(campaign_id);

-- Row Level Security
ALTER TABLE ppc_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON ppc_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON ppc_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_expenses_updated_at BEFORE UPDATE ON monthly_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppc_campaigns_updated_at BEFORE UPDATE ON ppc_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's total expenses for a month
CREATE OR REPLACE FUNCTION get_monthly_expenses_total(user_uuid UUID, target_month DATE)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM monthly_expenses
    WHERE user_id = user_uuid AND month = target_month
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product COGS for a specific date
CREATE OR REPLACE FUNCTION get_product_cogs(prod_id UUID, target_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  product_record RECORD;
  historical_cogs DECIMAL;
BEGIN
  -- Get product info
  SELECT * INTO product_record FROM products WHERE id = prod_id;

  -- If constant COGS, return it
  IF product_record.cogs_type = 'constant' THEN
    RETURN product_record.cogs;
  END IF;

  -- Otherwise, look up historical COGS
  SELECT cogs INTO historical_cogs
  FROM product_cogs_history
  WHERE product_id = prod_id
    AND start_date <= target_date
    AND (end_date IS NULL OR end_date >= target_date)
  ORDER BY start_date DESC
  LIMIT 1;

  -- Return historical COGS or fallback to constant
  RETURN COALESCE(historical_cogs, product_record.cogs);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

-- Verify tables created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
