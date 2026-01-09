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

    // Fetch original decision
    const { data: originalDecision, error: fetchError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalDecision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // Create new decision with same data but reset status
    const { data: newDecision, error: createError } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: originalDecision.title ? `${originalDecision.title} (Copy)` : null,
        mode: originalDecision.mode,
        problem_statement: originalDecision.problem_statement,
        classified_symptoms: originalDecision.classified_symptoms,
        classified_challenges: originalDecision.classified_challenges,
        classified_domains: originalDecision.classified_domains,
        classified_intent: originalDecision.classified_intent,
        classification_confidence: originalDecision.classification_confidence,
        matched_workflows: originalDecision.matched_workflows,
        status: 'intake', // Reset to intake
        alchemy_generated: false,
      })
      .select()
      .single();

    if (createError || !newDecision) {
      console.error('Duplicate error:', createError);
      return NextResponse.json({ error: 'Failed to duplicate decision' }, { status: 500 });
    }

    // Copy messages from original decision
    const { data: originalMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: true });

    if (originalMessages && originalMessages.length > 0) {
      const newMessages = originalMessages.map(msg => ({
        decision_id: newDecision.id,
        role: msg.role,
        content: msg.content,
        step_label: msg.step_label,
      }));

      await supabase.from('messages').insert(newMessages);
    }

    return NextResponse.json({
      success: true,
      newDecisionId: newDecision.id
    });
  } catch (error) {
    console.error('Duplicate endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
