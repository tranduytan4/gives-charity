import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useEmblaCarousel from 'embla-carousel-react';
import { GripVertical, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CampaignMedia } from '@/features/campaign/types';
import { DragScrollContainer } from '@/shared/components/ui/DragScrollContainer';
import { getMediaUrl } from '@/shared/utils/media';
import { MediaLightbox } from './MediaLightbox';

interface AnnouncementMediaGridProps {
  media: CampaignMedia[];
  isEditable?: boolean;
  onRemove?: (mediaId: number) => void;
  onReorder?: (media: CampaignMedia[]) => void;
}

export function AnnouncementMediaGrid({
  media,
  isEditable = false,
  onRemove,
  onReorder,
}: AnnouncementMediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeGrabbedIndex, setActiveGrabbedIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  if (!media || media.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGrabbedIndex(null);
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = media.findIndex((item) => item.id === active.id);
      const newIndex = media.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(media, oldIndex, newIndex));
    }
  };

  if (isEditable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full mt-3">
          <SortableContext items={media.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
            <DragScrollContainer
              ref={scrollContainerRef}
              onDragEnd={() => setActiveGrabbedIndex(null)}
            >
              {media.map((item, index) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={onRemove}
                  activeGrabbedIndex={activeGrabbedIndex}
                  onMouseDown={() => setActiveGrabbedIndex(index)}
                  onMouseUp={() => setActiveGrabbedIndex(null)}
                />
              ))}
            </DragScrollContainer>
          </SortableContext>
        </div>
      </DndContext>
    );
  }

  return (
    <div className="w-full mt-3 overflow-hidden" ref={emblaRef}>
      <div className="flex flex-row gap-1.5 pb-2 cursor-grab active:cursor-grabbing select-none">
        {media.map((item, index) => {
          const src = getMediaUrl(item.url);
          const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(item.url);

          return (
            // biome-ignore lint/a11y/useSemanticElements: Card contains nested interactive components
            <div
              key={item.id}
              onClick={() => setLightboxIndex(index)}
              onMouseDown={() => setActiveGrabbedIndex(index)}
              onMouseUp={() => setActiveGrabbedIndex(null)}
              onMouseLeave={() => setActiveGrabbedIndex(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLightboxIndex(index);
                }
              }}
              className={`relative h-[220px] sm:h-[280px] w-fit min-w-[150px] max-w-[450px] shrink-0 rounded-md overflow-hidden bg-gray-900 shadow-md border border-gray-100 group select-none transition-transform duration-300 ease-out focus:outline-none ${
                activeGrabbedIndex === index ? 'scale-[0.96]' : 'scale-100'
              }`}
            >
              {isVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 relative overflow-hidden">
                  <video
                    src={src}
                    className="h-full w-auto object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : (
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-auto object-cover pointer-events-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          media={media}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(idx) => setLightboxIndex(idx)}
        />
      )}
    </div>
  );
}

interface SortableMediaItemProps {
  item: CampaignMedia;
  index: number;
  onRemove?: (mediaId: number) => void;
  activeGrabbedIndex: number | null;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

function SortableMediaItem({
  item,
  index,
  onRemove,
  activeGrabbedIndex,
  onMouseDown,
  onMouseUp,
}: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const src = getMediaUrl(item.url);
  const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(item.url);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: DnD sortable item needs mouse events for drag interaction
    <div
      ref={setNodeRef}
      role="presentation"
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={`relative h-[220px] sm:h-[280px] w-fit min-w-[150px] max-w-[450px] shrink-0 rounded-md overflow-hidden bg-gray-900 shadow-md border border-gray-100 group select-none focus:outline-none ${
        isDragging
          ? 'scale-[0.98]'
          : `${
              activeGrabbedIndex === index ? 'scale-[0.96]' : 'scale-100'
            } transition-transform duration-300 ease-out`
      }`}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Stop propagation needed to prevent outer drag activation */}
      <div
        role="presentation"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 z-10"
      >
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          className="drag-handle p-1.5 rounded-full bg-black/60 text-white opacity-90 hover:opacity-100 hover:scale-105 transition-all shadow-sm cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      {isVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 relative overflow-hidden">
          {/* biome-ignore lint/a11y/useMediaCaption: Video captions are not available for campaign uploads */}
          <video
            src={src}
            className="h-full w-auto object-cover pointer-events-none"
            preload="metadata"
          />
          <div className="absolute bottom-3 right-3 p-1.5 rounded bg-black/60 text-white text-xs font-semibold select-none pointer-events-none">
            VIDEO
          </div>
        </div>
      ) : (
        <img src={src} alt="" className="h-full w-auto object-cover pointer-events-none" />
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white opacity-90 hover:opacity-100 hover:bg-red-600 transition-all shadow-sm cursor-pointer"
          title="Remove Media"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
