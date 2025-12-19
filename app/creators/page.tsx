/**
 * Creators Page
 */

import { redirect } from 'next/navigation';
import { CreatorsManager } from '@/components/creators-manager';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { getActiveCreators } from '@/lib/db/creators';

export default async function CreatorsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();
  const creators = await getActiveCreators(dataUserId);

  return (
    <main className="container mx-auto px-4 py-8">
      <CreatorsManager userId={userId} initialCreators={creators} />
    </main>
  );
}
