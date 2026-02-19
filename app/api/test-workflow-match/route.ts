import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/openai';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { CLASSIFICATION_PROMPT } from '@/lib/ai/prompts';

// Replicate the EXACT classification logic from the chat route
async function testClassify(problem: string) {
  const response = await anthropic().messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    messages: [{ role: 'user', content: `${CLASSIFICATION_PROMPT}\n\nProblem to classify:\n${problem}` }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { raw: jsonText, error: 'No JSON found in response' };

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    raw_from_ai: {
      primary_domain: parsed.primary_domain,
      secondary_domains: parsed.secondary_domains,
    },
    normalized: {
      primary_domain: (parsed.primary_domain || '').toLowerCase(),
      secondary_domains: (parsed.secondary_domains || []).map((d: string) => d.toLowerCase()),
    },
    full: parsed,
  };
}

export async function GET(req: NextRequest) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    test_problem: 'Our marketing spend keeps increasing but revenue has stayed flat for 3 quarters. We need to figure out what is going wrong.',
    pipeline: {},
  };

  const problem = results.test_problem;

  try {
    // ─── STEP 1: Admin client ───
    let supabase: any;
    try {
      supabase = createAdminClient();
      results.pipeline.step1_admin_client = { status: 'OK' };
    } catch (e: any) {
      results.pipeline.step1_admin_client = { status: 'FAILED', error: e.message };
      return NextResponse.json(results);
    }

    // ─── STEP 2: Count workflows & check domains ───
    const { count, error: countError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    const { data: domainData } = await supabase.from('workflows').select('domain');
    const domainBreakdown: Record<string, number> = {};
    domainData?.forEach((w: { domain: string }) => {
      domainBreakdown[w.domain] = (domainBreakdown[w.domain] || 0) + 1;
    });

    results.pipeline.step2_workflows = {
      status: countError ? 'FAILED' : 'OK',
      count: count ?? 0,
      domains_in_db: domainBreakdown,
      error: countError?.message,
    };

    if (countError || !count) {
      return NextResponse.json(results);
    }

    // ─── STEP 3: Classification ───
    try {
      const classification = await testClassify(problem);
      results.pipeline.step3_classification = {
        status: 'OK',
        ...classification,
      };
    } catch (e: any) {
      results.pipeline.step3_classification = { status: 'FAILED', error: e.message };
    }

    // ─── STEP 4: Embedding generation ───
    let embedding: number[];
    try {
      embedding = await generateEmbedding(problem);
      results.pipeline.step4_embedding = {
        status: 'OK',
        dimensions: embedding.length,
      };
    } catch (e: any) {
      results.pipeline.step4_embedding = { status: 'FAILED', error: e.message };
      return NextResponse.json(results);
    }

    // ─── STEP 5: RPC with domain filter (what chat route does) ───
    const classifiedDomains = results.pipeline.step3_classification?.normalized
      ? [
          results.pipeline.step3_classification.normalized.primary_domain,
          ...(results.pipeline.step3_classification.normalized.secondary_domains || []),
        ].filter(Boolean)
      : [];

    const { data: filteredWorkflows, error: filteredError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.35,
        match_count: 3,
        filter_domains: classifiedDomains.length > 0 ? classifiedDomains : null,
      }
    );

    results.pipeline.step5_filtered_search = {
      status: filteredError ? 'FAILED' : 'OK',
      domains_used: classifiedDomains,
      count: filteredWorkflows?.length || 0,
      matches: filteredWorkflows?.map((w: any) => ({
        name: w.name,
        domain: w.domain,
        similarity: Math.round(w.similarity * 100) + '%',
        has_task_summary: !!w.task_summary,
        has_full_prompt: !!w.full_prompt,
      })) || [],
      error: filteredError?.message,
    };

    // ─── STEP 6: RPC without domain filter (fallback) ───
    const { data: unfilteredWorkflows, error: unfilteredError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.35,
        match_count: 5,
        filter_domains: null,
      }
    );

    results.pipeline.step6_unfiltered_search = {
      status: unfilteredError ? 'FAILED' : 'OK',
      count: unfilteredWorkflows?.length || 0,
      matches: unfilteredWorkflows?.map((w: any) => ({
        name: w.name,
        domain: w.domain,
        similarity: Math.round(w.similarity * 100) + '%',
        has_task_summary: !!w.task_summary,
        has_full_prompt: !!w.full_prompt,
      })) || [],
      error: unfilteredError?.message,
    };

    // ─── STEP 7: Ultra-low threshold (debug) ───
    const { data: allWorkflows, error: allError } = await supabase.rpc(
      'match_workflows',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.0,
        match_count: 5,
        filter_domains: null,
      }
    );

    results.pipeline.step7_zero_threshold = {
      status: allError ? 'FAILED' : 'OK',
      count: allWorkflows?.length || 0,
      top_5: allWorkflows?.map((w: any) => ({
        name: w.name,
        domain: w.domain,
        similarity: Math.round(w.similarity * 100) + '%',
      })) || [],
      error: allError?.message,
    };

    // ─── STEP 8: Check recent decisions for matched_workflows ───
    const { data: recentDecisions, error: decisionError } = await supabase
      .from('decisions')
      .select('id, problem_statement, classified_domains, matched_workflows, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    results.pipeline.step8_recent_decisions = {
      status: decisionError ? 'FAILED' : 'OK',
      count: recentDecisions?.length || 0,
      decisions: recentDecisions?.map((d: any) => ({
        id: d.id?.substring(0, 8) + '...',
        problem: d.problem_statement?.substring(0, 60),
        classified_domains: d.classified_domains,
        matched_workflows: d.matched_workflows,
        has_workflows: d.matched_workflows && d.matched_workflows.length > 0,
        status: d.status,
      })) || [],
      error: decisionError?.message,
    };

    // ─── DIAGNOSIS ───
    const diagnosis: string[] = [];

    if (results.pipeline.step5_filtered_search.count === 0 && results.pipeline.step6_unfiltered_search.count === 0) {
      diagnosis.push('CRITICAL: Both filtered AND unfiltered search return 0 results. The vector search RPC is broken or embeddings are incompatible.');
    } else if (results.pipeline.step5_filtered_search.count === 0 && results.pipeline.step6_unfiltered_search.count > 0) {
      diagnosis.push('Domain filter is too restrictive. Classified domains may not exist in workflows table. Fallback should catch this.');
    }

    if (results.pipeline.step7_zero_threshold.count === 0) {
      diagnosis.push('CRITICAL: Even with threshold=0, no matches found. Embeddings in the database may be corrupted or incompatible with the query embedding model.');
    }

    const recentWithWorkflows = recentDecisions?.filter((d: any) => d.matched_workflows && d.matched_workflows.length > 0);
    if (recentDecisions?.length > 0 && (!recentWithWorkflows || recentWithWorkflows.length === 0)) {
      diagnosis.push('No recent decisions have matched_workflows populated. The workflow matching is not executing or results are not being stored.');
    }

    if (results.pipeline.step3_classification?.raw_from_ai) {
      const rawDomain = results.pipeline.step3_classification.raw_from_ai.primary_domain;
      const normalizedDomain = results.pipeline.step3_classification.normalized.primary_domain;
      if (rawDomain !== normalizedDomain) {
        diagnosis.push(`Classification returned "${rawDomain}" (uppercase). Normalized to "${normalizedDomain}". This was the case mismatch bug.`);
      }
    }

    if (diagnosis.length === 0) {
      diagnosis.push('Pipeline looks healthy. Workflows should be matching correctly after the latest fix.');
    }

    results.diagnosis = diagnosis;

    return NextResponse.json(results);
  } catch (error: any) {
    results.error = error.message;
    results.stack = error.stack;
    return NextResponse.json(results, { status: 500 });
  }
}
