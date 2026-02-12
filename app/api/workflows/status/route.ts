
    import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { count: totalCount, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({
        status: 'error',
        error: countError.message,
        message: 'Failed to query workflows table.',
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      total: totalCount,
      message: `${totalCount} workflows accessible via anon client.`,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
    }, { status: 500 });
  }
}
