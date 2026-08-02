import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CampaignResponse } from '@/features/campaign/types';
import type { DonationResponseData } from '@/features/donations/types/types';
import { formatCurrency } from '@/shared/utils/currency';

interface CampaignDetailProgressProps {
  campaign: CampaignResponse;
  donations?: DonationResponseData[];
}

function useProgressValues(campaign: CampaignResponse, donations: DonationResponseData[] = []) {
  const isMasked = donations.some(
    (donation) =>
      donation.type === 'MONEY' && donation.status === 'SUCCESSFUL' && donation.amount == null,
  );

  const confirmedRaisedAmount =
    donations.length === 0 || isMasked
      ? campaign.currentRaised || 0
      : donations.reduce((total, donation) => {
          if (donation.type !== 'MONEY' || donation.status !== 'SUCCESSFUL') {
            return total;
          }
          return total + Number(donation.amount || 0);
        }, 0);

  const goalAmount = campaign.target || 0;
  const remainingAmount = Math.max(0, goalAmount - confirmedRaisedAmount);
  const rawPercent = goalAmount > 0 ? (confirmedRaisedAmount / goalAmount) * 100 : 0;
  const progressPercent =
    rawPercent > 0 && rawPercent < 0.01 ? '0.01' : Math.min(100, rawPercent).toFixed(2);
  const isGoalReached = goalAmount > 0 && rawPercent >= 100;

  return {
    confirmedRaisedAmount,
    goalAmount,
    remainingAmount,
    progressPercent,
    rawPercent,
    isGoalReached,
  };
}

export function CampaignDetailProgress({ campaign, donations = [] }: CampaignDetailProgressProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const {
    confirmedRaisedAmount,
    goalAmount,
    remainingAmount,
    progressPercent,
    rawPercent,
    isGoalReached,
  } = useProgressValues(campaign, donations);

  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.min(100, rawPercent));
    }, 100);
    return () => clearTimeout(timer);
  }, [rawPercent]);

  return (
    <div className="mt-5 space-y-2 rounded-2xl border border-gray-150 bg-white p-5 shadow-xs transition-all">
      {/* Top Row: Percentage Raised & Current Amount Raised */}
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-blue-600">
          {progressPercent}% {currentLang === 'vi' ? 'đã đạt' : 'raised'}
        </span>
        <span
          className="text-gray-900 tabular-nums"
          title={`Raised ${formatCurrency(confirmedRaisedAmount)}`}
        >
          {formatCurrency(confirmedRaisedAmount)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100/70">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isGoalReached ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>

      {/* Bottom Row: Target Amount & Remaining Amount / Goal Reached */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-gray-500 font-medium pt-0.5">
        <span>
          {currentLang === 'vi' ? 'Mục tiêu: ' : 'Target: '}
          <strong className="text-gray-700 font-semibold">{formatCurrency(goalAmount)}</strong>
        </span>
        {isGoalReached ? (
          <span className="font-bold text-emerald-600">
            {currentLang === 'vi' ? 'Đã đạt mục tiêu 🎉' : 'Goal reached 🎉'}
          </span>
        ) : (
          <span>
            {currentLang === 'vi' ? 'Còn lại: ' : 'Remaining: '}
            <strong className="text-amber-600 font-semibold">
              {formatCurrency(remainingAmount)}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

export function CampaignHeroProgress({ campaign, donations = [] }: CampaignDetailProgressProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const { confirmedRaisedAmount, goalAmount, progressPercent, isGoalReached } = useProgressValues(
    campaign,
    donations,
  );

  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-blue-600">
          {progressPercent}% {currentLang === 'vi' ? 'đã đạt' : 'raised'}
        </span>
        <span className="text-gray-900 tabular-nums">{formatCurrency(confirmedRaisedAmount)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100/70">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isGoalReached ? 'bg-emerald-500' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(100, (confirmedRaisedAmount / (goalAmount || 1)) * 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 font-medium">
        {currentLang === 'vi' ? 'Mục tiêu: ' : 'Target: '}
        <strong className="text-gray-700 font-semibold">{formatCurrency(goalAmount)}</strong>
      </div>
    </div>
  );
}
