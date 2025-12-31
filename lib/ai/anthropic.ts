import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export const anthropic = (): Anthropic => {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
};

// Model constants - using latest models
export const MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-3-5-sonnet-20241022',
  OPUS: 'claude-opus-4-5-20251101',
} as const;
