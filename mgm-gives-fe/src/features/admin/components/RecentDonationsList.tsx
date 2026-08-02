import { ArrowRight, ChevronDown, ChevronUp, Coins, Gift } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { formatVND } from '@/shared/utils/currency';
import { localizeDonationStatus, localizeShortDate } from '@/shared/utils/localizeContent';
import type { RecentDonationItem } from '../types';

function DonationRow({ donation }: { donation: RecentDonationItem }) {
  const { i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const [isExpanded, setIsExpanded] = useState(false);

  const donorDisplayName = donation.donorName?.trim()
    ? donation.donorName
    : donation.isAnonymous
      ? currentLang === 'vi'
        ? 'Người dùng ẩn danh'
        : 'Anonymous Supporter'
      : currentLang === 'vi'
        ? 'Người quyên góp'
        : 'Community Donor';

  const goodsItems = donation.detail
    ? donation.detail
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const hasMultipleGoods = donation.type === 'GOODS' && goodsItems.length > 1;

  return (
    <div className="group border-b border-gray-50 last:border-b-0">
      {/* Vertically centered main row */}
      <div className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors duration-150 gap-4 min-w-0">
        {/* Left Side: Icon + Name & Email */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
              donation.type === 'MONEY'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                : 'bg-amber-50 text-amber-600 border border-amber-100/60'
            }`}
          >
            {donation.type === 'MONEY' ? (
              <Coins className="h-4.5 w-4.5" />
            ) : (
              <Gift className="h-4.5 w-4.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-gray-900 truncate leading-snug"
              title={donorDisplayName}
            >
              {donorDisplayName}
            </p>
            {donation.donorEmail && (
              <p className="text-[12px] text-gray-400 font-medium truncate leading-snug">
                {donation.donorEmail}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Vertically centered relative to Name & Email! */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Donation Value (Money amount or Goods summary) */}
          {donation.type === 'MONEY' ? (
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {formatVND(Number(donation.amount ?? 0))}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[170px]"
                title={
                  goodsItems[0] || donation.detail || (currentLang === 'vi' ? 'Hiện vật' : 'Goods')
                }
              >
                {goodsItems[0] || donation.detail || (currentLang === 'vi' ? 'Hiện vật' : 'Goods')}
              </span>

              {hasMultipleGoods && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    isExpanded
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  +{goodsItems.length - 1} {currentLang === 'vi' ? 'thêm' : 'more'}
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
              donation.status === 'SUCCESSFUL'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                : donation.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
                  : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
            }`}
          >
            {localizeDonationStatus(donation.status, currentLang)}
          </span>

          {/* Date formatted inline */}
          <span className="text-[11px] text-gray-400 font-medium shrink-0 w-24 text-right">
            {localizeShortDate(donation.createdAt, currentLang)}
          </span>
        </div>
      </div>

      {/* Expandable Breakdown Drawer for Goods */}
      {hasMultipleGoods && isExpanded && (
        <div className="mx-6 mb-3 p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl space-y-2 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 tracking-wide uppercase">
            <span>
              {currentLang === 'vi'
                ? `Chi tiết hiện vật quyên góp (${goodsItems.length} món)`
                : `Donated Goods Breakdown (${goodsItems.length} items)`}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-0.5 cursor-pointer lowercase"
            >
              {currentLang === 'vi' ? 'đóng' : 'close'} <ChevronUp className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {goodsItems.map((item) => (
              <span
                key={item}
                className="bg-white text-amber-950 border border-amber-200/80 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecentDonationsList({
  recentDonations,
}: {
  recentDonations: RecentDonationItem[];
}) {
  const { i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'MONEY' | 'GOODS'>('ALL');

  const filteredDonations = recentDonations.filter((d) => {
    if (filter === 'ALL') return true;
    return d.type === filter;
  });

  const tabLabels: Record<'ALL' | 'MONEY' | 'GOODS', string> = {
    ALL: currentLang === 'vi' ? 'Tất cả' : 'All',
    MONEY: currentLang === 'vi' ? 'Tiền' : 'Money',
    GOODS: currentLang === 'vi' ? 'Hiện vật' : 'Goods',
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-50 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight">
          {currentLang === 'vi' ? 'Quyên góp gần đây' : 'Recent donations'}
        </h3>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-gray-100/80 rounded-full p-1 text-xs font-medium">
            {(['ALL', 'MONEY', 'GOODS'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer font-semibold ${
                  filter === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_DONATIONS)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer transition-colors duration-200"
          >
            {currentLang === 'vi' ? 'Xem tất cả' : 'View all'}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex-1 divide-y divide-gray-50 overflow-hidden">
        {filteredDonations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            {currentLang === 'vi'
              ? 'Không có khoản quyên góp nào phù hợp với bộ lọc.'
              : 'No donations match this filter.'}
          </div>
        ) : (
          filteredDonations.map((donation) => <DonationRow key={donation.id} donation={donation} />)
        )}
      </div>
    </div>
  );
}
