-- Migration: Add estimated_amazon_fee to order_items table
-- Purpose: Store estimated fee for Pending orders (from products.avg_fee_per_unit)
-- When order ships, this gets replaced with real fee from Finances API

-- Add estimated_amazon_fee column
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS estimated_amazon_fee DECIMAL(10,4) DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN order_items.estimated_amazon_fee IS 'Estimated Amazon fee for Pending orders (from products.avg_fee_per_unit). Updated with real fee when order ships.';

-- Index for fee queries
CREATE INDEX IF NOT EXISTS idx_order_items_estimated_fee ON order_items(estimated_amazon_fee) WHERE estimated_amazon_fee IS NOT NULL;

-- Success message
SELECT 'Added estimated_amazon_fee column to order_items!' as status;
