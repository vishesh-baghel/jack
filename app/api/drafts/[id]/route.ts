/**
 * Draft API Route
 * PATCH /api/drafts/[id] - Update draft content
 * DELETE /api/drafts/[id] - Delete a draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateDraft, deleteDraft, getDraftById } from '@/lib/db/drafts';
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
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
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

    const draft = await updateDraft(id, content);

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await deleteDraft(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
