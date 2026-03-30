import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import seedWorkflows from '@/data/seed-workflows.json';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    // Require ADMIN_SEED_SECRET to prevent unauthorized access
    const adminSecret = process.env.ADMIN_SEED_SECRET;
    if (!adminSecret) {
      return NextResponse.json({ error: 'Admin endpoint disabled' }, { status: 403 });
    }

    // Accept secret via Authorization header (preferred) or query param (legacy)
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const providedKey = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : searchParams.get('key') || '';
    if (providedKey.length === 0 || providedKey !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing Supabase service role key in environment' },
        { status: 500 }
      );
    }

    // Check current count
    const { count: beforeCount } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    // Clear existing workflows
    await supabase
      .from('workflows')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Prepare workflow records
    const workflowRecords = (seedWorkflows as Array<{
      name: string;
      domain: string;
      sub_domain: string;
      source_book: string;
      task_summary: string;
      full_prompt: string;
      key_questions: string[];
      problem_patterns: string[];
      synergy_triggers: string[];
      complexity: string;
      embedding: number[];
    }>).map((w) => ({
      name: w.name,
      domain: w.domain,
      sub_domain: w.sub_domain,
      source_book: w.source_book,
      task_summary: w.task_summary,
      full_prompt: w.full_prompt,
      key_questions: w.key_questions,
      problem_patterns: w.problem_patterns,
      synergy_triggers: w.synergy_triggers,
      complexity: w.complexity,
      embedding: w.embedding,
    }));

    // Insert in batches of 25 to avoid timeout
    const BATCH_SIZE = 25;
    let totalInserted = 0;
    const errors: string[] = [];
    const domainCounts: Record<string, number> = {};

    for (let i = 0; i < workflowRecords.length; i += BATCH_SIZE) {
      const batch = workflowRecords.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabase
        .from('workflows')
        .insert(batch)
        .select('id, domain');

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        totalInserted += data?.length || 0;
        data?.forEach((w: { domain: string }) => {
          domainCounts[w.domain] = (domainCounts[w.domain] || 0) + 1;
        });
      }
    }

    // Get final count
    const { count: afterCount } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Successfully seeded ${totalInserted} workflows!`
        : `Seeded ${totalInserted} workflows with ${errors.length} batch errors`,
      before: beforeCount || 0,
      attempted: workflowRecords.length,
      inserted: totalInserted,
      after: afterCount || 0,
      byDomain: domainCounts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
