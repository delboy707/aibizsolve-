// User types
export type PaymentTier = 'trial' | 'below_average' | 'average' | 'above_average';
export type UserSegment = 'solopreneur' | 'small_business' | 'manager' | 'ceo';

export interface User {
  id: string;
  email: string;
  monthly_payment: number;
  payment_tier: PaymentTier;
  user_segment: UserSegment | null;
  trial_ends_at: string;
  monthly_queries_used: number;
  queries_reset_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Decision types
export type DecisionMode = 'one_shot' | 'companion';
export type DecisionStatus = 'intake' | 'clarifying' | 'processing' | 'complete' | 'active' | 'review_due' | 'archived';
export type Intent = 'explore' | 'decide' | 'execute' | 'monitor';

export interface Decision {
  id: string;
  user_id: string;
  title: string | null;
  mode: DecisionMode;
  problem_statement: string | null;
  classified_symptoms: string[];
  classified_challenges: string[];
  classified_domains: string[];
  classified_intent: Intent | null;
  classification_confidence: number | null;
  matched_workflows: Workflow[];
  alchemy_generated: boolean;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
}

// Message types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  decision_id: string;
  role: MessageRole;
  content: string;
  step_label: string | null;
  created_at: string;
}

// Document types
export type DocumentFormat = 'markdown' | 'pdf' | 'docx';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadedDocument {
  id: string;
  user_id: string;
  decision_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
}

export interface AlchemyContent {
  counterintuitive: string;
  perception_play: string;
  small_bet: string;
  hidden_driver: string;
}

export interface RoadmapPhase {
  phase: string;
  tasks: string[];
  metrics: string[];
}

export interface Document {
  id: string;
  decision_id: string;
  title: string | null;
  content: string;
  format: DocumentFormat;
  scqa_situation: string | null;
  scqa_complication: string | null;
  scqa_question: string | null;
  scqa_answer: string | null;
  roadmap_30: RoadmapPhase | null;
  roadmap_60: RoadmapPhase | null;
  roadmap_90: RoadmapPhase | null;
  alchemy_content: AlchemyContent | null;
  created_at: string;
}

// Workflow types
export type Domain = 'strategy' | 'marketing' | 'sales' | 'innovation' | 'operations' | 'hr' | 'finance';
export type Complexity = 'low' | 'medium' | 'high';

export interface Workflow {
  id: string;
  domain: Domain;
  sub_domain: string | null;
  source_book: string;
  name: string;
  task_summary: string;
  full_prompt: string;
  key_questions: string[];
  problem_patterns: string[];
  synergy_triggers: string[];
  complexity: Complexity;
  estimated_duration_min: number | null;
  similarity?: number;
  created_at: string;
}

// Payment stats types
export interface PaymentStats {
  id: string;
  segment: UserSegment;
  average_payment: number;
  median_payment: number | null;
  payment_count: number;
  updated_at: string;
}

// Classification types
export interface Classification {
  symptoms: string[];
  challenges: string[];
  primary_domain: Domain;
  secondary_domains: Domain[];
  intent: Intent;
  confidence: number;
  clarifying_question: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
