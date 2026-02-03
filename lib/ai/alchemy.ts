import { anthropic, MODELS } from './anthropic';
import { ALCHEMY_PROMPT } from './prompts';

export interface AlchemyInput {
  problem: string;
  domains: string[];
  intent: string;
  challenges: string[];
}

export interface AlchemyOutput {
  raw: string;
  counterintuitiveOptions?: string;
  perceptionPlay?: string;
  smallBet?: string;
  hiddenDriver?: string;
}

/**
 * Parse the raw alchemy response into structured sections
 */
function parseAlchemyContent(content: string): AlchemyOutput {
  const sections: AlchemyOutput = { raw: content };

  // Extract Counterintuitive Options
  const counterintuitiveMatch = content.match(
    /## Counterintuitive Options\s*([\s\S]*?)(?=## The Perception Play|$)/i
  );
  if (counterintuitiveMatch) {
    sections.counterintuitiveOptions = counterintuitiveMatch[1].trim();
  }

  // Extract Perception Play
  const perceptionMatch = content.match(
    /## The Perception Play\s*([\s\S]*?)(?=## Small Bet|$)/i
  );
  if (perceptionMatch) {
    sections.perceptionPlay = perceptionMatch[1].trim();
  }

  // Extract Small Bet, Big Signal
  const smallBetMatch = content.match(
    /## Small Bet, Big Signal\s*([\s\S]*?)(?=## The Hidden Driver|$)/i
  );
  if (smallBetMatch) {
    sections.smallBet = smallBetMatch[1].trim();
  }

  // Extract Hidden Driver
  const hiddenDriverMatch = content.match(
    /## The Hidden Driver\s*([\s\S]*?)$/i
  );
  if (hiddenDriverMatch) {
    sections.hiddenDriver = hiddenDriverMatch[1].trim();
  }

  return sections;
}

/**
 * Generate Alchemy Layer content using Claude
 * This is the core function that can be called independently for A/B testing
 */
export async function generateAlchemy(input: AlchemyInput): Promise<AlchemyOutput> {
  const { problem, domains, intent, challenges } = input;

  const prompt = ALCHEMY_PROMPT
    .replace('{problem}', problem)
    .replace('{domains}', domains.length > 0 ? domains.join(', ') : 'General Business Strategy')
    .replace('{intent}', intent || 'explore')
    .replace('{challenges}', challenges.length > 0 ? challenges.join(', ') : 'Strategic challenges identified in conversation');

  const response = await anthropic().messages.create({
    model: MODELS.OPUS,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: ALCHEMY_PROMPT.split('{problem}')[0],
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return parseAlchemyContent(content.text);
}

/**
 * Generate Alchemy Layer content with streaming support
 * Returns a promise that resolves to the full content
 */
export async function generateAlchemyStreaming(input: AlchemyInput): Promise<AlchemyOutput> {
  const { problem, domains, intent, challenges } = input;

  const prompt = ALCHEMY_PROMPT
    .replace('{problem}', problem)
    .replace('{domains}', domains.length > 0 ? domains.join(', ') : 'General Business Strategy')
    .replace('{intent}', intent || 'explore')
    .replace('{challenges}', challenges.length > 0 ? challenges.join(', ') : 'Strategic challenges identified in conversation');

  const stream = await anthropic().messages.stream({
    model: MODELS.OPUS,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: ALCHEMY_PROMPT.split('{problem}')[0],
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  let result = '';
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta' && chunk.delta?.text) {
      result += chunk.delta.text;
    }
  }

  return parseAlchemyContent(result);
}
