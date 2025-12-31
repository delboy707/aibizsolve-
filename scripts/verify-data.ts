#!/usr/bin/env npx ts-node

/**
 * verify-data.ts
 * 
 * Verify workflows are loaded correctly and test vector search.
 * 
 * Usage:
 *   npx ts-node verify-data.ts
 *   npx ts-node verify-data.ts --test-query "how do I differentiate from competitors"
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Parse command line arguments
const args = process.argv.slice(2);
const testQueryIndex = args.indexOf('--test-query');
const testQuery = testQueryIndex !== -1 ? args[testQueryIndex + 1] : 'how do I compete with larger competitors';

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function main() {
  console.log('🔍 AI Solve Content Pipeline - Data Verification');
  console.log('='.repeat(50));
  console.log('');
  
  // 1. Count total workflows
  console.log('📊 Workflow Statistics');
  console.log('-'.repeat(30));
  
  const { count: totalCount, error: countError } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error(`❌ Error counting workflows: ${countError.message}`);
    process.exit(1);
  }
  
  console.log(`Total workflows: ${totalCount}`);
  console.log('');
  
  // 2. Count by domain
  const { data: workflows, error: fetchError } = await supabase
    .from('workflows')
    .select('domain, sub_domain');
  
  if (fetchError) {
    console.error(`❌ Error fetching workflows: ${fetchError.message}`);
    process.exit(1);
  }
  
  const domainCounts: Record<string, number> = {};
  const subDomainCounts: Record<string, Set<string>> = {};
  
  for (const w of workflows || []) {
    domainCounts[w.domain] = (domainCounts[w.domain] || 0) + 1;
    if (!subDomainCounts[w.domain]) {
      subDomainCounts[w.domain] = new Set();
    }
    if (w.sub_domain) {
      subDomainCounts[w.domain].add(w.sub_domain);
    }
  }
  
  console.log('By domain:');
  for (const [domain, count] of Object.entries(domainCounts).sort()) {
    const subDomains = subDomainCounts[domain]?.size || 0;
    console.log(`  ${domain}: ${count} workflows (${subDomains} sub-domains)`);
  }
  console.log('');
  
  // 3. Sample workflow details
  console.log('📋 Sample Workflow');
  console.log('-'.repeat(30));
  
  const { data: sample, error: sampleError } = await supabase
    .from('workflows')
    .select('name, domain, sub_domain, source_book, key_questions, problem_patterns, synergy_triggers')
    .limit(1)
    .single();
  
  if (sampleError) {
    console.error(`❌ Error fetching sample: ${sampleError.message}`);
  } else if (sample) {
    console.log(`Name: ${sample.name}`);
    console.log(`Domain: ${sample.domain}`);
    console.log(`Sub-domain: ${sample.sub_domain}`);
    console.log(`Source: ${sample.source_book}`);
    console.log(`Key questions: ${(sample.key_questions as string[])?.length || 0}`);
    console.log(`Problem patterns: ${(sample.problem_patterns as string[])?.length || 0}`);
    console.log(`Synergy triggers: ${(sample.synergy_triggers as string[])?.join(', ') || 'none'}`);
  }
  console.log('');
  
  // 4. Check embeddings
  console.log('🧮 Embedding Verification');
  console.log('-'.repeat(30));
  
  const { data: embeddingSample, error: embeddingError } = await supabase
    .from('workflows')
    .select('name, embedding')
    .limit(1)
    .single();
  
  if (embeddingError) {
    console.error(`❌ Error checking embeddings: ${embeddingError.message}`);
  } else if (embeddingSample) {
    const embedding = embeddingSample.embedding as number[] | null;
    if (embedding && embedding.length > 0) {
      console.log(`✅ Embeddings present`);
      console.log(`   Dimensions: ${embedding.length}`);
      console.log(`   Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
    } else {
      console.log(`❌ Embeddings missing or empty`);
    }
  }
  console.log('');
  
  // 5. Test vector search
  if (!openaiKey) {
    console.log('⚠️  Skipping vector search test (no OPENAI_API_KEY)');
    return;
  }
  
  console.log('🔎 Vector Search Test');
  console.log('-'.repeat(30));
  console.log(`Query: "${testQuery}"`);
  console.log('');
  
  // Generate embedding for test query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: testQuery,
    dimensions: 1536,
  });
  
  const queryEmbedding = embeddingResponse.data[0].embedding;
  
  // Run vector search
  const { data: searchResults, error: searchError } = await supabase
    .rpc('match_workflows', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,  // Lower threshold for testing
      match_count: 5,
    });
  
  if (searchError) {
    console.error(`❌ Vector search error: ${searchError.message}`);
    console.error('   Make sure the match_workflows function exists in your database');
    process.exit(1);
  }
  
  if (!searchResults || searchResults.length === 0) {
    console.log('⚠️  No results found. Try a different query or lower threshold.');
  } else {
    console.log(`Found ${searchResults.length} matching workflows:`);
    console.log('');
    
    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      console.log(`${i + 1}. ${result.name}`);
      console.log(`   Domain: ${result.domain} / ${result.sub_domain || 'general'}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log('');
    }
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('✅ Verification complete');
  console.log('');
  console.log('If everything looks good, you\'re ready for Sprint 3!');
}

main().catch(console.error);
