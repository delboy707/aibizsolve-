#!/usr/bin/env node
/**
 * Generates batched SQL files from workflows-embedded.json
 * for pasting into the Supabase SQL editor.
 *
 * Usage: node scripts/generate-seed-sql.js
 * Output: sql/seed-workflows-01.sql, sql/seed-workflows-02.sql, ...
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'processed', 'workflows-embedded.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'sql');
const BATCH_SIZE = 25; // ~25 workflows per file keeps each under ~500KB

// Escape single quotes for SQL
function esc(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function jsonLiteral(val) {
  if (val == null) return "'[]'::jsonb";
  return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
}

function main() {
  console.log('Reading workflows...');
  const workflows = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  console.log(`Loaded ${workflows.length} workflows`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const totalBatches = Math.ceil(workflows.length / BATCH_SIZE);
  console.log(`Generating ${totalBatches} SQL files (${BATCH_SIZE} workflows each)...`);

  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, workflows.length);
    const slice = workflows.slice(start, end);
    const fileNum = String(batch + 1).padStart(2, '0');
    const fileName = `seed-workflows-${fileNum}.sql`;

    let sql = `-- Batch ${batch + 1}/${totalBatches}: workflows ${start + 1}-${end}\n`;
    sql += `-- Paste this into Supabase SQL Editor and click Run\n\n`;

    for (const w of slice) {
      const embeddingStr = '[' + w.embedding.join(',') + ']';

      sql += `INSERT INTO workflows (domain, sub_domain, source_book, name, task_summary, full_prompt, key_questions, problem_patterns, synergy_triggers, complexity, embedding)\n`;
      sql += `VALUES (\n`;
      sql += `  ${esc(w.domain)},\n`;
      sql += `  ${esc(w.sub_domain)},\n`;
      sql += `  ${esc(w.source_book)},\n`;
      sql += `  ${esc(w.name)},\n`;
      sql += `  ${esc(w.task_summary)},\n`;
      sql += `  ${esc(w.full_prompt)},\n`;
      sql += `  ${jsonLiteral(w.key_questions)},\n`;
      sql += `  ${jsonLiteral(w.problem_patterns)},\n`;
      sql += `  ${jsonLiteral(w.synergy_triggers)},\n`;
      sql += `  ${esc(w.complexity || 'medium')},\n`;
      sql += `  '${embeddingStr}'::vector\n`;
      sql += `);\n\n`;
    }

    const outPath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(outPath, sql, 'utf8');
    const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ${fileName} — ${slice.length} workflows, ${sizeKB}KB`);
  }

  // Also generate a cleanup script
  const cleanupPath = path.join(OUTPUT_DIR, 'seed-workflows-00-cleanup.sql');
  fs.writeFileSync(cleanupPath, [
    '-- Run this FIRST if you want to start fresh (removes all existing workflows)',
    '-- Skip this if you want to add to existing data',
    '',
    'TRUNCATE TABLE workflows;',
    '',
    '-- Verify empty:',
    'SELECT COUNT(*) AS workflow_count FROM workflows;',
    ''
  ].join('\n'), 'utf8');

  // Generate a verification script
  const verifyPath = path.join(OUTPUT_DIR, 'seed-workflows-verify.sql');
  fs.writeFileSync(verifyPath, [
    '-- Run this AFTER all batches to verify the seed worked',
    '',
    '-- Total count (should be 583)',
    'SELECT COUNT(*) AS total_workflows FROM workflows;',
    '',
    '-- Count by domain',
    'SELECT domain, COUNT(*) AS count FROM workflows GROUP BY domain ORDER BY domain;',
    '',
    '-- Test vector search (should return results)',
    "SELECT name, domain, 1 - (embedding <=> (SELECT embedding FROM workflows LIMIT 1)) AS similarity",
    'FROM workflows',
    'ORDER BY embedding <=> (SELECT embedding FROM workflows LIMIT 1)',
    'LIMIT 5;',
    ''
  ].join('\n'), 'utf8');

  console.log(`\nDone! Files are in ${OUTPUT_DIR}/`);
  console.log(`\nSteps:`);
  console.log(`  1. (Optional) Run seed-workflows-00-cleanup.sql to clear existing data`);
  console.log(`  2. Run seed-workflows-01.sql through seed-workflows-${String(totalBatches).padStart(2, '0')}.sql in order`);
  console.log(`  3. Run seed-workflows-verify.sql to confirm`);
}

main();
