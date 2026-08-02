import { Calendar, PartyPopper } from 'lucide-react';
import type { CampaignResponse } from '@/features/campaign/types';
import type { CampaignResult } from '@/features/campaign/types/finalPost';
import { formatCurrency } from '@/shared/utils/currency';
import { parseUTCDate } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';

interface CampaignFinalReportHeaderProps {
  campaign: CampaignResponse;
  campaignResult: CampaignResult;
}

export function CampaignFinalReportHeader({
  campaign,
  campaignResult,
}: CampaignFinalReportHeaderProps) {
  const closedDate = campaign.endDate
    ? new Date(campaign.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const publishedDate = campaignResult.publishedAt
    ? parseUTCDate(campaignResult.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const goalPct = Math.round(campaignResult.goalPercent);
  // The bar's width can never visually exceed its track, but the number next to it must always
  // show the true percent — clamping both would silently hide overfunding from the reader.
  const barWidthPct = Math.min(100, goalPct);
  const raisedAmount = campaignResult.finalAmountRaised ?? campaignResult.totalRaised;

  const publisherName = campaignResult.publishedByName || campaign.creatorName;

  const authorInitials = publisherName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  const coverUrl = campaign.coverImageUrl ? getMediaUrl(campaign.coverImageUrl) : null;

  return (
    <>
      <style>{`
        @keyframes finalReportFadeIn {
          from { opacity: 0; transform: scale(1.05); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes finalReportSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes finalReportBarFill {
          from { width: 0%; }
        }
        @keyframes finalReportBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>

      <div
        className="relative rounded-3xl overflow-hidden mb-8 bg-slate-950 border border-slate-200/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        style={{ minHeight: '380px' }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={campaign.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ animation: 'finalReportFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-slate-900 to-slate-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />

        <div
          className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10"
          style={{ animation: 'finalReportSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
        >
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span
              className="inline-flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_2px_12px_rgba(16,185,129,0.3)] border border-emerald-400/25"
              style={{ animation: 'finalReportBadgePulse 3s ease-in-out infinite' }}
            >
              <PartyPopper className="w-3.5 h-3.5" />
              Campaign Completed
            </span>
            {campaign.categories?.map((cat) => (
              <span
                key={cat.id}
                className="bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 shadow-sm"
              >
                {cat.name}
              </span>
            ))}
            {closedDate && (
              <span className="inline-flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                <Calendar className="h-3.5 w-3.5" />
                Closed {closedDate}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 tracking-tight leading-tight max-w-3xl font-display">
            Final Report — {campaign.title}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-emerald-400/40">
              {authorInitials}
            </div>
            <p className="text-sm text-slate-300">
              <span className="text-white font-semibold">{publisherName}</span>
              {publishedDate && <span> published this report · {publishedDate}</span>}
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between mb-2.5 gap-4">
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-white leading-none">
                  {formatCurrency(raisedAmount)}
                </span>
                <p className="text-white/70 text-xs mt-1">
                  raised of{' '}
                  <span className="text-white/90 font-semibold">
                    {formatCurrency(campaign.target ?? 0)}
                  </span>{' '}
                  goal
                </p>
              </div>
              <span className="bg-white/15 backdrop-blur-md text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/20 shrink-0">
                {goalPct}% of goal
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                style={{
                  width: `${barWidthPct}%`,
                  animation: 'finalReportBarFill 1.2s cubic-bezier(0.4, 0, 0.2, 1) both',
                  animationDelay: '0.3s',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
