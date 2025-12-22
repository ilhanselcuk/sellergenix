/**
 * Amazon SP-API Connections
 * Stores Amazon seller account connections and refresh tokens
 */

-- ============================================================================
-- 0. HELPER FUNCTIONS (if not exists)
-- ============================================================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. AMAZON CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amazon_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Amazon SP-API Credentials
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Seller Information
  seller_id TEXT,
  marketplace_ids TEXT[], -- Array of marketplace IDs the seller has access to

  -- Connection Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one connection per user
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amazon_connections_user_id ON amazon_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_amazon_connections_status ON amazon_connections(status);
CREATE INDEX IF NOT EXISTS idx_amazon_connections_seller_id ON amazon_connections(seller_id);

-- RLS (Row Level Security)
ALTER TABLE amazon_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own amazon connections" ON amazon_connections;
CREATE POLICY "Users can view own amazon connections" ON amazon_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own amazon connections" ON amazon_connections;
CREATE POLICY "Users can insert own amazon connections" ON amazon_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own amazon connections" ON amazon_connections;
CREATE POLICY "Users can update own amazon connections" ON amazon_connections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own amazon connections" ON amazon_connections;
CREATE POLICY "Users can delete own amazon connections" ON amazon_connections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. SYNC HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amazon_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES amazon_connections(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'orders', 'finances', 'reports', 'full')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

  -- Statistics
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amazon_sync_history_user_id ON amazon_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_history_connection_id ON amazon_sync_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_history_sync_type ON amazon_sync_history(sync_type);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_history_status ON amazon_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_history_started_at ON amazon_sync_history(started_at DESC);

-- RLS
ALTER TABLE amazon_sync_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sync history" ON amazon_sync_history;
CREATE POLICY "Users can view own sync history" ON amazon_sync_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sync history" ON amazon_sync_history;
CREATE POLICY "Users can insert own sync history" ON amazon_sync_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. TRIGGERS - Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_amazon_connections_updated_at BEFORE UPDATE ON amazon_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. COMMENTS - Documentation
-- ============================================================================

COMMENT ON TABLE amazon_connections IS 'Stores Amazon SP-API seller account connections';
COMMENT ON TABLE amazon_sync_history IS 'Tracks history of data synchronization with Amazon';

COMMENT ON COLUMN amazon_connections.refresh_token IS 'OAuth refresh token for Amazon SP-API';
COMMENT ON COLUMN amazon_connections.seller_id IS 'Amazon Seller ID from marketplace participations';
COMMENT ON COLUMN amazon_connections.marketplace_ids IS 'Array of marketplace IDs the seller has access to';
COMMENT ON COLUMN amazon_connections.status IS 'Connection status: active, expired, revoked, or error';
