/**
 * Post Draft to X API Route
 * POST /api/drafts/[id]/post - Mark draft as posted to X
 */

import { NextRequest, NextResponse } from 'next/server';
import { markDraftAsPosted, getDraftById } from '@/lib/db/drafts';
import { blockGuestWrite } from '@/lib/auth';

export async function POST(
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
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    // Check if draft exists
    const existing = await getDraftById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (existing.isPosted) {
      return NextResponse.json(
        { error: 'Draft has already been posted' },
        { status: 400 }
      );
    }

    // TODO: In the future, this will actually post to X via their API
    // For now, just mark as posted
    const draft = await markDraftAsPosted(id);

    return NextResponse.json({ 
      success: true,
      draft,
      message: 'Draft marked as posted (X integration coming soon)'
    });
  } catch (error) {
    console.error('Error posting draft:', error);
    return NextResponse.json(
      { error: 'Failed to post draft' },
      { status: 500 }
    );
  }
}
