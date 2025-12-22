/**
 * Comprehensive Product Cost Tracking
 * Tracks all product-related costs including COGS, logistics, warehouse, and customs
 */

-- ============================================================================
-- 1. PRODUCT COSTS TABLE - Main cost tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- COGS (Cost of Goods Sold) - Factory/Supplier cost
  cogs DECIMAL(10,2),
  cogs_notes TEXT,

  -- 3PL Warehouse Cost - Intermediate warehouse costs
  warehouse_3pl_cost DECIMAL(10,2),
  warehouse_3pl_notes TEXT,

  -- Custom Tax Cost - Import duties and customs
  custom_tax_cost DECIMAL(10,2),
  custom_tax_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_costs_product_id ON product_costs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_user_id ON product_costs(user_id);

-- RLS
ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own product costs" ON product_costs;
CREATE POLICY "Users can view own product costs" ON product_costs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own product costs" ON product_costs;
CREATE POLICY "Users can insert own product costs" ON product_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own product costs" ON product_costs;
CREATE POLICY "Users can update own product costs" ON product_costs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own product costs" ON product_costs;
CREATE POLICY "Users can delete own product costs" ON product_costs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. PRODUCT LOGISTICS COSTS TABLE - Multiple logistics entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_logistics_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transport type
  transport_type TEXT NOT NULL CHECK (transport_type IN ('Air', 'Sea', 'Land', 'Domestic')),

  -- Cost
  cost DECIMAL(10,2) NOT NULL,

  -- Description/Notes
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_logistics_costs_product_id ON product_logistics_costs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_logistics_costs_user_id ON product_logistics_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_product_logistics_costs_transport_type ON product_logistics_costs(transport_type);

-- RLS
ALTER TABLE product_logistics_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logistics costs" ON product_logistics_costs;
CREATE POLICY "Users can view own logistics costs" ON product_logistics_costs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logistics costs" ON product_logistics_costs;
CREATE POLICY "Users can insert own logistics costs" ON product_logistics_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logistics costs" ON product_logistics_costs;
CREATE POLICY "Users can update own logistics costs" ON product_logistics_costs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logistics costs" ON product_logistics_costs;
CREATE POLICY "Users can delete own logistics costs" ON product_logistics_costs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HELPER FUNCTION - Calculate total product cost
-- ============================================================================

CREATE OR REPLACE FUNCTION get_total_product_cost(prod_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL := 0;
  costs_record RECORD;
  logistics_total DECIMAL := 0;
BEGIN
  -- Get basic costs (COGS, warehouse, customs)
  SELECT
    COALESCE(cogs, 0) +
    COALESCE(warehouse_3pl_cost, 0) +
    COALESCE(custom_tax_cost, 0)
  INTO total_cost
  FROM product_costs
  WHERE product_id = prod_id;

  -- Get total logistics costs
  SELECT COALESCE(SUM(cost), 0) INTO logistics_total
  FROM product_logistics_costs
  WHERE product_id = prod_id;

  RETURN COALESCE(total_cost, 0) + logistics_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. TRIGGERS - Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_product_costs_updated_at BEFORE UPDATE ON product_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_logistics_costs_updated_at BEFORE UPDATE ON product_logistics_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS - Documentation
-- ============================================================================

COMMENT ON TABLE product_costs IS 'Main product cost tracking table including COGS, warehouse, and customs costs';
COMMENT ON TABLE product_logistics_costs IS 'Multiple logistics cost entries per product with different transport types';

COMMENT ON COLUMN product_costs.cogs IS 'Cost of Goods Sold - Factory/Supplier purchase price';
COMMENT ON COLUMN product_costs.warehouse_3pl_cost IS '3PL Warehouse costs - Intermediate storage';
COMMENT ON COLUMN product_costs.custom_tax_cost IS 'Custom duties and import taxes';

COMMENT ON COLUMN product_logistics_costs.transport_type IS 'Transport method: Air, Sea, Land, or Domestic';
COMMENT ON COLUMN product_logistics_costs.cost IS 'Logistics cost for this transport method';
COMMENT ON COLUMN product_logistics_costs.description IS 'Additional notes about this logistics cost';
