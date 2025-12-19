/**
 * API Route: Posts
 * GET /api/posts?userId=xxx
 * POST /api/posts - Create a new post from a draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserPosts, createPost } from '@/lib/db/posts';
import { blockGuestWrite } from '@/lib/auth';

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

    const posts = await getUserPosts(userId);

    return NextResponse.json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Block guest write operations
  const guestBlock = await blockGuestWrite();
  if (guestBlock) return guestBlock;

  try {
    const body = await request.json();
    const { userId, draftId, content, contentType, contentPillar } = body;

    if (!userId || !draftId || !content || !contentType || !contentPillar) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, draftId, content, contentType, contentPillar' },
        { status: 400 }
      );
    }

    const post = await createPost(userId, draftId, content, contentType, contentPillar);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Check for unique constraint violation (post already exists for this draft)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A post already exists for this draft' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
