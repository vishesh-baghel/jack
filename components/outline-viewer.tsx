/**
 * Outline Viewer Component
 * Displays generated outline for content creation
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GuestTooltipButton } from '@/components/guest-tooltip-button';
import { getUserSession } from '@/lib/auth-client';

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

interface OutlineViewerProps {
  outline: ContentOutline;
  ideaTitle: string;
  contentPillar: string;
  onSaveDraft?: (content: string) => void;
}

export function OutlineViewer({
  outline,
  ideaTitle,
  contentPillar,
  onSaveDraft,
}: OutlineViewerProps) {
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    setIsGuest(session.isGuest);
  }, []);

  const handleSave = async () => {
    if (!onSaveDraft) return;
    setIsSaving(true);
    try {
      await onSaveDraft(draftContent);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{ideaTitle}</h1>
          <Badge className="w-fit">{contentPillar}</Badge>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          format: {outline.format} • estimated length: {outline.estimatedLength} chars
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 flex-1 min-h-0">
        {/* Outline Panel - Scrollable */}
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-xl font-semibold sticky top-0 bg-background py-2 z-10">outline</h2>

          {/* Tone Reminders */}
          {outline.toneReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">tone reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {outline.toneReminders.map((reminder, i) => (
                    <li key={i}>• {reminder}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {outline.sections.map((section, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">{section.heading}</CardTitle>
                {section.toneGuidance && (
                  <CardDescription className="italic">
                    {section.toneGuidance}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">key points:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {section.keyPoints.map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
                {section.examples && section.examples.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">examples:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {section.examples.map((example, i) => (
                        <li key={i} className="italic">
                          &quot;{example}&quot;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Writing Panel */}
        <div className="flex flex-col gap-4 overflow-hidden mt-6 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold">write your content</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {draftContent.length} / {outline.estimatedLength} chars
            </span>
          </div>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
              <Textarea
                placeholder="start writing in your authentic voice..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="flex-1 min-h-[300px] font-mono text-sm resize-none custom-scrollbar"
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <GuestTooltipButton
              onClick={handleSave}
              disabled={!draftContent.trim() || isSaving}
              isGuest={isGuest}
              className="flex-1"
            >
              {isSaving ? 'saving...' : 'save draft'}
            </GuestTooltipButton>
            <Button
              variant="outline"
              onClick={() => setDraftContent('')}
              disabled={!draftContent}
            >
              clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
