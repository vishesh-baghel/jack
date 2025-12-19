/**
 * API Route: Mark Post as Good
 * PATCH /api/posts/[id]/mark-good
 */

import { NextRequest, NextResponse } from 'next/server';
import { markPostAsGood } from '@/lib/db/posts';
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

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const updatedPost = await markPostAsGood(id);

    return NextResponse.json({
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error marking post as good:', error);
    
    // Check for record not found error (P2025)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json(
        { error: 'Post not found. It may have been deleted or the ID is invalid.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to mark post as good' },
      { status: 500 }
    );
  }
}
