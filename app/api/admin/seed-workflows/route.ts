import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint accepts workflow batches via POST body
// Protected by a secret key
// Usage: POST /api/admin/seed-workflows?key=YOUR_SECRET

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

export async function POST(req: NextRequest) {
  try {
    // Check admin secret
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY in environment'
      }, { status: 500 });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse request body
    const body = await req.json();
    const { action, workflows } = body as {
      action?: 'clear' | 'seed' | 'status';
      workflows?: WorkflowRecord[];
    };

    // Handle different actions
    if (action === 'status') {
      const { count } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true });

      const { data: domainData } = await supabase
        .from('workflows')
        .select('domain');

      const domainCounts: Record<string, number> = {};
      if (domainData) {
        domainData.forEach((row: { domain: string }) => {
          domainCounts[row.domain] = (domainCounts[row.domain] || 0) + 1;
        });
      }

      return NextResponse.json({
        count,
        byDomain: domainCounts,
      });
    }

    if (action === 'clear') {
      console.log('[Admin] Clearing all workflows...');
      const { error } = await supabase
        .from('workflows')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All workflows cleared' });
    }

    // Default: seed workflows from body
    if (!workflows || !Array.isArray(workflows) || workflows.length === 0) {
      return NextResponse.json({
        error: 'No workflows provided',
        usage: 'POST with { "workflows": [...] } or { "action": "clear|status" }',
      }, { status: 400 });
    }

    console.log(`[Admin] Inserting batch of ${workflows.length} workflows...`);

    const records = workflows.map(w => ({
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
    }));

    const { data, error } = await supabase
      .from('workflows')
      .insert(records)
      .select('id');

    if (error) {
      console.error('[Admin] Insert error:', error.message);
      return NextResponse.json({
        error: error.message,
        inserted: 0,
      }, { status: 500 });
    }

    const { count } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      totalInDb: count,
    });
  } catch (error) {
    console.error('[Admin] Seed error:', error);
    return NextResponse.json({
      error: 'Seed failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (key !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Workflow seeding endpoint',
    usage: {
      status: 'POST with { "action": "status" }',
      clear: 'POST with { "action": "clear" }',
      seed: 'POST with { "workflows": [...] } - send in batches of 50',
    },
    example: 'See /scripts/browser-seed.js for client-side seeding script',
  });
}
