-- Add per-ASIN fee tracking columns to products table
-- These columns store historical average fees from Finance API
-- Used to estimate fees for new orders before Finance data is available

-- Average total fee per unit (FBA + Referral + other fees)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS avg_fee_per_unit DECIMAL(10,4) DEFAULT NULL;

-- Average FBA fulfillment fee per unit
ALTER TABLE products
ADD COLUMN IF NOT EXISTS avg_fba_fee_per_unit DECIMAL(10,4) DEFAULT NULL;

-- Average referral fee per unit
ALTER TABLE products
ADD COLUMN IF NOT EXISTS avg_referral_fee_per_unit DECIMAL(10,4) DEFAULT NULL;

-- When fee data was last updated from Finance API
ALTER TABLE products
ADD COLUMN IF NOT EXISTS fee_data_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for faster fee lookups
CREATE INDEX IF NOT EXISTS idx_products_fee_data
ON products (user_id, asin)
WHERE avg_fee_per_unit IS NOT NULL;

COMMENT ON COLUMN products.avg_fee_per_unit IS 'Average total Amazon fee per unit from Finance API (FBA + Referral + other)';
COMMENT ON COLUMN products.avg_fba_fee_per_unit IS 'Average FBA fulfillment fee per unit from Finance API';
COMMENT ON COLUMN products.avg_referral_fee_per_unit IS 'Average referral/commission fee per unit from Finance API';
COMMENT ON COLUMN products.fee_data_updated_at IS 'Last time fee data was updated from Finance API sync';
