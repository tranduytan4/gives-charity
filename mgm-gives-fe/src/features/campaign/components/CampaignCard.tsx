import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bookmark,
  Calendar,
  Clock,
  Heart,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { followCampaign, unfollowCampaign, unjoinCampaign } from '@/features/campaign/api';
import { campaignQueryKeys } from '@/features/campaign/constants/queryKeys';
import { joinedCampaignsQueryKey } from '@/features/campaign_member/hooks/hooks';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { formatCurrency, formatProgressCurrencyParts } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import type { Campaign, CampaignPriority } from '../types';

interface CampaignCardProps {
  campaign: Campaign;
  metaSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  navigationState?: Record<string, unknown>;
  enableHoverScale?: boolean;
}

export function CampaignCard({
  campaign,
  metaSlot,
  actionSlot,
  navigationState,
  enableHoverScale = true,
}: CampaignCardProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isFollowed = campaign.isFollowed;
  const canLeaveCampaign = campaign.isJoined && campaign.roleInCampaign !== 'CAMPAIGN_ADMIN';

  const handleToggleFollow = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (isFollowed) {
        await unfollowCampaign(Number(campaign.id));
        toast.success(currentLang === 'vi' ? 'Đã bỏ theo dõi chiến dịch' : 'Unfollowed campaign');
      } else {
        await followCampaign(Number(campaign.id));
        toast.success(currentLang === 'vi' ? 'Đã theo dõi chiến dịch' : 'Followed campaign');
      }

      queryClient.setQueriesData({ queryKey: campaignQueryKeys.lists }, (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;

        type CacheData = {
          pages?: { content: Campaign[] }[];
          content?: Campaign[];
        };
        const data = oldData as CacheData;

        if (data.pages) {
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              content: page.content.map((item) =>
                String(item.id) === String(campaign.id)
                  ? { ...item, isFollowed: !isFollowed }
                  : item,
              ),
            })),
          };
        }

        if (data.content) {
          return {
            ...data,
            content: data.content.map((item) =>
              String(item.id) === String(campaign.id) ? { ...item, isFollowed: !isFollowed } : item,
            ),
          };
        }

        return data;
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.followed }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.detail(String(campaign.id)) }),
      ]);
    } catch (_error) {
      toast.error(
        isFollowed
          ? currentLang === 'vi'
            ? 'Thất bại khi bỏ theo dõi'
            : 'Failed to unfollow campaign'
          : currentLang === 'vi'
            ? 'Thất bại khi theo dõi'
            : 'Failed to follow campaign',
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleLeaveCampaign = async () => {
    if (isLeaving) return;

    setIsLeaving(true);
    try {
      await unjoinCampaign(Number(campaign.id));
      toast.success(currentLang === 'vi' ? 'Đã rời chiến dịch' : 'Left campaign');
      setConfirmLeaveOpen(false);

      queryClient.setQueriesData({ queryKey: campaignQueryKeys.lists }, (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;

        type CacheData = {
          pages?: { content: Campaign[] }[];
          content?: Campaign[];
        };
        const data = oldData as CacheData;

        if (data.pages) {
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              content: page.content.map((item) =>
                String(item.id) === String(campaign.id) ? { ...item, isJoined: false } : item,
              ),
            })),
          };
        }

        if (data.content) {
          return {
            ...data,
            content: data.content.map((item) =>
              String(item.id) === String(campaign.id) ? { ...item, isJoined: false } : item,
            ),
          };
        }

        return data;
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: joinedCampaignsQueryKey }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.detail(String(campaign.id)) }),
      ]);
    } catch (_error) {
      toast.error(
        currentLang === 'vi' ? 'Thất bại khi rời chiến dịch' : 'Failed to leave campaign',
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const { title, coverImage, categories, status, priority, endDate, createdAt } = campaign;
  const targetGoal = campaign.target || 0;
  const currentRaised = campaign.currentRaised || 0;
  const displayImage = getMediaUrl(coverImage);
  const rawPercent = targetGoal > 0 ? (currentRaised / targetGoal) * 100 : 0;
  const progressPercent =
    rawPercent > 0 && rawPercent < 0.01 ? '0.01' : Math.min(100, rawPercent).toFixed(2);

  const getStatusBadge = () => {
    const baseClasses =
      'inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md';
    switch (status) {
      case 'DRAFT':
        return (
          <span className={`${baseClasses} bg-slate-600`}>
            {currentLang === 'vi' ? 'Bản nháp' : 'Draft'}
          </span>
        );
      case 'PENDING':
        return (
          <span className={`${baseClasses} bg-orange-600 text-white`}>
            {currentLang === 'vi' ? 'Đang chờ' : 'Pending'}
          </span>
        );
      case 'APPROVED':
        return (
          <span className={`${baseClasses} bg-yellow-400 text-yellow-950 font-bold`}>
            {currentLang === 'vi' ? 'Đã duyệt' : 'Approved'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className={`${baseClasses} bg-sky-500`}>
            {currentLang === 'vi' ? 'Đang diễn ra' : 'In progress'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className={`${baseClasses} bg-red-600`}>
            {currentLang === 'vi' ? 'Đã từ chối' : 'Rejected'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`${baseClasses} bg-emerald-500`}>
            {currentLang === 'vi' ? 'Hoàn thành' : 'Completed'}
          </span>
        );
      default:
        return null;
    }
  };

  const getDaysLeftText = () => {
    if (status === 'COMPLETED') return currentLang === 'vi' ? 'Đã kết thúc' : 'Ended';
    // eslint-disable-next-line react-hooks/purity
    const diffTime = new Date(endDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0
      ? currentLang === 'vi'
        ? 'Đã kết thúc'
        : 'Ended'
      : currentLang === 'vi'
        ? `Còn ${diffDays} ngày`
        : `${diffDays} days left`;
  };

  const getPriorityBadge = (value: CampaignPriority) => {
    const baseClasses =
      'inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-md backdrop-blur-md';
    const config: Record<CampaignPriority, { label: string; className: string }> = {
      NORMAL: {
        label: currentLang === 'vi' ? 'Bình thường' : 'Normal',
        className: 'bg-emerald-100 text-emerald-900',
      },
      HIGH: {
        label: currentLang === 'vi' ? 'Cao' : 'High',
        className: 'bg-amber-200 text-amber-950',
      },
      URGENT: {
        label: currentLang === 'vi' ? 'Khẩn cấp' : 'Urgent',
        className: 'bg-red-200 text-red-900',
      },
    };

    return (
      <span className={`${baseClasses} ${config[value].className}`}>{config[value].label}</span>
    );
  };

  const creatorName = campaign.creatorName || (currentLang === 'vi' ? 'Ẩn danh' : 'Anonymous');
  const defaultActionSlot = canLeaveCampaign ? (
    <Button
      variant="destructive"
      className="h-11 flex-1 rounded-xl text-sm font-bold shadow-md"
      disabled={isLeaving}
      onClick={(event) => {
        event.stopPropagation();
        setConfirmLeaveOpen(true);
      }}
    >
      {isLeaving ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          {currentLang === 'vi' ? 'Đang rời...' : 'Leaving...'}
        </>
      ) : (
        <>
          <LogOut className="mr-1.5 h-4 w-4" />
          {currentLang === 'vi' ? 'Rời chiến dịch' : 'Leave'}
        </>
      )}
    </Button>
  ) : (
    <>
      {getDaysLeftText() !== 'Ended' &&
        getDaysLeftText() !== 'Đã kết thúc' &&
        campaign.status !== 'APPROVED' && (
          <Button
            className="h-11 flex-1 rounded-xl border-0 bg-white text-sm font-bold text-[#7c2d12] shadow-md transition-all duration-200 hover:bg-white/90"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/campaigns/${campaign.id}/donate`, { state: navigationState });
            }}
          >
            {currentLang === 'vi' ? 'Ủng hộ chiến dịch' : 'Support our cause'}
            <ArrowUpRight className="ml-1 h-4 w-4 stroke-[2.5]" />
          </Button>
        )}
      <button
        type="button"
        disabled={isToggling}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white backdrop-blur-sm transition-all duration-200 ${
          isFollowed ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
        }`}
        onClick={handleToggleFollow}
        title={isFollowed ? 'Unfollow' : 'Follow'}
      >
        <Bookmark className={`h-5 w-5 ${isFollowed ? 'fill-white text-white' : 'text-white'}`} />
      </button>
    </>
  );

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: the entire card is an interactive navigation target */}
      <div
        role="button"
        tabIndex={0}
        className={`group/card relative isolate mx-auto flex h-[420px] w-full max-w-[340px] [container-type:inline-size] flex-col justify-end overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-[transform,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none ${
          enableHoverScale
            ? 'hover:z-10 hover:scale-105 hover:shadow-[0_12px_30px_rgba(15,23,42,0.16)] motion-reduce:hover:scale-100'
            : ''
        }`}
        onClick={() => navigate(`/campaigns/${campaign.id}`, { state: navigationState })}
        onKeyDown={(event) => {
          if (
            (event.key === 'Enter' || event.key === ' ') &&
            event.target === event.currentTarget
          ) {
            navigate(`/campaigns/${campaign.id}`, { state: navigationState });
          }
        }}
      >
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,filter] group-hover/card:scale-[1.025] group-hover/card:blur-[1.5px] group-hover/card:brightness-75"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#5a453b]">
            <ImageIcon className="h-16 w-16 text-[#3d2e27] opacity-80" />
          </div>
        )}

        <div className="pointer-events-none absolute top-4 right-4 left-4 z-30 flex items-center justify-between">
          <div>{getStatusBadge()}</div>
          {priority && <div>{getPriorityBadge(priority)}</div>}
        </div>

        <div className="relative z-10 flex shrink-0 flex-col border-t border-black/5 bg-card p-4 text-card-foreground transition-opacity duration-300 ease-out group-hover/card:opacity-0">
          <h3 className="mb-3 line-clamp-1 break-words [overflow-wrap:anywhere] text-lg font-bold leading-snug tracking-tight text-foreground">
            {isFollowed && (
              <Heart className="mr-2 -mt-0.5 inline-block h-4 w-4 fill-red-500 text-red-500 align-middle" />
            )}
            {title}
          </h3>

          <div className="relative mb-3.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 whitespace-nowrap text-[clamp(0.7rem,4.5cqw,1rem)] tabular-nums">
            <div
              className="flex min-w-0 items-center gap-1.5 font-extrabold text-foreground"
              title={`Raised ${formatCurrency(currentRaised)}`}
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {(() => {
                  const { number, unit } = formatProgressCurrencyParts(currentRaised);
                  return (
                    <>
                      {number}
                      {unit && (
                        <span className="ml-0.5 text-[0.78em] font-semibold opacity-80">
                          {unit}
                        </span>
                      )}
                    </>
                  );
                })()}
              </span>
            </div>
            <div
              className="flex min-w-0 items-center justify-end gap-1.5 font-medium text-muted-foreground"
              title={`Target ${formatCurrency(targetGoal)}`}
            >
              <Target className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {(() => {
                  const { number, unit } = formatProgressCurrencyParts(targetGoal);
                  return (
                    <>
                      {number}
                      {unit && (
                        <span className="ml-0.5 text-[0.78em] font-normal opacity-80">{unit}</span>
                      )}
                    </>
                  );
                })()}
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 box-border flex h-full w-full flex-col justify-end overflow-hidden rounded-[inherit] bg-gradient-to-b from-black/35 via-black/45 to-black/85 p-4 text-white opacity-0 transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:pointer-events-auto group-hover/card:opacity-100">
          <div className="translate-y-2 space-y-3.5 pt-4 opacity-0 transition-[opacity,transform] delay-75 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] group-hover/card:translate-y-0 group-hover/card:opacity-100 motion-reduce:translate-y-0 motion-reduce:delay-0">
            <div className="flex flex-wrap gap-2">
              {categories && categories.length > 0 ? (
                <>
                  {categories.slice(0, 2).map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
                    >
                      {category.name}
                    </span>
                  ))}
                  {categories.length > 2 && (
                    <span
                      className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md"
                      title={categories
                        .slice(2)
                        .map((c) => c.name)
                        .join(', ')}
                    >
                      +{categories.length - 2}
                    </span>
                  )}
                </>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/20 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  Community
                </span>
              )}
            </div>

            {metaSlot ?? (
              <div className="space-y-1.5 pt-0.5 text-xs font-medium text-white/90">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
                    {campaign.creatorAvatarUrl ? (
                      <img
                        src={getMediaUrl(campaign.creatorAvatarUrl)}
                        alt={creatorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-white uppercase">
                        {creatorName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold truncate" title={creatorName}>
                    {creatorName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-white/90">
                  {createdAt && (
                    <div
                      className="flex items-center gap-2 text-white/80 min-w-0"
                      title={`Created: ${formatDate(createdAt)}`}
                    >
                      <div className="flex w-6 shrink-0 items-center justify-center">
                        <Calendar className="h-3.5 w-3.5 opacity-80" />
                      </div>
                      <span className="truncate">Created {formatDate(createdAt)}</span>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <Clock className="h-3.5 w-3.5 opacity-80 shrink-0" />
                    <span>{getDaysLeftText()}</span>
                  </div>
                </div>
              </div>
            )}

            <h3 className="break-words [overflow-wrap:anywhere] text-xl font-bold leading-snug tracking-tight text-white">
              {isFollowed && (
                <Heart className="mr-2 -mt-0.5 inline-block h-4 w-4 fill-red-500 text-red-500 align-middle" />
              )}
              {title}
            </h3>

            <div className="relative">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30 backdrop-blur-sm">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">{actionSlot ?? defaultActionSlot}</div>
          </div>
        </div>
      </div>
      <Dialog
        isOpen={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        title="Leave campaign?"
      >
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to leave{' '}
          <span className="font-semibold text-gray-900">"{title}"</span>? You will no longer be a
          volunteer for this campaign.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmLeaveOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isLeaving} onClick={handleLeaveCampaign}>
            {isLeaving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="mr-1.5 h-4 w-4" />
                Confirm Leave
              </>
            )}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
