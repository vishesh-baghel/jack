/**
 * Outline Page
 * View and write content from outline
 */

import { OutlinePageClient } from '@/app/outline/[id]/page-client';
import { getOutlineById } from '@/lib/db/outlines';
import { notFound } from 'next/navigation';

export default async function OutlinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch outline from database
  const outlineData = await getOutlineById(id);
  
  if (!outlineData || !outlineData.contentIdea) {
    notFound();
  }

  // Parse sections from JSON
  const outline = {
    format: outlineData.format,
    estimatedLength: parseInt(outlineData.estimatedLength, 10),
    sections: outlineData.sections as Array<{
      heading: string;
      keyPoints: string[];
      toneGuidance?: string;
      examples?: string[];
    }>,
    toneReminders: Array.isArray(outlineData.toneReminders) 
      ? outlineData.toneReminders as string[]
      : [],
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <OutlinePageClient
        outlineId={id}
        outline={outline}
        ideaTitle={outlineData.contentIdea.title}
        contentPillar={outlineData.contentIdea.contentPillar}
      />
    </main>
  );
}
