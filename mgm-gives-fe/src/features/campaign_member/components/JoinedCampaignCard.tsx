import { Calendar, Clock, Hourglass, Loader2, LogOut, UserCheck } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CampaignCard, type CampaignPriority, type CampaignStatus } from '@/features/campaign';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { formatDate, formatLabel, parseUTCDate } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import { useCancelUnjoinRequest } from '../hooks/hooks';
import type { JoinedCampaignResponse } from '../types/types';

const getDaysLeftText = (endDate?: string | null, status?: string, currentLang?: string) => {
  if (status === 'COMPLETED') return currentLang === 'vi' ? 'Đã kết thúc' : 'Ended';
  if (!endDate) return currentLang === 'vi' ? 'Đã kết thúc' : 'Ended';
  const diffTime = parseUTCDate(endDate).getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return currentLang === 'vi' ? 'Đã kết thúc' : 'Ended';
  return currentLang === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`;
};

interface JoinedCampaignCardProps {
  campaign: JoinedCampaignResponse;
  onLeave: (campaignId: number, options: { onDone: () => void }) => void;
  isLeaving: boolean;
}

export function JoinedCampaignCard({ campaign, onLeave, isLeaving }: JoinedCampaignCardProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelUnjoinMutation = useCancelUnjoinRequest();

  const {
    campaignId,
    title,
    description,
    status,
    priority,
    target,
    currentRaised,
    donorsCount,
    volunteersCount,
    startDate,
    endDate,
    joinedAt,
    role,
    coverImageUrl,
    categories,
    hasPendingUnjoinRequest,
  } = campaign;

  const isEnded = status === 'COMPLETED';
  const isCampaignAdmin = role === 'CAMPAIGN_ADMIN';

  const handleCancelUnjoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelUnjoinMutation.mutate(campaignId, {
      onSuccess: () =>
        toast.success(
          currentLang === 'vi' ? 'Đã hủy yêu cầu rời chiến dịch' : 'Unjoin request cancelled',
        ),
      onError: () =>
        toast.error(
          currentLang === 'vi'
            ? 'Không thể hủy yêu cầu rời chiến dịch'
            : 'Failed to cancel unjoin request',
        ),
    });
  };

  // Map JoinedCampaignResponse → Campaign shape expected by CampaignCard.
  const mapped = {
    id: String(campaignId),
    title,
    description,
    coverImage: getMediaUrl(coverImageUrl),
    categories: categories || [],
    status: status as CampaignStatus,
    priority: priority as CampaignPriority,
    target,
    currentRaised: currentRaised ?? 0,
    donorsCount: donorsCount ?? 0,
    volunteersCount: volunteersCount ?? 0,
    endDate,
    createdAt: startDate,
  };

  // Custom meta row: date range (left) + joined-at/role or "Ended" (right)
  const metaSlot = (
    <div className="flex flex-col gap-1.5 text-xs text-white/90 font-medium pt-0.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-white/80">
          <Calendar className="h-3.5 w-3.5 opacity-80 shrink-0" />
          <span>
            {currentLang === 'vi' ? 'Tạo ngày ' : 'Created '}
            {formatDate(joinedAt || startDate)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/90">
          <Clock className="h-3.5 w-3.5 opacity-80 shrink-0" />
          <span>{getDaysLeftText(endDate, status, currentLang)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-white/90">
        <UserCheck className="h-3.5 w-3.5 opacity-70 shrink-0" />
        <span>
          {isEnded
            ? currentLang === 'vi'
              ? 'Đã kết thúc'
              : 'Ended'
            : currentLang === 'vi'
              ? `Tham gia ${formatDate(joinedAt)}`
              : `Joined ${formatDate(joinedAt)}`}{' '}
          · {formatLabel(role)}
        </span>
      </div>
    </div>
  );

  const unjoinButtonContent = isLeaving ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
      {currentLang === 'vi' ? 'Đang rời…' : 'Leaving…'}
    </>
  ) : (
    <>
      <LogOut className="h-4 w-4 mr-1.5" />
      {currentLang === 'vi' ? 'Rời nhóm Tình nguyện' : 'Unjoin Volunteer'}
    </>
  );

  // Custom action: Unjoin button — opens confirmation dialog first.
  // Campaign admins can't leave, so the button (and its dialog) are omitted entirely
  // rather than shown disabled — `false` also prevents CampaignCard's Donate-button fallback.
  const actionSlot = isCampaignAdmin ? (
    false
  ) : hasPendingUnjoinRequest ? (
    <Button
      variant="outline"
      className="flex-1 border-amber-400 bg-amber-50/70 text-amber-700 hover:bg-amber-100 cursor-pointer"
      disabled={cancelUnjoinMutation.isPending}
      onClick={handleCancelUnjoin}
    >
      {cancelUnjoinMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          {currentLang === 'vi' ? 'Đang hủy…' : 'Cancelling…'}
        </>
      ) : (
        <>
          <Hourglass className="h-4 w-4 mr-1.5" />
          {currentLang === 'vi' ? 'Chờ duyệt rời · Hủy' : 'Pending approval · Cancel'}
        </>
      )}
    </Button>
  ) : (
    <Button
      variant="outline"
      className="flex-1 border-destructive bg-white text-destructive hover:bg-destructive/10 cursor-pointer"
      disabled={isLeaving}
      onClick={(e) => {
        e.stopPropagation();
        setConfirmOpen(true);
      }}
    >
      {unjoinButtonContent}
    </Button>
  );

  return (
    <>
      <CampaignCard
        campaign={mapped}
        metaSlot={metaSlot}
        actionSlot={actionSlot}
        navigationState={{ from: 'joined' }}
      />

      {/* Confirmation dialog — rendered outside the card click area */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onLeave(campaignId, { onDone: () => setConfirmOpen(false) })}
        title={currentLang === 'vi' ? 'Rời Tình nguyện viên' : 'Unjoin Volunteer'}
        confirmLabel={currentLang === 'vi' ? 'Rời nhóm' : 'Unjoin'}
        pendingLabel={currentLang === 'vi' ? 'Đang rời...' : 'Unjoining...'}
        isPending={isLeaving}
      >
        {currentLang === 'vi'
          ? `Bạn có chắc chắn muốn rời nhóm tình nguyện viên cho chiến dịch "${title}" không? Nếu bạn vẫn còn công việc được giao, hệ thống sẽ gửi yêu cầu cần Quản trị viên duyệt.`
          : `Are you sure you want to unjoin as a volunteer for "${title}"? If you still have an assigned task, this will send a request that requires admin approval instead of leaving immediately.`}
      </ConfirmDialog>
    </>
  );
}
