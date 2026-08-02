import { formatDistanceToNow } from 'date-fns';
import {
  CalendarClock,
  ChevronLeft,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnnouncementLikeButton, AnnouncementReplySection } from '@/features/announcement';
import { useAuthUser } from '@/features/auth/hooks';
import { useCampaignQuery } from '@/features/campaign/hooks/useCampaigns';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { formatDateTime, parseUTCDate } from '@/shared/utils/format';
import { htmlToText, sanitizeAnnouncementContent } from '@/shared/utils/html';
import { getMediaUrl } from '@/shared/utils/media';
import { AnnouncementEditorDialog } from '../components/AnnouncementEditorDialog';
import { AnnouncementMediaGrid } from '../components/AnnouncementMediaGrid';
import { AnnouncementShareDialog } from '../components/AnnouncementShareDialog';
import {
  useAnnouncementQuery,
  useDeleteAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from '../hooks';

export default function AnnouncementDetailPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const repliesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const { campaignId, announcementId } = useParams<{
    campaignId: string;
    announcementId: string;
  }>();
  const campaignIdNumber = Number(campaignId);
  const announcementIdNumber = Number(announcementId);
  const campaignPath = ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignIdNumber));
  const campaignAnnouncementPath = `${campaignPath}?tab=announcements`;
  const { data: user } = useAuthUser();
  const announcementQuery = useAnnouncementQuery(campaignIdNumber, announcementIdNumber);
  const campaignQuery = useCampaignQuery(campaignIdNumber, { enabled: !!campaignIdNumber });
  const deleteAnnouncement = useDeleteAnnouncementMutation(campaignIdNumber);
  const updateAnnouncement = useUpdateAnnouncementMutation(campaignIdNumber);
  const announcement = announcementQuery.data;
  const campaign = campaignQuery.data;
  const canManage =
    campaign?.creatorId === user?.id ||
    campaign?.roleInCampaign === 'CAMPAIGN_ADMIN' ||
    (!!campaign?.campaignAdmin && user?.role !== 'ADMIN');

  const scrollToReplies = () => {
    repliesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!announcement) return;
    await deleteAnnouncement.mutateAsync(announcement.id);
    setIsDeleteDialogOpen(false);
    navigate(campaignAnnouncementPath, { state });
  };

  const handleEditSubmit = async (form: {
    title: string;
    content: string;
    mediaIds?: number[];
  }) => {
    if (!announcement) return;
    await updateAnnouncement.mutateAsync({
      announcementId: announcement.id,
      payload: {
        title: form.title,
        content: form.content,
        mediaIds: form.mediaIds,
      },
    });
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('edit');
    setSearchParams(nextSearchParams, { replace: true });
  };

  if (announcementQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading announcement...
      </div>
    );
  }

  if (announcementQuery.isError || !announcement) {
    return (
      <NotFoundPage
        title="Announcement Not Found"
        description="The announcement you are looking for does not exist or is no longer available."
        backTo={ROUTES.CAMPAIGNS}
        backToText="Back to Campaigns"
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{announcement.title} — mgm gives</title>
        <meta property="og:title" content={announcement.title} />
        <meta property="og:description" content={htmlToText(announcement.content).slice(0, 200)} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="mgm gives" />
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          to={campaignAnnouncementPath}
          state={state}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to campaign
        </Link>

        <article className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-[56px_1fr] gap-3 px-5 py-5">
            <div className="relative flex flex-col items-center">
              <UserAvatar
                name={announcement.createdBy?.name || campaign?.title}
                avatarUrl={announcement.createdBy?.avatarUrl}
                size="lg"
                className="shadow-sm ring-4 ring-white"
              />
              <div className="mt-3 h-full min-h-16 w-px flex-1 bg-gray-200" />
            </div>

            <div className="min-w-0">
              <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="shrink-0 font-bold text-gray-950">
                      {announcement.createdBy?.name || campaign?.title || 'Campaign team'}
                    </span>
                    <span className="shrink-0 text-gray-400">posted</span>
                    <span className="min-w-0 max-w-full break-words font-semibold text-gray-800">
                      {announcement.title}
                    </span>
                  </div>
                </div>

                <time
                  dateTime={announcement.createdAt}
                  className="text-left text-sm text-gray-500 sm:pt-1 sm:text-right"
                  title={formatDateTime(announcement.createdAt)}
                >
                  {formatDistanceToNow(parseUTCDate(announcement.createdAt), { addSuffix: true })}
                </time>

                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900"
                          title="Announcement actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-36 p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nextSearchParams = new URLSearchParams(searchParams);
                            nextSearchParams.set('edit', 'true');
                            setSearchParams(nextSearchParams, { replace: true });
                          }}
                          className="h-9 w-full justify-start px-3"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="h-9 w-full justify-start px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div
                className="prose prose-sm max-w-none break-words text-[15px] leading-7 text-gray-800 prose-p:my-2 prose-img:mx-auto prose-img:my-4 prose-img:max-h-[400px] prose-img:w-auto prose-img:max-w-full prose-img:object-contain prose-img:rounded-lg prose-img:shadow-sm [&_video]:mx-auto [&_video]:my-4 [&_video]:max-h-[400px] [&_video]:w-auto [&_video]:max-w-full [&_video]:object-contain [&_video]:rounded-lg [&_video]:shadow-sm [&_[data-text-align='center']]:text-center [&_[data-text-align='right']]:text-right [&_[data-text-align='justify']]:text-justify"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Announcement content is sanitized before rendering.
                dangerouslySetInnerHTML={{
                  __html: sanitizeAnnouncementContent(announcement.content),
                }}
              />

              <AnnouncementMediaGrid media={announcement.media || []} />

              <div className="mt-5 flex items-center gap-6 border-t border-gray-100 pt-4 text-gray-500">
                <AnnouncementLikeButton
                  campaignId={campaignIdNumber}
                  announcementId={announcement.id}
                  isLiked={announcement.isLiked}
                  likesCount={announcement.likesCount}
                />
                <button
                  type="button"
                  onClick={scrollToReplies}
                  className="inline-flex items-center gap-2 text-sm transition-colors hover:text-gray-900 focus-visible:outline-none"
                >
                  <MessageCircle className="h-5 w-5" />
                  {announcement.repliesCount > 0 && (
                    <span className="text-xs">{announcement.repliesCount}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm transition-colors hover:text-gray-900 focus-visible:outline-none"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>{formatDateTime(announcement.createdAt)}</span>
              </div>
            </div>
          </div>
        </article>

        <div ref={repliesRef}>
          <AnnouncementReplySection
            campaignId={campaignIdNumber}
            announcementId={announcementIdNumber}
            variant="detail"
            canManageCampaign={canManage}
          />
        </div>

        <AnnouncementShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          shareUrl={window.location.href}
          announcementTitle={announcement?.title ?? ''}
          imageUrl={(() => {
            const imgUrl = announcement?.media?.find((m) => m.mediaType === 'IMAGE')?.url;
            return imgUrl ? getMediaUrl(imgUrl) : undefined;
          })()}
        />

        <Dialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          title="Delete Announcement"
        >
          <p className="text-sm leading-6 text-gray-600">
            Delete <span className="font-semibold text-gray-900">"{announcement.title}"</span>? This
            cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              {deleteAnnouncement.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </Dialog>

        <AnnouncementEditorDialog
          isOpen={isEditing}
          campaignId={campaignIdNumber}
          campaignName={campaign?.title || ''}
          initialAnnouncement={announcement}
          isSaving={updateAnnouncement.isPending}
          onClose={() => {
            const nextSearchParams = new URLSearchParams(searchParams);
            nextSearchParams.delete('edit');
            setSearchParams(nextSearchParams, { replace: true });
          }}
          onSubmit={handleEditSubmit}
        />
      </div>
    </>
  );
}
