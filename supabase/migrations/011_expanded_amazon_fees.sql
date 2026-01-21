-- Migration: Expanded Amazon Fee Fields (Sellerboard Parity)
-- Purpose: Support 30+ fee types for detailed P&L breakdown
-- Date: January 2026

-- =============================================
-- PART 1: ORDER_ITEMS - Individual Fee Type Columns
-- =============================================

-- FBA Fulfillment Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_fba_per_unit DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_fba_per_order DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_fba_weight_based DECIMAL(10,4) DEFAULT 0;

-- Referral & Closing Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_referral DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_variable_closing DECIMAL(10,4) DEFAULT 0;

-- Storage Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_storage DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_storage_long_term DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_storage_overage DECIMAL(10,4) DEFAULT 0;

-- Inbound/Transportation Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_inbound_transportation DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_inbound_convenience DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_inbound_defect DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_inbound_placement DECIMAL(10,4) DEFAULT 0;

-- Removal/Disposal Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_removal DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_disposal DECIMAL(10,4) DEFAULT 0;

-- Return Processing Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_return_per_unit DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_return_per_order DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_return_weight_based DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_giftwrap_chargeback DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_shipping_chargeback DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_shipping_holdback DECIMAL(10,4) DEFAULT 0;

-- Subscription/Service Fees (item-level portion)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_subscription DECIMAL(10,4) DEFAULT 0;

-- Liquidation
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_liquidation DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS liquidation_proceeds DECIMAL(10,4) DEFAULT 0;

-- Reimbursements (positive, reduce total fees)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_damaged DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_lost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_customer_return DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_other DECIMAL(10,4) DEFAULT 0;

-- Promotion Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_promotion DECIMAL(10,4) DEFAULT 0;

-- Other/Misc Fees
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_low_value DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_restocking DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_high_return DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_other DECIMAL(10,4) DEFAULT 0;

-- =============================================
-- PART 2: ORDER_ITEMS - Category Totals (Sellerboard-style)
-- =============================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_fba_fulfillment_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_referral_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_storage_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_inbound_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_removal_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_return_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_chargeback_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_reimbursements DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_promotion_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_other_fees DECIMAL(10,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_amazon_fees DECIMAL(10,4) DEFAULT 0;

-- Fee sync metadata
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fees_synced_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_source TEXT DEFAULT NULL; -- 'api' | 'estimated' | 'bulk_sync'

-- =============================================
-- PART 3: REFUNDS TABLE (Order-level Refund Details)
-- =============================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amazon_order_id TEXT NOT NULL,
  order_item_id TEXT,
  refund_date TIMESTAMPTZ,

  -- Refund amounts
  refunded_amount DECIMAL(10,4) DEFAULT 0,
  refunded_tax DECIMAL(10,4) DEFAULT 0,
  refunded_shipping DECIMAL(10,4) DEFAULT 0,

  -- Commission/Fee credits (Amazon returns these)
  refund_commission DECIMAL(10,4) DEFAULT 0,
  refunded_referral_fee DECIMAL(10,4) DEFAULT 0,
  refunded_fba_fee DECIMAL(10,4) DEFAULT 0,

  -- Return processing costs
  restocking_fee DECIMAL(10,4) DEFAULT 0,
  return_per_unit_fee DECIMAL(10,4) DEFAULT 0,
  return_per_order_fee DECIMAL(10,4) DEFAULT 0,
  return_weight_based_fee DECIMAL(10,4) DEFAULT 0,

  -- Calculated net cost
  net_refund_cost DECIMAL(10,4) DEFAULT 0, -- Amount - Credits + Processing

  -- Metadata
  reason_code TEXT,
  is_sellable_return BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, amazon_order_id, order_item_id)
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(amazon_order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds(refund_date);

-- RLS for refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own refunds" ON refunds;
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own refunds" ON refunds;
CREATE POLICY "Users can insert own refunds" ON refunds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own refunds" ON refunds;
CREATE POLICY "Users can update own refunds" ON refunds
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage refunds" ON refunds;
CREATE POLICY "Service role can manage refunds" ON refunds
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- PART 4: SERVICE_FEES TABLE (Account-Level Fees)
-- =============================================

CREATE TABLE IF NOT EXISTS service_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fee_date DATE NOT NULL,

  -- Fee identification
  fee_type TEXT NOT NULL, -- e.g., 'FBAInboundConvenienceFee', 'Subscription', etc.
  fee_description TEXT,

  -- Amounts
  amount DECIMAL(10,4) NOT NULL,
  currency_code TEXT DEFAULT 'USD',

  -- Categorization (for rollup)
  category TEXT NOT NULL, -- 'subscription' | 'advertising' | 'storage' | 'fba' | 'other'

  -- Metadata
  amazon_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, amazon_transaction_id)
);

-- Indexes for service_fees
CREATE INDEX IF NOT EXISTS idx_service_fees_user_id ON service_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_service_fees_date ON service_fees(fee_date);
CREATE INDEX IF NOT EXISTS idx_service_fees_category ON service_fees(category);

