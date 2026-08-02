import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useToggleLikeMutation } from '../hooks/useAnnouncementEngagement';

interface AnnouncementLikeButtonProps {
  campaignId: number;
  announcementId: number;
  likesCount: number;
  isLiked: boolean;
  className?: string;
}

export function AnnouncementLikeButton({
  campaignId,
  announcementId,
  likesCount,
  isLiked,
  className,
}: AnnouncementLikeButtonProps) {
  const toggleLike = useToggleLikeMutation(campaignId, announcementId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleLike.isPending) return;
    toggleLike.mutate(isLiked);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={toggleLike.isPending}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 bg-transparent p-0 text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50',
        isLiked ? 'text-rose-600' : 'text-gray-500 hover:text-rose-600',
        className,
      )}
      title={isLiked ? 'Unlike announcement' : 'Like announcement'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-transform duration-200',
          isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-current',
        )}
      />
      {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
    </motion.button>
  );
}
