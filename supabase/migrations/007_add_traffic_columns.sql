-- ============================================================================
-- Add Traffic & Session Columns to daily_metrics
-- Created: Nov 28, 2025
-- Purpose: Support Sales & Traffic Report data from Amazon SP-API
-- ============================================================================

-- Add missing columns for traffic data
ALTER TABLE daily_metrics
ADD COLUMN IF NOT EXISTS sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;

-- Add comment
COMMENT ON COLUMN daily_metrics.sessions IS 'Number of sessions from Amazon Traffic Report';
COMMENT ON COLUMN daily_metrics.page_views IS 'Number of page views from Amazon Traffic Report';
COMMENT ON COLUMN daily_metrics.conversion_rate IS 'Conversion rate (unit session percentage) from Amazon Traffic Report';
