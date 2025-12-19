/**
 * API Route: Get Ideas
 * GET /api/ideas?userId=xxx&status=suggested
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIdeasByStatus } from '@/lib/db/content-ideas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as 'suggested' | 'accepted' | 'rejected' | 'used' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!status || !['suggested', 'accepted', 'rejected', 'used'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: suggested, accepted, rejected, or used' },
        { status: 400 }
      );
    }

    const ideas = await getIdeasByStatus(userId, status);

    return NextResponse.json({
      ideas,
      count: ideas.length,
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}
