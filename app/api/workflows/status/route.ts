import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
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
