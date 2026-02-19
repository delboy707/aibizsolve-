import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/openai';

// Diagnostic endpoint to test the workflow matching pipeline
// GET /api/debug/workflows — returns pipeline health check
// POST /api/debug/workflows — tests vector search with a sample problem
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: Environment variables
  diagnostics.checks = {
    ...diagnostics.checks as Record<string, unknown>,
    env: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    },
  };

  // Check 2: Supabase admin client
  try {
    const adminSupabase = createAdminClient();

    // Check 3: Workflows table exists and has data
    const { data: workflowCount, error: countError } = await adminSupabase
      .from('workflows')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      (diagnostics.checks as Record<string, unknown>).workflows_table = {
        status: 'ERROR',
        error: countError.message,
        hint: countError.hint || 'Check if migration 002 was run in Supabase SQL Editor',
      };
    } else {
      (diagnostics.checks as Record<string, unknown>).workflows_table = {
        status: 'OK',
        count: workflowCount?.length ?? 0,
      };
    }

    // Check 4: Workflows with embeddings
    const { data: embeddingCheck, error: embError } = await adminSupabase
      .from('workflows')
      .select('id, name, domain')
      .not('embedding', 'is', null)
      .limit(5);

    if (embError) {
      (diagnostics.checks as Record<string, unknown>).embeddings = {
        status: 'ERROR',
        error: embError.message,
      };
    } else {
      (diagnostics.checks as Record<string, unknown>).embeddings = {
        status: (embeddingCheck?.length || 0) > 0 ? 'OK' : 'EMPTY - No workflows have embeddings',
        sample_workflows: embeddingCheck?.map(w => `${w.name} (${w.domain})`) || [],
        count_with_embeddings: embeddingCheck?.length || 0,
      };
    }

    // Check 5: Test the match_workflows RPC function exists
    const { error: rpcError } = await adminSupabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(new Array(1536).fill(0)),
        match_threshold: 0.99,
        match_count: 1,
        filter_domains: null,
      }
    );

    if (rpcError) {
      (diagnostics.checks as Record<string, unknown>).match_workflows_rpc = {
        status: 'ERROR',
        error: rpcError.message,
        hint: rpcError.hint || 'Run migration 007 in Supabase SQL Editor to fix',
      };
    } else {
      (diagnostics.checks as Record<string, unknown>).match_workflows_rpc = {
        status: 'OK',
        note: 'Function exists and is callable',
      };
    }

  } catch (error) {
    (diagnostics.checks as Record<string, unknown>).supabase_admin = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Check 6: OpenAI embedding generation
  try {
    if (process.env.OPENAI_API_KEY) {
      const testEmbedding = await generateEmbedding('test business strategy problem');
      (diagnostics.checks as Record<string, unknown>).openai_embeddings = {
        status: 'OK',
        dimensions: testEmbedding.length,
      };
    } else {
      (diagnostics.checks as Record<string, unknown>).openai_embeddings = {
        status: 'SKIPPED',
        reason: 'OPENAI_API_KEY not set',
      };
    }
  } catch (error) {
    (diagnostics.checks as Record<string, unknown>).openai_embeddings = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { problem = 'My marketing spend is increasing but revenue is flat. How do I fix this?' } = await req.json();

    const results: Record<string, unknown> = {
      problem,
      steps: {},
    };

    // Step 1: Generate embedding
    let embedding: number[];
    try {
      embedding = await generateEmbedding(problem);
      (results.steps as Record<string, unknown>).embedding = {
        status: 'OK',
        dimensions: embedding.length,
      };
    } catch (error) {
      (results.steps as Record<string, unknown>).embedding = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
      return NextResponse.json(results, { status: 200 });
    }

    // Step 2: Call match_workflows
    try {
      const adminSupabase = createAdminClient();

      const { data: workflows, error: searchError } = await adminSupabase.rpc(
        'match_workflows',
        {
          query_embedding: JSON.stringify(embedding),
          match_threshold: 0.20, // Very low for diagnostic purposes
          match_count: 10,
          filter_domains: null,
        }
      );

      if (searchError) {
        (results.steps as Record<string, unknown>).vector_search = {
          status: 'FAILED',
          error: searchError.message,
          hint: searchError.hint,
          code: searchError.code,
        };
      } else {
        (results.steps as Record<string, unknown>).vector_search = {
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
    } catch (error) {
      (results.steps as Record<string, unknown>).vector_search = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
