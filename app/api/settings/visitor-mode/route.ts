/**
 * Visitor Mode Settings API Route
 * GET /api/settings/visitor-mode - Get current visitor mode status
 * PATCH /api/settings/visitor-mode - Toggle visitor mode on/off
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId, blockGuestWrite } from '@/lib/auth';
import { toggleVisitorMode, isVisitorModeEnabled } from '@/lib/db/users';
import { prisma } from '@/lib/db/client';

const ToggleRequestSchema = z.object({
  enabled: z.boolean(),
});

/**
 * GET - Check if visitor mode is enabled
 */
export async function GET() {
  try {
    const enabled = await isVisitorModeEnabled();

    return NextResponse.json({
      enabled,
    });
  } catch (error) {
    console.error('Error fetching visitor mode status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor mode status' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Toggle visitor mode (owner only)
 */
export async function PATCH(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is the owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOwner: true },
    });

    if (!user?.isOwner) {
      return NextResponse.json(
        { error: 'Only the owner can toggle visitor mode' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled } = ToggleRequestSchema.parse(body);

    await toggleVisitorMode(userId, enabled);

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? 'Visitor mode enabled. Guest account created.'
        : 'Visitor mode disabled. Guest account deleted.',
    });
  } catch (error) {
    console.error('Error toggling visitor mode:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle visitor mode' },
      { status: 500 }
    );
  }
}
