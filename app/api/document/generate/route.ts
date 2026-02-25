import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { ALCHEMY_PROMPT } from '@/lib/ai/prompts';
import { sendDocumentReadyEmail } from '@/lib/email/client';
import { generateEmbedding } from '@/lib/ai/openai';
import { analyzeCrossDomainSynergy, Domain } from '@/lib/ai/synergy';
import { classifyProblem } from '@/lib/ai/classify';

// Vector search helper — uses admin client to bypass RLS on shared workflows table
async function searchWorkflows(
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
    console.log('[DocGen] searchWorkflows called with domains:', domains, 'limit:', limit);

    const adminSupabase = createAdminClient();
    console.log('[DocGen] Admin Supabase client created successfully');

    // Generate embedding for the problem
    const problemEmbedding = await generateEmbedding(problem);
    console.log(`[DocGen] Generated embedding with ${problemEmbedding.length} dimensions`);

    // Use the match_workflows function for vector similarity search
    const { data: workflows, error: searchError } = await adminSupabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(problemEmbedding),
        match_threshold: 0.35, // Lowered from 0.65 - actual similarities are 0.43-0.47
        match_count: limit,
        filter_domains: domains && domains.length > 0 ? domains : null,
      }
    );

    if (searchError) {
      console.error('[DocGen] Workflow search RPC error:', JSON.stringify(searchError));
      return [];
    }

    console.log(`[DocGen] Found ${workflows?.length || 0} matching workflows:`,
      workflows?.map((w: { name: string; similarity: number }) => `${w.name} (${(w.similarity * 100).toFixed(0)}%)`));
    return workflows || [];
  } catch (error) {
    console.error('[DocGen] CRITICAL: Workflow search failed completely:', error instanceof Error ? error.message : String(error));
    console.error('[DocGen] Stack:', error instanceof Error ? error.stack : 'no stack');
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

    // ── Tier enforcement ────────────────────────────────────────────────────
    const { data: tierData } = await supabase
      .from('users')
      .select('subscription_tier, reports_used_this_cycle, free_report_used, billing_cycle_start')
      .eq('id', user.id)
      .single();

    // Reset billing cycle if elapsed (best-effort — don't block on failure)
    await supabase.rpc('reset_report_count_if_needed', { user_uuid: user.id }).catch(() => {});

    const { canGenerateReport, getAlchemyAccess, canAccessDomain, getDomainUpgradeMessage } =
      await import('@/lib/tiers');

    const subscriptionTier = ((tierData?.subscription_tier as string) || 'free') as Parameters<typeof canGenerateReport>[0];
    const reportsUsed = (tierData?.reports_used_this_cycle as number) || 0;
    const freeReportUsed = (tierData?.free_report_used as boolean) || false;

    if (!canGenerateReport(subscriptionTier, reportsUsed, freeReportUsed)) {
      return NextResponse.json(
        { error: 'Report limit reached. Upgrade your plan to generate more reports.', code: 'LIMIT_REACHED' },
        { status: 403 },
      );
    }

    // alchemyMode: 'none' | 'teased' | 'full'
    const alchemyMode = getAlchemyAccess(subscriptionTier);
    // Generate alchemy content for both 'full' (merged) and 'teased' (stored separately)
    const generateAlchemy = alchemyMode !== 'none';

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

    // Fetch uploaded documents for this decision
    const { data: uploadedDocs } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('decision_id', decisionId)
      .eq('processing_status', 'completed');

    // Build uploaded document context
    let uploadedDocContext = '';
    if (uploadedDocs && uploadedDocs.length > 0) {
      uploadedDocContext = '\n\n**UPLOADED DOCUMENTS CONTEXT:**\n\n';
      uploadedDocs.forEach((doc: { file_name: string; extracted_text: string }, index: number) => {
        if (doc.extracted_text) {
          uploadedDocContext += `Document ${index + 1}: ${doc.file_name}\n`;
          uploadedDocContext += `${doc.extracted_text.substring(0, 3000)}\n\n---\n\n`;
        }
      });
    }

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
    const fullProblemContext = `${decision.problem_statement || ''}\n\nConversation:\n${conversationContext}${uploadedDocContext}`;

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

    // ── Domain access check ─────────────────────────────────────────────────
    const primaryDomainForCheck = classification.primary_domain || 'strategy';
    if (!canAccessDomain(subscriptionTier, primaryDomainForCheck)) {
      const upgradeMsg = getDomainUpgradeMessage(subscriptionTier, primaryDomainForCheck);
      return NextResponse.json(
        { error: upgradeMsg || `Your plan does not include ${primaryDomainForCheck} analysis.`, code: 'DOMAIN_LOCKED' },
        { status: 403 },
      );
    }

    // PRIORITY 1.3: Use vector search with cross-domain synergy detection
    console.log('Analyzing cross-domain synergy...');
    const primaryDomain = (classification.primary_domain || 'strategy') as Domain;
    const synergyAnalysis = analyzeCrossDomainSynergy(primaryDomain, fullProblemContext);
    console.log('Synergy analysis:', {
      primary: synergyAnalysis.primaryDomain,
      allDomains: synergyAnalysis.allDomains,
      matchedPattern: synergyAnalysis.matchedPattern?.name || 'none',
    });

    // Use synergy-enhanced domains for workflow search
    const allDomains = synergyAnalysis.allDomains;

    console.log('Searching for matching workflows...');
    const workflows = await searchWorkflows(
      fullProblemContext,
      allDomains.length > 0 ? allDomains : undefined,
      4
    );
    console.log(`Found ${workflows.length} matching workflows`);

    // Build context for document generation
    const conversationSummary = messages
      ?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n\n') || '';

    // Build rich workflow context with full methodology prompts
    const workflowsSummary = workflows.length > 0
      ? workflows.map((w, i) =>
          `### Workflow ${i + 1}: ${w.name} (${w.domain})\n` +
          `**Summary**: ${w.task_summary || 'Strategic methodology'}\n` +
          `**Methodology**:\n${w.full_prompt || 'General strategic analysis'}\n` +
          `**Key Questions**: ${(w.key_questions || []).slice(0, 3).join('; ')}\n` +
          `**Similarity**: ${(w.similarity * 100).toFixed(0)}%`
        ).join('\n\n')
      : 'No specific workflows matched - using general strategic analysis';

    // Use actual classification data with synergy insights
    const classificationSummary = JSON.stringify({
      symptoms: classification.symptoms,
      challenges: classification.challenges,
      domains: synergyAnalysis.allDomains,
      intent: classification.intent,
      confidence: classification.confidence,
      synergy: {
        pattern: synergyAnalysis.matchedPattern?.name || null,
        recommendation: synergyAnalysis.recommendation,
      },
    }, null, 2);

    const prompt = SCQA_PROMPT
      .replace('{problem}', decision.problem_statement || '')
      .replace('{classification}', classificationSummary)
      .replace('{workflows}', workflowsSummary)
      .replace('{conversation}', conversationSummary);

    // Prepare Alchemy prompt (generated for 'full' and 'teased'; skipped for 'none')
    const alchemyDomains = [classification.primary_domain, ...classification.secondary_domains].filter(Boolean);
    const alchemyPrompt = generateAlchemy ? ALCHEMY_PROMPT
      .replace('{problem}', fullProblemContext)
      .replace('{domains}', alchemyDomains.length > 0 ? alchemyDomains.join(', ') : 'General Business Strategy')
      .replace('{intent}', classification.intent || 'explore')
      .replace('{challenges}', classification.challenges.length > 0 ? classification.challenges.join(', ') : 'Strategic challenges identified in conversation')
      : '';

    // PARALLEL EXECUTION: Generate SCQA and Alchemy simultaneously
    console.log(`Generating SCQA document${generateAlchemy ? ` and Alchemy Layer (mode: ${alchemyMode}) in parallel` : ''}...`);

    // Helper to collect streamed response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function collectStream(stream: AsyncIterable<any>): Promise<string> {
      let result = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta' && chunk.delta?.text) {
          result += chunk.delta.text;
        }
      }
      return result;
    }

    // Start SCQA generation
    const scqaPromise = collectStream(
      await anthropic().messages.stream({
        model: MODELS.OPUS,
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: SCQA_PROMPT.split('{problem}')[0],
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [{ role: 'user', content: prompt }],
      })
    );

    // Start Alchemy generation in parallel (for 'full' and 'teased' modes)
    const alchemyPromise = generateAlchemy
      ? collectStream(
          await anthropic().messages.stream({
            model: MODELS.OPUS,
            max_tokens: 2048,
            system: [
              {
                type: 'text',
                text: ALCHEMY_PROMPT.split('{problem}')[0],
                cache_control: { type: 'ephemeral' }
              }
            ],
            messages: [{ role: 'user', content: alchemyPrompt }],
          })
        )
      : Promise.resolve('');

    // Wait for both to complete
    const [scqaDocument, alchemySection] = await Promise.all([scqaPromise, alchemyPromise]);
    console.log('SCQA and Alchemy generation complete');

    // Parse individual SCQA sections for database storage
    const parseSCQA = (doc: string) => {
      const sections: { situation?: string; complication?: string; question?: string; answer?: string } = {};

      // Extract Executive Summary section
      const execSummaryMatch = doc.match(/## 1\. EXECUTIVE SUMMARY[\s\S]*?(?=## 2\.|$)/i);
      if (execSummaryMatch) {
        const execContent = execSummaryMatch[0];

        // Extract Situation
        const situationMatch = execContent.match(/\*\*Situation\*\*:?\s*([\s\S]*?)(?=\*\*Complication\*\*|$)/i);
        if (situationMatch) sections.situation = situationMatch[1].trim();

        // Extract Complication
        const complicationMatch = execContent.match(/\*\*Complication\*\*:?\s*([\s\S]*?)(?=\*\*Question\*\*|$)/i);
        if (complicationMatch) sections.complication = complicationMatch[1].trim();

        // Extract Question
        const questionMatch = execContent.match(/\*\*Question\*\*:?\s*([\s\S]*?)(?=\*\*Answer\*\*|$)/i);
        if (questionMatch) sections.question = questionMatch[1].trim();

        // Extract Answer
        const answerMatch = execContent.match(/\*\*Answer\*\*:?\s*([\s\S]*?)(?=##|$)/i);
        if (answerMatch) sections.answer = answerMatch[1].trim();
      }

      return sections;
    };

    // Parse roadmap sections
    const parseRoadmap = (doc: string) => {
      const roadmap: { days_30?: string[]; days_60?: string[]; days_90?: string[] } = {};

      // Extract Implementation Roadmap section
      const roadmapMatch = doc.match(/## 6\. IMPLEMENTATION ROADMAP[\s\S]*?(?=## 7\.|$)/i);
      if (roadmapMatch) {
        const roadmapContent = roadmapMatch[0];

        // Extract 1-30 days
        const days30Match = roadmapContent.match(/\*\*Days 1-30[\s\S]*?(?=\*\*Days 31-60|$)/i);
        if (days30Match) {
          roadmap.days_30 = days30Match[0]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
        }

        // Extract 31-60 days
        const days60Match = roadmapContent.match(/\*\*Days 31-60[\s\S]*?(?=\*\*Days 61-90|$)/i);
        if (days60Match) {
          roadmap.days_60 = days60Match[0]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
        }

        // Extract 61-90 days
        const days90Match = roadmapContent.match(/\*\*Days 61-90[\s\S]*?(?=##|$)/i);
        if (days90Match) {
          roadmap.days_90 = days90Match[0]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
        }
      }

      return roadmap;
    };

    const scqaSections = parseSCQA(scqaDocument);
    const roadmapSections = parseRoadmap(scqaDocument);

    // Merge results based on alchemy mode:
    // 'full'   → alchemy merged into document content
    // 'teased' → alchemy stored in alchemy_content column only (blurred in UI)
    // 'none'   → no alchemy content
    let fullDocument = scqaDocument;

    if (alchemyMode === 'full' && alchemySection) {
      fullDocument = `${scqaDocument}\n\n---\n\n## 8. ALCHEMY SECTION: Counterintuitive Options\n\n${alchemySection}`;
    }

    // Save to database with individual SCQA fields
    const { data: savedDocument, error: saveError } = await supabase
      .from('documents')
      .insert({
        decision_id: decisionId,
        title: `Strategic Analysis: ${decision.problem_statement?.substring(0, 100)}`,
        content: fullDocument,
        format: 'markdown',
        // Individual SCQA fields
        scqa_situation: scqaSections.situation || null,
        scqa_complication: scqaSections.complication || null,
        scqa_question: scqaSections.question || null,
        scqa_answer: scqaSections.answer || null,
        // Roadmap fields
        roadmap_30: roadmapSections.days_30 || null,
        roadmap_60: roadmapSections.days_60 || null,
        roadmap_90: roadmapSections.days_90 || null,
        // Alchemy tracking
        includes_alchemy: alchemyMode === 'full',
        alchemy_content: alchemySection ? { raw: alchemySection } : null,
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
        alchemy_generated: alchemyMode !== 'none' && !!alchemySection,
        matched_workflows: workflows.map(w => ({
          name: w.name,
          domain: w.domain,
          similarity: w.similarity,
        })),
      })
      .eq('id', decisionId);

    // ── Increment report counter ─────────────────────────────────────────────
    if (subscriptionTier === 'free') {
      // Free users get exactly one report tracked via free_report_used
      await supabase.from('users').update({ free_report_used: true }).eq('id', user.id);
    } else {
      await supabase
        .from('users')
        .update({ reports_used_this_cycle: reportsUsed + 1 })
        .eq('id', user.id);
    }

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
