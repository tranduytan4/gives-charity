import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/ui/Badge';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { formatCompactNumber, formatFullCurrency } from '@/shared/utils/currency';
import type { AdminDashboardOverview } from '../types';

export function DashboardStatCards({ overview }: { overview: AdminDashboardOverview }) {
  const { t, i18n } = useTranslation('admin');
  const currentLang = i18n.language;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 place-items-stretch">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group block">
        <div className="flex items-center justify-center mb-3">
          <Badge className="bg-blue-50 text-blue-600 border-0 hover:bg-blue-50 text-[12px] font-medium tracking-wider px-2.5 py-0.5">
            {t('stats.totalUsers')}
          </Badge>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            {overview.totalEmployees}
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {overview.newUsersThisMonth > 0
              ? currentLang === 'vi'
                ? `+${overview.newUsersThisMonth} người mới trong tháng`
                : `+${overview.newUsersThisMonth} new this month`
              : currentLang === 'vi'
                ? 'Tất cả người dùng'
                : 'All active users'}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group block">
        <div className="flex items-center justify-center mb-3">
          <Badge className="bg-green-50 text-green-600 border-0 hover:bg-green-50 text-[12px] font-medium tracking-wider px-2.5 py-0.5">
            {t('stats.totalCampaigns')}
          </Badge>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
            {overview.totalCampaigns}
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {overview.pendingCampaigns > 0
              ? currentLang === 'vi'
                ? `${overview.pendingCampaigns} chờ duyệt`
                : `${overview.pendingCampaigns} pending`
              : currentLang === 'vi'
                ? 'Tất cả chiến dịch'
                : 'All campaigns'}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group block">
        <div className="flex items-center justify-center mb-3">
          <Badge className="bg-indigo-50 text-indigo-600 border-0 hover:bg-indigo-50 text-[12px] font-medium tracking-wider px-2.5 py-0.5">
            {t('stats.activeUsers')}
          </Badge>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
            {overview.activeCampaigns}
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {currentLang === 'vi' ? 'Chiến dịch đang diễn ra' : 'Running campaigns'}
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl bg-white border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group block @container">
        <div className="flex items-center justify-center mb-3">
          <Badge className="bg-yellow-50 text-yellow-600 border-0 hover:bg-yellow-50 text-[12px] font-medium tracking-wider px-2.5 py-0.5">
            {t('stats.totalDonated')}
          </Badge>
        </div>
        <div className="flex flex-col items-center">
          <Tooltip content={`Exact amount: ${formatFullCurrency(overview.totalDonation, 'VND')}`}>
            <h3
              className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-baseline justify-center gap-1.5 focus:outline-none cursor-default relative"
              aria-label={`Total donation: ${formatFullCurrency(overview.totalDonation, 'VND')}`}
            >
              <span>{formatCompactNumber(overview.totalDonation)}</span>
              <span className="text-xs md:text-sm font-semibold text-gray-400 shrink-0">VNĐ</span>
            </h3>
          </Tooltip>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {currentLang === 'vi'
              ? 'Quyên góp xác nhận trong năm'
              : 'Confirmed donations this year'}
          </p>
        </div>
      </div>
    </div>
  );
}
