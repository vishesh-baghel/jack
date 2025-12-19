/**
 * Settings Page
 */

import { redirect } from 'next/navigation';
import { ToneConfigComponent } from '@/components/tone-config';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      <ToneConfigComponent userId={dataUserId} />
    </main>
  );
}
