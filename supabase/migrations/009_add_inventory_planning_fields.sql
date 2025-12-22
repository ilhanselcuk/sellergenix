-- Migration: Add inventory planning fields to products table
-- Created: December 22, 2025
-- Purpose: Enable advanced inventory planning with reorder alerts

-- Add inventory planning columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_daily_sales DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reorder_point_days INTEGER DEFAULT NULL;

-- Note: fbm_stock column should already exist from the original schema
-- If it doesn't exist, uncomment the following line:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS fbm_stock INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN products.lead_time_days IS 'Days from production order to Amazon warehouse delivery';
COMMENT ON COLUMN products.avg_daily_sales IS 'Average units sold per day (can be calculated or manually set)';
COMMENT ON COLUMN products.reorder_point_days IS 'Safety buffer days - extra days before reorder alert triggers';
COMMENT ON COLUMN products.fbm_stock IS 'Units stored outside Amazon (FBM inventory)';

-- Create index for inventory planning queries
CREATE INDEX IF NOT EXISTS idx_products_inventory_planning
ON products (user_id, fba_stock, fbm_stock, avg_daily_sales)
WHERE is_active = true;

-- Function to calculate days of stock remaining
CREATE OR REPLACE FUNCTION calculate_days_of_stock(
  p_fba_stock INTEGER,
  p_fbm_stock INTEGER,
  p_avg_daily_sales DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
  IF p_avg_daily_sales IS NULL OR p_avg_daily_sales <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN FLOOR((COALESCE(p_fba_stock, 0) + COALESCE(p_fbm_stock, 0)) / p_avg_daily_sales);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate days until reorder needed
CREATE OR REPLACE FUNCTION calculate_days_until_reorder(
  p_fba_stock INTEGER,
  p_fbm_stock INTEGER,
  p_avg_daily_sales DECIMAL,
  p_lead_time_days INTEGER,
  p_reorder_point_days INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_days_of_stock INTEGER;
  v_lead_time INTEGER;
  v_safety_buffer INTEGER;
BEGIN
  IF p_avg_daily_sales IS NULL OR p_avg_daily_sales <= 0 THEN
    RETURN NULL;
  END IF;

  v_days_of_stock := FLOOR((COALESCE(p_fba_stock, 0) + COALESCE(p_fbm_stock, 0)) / p_avg_daily_sales);
  v_lead_time := COALESCE(p_lead_time_days, 0);
  v_safety_buffer := COALESCE(p_reorder_point_days, 0);

  RETURN v_days_of_stock - v_lead_time - v_safety_buffer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for inventory alerts (products needing attention)
CREATE OR REPLACE VIEW inventory_alerts AS
SELECT
  p.id,
  p.user_id,
  p.asin,
  p.sku,
  p.title,
  p.fba_stock,
  p.fbm_stock,
  p.avg_daily_sales,
  p.lead_time_days,
  p.reorder_point_days,
  calculate_days_of_stock(p.fba_stock, p.fbm_stock, p.avg_daily_sales) as days_of_stock,
  calculate_days_until_reorder(p.fba_stock, p.fbm_stock, p.avg_daily_sales, p.lead_time_days, p.reorder_point_days) as days_until_reorder,
  CASE
    WHEN calculate_days_until_reorder(p.fba_stock, p.fbm_stock, p.avg_daily_sales, p.lead_time_days, p.reorder_point_days) <= 0 THEN 'critical'
    WHEN calculate_days_until_reorder(p.fba_stock, p.fbm_stock, p.avg_daily_sales, p.lead_time_days, p.reorder_point_days) <= 7 THEN 'critical'
    WHEN calculate_days_until_reorder(p.fba_stock, p.fbm_stock, p.avg_daily_sales, p.lead_time_days, p.reorder_point_days) <= 14 THEN 'warning'
    WHEN p.avg_daily_sales IS NOT NULL AND p.avg_daily_sales > 0 THEN 'safe'
    ELSE 'unknown'
  END as reorder_status
FROM products p
WHERE p.is_active = true;

-- Grant permissions
GRANT SELECT ON inventory_alerts TO authenticated;