-- RLS for service_fees
ALTER TABLE service_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own service fees" ON service_fees;
CREATE POLICY "Users can view own service fees" ON service_fees
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own service fees" ON service_fees;
CREATE POLICY "Users can insert own service fees" ON service_fees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage service fees" ON service_fees;
CREATE POLICY "Service role can manage service fees" ON service_fees
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- PART 5: DAILY_FEES_SUMMARY TABLE (Pre-aggregated for Dashboard)
-- =============================================

CREATE TABLE IF NOT EXISTS daily_fees_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  -- Category totals (Sellerboard-style breakdown)
  fba_fulfillment_fees DECIMAL(12,4) DEFAULT 0,
  referral_fees DECIMAL(12,4) DEFAULT 0,
  storage_fees DECIMAL(12,4) DEFAULT 0,
  inbound_fees DECIMAL(12,4) DEFAULT 0,
  removal_fees DECIMAL(12,4) DEFAULT 0,
  return_fees DECIMAL(12,4) DEFAULT 0,
  subscription_fees DECIMAL(12,4) DEFAULT 0,
  liquidation_fees DECIMAL(12,4) DEFAULT 0,
  chargeback_fees DECIMAL(12,4) DEFAULT 0,
  reimbursements DECIMAL(12,4) DEFAULT 0,
  promotion_fees DECIMAL(12,4) DEFAULT 0,
  service_fees DECIMAL(12,4) DEFAULT 0,
  other_fees DECIMAL(12,4) DEFAULT 0,

  -- Grand total
  total_amazon_fees DECIMAL(12,4) DEFAULT 0,

  -- Refund summary
  refund_amount DECIMAL(12,4) DEFAULT 0,
  refund_commission DECIMAL(12,4) DEFAULT 0,
  net_refund_cost DECIMAL(12,4) DEFAULT 0,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  orders_counted INTEGER DEFAULT 0,
  items_counted INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

-- Indexes for daily_fees_summary
CREATE INDEX IF NOT EXISTS idx_daily_fees_summary_user_date ON daily_fees_summary(user_id, summary_date);

-- RLS for daily_fees_summary
ALTER TABLE daily_fees_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily fees summary" ON daily_fees_summary;
CREATE POLICY "Users can view own daily fees summary" ON daily_fees_summary
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own daily fees summary" ON daily_fees_summary;
CREATE POLICY "Users can manage own daily fees summary" ON daily_fees_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage daily fees summary" ON daily_fees_summary;
CREATE POLICY "Service role can manage daily fees summary" ON daily_fees_summary
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- =============================================

-- Order Items Fee Columns
COMMENT ON COLUMN order_items.fee_fba_per_unit IS 'FBA per-unit fulfillment fee (pick, pack, ship)';
COMMENT ON COLUMN order_items.fee_fba_per_order IS 'FBA per-order handling fee';
COMMENT ON COLUMN order_items.fee_fba_weight_based IS 'FBA weight-based shipping fee';
COMMENT ON COLUMN order_items.fee_referral IS 'Amazon referral fee (category commission, typically 8-15%)';
COMMENT ON COLUMN order_items.fee_variable_closing IS 'Variable closing fee (media items)';
COMMENT ON COLUMN order_items.fee_storage IS 'Monthly storage fee';
COMMENT ON COLUMN order_items.fee_storage_long_term IS 'Long-term storage fee (6+ months)';
COMMENT ON COLUMN order_items.fee_inbound_transportation IS 'Partnered carrier inbound shipping';
COMMENT ON COLUMN order_items.fee_inbound_convenience IS 'Inbound placement/convenience fee';
COMMENT ON COLUMN order_items.fee_removal IS 'FBA removal order fee';
COMMENT ON COLUMN order_items.fee_disposal IS 'FBA disposal fee';
COMMENT ON COLUMN order_items.fee_return_per_unit IS 'Customer return per-unit processing';
COMMENT ON COLUMN order_items.fee_return_per_order IS 'Customer return per-order processing';
COMMENT ON COLUMN order_items.total_amazon_fees IS 'Total of all Amazon fees for this item';
COMMENT ON COLUMN order_items.fees_synced_at IS 'When fees were last synced from Finances API';
COMMENT ON COLUMN order_items.fee_source IS 'Source: api (real), estimated (from avg), bulk_sync (historical)';

-- Refunds Table
COMMENT ON TABLE refunds IS 'Detailed refund tracking with fee credits and processing costs';
COMMENT ON COLUMN refunds.net_refund_cost IS 'Net cost = Refunded - Credits + Processing fees';
COMMENT ON COLUMN refunds.is_sellable_return IS 'Whether returned item can be resold';

-- Service Fees Table
COMMENT ON TABLE service_fees IS 'Account-level fees not tied to specific orders (subscriptions, storage adjustments)';
COMMENT ON COLUMN service_fees.category IS 'Category for rollup: subscription, advertising, storage, fba, other';

-- Daily Fees Summary
COMMENT ON TABLE daily_fees_summary IS 'Pre-aggregated daily fee totals for fast dashboard queries';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Expanded Amazon Fee schema created successfully! Tables: order_items (30+ fee columns), refunds, service_fees, daily_fees_summary' as status;
