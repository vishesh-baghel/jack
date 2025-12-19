/**
 * API Routes: Creators
 * GET /api/creators?userId=xxx
 * POST /api/creators
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getActiveCreators, addCreator } from '@/lib/db/creators';
import { blockGuestWrite } from '@/lib/auth';

const CreateRequestSchema = z.object({
  userId: z.string(),
  xHandle: z.string().regex(/^@?[\w]+$/, 'Invalid X handle'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const creators = await getActiveCreators(userId);

    return NextResponse.json({
      creators,
      count: creators.length,
    });
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, xHandle } = CreateRequestSchema.parse(body);

    // Ensure handle starts with @
    const normalizedHandle = xHandle.startsWith('@') ? xHandle : `@${xHandle}`;

    const creator = await addCreator(userId, normalizedHandle);

    return NextResponse.json({
      creator,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding creator:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add creator' },
      { status: 500 }
    );
  }
}
