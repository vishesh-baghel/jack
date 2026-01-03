/**
 * Creators Page
 */

import { redirect } from 'next/navigation';
import { CreatorsManager } from '@/components/creators-manager';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { getAllCreators } from '@/lib/db/creators';
import { prisma } from '@/lib/db/client';

export default async function CreatorsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();
  const creators = await getAllCreators(dataUserId);

  // Fetch user's daily tweet limit
  const user = await prisma.user.findUnique({
    where: { id: dataUserId },
    select: { dailyTweetLimit: true },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <CreatorsManager
        userId={userId}
        initialCreators={creators}
        initialDailyLimit={user?.dailyTweetLimit || 50}
      />
    </main>
  );
}
