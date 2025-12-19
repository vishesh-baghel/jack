/**
 * API Routes: Tone Config
 * GET /api/tone-config?userId=xxx
 * PATCH /api/tone-config
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateToneConfig, updateTonePreferences } from '@/lib/db/tone-config';
import { blockGuestWrite } from '@/lib/auth';

const UpdateRequestSchema = z.object({
  userId: z.string(),
  preferences: z.object({
    lowercase: z.boolean().optional(),
    noEmojis: z.boolean().optional(),
    noHashtags: z.boolean().optional(),
    showFailures: z.boolean().optional(),
    includeNumbers: z.boolean().optional(),
  }),
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

    const config = await getOrCreateToneConfig(userId);

    return NextResponse.json({
      config,
    });
  } catch (error) {
    console.error('Error fetching tone config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tone config' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, preferences } = UpdateRequestSchema.parse(body);

    const config = await updateTonePreferences(userId, preferences);

    return NextResponse.json({
      config,
    });
  } catch (error) {
    console.error('Error updating tone config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update tone config' },
      { status: 500 }
    );
  }
}
