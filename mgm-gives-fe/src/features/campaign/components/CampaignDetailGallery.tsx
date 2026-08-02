import { Eye, FileText } from 'lucide-react';
import type { CampaignResponse } from '@/features/campaign/types';
import { Fancybox } from '@/shared/components/ui/Fancybox';
import { getMediaUrl } from '@/shared/utils/media';
import { getMediaKind } from '../constants/media';
import { useCampaignMedia } from '../hooks';

interface CampaignDetailGalleryProps {
  campaign: CampaignResponse;
}

export function CampaignDetailGallery({ campaign }: CampaignDetailGalleryProps) {
  const { data: campaignMedias } = useCampaignMedia(campaign.id);
  const galleryMedias = (campaignMedias ?? campaign.medias ?? []).filter(
    (media) => !('campaignId' in media) || media.campaignId === campaign.id,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {galleryMedias.length > 0 ? (
          <Fancybox options={{ Carousel: { infinite: false } }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
              {galleryMedias.map((media, index: number) => {
                const rawUrl = media.url || media.mediaUrl;
                const srcUrl = getMediaUrl(rawUrl);
                const kind = getMediaKind(media.mediaType, rawUrl);
                const isVideo = kind === 'video';
                const isPdf = kind === 'pdf';

                if (isVideo) {
                  return (
                    <div
                      key={media.id || index}
                      className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100/80 shadow-xs bg-slate-950 flex-shrink-0"
                    >
                      <video src={srcUrl} controls className="w-full h-full object-contain">
                        <track kind="captions" />
                      </video>
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <a
                      key={media.id || index}
                      href={srcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-xs bg-red-50 flex-shrink-0 flex flex-col items-center justify-center gap-1.5 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-xs font-medium">View PDF</span>
                    </a>
                  );
                }

                return (
                  <a
                    key={media.id || index}
                    data-fancybox="gallery"
                    href={srcUrl}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-xs bg-slate-50 flex-shrink-0 cursor-zoom-in group transition-all duration-300 hover:shadow-md hover:border-gray-250/80"
                  >
                    <img
                      src={srcUrl}
                      alt="Gallery"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="p-2.5 rounded-full bg-white/95 text-slate-800 shadow-md transition-all duration-300 scale-90 group-hover:scale-100">
                        <Eye className="h-4.5 w-4.5" />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </Fancybox>
        ) : (
          <>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Gallery placeholder"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Gallery placeholder"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1511649475669-e288648b2339?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                alt="Gallery placeholder"
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
