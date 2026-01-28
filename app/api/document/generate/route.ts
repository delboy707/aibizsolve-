import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { ALCHEMY_PROMPT, CLASSIFICATION_PROMPT } from '@/lib/ai/prompts';
import { sendDocumentReadyEmail } from '@/lib/email/client';
import { generateEmbedding } from '@/lib/ai/openai';

// Classification helper function
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
  limit: number = 4
): Promise<Array<{
  name: string;
  domain: string;
  task_summary: string;
  full_prompt: string;
  key_questions: string[];
  similarity: number;
}>> {
  try {
    // Generate embedding for the problem
    const problemEmbedding = await generateEmbedding(problem);

    // Use the match_workflows function for vector similarity search
    const { data: workflows, error: searchError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(problemEmbedding),
        match_threshold: 0.65, // Slightly lower threshold for better recall
        match_count: limit,
        filter_domains: domains && domains.length > 0 ? domains : null,
      }
    );

    if (searchError) {
      console.error('Workflow search error:', searchError);
      return [];
    }

    return workflows || [];
  } catch (error) {
    console.error('Error in workflow search:', error);
    return [];
  }
}

// SCQA Document Generation Prompt
const SCQA_PROMPT = `You are a top-tier strategic business consultant. Generate a comprehensive strategic document in SCQA format (Situation, Complication, Question, Answer).

INPUT:
- Problem: {problem}
- Classification: {classification}
- Matched Workflows: {workflows}
- Conversation History: {conversation}

Generate a top consultancy-style strategic document with the following 7 sections:

## 1. EXECUTIVE SUMMARY (SCQA)
**Situation**: Current state facts (2-3 sentences)
**Complication**: What changed/threatens (2-3 sentences)
**Question**: Strategic question to answer (1 sentence)
**Answer**: Recommendation in one sentence

## 2. SITUATION ANALYSIS
- Market context
- Competitive landscape
- Internal assessment

## 3. PROBLEM DIAGNOSIS
- Root cause analysis
- Assumption validation
- Impact quantification

## 4. STRATEGIC OPTIONS
Analyze 3 alternatives:

**Option A**: [Description]
- Pros: [bullet points]
- Cons: [bullet points]
- Resources needed: [list]

**Option B**: [Description]
- Pros: [bullet points]
- Cons: [bullet points]
- Resources needed: [list]

**Option C**: [Description]
- Pros: [bullet points]
- Cons: [bullet points]
- Resources needed: [list]

**Comparison & Recommendation**: [Which option and why]

## 5. RECOMMENDATION
- Clear direction
- Rationale
- Expected outcomes with metrics

## 6. IMPLEMENTATION ROADMAP

**Days 1-30 (Foundation)**
- Quick wins
- Initial setup
- Key metrics to track

**Days 31-60 (Build Momentum)**
- Scale successful initiatives
- Address blockers
- Milestone targets

**Days 61-90 (Scale & Optimize)**
- Full rollout
- Optimization
- Long-term sustainability

## 7. RISK MITIGATION
For top 3-5 risks, provide:
- Risk description
- Probability: High/Medium/Low
- Impact: High/Medium/Low
- Mitigation strategy
- Early warning signals

RULES:
- Be specific and actionable
- Use concrete numbers and metrics
- No consulting jargon
- Write in plain business English
- Focus on "what to do" not "what frameworks say"
- Never mention source books or methodology names`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's payment tier for Alchemy access
    const { data: userData } = await supabase
      .from('users')
      .select('payment_tier, trial_ends_at')
      .eq('id', user.id)
      .single();

    const hasAlchemyAccess =
      (userData?.payment_tier === 'trial' && new Date() < new Date(userData.trial_ends_at || 0)) ||
      ['average', 'above_average'].includes(userData?.payment_tier || '');

    const { decisionId } = await req.json();

    if (!decisionId) {
      return NextResponse.json({ error: 'Decision ID required' }, { status: 400 });
    }

    // Fetch decision data
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    // Fetch conversation messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: true });

    // PRIORITY 1.2: Run classification if not already done
    let classification = {
      symptoms: decision.classified_symptoms || [],
      challenges: decision.classified_challenges || [],
      primary_domain: decision.classified_domains?.[0] || '',
      secondary_domains: decision.classified_domains?.slice(1) || [],
      intent: decision.classified_intent || 'explore',
      confidence: decision.classification_confidence || 0,
    };

    // Build full problem context from conversation
    const conversationContext = messages
      ?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n\n') || '';
    const fullProblemContext = `${decision.problem_statement || ''}\n\nConversation:\n${conversationContext}`;

    // Run classification if not already classified
    if (!decision.classified_domains || decision.classified_domains.length === 0) {
      console.log('Running classification...');
      try {
        classification = await classifyProblem(fullProblemContext);
        console.log('Classification result:', classification);

        // Update decision with classification
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
          .eq('id', decisionId);
      } catch (classifyError) {
        console.error('Classification error (continuing with defaults):', classifyError);
      }
    }

    // PRIORITY 1.3: Use vector search instead of simple domain filter
    console.log('Searching for matching workflows...');
    const allDomains = [
      classification.primary_domain,
      ...(classification.secondary_domains || []),
    ].filter(Boolean);

    const workflows = await searchWorkflows(
      supabase,
      fullProblemContext,
      allDomains.length > 0 ? allDomains : undefined,
      4
    );
    console.log(`Found ${workflows.length} matching workflows`);

    // Build context for document generation
    const conversationSummary = messages
      ?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n\n') || '';

    // Build rich workflow context with prompts and key questions
    const workflowsSummary = workflows.length > 0
      ? workflows.map((w, i) =>
          `### Workflow ${i + 1}: ${w.name} (${w.domain})\n` +
          `**Summary**: ${w.task_summary}\n` +
          `**Key Questions**: ${(w.key_questions || []).slice(0, 3).join('; ')}\n` +
          `**Similarity**: ${(w.similarity * 100).toFixed(0)}%`
        ).join('\n\n')
      : 'No specific workflows matched - using general strategic analysis';

    // Use actual classification data
    const classificationSummary = JSON.stringify({
      symptoms: classification.symptoms,
      challenges: classification.challenges,
      domains: [classification.primary_domain, ...classification.secondary_domains].filter(Boolean),
      intent: classification.intent,
      confidence: classification.confidence,
    }, null, 2);

    const prompt = SCQA_PROMPT
      .replace('{problem}', decision.problem_statement || '')
      .replace('{classification}', classificationSummary)
      .replace('{workflows}', workflowsSummary)
      .replace('{conversation}', conversationSummary);

    // CALL 1: Generate SCQA Document with streaming and prompt caching
    console.log('Generating SCQA document...');
    const scqaStream = await anthropic().messages.stream({
      model: MODELS.OPUS,
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: SCQA_PROMPT.split('{problem}')[0], // Cache the template part
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    let scqaDocument = '';
    for await (const chunk of scqaStream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        scqaDocument += chunk.delta.text;
      }
    }

    // CALL 2: Generate Alchemy Layer (only for users with access)
    let alchemySection = '';
    let fullDocument = scqaDocument;

    if (hasAlchemyAccess) {
      console.log('Generating Alchemy Layer...');

      // PRIORITY 1.4: Pass actual classification to Alchemy prompt
      const alchemyDomains = [classification.primary_domain, ...classification.secondary_domains].filter(Boolean);
      const alchemyPrompt = ALCHEMY_PROMPT
        .replace('{problem}', fullProblemContext)
        .replace('{domains}', alchemyDomains.length > 0 ? alchemyDomains.join(', ') : 'General Business Strategy')
        .replace('{intent}', classification.intent || 'explore')
        .replace('{challenges}', classification.challenges.length > 0 ? classification.challenges.join(', ') : 'Strategic challenges identified in conversation');

      const alchemyStream = await anthropic().messages.stream({
        model: MODELS.OPUS,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: ALCHEMY_PROMPT.split('{problem}')[0], // Cache the Alchemy template
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [{
          role: 'user',
          content: alchemyPrompt,
        }],
      });

      for await (const chunk of alchemyStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          alchemySection += chunk.delta.text;
        }
      }
      fullDocument = `${scqaDocument}\n\n---\n\n## 8. ALCHEMY SECTION: Counterintuitive Options\n\n${alchemySection}`;
    } else {
      // Add teaser for users without access
      const alchemyTeaser = `## 🔒 Unlock Counterintuitive Options

**The Alchemy Layer** provides behavioral and counterintuitive insights that most business consultants won't consider:

- **The Opposite Lens**: What if you did the exact reverse?
- **The Perception Lens**: How to change how this *feels* rather than what it *is*
- **The Signal Lens**: Make this feel more valuable without changing substance
- **The Small Bet Lens**: Micro-interventions under $10K with outsized impact

**Upgrade to unlock**: Beat the average payment for your segment to access these premium insights.

[Visit Pricing](/pricing)`;

      fullDocument = `${scqaDocument}\n\n---\n\n${alchemyTeaser}`;
    }

    // Save to database
    const { data: savedDocument, error: saveError } = await supabase
      .from('documents')
      .insert({
        decision_id: decisionId,
        title: `Strategic Analysis: ${decision.problem_statement?.substring(0, 100)}`,
        content: fullDocument,
        format: 'markdown',
        alchemy_content: {
          raw: alchemySection,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving document:', saveError);
      throw saveError;
    }

    // Update decision status and store matched workflows
    await supabase
      .from('decisions')
      .update({
        status: 'complete',
        alchemy_generated: hasAlchemyAccess,
        matched_workflows: workflows.map(w => ({
          name: w.name,
          domain: w.domain,
          similarity: w.similarity,
        })),
      })
      .eq('id', decisionId);

    // Send email notification
    try {
      const documentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://qep-aisolve.app'}/document/${decisionId}`;

      // Extract executive summary (first 300 chars of SCQA section)
      const executiveSummaryMatch = scqaDocument.match(/## 1\. EXECUTIVE SUMMARY[\s\S]*?(?=## 2\.|$)/);
      let executiveSummary = 'Your comprehensive strategic analysis is ready for review.';

      if (executiveSummaryMatch) {
        const summaryText = executiveSummaryMatch[0]
          .replace(/## 1\. EXECUTIVE SUMMARY.*?\n/, '')
          .replace(/\*\*/g, '')
          .trim();
        executiveSummary = summaryText.substring(0, 300) + (summaryText.length > 300 ? '...' : '');
      }

      await sendDocumentReadyEmail(user.email!, {
        userName: user.email!.split('@')[0], // Use email prefix as name
        problemTitle: decision.problem_statement?.substring(0, 100) || 'Your Business Challenge',
        documentUrl,
        executiveSummary,
      });

      console.log('Email sent successfully to:', user.email);
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      document: savedDocument,
      preview: fullDocument.substring(0, 500) + '...',
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
