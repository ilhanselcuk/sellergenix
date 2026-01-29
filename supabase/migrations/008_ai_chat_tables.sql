-- AI Chat Tables Migration
-- Created: January 26, 2026
-- Purpose: Store AI chat history and usage tracking

-- =============================================
-- AI Usage Tracking Table
-- =============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- Format: '2026-01'
  queries_count INTEGER DEFAULT 0,
  haiku_tokens INTEGER DEFAULT 0,
  opus_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- =============================================
-- AI Chat History Table
-- =============================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT CHECK (model IN ('haiku', 'opus') OR model IS NULL),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON ai_usage(month);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversation ON ai_chat_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created ON ai_chat_history(created_at DESC);

-- =============================================
-- Function to Increment AI Usage
-- =============================================
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id UUID,
  p_month TEXT,
  p_model TEXT DEFAULT 'haiku',
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0,
  p_cost DECIMAL DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage (user_id, month, queries_count, haiku_tokens, opus_tokens, total_cost)
  VALUES (
    p_user_id,
    p_month,
    1,
    CASE WHEN p_model = 'haiku' THEN p_input_tokens + p_output_tokens ELSE 0 END,
    CASE WHEN p_model = 'opus' THEN p_input_tokens + p_output_tokens ELSE 0 END,
    p_cost
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    queries_count = ai_usage.queries_count + 1,
    haiku_tokens = ai_usage.haiku_tokens + CASE WHEN p_model = 'haiku' THEN p_input_tokens + p_output_tokens ELSE 0 END,
    opus_tokens = ai_usage.opus_tokens + CASE WHEN p_model = 'opus' THEN p_input_tokens + p_output_tokens ELSE 0 END,
    total_cost = ai_usage.total_cost + p_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
DROP POLICY IF EXISTS "Users see own usage" ON ai_usage;
CREATE POLICY "Users see own usage" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own chat history
DROP POLICY IF EXISTS "Users see own chats" ON ai_chat_history;
CREATE POLICY "Users see own chats" ON ai_chat_history
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all (for API routes)
DROP POLICY IF EXISTS "Service role full access usage" ON ai_usage;
CREATE POLICY "Service role full access usage" ON ai_usage
  FOR ALL USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access chat" ON ai_chat_history;
CREATE POLICY "Service role full access chat" ON ai_chat_history
  FOR ALL USING (true)
  WITH CHECK (true);

-- =============================================
-- Grant Permissions
-- =============================================
GRANT ALL ON ai_usage TO authenticated;
GRANT ALL ON ai_chat_history TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_usage TO authenticated;
