import { formatDistanceToNow } from 'date-fns';
import { Check, Loader2, MoreHorizontal, Pencil, Reply, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { cn } from '@/shared/utils/cn';
import { parseUTCDate } from '@/shared/utils/format';
import { useDeleteReplyMutation, useUpdateReplyMutation } from '../hooks/useAnnouncementEngagement';
import type { AnnouncementReplyResponse } from '../types';

interface AnnouncementReplyItemProps {
  campaignId: number;
  announcementId: number;
  reply: AnnouncementReplyResponse;
  currentUser: { id: number; role?: string } | null | undefined;
  canManageCampaign: boolean;
  isHighlighted?: boolean;
  onReply?: (reply: AnnouncementReplyResponse) => void;
  onNavigateToReply?: (replyId: number) => void;
  onUpdated?: (reply: AnnouncementReplyResponse) => void;
  onDeleted?: (replyId: number) => void;
}

export function AnnouncementReplyItem({
  campaignId,
  announcementId,
  reply,
  currentUser,
  canManageCampaign,
  isHighlighted = false,
  onReply,
  onNavigateToReply,
  onUpdated,
  onDeleted,
}: AnnouncementReplyItemProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateMutation = useUpdateReplyMutation(campaignId, announcementId);
  const deleteMutation = useDeleteReplyMutation(campaignId, announcementId);

  const isAuthor = reply.createdBy?.id === currentUser?.id;
  const canDelete = isAuthor || canManageCampaign || currentUser?.role === 'ADMIN';

  const handleEditSubmit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    if (trimmed === reply.content) {
      setIsEditing(false);
      return;
    }

    try {
      const updatedReply = await updateMutation.mutateAsync({
        replyId: reply.id,
        payload: { content: trimmed },
      });
      setIsEditing(false);
      onUpdated?.(updatedReply);
      toast.success('Comment updated.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update comment.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(reply.id);
      setIsDeleteDialogOpen(false);
      onDeleted?.(reply.id);
      toast.success('Comment deleted.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to delete comment.');
    }
  };

  return (
    <div
      id={`reply-${reply.id}`}
      className={cn(
        'group relative flex gap-3 py-3 text-sm transition-colors duration-1000',
        isHighlighted && 'bg-primary/5 rounded-xl px-3 -mx-3',
      )}
    >
      {/* Avatar */}
      <UserAvatar name={reply.createdBy?.name} avatarUrl={reply.createdBy?.avatarUrl} size="sm" />

      {/* Content Area */}
      <div className="flex-grow min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-foreground">
            {reply.createdBy?.name || 'Deleted user'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(parseUTCDate(reply.createdAt), { addSuffix: true })}
          </span>
          {reply.isEdited && (
            <span className="text-[10px] text-muted-foreground italic font-medium">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1.5 flex gap-2 items-center">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={updateMutation.isPending}
              maxLength={1000}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleEditSubmit();
                if (e.key === 'Escape') {
                  setEditContent(reply.content);
                  setIsEditing(false);
                }
              }}
              // biome-ignore lint/a11y/noAutofocus: Autofocus on inline edit input is desirable for quick keyboard flow.
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void handleEditSubmit()}
                disabled={updateMutation.isPending || !editContent.trim()}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditContent(reply.content);
                  setIsEditing(false);
                }}
                disabled={updateMutation.isPending}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {reply.inReplyTo && (
              <div className="mt-2">
                {reply.inReplyTo.isDeleted ? (
                  <div className="rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                    Replying to a deleted comment
                  </div>
                ) : onNavigateToReply ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToReply(reply.inReplyTo?.id ?? reply.id)}
                    className="w-full rounded-lg border border-border/70 bg-muted/35 px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`View original comment by ${reply.inReplyTo.createdBy?.name || 'a deleted user'}`}
                  >
                    <span className="font-medium text-foreground">
                      In reply to {reply.inReplyTo.createdBy?.name || 'Deleted user'}
                    </span>
                    <span className="mt-1 block line-clamp-2 break-words text-muted-foreground">
                      {reply.inReplyTo.content}
                    </span>
                  </button>
                ) : (
                  <div className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">
                      In reply to {reply.inReplyTo.createdBy?.name || 'Deleted user'}
                    </span>
                    <span className="mt-1 block line-clamp-2 break-words text-muted-foreground">
                      {reply.inReplyTo.content}
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="mt-1 text-foreground/80 break-words whitespace-pre-wrap leading-relaxed">
              {reply.content}
            </p>
            {onReply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onReply(reply)}
                className="mt-1 h-6 px-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
          </>
        )}
      </div>

      {/* Reply Action Popup Menu */}
      {!isEditing && (isAuthor || canDelete) && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Comment actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-32 p-1">
              {isAuthor && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-full justify-start px-2.5 text-xs font-medium"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-8 w-full justify-start px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  Delete
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Delete Confirmation utilizing pre-made ConfirmDialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={currentLang === 'vi' ? 'Xóa bình luận' : 'Delete Comment'}
        confirmLabel={currentLang === 'vi' ? 'Xóa' : 'Delete'}
        pendingLabel={currentLang === 'vi' ? 'Đang xóa...' : 'Deleting...'}
        isPending={deleteMutation.isPending}
      >
        {currentLang === 'vi'
          ? 'Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.'
          : 'Are you sure you want to delete this comment? This cannot be undone.'}
      </ConfirmDialog>
    </div>
  );
}
