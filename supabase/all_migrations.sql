-- ============================================================================
-- QEP AISolve - Complete Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Initial Schema
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table with PWYW support
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  -- PWYW pricing
  monthly_payment DECIMAL(10,2) DEFAULT 0,
  payment_tier TEXT DEFAULT 'trial' CHECK (payment_tier IN ('trial', 'below_average', 'average', 'above_average')),
  user_segment TEXT CHECK (user_segment IN ('solopreneur', 'small_business', 'manager', 'ceo')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '28 days'),
  -- Usage
  monthly_queries_used INTEGER DEFAULT 0,
  queries_reset_at TIMESTAMPTZ DEFAULT NOW(),
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT DEFAULT 'one_shot' CHECK (mode IN ('one_shot', 'companion')),
  problem_statement TEXT,
  -- 4-layer classification
  classified_symptoms JSONB DEFAULT '[]',
  classified_challenges JSONB DEFAULT '[]',
  classified_domains JSONB DEFAULT '[]',
  classified_intent TEXT CHECK (classified_intent IN ('explore', 'decide', 'execute', 'monitor')),
  classification_confidence FLOAT,
  -- Workflow matching
  matched_workflows JSONB DEFAULT '[]',
  -- Alchemy
  alchemy_generated BOOLEAN DEFAULT FALSE,
  -- Status
  status TEXT DEFAULT 'intake' CHECK (status IN ('intake', 'clarifying', 'processing', 'complete', 'active', 'review_due', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  step_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table with Alchemy section
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  format TEXT DEFAULT 'markdown' CHECK (format IN ('markdown', 'pdf', 'docx')),
  -- SCQA sections
  scqa_situation TEXT,
  scqa_complication TEXT,
  scqa_question TEXT,
  scqa_answer TEXT,
  -- Roadmap
  roadmap_30 JSONB,
  roadmap_60 JSONB,
  roadmap_90 JSONB,
  -- Alchemy section (separate for access control)
  alchemy_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment stats for PWYW anchoring
CREATE TABLE payment_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL UNIQUE,
  average_payment DECIMAL(10,2) NOT NULL,
  median_payment DECIMAL(10,2),
  payment_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial payment stats
INSERT INTO payment_stats (segment, average_payment, median_payment, payment_count) VALUES
  ('solopreneur', 29.00, 25.00, 0),
  ('small_business', 79.00, 75.00, 0),
  ('manager', 149.00, 125.00, 0),
  ('ceo', 299.00, 250.00, 0);

-- Indexes
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_messages_decision_id ON messages(decision_id);
CREATE INDEX idx_documents_decision_id ON documents(decision_id);
CREATE INDEX idx_users_payment_tier ON users(payment_tier);

-- ============================================================================
-- MIGRATION 2: Workflows Table
-- ============================================================================

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('strategy', 'marketing', 'sales', 'innovation', 'operations', 'hr', 'finance')),
  sub_domain TEXT,
  source_book TEXT NOT NULL,
  name TEXT NOT NULL,
  task_summary TEXT NOT NULL,
  full_prompt TEXT NOT NULL,
  key_questions JSONB DEFAULT '[]',
  problem_patterns JSONB DEFAULT '[]',
  synergy_triggers JSONB DEFAULT '[]',
  complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_duration_min INTEGER,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index
CREATE INDEX idx_workflows_embedding ON workflows
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_workflows_domain ON workflows(domain);

-- Vector search function
CREATE OR REPLACE FUNCTION match_workflows(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 4,
  filter_domains TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  sub_domain TEXT,
  full_prompt TEXT,
  key_questions JSONB,
  problem_patterns JSONB,
  synergy_triggers JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.domain,
    w.sub_domain,
    w.full_prompt,
    w.key_questions,
    w.problem_patterns,
    w.synergy_triggers,
    1 - (w.embedding <=> query_embedding) AS similarity
  FROM workflows w
  WHERE (filter_domains IS NULL OR w.domain = ANY(filter_domains))
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- MIGRATION 3: Row Level Security Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_stats ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Decisions table policies
CREATE POLICY "Users can read own decisions"
  ON decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decisions"
  ON decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (auth.uid() = user_id);

-- Messages table policies
CREATE POLICY "Users can read messages from own decisions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = messages.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for own decisions"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = messages.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Documents table policies
CREATE POLICY "Users can read documents from own decisions"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own decisions"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for own decisions"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decisions
      WHERE decisions.id = documents.decision_id
      AND decisions.user_id = auth.uid()
    )
  );

-- Workflows table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');

-- Payment stats policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Update your .env.local file with Supabase credentials
-- 2. Restart your Next.js dev server
-- 3. Test authentication and database access
-- ============================================================================
