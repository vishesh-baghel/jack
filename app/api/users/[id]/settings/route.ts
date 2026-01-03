/**
 * API Routes: User Settings
 * PATCH /api/users/[id]/settings - Update user settings (daily tweet limit, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { blockGuestWrite } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

const updateUserSettingsSchema = z.object({
  dailyTweetLimit: z.number().int().min(1).max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateUserSettingsSchema.parse(body);

    // Update user settings
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        dailyTweetLimit: true,
      },
    });

    console.log(`[USER] Updated user ${id} settings:`, validatedData);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[USER] Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}
