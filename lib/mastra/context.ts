/**
 * Context building utilities for agent prompts
 */

import type { IdeaContext, OutlineContext, TrendingTopic, ContentIdea } from './schemas';
import { getAllCreatorTweets } from '@/lib/db/creator-tweets';

interface UserWithRelations {
  id: string;
  projects?: Array<{ name: string; description?: string | null; status: string; [key: string]: unknown }>;
  creators?: Array<{ xHandle: string; isActive: boolean; [key: string]: unknown }>;
  toneConfig?: {
    lowercase: boolean;
    noEmojis: boolean;
    noHashtags: boolean;
    showFailures: boolean;
    includeNumbers: boolean;
    learnedPatterns: unknown;
    [key: string]: unknown;
  } | null;
}

interface GoodPost {
  content: string;
  contentPillar: string;
  contentType: string;
  markedGoodAt: Date | null;
}

/**
 * Build context for idea generation
 */
export async function buildIdeaContext(
  user: UserWithRelations,
  trendingTopics: TrendingTopic[],
  goodPosts: GoodPost[] = []
): Promise<IdeaContext> {
  const projects = (user.projects || []).map((p) => ({
    name: p.name,
    description: p.description || '',
    status: p.status as 'active' | 'paused' | 'completed',
  }));

  const toneConfig = user.toneConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: [],
    learnedPatterns: {},
  };

  // Fetch creator tweets
  console.log(`[CONTEXT] Fetching creator tweets for user ${user.id} (limit: 50, daysBack: 30)`);

  const creatorTweets = await getAllCreatorTweets(user.id, {
    limit: 50,
    daysBack: 30,
  });

  console.log(`[CONTEXT] Fetched ${creatorTweets.length} creator tweets from database`);

  if (creatorTweets.length > 0) {
    console.log(`[CONTEXT] Sample tweets:`, creatorTweets.slice(0, 3).map(t => ({
      author: t.authorHandle,
      publishedAt: t.publishedAt,
      contentPreview: t.content.substring(0, 80) + '...',
      metrics: t.metrics,
    })));
  } else {
    console.warn(`[CONTEXT] No creator tweets found! This may affect idea quality.`);
  }

  const mappedCreatorTweets = creatorTweets.map((tweet) => ({
    content: tweet.content,
    author: tweet.authorHandle,
    publishedAt: tweet.publishedAt.toISOString(),
    metrics: tweet.metrics as Record<string, unknown>,
  }));

  console.log(`[CONTEXT] Mapped ${mappedCreatorTweets.length} tweets for context`);

  return {
    topics: trendingTopics,
    projects,
    tone: {
      lowercase: toneConfig.lowercase,
      noEmojis: toneConfig.noEmojis,
      noHashtags: toneConfig.noHashtags,
      showFailures: toneConfig.showFailures,
      includeNumbers: toneConfig.includeNumbers,
      customRules: (toneConfig.customRules as string[]) || [],
      learnedPatterns: (toneConfig.learnedPatterns as Record<string, unknown>) || {},
    },
    goodPosts: goodPosts.map((p) => ({
      content: p.content,
      contentPillar: p.contentPillar as 'lessons_learned' | 'helpful_content' | 'build_progress' | 'decisions' | 'promotion',
      format: p.contentType as 'post' | 'thread' | 'long_form',
    })),
    creatorTweets: mappedCreatorTweets,
  };
}

/**
 * Build context for outline generation
 */
export async function buildOutlineContext(
  idea: ContentIdea,
  user: UserWithRelations,
  goodPosts: GoodPost[] = []
): Promise<OutlineContext> {
  const toneConfig = user.toneConfig || {
    lowercase: true,
    noEmojis: true,
    noHashtags: true,
    showFailures: true,
    includeNumbers: true,
    customRules: [],
    learnedPatterns: {},
  };

  return {
    idea,
    projects: (user.projects || []).map((p) => ({
      name: p.name,
      description: p.description || '',
      status: p.status as 'active' | 'paused' | 'completed',
    })),
    tone: {
      lowercase: toneConfig.lowercase,
      noEmojis: toneConfig.noEmojis,
      noHashtags: toneConfig.noHashtags,
      showFailures: toneConfig.showFailures,
      includeNumbers: toneConfig.includeNumbers,
      customRules: (toneConfig.customRules as string[]) || [],
      learnedPatterns: (toneConfig.learnedPatterns as Record<string, unknown>) || {},
    },
    goodPosts: goodPosts.map((p) => ({
      content: p.content,
      contentPillar: p.contentPillar as 'lessons_learned' | 'helpful_content' | 'build_progress' | 'decisions' | 'promotion',
      format: p.contentType as 'post' | 'thread' | 'long_form',
    })),
  };
}

/**
 * Format context for prompt injection
 */
export function formatContextForPrompt(context: IdeaContext | OutlineContext): Record<string, string> {
  if ('topics' in context) {
    // IdeaContext
    return {
      topics: context.topics.map((t) => `${t.name} (${t.mentions} mentions)`).join(', '),
      projects: context.projects.map((p) => `${p.name}: ${p.description}`).join('\n'),
      toneConfig: JSON.stringify(context.tone, null, 2),
      learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
      goodPosts: context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 100)}...`).join('\n\n'),
      recentIdeas: '', // Will be populated from DB
    };
  } else {
    // OutlineContext
    return {
      idea: JSON.stringify(context.idea, null, 2),
      format: context.idea.suggestedFormat,
      toneConfig: JSON.stringify(context.tone, null, 2),
      learnedPatterns: JSON.stringify(context.tone.learnedPatterns, null, 2),
      goodPosts: context.goodPosts.map((p) => `[${p.contentPillar}] ${p.content.substring(0, 100)}...`).join('\n\n'),
      avgPostLength: String(context.tone.learnedPatterns?.avgPostLength || 180),
    };
  }
}
