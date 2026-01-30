-- ============================================
-- ASIN-Level Ads Metrics Table
-- Created: January 31, 2026
-- Purpose: Store per-ASIN advertising spend and performance data
-- ============================================

-- ============================================
-- 1. ASIN-LEVEL ADS METRICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ads_asin_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- ASIN identification
  asin TEXT NOT NULL,
  sku TEXT,

  -- Spend and Sales (from Sponsored Products only)
  spend DECIMAL(12,2) DEFAULT 0,        -- cost
  sales DECIMAL(12,2) DEFAULT 0,        -- attributed sales (14d)

  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,              -- purchases (14d)

  -- Calculated metrics (stored for quick access)
  acos DECIMAL(8,4),                     -- (spend / sales) * 100
  roas DECIMAL(8,4),                     -- sales / spend
  ctr DECIMAL(8,4),                      -- (clicks / impressions) * 100
  cpc DECIMAL(8,4),                      -- spend / clicks

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, profile_id, date, asin)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ads_asin_daily_metrics_user_date
  ON ads_asin_daily_metrics(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_ads_asin_daily_metrics_user_asin
  ON ads_asin_daily_metrics(user_id, asin);

CREATE INDEX IF NOT EXISTS idx_ads_asin_daily_metrics_user_asin_date
  ON ads_asin_daily_metrics(user_id, asin, date DESC);

CREATE INDEX IF NOT EXISTS idx_ads_asin_daily_metrics_profile_date
  ON ads_asin_daily_metrics(profile_id, date DESC);

-- RLS for ads_asin_daily_metrics
ALTER TABLE ads_asin_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ASIN ads metrics"
  ON ads_asin_daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ASIN ads metrics"
  ON ads_asin_daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ASIN ads metrics"
  ON ads_asin_daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. HELPER FUNCTION: Get ASIN ads for date range
-- ============================================

CREATE OR REPLACE FUNCTION get_asin_ads_metrics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  asin TEXT,
  sku TEXT,
  total_spend DECIMAL,
  total_sales DECIMAL,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_orders BIGINT,
  avg_acos DECIMAL,
  avg_roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aam.asin,
    MAX(aam.sku) AS sku,
    COALESCE(SUM(aam.spend), 0)::DECIMAL AS total_spend,
    COALESCE(SUM(aam.sales), 0)::DECIMAL AS total_sales,
    COALESCE(SUM(aam.impressions), 0)::BIGINT AS total_impressions,
    COALESCE(SUM(aam.clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(aam.orders), 0)::BIGINT AS total_orders,
    CASE
      WHEN SUM(aam.sales) > 0 THEN
        (SUM(aam.spend) / SUM(aam.sales) * 100)::DECIMAL
      ELSE 0
    END AS avg_acos,
    CASE
      WHEN SUM(aam.spend) > 0 THEN
        (SUM(aam.sales) / SUM(aam.spend))::DECIMAL
      ELSE 0
    END AS avg_roas
  FROM ads_asin_daily_metrics aam
  WHERE aam.user_id = p_user_id
    AND aam.date >= p_start_date
    AND aam.date <= p_end_date
  GROUP BY aam.asin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. GRANT PERMISSIONS (Service Role)
-- ============================================

GRANT ALL ON ads_asin_daily_metrics TO service_role;

-- ============================================
-- Done!
-- ============================================

COMMENT ON TABLE ads_asin_daily_metrics IS 'Daily per-ASIN advertising metrics (spend, sales, ACOS) from Sponsored Products';
