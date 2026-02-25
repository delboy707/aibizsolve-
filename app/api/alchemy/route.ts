import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAlchemy, AlchemyInput } from '@/lib/ai/alchemy';
import { getAlchemyAccess } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';

/**
 * POST /api/alchemy
 *
 * Dedicated endpoint for generating Alchemy Layer content.
 * Useful for:
 * - A/B testing different alchemy prompts
 * - Regenerating alchemy independently
 * - Testing alchemy without full document generation
 *
 * Request body:
 * - decisionId: string (optional) - if provided, fetches context from decision
 * - problem: string - the problem statement
 * - domains: string[] - business domains
 * - intent: string - user intent (explore/decide/execute/monitor)
 * - challenges: string[] - identified challenges
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's subscription tier for Alchemy access
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = ((userData?.subscription_tier as string) || 'free') as TierKey;
    const alchemyMode = getAlchemyAccess(tier);

    if (alchemyMode !== 'full') {
      return NextResponse.json(
        { error: 'Upgrade to Professional or Founding Leader to access Alchemy insights' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { decisionId, problem, domains, intent, challenges } = body;

    let alchemyInput: AlchemyInput;

    // If decisionId is provided, fetch context from decision
    if (decisionId) {
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', decisionId)
        .eq('user_id', user.id)
        .single();

      if (decisionError || !decision) {
        return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
      }

      // Fetch conversation messages for full context
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('decision_id', decisionId)
        .order('created_at', { ascending: true });

      const conversationContext = messages
        ?.map((m) => `${m.role}: ${m.content}`)
        .join('\n\n') || '';

      const fullProblemContext = `${decision.problem_statement || ''}\n\nConversation:\n${conversationContext}`;

      alchemyInput = {
        problem: fullProblemContext,
        domains: decision.classified_domains || [],
        intent: decision.classified_intent || 'explore',
        challenges: decision.classified_challenges || [],
      };
    } else {
      // Use provided inputs directly
      if (!problem) {
        return NextResponse.json({ error: 'Problem statement required' }, { status: 400 });
      }

      alchemyInput = {
        problem,
        domains: domains || [],
        intent: intent || 'explore',
        challenges: challenges || [],
      };
    }

    const alchemyOutput = await generateAlchemy(alchemyInput);

    // If decisionId provided, update the document's alchemy content
    if (decisionId) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ alchemy_content: alchemyOutput })
        .eq('decision_id', decisionId);

      if (updateError) {
        // Non-critical: alchemy content still returned even if document update fails
      }

      // Mark decision as having alchemy generated
      await supabase
        .from('decisions')
        .update({ alchemy_generated: true })
        .eq('id', decisionId);
    }

    return NextResponse.json({
      success: true,
      content: alchemyOutput.raw,
      sections: {
        counterintuitiveOptions: alchemyOutput.counterintuitiveOptions,
        perceptionPlay: alchemyOutput.perceptionPlay,
        smallBet: alchemyOutput.smallBet,
        hiddenDriver: alchemyOutput.hiddenDriver,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate Alchemy insights' },
      { status: 500 }
    );
  }
}
