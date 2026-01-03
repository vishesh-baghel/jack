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

    // Build custom rules section
    const customRulesSection = context.tone.customRules && context.tone.customRules.length > 0
      ? `\nCustom Voice Rules:\n${context.tone.customRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`
      : '';

    // Build creator tweets section
    console.log(`[AGENT] Building creator tweets section. Available tweets: ${context.creatorTweets?.length || 0}`);

    const creatorTweetsSection = context.creatorTweets && context.creatorTweets.length > 0
      ? `**Creator Tweets** (what top creators are talking about - use these as inspiration):\n${context.creatorTweets
          .slice(0, 15)
          .map((tweet, idx) => `${idx + 1}. ${tweet.author}: ${tweet.content.substring(0, 280)}`)
          .join('\n\n')}`
      : '';

    if (creatorTweetsSection) {
      console.log(`[AGENT] Creator tweets section built with ${Math.min(15, context.creatorTweets.length)} tweets`);
      console.log(`[AGENT] First tweet sample: ${context.creatorTweets[0]?.author} - ${context.creatorTweets[0]?.content.substring(0, 100)}`);
    } else {
      console.warn(`[AGENT] No creator tweets section - tweets may be missing!`);
    }

    // Build sections
    const topicsSection = context.topics.length > 0
      ? `**Trending Topics**: ${context.topics.map((t) => `${t.name} (${t.mentions} mentions)`).join(', ')}`
      : `**Trending Topics**: None provided`;

    const projectsSection = context.projects.length > 0
      ? `**User Projects**:\n${context.projects.map((p) => `- ${p.name}: ${p.description}`).join('\n')}`
      : `**User Projects**: None (suggest general content ideas)`;

    const goodPostsSection = context.goodPosts.length > 0
      ? `**Good Posts** (examples of what has worked well):\n${context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 150)}...`).join('\n\n')}`
      : `**Good Posts**: No examples yet`;

    const recentIdeasSection = recentIdeas.length > 0
      ? `**Recent Ideas** (DO NOT DUPLICATE THESE):\n${recentIdeas.map((idea) => `[${idea.status}] ${idea.contentPillar}: ${idea.title}`).join('\n')}`
      : `**Recent Ideas**: None (first time generating)`;

    const prompt = `${IDEA_GENERATION_PROMPT}

---

${topicsSection}

${projectsSection}

${creatorTweetsSection}

${goodPostsSection}

${recentIdeasSection}

**Tone Config**:
${JSON.stringify(context.tone, null, 2)}
${customRulesSection}

**Learned Patterns**:
${JSON.stringify(context.tone.learnedPatterns, null, 2)}

---

Generate 3-5 FRESH content ideas as a JSON array. Remember: Avoid duplicating recent ideas!`;

    console.log(`[AGENT] Final prompt length: ${prompt.length} characters`);
    console.log(`[AGENT] Prompt includes creator tweets: ${prompt.includes('Creator Tweets')}`);
    console.log(`[AGENT] Sending request to LLM...`);

    const result = await jackAgent.generate(prompt, {
      output: z.object({
        ideas: z.array(ContentIdeaSchema),
      }),
    });

    console.log(`[AGENT] LLM returned ${result.object?.ideas?.length || 0} ideas`);

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
  console.log(`[AGENT] Starting outline generation for idea: "${context.idea.title}"`);

  const trace = createOutlineTrace(userId, context.idea.title);

  try {
    const span = trace.span({
      name: 'generate-outline',
      input: context,
    });

    console.log(`[AGENT] Outline context:`, {
      ideaTitle: context.idea.title,
      format: context.idea.suggestedFormat,
      projectsCount: context.projects.length,
      goodPostsCount: context.goodPosts.length,
      hasToneConfig: !!context.tone,
      hasLearnedPatterns: !!context.tone.learnedPatterns,
    });

    // Build custom rules section
    const customRulesSection = context.tone.customRules && context.tone.customRules.length > 0
      ? `\nCustom Voice Rules:\n${context.tone.customRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`
      : '';

    const prompt = `${OUTLINE_GENERATION_PROMPT}

Idea:
${JSON.stringify(context.idea, null, 2)}

Format: ${context.idea.suggestedFormat}

Tone Config:
${JSON.stringify(context.tone, null, 2)}
${customRulesSection}

Learned Patterns:
${JSON.stringify(context.tone.learnedPatterns, null, 2)}

Good Posts:
${context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 100)}...`).join('\n\n')}

Avg Post Length: ${String(context.tone.learnedPatterns?.avgPostLength || 180)}

Generate a detailed outline as JSON matching the ContentOutline schema.`;

    console.log(`[AGENT] Outline prompt length: ${prompt.length} characters`);
    console.log(`[AGENT] Sending outline request to LLM...`);

    const result = await jackAgent.generate(prompt, {
      output: ContentOutlineSchema,
    });

    console.log(`[AGENT] Outline generated successfully`);

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
