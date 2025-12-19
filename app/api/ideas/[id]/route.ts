/**
 * API Route: Update Idea Status
 * PATCH /api/ideas/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateIdeaStatus } from '@/lib/db/content-ideas';
import { blockGuestWrite } from '@/lib/auth';

const RequestSchema = z.object({
  status: z.enum(['suggested', 'accepted', 'rejected', 'used']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { status } = RequestSchema.parse(body);
    const { id } = await params;

    const updatedIdea = await updateIdeaStatus(id, status);

    return NextResponse.json({
      idea: updatedIdea,
    });
  } catch (error) {
    console.error('Error updating idea:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}
