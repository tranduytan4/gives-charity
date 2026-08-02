import DOMPurify from 'dompurify';
import {
  CheckSquare,
  Eye,
  FileText,
  Images,
  Package,
  Share2,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnnouncementShareDialog } from '@/features/announcement/components/AnnouncementShareDialog';
import { CampaignDetailSupporters } from '@/features/campaign';
import type { CampaignResponse } from '@/features/campaign/types';
import type { CampaignResult } from '@/features/campaign/types/finalPost';
import { Fancybox } from '@/shared/components/ui/Fancybox';
import { API_ENDPOINTS } from '@/shared/constants/api';
import { ROUTES } from '@/shared/constants/routes';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import { getMediaKind } from '../constants/media';
import { useCampaignDonations } from '../hooks';

interface CampaignFinalReportBodyProps {
  campaign: CampaignResponse;
  campaignResult: CampaignResult;
  isCampaignAdmin: boolean;
}

interface InfoCardProps {
  icon: React.ReactNode;
  accent: string;
  title: string;
  children: React.ReactNode;
}

// Shared visual language for the narrative sections below (goods, acknowledgements, task
// work) — a colored icon badge + heading + body, so each field reads as part of one system
// instead of three independently-styled blocks.
function InfoCard({ icon, accent, title, children }: InfoCardProps) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-5 ${accent}`}>
      <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-xs">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold mb-1">{title}</p>
        <div className="text-sm leading-relaxed whitespace-pre-line opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function CampaignFinalReportBody({
  campaign,
  campaignResult,
  isCampaignAdmin,
}: CampaignFinalReportBodyProps) {
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const donationsProps = useCampaignDonations(String(campaign.id));

  const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const pdfUrl = `${apiBaseUrl}/${API_ENDPOINTS.CAMPAIGN.RESULT_PDF(campaign.id)}`;

  const galleryMedia = (campaignResult.media ?? []).filter((m) => !m.isCover && !!m.url);

  return (
    <div className="space-y-6">
      {/* Main summary */}
      {campaignResult.resultSummary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8">
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2 first:[&_h3]:mt-0
              [&_ul]:space-y-2 [&_ul]:pl-0 [&_ul]:list-none
              [&_ul_li]:flex [&_ul_li]:items-baseline [&_ul_li]:gap-2
              [&_ul_li]:before:content-['✅'] [&_ul_li]:before:shrink-0 [&_ul_li]:before:text-[0.85em]
              [&_ol]:list-decimal [&_ol]:pl-5
              [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-gray-900"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: content sanitized
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaignResult.resultSummary) }}
          />
        </div>
      )}

      {/* Goods & items */}
      {campaignResult.itemsSummary && (
        <InfoCard
          icon={<Package className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50/70 border-blue-100 text-blue-900"
          title="Goods & Items"
        >
          {campaignResult.itemsSummary}
        </InfoCard>
      )}

      {/* Acknowledgements */}
      {campaignResult.acknowledgements && (
        <InfoCard
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-50/70 border-emerald-100 text-emerald-900"
          title="Acknowledgements"
        >
          {campaignResult.acknowledgements}
        </InfoCard>
      )}

      {/* Supporters — embedded directly so readers don't have to leave the report. No extra
          section heading here: CampaignDetailSupporters' own Ledger/Wall tab pill already
          serves as the header, and hiding it would lock the panel to one tab with no way to
          switch (that prop only works elsewhere because the caller renders two fixed instances,
          one pinned to each tab). */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        {donationsProps.loadingDonations ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <CampaignDetailSupporters {...donationsProps} isCampaignAdmin={isCampaignAdmin} />
        )}
      </section>

      {/* Task & volunteer work summary */}
      {campaignResult.taskSummary && (
        <InfoCard
          icon={<CheckSquare className="h-5 w-5 text-violet-600" />}
          accent="bg-violet-50/70 border-violet-100 text-violet-900"
          title="Task & Volunteer Work"
        >
          {campaignResult.taskSummary}
        </InfoCard>
      )}

      {/* Fund usage */}
      {campaignResult.spendingItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Fund Usage</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total Spent
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatCurrency(campaignResult.totalSpent)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Remaining Funds
              </p>
              <p
                className={`mt-1 text-lg font-bold ${campaignResult.remainingFunds < 0 ? 'text-red-600' : 'text-gray-900'}`}
              >
                {formatCurrency(campaignResult.remainingFunds)}
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {campaignResult.spendingItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(item.spentAt)}</p>
                  {item.photos.length > 0 && (
                    <Fancybox options={{ Carousel: { infinite: false } }}>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.photos.map((photo) => (
                          <a
                            key={photo.id}
                            href={getMediaUrl(photo.url)}
                            data-fancybox={`spending-${item.id}`}
                            className="block h-14 w-14 cursor-zoom-in"
                          >
                            <img
                              src={getMediaUrl(photo.url)}
                              alt="Spending proof"
                              className="h-14 w-14 rounded-lg border border-gray-100 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </Fancybox>
                  )}
                </div>
                <span className="shrink-0 text-sm font-bold text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Gallery */}
      {galleryMedia.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Images className="h-5 w-5 text-gray-400" />
            Moments from the field
          </h2>
          <Fancybox options={{ Carousel: { infinite: false } }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryMedia.map((media) => {
                const rawUrl = media.url;
                const srcUrl = getMediaUrl(rawUrl);
                const kind = getMediaKind(media.mediaType, rawUrl);
                const isVideo = kind === 'video';
                const isPdf = kind === 'pdf';

                if (isVideo) {
                  return (
                    <div
                      key={media.id}
                      className="relative aspect-video rounded-xl overflow-hidden bg-black"
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
                      key={media.id}
                      href={srcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-red-50 flex flex-col items-center justify-center gap-1.5 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-xs font-medium">View PDF</span>
                    </a>
                  );
                }

                return (
                  <a
                    key={media.id}
                    data-fancybox="final-gallery"
                    href={srcUrl}
                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-zoom-in group transition-all duration-300 hover:shadow-md"
                  >
                    <img
                      src={srcUrl}
                      alt="Field moment"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/90 text-gray-800 shadow-sm">
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </Fancybox>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          Share this report
        </button>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-4 w-4" />
          View PDF
        </a>
        <button
          type="button"
          onClick={() => navigate(ROUTES.CAMPAIGNS)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          ❤️ Explore active campaigns
        </button>
      </div>

      <p className="text-xs text-gray-400 pt-2">
        Questions about this final report? Contact{' '}
        <span className="font-medium text-gray-600">{campaign.creatorName}</span>.
      </p>

      <AnnouncementShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={window.location.href}
        announcementTitle={`Final Report — ${campaign.title}`}
        dialogTitle="Share Final Report"
        imageUrl={campaign.coverImageUrl ? getMediaUrl(campaign.coverImageUrl) : undefined}
      />
    </div>
  );
}
