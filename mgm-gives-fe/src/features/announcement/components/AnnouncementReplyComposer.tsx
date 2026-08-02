import { Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import { Button } from '@/shared/components/ui/Button';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { useCreateReplyMutation } from '../hooks/useAnnouncementEngagement';

import type { AnnouncementReplyResponse } from '../types';

interface AnnouncementReplyComposerProps {
  campaignId: number;
  announcementId: number;
  replyTarget?: AnnouncementReplyResponse | null;
  onClearReplyTarget?: () => void;
  onSuccess?: (reply: AnnouncementReplyResponse) => void;
}

export function AnnouncementReplyComposer({
  campaignId,
  announcementId,
  replyTarget,
  onClearReplyTarget,
  onSuccess,
}: AnnouncementReplyComposerProps) {
  const { data: user } = useAuthUser();
  const [content, setContent] = useState('');
  const createReplyMutation = useCreateReplyMutation(campaignId, announcementId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTarget) textareaRef.current?.focus();
  }, [replyTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > 1000) {
      toast.error('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      const newReply = await createReplyMutation.mutateAsync({
        content: trimmed,
        inReplyToReplyId: replyTarget?.id,
      });
      setContent('');
      onClearReplyTarget?.();
      toast.success('Comment posted.');
      onSuccess?.(newReply);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to post comment.');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const isPending = createReplyMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <UserAvatar name={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" className="mt-2.5" />

      <div className="flex-1">
        {replyTarget && (
          <div className="mb-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>
                Replying to{' '}
                <span className="font-medium text-foreground">
                  {replyTarget.createdBy?.name || 'Deleted user'}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearReplyTarget}
                disabled={isPending}
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                title="Cancel reply context"
                aria-label="Cancel reply context"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-1 line-clamp-2 break-words text-foreground/75">
              {replyTarget.content}
            </p>
          </div>
        )}

        {/* Input container */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder={replyTarget ? 'Write a reply...' : 'Write a comment...'}
            value={content}
            onChange={handleInput}
            disabled={isPending}
            maxLength={1000}
            rows={1}
            className="block w-full resize-none overflow-hidden rounded-2xl border border-border bg-muted/30 px-4 py-2.5 pr-12 text-sm leading-relaxed transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
          />

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {content.length > 800 && (
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                {1000 - content.length}
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isPending}
              className="h-7 w-7 rounded-full bg-transparent p-0 text-primary shadow-none transition-colors hover:bg-transparent hover:text-primary/80 disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
