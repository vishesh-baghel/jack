/**
 * Outline Page Client Component
 * Handles client-side interactions like saving drafts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OutlineViewer } from '@/components/outline-viewer';

interface OutlineSection {
  heading: string;
  keyPoints: string[];
  toneGuidance?: string;
  examples?: string[];
}

interface ContentOutline {
  format: string;
  sections: OutlineSection[];
  estimatedLength: number;
  toneReminders: string[];
}

interface OutlinePageClientProps {
  outlineId: string;
  outline: ContentOutline;
  ideaTitle: string;
  contentPillar: string;
}

export function OutlinePageClient({
  outlineId,
  outline,
  ideaTitle,
  contentPillar,
}: OutlinePageClientProps) {
  const router = useRouter();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveDraft = async (content: string) => {
    setSaveError(null);
    
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlineId,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save draft');
      }

      const data = await response.json();
      
      // Show success message (you could add a toast notification here)
      console.log('Draft saved successfully:', data.draft.id);
      
      // Redirect to posts page to see the saved draft
      router.push('/posts');
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save draft');
      throw error; // Re-throw so the component can handle the loading state
    }
  };

  return (
    <div>
      {saveError && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {saveError}
        </div>
      )}
      <OutlineViewer
        outline={outline}
        ideaTitle={ideaTitle}
        contentPillar={contentPillar}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
