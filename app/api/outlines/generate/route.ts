/**
 * API Route: Generate Outline
 * POST /api/outlines/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOutline } from '@/lib/mastra/agent';
import { buildOutlineContext } from '@/lib/mastra/context';
import { getUserWithRelations } from '@/lib/db/users';
import { getGoodPostsForLearning } from '@/lib/db/posts';
import { createOutline } from '@/lib/db/outlines';
import { updateIdeaStatus } from '@/lib/db/content-ideas';
import { ContentIdeaSchema } from '@/lib/mastra/schemas';
import { blockGuestWrite } from '@/lib/auth';

const RequestSchema = z.object({
  userId: z.string(),
  contentIdeaId: z.string(),
  idea: ContentIdeaSchema,
});

export async function POST(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, contentIdeaId, idea } = RequestSchema.parse(body);

    // Start independent fetches in parallel to eliminate waterfall
    const userPromise = getUserWithRelations(userId);
    const goodPostsPromise = getGoodPostsForLearning(userId, 10);

    // Wait for user first to check if exists (early return)
    const user = await userPromise;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Wait for good posts to complete
    const goodPosts = await goodPostsPromise;

    // Build context
    const context = await buildOutlineContext(idea, user, goodPosts);

    // Generate outline using agent
    const outline = await generateOutline(userId, context);

    // Save outline to database (use idea's suggestedFormat as fallback)
    const savedOutline = await createOutline(contentIdeaId, outline, idea.suggestedFormat);

    // Update idea status to 'used'
    await updateIdeaStatus(contentIdeaId, 'used');

    return NextResponse.json({
      outline: savedOutline,
    });
  } catch (error) {
    console.error('Error generating outline:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    // Handle structured output validation errors
    if (error instanceof Error) {
      // Check if it's a structured output validation error
      if (error.message.includes('Structured output validation failed')) {
        console.error('Structured output validation failed. This usually means the LLM did not generate output matching the schema.');
        console.error('Error details:', error);

        return NextResponse.json(
          {
            error: 'Failed to generate valid outline structure',
            details: error.message,
            hint: 'The AI generated an outline that does not match the required schema. Please try again.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate outline', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate outline' },
      { status: 500 }
    );
  }
}
