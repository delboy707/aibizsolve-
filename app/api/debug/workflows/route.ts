import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/openai';

// Safely create admin client without throwing on missing env vars
function safeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Diagnostic endpoint to test the workflow matching pipeline
// GET /api/debug/workflows — returns pipeline health check with actionable guidance
// POST /api/debug/workflows — tests vector search with a sample problem
export async function GET() {
  const checks: Record<string, unknown> = {};
  let workflowCount = 0;
  let embeddingCount = 0;
  let hasRpc = false;

  // Check 1: Environment variables
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
    ADMIN_SEED_SECRET: process.env.ADMIN_SEED_SECRET ? 'SET' : 'MISSING',
  };
  const missingEnv = Object.entries(envStatus).filter(([, v]) => v === 'MISSING').map(([k]) => k);
  checks.env = {
    status: missingEnv.length === 0 ? 'OK' : 'INCOMPLETE',
    variables: envStatus,
    missing: missingEnv.length > 0 ? missingEnv : undefined,
  };

  // Check 2-5: Supabase connectivity and data
  const adminSupabase = safeAdminClient();
  if (!adminSupabase) {
    checks.supabase = {
      status: 'ERROR',
      error: 'Cannot create admin client — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing',
    };
  } else {
    // Check 2: Workflows table count
    const { count, error: countError } = await adminSupabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      checks.workflows_table = {
        status: 'ERROR',
        error: countError.message,
        hint: countError.hint || 'Run migration 002_workflows_table.sql in Supabase SQL Editor',
      };
    } else {
      workflowCount = count ?? 0;
      checks.workflows_table = {
        status: workflowCount > 0 ? 'OK' : 'EMPTY',
        count: workflowCount,
      };
    }

    // Check 3: Workflows with embeddings
    if (workflowCount > 0) {
      const { count: embCount, error: embError } = await adminSupabase
        .from('workflows')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      if (embError) {
        checks.embeddings = { status: 'ERROR', error: embError.message };
      } else {
        embeddingCount = embCount ?? 0;
        checks.embeddings = {
          status: embeddingCount > 0 ? 'OK' : 'EMPTY',
          workflows_with_embeddings: embeddingCount,
          workflows_without_embeddings: workflowCount - embeddingCount,
        };
      }

      // Check 3b: Domain breakdown
      const { data: domainData } = await adminSupabase
        .from('workflows')
        .select('domain');
      if (domainData) {
        const domains: Record<string, number> = {};
        domainData.forEach((w: { domain: string }) => {
          domains[w.domain] = (domains[w.domain] || 0) + 1;
        });
        checks.domains = { status: 'OK', breakdown: domains };
      }
    } else {
      checks.embeddings = { status: 'SKIPPED', reason: 'No workflows in table' };
    }

    // Check 4: match_workflows RPC function
    const { error: rpcError } = await adminSupabase.rpc('match_workflows', {
      query_embedding: JSON.stringify(new Array(1536).fill(0)),
      match_threshold: 0.99,
      match_count: 1,
      filter_domains: null,
    });

    if (rpcError) {
      hasRpc = false;
      checks.match_workflows_rpc = {
        status: 'ERROR',
        error: rpcError.message,
        hint: rpcError.hint || 'Run migration 007_fix_match_workflows_return.sql in Supabase SQL Editor',
      };
    } else {
      hasRpc = true;
      checks.match_workflows_rpc = { status: 'OK' };
    }
  }

  // Check 5: OpenAI embedding generation
  if (process.env.OPENAI_API_KEY) {
    try {
      const testEmb = await generateEmbedding('test business strategy problem');
      checks.openai_embeddings = { status: 'OK', dimensions: testEmb.length };
    } catch (error) {
      checks.openai_embeddings = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } else {
    checks.openai_embeddings = { status: 'SKIPPED', reason: 'OPENAI_API_KEY not set' };
  }

  // Build overall status and next steps
  const issues: string[] = [];
  const nextSteps: string[] = [];

  if (missingEnv.length > 0) {
    issues.push(`Missing env vars: ${missingEnv.join(', ')}`);
    nextSteps.push(`Set missing environment variables in Vercel dashboard: ${missingEnv.join(', ')}`);
  }
  if (workflowCount === 0) {
    issues.push('Workflows table is empty — no workflows have been seeded');
    nextSteps.push(
      'Seed workflows: Run the SQL files from /sql/ in Supabase SQL Editor (start with seed-workflows-00-cleanup.sql, then 01 through 24)',
      'Or: Set ADMIN_SEED_SECRET env var, then call GET /api/admin/auto-seed?key=YOUR_SECRET'
    );
  }
  if (workflowCount > 0 && embeddingCount === 0) {
    issues.push('Workflows exist but none have embeddings — vector search will not work');
    nextSteps.push('Re-seed using the SQL files (they include embeddings) or run scripts/generate-embeddings.ts');
  }
  if (!hasRpc && adminSupabase) {
    issues.push('match_workflows RPC function is broken or missing');
    nextSteps.push('Run migration 007_fix_match_workflows_return.sql in Supabase SQL Editor');
  }

  const overallStatus = issues.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    summary: {
      workflows: workflowCount,
      embeddings: embeddingCount,
      rpc_function: hasRpc ? 'OK' : 'ERROR',
      env_complete: missingEnv.length === 0,
    },
    issues: issues.length > 0 ? issues : undefined,
    next_steps: nextSteps.length > 0 ? nextSteps : ['All checks passed — pipeline is healthy'],
    checks,
  }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const problem = body.problem || 'My marketing spend is increasing but revenue is flat. How do I fix this?';

    const results: Record<string, unknown> = { problem, steps: {} };
    const steps = results.steps as Record<string, unknown>;

    // Step 1: Generate embedding
    let embedding: number[];
    try {
      embedding = await generateEmbedding(problem);
      steps.embedding = { status: 'OK', dimensions: embedding.length };
    } catch (error) {
      steps.embedding = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
      return NextResponse.json(results, { status: 200 });
    }

    // Step 2: Call match_workflows
    const adminSupabase = safeAdminClient();
    if (!adminSupabase) {
      steps.vector_search = {
        status: 'FAILED',
        error: 'Cannot create admin client — check SUPABASE_SERVICE_ROLE_KEY',
      };
      return NextResponse.json(results, { status: 200 });
    }

    const { data: workflows, error: searchError } = await adminSupabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.20,
        match_count: 10,
        filter_domains: null,
      }
    );

    if (searchError) {
      steps.vector_search = {
        status: 'FAILED',
        error: searchError.message,
        hint: searchError.hint,
        code: searchError.code,
      };
    } else {
      steps.vector_search = {
        status: 'OK',
        count: workflows?.length || 0,
        workflows: workflows?.map((w: { name: string; domain: string; similarity: number; task_summary?: string }) => ({
          name: w.name,
          domain: w.domain,
          similarity: w.similarity,
          has_task_summary: !!w.task_summary,
        })) || [],
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
