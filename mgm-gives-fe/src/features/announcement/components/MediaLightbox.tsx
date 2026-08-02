import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CampaignMedia } from '@/features/campaign/types';
import { getMediaUrl } from '@/shared/utils/media';

interface MediaLightboxProps {
  media: CampaignMedia[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function MediaLightbox({ media, activeIndex, onClose, onNavigate }: MediaLightboxProps) {
  const total = media.length;
  const currentItem = media[activeIndex];

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && total > 1) {
        onNavigate((activeIndex - 1 + total) % total);
      }
      if (e.key === 'ArrowRight' && total > 1) {
        onNavigate((activeIndex + 1) % total);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, total, onClose, onNavigate]);

  if (!currentItem) return null;

  const src = getMediaUrl(currentItem.url);
  const isVideo =
    currentItem.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(currentItem.url);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((activeIndex - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((activeIndex + 1) % total);
  };

  return createPortal(
    // biome-ignore lint/a11y/useSemanticElements: Backdrop wrapper holds navigational subcomponents
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 py-6 px-4 select-none focus:outline-none"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="w-full flex justify-between items-center z-[110] text-white/80 max-w-6xl">
        <span className="text-sm font-medium">
          {activeIndex + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center relative max-w-6xl my-4">
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 z-[110] p-3 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Stop propagation to prevent lightbox from closing when interacting with media */}
        <div
          role="presentation"
          className="max-w-full max-h-[70vh] flex items-center justify-center z-[105]"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            // biome-ignore lint/a11y/useMediaCaption: Caption files not available for uploaded attachments
            <video
              controls
              src={src}
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain focus:outline-none"
              autoPlay
            />
          ) : (
            <img
              src={src}
              alt=""
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
            />
          )}
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 z-[110] p-3 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
            title="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="w-full max-w-3xl flex justify-center gap-2 overflow-x-auto pb-2 z-[110] scrollbar-thin scrollbar-thumb-gray-700">
          {media.map((item, index) => {
            const thumbSrc = getMediaUrl(item.url);
            const isThumbVideo =
              item.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(item.url);
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(index);
                }}
                className={`relative h-12 w-20 rounded border-2 overflow-hidden shrink-0 transition-all focus:outline-none ${
                  isActive
                    ? 'border-primary-500 scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {isThumbVideo ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                    {/* biome-ignore lint/a11y/useMediaCaption: Thumbnail video doesn't require caption tracks */}
                    <video
                      src={thumbSrc}
                      className="h-full w-full object-cover pointer-events-none"
                      preload="none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <title>Video thumbnail</title>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <img
                    src={thumbSrc}
                    alt=""
                    className="h-full w-full object-cover pointer-events-none"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {currentItem.caption && (
        <div className="w-full text-center text-white/90 text-sm max-w-3xl z-[110] mt-2 px-4 select-text">
          <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300">
            {currentItem.caption}
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
