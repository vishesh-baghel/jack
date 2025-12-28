/**
 * Settings Page
 */

import { redirect } from 'next/navigation';
import { ToneConfigComponent } from '@/components/tone-config';
import { VisitorModeToggle } from '@/components/visitor-mode-toggle';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/client';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Use demo user's data for guests, own data for regular users
  const dataUserId = await getDataUserId();

  // Check if current user is the owner
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOwner: true },
  });

  const isOwner = user?.isOwner ?? false;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Show visitor mode toggle only to owner */}
        {isOwner && <VisitorModeToggle isOwner={isOwner} />}

        {/* Tone config for everyone */}
        <ToneConfigComponent userId={dataUserId} />
      </div>
    </main>
  );
}
