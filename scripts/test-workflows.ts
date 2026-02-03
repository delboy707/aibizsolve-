/**
 * Test script to verify Supabase workflows are being matched correctly
 *
 * Usage: npx tsx scripts/test-workflows.ts
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ Missing OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Test problems for each domain
const TEST_PROBLEMS = {
  strategy: "We need to grow our B2B SaaS revenue from $2M to $3M ARR in the next 12 months. Our current growth rate is 15% but the market is growing at 25%. What strategic options should we consider?",
  marketing: "Our brand positioning feels outdated. Competitors are perceived as more innovative even though our product is better. How do we reposition without alienating existing customers?",
  sales: "We have a strong product-led growth motion but need to add enterprise sales. We've never hired salespeople before. How should we build our first sales team?",
};

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  console.log('\n🔍 QEP AISolve - Workflow Verification Test\n');
  console.log('='.repeat(60));

  // 1. Check workflow counts by domain
  console.log('\n📊 STEP 1: Checking workflow counts by domain...\n');

  const { data: workflows, error: workflowError } = await supabase
    .from('workflows')
    .select('id, name, domain, embedding');

  if (workflowError) {
    console.error('❌ Error fetching workflows:', workflowError.message);
    return;
  }

  if (!workflows || workflows.length === 0) {
    console.error('❌ No workflows found in database!');
    console.log('\n💡 Run: npx tsx scripts/seed-workflows.ts');
    return;
  }

  // Count by domain
  const domainCounts: Record<string, number> = {};
  const domainsWithEmbeddings: Record<string, number> = {};

  workflows.forEach(w => {
    domainCounts[w.domain] = (domainCounts[w.domain] || 0) + 1;
    if (w.embedding) {
      domainsWithEmbeddings[w.domain] = (domainsWithEmbeddings[w.domain] || 0) + 1;
    }
  });

  console.log('Domain              | Total | With Embeddings');
  console.log('-'.repeat(50));
  Object.keys(domainCounts).sort().forEach(domain => {
    const total = domainCounts[domain];
    const withEmbed = domainsWithEmbeddings[domain] || 0;
    const status = withEmbed === total ? '✅' : '⚠️';
    console.log(`${status} ${domain.padEnd(16)} | ${String(total).padStart(5)} | ${String(withEmbed).padStart(15)}`);
  });

  const totalWorkflows = workflows.length;
  const totalWithEmbeddings = workflows.filter(w => w.embedding).length;
  console.log('-'.repeat(50));
  console.log(`   TOTAL            | ${String(totalWorkflows).padStart(5)} | ${String(totalWithEmbeddings).padStart(15)}`);

  if (totalWithEmbeddings === 0) {
    console.error('\n❌ No workflows have embeddings! Vector search will not work.');
    console.log('💡 Re-run seeding with embeddings enabled.');
    return;
  }

  // 2. Test vector search for each domain
  console.log('\n\n📊 STEP 2: Testing vector search for sample problems...\n');
  console.log('='.repeat(60));

  for (const [domain, problem] of Object.entries(TEST_PROBLEMS)) {
    console.log(`\n🎯 Testing ${domain.toUpperCase()} domain:`);
    console.log(`   Problem: "${problem.substring(0, 80)}..."\n`);

    try {
      // Generate embedding for test problem
      const embedding = await generateEmbedding(problem);

      // Search workflows
      const { data: matches, error: searchError } = await supabase.rpc(
        'match_workflows',
        {
          query_embedding: JSON.stringify(embedding),
          match_threshold: 0.65,
          match_count: 4,
          filter_domains: null, // Don't filter - see what matches across all domains
        }
      );

      if (searchError) {
        console.error(`   ❌ Search error: ${searchError.message}`);
        continue;
      }

      if (!matches || matches.length === 0) {
        console.log('   ⚠️  No workflows matched (threshold: 0.65)');
        continue;
      }

      console.log('   Matched Workflows:');
      console.log('   ' + '-'.repeat(55));
      matches.forEach((m: { name: string; domain: string; similarity: number }, i: number) => {
        const similarity = (m.similarity * 100).toFixed(1);
        const domainMatch = m.domain === domain ? '✅' : '➡️';
        console.log(`   ${i + 1}. ${domainMatch} [${m.domain}] ${m.name}`);
        console.log(`      Similarity: ${similarity}%`);
      });

      // Check if primary domain workflows are matching
      const primaryDomainMatches = matches.filter((m: { domain: string }) => m.domain === domain);
      if (primaryDomainMatches.length > 0) {
        console.log(`\n   ✅ ${primaryDomainMatches.length}/${matches.length} matches from ${domain} domain`);
      } else {
        console.log(`\n   ⚠️  No matches from ${domain} domain (may indicate missing workflows)`);
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }

  // 3. Show sample workflow details
  console.log('\n\n📊 STEP 3: Sample workflow details...\n');
  console.log('='.repeat(60));

  const sampleDomains = ['strategy', 'marketing', 'sales'];
  for (const domain of sampleDomains) {
    const { data: sample } = await supabase
      .from('workflows')
      .select('name, domain, task_summary, key_questions')
      .eq('domain', domain)
      .limit(1)
      .single();

    if (sample) {
      console.log(`\n📁 Sample ${domain.toUpperCase()} workflow:`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Summary: ${sample.task_summary?.substring(0, 100)}...`);
      if (sample.key_questions && sample.key_questions.length > 0) {
        console.log(`   Key Questions: ${sample.key_questions.slice(0, 2).join('; ')}`);
      }
    }
  }

  // 4. Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  const strategyCount = domainCounts['strategy'] || 0;
  const marketingCount = domainCounts['marketing'] || 0;
  const salesCount = domainCounts['sales'] || 0;

  console.log(`\n✅ Total workflows: ${totalWorkflows}`);
  console.log(`✅ With embeddings: ${totalWithEmbeddings}`);
  console.log(`\nKey domains:`);
  console.log(`   • Strategy:  ${strategyCount} workflows`);
  console.log(`   • Marketing: ${marketingCount} workflows`);
  console.log(`   • Sales:     ${salesCount} workflows`);

  if (totalWithEmbeddings === totalWorkflows && totalWorkflows > 0) {
    console.log('\n✅ All workflows have embeddings - vector search is operational!');
  } else if (totalWithEmbeddings > 0) {
    console.log(`\n⚠️  ${totalWorkflows - totalWithEmbeddings} workflows missing embeddings`);
  }

  console.log('\n');
}

main().catch(console.error);
