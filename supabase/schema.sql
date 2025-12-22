-- ============================================
-- SELLERGENIX DATABASE SCHEMA
-- ============================================
-- This schema includes authentication, profiles, Amazon connections, and subscriptions
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- User profiles with company info and preferences
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  currency TEXT DEFAULT 'USD',
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'starter', -- 'starter' | 'professional' | 'enterprise'
  subscription_status TEXT DEFAULT 'trialing', -- 'trialing' | 'active' | 'canceled' | 'past_due'
  trial_ends_at TIMESTAMPTZ,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  email_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AMAZON CONNECTIONS TABLE
-- ============================================
-- Store Amazon SP-API refresh tokens and seller info
CREATE TABLE IF NOT EXISTS amazon_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL, -- Amazon Seller ID
  seller_name TEXT,
  marketplace_ids TEXT[] NOT NULL, -- ['ATVPDKIKX0DER', 'A2EUQ1WTGCTBG2']
  refresh_token TEXT NOT NULL, -- Encrypted Amazon refresh token
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  region TEXT NOT NULL, -- 'na' | 'eu' | 'fe'
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

-- ============================================
-- 3. TEAM MEMBERS TABLE
-- ============================================
-- Multi-user support: Share same Amazon account with team
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer', -- 'owner' | 'admin' | 'editor' | 'viewer'
  permissions JSONB DEFAULT '{"view_dashboard": true, "edit_products": false, "manage_ppc": false, "view_financials": true}'::jsonb,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

-- ============================================
-- 4. SUBSCRIPTION PLANS TABLE
-- ============================================
-- Subscription plan details
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'starter' | 'professional' | 'enterprise'
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_orders INTEGER, -- NULL = unlimited
  max_team_members INTEGER NOT NULL,
  max_regions INTEGER, -- NULL = all regions
  features JSONB NOT NULL, -- Feature flags
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCTS TABLE
-- ============================================
-- Amazon products catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  sku TEXT,
  title TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  fba_stock INTEGER DEFAULT 0,
  cogs DECIMAL(10,2), -- Cost of Goods Sold
  cogs_type TEXT DEFAULT 'constant', -- 'constant' | 'period-based'
  status TEXT DEFAULT 'active', -- 'active' | 'inactive' | 'suppressed'
  bsr INTEGER, -- Best Seller Rank
  marketplace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asin, marketplace_id)
);

-- ============================================
-- 6. DAILY METRICS TABLE
-- ============================================
-- Daily performance metrics per product
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sales DECIMAL(10,2) DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  refund_units INTEGER DEFAULT 0,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  amazon_fees DECIMAL(10,2) DEFAULT 0,
  gross_profit DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  margin DECIMAL(5,2), -- Profit margin percentage
  roi DECIMAL(5,2), -- Return on investment
  bsr INTEGER, -- Best Seller Rank snapshot
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, date)
);

-- ============================================
-- 7. PPC CAMPAIGNS TABLE
-- ============================================
-- PPC campaign tracking and automation
CREATE TABLE IF NOT EXISTS ppc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT, -- 'SP' | 'SB' | 'SD'
  status TEXT DEFAULT 'ENABLED', -- 'ENABLED' | 'PAUSED' | 'ARCHIVED'
  targeting_type TEXT, -- 'AUTO' | 'MANUAL'
  daily_budget DECIMAL(10,2),
  automation_enabled BOOLEAN DEFAULT false,
  automation_strategy TEXT, -- 'target_acos' | 'maximize_profit' | 'launch' | 'rank_support'
  target_acos DECIMAL(5,2),
  break_even_acos DECIMAL(5,2),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  acos DECIMAL(5,2),
  roas DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);

CREATE INDEX IF NOT EXISTS idx_amazon_connections_user ON amazon_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_amazon_connections_seller ON amazon_connections(seller_id);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);

CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_product ON daily_metrics(product_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_ppc_campaigns_user_date ON ppc_campaigns(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ppc_campaigns_id ON ppc_campaigns(campaign_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppc_campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Amazon Connections: Users can only see their own connections
CREATE POLICY "Users can view own amazon connections" ON amazon_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own amazon connections" ON amazon_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own amazon connections" ON amazon_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own amazon connections" ON amazon_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Team Members: Users can see teams they own or are members of
CREATE POLICY "Users can view teams they own" ON team_members
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "Owners can manage their team" ON team_members
  FOR ALL USING (auth.uid() = owner_id);

-- Products: Users can see their own products + team products
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT member_id FROM team_members WHERE owner_id = user_id)
  );

CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Daily Metrics: Users can see their own metrics + team metrics
CREATE POLICY "Users can view own metrics" ON daily_metrics
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT member_id FROM team_members WHERE owner_id = user_id)
  );

CREATE POLICY "Users can manage own metrics" ON daily_metrics
  FOR ALL USING (auth.uid() = user_id);

-- PPC Campaigns: Users can see their own campaigns + team campaigns
CREATE POLICY "Users can view own campaigns" ON ppc_campaigns
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT member_id FROM team_members WHERE owner_id = user_id)
  );

CREATE POLICY "Users can manage own campaigns" ON ppc_campaigns
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_connections_updated_at BEFORE UPDATE ON amazon_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppc_campaigns_updated_at BEFORE UPDATE ON ppc_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: SUBSCRIPTION PLANS
-- ============================================

INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, max_orders, max_team_members, max_regions, features) VALUES
  (
    'starter',
    'Starter',
    9.99,
    99.90,
    500,
    2,
    1,
    '{
      "dashboard": true,
      "products": true,
      "basic_ppc": true,
      "inventory_alerts": true,
      "email_notifications": true,
      "whatsapp_morning_report": true,
      "ai_insights": false,
      "ppc_automation": false,
      "advanced_analytics": false,
      "api_access": false,
      "priority_support": false
    }'::jsonb
  ),
  (
    'professional',
    'Professional',
    19.99,
    199.90,
    3000,
    5,
    3,
    '{
      "dashboard": true,
      "products": true,
      "basic_ppc": true,
      "inventory_alerts": true,
      "email_notifications": true,
      "whatsapp_morning_report": true,
      "whatsapp_ppc_report": true,
      "ai_insights": true,
      "ppc_automation": true,
      "advanced_analytics": true,
      "predictive_analytics": true,
      "fba_reimbursements": true,
      "email_automation": true,
      "custom_reports": true,
      "api_access": false,
      "priority_support": true
    }'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    49.99,
    499.90,
    NULL,
    10,
    NULL,
    '{
      "dashboard": true,
      "products": true,
      "basic_ppc": true,
      "inventory_alerts": true,
      "email_notifications": true,
      "whatsapp_morning_report": true,
      "whatsapp_ppc_report": true,
      "whatsapp_broadcasts": true,
      "ai_insights": true,
      "ai_assistant": true,
      "ppc_automation": true,
      "advanced_analytics": true,
      "predictive_analytics": true,
      "fba_reimbursements": true,
      "email_automation": true,
      "custom_reports": true,
      "white_label_reports": true,
      "api_access": true,
      "custom_integrations": true,
      "dedicated_manager": true,
      "priority_support": true,
      "phone_support": true
    }'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTION: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SCHEMA COMPLETE!
-- ============================================
-- Now you can start building authentication UI
