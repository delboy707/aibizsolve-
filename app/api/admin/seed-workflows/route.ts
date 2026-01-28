import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_SECRET = process.env.ADMIN_SEED_SECRET || 'qep-seed-2024';

interface WorkflowRecord {
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
  estimated_duration_min?: number;
  embedding: number[];
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('key') !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
    }

    const body = await req.json();
    const { action, workflows } = body as {
      action?: 'clear' | 'status';
      workflows?: WorkflowRecord[];
    };

    if (action === 'status') {
      const { count } = await supabase.from('workflows').select('*', { count: 'exact', head: true });
      return NextResponse.json({ count });
    }

    if (action === 'clear') {
      await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return NextResponse.json({ success: true, message: 'Cleared' });
    }

    if (!workflows?.length) {
      return NextResponse.json({ error: 'No workflows provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert(workflows.map((w: WorkflowRecord) => ({
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
        estimated_duration_min: w.estimated_duration_min || null,
        embedding: w.embedding,
      })))
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count } = await supabase.from('workflows').select('*', { count: 'exact', head: true });
    return NextResponse.json({ success: true, inserted: data?.length || 0, totalInDb: count });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST with { action: "status"|"clear" } or { workflows: [...] }' });
}
