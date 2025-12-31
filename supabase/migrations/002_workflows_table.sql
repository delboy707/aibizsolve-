-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('strategy', 'marketing', 'sales', 'innovation', 'operations', 'hr', 'finance')),
  sub_domain TEXT,
  source_book TEXT NOT NULL,         -- INTERNAL ONLY
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
