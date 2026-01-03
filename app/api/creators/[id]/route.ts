/**
 * API Routes: Creator by ID
 * PATCH /api/creators/[id] - Update creator configuration
 * DELETE /api/creators/[id] - Delete creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { blockGuestWrite } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

const updateCreatorSchema = z.object({
  tweetCount: z.number().int().min(1).max(100).optional(),
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
    const validatedData = updateCreatorSchema.parse(body);

    // Update creator
    const creator = await prisma.creator.update({
      where: { id },
      data: validatedData,
    });

    console.log(`[CREATOR] Updated creator ${id} with:`, validatedData);

    return NextResponse.json({ creator });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[CREATOR] Error updating creator:', error);
    return NextResponse.json(
      { error: 'Failed to update creator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const { id } = await context.params;

    // Delete the creator (cascade will handle related tweets)
    await prisma.creator.delete({
      where: { id },
    });

    console.log(`[CREATOR] Deleted creator ${id}`);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[CREATOR] Error deleting creator:', error);
    return NextResponse.json(
      { error: 'Failed to delete creator' },
      { status: 500 }
    );
  }
}
