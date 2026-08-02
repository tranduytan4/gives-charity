import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AnnouncementLikeButton, AnnouncementReplySection } from '@/features/announcement';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateTime, parseUTCDate } from '@/shared/utils/format';
import { htmlToText, sanitizeAnnouncementContent } from '@/shared/utils/html';
import { getMediaUrl } from '@/shared/utils/media';
import {
  useAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from '../hooks';
import type { Announcement, AudienceFilter } from '../types';
import { AnnouncementEditorDialog } from './AnnouncementEditorDialog';
import { AnnouncementMediaGrid } from './AnnouncementMediaGrid';
import { AnnouncementShareDialog } from './AnnouncementShareDialog';

const PAGE_SIZE = 5;
const ANNOUNCEMENT_PREVIEW_TEXT_LIMIT = 180;
const ANNOUNCEMENT_PREVIEW_HTML_LIMIT = 600;
const ANNOUNCEMENT_PREVIEW_BLOCK_LIMIT = 3;

const getMediaCount = (html: string) =>
  sanitizeAnnouncementContent(html).match(/<(img|video)\b/gi)?.length ?? 0;

const getBlockCount = (html: string) => {
  const sanitized = sanitizeAnnouncementContent(html);
  const blockMatches = sanitized.match(/<(p|br|li|h1|h2|h3|h4|h5|h6)\b/gi);
  return blockMatches?.length ?? 0;
};

const shouldCollapseAnnouncement = (html: string) =>
  htmlToText(html).length > ANNOUNCEMENT_PREVIEW_TEXT_LIMIT ||
  sanitizeAnnouncementContent(html).length > ANNOUNCEMENT_PREVIEW_HTML_LIMIT ||
  getBlockCount(html) > ANNOUNCEMENT_PREVIEW_BLOCK_LIMIT ||
  getMediaCount(html) > 0;

const getCampaignAnnouncementPath = (campaignId: number, announcementId: number) =>
  ROUTES.CAMPAIGN_ANNOUNCEMENT_DETAIL.replace(':campaignId', String(campaignId)).replace(
    ':announcementId',
    String(announcementId),
  );

export function CampaignAnnouncements({
  campaignId,
  campaignName,
  canManage,
}: {
  campaignId: number;
  campaignName: string;
  canManage: boolean;
}) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const dateLocale = currentLang === 'vi' ? vi : enUS;

  const [page, setPage] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<number | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [announcementToShare, setAnnouncementToShare] = useState<Announcement | null>(null);

  const announcementsQuery = useAnnouncementsQuery(campaignId, {
    page,
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  });
  const createAnnouncement = useCreateAnnouncementMutation(campaignId);
  const deleteAnnouncement = useDeleteAnnouncementMutation(campaignId);
  const announcements = announcementsQuery.data?.content ?? [];
  const totalPages = announcementsQuery.data?.totalPages ?? 0;

  const toggleReplies = (id: number) => {
    setExpandedAnnouncementId((current) => (current === id ? null : id));
  };

  const openCreateDialog = () => {
    setIsEditorOpen(true);
  };

  const handleSubmit = async (form: {
    title: string;
    content: string;
    audienceFilter?: AudienceFilter | null;
    mediaIds?: number[];
  }) => {
    await createAnnouncement.mutateAsync(
      {
        title: form.title,
        content: form.content,
        audienceFilter: form.audienceFilter,
        mediaIds: form.mediaIds,
      },
      {
        onSuccess: () => {
          toast.success(
            currentLang === 'vi' ? 'Tạo thông báo thành công' : 'Announcement created successfully',
          );
          setIsEditorOpen(false);
          setPage(0);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!announcementToDelete) return;
    deleteAnnouncement.mutate(announcementToDelete.id, {
      onSuccess: () => {
        toast.success(
          currentLang === 'vi' ? 'Xóa thông báo thành công' : 'Announcement deleted successfully',
        );
        setAnnouncementToDelete(null);
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {currentLang === 'vi' ? 'Thông báo' : 'Announcement'}
          </h2>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            {currentLang === 'vi' ? 'Đăng thông báo' : 'Post Announcement'}
          </Button>
        )}
      </div>

      {announcementsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-10 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {currentLang === 'vi' ? 'Đang tải thông báo...' : 'Loading announcements...'}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
          <Megaphone className="mx-auto mb-3 h-9 w-9 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900">
            {currentLang === 'vi' ? 'Chưa có thông báo nào' : 'No announcements yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManage
              ? currentLang === 'vi'
                ? 'Hãy đăng thông báo đầu tiên cho chiến dịch.'
                : 'Post the first campaign announcement.'
              : currentLang === 'vi'
                ? 'Các thông báo từ chiến dịch này sẽ xuất hiện tại đây.'
                : 'Announcements from this campaign will appear here.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-blue-100/70 bg-transparent">
          {announcements.map((announcement) => {
            const announcementPath = getCampaignAnnouncementPath(
              announcement.campaignId,
              announcement.id,
            );
            const isCollapsed = shouldCollapseAnnouncement(announcement.content);

            return (
              <article
                key={announcement.id}
                className="grid grid-cols-[48px_1fr] gap-3 py-5 sm:grid-cols-[56px_1fr]"
              >
                <div className="relative flex flex-col items-center">
                  <UserAvatar
                    name={announcement.createdBy?.name || campaignName}
                    avatarUrl={announcement.createdBy?.avatarUrl}
                    size="lg"
                    className="z-10 h-11 w-11"
                  />
                  <div className="mt-3 h-full w-0.5 bg-border flex-1" />
                </div>

                <div className="min-w-0">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-start">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="shrink-0 font-bold text-gray-950">
                          {announcement.createdBy?.name || campaignName}
                        </span>
                        <span className="shrink-0 text-gray-400">
                          {currentLang === 'vi' ? 'đã đăng' : 'posted'}
                        </span>
                        <Link
                          to={announcementPath}
                          className="min-w-0 max-w-full break-words font-semibold text-gray-800 hover:text-primary"
                          title={announcement.title}
                        >
                          {announcement.title}
                        </Link>
                      </div>
                    </div>

                    <time
                      dateTime={announcement.createdAt}
                      className="text-left text-sm text-gray-500 sm:pt-1 sm:text-right"
                      title={formatDateTime(announcement.createdAt)}
                    >
                      {formatDistanceToNow(parseUTCDate(announcement.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </time>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900"
                              title="Announcement actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-36 p-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-9 w-full justify-start px-3"
                            >
                              <Link to={`${announcementPath}?edit=true`}>
                                <Pencil className="h-4 w-4" />
                                {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAnnouncementToDelete(announcement)}
                              className="h-9 w-full justify-start px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-2">
                    <div
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: Announcement content is sanitized before rendering.
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAnnouncementContent(announcement.content),
                      }}
                    />
                    {isCollapsed && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#eef5ff] to-transparent" />
                    )}
                  </div>

                  <AnnouncementMediaGrid media={announcement.media || []} />

                  {isCollapsed && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        asChild
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm font-semibold text-primary"
                      >
                        <Link to={announcementPath}>Read more</Link>
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-6 text-muted-foreground">
                    <AnnouncementLikeButton
                      campaignId={campaignId}
                      announcementId={announcement.id}
                      isLiked={announcement.isLiked}
                      likesCount={announcement.likesCount}
                    />
                    <button
                      type="button"
                      onClick={() => toggleReplies(announcement.id)}
                      className="inline-flex items-center gap-1 bg-transparent p-0 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none"
                      title="Replies"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {announcement.repliesCount > 0 && (
                        <span className="text-xs">{announcement.repliesCount}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center bg-transparent p-0 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none"
                      title="Share"
                      onClick={() => setAnnouncementToShare(announcement)}
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>

                  {expandedAnnouncementId === announcement.id && (
                    <AnnouncementReplySection
                      campaignId={campaignId}
                      announcementId={announcement.id}
                      variant="list"
                      canManageCampaign={canManage}
                    />
                  )}
                </div>
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <AnnouncementEditorDialog
        isOpen={isEditorOpen}
        campaignId={campaignId}
        campaignName={campaignName}
        initialAnnouncement={null}
        isSaving={createAnnouncement.isPending}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleSubmit}
      />

      <AnnouncementShareDialog
        isOpen={!!announcementToShare}
        onClose={() => setAnnouncementToShare(null)}
        shareUrl={
          announcementToShare
            ? `${window.location.origin}${getCampaignAnnouncementPath(announcementToShare.campaignId, announcementToShare.id)}`
            : ''
        }
        announcementTitle={announcementToShare?.title ?? ''}
        imageUrl={(() => {
          const imgUrl = announcementToShare?.media?.find((m) => m.mediaType === 'IMAGE')?.url;
          return imgUrl ? getMediaUrl(imgUrl) : undefined;
        })()}
      />

      <Dialog
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        title="Delete Announcement"
      >
        <p className="text-sm leading-6 text-gray-600">
          Delete{' '}
          <span className="font-semibold text-gray-900">"{announcementToDelete?.title}"</span>? This
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={() => setAnnouncementToDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            {deleteAnnouncement.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
