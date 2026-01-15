/**
 * Posts List Component
 * Display user's posts with "mark as good" functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuestTooltipButton } from '@/components/guest-tooltip-button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DateRangeFilter } from '@/components/date-range-filter';
import { Pagination } from '@/components/pagination';
import { useDateRangeFilter } from '@/hooks/use-date-range-filter';
import { usePagination } from '@/hooks/use-pagination';
import { formatRelativeTime, getPillarColor, formatLabel } from '@/lib/utils';
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

interface Post {
  id: string;
  draftId: string;
  hasPost: boolean;
  content: string;
  contentType: string;
  contentPillar: string;
  isMarkedGood: boolean;
  markedGoodAt: Date | null;
  isPosted: boolean;
  postedAt: Date | null;
  createdAt: Date;
}

interface PostsListProps {
  userId: string;
  initialPosts?: Post[];
}

export function PostsList({ userId, initialPosts = [] }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<'all' | 'good' | 'posted'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
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

  const handleMarkAsGood = async (post: Post) => {
    setLoadingId(post.draftId);
    setError(null);
    
    try {
      // If no post record exists yet, create one first
      if (!post.hasPost) {
        const createResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            draftId: post.draftId,
            content: post.content,
            contentType: post.contentType,
            contentPillar: post.contentPillar,
          }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create post record');
        }

        const { post: newPost } = await createResponse.json();
        // Update local state with the new post ID
        setPosts(posts.map(p => 
          p.draftId === post.draftId 
            ? { ...p, id: newPost.id, hasPost: true } 
            : p
        ));
        post = { ...post, id: newPost.id, hasPost: true };
      }

      // Now mark as good
      const response = await fetch(`/api/posts/${post.id}/mark-good`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark post as good');
      }

      const { post: updatedPost } = await response.json();
      setPosts(posts.map(p => 
        p.draftId === post.draftId 
          ? { ...p, id: updatedPost.id, hasPost: true, isMarkedGood: true, markedGoodAt: new Date(updatedPost.markedGoodAt) } 
          : p
      ));
    } catch (err) {
      console.error('Error marking post:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingId(null);
    }
  };

  const openDeleteDialog = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    setLoadingAction(`delete-${postToDelete.draftId}`);
    setDeleteDialogOpen(false);
    setError(null);

    try {
      const response = await fetch(`/api/drafts/${postToDelete.draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete draft');
      }

      setPosts(posts.filter(p => p.draftId !== postToDelete.draftId));
      toast.success('draft deleted');
    } catch (err) {
      console.error('Error deleting draft:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingAction(null);
      setPostToDelete(null);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingId(post.draftId);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (post: Post) => {
    if (!editContent.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setLoadingAction(`edit-${post.draftId}`);
    setError(null);

    try {
      const response = await fetch(`/api/drafts/${post.draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update draft');
      }

      setPosts(posts.map(p => 
        p.draftId === post.draftId 
          ? { ...p, content: editContent } 
          : p
      ));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to update draft');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePostToX = async (post: Post) => {
    setLoadingAction(`post-${post.draftId}`);
    setError(null);

    try {
      const response = await fetch(`/api/drafts/${post.draftId}/post`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post to X');
      }

      const { draft } = await response.json();
      setPosts(posts.map(p => 
        p.draftId === post.draftId 
          ? { ...p, isPosted: true, postedAt: new Date(draft.postedAt) } 
          : p
      ));
    } catch (err) {
      console.error('Error posting to X:', err);
      setError(err instanceof Error ? err.message : 'Failed to post to X');
    } finally {
      setLoadingAction(null);
    }
  };

  // Filter by status and date range
  const filteredPosts = posts.filter(post => {
    // Status filter
    if (filter === 'good' && !post.isMarkedGood) return false;
    if (filter === 'posted' && !post.isPosted) return false;

    // Date range filter
    const postDate = new Date(post.createdAt);
    const startDate = getStartDate();
    const endDate = getEndDate();

    return postDate >= startDate && postDate <= endDate;
  });

  // Pagination - reset when filter or date range changes
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedPosts,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination({
    items: filteredPosts,
    itemsPerPage: 9,
    resetDependencies: [filter, dateRange, customStartDate, customEndDate],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">my drafts</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {isGuest
            ? "browse my content drafts - the raw ideas before they ship"
            : "your content vault. mark the bangers so jack learns your voice"
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 underline cursor-pointer"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            all ({posts.length})
          </button>
          <button
            onClick={() => setFilter('good')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filter === 'good'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            bangers ({posts.filter(p => p.isMarkedGood).length})
          </button>
          <button
            onClick={() => setFilter('posted')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap ${
              filter === 'posted'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            shipped ({posts.filter(p => p.isPosted).length})
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
          />
          <DateRangeFilter
            value={dateRange}
            onChange={handleDateRangeChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {paginatedPosts.map((post) => (
          <Card key={post.draftId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPillarColor(post.contentPillar)}>
                      {formatLabel(post.contentPillar)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatLabel(post.contentType)}
                    </span>
                    {post.isMarkedGood && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        banger
                      </Badge>
                    )}
                    {post.isPosted && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        shipped
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatRelativeTime(new Date(post.createdAt))}
                    {post.markedGoodAt && ` • marked good ${formatRelativeTime(new Date(post.markedGoodAt))}`}
                    {post.postedAt && ` • posted ${formatRelativeTime(new Date(post.postedAt))}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === post.draftId ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Edit your draft..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(post)}
                      disabled={loadingAction === `edit-${post.draftId}`}
                    >
                      {loadingAction === `edit-${post.draftId}` ? 'saving...' : 'save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-md">
                  {post.content}
                </div>
              )}
            </CardContent>
            {editingId !== post.draftId && (
              <CardFooter className="flex justify-between gap-2 pt-0 overflow-x-auto">
                <div className="flex gap-2 shrink-0">
                  <GuestTooltipButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(post)}
                    disabled={post.isPosted}
                    isGuest={isGuest}
                    className="text-muted-foreground hover:text-foreground whitespace-nowrap"
                  >
                    fix it
                  </GuestTooltipButton>
                  <GuestTooltipButton
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(post)}
                    disabled={loadingAction === `delete-${post.draftId}`}
                    isGuest={isGuest}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 whitespace-nowrap"
                  >
                    {loadingAction === `delete-${post.draftId}` ? 'yeeting...' : 'yeet'}
                  </GuestTooltipButton>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!post.isMarkedGood && (
                    <GuestTooltipButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsGood(post)}
                      disabled={loadingId === post.draftId}
                      isGuest={isGuest}
                      className="whitespace-nowrap"
                    >
                      {loadingId === post.draftId ? 'noting...' : 'this one hits'}
                    </GuestTooltipButton>
                  )}
                  {!post.isPosted && (
                    <GuestTooltipButton
                      size="sm"
                      variant="default"
                      onClick={() => handlePostToX(post)}
                      disabled={loadingAction === `post-${post.draftId}`}
                      isGuest={isGuest}
                      className="whitespace-nowrap"
                    >
                      {loadingAction === `post-${post.draftId}` ? 'shipping...' : 'ship it'}
                    </GuestTooltipButton>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            no {filter === 'good' ? 'bangers ' : filter === 'posted' ? 'shipped content ' : ''}yet
          </p>
          <p className="text-sm mt-2">
            {filter === 'good'
              ? 'be honest with yourself - which ones actually slap?'
              : filter === 'posted'
                ? 'the timeline is waiting. your audience is starving'
                : 'generate an outline and save something. we believe in you'
            }
          </p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              this will permanently delete your draft. this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
