-- Add missing columns to amazon_connections table
-- Run this in Supabase SQL Editor

-- Add is_active column (used by dashboard to check active connections)
ALTER TABLE amazon_connections
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add connected_at column (timestamp when connection was established)
ALTER TABLE amazon_connections
ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have is_active = true if status = 'active'
UPDATE amazon_connections
SET is_active = true
WHERE status = 'active' AND is_active IS NULL;

-- Update existing records to have connected_at = created_at if not set
UPDATE amazon_connections
SET connected_at = created_at
WHERE connected_at IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_amazon_connections_is_active
ON amazon_connections(user_id, is_active);

-- Success message
SELECT 'amazon_connections table updated successfully!' as status;
