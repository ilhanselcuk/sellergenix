-- ============================================
-- Amazon Ads API Integration Tables
-- Created: January 30, 2026
-- ============================================

-- ============================================
-- 1. OAUTH STATES TABLE (for CSRF protection)
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_token TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'amazon_ads',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_lookup
  ON oauth_states(user_id, provider, state_token);

-- Auto-cleanup expired states (optional trigger)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS for oauth_states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own oauth states"
  ON oauth_states FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 2. AMAZON ADS CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS amazon_ads_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  profile_name TEXT,
  marketplace_id TEXT,
  country_code TEXT,
  currency_code TEXT DEFAULT 'USD',
  account_type TEXT DEFAULT 'seller', -- seller, vendor, agency
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amazon_ads_connections_user
  ON amazon_ads_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_amazon_ads_connections_active
  ON amazon_ads_connections(user_id, is_active);

-- RLS for amazon_ads_connections
ALTER TABLE amazon_ads_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ads connections"
  ON amazon_ads_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads connections"
  ON amazon_ads_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads connections"
  ON amazon_ads_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads connections"
  ON amazon_ads_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. ADS METRICS TABLE (Daily snapshots)
-- ============================================

CREATE TABLE IF NOT EXISTS ads_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Spend by campaign type
  total_spend DECIMAL(12,2) DEFAULT 0,
  sp_spend DECIMAL(12,2) DEFAULT 0,    -- Sponsored Products
  sb_spend DECIMAL(12,2) DEFAULT 0,    -- Sponsored Brands
  sbv_spend DECIMAL(12,2) DEFAULT 0,   -- Sponsored Brands Video (separate from SB)
  sd_spend DECIMAL(12,2) DEFAULT 0,    -- Sponsored Display

  -- Attributed sales (14-day window)
  total_sales DECIMAL(12,2) DEFAULT 0,
  sp_sales DECIMAL(12,2) DEFAULT 0,
  sb_sales DECIMAL(12,2) DEFAULT 0,
  sbv_sales DECIMAL(12,2) DEFAULT 0,   -- Sponsored Brands Video sales
  sd_sales DECIMAL(12,2) DEFAULT 0,

  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  units INTEGER DEFAULT 0,

  -- Calculated metrics (stored for quick access)
  acos DECIMAL(8,4),          -- (spend / sales) * 100
  roas DECIMAL(8,4),          -- sales / spend
  ctr DECIMAL(8,4),           -- (clicks / impressions) * 100
  cpc DECIMAL(8,4),           -- spend / clicks
  cvr DECIMAL(8,4),           -- (orders / clicks) * 100

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, profile_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ads_daily_metrics_user_date
  ON ads_daily_metrics(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_ads_daily_metrics_profile_date
  ON ads_daily_metrics(profile_id, date DESC);

-- RLS for ads_daily_metrics
ALTER TABLE ads_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ads metrics"
  ON ads_daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads metrics"
  ON ads_daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads metrics"
  ON ads_daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. ADS CAMPAIGNS TABLE (Campaign tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  campaign_type TEXT, -- sponsoredProducts, sponsoredBrands, sponsoredDisplay
  targeting_type TEXT, -- manual, auto
  state TEXT DEFAULT 'enabled', -- enabled, paused, archived
  daily_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,

  -- Latest metrics (updated daily)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  acos DECIMAL(8,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, profile_id, campaign_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_user
  ON ads_campaigns(user_id);

CREATE INDEX IF NOT EXISTS idx_ads_campaigns_profile
  ON ads_campaigns(profile_id);

-- RLS for ads_campaigns
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
  ON ads_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own campaigns"
  ON ads_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get active ads connection for a user
CREATE OR REPLACE FUNCTION get_user_ads_connection(p_user_id UUID)
RETURNS TABLE (
  profile_id TEXT,
  profile_name TEXT,
  country_code TEXT,
  refresh_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aac.profile_id,
    aac.profile_name,
    aac.country_code,
    aac.refresh_token
  FROM amazon_ads_connections aac
  WHERE aac.user_id = p_user_id
    AND aac.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregated ads metrics for a date range
CREATE OR REPLACE FUNCTION get_ads_metrics_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
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
    COALESCE(SUM(adm.total_spend), 0)::DECIMAL AS total_spend,
    COALESCE(SUM(adm.total_sales), 0)::DECIMAL AS total_sales,
    COALESCE(SUM(adm.impressions), 0)::BIGINT AS total_impressions,
    COALESCE(SUM(adm.clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(adm.orders), 0)::BIGINT AS total_orders,
    CASE
      WHEN SUM(adm.total_sales) > 0 THEN
        (SUM(adm.total_spend) / SUM(adm.total_sales) * 100)::DECIMAL
      ELSE 0
    END AS avg_acos,
    CASE
      WHEN SUM(adm.total_spend) > 0 THEN
        (SUM(adm.total_sales) / SUM(adm.total_spend))::DECIMAL
      ELSE 0
    END AS avg_roas
  FROM ads_daily_metrics adm
  WHERE adm.user_id = p_user_id
    AND adm.date >= p_start_date
    AND adm.date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. GRANT PERMISSIONS (Service Role)
-- ============================================

-- Allow service role to bypass RLS
GRANT ALL ON oauth_states TO service_role;
GRANT ALL ON amazon_ads_connections TO service_role;
GRANT ALL ON ads_daily_metrics TO service_role;
GRANT ALL ON ads_campaigns TO service_role;

-- ============================================
-- Done!
-- ============================================

COMMENT ON TABLE amazon_ads_connections IS 'Stores Amazon Advertising API connections (OAuth tokens and profile info)';
COMMENT ON TABLE ads_daily_metrics IS 'Daily advertising metrics snapshots (spend, sales, ACOS, etc.)';
COMMENT ON TABLE ads_campaigns IS 'Campaign information and latest performance metrics';
COMMENT ON TABLE oauth_states IS 'Temporary OAuth state tokens for CSRF protection';
