import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/openai';

export async function GET(req: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    // Step 1: Test Supabase connection
    results.steps.push({ step: 1, name: 'Supabase connection', status: 'starting' });
    const supabase = await createClient();
    results.steps[0].status = 'success';

    // Step 2: Count workflows
    results.steps.push({ step: 2, name: 'Count workflows', status: 'starting' });
    const { count, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      results.steps[1] = { step: 2, name: 'Count workflows', status: 'error', error: countError.message };
    } else {
      results.steps[1] = { step: 2, name: 'Count workflows', status: 'success', count };
    }

    // Step 3: Test OpenAI embedding
    results.steps.push({ step: 3, name: 'Generate embedding', status: 'starting' });
    const testProblem = "How do I grow my SaaS revenue?";

    try {
      const embedding = await generateEmbedding(testProblem);
      results.steps[2] = {
        step: 3,
        name: 'Generate embedding',
        status: 'success',
        embeddingLength: embedding.length,
        firstValues: embedding.slice(0, 3)
      };
    } catch (embeddingError: any) {
      results.steps[2] = {
        step: 3,
        name: 'Generate embedding',
        status: 'error',
        error: embeddingError.message
      };
      results.overallStatus = 'failed at embedding';
      return NextResponse.json(results);
    }

    // Step 4: Test match_workflows RPC
    results.steps.push({ step: 4, name: 'Match workflows RPC', status: 'starting' });
    const embedding = await generateEmbedding(testProblem);

    const { data: workflows, error: searchError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.5, // Lower threshold for testing
        match_count: 5,
        filter_domains: null,
      }
    );

    if (searchError) {
      results.steps[3] = {
        step: 4,
        name: 'Match workflows RPC',
        status: 'error',
        error: searchError.message,
        code: searchError.code,
        details: searchError.details
      };
    } else {
      results.steps[3] = {
        step: 4,
        name: 'Match workflows RPC',
        status: 'success',
        matchedCount: workflows?.length || 0,
        matches: workflows?.map((w: any) => ({
          name: w.name,
          domain: w.domain,
          similarity: w.similarity
        }))
      };
    }

    results.overallStatus = 'success';
    return NextResponse.json(results);

  } catch (error: any) {
    results.overallStatus = 'error';
    results.error = error.message;
    return NextResponse.json(results, { status: 500 });
  }
}
