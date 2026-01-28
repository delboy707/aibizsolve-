import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { CLARIFYING_PROMPT, CLASSIFICATION_PROMPT } from '@/lib/ai/prompts';
import { generateEmbedding } from '@/lib/ai/openai';

// Classification helper function (runs on first message)
async function classifyProblem(problem: string): Promise<{
  symptoms: string[];
  challenges: string[];
  primary_domain: string;
  secondary_domains: string[];
  intent: string;
  confidence: number;
}> {
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

  // Parse JSON response, handling potential markdown code blocks
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  return JSON.parse(jsonText);
}

// Vector search helper function
async function searchWorkflows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  problem: string,
  domains?: string[],
  limit: number = 3
): Promise<Array<{
  name: string;
  domain: string;
  task_summary: string;
  key_questions: string[];
  similarity: number;
}>> {
  try {
    const problemEmbedding = await generateEmbedding(problem);

    const { data: workflows, error: searchError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(problemEmbedding),
        match_threshold: 0.65,
        match_count: limit,
        filter_domains: domains && domains.length > 0 ? domains : null,
      }
    );

    if (searchError) {
      console.error('[Chat] Workflow search error:', searchError);
      return [];
    }

    console.log(`[Chat] Found ${workflows?.length || 0} matching workflows`);
    return workflows || [];
  } catch (error) {
    console.error('[Chat] Error in workflow search:', error);
    return [];
  }
}

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
      uploadedDocs.forEach((doc: { file_name: string; extracted_text: string }, index: number) => {
        documentContext += `Document ${index + 1}: ${doc.file_name}\n`;
        documentContext += `${doc.extracted_text}\n\n---\n\n`;
      });
    }

    // PRIORITY 2.1: Run classification on first message
    let classification = {
      symptoms: decision.classified_symptoms || [],
      challenges: decision.classified_challenges || [],
      primary_domain: decision.classified_domains?.[0] || '',
      secondary_domains: decision.classified_domains?.slice(1) || [],
      intent: decision.classified_intent || 'explore',
    };

    // Run classification on first message (intake status)
    if (decision.status === 'intake') {
      console.log('[Chat] Running early classification on first message...');
      try {
        classification = await classifyProblem(userMessage);
        console.log('[Chat] Classification result:', JSON.stringify(classification));

        // Update decision with classification immediately
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
          })
          .eq('id', decisionId);
      } catch (classifyError) {
        console.error('[Chat] Classification error (continuing without):', classifyError);
      }
    }

    // PRIORITY 2.2: Fetch matched workflows for context
    let workflowContext = '';
    const allDomains = [classification.primary_domain, ...classification.secondary_domains].filter(Boolean);

    if (allDomains.length > 0 || decision.status === 'intake') {
      const workflows = await searchWorkflows(
        supabase,
        userMessage,
        allDomains.length > 0 ? allDomains : undefined,
        3
      );

      if (workflows.length > 0) {
        workflowContext = '\n\n**RELEVANT STRATEGIC FRAMEWORKS (use to guide your questions):**\n\n';
        workflows.forEach((w, i) => {
          workflowContext += `${i + 1}. ${w.name} (${w.domain})\n`;
          workflowContext += `   Focus: ${w.task_summary.substring(0, 200)}...\n`;
          if (w.key_questions && w.key_questions.length > 0) {
            workflowContext += `   Key questions to explore: ${w.key_questions.slice(0, 2).join('; ')}\n`;
          }
          workflowContext += '\n';
        });

        // Store matched workflows on decision
        await supabase
          .from('decisions')
          .update({
            matched_workflows: workflows.map(w => ({
              name: w.name,
              domain: w.domain,
              similarity: w.similarity,
            })),
          })
          .eq('id', decisionId);
      }
    }

    // Build classification context for the AI
    let classificationContext = '';
    if (classification.primary_domain) {
      classificationContext = `\n\n**PROBLEM CLASSIFICATION:**
- Primary Domain: ${classification.primary_domain}
- Secondary Domains: ${classification.secondary_domains.join(', ') || 'None'}
- Symptoms: ${classification.symptoms.join(', ') || 'Identifying...'}
- Challenges: ${classification.challenges.join(', ') || 'Identifying...'}
- User Intent: ${classification.intent}

Use this classification to ask targeted questions relevant to the ${classification.primary_domain} domain.`;
    }

    // Build conversation context for Claude
    const conversationHistory = messages?.map((msg: { role: string; content: string }) => ({
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
      // First interaction - ask clarifying questions with classification + workflow context
      systemPrompt = CLARIFYING_PROMPT + classificationContext + workflowContext + documentContext;
      stepLabel = 'Understanding your problem';
    } else if (decision.status === 'clarifying') {
      // Continue asking questions with full context
      systemPrompt = `You are a strategic business consultant specializing in ${classification.primary_domain || 'business strategy'}.

Continue the conversation naturally. If you have enough information to provide strategic recommendations, say so and ask if they're ready to see the analysis. Otherwise, ask 1-2 more clarifying questions.

Include both rational and behavioral questions when appropriate.${classificationContext}${workflowContext}${documentContext}`;
      stepLabel = 'Gathering context';
    } else {
      // General conversation with context
      systemPrompt = `You are a strategic business consultant specializing in ${classification.primary_domain || 'business strategy'}. Continue the conversation naturally, providing insights and asking relevant follow-up questions.${classificationContext}${workflowContext}${documentContext}`;
      stepLabel = 'Analyzing';
    }

    // Call Claude Opus 4.5 with streaming and prompt caching
    // Cache the system prompt and document context to reduce costs by 90%
    const stream = await anthropic().messages.stream({
      model: MODELS.OPUS,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' } // Cache system prompt
        }
      ],
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
            console.error('[Chat] Error saving message:', saveError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to save message' })}\n\n`));
          } else {
            // Send completion event with saved message
            console.log(`[Chat] Message saved for decision ${decisionId}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', message: savedMessage })}\n\n`));
          }

          // Update decision status if still in intake
          if (decision.status === 'intake') {
            console.log(`[Chat] Transitioning decision ${decisionId} from intake to clarifying`);
            await supabase
              .from('decisions')
              .update({ status: 'clarifying' })
              .eq('id', decisionId);
          }

          controller.close();
        } catch (error) {
          console.error('[Chat] Streaming error:', error);
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
    // PRIORITY 2.3: Enhanced error logging
    console.error('[Chat] API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
