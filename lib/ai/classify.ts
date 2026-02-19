import { anthropic, MODELS } from './anthropic';
import { CLASSIFICATION_PROMPT } from './prompts';

export interface ClassificationResult {
  symptoms: string[];
  challenges: string[];
  primary_domain: string;
  secondary_domains: string[];
  intent: string;
  confidence: number;
}

/**
 * Classify a business problem using 4-layer taxonomy
 *
 * Layer 1 - Symptoms: Surface-level user language
 * Layer 2 - Challenges: Root causes
 * Layer 3 - Domains: Business function(s) involved
 * Layer 4 - Intent: User's goal state (Explore/Decide/Execute/Monitor)
 */
export async function classifyProblem(problem: string): Promise<ClassificationResult> {
  const response = await anthropic().messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${CLASSIFICATION_PROMPT}\n\nProblem to classify:\n${problem}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Parse JSON response, handling potential markdown code blocks
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  const result = JSON.parse(jsonText) as ClassificationResult;

  // Normalize domains to lowercase — the classification prompt lists them
  // capitalized (Strategy, Marketing, etc.) but the workflows table stores
  // them lowercase. PostgreSQL text matching is case-sensitive.
  result.primary_domain = (result.primary_domain || '').toLowerCase();
  result.secondary_domains = (result.secondary_domains || []).map(d => d.toLowerCase());

  return result;
}

/**
 * Get all domains from classification (primary + secondary)
 */
export function getAllDomains(classification: ClassificationResult): string[] {
  const domains = [classification.primary_domain];
  if (classification.secondary_domains) {
    domains.push(...classification.secondary_domains);
  }
  return domains.filter(Boolean);
}
