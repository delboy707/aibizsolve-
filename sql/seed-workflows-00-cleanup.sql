-- Run this FIRST if you want to start fresh (removes all existing workflows)
-- Skip this if you want to add to existing data

TRUNCATE TABLE workflows;

-- Verify empty:
SELECT COUNT(*) AS workflow_count FROM workflows;
