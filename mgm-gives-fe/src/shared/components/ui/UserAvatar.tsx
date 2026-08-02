import { getInitials } from '@/shared/utils/getInitials';
import { getAvatarUrl } from '@/shared/utils/media';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]' },
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-12 w-12', text: 'text-sm' },
};

/**
 * Reusable avatar component.
 * Displays the user's profile image when available, falls back to initials.
 */
export function UserAvatar({ name, avatarUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const { container, text } = sizeMap[size];
  const initials = getInitials(name);

  const resolvedAvatarUrl = getAvatarUrl(avatarUrl);

  if (resolvedAvatarUrl) {
    return (
      <img
        src={resolvedAvatarUrl}
        alt={name ?? 'User avatar'}
        className={`${container} rounded-full object-cover ring-2 ring-primary/10 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${container} flex items-center justify-center rounded-full bg-blue-600 ${text} font-bold text-white flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
