/**
 * Fix marketplace_id constraint
 * Make it nullable since we're using marketplace (TEXT) instead
 */

-- Make marketplace_id nullable (it was NOT NULL before)
ALTER TABLE products ALTER COLUMN marketplace_id DROP NOT NULL;

-- Set default value for marketplace_id if needed
ALTER TABLE products ALTER COLUMN marketplace_id SET DEFAULT NULL;
