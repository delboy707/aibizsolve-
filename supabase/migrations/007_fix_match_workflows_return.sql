-- Fix match_workflows function to include task_summary in return columns
-- Without this, the TypeScript code crashes when trying to access task_summary
-- from workflow search results, causing the entire workflow matching pipeline
-- to silently fail.

-- Must DROP first because changing the return type is not allowed with CREATE OR REPLACE
DROP FUNCTION IF EXISTS match_workflows(vector, double precision, integer, text[]);

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
  task_summary TEXT,
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
    w.task_summary,
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
