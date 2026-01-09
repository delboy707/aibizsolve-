import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export const openai = (): OpenAI => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

// Generate embedding for text using text-embedding-3-small (1536 dimensions)
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}
