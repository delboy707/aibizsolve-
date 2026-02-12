-- Run this AFTER all batches to verify the seed worked

-- Total count (should be 583)
SELECT COUNT(*) AS total_workflows FROM workflows;

-- Count by domain
SELECT domain, COUNT(*) AS count FROM workflows GROUP BY domain ORDER BY domain;

-- Test vector search (should return results)
SELECT name, domain, 1 - (embedding <=> (SELECT embedding FROM workflows LIMIT 1)) AS similarity
FROM workflows
ORDER BY embedding <=> (SELECT embedding FROM workflows LIMIT 1)
LIMIT 5;
