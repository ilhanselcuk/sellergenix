-- ============================================================================
-- Service Fees Table
-- Stores account-level fees not tied to specific orders
-- (Subscription, Storage, Long-term Storage, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Period this fee applies to
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Fee type
  fee_type TEXT NOT NULL, -- 'subscription', 'storage', 'long_term_storage', 'other'

  -- Amount (positive value, displayed as negative cost)
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Optional description
  description TEXT,

  -- Source tracking
  source TEXT DEFAULT 'finances_api', -- 'finances_api', 'manual', 'reports_api'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, period_start, period_end, fee_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_fees_user_id ON service_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_service_fees_period ON service_fees(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_service_fees_type ON service_fees(fee_type);

-- Row Level Security
ALTER TABLE service_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service fees" ON service_fees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service fees" ON service_fees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service fees" ON service_fees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service fees" ON service_fees
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_service_fees_updated_at BEFORE UPDATE ON service_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE!
-- Run this in Supabase SQL Editor
-- ============================================================================
