#!/usr/bin/env npx ts-node

/**
 * seed-workflows.ts
 * 
 * Loads embedded workflows into Supabase database.
 * 
 * Usage:
 *   npx ts-node seed-workflows.ts --input ./processed/embedded.json
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { EmbeddedWorkflow, WorkflowRecord } from './types';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Parse command line arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const batchSizeIndex = args.indexOf('--batch-size');
const skipExisting = args.includes('--skip-existing');
const clearFirst = args.includes('--clear-first');
const dryRun = args.includes('--dry-run');

const INPUT_FILE = inputIndex !== -1 ? args[inputIndex + 1] : './processed/embedded.json';
const BATCH_SIZE = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1]) : 50;

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Convert embedded workflow to database record
 */
function toWorkflowRecord(workflow: EmbeddedWorkflow): WorkflowRecord {
  return {
    name: workflow.name,
    domain: workflow.domain,
    sub_domain: workflow.sub_domain,
    source_book: workflow.source_book,
    task_summary: workflow.task_summary,
    full_prompt: workflow.full_prompt,
    key_questions: workflow.key_questions,
    problem_patterns: workflow.problem_patterns,
    synergy_triggers: workflow.synergy_triggers,
    complexity: workflow.complexity,
    estimated_duration_min: workflow.estimated_duration_min || null,
    embedding: workflow.embedding,
  };
}

/**
 * Check if workflow already exists
 */
async function workflowExists(name: string, domain: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('workflows')
    .select('id')
    .eq('name', name)
    .eq('domain', domain)
    .limit(1);
  
  if (error) {
    console.error(`Error checking workflow existence: ${error.message}`);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Insert a batch of workflows
 */
async function insertBatch(workflows: WorkflowRecord[]): Promise<{ inserted: number; errors: number }> {
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflows)
    .select('id');
  
  if (error) {
    console.error(`   Batch error: ${error.message}`);
    return { inserted: 0, errors: workflows.length };
  }
  
  return { inserted: data?.length || 0, errors: 0 };
}

/**
 * Main function
 */
async function main() {
  console.log('📦 AI Solve Content Pipeline - Seed Database');
  console.log('=============================================');
  console.log(`Input file: ${INPUT_FILE}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Skip existing: ${skipExisting}`);
  console.log(`Clear first: ${clearFirst}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');
  
  // Read input file
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error('   Run generate-embeddings.ts first');
    process.exit(1);
  }
  
  const workflows: EmbeddedWorkflow[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`📂 Loaded ${workflows.length} workflows with embeddings`);
  console.log('');
  
  // Validate embeddings
  const validWorkflows = workflows.filter(w => w.embedding && w.embedding.length > 0);
  if (validWorkflows.length !== workflows.length) {
    console.log(`⚠️  Skipping ${workflows.length - validWorkflows.length} workflows without embeddings`);
  }
  
  if (dryRun) {
    console.log('🔍 DRY RUN - No database changes will be made');
    console.log('');
    
    // Show what would be inserted
    console.log('Would insert:');
    const byDomain: Record<string, number> = {};
    for (const w of validWorkflows) {
      byDomain[w.domain] = (byDomain[w.domain] || 0) + 1;
    }
    for (const [domain, count] of Object.entries(byDomain)) {
      console.log(`   ${domain}: ${count}`);
    }
    
    console.log('');
    console.log('✅ Dry run complete. Remove --dry-run flag to execute.');
    return;
  }
  
  // Clear existing data if requested
  if (clearFirst) {
    console.log('🗑️  Clearing existing workflows...');
    const { error } = await supabase
      .from('workflows')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      console.error(`   Error clearing: ${error.message}`);
      process.exit(1);
    }
    console.log('   Done');
    console.log('');
  }
  
  // Filter out existing if requested
  let workflowsToInsert = validWorkflows;
  
  if (skipExisting) {
    console.log('🔍 Checking for existing workflows...');
    const newWorkflows: EmbeddedWorkflow[] = [];
    
    for (const workflow of validWorkflows) {
      const exists = await workflowExists(workflow.name, workflow.domain);
      if (!exists) {
        newWorkflows.push(workflow);
      }
    }
    
    const skipped = validWorkflows.length - newWorkflows.length;
    console.log(`   Skipping ${skipped} existing workflows`);
    workflowsToInsert = newWorkflows;
    console.log('');
  }
  
  if (workflowsToInsert.length === 0) {
    console.log('✅ No new workflows to insert');
    return;
  }
  
  // Insert in batches
  console.log(`📤 Inserting ${workflowsToInsert.length} workflows...`);
  let totalInserted = 0;
  let totalErrors = 0;
  const totalBatches = Math.ceil(workflowsToInsert.length / BATCH_SIZE);
  
  for (let i = 0; i < workflowsToInsert.length; i += BATCH_SIZE) {
    const batch = workflowsToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} workflows)...`);
    
    const records = batch.map(w => toWorkflowRecord(w));
    const { inserted, errors } = await insertBatch(records);
    
    totalInserted += inserted;
    totalErrors += errors;
  }
  
  console.log('');
  
  // Final report
  console.log('📊 Results:');
  console.log(`   Inserted: ${totalInserted}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('');
  
  // Verify with count query
  const { count, error } = await supabase
    .from('workflows')
    .select('*', { count: 'exact', head: true });
  
  if (!error) {
    console.log(`✅ Total workflows in database: ${count}`);
  }
  
  // Show distribution
  const { data: domainCounts } = await supabase
    .from('workflows')
    .select('domain')
    .then(result => {
      if (result.data) {
        const counts: Record<string, number> = {};
        for (const row of result.data) {
          counts[row.domain] = (counts[row.domain] || 0) + 1;
        }
        return { data: counts };
      }
      return { data: null };
    });
  
  if (domainCounts) {
    console.log('');
    console.log('📊 Workflows by domain:');
    for (const [domain, count] of Object.entries(domainCounts)) {
      console.log(`   ${domain}: ${count}`);
    }
  }
}

main().catch(console.error);
