import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateIdeas } from '@/lib/mastra/agent';
import { buildIdeaContext } from '@/lib/mastra/context';
import { getUserWithRelations } from '@/lib/db/users';
import { getGoodPostsForLearning } from '@/lib/db/posts';
import { createContentIdea, getRecentIdeas } from '@/lib/db/content-ideas';
import { blockGuestWrite } from '@/lib/auth';

const RequestSchema = z.object({
  userId: z.string(),
  trendingTopics: z.array(
    z.object({
      name: z.string(),
      mentions: z.number(),
    })
  ).optional().default([]),
});

export async function POST(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, trendingTopics } = RequestSchema.parse(body);

    console.log(`[IDEA_GEN] Starting idea generation for user ${userId}`);

    // Fetch user data with relations
    const user = await getUserWithRelations(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[IDEA_GEN] User data fetched:`, {
      userId: user.id,
      projectsCount: user.projects?.length || 0,
      creatorsCount: user.creators?.length || 0,
      activeCreators: user.creators?.filter(c => c.isActive).map(c => c.xHandle) || [],
      hasToneConfig: !!user.toneConfig,
    });

    // Get good posts for learning
    const goodPosts = await getGoodPostsForLearning(userId, 10);
    console.log(`[IDEA_GEN] Fetched ${goodPosts.length} good posts for learning`);

    // Get recent ideas for context
    const recentIdeas = await getRecentIdeas(userId);
    console.log(`[IDEA_GEN] Fetched ${recentIdeas.length} recent ideas`);

    // Build context
    const context = await buildIdeaContext(user, trendingTopics, goodPosts);

    console.log(`[IDEA_GEN] Context built:`, {
      topicsCount: context.topics.length,
      projectsCount: context.projects.length,
      goodPostsCount: context.goodPosts.length,
      creatorTweetsCount: context.creatorTweets?.length || 0,
      creatorTweetsSample: context.creatorTweets?.slice(0, 3).map(t => ({
        author: t.author,
        contentPreview: t.content.substring(0, 50) + '...',
      })) || [],
    });

    // Generate ideas using agent
    const ideas = await generateIdeas(userId, context, recentIdeas);

    // Save ideas to database
    const savedIdeas = await Promise.all(
      ideas.map((idea) => createContentIdea(userId, idea))
    );

    return NextResponse.json({
      ideas: savedIdeas,
      count: savedIdeas.length,
    });
  } catch (error) {
    console.error('Error generating ideas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
