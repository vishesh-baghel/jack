/**
 * Creators Manager Component
 * Manage tracked creators for inspiration
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestTooltipButton } from '@/components/guest-tooltip-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRelativeTime } from '@/lib/utils';
import { getUserSession } from '@/lib/auth-client';

interface Creator {
  id: string;
  xHandle: string;
  isActive: boolean;
  createdAt: Date;
}

interface CreatorsManagerProps {
  userId: string;
  initialCreators?: Creator[];
}

export function CreatorsManager({ userId, initialCreators = [] }: CreatorsManagerProps) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [newHandle, setNewHandle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

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

      if (!response.ok) throw new Error('Failed to add creator');

      const { creator } = await response.json();
      setCreators([creator, ...creators]);
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

  const activeCreators = creators.filter(c => c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">tracked creators</h1>
        <p className="text-muted-foreground">
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
        {creators.map((creator) => (
          <Card key={creator.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${creator.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <div>
                  <p className="font-medium">{creator.xHandle}</p>
                  <p className="text-xs text-muted-foreground">
                    added {formatRelativeTime(new Date(creator.createdAt))}
                  </p>
                </div>
              </div>
              <GuestTooltipButton
                size="sm"
                variant={creator.isActive ? 'outline' : 'default'}
                onClick={() => handleToggleCreator(creator.id)}
                isGuest={isGuest}
              >
                {creator.isActive ? 'chill' : 'resume stalking'}
              </GuestTooltipButton>
            </CardContent>
          </Card>
        ))}
      </div>

      {creators.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>watchlist is empty</p>
          <p className="text-sm mt-2">add some creators to study. learn from the best, become the best</p>
        </div>
      )}
    </div>
  );
}
