#!/usr/bin/env npx ts-node

/**
 * pipeline.ts
 * 
 * Full content pipeline: Parse → Embed → Load
 * 
 * Usage:
 *   npx ts-node pipeline.ts --source ./workflows --output ./processed
 *   npx ts-node pipeline.ts --source ./workflows --output ./processed --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Parse command line arguments
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
const outputIndex = args.indexOf('--output');
const batchSizeIndex = args.indexOf('--batch-size');
const dryRun = args.includes('--dry-run');
const skipExisting = args.includes('--skip-existing');
const clearFirst = args.includes('--clear-first');

const SOURCE_DIR = sourceIndex !== -1 ? args[sourceIndex + 1] : './workflows';
const OUTPUT_DIR = outputIndex !== -1 ? args[outputIndex + 1] : './processed';
const BATCH_SIZE = batchSizeIndex !== -1 ? args[batchSizeIndex + 1] : '20';

const PARSED_FILE = path.join(OUTPUT_DIR, 'parsed.json');
const EMBEDDED_FILE = path.join(OUTPUT_DIR, 'embedded.json');

/**
 * Check environment variables
 */
function checkEnv(): boolean {
  const required = [
    { key: 'OPENAI_API_KEY', label: 'OpenAI API Key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
  ];
  
  const optional = [
    { key: 'SUPABASE_URL', alt: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
  ];
  
  let valid = true;
  
  for (const { key, label } of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing ${label} (${key})`);
      valid = false;
    }
  }
  
  for (const { key, alt, label } of optional) {
    if (!process.env[key] && !process.env[alt]) {
      console.error(`❌ Missing ${label} (${key} or ${alt})`);
      valid = false;
    }
  }
  
  return valid;
}

/**
 * Run a pipeline step
 */
function runStep(name: string, command: string): boolean {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 ${name}`);
  console.log('='.repeat(60));
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       QEP AISolve CONTENT PIPELINE - Full Run            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log(`  Source directory: ${SOURCE_DIR}`);
  console.log(`  Output directory: ${OUTPUT_DIR}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Skip existing: ${skipExisting}`);
  console.log(`  Clear first: ${clearFirst}`);
  console.log('');
  
  // Check environment
  if (!dryRun && !checkEnv()) {
    console.error('');
    console.error('Please add missing environment variables to .env.local');
    process.exit(1);
  }
  
  // Check source directory
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Get script directory for relative paths
  const scriptDir = __dirname;
  
  // Step 1: Parse workflows
  const parseCommand = `npx ts-node ${path.join(scriptDir, 'parse-workflows.ts')} --source ${SOURCE_DIR} --output ${PARSED_FILE}`;
  if (!runStep('Step 1: Parse Workflows', parseCommand)) {
    process.exit(1);
  }
  
  // Check parsed output
  if (!fs.existsSync(PARSED_FILE)) {
    console.error(`❌ Parsed file not created: ${PARSED_FILE}`);
    process.exit(1);
  }
  
  const parsedWorkflows = JSON.parse(fs.readFileSync(PARSED_FILE, 'utf-8'));
  console.log(`\n✅ Parsed ${parsedWorkflows.length} workflows`);
  
  if (parsedWorkflows.length === 0) {
    console.error('❌ No workflows parsed. Check your source directory structure.');
    process.exit(1);
  }
  
  // Step 2: Generate embeddings
  const embedCommand = `npx ts-node ${path.join(scriptDir, 'generate-embeddings.ts')} --input ${PARSED_FILE} --output ${EMBEDDED_FILE} --batch-size ${BATCH_SIZE}`;
  if (!runStep('Step 2: Generate Embeddings', embedCommand)) {
    process.exit(1);
  }
  
  // Check embedded output
  if (!fs.existsSync(EMBEDDED_FILE)) {
    console.error(`❌ Embedded file not created: ${EMBEDDED_FILE}`);
    process.exit(1);
  }
  
  const embeddedWorkflows = JSON.parse(fs.readFileSync(EMBEDDED_FILE, 'utf-8'));
  console.log(`\n✅ Generated embeddings for ${embeddedWorkflows.length} workflows`);
  
  // Step 3: Seed database (skip if dry run)
  if (dryRun) {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DRY RUN - Skipping database seeding');
    console.log('='.repeat(60));
    console.log('');
    console.log('To load into database, run without --dry-run flag');
  } else {
    let seedCommand = `npx ts-node ${path.join(scriptDir, 'seed-workflows.ts')} --input ${EMBEDDED_FILE} --batch-size 50`;
    if (skipExisting) seedCommand += ' --skip-existing';
    if (clearFirst) seedCommand += ' --clear-first';
    
    if (!runStep('Step 3: Seed Database', seedCommand)) {
      process.exit(1);
    }
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    PIPELINE COMPLETE                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Summary:');
  console.log(`  Total workflows processed: ${embeddedWorkflows.length}`);
  console.log(`  Duration: ${duration} seconds`);
  console.log(`  Intermediate files:`);
  console.log(`    - ${PARSED_FILE}`);
  console.log(`    - ${EMBEDDED_FILE}`);
  console.log('');
  
  if (dryRun) {
    console.log('Next steps:');
    console.log('  1. Review the output files in ./processed/');
    console.log('  2. Run again without --dry-run to load into database');
  } else {
    console.log('Next steps:');
    console.log('  1. Verify data in Supabase dashboard');
    console.log('  2. Test vector search via API');
    console.log('  3. Continue with Sprint 3 (Workflow Engine)');
  }
}

main().catch(console.error);
