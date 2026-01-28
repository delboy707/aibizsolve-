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

export async function GET() {
  try {
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

    // Insert seed workflows
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

    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowRecords)
      .select('id, name, domain');

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    // Get final count
    const { count: afterCount } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Workflows seeded successfully!',
      before: beforeCount || 0,
      inserted: data?.length || 0,
      after: afterCount || 0,
      domains: [...new Set(data?.map((w: { domain: string }) => w.domain) || [])],
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
