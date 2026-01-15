/**
 * Creators Manager Component
 * Manage tracked creators for inspiration
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestTooltipButton } from '@/components/guest-tooltip-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { getUserSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Creator {
  id: string;
  xHandle: string;
  isActive: boolean;
  tweetCount: number;
  createdAt: Date;
}

interface CreatorsManagerProps {
  userId: string;
  initialCreators?: Creator[];
  initialDailyLimit?: number;
}

export function CreatorsManager({ userId, initialCreators = [], initialDailyLimit = 50 }: CreatorsManagerProps) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [newHandle, setNewHandle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creatorToDelete, setCreatorToDelete] = useState<Creator | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [pendingDailyLimit, setPendingDailyLimit] = useState(initialDailyLimit);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
  const [updatingCreatorId, setUpdatingCreatorId] = useState<string | null>(null);
  const [pendingCreatorCounts, setPendingCreatorCounts] = useState<Record<string, number>>({});

  // Computed values
  const totalRequestedTweets = useMemo(() => {
    return creators
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.tweetCount, 0);
  }, [creators]);

  const isScalingActive = totalRequestedTweets > dailyLimit;

  const scalingFactor = useMemo(() => {
    if (!isScalingActive) return 1;
    return dailyLimit / totalRequestedTweets;
  }, [isScalingActive, dailyLimit, totalRequestedTweets]);

  useEffect(() => {
    const session = getUserSession();
    setIsGuest(session.isGuest);
  }, []);

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          xHandle: newHandle.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'failed to add creator');
        throw new Error('Failed to add creator');
      }

      const { creator } = await response.json();

      // Check if creator already exists (reactivation case)
      const existingIndex = creators.findIndex(c => c.id === creator.id);
      if (existingIndex >= 0) {
        // Update existing creator
        setCreators(creators.map(c => c.id === creator.id ? creator : c));
      } else {
        // Add new creator
        setCreators([creator, ...creators]);
      }
      setNewHandle('');
    } catch (error) {
      console.error('Error adding creator:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleCreator = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/creators/${creatorId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to toggle creator');

      const { creator } = await response.json();
      setCreators(creators.map(c => c.id === creatorId ? creator : c));
    } catch (error) {
      console.error('Error toggling creator:', error);
    }
  };

  const openDeleteDialog = (creator: Creator) => {
    setCreatorToDelete(creator);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCreator = async () => {
    if (!creatorToDelete) return;

    setDeletingId(creatorToDelete.id);
    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/creators/${creatorToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete creator');

      setCreators(creators.filter(c => c.id !== creatorToDelete.id));
      toast.success(`${creatorToDelete.xHandle} removed from watchlist`);
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast.error('failed to delete creator. try again.');
    } finally {
      setDeletingId(null);
      setCreatorToDelete(null);
    }
  };

  const handleSaveDailyLimit = async () => {
    setIsUpdatingLimit(true);
    try {
      const response = await fetch(`/api/users/${userId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTweetLimit: pendingDailyLimit }),
      });

      if (!response.ok) throw new Error('Failed to update limit');

      setDailyLimit(pendingDailyLimit);
      toast.success('daily limit updated');
    } catch (error) {
      console.error('Error updating daily limit:', error);
      toast.error('failed to update limit');
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  const handleSaveCreatorTweetCount = async (creatorId: string) => {
    const newCount = pendingCreatorCounts[creatorId];
    if (newCount === undefined) return;

    setUpdatingCreatorId(creatorId);
    try {
      const response = await fetch(`/api/creators/${creatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetCount: newCount }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const { creator } = await response.json();
      setCreators(creators.map(c => c.id === creatorId ? { ...c, tweetCount: creator.tweetCount } : c));

      // Clear pending change
      const newPending = { ...pendingCreatorCounts };
      delete newPending[creatorId];
      setPendingCreatorCounts(newPending);

      toast.success('tweet count updated');
    } catch (error) {
      console.error('Error updating tweet count:', error);
      toast.error('failed to update tweet count');
    } finally {
      setUpdatingCreatorId(null);
    }
  };

  const handleCreatorCountChange = (creatorId: string, newCount: number) => {
    setPendingCreatorCounts({
      ...pendingCreatorCounts,
      [creatorId]: newCount,
    });
  };

  const activeCreators = creators.filter(c => c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">tracked creators</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {isGuest
            ? "see who inspires my content - the creators i learn from"
            : "stalk the greats (ethically). jack learns from their energy"
          }
        </p>
      </div>

      {/* Add Creator Form */}
      <Card>
        <CardHeader>
          <CardTitle>add to the watchlist</CardTitle>
          <CardDescription>
            drop an X handle. jack will study their posting patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCreator} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="handle" className="sr-only">X Handle</Label>
              <Input
                id="handle"
                placeholder="@username"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                disabled={isAdding || isGuest}
              />
            </div>
            <GuestTooltipButton
              type="submit"
              disabled={!newHandle.trim() || isAdding}
              isGuest={isGuest}
            >
              {isAdding ? 'stalking...' : 'track'}
            </GuestTooltipButton>
          </form>
        </CardContent>
      </Card>

      {/* Daily Tweet Budget */}
      <Card>
        <CardHeader>
          <CardTitle>daily tweet budget</CardTitle>
          <CardDescription>
            maximum tweets to scrape per day across all creators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1 max-w-full sm:max-w-xs">
              <Label htmlFor="dailyLimit">tweets per day</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="1"
                max="1000"
                value={pendingDailyLimit}
                onChange={(e) => setPendingDailyLimit(Number(e.target.value))}
                disabled={isUpdatingLimit || isGuest}
              />
            </div>
            <GuestTooltipButton
              onClick={handleSaveDailyLimit}
              disabled={pendingDailyLimit === dailyLimit || isUpdatingLimit || isGuest}
              isGuest={isGuest}
              className="w-full sm:w-auto"
            >
              {isUpdatingLimit ? 'saving...' : 'save'}
            </GuestTooltipButton>
          </div>

          {/* Live Calculation Display */}
          <div className="p-4 bg-muted/50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">total requested:</span>
              <span className="text-lg font-semibold">
                {totalRequestedTweets}/{dailyLimit}
              </span>
            </div>

            {isScalingActive && (
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  proportional scaling active ({Math.round(scalingFactor * 100)}% per creator)
                </span>
              </div>
            )}

            {!isScalingActive && totalRequestedTweets > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="h-4 w-4" />
                <span>within budget - no scaling needed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>actively stalking</CardDescription>
            <CardTitle className="text-4xl">{activeCreators.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>on the watchlist</CardDescription>
            <CardTitle className="text-4xl">{creators.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Creators List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">the watchlist</h2>
        {creators.map((creator) => {
          const currentCount = pendingCreatorCounts[creator.id] ?? creator.tweetCount;
          const actualCount = isScalingActive
            ? Math.max(1, Math.floor(creator.tweetCount * scalingFactor))
            : creator.tweetCount;
          const hasUnsavedChanges = pendingCreatorCounts[creator.id] !== undefined;

          return (
            <Card key={creator.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Top/Left: Status dot and handle */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${creator.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{creator.xHandle}</p>
                      <p className="text-xs text-muted-foreground">
                        added {formatRelativeTime(new Date(creator.createdAt))}
                      </p>
                    </div>
                  </div>

                  {/* Bottom/Right: Tweet count input, scaling message, and action buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {creator.isActive && (
                      <>
                        {isScalingActive && actualCount !== creator.tweetCount && (
                          <span className="text-xs text-amber-500 whitespace-nowrap self-start sm:self-center">
                            (scaled to {actualCount})
                          </span>
                        )}
                        <div className="flex items-center gap-1 w-full sm:w-auto">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={currentCount}
                            onChange={(e) =>
                              handleCreatorCountChange(creator.id, Number(e.target.value))
                            }
                            disabled={updatingCreatorId === creator.id || isGuest}
                            className="w-20 h-8 text-sm flex-1 sm:flex-none"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">tweets</span>
                          {hasUnsavedChanges && (
                            <GuestTooltipButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveCreatorTweetCount(creator.id)}
                              disabled={updatingCreatorId === creator.id}
                              isGuest={isGuest}
                            >
                              {updatingCreatorId === creator.id ? 'saving...' : 'save'}
                            </GuestTooltipButton>
                          )}
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <GuestTooltipButton
                        size="sm"
                        variant={creator.isActive ? 'outline' : 'default'}
                        onClick={() => handleToggleCreator(creator.id)}
                        isGuest={isGuest}
                        disabled={deletingId === creator.id}
                        className="flex-1 sm:flex-none"
                      >
                        {creator.isActive ? 'chill' : 'resume stalking'}
                      </GuestTooltipButton>
                      <GuestTooltipButton
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(creator)}
                        isGuest={isGuest}
                        disabled={deletingId === creator.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                      >
                        {deletingId === creator.id ? 'yeeting...' : 'yeet'}
                      </GuestTooltipButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {creators.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>watchlist is empty</p>
          <p className="text-sm mt-2">add some creators to study. learn from the best, become the best</p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>permanently remove creator?</AlertDialogTitle>
            <AlertDialogDescription>
              you&apos;re about to remove {creatorToDelete?.xHandle} from your watchlist.
              this will delete all scraped tweets and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCreator}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              yeet it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
