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

    // Get uploaded documents for this decision
    const { data: uploadedDocs } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('decision_id', decisionId)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: true });

    // Build document context
    let documentContext = '';
    if (uploadedDocs && uploadedDocs.length > 0) {
      documentContext = '\n\n**UPLOADED DOCUMENTS CONTEXT:**\n\n';
      uploadedDocs.forEach((doc, index) => {
        documentContext += `Document ${index + 1}: ${doc.file_name}\n`;
        documentContext += `${doc.extracted_text}\n\n---\n\n`;
      });
    }

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
      systemPrompt = CLARIFYING_PROMPT + documentContext;
      stepLabel = 'Understanding your problem';
    } else if (decision.status === 'clarifying') {
      // Continue asking questions or move to processing
      systemPrompt = `Continue the conversation naturally. If you have enough information to provide strategic recommendations, say so and ask if they're ready to see the analysis. Otherwise, ask 1-2 more clarifying questions.

Include both rational and behavioral questions when appropriate.${documentContext}`;
      stepLabel = 'Gathering context';
    } else {
      // General conversation
      systemPrompt = `You are a strategic business consultant. Continue the conversation naturally, providing insights and asking relevant follow-up questions.${documentContext}`;
      stepLabel = 'Analyzing';
    }

    // Call Claude Opus 4.5 with streaming for highest quality response
    const stream = await anthropic().messages.stream({
      model: MODELS.OPUS,
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory as Array<{ role: 'user' | 'assistant'; content: string }>,
    });

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;

              // Send SSE format
              const data = JSON.stringify({ type: 'content', text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save complete response to database
          const { data: savedMessage, error: saveError } = await supabase
            .from('messages')
            .insert({
              decision_id: decisionId,
              role: 'assistant',
              content: fullResponse,
              step_label: stepLabel,
            })
            .select()
            .single();

          if (saveError) {
            console.error('Error saving message:', saveError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to save message' })}\n\n`));
          } else {
            // Send completion event with saved message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', message: savedMessage })}\n\n`));
          }

          // Update decision status if still in intake
          if (decision.status === 'intake') {
            await supabase
              .from('decisions')
              .update({ status: 'clarifying' })
              .eq('id', decisionId);
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
