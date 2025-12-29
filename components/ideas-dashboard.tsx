/**
 * Ideas Dashboard Component
 * Main view for content ideas
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuestTooltipButton } from '@/components/guest-tooltip-button';
import { DateRangeFilter } from '@/components/date-range-filter';
import { useDateRangeFilter } from '@/hooks/use-date-range-filter';
import { formatRelativeTime, getPillarColor, getEngagementColor } from '@/lib/utils';
import { getUserSession } from '@/lib/auth-client';

interface Outline {
  id: string;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  rationale: string;
  contentPillar: string;
  suggestedFormat: string;
  estimatedEngagement: 'low' | 'medium' | 'high';
  status: 'suggested' | 'accepted' | 'rejected' | 'used';
  createdAt: Date;
  outlines?: Outline[];
}

interface IdeasDashboardProps {
  userId: string;
  initialIdeas?: ContentIdea[];
}

export function IdeasDashboard({ userId, initialIdeas = [] }: IdeasDashboardProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<ContentIdea[]>(initialIdeas);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingOutlineId, setGeneratingOutlineId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'suggested' | 'accepted' | 'rejected' | 'used'>('suggested');
  const [isGuest, setIsGuest] = useState(false);
  
  const { 
    dateRange, 
    customStartDate, 
    customEndDate, 
    handleDateRangeChange,
    getStartDate,
    getEndDate 
  } = useDateRangeFilter();

  useEffect(() => {
    const session = getUserSession();
    setIsGuest(session.isGuest);
  }, []);

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trendingTopics: [], // TODO: Add trending topics input
        }),
      });

      if (!response.ok) throw new Error('Failed to generate ideas');

      const data = await response.json();
      
      // Add new ideas to local state
      setIdeas([...data.ideas, ...ideas]);
      
      // Refresh server data to ensure consistency
      router.refresh();
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (ideaId: string, status: ContentIdea['status']) => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update idea');

      // Update local state immediately for better UX
      setIdeas(ideas.map(idea => 
        idea.id === ideaId ? { ...idea, status } : idea
      ));
      
      // Refresh server data to ensure consistency
      router.refresh();
    } catch (error) {
      console.error('Error updating idea:', error);
    }
  };

  const handleGenerateOutline = async (idea: ContentIdea) => {
    setGeneratingOutlineId(idea.id);
    try {
      const response = await fetch('/api/outlines/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentIdeaId: idea.id,
          idea: {
            title: idea.title,
            description: idea.description,
            rationale: idea.rationale,
            contentPillar: idea.contentPillar,
            suggestedFormat: idea.suggestedFormat,
            estimatedEngagement: idea.estimatedEngagement,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate outline');

      const { outline } = await response.json();
      router.push(`/outline/${outline.id}`);
    } catch (error) {
      console.error('Error generating outline:', error);
    } finally {
      setGeneratingOutlineId(null);
    }
  };

  // Filter by status and date range
  const filteredIdeas = ideas.filter(idea => {
    if (idea.status !== selectedStatus) return false;
    
    const ideaDate = new Date(idea.createdAt);
    const startDate = getStartDate();
    const endDate = getEndDate();
    
    return ideaDate >= startDate && ideaDate <= endDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">content ideas</h1>
          <p className="text-muted-foreground">
            {isGuest 
              ? "see what ideas i'm working with before they hit the timeline"
              : "ai-generated bangers based on your voice. the algorithm will thank you"
            }
          </p>
        </div>
        <GuestTooltipButton
          onClick={handleGenerateIdeas}
          disabled={isGenerating}
          isGuest={isGuest}
        >
          {isGenerating ? 'cooking...' : 'cook up ideas'}
        </GuestTooltipButton>
      </div>

      {/* Status Tabs and Date Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {(['suggested', 'accepted', 'rejected', 'used'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                selectedStatus === status
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </div>

      {/* Ideas Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIdeas.map((idea) => (
          <Card key={idea.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{idea.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {idea.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="text-sm text-muted-foreground flex-1">
                <p className="font-medium">why this hits:</p>
                <p className="line-clamp-3">{idea.rationale}</p>
              </div>

              {/* Bottom section - tags, buttons, timestamp */}
              <div className="mt-auto">
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPillarColor(idea.contentPillar)}`}>
                    {idea.contentPillar.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
                    {idea.suggestedFormat}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getEngagementColor(idea.estimatedEngagement)}`}>
                    {idea.estimatedEngagement} engagement
                  </span>
                </div>

                <div className="flex gap-2 pt-4">
                {idea.status === 'suggested' && (
                  <>
                    <GuestTooltipButton
                      size="sm"
                      variant="default"
                      onClick={() => handleUpdateStatus(idea.id, 'accepted')}
                      className="flex-1"
                      isGuest={isGuest}
                    >
                      this hits
                    </GuestTooltipButton>
                    <GuestTooltipButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(idea.id, 'rejected')}
                      className="flex-1"
                      isGuest={isGuest}
                    >
                      mid
                    </GuestTooltipButton>
                  </>
                )}
                {idea.status === 'accepted' && (
                  <>
                    <GuestTooltipButton
                      size="sm"
                      variant="default"
                      className="w-full"
                      onClick={() => handleGenerateOutline(idea)}
                      isGuest={isGuest}
                      disabled={generatingOutlineId === idea.id}
                    >
                      {generatingOutlineId === idea.id ? 'generating outline...' : 'make it make sense'}
                    </GuestTooltipButton>
                    {idea.outlines && idea.outlines.length > 0 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        outline already exists - check the &quot;used&quot; tab
                      </p>
                    )}
                  </>
                )}
                {idea.status === 'used' && idea.outlines && idea.outlines.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/outline/${idea.outlines![0].id}`)}
                  >
                    view outline
                  </Button>
                )}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  {formatRelativeTime(new Date(idea.createdAt))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>no {selectedStatus} ideas yet</p>
          {selectedStatus === 'suggested' && (
            <p className="text-sm mt-2">hit that &quot;cook up ideas&quot; button and let&apos;s get this bread</p>
          )}
          {selectedStatus === 'accepted' && (
            <p className="text-sm mt-2">nothing accepted. your standards are either too high or you haven&apos;t looked yet</p>
          )}
          {selectedStatus === 'rejected' && (
            <p className="text-sm mt-2">empty rejection pile. either you love everything or you&apos;re not being picky enough</p>
          )}
          {selectedStatus === 'used' && (
            <p className="text-sm mt-2">no used ideas. time to stop hoarding and start shipping</p>
          )}
        </div>
      )}
    </div>
  );
}
