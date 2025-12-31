#!/usr/bin/env npx ts-node

/**
 * generate-embeddings.ts
 * 
 * Generates vector embeddings for parsed workflows using OpenAI.
 * 
 * Usage:
 *   npx ts-node generate-embeddings.ts --input ./processed/parsed.json --output ./processed/embedded.json
 */

import * as fs from 'fs';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { ParsedWorkflow, EmbeddedWorkflow } from './types';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Parse command line arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const outputIndex = args.indexOf('--output');
const batchSizeIndex = args.indexOf('--batch-size');

const INPUT_FILE = inputIndex !== -1 ? args[inputIndex + 1] : './processed/parsed.json';
const OUTPUT_FILE = outputIndex !== -1 ? args[outputIndex + 1] : './processed/embedded.json';
const BATCH_SIZE = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1]) : 20;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate embeddings for a batch of texts
 */
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    if (error instanceof Error && error.message.includes('rate limit')) {
      console.log('   Rate limited, waiting 60 seconds...');
      await sleep(60000);
      return generateEmbeddingsBatch(texts);
    }
    throw error;
  }
}

/**
 * Prepare text for embedding
 * Uses task_summary as the primary embedding text
 */
function prepareEmbeddingText(workflow: ParsedWorkflow): string {
  // Combine task summary with problem patterns for richer embedding
  let text = workflow.task_summary;
  
  if (workflow.problem_patterns.length > 0) {
    text += '\n\nProblem patterns: ' + workflow.problem_patterns.join('; ');
  }
  
  // Truncate to ~8000 chars to stay within token limits
  if (text.length > 8000) {
    text = text.slice(0, 8000);
  }
  
  return text;
}

/**
 * Main function
 */
async function main() {
  console.log('🧮 AI Solve Content Pipeline - Generate Embeddings');
  console.log('===================================================');
  console.log(`Input file: ${INPUT_FILE}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log('');
  
  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    console.error('   Add it to .env.local or .env file');
    process.exit(1);
  }
  
  // Read input file
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error('   Run parse-workflows.ts first');
    process.exit(1);
  }
  
  const workflows: ParsedWorkflow[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`📂 Loaded ${workflows.length} workflows`);
  console.log('');
  
  // Estimate cost
  const avgTokens = 200; // Approximate tokens per task_summary
  const totalTokens = workflows.length * avgTokens;
  const estimatedCost = (totalTokens / 1000) * 0.00002;
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
  console.log('');
  
  // Process in batches
  console.log('🔄 Generating embeddings...');
  const embeddedWorkflows: EmbeddedWorkflow[] = [];
  const totalBatches = Math.ceil(workflows.length / BATCH_SIZE);
  
  for (let i = 0; i < workflows.length; i += BATCH_SIZE) {
    const batch = workflows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} workflows)...`);
    
    // Prepare texts
    const texts = batch.map(w => prepareEmbeddingText(w));
    
    // Generate embeddings
    const embeddings = await generateEmbeddingsBatch(texts);
    
    // Combine with workflow data
    for (let j = 0; j < batch.length; j++) {
      embeddedWorkflows.push({
        ...batch[j],
        embedding: embeddings[j],
      });
    }
    
    // Rate limiting pause between batches
    if (i + BATCH_SIZE < workflows.length) {
      await sleep(500); // 500ms between batches
    }
  }
  
  console.log('');
  
  // Validate embeddings
  const validEmbeddings = embeddedWorkflows.filter(w => 
    w.embedding && w.embedding.length === EMBEDDING_DIMENSIONS
  );
  
  if (validEmbeddings.length !== embeddedWorkflows.length) {
    console.log(`⚠️  ${embeddedWorkflows.length - validEmbeddings.length} workflows have invalid embeddings`);
  }
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(embeddedWorkflows, null, 2));
  console.log(`✅ Generated embeddings for ${validEmbeddings.length} workflows`);
  console.log(`   Output saved to: ${OUTPUT_FILE}`);
  
  // File size info
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   File size: ${sizeMB} MB`);
  
  // Sample embedding info
  if (embeddedWorkflows.length > 0) {
    const sample = embeddedWorkflows[0];
    console.log('');
    console.log('📋 Sample embedding:');
    console.log(`   Workflow: ${sample.name}`);
    console.log(`   Embedding dimensions: ${sample.embedding.length}`);
    console.log(`   First 5 values: [${sample.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
  }
}

main().catch(console.error);
