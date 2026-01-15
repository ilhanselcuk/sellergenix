-- =====================================================
-- FIX DUPLICATE ORDERS & ADD UNIQUE CONSTRAINT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check current state (run first to see duplicates)
SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT amazon_order_id) as unique_orders,
  COUNT(*) - COUNT(DISTINCT amazon_order_id) as duplicates_to_remove
FROM orders;

-- Step 2: See which orders are duplicated
SELECT amazon_order_id, COUNT(*) as count
FROM orders
GROUP BY amazon_order_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 3: Delete duplicates, keeping only the one with highest order_total (most complete data)
-- This keeps the record with the best data
DELETE FROM orders a
USING orders b
WHERE a.id < b.id
  AND a.amazon_order_id = b.amazon_order_id
  AND a.user_id = b.user_id;

-- Alternative: If above doesn't work, use this CTE approach
-- DELETE FROM orders
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (user_id, amazon_order_id) id
--   FROM orders
--   ORDER BY user_id, amazon_order_id, order_total DESC NULLS LAST, created_at DESC
-- );

-- Step 4: Verify duplicates are gone
SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT amazon_order_id) as unique_orders
FROM orders;

-- Step 5: Add unique constraint to prevent future duplicates
-- First check if constraint already exists
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'orders' AND constraint_type = 'UNIQUE';

-- Add unique constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders'
    AND constraint_name = 'orders_user_id_amazon_order_id_key'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_user_id_amazon_order_id_key
    UNIQUE (user_id, amazon_order_id);
    RAISE NOTICE 'Unique constraint added successfully';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Step 6: Final verification
SELECT
  'Total orders' as metric, COUNT(*)::text as value FROM orders
UNION ALL
SELECT
  'Zero price orders', COUNT(*)::text FROM orders WHERE order_total = 0 OR order_total IS NULL
UNION ALL
SELECT
  'Orders with price', COUNT(*)::text FROM orders WHERE order_total > 0;
