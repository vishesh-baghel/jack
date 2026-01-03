/**
 * Visitor Mode Toggle Component
 * Allows owner to enable/disable guest access
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VisitorModeToggleProps {
  isOwner: boolean;
}

export function VisitorModeToggle({ isOwner }: VisitorModeToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/settings/visitor-mode');
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error fetching visitor mode status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOwner) {
      fetchStatus();
    } else {
      setIsLoading(false);
    }
  }, [isOwner]);

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/visitor-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        setEnabled(!enabled);
        toast.success(`visitor mode ${!enabled ? 'enabled' : 'disabled'}`);
      } else {
        const error = await response.json();
        console.error('Failed to toggle visitor mode:', error);
        toast.error(error.error || 'failed to toggle visitor mode');
      }
    } catch (error) {
      console.error('Error toggling visitor mode:', error);
      toast.error('something went wrong. please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show anything if not owner
  if (!isOwner) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">loading visitor mode settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">visitor mode</CardTitle>
          {enabled && (
            <Badge variant="secondary" className="text-xs">
              active
            </Badge>
          )}
        </div>
        <CardDescription>
          let others explore your jack in read-only mode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="visitor-mode" className="text-base cursor-pointer">
              {enabled ? 'visitor mode is on' : 'visitor mode is off'}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {enabled
                ? 'visitors can browse your content without making changes'
                : 'enable to allow read-only guest access to your jack'}
            </p>
          </div>
          <button
            id="visitor-mode"
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? 'bg-primary' : 'bg-muted'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
