/**
 * Home Page - Ideas Dashboard
 */

import { redirect } from 'next/navigation';
import { IdeasDashboard } from '@/components/ideas-dashboard';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { getAllIdeas } from '@/lib/db/content-ideas';

export default async function Home() {
  const userId = await getCurrentUserId();

  // Redirect to auth if no user
  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();

  // Fetch all ideas from database
  const dbIdeas = await getAllIdeas(dataUserId);

  // Transform database ideas to match component interface
  // Only pass fields actually used by the client to minimize RSC serialization
  const ideas = dbIdeas.map(idea => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    rationale: idea.rationale,
    contentPillar: idea.contentPillar,
    suggestedFormat: idea.suggestedFormat,
    estimatedEngagement: idea.estimatedEngagement as 'low' | 'medium' | 'high',
    status: idea.status as 'suggested' | 'accepted' | 'rejected' | 'used',
    createdAt: idea.createdAt,
    outlines: idea.outlines?.map(outline => ({ id: outline.id })),
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <IdeasDashboard userId={userId} initialIdeas={ideas} />
    </main>
  );
}
