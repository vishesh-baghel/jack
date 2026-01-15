/**
 * Settings Page
 */

import { redirect } from 'next/navigation';
import { ToneConfigComponent } from '@/components/tone-config';
import { VisitorModeToggle } from '@/components/visitor-mode-toggle';
import { getCurrentUserId, getDataUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { getOrCreateToneConfig } from '@/lib/db/tone-config';

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

  // Fetch tone config for the data user
  const toneConfig = await getOrCreateToneConfig(dataUserId);

  // Transform Prisma type to component type
  const configForComponent = {
    ...toneConfig,
    learnedPatterns: (toneConfig.learnedPatterns || {}) as {
      avgPostLength?: number;
      commonPhrases?: string[];
      showFailures?: boolean;
      includeNumbers?: boolean;
      successfulPillars?: string[];
      styleNotes?: string[];
      voiceCharacteristics?: string[];
      lastUpdated?: string;
    },
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            see how i&apos;ve configured my writing style and voice
          </p>
        </div>

        {/* Show visitor mode toggle only to owner */}
        {isOwner && <VisitorModeToggle isOwner={isOwner} />}

        {/* Tone config for everyone */}
        <ToneConfigComponent userId={dataUserId} initialConfig={configForComponent} />
      </div>
    </main>
  );
}
