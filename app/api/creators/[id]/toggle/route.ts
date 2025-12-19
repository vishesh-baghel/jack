/**
 * API Route: Toggle Creator Status
 * PATCH /api/creators/[id]/toggle
 */

import { NextRequest, NextResponse } from 'next/server';
import { toggleCreatorStatus } from '@/lib/db/creators';
import { blockGuestWrite } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const { id } = await params;

    const creator = await toggleCreatorStatus(id);

    return NextResponse.json({
      creator,
    });
  } catch (error) {
    console.error('Error toggling creator:', error);
    
    if (error instanceof Error && error.message === 'Creator not found') {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle creator' },
      { status: 500 }
    );
  }
}
