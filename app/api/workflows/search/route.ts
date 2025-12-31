import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/openai';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem, domains, limit = 3 } = await req.json();

    if (!problem) {
      return NextResponse.json({ error: 'Problem required' }, { status: 400 });
    }

    // Generate embedding for the problem
    const problemEmbedding = await generateEmbedding(problem);

    // Use the match_workflows function for vector similarity search
    const { data: workflows, error: searchError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(problemEmbedding),
        match_threshold: 0.7,
        match_count: limit,
        filter_domains: domains || null,
      }
    );

    if (searchError) {
      console.error('Workflow search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search workflows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ workflows: workflows || [] });
  } catch (error) {
    console.error('Workflow search error:', error);
    return NextResponse.json(
      { error: 'Failed to search workflows' },
      { status: 500 }
    );
  }
}
