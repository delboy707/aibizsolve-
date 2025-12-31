import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { CLASSIFICATION_PROMPT } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem, decisionId } = await req.json();

    if (!problem) {
      return NextResponse.json({ error: 'Problem statement required' }, { status: 400 });
    }

    // Call Claude Haiku for classification
    const response = await anthropic().messages.create({
      model: MODELS.HAIKU,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${CLASSIFICATION_PROMPT}\n\nProblem to classify:\n${problem}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const classification = JSON.parse(content.text);

    // Update decision with classification if decisionId provided
    if (decisionId) {
      await supabase
        .from('decisions')
        .update({
          classified_symptoms: classification.symptoms,
          classified_challenges: classification.challenges,
          classified_domains: [
            classification.primary_domain,
            ...(classification.secondary_domains || []),
          ],
          classified_intent: classification.intent,
          classification_confidence: classification.confidence,
        })
        .eq('id', decisionId)
        .eq('user_id', user.id);
    }

    return NextResponse.json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify problem' },
      { status: 500 }
    );
  }
}
