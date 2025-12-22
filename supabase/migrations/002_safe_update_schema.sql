-- ============================================================================
-- SellerGenix - Safe Schema Update
-- Sadece eksik olanları ekler, var olanları update eder
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Update if exists
-- ============================================================================

-- Eksik kolonları ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketplace_ids TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies - Drop and recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 2. PRODUCTS TABLE - Update if exists
-- ============================================================================

-- Eksik kolonları ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace TEXT DEFAULT 'US';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fbm_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cogs_type TEXT DEFAULT 'constant';
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- RLS enable
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PRODUCT COGS HISTORY - Create if not exists
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

CREATE INDEX IF NOT EXISTS idx_product_cogs_history_product_id ON product_cogs_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cogs_history_dates ON product_cogs_history(start_date, end_date);

ALTER TABLE product_cogs_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own product COGS history" ON product_cogs_history;
CREATE POLICY "Users can view own product COGS history" ON product_cogs_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own product COGS history" ON product_cogs_history;
CREATE POLICY "Users can insert own product COGS history" ON product_cogs_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own product COGS history" ON product_cogs_history;
CREATE POLICY "Users can update own product COGS history" ON product_cogs_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own product COGS history" ON product_cogs_history;
CREATE POLICY "Users can delete own product COGS history" ON product_cogs_history
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products WHERE products.id = product_cogs_history.product_id AND products.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. MONTHLY EXPENSES - Create if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint - drop and recreate
ALTER TABLE monthly_expenses DROP CONSTRAINT IF EXISTS monthly_expenses_user_id_month_category_description_key;
ALTER TABLE monthly_expenses ADD CONSTRAINT monthly_expenses_unique UNIQUE(user_id, month, category, description);

CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_month ON monthly_expenses(user_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_category ON monthly_expenses(category);

ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenses" ON monthly_expenses;
CREATE POLICY "Users can view own expenses" ON monthly_expenses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON monthly_expenses;
CREATE POLICY "Users can insert own expenses" ON monthly_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON monthly_expenses;
CREATE POLICY "Users can update own expenses" ON monthly_expenses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON monthly_expenses;
CREATE POLICY "Users can delete own expenses" ON monthly_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. DAILY METRICS - Update if exists
-- ============================================================================

-- Eksik kolonları ekle
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_metrics') THEN
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS orders INTEGER DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS refund_units INTEGER DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS referral_fee DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS fba_fulfillment_fee DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS storage_fee DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS other_fees DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS ad_sales DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(10,2);
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS sessions INTEGER;
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2);
    ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- 6. PPC CAMPAIGNS - Update if exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ppc_campaigns') THEN
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT;
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS orders INTEGER DEFAULT 0;
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS cpc DECIMAL(5,2);
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS ctr DECIMAL(5,2);
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS cvr DECIMAL(5,2);
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS roas DECIMAL(5,2);
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT false;
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS target_acos DECIMAL(5,2);
    ALTER TABLE ppc_campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- 7. TRIGGERS - Create or replace
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_monthly_expenses_updated_at ON monthly_expenses;
DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
DROP TRIGGER IF EXISTS update_ppc_campaigns_updated_at ON ppc_campaigns;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_expenses_updated_at BEFORE UPDATE ON monthly_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_metrics') THEN
    CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ppc_campaigns') THEN
    CREATE TRIGGER update_ppc_campaigns_updated_at BEFORE UPDATE ON ppc_campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 8. HELPER FUNCTIONS - Create or replace
-- ============================================================================

-- Get monthly expenses total
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

-- Get product COGS for a specific date
CREATE OR REPLACE FUNCTION get_product_cogs(prod_id UUID, target_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  product_record RECORD;
  historical_cogs DECIMAL;
BEGIN
  SELECT * INTO product_record FROM products WHERE id = prod_id;

  IF product_record.cogs_type = 'constant' THEN
    RETURN product_record.cogs;
  END IF;

  SELECT cogs INTO historical_cogs
  FROM product_cogs_history
  WHERE product_id = prod_id
    AND start_date <= target_date
    AND (end_date IS NULL OR end_date >= target_date)
  ORDER BY start_date DESC
  LIMIT 1;

  RETURN COALESCE(historical_cogs, product_record.cogs);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
