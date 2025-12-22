-- =====================================================
-- SELLERGENIX ADMIN SYSTEM - Complete Database Schema
-- World-Class SaaS Admin Panel
-- Created: December 2025
-- =====================================================

-- =====================================================
-- 1. ADMIN USERS TABLE
-- Role-based access control for admin panel
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  is_active BOOLEAN DEFAULT true,

  -- Permissions (granular control)
  can_manage_admins BOOLEAN DEFAULT false,
  can_manage_customers BOOLEAN DEFAULT true,
  can_view_revenue BOOLEAN DEFAULT true,
  can_send_emails BOOLEAN DEFAULT true,
  can_view_audit_logs BOOLEAN DEFAULT true,
  can_modify_settings BOOLEAN DEFAULT false,

  -- Security
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =====================================================
-- 2. ADMIN SESSIONS TABLE
-- Track active admin sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);

-- =====================================================
-- 3. AUDIT LOGS TABLE
-- Comprehensive activity tracking (immutable)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor information
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'user', 'system', 'api')),
  actor_id UUID,
  actor_email TEXT,
  actor_name TEXT,
  actor_role TEXT,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'customer.created', 'subscription.canceled', 'admin.login'
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'email', 'other')),
  resource_type TEXT, -- e.g., 'customer', 'subscription', 'admin', 'settings'
  resource_id UUID,
  resource_name TEXT,

  -- Change details (JSON for flexibility)
  old_values JSONB,
  new_values JSONB,
  metadata JSONB, -- Additional context

  -- Request information
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- For compliance - logs should be immutable
  -- No UPDATE or DELETE triggers allowed
  CONSTRAINT audit_logs_immutable CHECK (true)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- 4. CUSTOMER SUBSCRIPTIONS TABLE
-- Track all subscription data for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription details
  plan_id TEXT NOT NULL, -- 'starter', 'professional', 'business', 'enterprise'
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused', 'expired')),

  -- Billing
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price_cents INTEGER NOT NULL, -- Store in cents for precision
  currency TEXT DEFAULT 'USD',

  -- Trial
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Subscription lifecycle
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  ended_at TIMESTAMPTZ,

  -- Payment provider
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON customer_subscriptions(stripe_subscription_id);

-- =====================================================
-- 5. TRANSACTIONS TABLE
-- Payment history and revenue tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES customer_subscriptions(id),

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund', 'credit', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'disputed')),

  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Description
  description TEXT,
  invoice_id TEXT,

  -- Payment method
  payment_method TEXT, -- 'card', 'bank_transfer', 'paypal'
  card_last4 TEXT,
  card_brand TEXT,

  -- Payment provider
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,

  -- Failure details
  failure_code TEXT,
  failure_message TEXT,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- =====================================================
-- 6. EMAIL LOGS TABLE
-- Track all sent emails for admin panel
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  recipient_id UUID REFERENCES auth.users(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Email details
  email_type TEXT NOT NULL, -- 'welcome', 'subscription_reminder', 'payment_failed', 'announcement', 'custom'
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,

  -- Template
  template_id TEXT,
  template_variables JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),

  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Provider
  provider TEXT DEFAULT 'resend', -- 'resend', 'sendgrid', 'ses'
  provider_message_id TEXT,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Sender
  sent_by_admin_id UUID REFERENCES admin_users(id),

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- =====================================================
-- 7. CUSTOMER HEALTH SCORES TABLE
-- Track customer health for success management
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Health score (0-100)
  overall_score INTEGER NOT NULL DEFAULT 50 CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Component scores
  engagement_score INTEGER DEFAULT 50,
  payment_score INTEGER DEFAULT 100,
  support_score INTEGER DEFAULT 50,
  adoption_score INTEGER DEFAULT 50,

  -- Risk indicators
  churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),
  last_active_at TIMESTAMPTZ,
  days_since_login INTEGER,

  -- Usage metrics
  total_logins INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  products_synced INTEGER DEFAULT 0,
  features_used TEXT[], -- Array of feature names

  -- Lifecycle
  customer_since TIMESTAMPTZ,
  lifetime_value_cents INTEGER DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_health_scores_user ON customer_health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_risk ON customer_health_scores(churn_risk);
