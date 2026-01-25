-- Migration: Sellerboard Fee Parity - Missing Columns
-- Purpose: Add individual fee columns for MCF, digital services, refunded referral
-- Date: January 25, 2026

-- =============================================
-- PART 1: ORDER_ITEMS - Missing Individual Fee Columns
-- =============================================

-- MCF (Multi-Channel Fulfillment) - SEPARATE from FBA
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_mcf DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.fee_mcf IS 'Multi-Channel Fulfillment fee (separate from FBA)';

-- Digital Services Fee
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_digital_services DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.fee_digital_services IS 'Digital services fee';

-- Refund Commission (charge on refunds)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fee_refund_commission DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.fee_refund_commission IS 'Refund commission fee charged when processing refunds';

-- Refunded Referral Fee (credit back to seller)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_refunded_referral DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.reimbursement_refunded_referral IS 'Referral fee refunded back to seller (positive value)';

-- Reversal Reimbursement
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_reversal DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.reimbursement_reversal IS 'Reversal/compensation reimbursement from Amazon (positive value)';

-- Warehouse Lost (separate from damage)
-- Already exists as reimbursement_lost from 011, but ensure it exists
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS reimbursement_lost DECIMAL(10,4) DEFAULT 0;

-- Refund Amount (item-level)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,4) DEFAULT 0;
COMMENT ON COLUMN order_items.refund_amount IS 'Amount refunded to customer for this item';

-- =============================================
-- PART 2: SERVICE_FEES - Add period columns if missing
-- =============================================

-- Ensure period_start and period_end exist for prorating
ALTER TABLE service_fees ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE service_fees ADD COLUMN IF NOT EXISTS period_end DATE;

COMMENT ON COLUMN service_fees.period_start IS 'Start of billing period for this fee';
COMMENT ON COLUMN service_fees.period_end IS 'End of billing period for this fee';

-- =============================================
-- PART 3: DAILY_FEES_SUMMARY - Add MCF column
-- =============================================

ALTER TABLE daily_fees_summary ADD COLUMN IF NOT EXISTS mcf_fees DECIMAL(12,4) DEFAULT 0;
ALTER TABLE daily_fees_summary ADD COLUMN IF NOT EXISTS digital_services_fees DECIMAL(12,4) DEFAULT 0;
ALTER TABLE daily_fees_summary ADD COLUMN IF NOT EXISTS refund_commission DECIMAL(12,4) DEFAULT 0;
ALTER TABLE daily_fees_summary ADD COLUMN IF NOT EXISTS long_term_storage_fees DECIMAL(12,4) DEFAULT 0;

COMMENT ON COLUMN daily_fees_summary.mcf_fees IS 'Multi-Channel Fulfillment fees for the day';
COMMENT ON COLUMN daily_fees_summary.long_term_storage_fees IS 'Long-term storage fees (6+ months)';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Sellerboard fee parity columns added successfully!' as status;
