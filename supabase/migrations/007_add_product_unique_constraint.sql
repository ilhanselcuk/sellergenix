-- ================================================
-- Migration: Add unique constraint for products table
-- Date: October 15, 2025
-- Purpose: Ensure user_id + asin combination is unique
-- ================================================

-- Drop existing constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_user_id_asin_key'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_user_id_asin_key;
  END IF;
END $$;

-- Add unique constraint on user_id + asin
ALTER TABLE products
ADD CONSTRAINT products_user_id_asin_key UNIQUE (user_id, asin);

-- Add comment
COMMENT ON CONSTRAINT products_user_id_asin_key ON products IS
'Ensures each user can only have one record per ASIN';
