/**
 * Posts Page - Shows Drafts
 */

import { redirect } from 'next/navigation';
import { PostsList } from '@/components/posts-list';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { getDraftsForUser } from '@/lib/db/drafts';

export default async function PostsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();

  // Fetch all drafts for the user
  const drafts = await getDraftsForUser(dataUserId);

  // Transform drafts to match the PostsList interface
  // Use post.id if exists, otherwise use draft.id with a prefix to identify it needs post creation
  const posts = drafts.map(draft => ({
    id: draft.post?.id || draft.id,
    draftId: draft.id,
    hasPost: !!draft.post,
    content: draft.content,
    contentType: draft.outline.format,
    contentPillar: draft.outline.contentIdea.contentPillar,
    isMarkedGood: draft.post?.isMarkedGood || false,
    markedGoodAt: draft.post?.markedGoodAt || null,
    isPosted: draft.isPosted,
    postedAt: draft.postedAt,
    createdAt: draft.createdAt,
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <PostsList userId={userId} initialPosts={posts} />
    </main>
  );
}
