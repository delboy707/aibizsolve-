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
  alchemy_content JSONB,  -- {counterintuitive, perception_play, small_bet, hidden_driver}
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
