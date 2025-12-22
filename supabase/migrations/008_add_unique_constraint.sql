-- ============================================================================
-- Add Unique Constraint to daily_metrics
-- Created: Nov 28, 2025
-- Purpose: Support upsert operations (prevent duplicate entries per user/date)
-- ============================================================================

-- Drop existing constraint if any (just to be safe)
ALTER TABLE daily_metrics
DROP CONSTRAINT IF EXISTS daily_metrics_user_date_unique;

-- Add unique constraint on user_id + date (account-level daily data)
-- Note: product_id can be NULL for account-level metrics
-- We use a partial unique index instead of a constraint with WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS daily_metrics_user_date_unique
ON daily_metrics (user_id, date)
WHERE product_id IS NULL;
