#!/usr/bin/env npx ts-node

/**
 * parse-workflows.ts (Updated for QEP AISolve format)
 * 
 * Parses .docx workflow files that contain MULTIPLE workflows per file.
 * Handles the format:
 *   1. Category — Book Author
 *      Workflow Name
 *      # TASK
 *      # STEP 1: ...
 *      # STEP 2: ...
 * 
 * Usage:
 *   npx ts-node parse-workflows.ts --source ./workflows --output ./processed/parsed.json
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { ParsedWorkflow, isValidDomain, VALID_DOMAINS } from './types';

// Parse command line arguments
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
const outputIndex = args.indexOf('--output');

const SOURCE_DIR = sourceIndex !== -1 ? args[sourceIndex + 1] : './workflows';
const OUTPUT_FILE = outputIndex !== -1 ? args[outputIndex + 1] : './processed/parsed.json';

/**
 * Extract text content from a .docx file
 */
async function extractDocxText(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

/**
 * Clean up text by removing escape characters and extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/\\\./g, '.')
    .replace(/\\-/g, '-')
    .replace(/\\_/g, '_')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Split document into individual workflows
 * Detects workflow boundaries by looking for:
 * - Numbered headers like "1. Category — Author"
 * - Bold workflow names followed by # TASK
 */
function splitIntoWorkflows(content: string): { source: string; name: string; content: string }[] {
  const workflows: { source: string; name: string; content: string }[] = [];
  
  // Pattern to match numbered section headers like "1. Positioning — Ries & Trout"
  const sectionHeaderPattern = /^\d+\.\s+__(.+?)__\s*$/gm;
  
  // Pattern to match workflow names (bold text followed by # TASK)
  const workflowPattern = /__([^_]+)__\s*\n+#\s*TASK/g;
  
  // First, find all section headers to get source attributions
  const sections: { index: number; source: string }[] = [];
  let match;
  
  // Reset and find section headers
  const headerRegex = /^\d+\.\s+__(.+?)__\s*$/gm;
  while ((match = headerRegex.exec(content)) !== null) {
    sections.push({
      index: match.index,
      source: match[1].replace(/—|--/g, 'by').trim()
    });
  }
  
  // Now find individual workflows
  // Pattern: Bold title followed by # TASK
  const workflowStartPattern = /__([^_\n]+)__\s*\n+#\s*TASK/g;
  const workflowStarts: { index: number; name: string; taskStart: number }[] = [];
  
  while ((match = workflowStartPattern.exec(content)) !== null) {
    workflowStarts.push({
      index: match.index,
      name: match[1].trim(),
      taskStart: match.index + match[0].indexOf('# TASK')
    });
  }
  
  // Extract each workflow's content
  for (let i = 0; i < workflowStarts.length; i++) {
    const current = workflowStarts[i];
    const nextStart = i < workflowStarts.length - 1 
      ? workflowStarts[i + 1].index 
      : content.length;
    
    // Find which section this workflow belongs to
    let source = 'Unknown Source';
    for (let j = sections.length - 1; j >= 0; j--) {
      if (sections[j].index < current.index) {
        source = sections[j].source;
        break;
      }
    }
    
    // Extract workflow content
    const workflowContent = content.slice(current.taskStart, nextStart).trim();
    
    workflows.push({
      source,
      name: current.name,
      content: workflowContent
    });
  }
  
  return workflows;
}

/**
 * Alternative simpler split - just look for # TASK markers
 */
function splitByTaskMarkers(content: string, domain: string): { source: string; name: string; content: string }[] {
  const workflows: { source: string; name: string; content: string }[] = [];
  
  // Split by # TASK (keeping the marker)
  const parts = content.split(/(?=#\s*TASK\b)/i);
  
  let currentSource = 'Unknown Source';
  let workflowIndex = 0;
  
  for (const part of parts) {
    if (!part.trim() || !part.match(/#\s*TASK/i)) {
      // Check if this part contains a source attribution
      const sourceMatch = part.match(/\d+\.\s+__(.+?)__/);
      if (sourceMatch) {
        currentSource = sourceMatch[1].replace(/—|--/g, 'by').trim();
      }
      continue;
    }
    
    workflowIndex++;
    
    // Try to find workflow name from the text before # TASK
    // Look backwards in original content
    const taskIndex = content.indexOf(part);
    const beforeTask = content.slice(Math.max(0, taskIndex - 500), taskIndex);
    
    // Find the last bold text before this # TASK
    const boldMatches = [...beforeTask.matchAll(/__([^_\n]+)__/g)];
    let workflowName = `${domain} Workflow ${workflowIndex}`;
    
    if (boldMatches.length > 0) {
      const lastBold = boldMatches[boldMatches.length - 1][1].trim();
      // Make sure it's not a section header (those contain — or --)
      if (!lastBold.includes('—') && !lastBold.includes('--') && lastBold.length < 100) {
        workflowName = lastBold;
      }
    }
    
    workflows.push({
      source: currentSource,
      name: workflowName,
      content: part.trim()
    });
  }
  
  return workflows;
}

/**
 * Extract task summary from # TASK section
 */
function extractTaskSummary(content: string): string {
  const taskMatch = content.match(/#\s*TASK\s*\n+([\s\S]*?)(?=#\s*(?:INTRODUCTION|STEP|$))/i);
  if (taskMatch) {
    return cleanText(taskMatch[1]).slice(0, 1000); // Limit to 1000 chars
  }
  return cleanText(content.slice(0, 500));
}

/**
 * Extract key questions from // Context: lines in STEP sections
 */
function extractKeyQuestions(content: string): string[] {
  const questions: string[] = [];
  
  // Look for // Context: lines
  const contextMatches = content.matchAll(/\/\/\s*Context:\s*(.+?)(?=\n|$)/gi);
  for (const match of contextMatches) {
    const contextText = cleanText(match[1]);
    // Convert context descriptions to questions
    if (contextText.toLowerCase().includes('ask')) {
      // Extract the actual question part
      const questionPart = contextText.replace(/^ask\s+(me\s+)?(for|about|to|what|how|which|if)/i, '').trim();
      if (questionPart.length > 10) {
        questions.push(questionPart.charAt(0).toUpperCase() + questionPart.slice(1) + '?');
      }
    }
  }
  
  // Also look for explicit question patterns
  const questionMatches = content.matchAll(/Ask[,:]?\s*["']?([^"'\n]+\?)/gi);
  for (const match of questionMatches) {
    const q = cleanText(match[1]);
    if (q.length > 10 && !questions.includes(q)) {
      questions.push(q);
    }
  }
  
  // Limit to 10 questions
  return questions.slice(0, 10);
}

/**
 * Infer problem patterns from workflow content
 */
function inferProblemPatterns(content: string, name: string): string[] {
  const patterns: string[] = [];
  
  // Common business problem keywords
  const problemKeywords = [
    'struggling', 'challenge', 'problem', 'issue', 'pain', 'frustrated',
    'unclear', 'confused', 'stuck', 'failing', 'declining', 'losing'
  ];
  
  // Extract sentences containing problem keywords
  const sentences = content.split(/[.!?]+/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const keyword of problemKeywords) {
      if (lower.includes(keyword) && sentence.length > 20 && sentence.length < 200) {
        const cleaned = cleanText(sentence).trim();
        if (cleaned && !patterns.includes(cleaned)) {
          patterns.push(cleaned);
        }
        break;
      }
    }
  }
  
  // Add patterns based on workflow name
  const nameLower = name.toLowerCase();
  if (nameLower.includes('position')) {
    patterns.push('unclear market positioning');
    patterns.push('difficulty differentiating from competitors');
  }
  if (nameLower.includes('category')) {
    patterns.push('competing in crowded market');
    patterns.push('no clear category ownership');
  }
  if (nameLower.includes('launch')) {
    patterns.push('preparing for product launch');
    patterns.push('need go-to-market strategy');
  }
  if (nameLower.includes('competitor')) {
    patterns.push('losing deals to competitors');
    patterns.push('need competitive differentiation');
  }
  
  return patterns.slice(0, 8);
}

/**
 * Infer synergy triggers based on content and domain
 */
function inferSynergyTriggers(content: string, domain: string): string[] {
  const triggers: string[] = [];
  const lower = content.toLowerCase();
  
  // Domain-specific synergy detection
  const synergyKeywords: Record<string, string[]> = {
    strategy: ['market', 'competitive', 'growth', 'business model'],
    marketing: ['brand', 'campaign', 'customer', 'messaging', 'positioning'],
    sales: ['pipeline', 'conversion', 'deal', 'pricing', 'revenue'],
    operations: ['process', 'efficiency', 'delivery', 'capacity'],
    innovation: ['product', 'feature', 'roadmap', 'development'],
    hr: ['team', 'hiring', 'culture', 'talent', 'organization'],
    finance: ['budget', 'cost', 'investment', 'profitability']
  };
  
  for (const [targetDomain, keywords] of Object.entries(synergyKeywords)) {
    if (targetDomain === domain) continue;
    
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    if (matches >= 2) {
      triggers.push(targetDomain);
    }
  }
  
  return triggers.slice(0, 3);
}

/**
 * Estimate complexity based on content
 */
function estimateComplexity(content: string): 'low' | 'medium' | 'high' {
  const stepCount = (content.match(/#\s*STEP\s*\d/gi) || []).length;
  const wordCount = content.split(/\s+/).length;
  
  if (stepCount > 6 || wordCount > 2000) return 'high';
  if (stepCount > 3 || wordCount > 1000) return 'medium';
  return 'low';
}

/**
 * Parse a single workflow from extracted content
 */
function parseWorkflowContent(
  name: string,
  source: string,
  content: string,
  domain: string,
  subDomain: string,
  filePath: string
): ParsedWorkflow {
  return {
    name: cleanText(name),
    domain: domain.toLowerCase(),
    sub_domain: subDomain.toLowerCase().replace(/\s+/g, '-'),
    source_book: cleanText(source),
    task_summary: extractTaskSummary(content),
    full_prompt: cleanText(content),
    key_questions: extractKeyQuestions(content),
    problem_patterns: inferProblemPatterns(content, name),
    synergy_triggers: inferSynergyTriggers(content, domain),
    complexity: estimateComplexity(content),
    file_path: filePath,
  };
}

/**
 * Process a single .docx file (may contain multiple workflows)
 */
async function processDocxFile(
  filePath: string,
  domain: string,
  subDomain: string
): Promise<ParsedWorkflow[]> {
  const content = await extractDocxText(filePath);
  const cleanedContent = cleanText(content);
  
  // Split into individual workflows
  let workflowParts = splitByTaskMarkers(cleanedContent, domain);
  
  // If no workflows found with that method, try the whole file as one workflow
  if (workflowParts.length === 0) {
    const filename = path.basename(filePath, '.docx');
    workflowParts = [{
      source: 'Unknown Source',
      name: filename.replace(/[-_]/g, ' '),
      content: cleanedContent
    }];
  }
  
  // Parse each workflow
  const workflows: ParsedWorkflow[] = [];
  for (const part of workflowParts) {
    const workflow = parseWorkflowContent(
      part.name,
      part.source,
      part.content,
      domain,
      subDomain,
      filePath
    );
    
    // Only include if we have meaningful content
    if (workflow.task_summary.length > 50) {
      workflows.push(workflow);
    }
  }
  
  return workflows;
}

/**
 * Recursively find all .docx files in a directory
 */
function findDocxFiles(dir: string): { path: string; domain: string; subDomain: string }[] {
  const results: { path: string; domain: string; subDomain: string }[] = [];
  
  function walk(currentDir: string, domain: string, subDomain: string) {
    if (!fs.existsSync(currentDir)) return;
    
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        const folderName = entry.name.toLowerCase();
        
        if (isValidDomain(folderName)) {
          walk(fullPath, folderName, '');
        } else if (domain) {
          walk(fullPath, domain, entry.name);
        } else {
          walk(fullPath, domain, subDomain);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.docx')) {
        // Skip temp files
        if (entry.name.startsWith('~$')) continue;
        
        // Infer domain from filename if not set
        let inferredDomain = domain;
        if (!inferredDomain) {
          const filenameLower = entry.name.toLowerCase();
          for (const d of VALID_DOMAINS) {
            if (filenameLower.includes(d)) {
              inferredDomain = d;
              break;
            }
          }
        }
        
        results.push({
          path: fullPath,
          domain: inferredDomain || 'unknown',
          subDomain: subDomain || 'general',
        });
      }
    }
  }
  
  walk(dir, '', '');
  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('🔍 QEP AISolve Content Pipeline - Parse Workflows');
  console.log('==================================================');
  console.log(`Source directory: ${SOURCE_DIR}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log('');
  console.log('📝 Format: Multi-workflow per file (# TASK / # STEP structure)');
  console.log('');
  
  // Validate source directory
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('   Create it and add your .docx workflow files');
    process.exit(1);
  }
  
  // Find all .docx files
  console.log('📂 Scanning for .docx files...');
  const files = findDocxFiles(SOURCE_DIR);
  console.log(`   Found ${files.length} .docx files`);
  console.log('');
  
  if (files.length === 0) {
    console.error('❌ No .docx files found.');
    console.error('   Structure your files as:');
    console.error('   workflows/');
    console.error('   ├── marketing/');
    console.error('   │   └── MARKETING_PROMPTS_1.docx');
    console.error('   ├── strategy/');
    console.error('   └── ...');
    process.exit(1);
  }
  
  // Process each file
  console.log('📄 Parsing workflows...');
  const allWorkflows: ParsedWorkflow[] = [];
  const errors: { file: string; error: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;
    
    try {
      console.log(`   ${progress} Processing: ${path.basename(file.path)}`);
      const workflows = await processDocxFile(file.path, file.domain, file.subDomain);
      console.log(`         → Found ${workflows.length} workflows`);
      allWorkflows.push(...workflows);
    } catch (error) {
      errors.push({
        file: file.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  console.log('');
  
  // Report domain distribution
  console.log('📊 Results by domain:');
  const domainCounts: Record<string, number> = {};
  for (const w of allWorkflows) {
    domainCounts[w.domain] = (domainCounts[w.domain] || 0) + 1;
  }
  for (const domain of VALID_DOMAINS) {
    const count = domainCounts[domain] || 0;
    if (count > 0) {
      console.log(`   ${domain}: ${count} workflows`);
    }
  }
  if (domainCounts['unknown']) {
    console.log(`   unknown: ${domainCounts['unknown']} ⚠️`);
  }
  console.log('');
  
  // Report errors
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} files had errors:`);
    for (const err of errors.slice(0, 5)) {
      console.log(`   - ${path.basename(err.file)}: ${err.error}`);
    }
    if (errors.length > 5) {
      console.log(`   ... and ${errors.length - 5} more`);
    }
    console.log('');
  }
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allWorkflows, null, 2));
  console.log(`✅ Parsed ${allWorkflows.length} total workflows from ${files.length} files`);
  console.log(`   Output saved to: ${OUTPUT_FILE}`);
  
  // Sample outputs
  if (allWorkflows.length > 0) {
    console.log('');
    console.log('📋 Sample workflows:');
    for (const sample of allWorkflows.slice(0, 3)) {
      console.log(`   • "${sample.name}" (${sample.domain})`);
      console.log(`     Source: ${sample.source_book}`);
      console.log(`     Questions: ${sample.key_questions.length}, Patterns: ${sample.problem_patterns.length}`);
    }
  }
}

main().catch(console.error);
