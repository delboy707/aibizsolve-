import { createClient } from '@supabase/supabase-js';
import workflows from '../lib/workflows/sample-workflows.json' assert { type: 'json' };
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a dummy embedding (1536 dimensions of zeros)
// This allows us to test the system without OpenAI credits
function getDummyEmbedding(): number[] {
  return new Array(1536).fill(0);
}

async function seedWorkflows() {
  const workflowsArray = Array.isArray(workflows) ? workflows : (workflows as any).default;

  console.log('Starting workflow seeding (without embeddings)...');
  console.log(`Found ${workflowsArray.length} workflows to seed\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const workflow of workflowsArray) {
    try {
      console.log(`Processing: ${workflow.name}`);

      const embedding = getDummyEmbedding();

      console.log('  Inserting into database...');
      const { error } = await supabase.from('workflows').insert({
        domain: workflow.domain,
        sub_domain: workflow.sub_domain,
        source_book: workflow.source_book,
        name: workflow.name,
        task_summary: workflow.task_summary,
        full_prompt: workflow.full_prompt,
        key_questions: workflow.key_questions,
        problem_patterns: workflow.problem_patterns,
        synergy_triggers: workflow.synergy_triggers,
        complexity: workflow.complexity,
        estimated_duration_min: workflow.estimated_duration_min,
        embedding: JSON.stringify(embedding),
      });

      if (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
        errorCount++;
      } else {
        console.log(`  ✅ Success\n`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('=====================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${workflowsArray.length}`);
  console.log('=====================================');
  console.log('\nNote: Workflows inserted with dummy embeddings.');
  console.log('Add OpenAI credits and run seed-workflows-simple.ts to generate real embeddings.');
}

// Run the seeding
seedWorkflows()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
