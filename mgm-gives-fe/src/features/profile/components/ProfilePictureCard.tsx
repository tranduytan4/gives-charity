import { Loader2, Shield, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/Button';

interface ProfilePictureCardProps {
  fullName?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
  isUploading?: boolean;
  onFileSelect: (file: File) => void;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return '?';
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + (last?.charAt(0) ?? '')).toUpperCase();
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function ProfilePictureCard({
  fullName,
  email,
  role,
  avatarUrl,
  isUploading = false,
  onFileSelect,
}: ProfilePictureCardProps) {
  const { t } = useTranslation(['profile', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = getInitials(fullName);

  const displayUrl = avatarUrl;
  const isLoading = isUploading;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, and WEBP files are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 15MB.');
      return;
    }

    onFileSelect(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRoleLabel = (r?: string) => {
    if (!r) return '';
    if (r === 'ADMIN') return t('common:roles.admin', 'System Admin');
    if (r === 'CAMPAIGN_ADMIN') return t('common:roles.campaignAdmin', 'Campaign Admin');
    return t('common:roles.user', 'User');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center">
      {/* Section title */}
      <div className="w-full mb-6">
        <h2 className="text-base font-semibold text-foreground">{t('profilePicture')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">PNG, JPG or WEBP, max 15MB.</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {/* Avatar */}
      <div className="mb-4 relative">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={fullName ?? 'User avatar'}
            className={`h-28 w-28 rounded-full object-cover ring-4 ring-primary/10 transition-opacity ${
              isLoading ? 'opacity-40' : 'opacity-100'
            }`}
          />
        ) : (
          <div className="h-28 w-28 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-primary/10">
            <span className="text-3xl font-bold text-white select-none">{initials}</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Upload button */}
      <Button
        variant="outline"
        size="default"
        className="w-full max-w-[200px] mb-2 cursor-pointer"
        type="button"
        onClick={handleUploadClick}
        disabled={isLoading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('uploading')}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {t('uploadPhoto')}
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="w-full border-t border-border my-5" />

      {/* Name / Email / Role */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{fullName || '—'}</p>
        <p className="text-sm text-muted-foreground">{email || '—'}</p>
        {role && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
            <Shield className="h-3.5 w-3.5" />
            {getRoleLabel(role)}
          </span>
        )}
      </div>
    </div>
  );
}
