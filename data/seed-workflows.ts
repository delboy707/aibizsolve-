// Seed workflows data - imported at build time by Vercel
// Contains 15 representative workflows (5 per domain) with embeddings

import seedData from './seed-workflows.json';

export interface SeedWorkflow {
  name: string;
  domain: string;
  sub_domain: string;
  source_book: string;
  task_summary: string;
  full_prompt: string;
  key_questions: string[];
  problem_patterns: string[];
  synergy_triggers: string[];
  complexity: string;
  embedding: number[];
}

export const seedWorkflows: SeedWorkflow[] = seedData as SeedWorkflow[];
export default seedWorkflows;
