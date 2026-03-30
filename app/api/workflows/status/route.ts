import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  // Require ADMIN_SEED_SECRET to prevent unauthorized access
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Status endpoint disabled' }, { status: 403 });
  }
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      count,
      error: error?.message ?? null,
      status: error ? 'FAIL' : 'SUCCESS',
    });
  } catch (error) {
    return NextResponse.json({
      count: null,
      error: error instanceof Error ? error.message : 'Failed to connect',
      status: 'FAIL',
    });
  }
}
