/**
 * Jack Mastra Agent
 * Embedded agent for content idea and outline generation
 */

import { Agent } from '@mastra/core';
import { z } from 'zod';
import {
  JACK_SYSTEM_PROMPT,
  IDEA_GENERATION_PROMPT,
  OUTLINE_GENERATION_PROMPT,
} from './prompts';
import {
  ContentIdeaSchema,
  ContentOutlineSchema,
  IdeaContextSchema,
  OutlineContextSchema,
} from './schemas';
import { createIdeaTrace, createOutlineTrace } from '@/lib/observability/langfuse';

/**
 * Jack Agent Configuration with Vercel AI Gateway
 * 
 * Using Mastra's model router with string-based model IDs.
 * This supports Vercel AI Gateway by using the format: "vercel/provider/model"
 * 
 * Examples:
 * - "vercel/openai/gpt-4o" - OpenAI via Vercel Gateway
 * - "vercel/alibaba/qwen3-coder-plus" - Alibaba Qwen via Gateway
 * - "openai/gpt-4o" - Direct OpenAI (no gateway)
 * 
 * Set AI_GATEWAY_API_KEY in your .env file
 */
export const jackAgent = new Agent({
  name: 'jack',
  instructions: JACK_SYSTEM_PROMPT,
  // Use Vercel AI Gateway if configured, otherwise fallback to direct OpenAI
  model: process.env.AI_GATEWAY_API_KEY 
    ? 'vercel/openai/gpt-4o'
    : 'openai/gpt-4o',
});

/**
 * Generate content ideas
 */
export async function generateIdeas(
  userId: string,
  context: z.infer<typeof IdeaContextSchema>,
  recentIdeas: Array<{ title: string; contentPillar: string; status: string }> = []
) {
  const trace = createIdeaTrace(userId);

  try {
    const span = trace.span({
      name: 'generate-ideas',
      input: context,
    });

    const prompt = `${IDEA_GENERATION_PROMPT}

Topics: ${context.topics.map((t) => `${t.name} (${t.mentions} mentions)`).join(', ')}

Projects:
${context.projects.map((p) => `${p.name}: ${p.description}`).join('\n')}

Tone Config:
${JSON.stringify(context.tone, null, 2)}

Learned Patterns:
${JSON.stringify(context.tone.learnedPatterns, null, 2)}

Good Posts:
${context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 100)}...`).join('\n\n')}

Recent Ideas:
${recentIdeas.map((idea) => `[${idea.status}] ${idea.contentPillar}: ${idea.title}`).join('\n')}

Generate 3-5 content ideas as a JSON array matching the ContentIdea schema.`;

    const result = await jackAgent.generate(prompt, {
      output: z.object({
        ideas: z.array(ContentIdeaSchema),
      }),
    });

    span.end({
      output: result,
    });

    return result.object?.ideas || [];
  } catch (error) {
    trace.update({
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    throw error;
  }
}

/**
 * Generate outline for a content idea
 */
export async function generateOutline(
  userId: string,
  context: z.infer<typeof OutlineContextSchema>
) {
  const trace = createOutlineTrace(userId, context.idea.title);

  try {
    const span = trace.span({
      name: 'generate-outline',
      input: context,
    });

    const prompt = `${OUTLINE_GENERATION_PROMPT}

Idea:
${JSON.stringify(context.idea, null, 2)}

Format: ${context.idea.suggestedFormat}

Tone Config:
${JSON.stringify(context.tone, null, 2)}

Learned Patterns:
${JSON.stringify(context.tone.learnedPatterns, null, 2)}

Good Posts:
${context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 100)}...`).join('\n\n')}

Avg Post Length: ${String(context.tone.learnedPatterns?.avgPostLength || 180)}

Generate a detailed outline as JSON matching the ContentOutline schema.`;

    const result = await jackAgent.generate(prompt, {
      output: ContentOutlineSchema,
    });

    span.end({
      output: result,
    });

    return result.object || { format: 'post' as const, sections: [], estimatedLength: '280', toneReminders: [] };
  } catch (error) {
    trace.update({
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    throw error;
  }
}
