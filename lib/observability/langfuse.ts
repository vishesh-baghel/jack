/**
 * Langfuse observability integration
 * Tracks LLM calls, costs, and performance
 */

import { Langfuse } from 'langfuse';

// Initialize Langfuse client
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
});

/**
 * Create a trace for idea generation
 */
export function createIdeaGenerationTrace(userId: string) {
  return langfuse.trace({
    name: 'generate-ideas',
    userId,
    metadata: {
      component: 'mastra-agent',
      function: 'generateIdeas',
    },
  });
}

/**
 * Alias for createIdeaGenerationTrace
 */
export const createIdeaTrace = createIdeaGenerationTrace;

/**
 * Create a trace for outline generation
 */
export function createOutlineGenerationTrace(userId: string, ideaId: string) {
  return langfuse.trace({
    name: 'generate-outline',
    userId,
    metadata: {
      component: 'mastra-agent',
      function: 'generateOutline',
      ideaId,
    },
  });
}

/**
 * Alias for createOutlineGenerationTrace
 */
export function createOutlineTrace(userId: string, ideaTitle: string) {
  return createOutlineGenerationTrace(userId, ideaTitle);
}

/**
 * Create a span for LLM generation
 */
export function createLLMSpan(
  trace: ReturnType<typeof langfuse.trace>,
  name: string,
  input: unknown
) {
  return trace.span({
    name,
    input,
  });
}

/**
 * Flush events on shutdown
 */
export async function shutdownLangfuse() {
  await langfuse.shutdownAsync();
}
