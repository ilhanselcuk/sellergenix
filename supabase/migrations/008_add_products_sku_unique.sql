-- Add unique constraint on user_id + sku for upsert support
-- This enables Finance sync to create/update products by SKU

-- First, clean up any duplicates (keep the most recent)
DELETE FROM products a USING products b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.sku = b.sku
  AND a.sku IS NOT NULL;

-- Add unique constraint
ALTER TABLE products
ADD CONSTRAINT products_user_id_sku_unique UNIQUE (user_id, sku);

COMMENT ON CONSTRAINT products_user_id_sku_unique ON products IS 'Enables upsert by user_id + sku from Finance sync';
