import { ChevronLeft, ChevronRight, Eye, Image as ImageIcon, Images, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CampaignMediaResponse, CampaignResponse } from '@/features/campaign/types';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Fancybox } from '@/shared/components/ui/Fancybox';
import { cn } from '@/shared/utils/cn';
import { getMediaUrl } from '@/shared/utils/media';

interface CampaignDetailHeaderProps {
  campaign: CampaignResponse;
}

const GALLERY_BATCH_SIZE = 8;

function isVideoMedia(media: CampaignMediaResponse) {
  return (
    media.mediaType === 'VIDEO' || !!(media.url || media.mediaUrl)?.match(/\.(mp4|webm|ogg|mov)$/i)
  );
}

function getVideoMimeType(source: string) {
  if (/\.webm(?:$|[?#])/i.test(source)) return 'video/webm';
  if (/\.(?:ogg|ogv)(?:$|[?#])/i.test(source)) return 'video/ogg';
  if (/\.mov(?:$|[?#])/i.test(source)) return 'video/quicktime';
  return 'video/mp4';
}

export function CampaignDetailHeader({ campaign }: CampaignDetailHeaderProps) {
  const [mediaStartIndex, setMediaStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'all' | 'images' | 'videos'>('all');
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoError, setVideoError] = useState('');
  const videoBlobUrlRef = useRef('');
  const coverAnchorRef = useRef<HTMLAnchorElement>(null);
  const campaignMedias = campaign.medias ?? [];
  const getStatusBadge = () => {
    const baseClasses =
      'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-md pointer-events-none';
    switch (campaign.status) {
      case 'APPROVED':
        return (
          <span className={`${baseClasses} bg-yellow-400 text-yellow-950 font-bold`}>Approved</span>
        );
      case 'IN_PROGRESS':
        return <span className={`${baseClasses} bg-sky-500`}>In Progress</span>;
      case 'COMPLETED':
        return <span className={`${baseClasses} bg-emerald-500`}>Completed</span>;
      case 'REJECTED':
        return <span className={`${baseClasses} bg-red-600`}>Rejected</span>;
      case 'DRAFT':
        return <span className={`${baseClasses} bg-slate-600`}>Draft</span>;
      case 'PENDING':
        return <span className={`${baseClasses} bg-orange-600 text-white`}>Pending Approval</span>;
      default:
        return null;
    }
  };
  const flaggedCoverMedia = campaignMedias.find((media) => media.isCover);
  const coverMedia = flaggedCoverMedia ?? (campaign.coverImageUrl ? undefined : campaignMedias[0]);
  const coverSource = coverMedia?.url || coverMedia?.mediaUrl || campaign.coverImageUrl;
  const coverImageUrl = coverSource ? getMediaUrl(coverSource) : '';
  const coverIsVideo = coverMedia ? isVideoMedia(coverMedia) : false;
  const additionalMedias = campaignMedias.filter((media) => media.id !== coverMedia?.id);
  const visibleMediaCount = 4;
  const maximumStartIndex = Math.max(0, additionalMedias.length - visibleMediaCount);
  const safeStartIndex = Math.min(mediaStartIndex, maximumStartIndex);
  const visibleMedias = additionalMedias.slice(safeStartIndex, safeStartIndex + visibleMediaCount);
  const hiddenMedias = additionalMedias.filter(
    (media) => !visibleMedias.some((visibleMedia) => visibleMedia.id === media.id),
  );
  const galleryMedias = campaignMedias.filter((media) => {
    if (galleryTab === 'images') return !isVideoMedia(media);
    if (galleryTab === 'videos') return isVideoMedia(media);
    return true;
  });
  const [visibleGalleryMediaCount, setVisibleGalleryMediaCount] = useState(GALLERY_BATCH_SIZE);

  useEffect(() => {
    return () => {
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
      }
    };
  }, []);

  const closeVideoPreview = () => {
    setIsVideoPreviewOpen(false);
    setVideoPreviewUrl('');
    setVideoError('');
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = '';
    }
  };

  const openVideoPreview = async (sourceUrl: string) => {
    setIsVideoPreviewOpen(true);
    setIsVideoLoading(true);
    setVideoPreviewUrl('');
    setVideoError('');

    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = '';
    }

    try {
      const response = await fetch(sourceUrl, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Unable to load video (${response.status})`);
      }

      const responseBlob = await response.blob();
      if (responseBlob.size === 0) {
        throw new Error('The video file is empty');
      }

      const videoBlob = responseBlob.type.startsWith('video/')
        ? responseBlob
        : new Blob([await responseBlob.arrayBuffer()], { type: getVideoMimeType(sourceUrl) });

      const blobUrl = URL.createObjectURL(videoBlob);
      videoBlobUrlRef.current = blobUrl;
      setVideoPreviewUrl(blobUrl);
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : 'Unable to load this video');
    } finally {
      setIsVideoLoading(false);
    }
  };

  return (
    <Fancybox
      className="order-1 min-w-0"
      delegate='[data-fancybox="campaign-media"]'
      options={{
        Carousel: { infinite: false },
        Video: {
          autoplay: false,
          html5videoTpl:
            '<video class="f-html5video" playsinline controls preload="metadata" controlsList="nodownload" src="{{src}}">Your browser does not support embedded videos.</video>',
        },
      }}
    >
      <section>
        <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-blue-100/80 bg-[#eef5ff] shadow-[0_24px_70px_rgba(37,99,235,0.05)]">
          {campaign.status && (
            <div className="absolute left-4 top-4 z-10 pointer-events-none">{getStatusBadge()}</div>
          )}
          {coverImageUrl ? (
            <a
              ref={coverAnchorRef}
              href={coverImageUrl}
              data-fancybox={coverIsVideo ? undefined : 'campaign-media'}
              onClick={(event) => {
                if (coverIsVideo) {
                  event.preventDefault();
                  void openVideoPreview(coverImageUrl);
                }
              }}
              className="block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={`Open ${campaign.title} media gallery`}
            >
              {coverIsVideo ? (
                <video
                  src={coverImageUrl}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.015]"
                />
              ) : (
                <img
                  src={coverImageUrl}
                  alt={`Cover for ${campaign.title}`}
                  className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.015]"
                />
              )}
              {coverIsVideo && (
                <div className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white shadow-sm backdrop-blur-sm pointer-events-none">
                  <Play className="h-5 w-5 fill-current" />
                </div>
              )}
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
                <ImageIcon className="h-8 w-8" />
              </div>
            </div>
          )}

          {additionalMedias.length > 0 && coverImageUrl && (
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Images className="h-4 w-4" />
              View all
            </button>
          )}
        </div>

        {additionalMedias.length > 0 && (
          <div className="mt-3 flex items-center gap-2.5">
            {additionalMedias.length > visibleMediaCount && (
              <button
                type="button"
                onClick={() =>
                  setMediaStartIndex((current) => (current <= 0 ? maximumStartIndex : current - 1))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Previous campaign media"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-4 gap-2.5">
              {visibleMedias.map((media, index) => {
                const srcUrl = getMediaUrl(media.url || media.mediaUrl);
                const isVideo = isVideoMedia(media);

                return (
                  <a
                    key={media.id}
                    href={srcUrl}
                    data-fancybox={isVideo ? undefined : 'campaign-media'}
                    onClick={(event) => {
                      if (isVideo) {
                        event.preventDefault();
                        void openVideoPreview(srcUrl);
                      }
                    }}
                    className="group relative block aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-blue-100/80 bg-[#eef5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open campaign media ${safeStartIndex + index + 2}`}
                  >
                    {isVideo ? (
                      <video
                        src={srcUrl}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={srcUrl}
                        alt={`${campaign.title}, additional media ${safeStartIndex + index + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {isVideo && (
                      <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white shadow-sm backdrop-blur-sm pointer-events-none">
                        <Play className="h-3 w-3 fill-current" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
                      <Eye className="h-6 w-6" />
                    </div>
                  </a>
                );
              })}
            </div>

            {additionalMedias.length > visibleMediaCount && (
              <button
                type="button"
                onClick={() =>
                  setMediaStartIndex((current) => (current >= maximumStartIndex ? 0 : current + 1))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Next campaign media"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="hidden" aria-hidden="true">
          {hiddenMedias
            .filter((media) => !isVideoMedia(media))
            .map((media) => {
              const srcUrl = getMediaUrl(media.url || media.mediaUrl);

              return (
                <a key={media.id} href={srcUrl} data-fancybox="campaign-media" tabIndex={-1}>
                  {campaign.title}
                </a>
              );
            })}
        </div>
      </section>

      {isGalleryOpen && (
        <Dialog
          isOpen
          onClose={() => setIsGalleryOpen(false)}
          title="Campaign Gallery"
          className="w-[90vw] max-w-4xl"
        >
          <div className="flex gap-4 border-b border-border px-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setGalleryTab('all');
                setVisibleGalleryMediaCount(GALLERY_BATCH_SIZE);
              }}
              className={cn(
                'border-b-2 px-2 py-2 text-sm font-medium transition-colors',
                galleryTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setGalleryTab('images');
                setVisibleGalleryMediaCount(GALLERY_BATCH_SIZE);
              }}
              className={cn(
                'border-b-2 px-2 py-2 text-sm font-medium transition-colors',
                galleryTab === 'images'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              Images
            </button>
            <button
              type="button"
              onClick={() => {
                setGalleryTab('videos');
                setVisibleGalleryMediaCount(GALLERY_BATCH_SIZE);
              }}
              className={cn(
                'border-b-2 px-2 py-2 text-sm font-medium transition-colors',
                galleryTab === 'videos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              Videos
            </button>
          </div>
          <Fancybox
            delegate='[data-fancybox="gallery-grid"]'
            options={{
              Carousel: { infinite: false },
              Video: {
                autoplay: false,
                html5videoTpl:
                  '<video class="f-html5video" playsinline controls preload="metadata" controlsList="nodownload" src="{{src}}">Your browser does not support embedded videos.</video>',
              },
            }}
          >
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {galleryMedias.length === 0 ? (
                <div className="flex min-h-[12rem] flex-col items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">
                    {galleryTab === 'videos' && 'No videos available in this gallery.'}
                    {galleryTab === 'images' && 'No images available in this gallery.'}
                    {galleryTab === 'all' && 'No media available in this gallery.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {galleryMedias.slice(0, visibleGalleryMediaCount).map((media) => {
                      const srcUrl = getMediaUrl(media.url || media.mediaUrl);
                      const isVideo = isVideoMedia(media);

                      return (
                        <a
                          key={media.id}
                          href={srcUrl}
                          data-fancybox={isVideo ? undefined : 'gallery-grid'}
                          onClick={(event) => {
                            if (isVideo) {
                              event.preventDefault();
                              void openVideoPreview(srcUrl);
                            }
                          }}
                          className="group relative block aspect-square overflow-hidden rounded-lg bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {isVideo ? (
                            <video
                              src={srcUrl}
                              muted
                              preload="auto"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            >
                              <track kind="captions" />
                            </video>
                          ) : (
                            <img
                              src={srcUrl}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          )}
                          {isVideo && (
                            <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white shadow-sm backdrop-blur-sm pointer-events-none">
                              <Play className="h-4 w-4 fill-current" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
                            <Eye className="h-8 w-8" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  {visibleGalleryMediaCount < galleryMedias.length && (
                    <button
                      type="button"
                      className="mx-auto mt-4 block text-sm font-semibold text-primary hover:text-primary/80"
                      onClick={() =>
                        setVisibleGalleryMediaCount((count) => count + GALLERY_BATCH_SIZE)
                      }
                    >
                      Show more media
                    </button>
                  )}
                </>
              )}
            </div>
          </Fancybox>
        </Dialog>
      )}

      <Dialog
        isOpen={isVideoPreviewOpen}
        onClose={closeVideoPreview}
        title="Campaign Video"
        className="w-[92vw] max-w-5xl"
      >
        <div className="flex min-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-black sm:min-h-[32rem]">
          {isVideoLoading && (
            <div className="flex flex-col items-center gap-3 text-sm text-white/75">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Loading video...
            </div>
          )}
          {!isVideoLoading && videoPreviewUrl && (
            <video
              key={videoPreviewUrl}
              src={videoPreviewUrl}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="max-h-[75vh] w-full bg-black object-contain"
            >
              <track kind="captions" />
            </video>
          )}
          {!isVideoLoading && videoError && (
            <div className="max-w-md px-6 text-center text-sm text-white/80">
              <p className="font-semibold text-white">Unable to play this video</p>
              <p className="mt-2">{videoError}</p>
            </div>
          )}
        </div>
      </Dialog>
    </Fancybox>
  );
}
