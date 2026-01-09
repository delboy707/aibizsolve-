import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId } = await req.json();

    if (!decisionId) {
      return NextResponse.json({ error: 'Decision ID required' }, { status: 400 });
    }

    // Verify decision ownership
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('id')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // Update status to archived
    const { error: updateError } = await supabase
      .from('decisions')
      .update({ status: 'archived' })
      .eq('id', decisionId);

    if (updateError) {
      console.error('Archive error:', updateError);
      return NextResponse.json({ error: 'Failed to archive decision' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