CREATE INDEX IF NOT EXISTS idx_health_scores_overall ON customer_health_scores(overall_score);

-- =====================================================
-- 8. SYSTEM SETTINGS TABLE
-- Global admin settings
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'email', 'billing', 'security', 'features'
  is_public BOOLEAN DEFAULT false, -- Can be exposed to frontend
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- =====================================================
-- 9. ANNOUNCEMENTS TABLE
-- System announcements for all users
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')),

  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'paid', 'enterprise', 'custom')),
  target_user_ids UUID[],

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  show_on_dashboard BOOLEAN DEFAULT true,
  show_as_banner BOOLEAN DEFAULT false,

  -- Schedule
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, ends_at);

-- =====================================================
-- 10. EMAIL TEMPLATES TABLE
-- Reusable email templates
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Template type
  type TEXT NOT NULL, -- 'transactional', 'marketing', 'notification'
  category TEXT, -- 'onboarding', 'billing', 'alerts', 'announcements'

  -- Variables (JSON schema for validation)
  variables JSONB, -- ['user_name', 'plan_name', 'amount']

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);

-- =====================================================
-- 11. INSERT DEFAULT SUPER ADMIN
-- ilhan@mentoreis.com as initial super admin
-- Password will be set on first login
-- =====================================================
INSERT INTO admin_users (
  email,
  password_hash,
  full_name,
  role,
  is_active,
  can_manage_admins,
  can_manage_customers,
  can_view_revenue,
  can_send_emails,
  can_view_audit_logs,
  can_modify_settings
) VALUES (
  'ilhan@mentoreis.com',
  '', -- Empty, will be set on first login
  'Ilhan Selcuk',
  'super_admin',
  true,
  true,
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 12. INSERT DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (key, value, description, category) VALUES
  ('site_name', '"SellerGenix"', 'Site display name', 'general'),
  ('support_email', '"support@sellergenix.io"', 'Support email address', 'general'),
  ('trial_days', '14', 'Number of trial days for new users', 'billing'),
  ('max_free_products', '50', 'Maximum products for free tier', 'features'),
  ('enable_registration', 'true', 'Allow new user registration', 'security'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'general'),
  ('email_from_name', '"SellerGenix"', 'Email sender name', 'email'),
  ('email_from_address', '"noreply@sellergenix.io"', 'Email sender address', 'email')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 13. INSERT DEFAULT EMAIL TEMPLATES
-- =====================================================
INSERT INTO email_templates (name, description, subject, body_html, body_text, type, category, variables) VALUES
(
  'welcome',
  'Sent when a new user signs up',
  'Welcome to SellerGenix! Let''s grow your Amazon business',
  '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining SellerGenix. Your 14-day free trial has started.</p><p>Get started by connecting your Amazon account.</p>',
  'Welcome {{user_name}}! Thank you for joining SellerGenix.',
  'transactional',
  'onboarding',
  '["user_name", "trial_end_date"]'
),
(
  'trial_ending',
  'Sent 3 days before trial ends',
  'Your SellerGenix trial ends in 3 days',
  '<h1>Hi {{user_name}},</h1><p>Your free trial ends on {{trial_end_date}}. Upgrade now to keep access to all features.</p>',
  'Hi {{user_name}}, Your trial ends on {{trial_end_date}}.',
  'transactional',
  'billing',
  '["user_name", "trial_end_date"]'
),
(
  'payment_failed',
  'Sent when a payment fails',
  'Action required: Payment failed for your SellerGenix subscription',
  '<h1>Hi {{user_name}},</h1><p>We couldn''t process your payment of {{amount}}. Please update your payment method.</p>',
  'Hi {{user_name}}, We couldn''t process your payment.',
  'transactional',
  'billing',
  '["user_name", "amount", "retry_date"]'
),
(
  'subscription_canceled',
  'Sent when subscription is canceled',
  'Your SellerGenix subscription has been canceled',
  '<h1>Hi {{user_name}},</h1><p>Your subscription has been canceled. You''ll have access until {{end_date}}.</p>',
  'Hi {{user_name}}, Your subscription has been canceled.',
  'transactional',
  'billing',
  '["user_name", "end_date"]'
),
(
  'custom_notification',
  'Custom notification template',
  '{{subject}}',
  '<h1>Hi {{user_name}},</h1><p>{{message}}</p>',
  'Hi {{user_name}}, {{message}}',
  'notification',
  'announcements',
  '["user_name", "subject", "message"]'
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 14. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admin tables - Only service role can access
CREATE POLICY "Admin users - service role only" ON admin_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin sessions - service role only" ON admin_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Audit logs - service role only" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Email logs - service role only" ON email_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Email templates - service role only" ON email_templates FOR ALL USING (auth.role() = 'service_role');

-- Customer data - Users can read their own, admins can read all
CREATE POLICY "Subscriptions - users read own" ON customer_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Subscriptions - service role all" ON customer_subscriptions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Transactions - users read own" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions - service role all" ON transactions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Health scores - users read own" ON customer_health_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Health scores - service role all" ON customer_health_scores FOR ALL USING (auth.role() = 'service_role');

-- System settings - Public ones readable by all, others by service role
CREATE POLICY "Settings - public readable" ON system_settings FOR SELECT USING (is_public = true);
CREATE POLICY "Settings - service role all" ON system_settings FOR ALL USING (auth.role() = 'service_role');

-- Announcements - Active ones readable by all users
CREATE POLICY "Announcements - active readable" ON announcements FOR SELECT USING (is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at >= NOW()));
CREATE POLICY "Announcements - service role all" ON announcements FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 15. HELPER FUNCTIONS
-- =====================================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_actor_id UUID,
  p_actor_email TEXT,
  p_actor_name TEXT,
  p_actor_role TEXT,
  p_action TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_type, actor_id, actor_email, actor_name, actor_role,
    action, action_type, resource_type, resource_id, resource_name,
    old_values, new_values, ip_address, user_agent, metadata
  ) VALUES (
    'admin', p_actor_id, p_actor_email, p_actor_name, p_actor_role,
    p_action, p_action_type, p_resource_type, p_resource_id, p_resource_name,
    p_old_values, p_new_values, p_ip_address, p_user_agent, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate customer health score
CREATE OR REPLACE FUNCTION calculate_customer_health(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_engagement INTEGER := 50;
  v_payment INTEGER := 100;
  v_adoption INTEGER := 50;
  v_overall INTEGER;
  v_days_inactive INTEGER;
  v_has_amazon BOOLEAN;
  v_sub_status TEXT;
BEGIN
  -- Check last activity
  SELECT EXTRACT(DAY FROM NOW() - COALESCE(last_sign_in_at, created_at))::INTEGER
  INTO v_days_inactive
  FROM auth.users WHERE id = p_user_id;

  -- Engagement score based on activity
  IF v_days_inactive <= 1 THEN v_engagement := 100;
  ELSIF v_days_inactive <= 7 THEN v_engagement := 80;
  ELSIF v_days_inactive <= 14 THEN v_engagement := 60;
  ELSIF v_days_inactive <= 30 THEN v_engagement := 40;
  ELSE v_engagement := 20;
  END IF;

  -- Check Amazon connection
  SELECT EXISTS(SELECT 1 FROM amazon_connections WHERE user_id = p_user_id AND is_active = true)
  INTO v_has_amazon;

  IF v_has_amazon THEN v_adoption := v_adoption + 30; END IF;

  -- Check subscription status
  SELECT status INTO v_sub_status
  FROM customer_subscriptions WHERE user_id = p_user_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_sub_status = 'active' THEN v_payment := 100;
  ELSIF v_sub_status = 'past_due' THEN v_payment := 50;
  ELSIF v_sub_status = 'canceled' THEN v_payment := 20;
  ELSE v_payment := 70; -- trialing
  END IF;

  -- Calculate overall (weighted average)
  v_overall := (v_engagement * 40 + v_payment * 30 + v_adoption * 30) / 100;

  RETURN v_overall;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
