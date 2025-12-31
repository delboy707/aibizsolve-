import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { CLARIFYING_PROMPT } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decisionId, userMessage } = await req.json();

    if (!decisionId || !userMessage) {
      return NextResponse.json(
        { error: 'Decision ID and message required' },
        { status: 400 }
      );
    }

    // Verify user owns this decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: true });

    // Build conversation context for Claude
    const conversationHistory = messages?.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })) || [];

    // Add the new user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Determine the stage and appropriate system prompt
    let systemPrompt = '';
    let stepLabel = 'Processing';

    if (decision.status === 'intake') {
      // First interaction - ask clarifying questions
      systemPrompt = CLARIFYING_PROMPT;
      stepLabel = 'Understanding your problem';
    } else if (decision.status === 'clarifying') {
      // Continue asking questions or move to processing
      systemPrompt = `Continue the conversation naturally. If you have enough information to provide strategic recommendations, say so and ask if they're ready to see the analysis. Otherwise, ask 1-2 more clarifying questions.

Include both rational and behavioral questions when appropriate.`;
      stepLabel = 'Gathering context';
    } else {
      // General conversation
      systemPrompt = `You are a strategic business consultant. Continue the conversation naturally, providing insights and asking relevant follow-up questions.`;
      stepLabel = 'Analyzing';
    }

    // Call Claude Opus 4.5 for highest quality response
    const response = await anthropic().messages.create({
      model: MODELS.OPUS,
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory as Array<{ role: 'user' | 'assistant'; content: string }>,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const assistantMessage = content.text;

    // Save assistant's response to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        decision_id: decisionId,
        role: 'assistant',
        content: assistantMessage,
        step_label: stepLabel,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving message:', saveError);
      throw saveError;
    }

    // Update decision status if still in intake
    if (decision.status === 'intake') {
      await supabase
        .from('decisions')
        .update({ status: 'clarifying' })
        .eq('id', decisionId);
    }

    return NextResponse.json({
      message: savedMessage,
      response: assistantMessage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
