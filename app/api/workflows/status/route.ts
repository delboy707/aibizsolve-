import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get total workflow count
    const { count: totalCount, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({
        status: 'error',
        error: countError.message,
        message: 'Failed to query workflows table. Make sure migrations have been run.',
      }, { status: 500 });
    }

    // Get count by domain
    const { data: domainData, error: domainError } = await supabase
      .from('workflows')
      .select('domain');

    let domainCounts: Record<string, number> = {};
    if (!domainError && domainData) {
      domainCounts = domainData.reduce((acc: Record<string, number>, row: { domain: string }) => {
        acc[row.domain] = (acc[row.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }

    // Check if embeddings exist (sample check)
    const { data: sampleWorkflow } = await supabase
      .from('workflows')
      .select('id, name, embedding')
      .limit(1)
      .single();

    const hasEmbeddings = sampleWorkflow?.embedding != null;

    return NextResponse.json({
      status: 'ok',
      workflows: {
        total: totalCount || 0,
        byDomain: domainCounts,
        hasEmbeddings,
        sampleWorkflow: sampleWorkflow ? {
          id: sampleWorkflow.id,
          name: sampleWorkflow.name,
          hasEmbedding: !!sampleWorkflow.embedding,
        } : null,
      },
      ready: (totalCount || 0) > 0 && hasEmbeddings,
      message: (totalCount || 0) === 0
        ? 'No workflows found. Run seed-workflows.ts to populate the database.'
        : !hasEmbeddings
        ? 'Workflows found but no embeddings. Re-run seed with embedded JSON.'
        : `${totalCount} workflows ready with embeddings.`,
    });
  } catch (error) {
    console.error('Workflow status error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      message: 'Failed to check workflow status',
    }, { status: 500 });
  }
}
