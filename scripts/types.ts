// types.ts - Shared types for content pipeline

export interface ParsedWorkflow {
  name: string;
  domain: string;
  sub_domain: string;
  source_book: string;
  task_summary: string;
  full_prompt: string;
  key_questions: string[];
  problem_patterns: string[];
  synergy_triggers: string[];
  complexity: 'low' | 'medium' | 'high';
  estimated_duration_min?: number;
  file_path: string; // For debugging
}

export interface EmbeddedWorkflow extends ParsedWorkflow {
  embedding: number[];
}

export interface WorkflowRecord {
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
  estimated_duration_min: number | null;
  embedding: number[];
}

export const VALID_DOMAINS = [
  'strategy',
  'marketing', 
  'sales',
  'operations',
  'innovation',
  'hr',
  'finance'
] as const;

export type Domain = typeof VALID_DOMAINS[number];

export function isValidDomain(domain: string): domain is Domain {
  return VALID_DOMAINS.includes(domain.toLowerCase() as Domain);
}
