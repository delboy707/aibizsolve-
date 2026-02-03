#!/usr/bin/env npx ts-node

/**
 * Simple standalone script to seed all 583 workflows
 * No external type imports - self-contained
 *
 * Usage: npx ts-node scripts/seed-all-workflows.ts
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Need: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Credentials loaded');
console.log(`   Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n📦 QEP AISolve - Seed All Workflows');
  console.log('====================================\n');

  // Read the embedded workflows file
  const inputFile = './processed/workflows-embedded.json';

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  const workflows = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  console.log(`📂 Loaded ${workflows.length} workflows from JSON\n`);

  // Count by domain
  const domainCounts: Record<string, number> = {};
  workflows.forEach((w: any) => {
    domainCounts[w.domain] = (domainCounts[w.domain] || 0) + 1;
  });
  console.log('Workflows by domain:');
  Object.entries(domainCounts).sort().forEach(([domain, count]) => {
    console.log(`   ${domain}: ${count}`);
  });

  // Clear existing workflows
  console.log('\n🗑️  Clearing existing workflows...');
  const { error: deleteError } = await supabase
    .from('workflows')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error(`   Error: ${deleteError.message}`);
  } else {
    console.log('   Done');
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  let totalErrors = 0;
  const totalBatches = Math.ceil(workflows.length / BATCH_SIZE);

  console.log(`\n📤 Inserting ${workflows.length} workflows in ${totalBatches} batches...\n`);

  for (let i = 0; i < workflows.length; i += BATCH_SIZE) {
    const batch = workflows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    // Convert workflows to database records
    const records = batch.map((w: any) => ({
      name: w.name,
      domain: w.domain,
      sub_domain: w.sub_domain,
      source_book: w.source_book,
      task_summary: w.task_summary,
      full_prompt: w.full_prompt,
      key_questions: w.key_questions,
      problem_patterns: w.problem_patterns,
      synergy_triggers: w.synergy_triggers,
      complexity: w.complexity,
      estimated_duration_min: w.estimated_duration_min || null,
      embedding: w.embedding,
    }));

    const { data, error } = await supabase
      .from('workflows')
      .insert(records)
      .select('id');

    if (error) {
      console.log(`   Batch ${batchNum}/${totalBatches}: ❌ Error - ${error.message}`);
      totalErrors += batch.length;
    } else {
      console.log(`   Batch ${batchNum}/${totalBatches}: ✅ Inserted ${data?.length || 0} workflows`);
      totalInserted += data?.length || 0;
    }
  }

  // Final count
  const { count } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true });

  console.log('\n====================================');
  console.log('📊 Results:');
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Total in database: ${count}`);
  console.log('====================================\n');

  if (count === workflows.length) {
    console.log('✅ All workflows seeded successfully!');
  } else {
    console.log(`⚠️  Expected ${workflows.length}, got ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
