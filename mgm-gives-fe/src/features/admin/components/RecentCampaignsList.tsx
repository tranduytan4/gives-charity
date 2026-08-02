import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/Badge';
import { ROUTES } from '@/shared/constants/routes';
import type { RecentCampaignItem } from '../types';

export function RecentCampaignsList({
  recentCampaigns,
}: {
  recentCampaigns: RecentCampaignItem[];
}) {
  const { i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const navigate = useNavigate();

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: currentLang === 'vi' ? 'Bản nháp' : 'Draft',
          className: 'bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-100',
        };
      case 'PENDING':
        return {
          label: currentLang === 'vi' ? 'Đang chờ duyệt' : 'Pending',
          className:
            'bg-orange-100 text-orange-800 border border-orange-300/60 hover:bg-orange-100',
        };
      case 'APPROVED':
        return {
          label: currentLang === 'vi' ? 'Đã duyệt' : 'Approved',
          className:
            'bg-yellow-100 text-yellow-800 border border-yellow-300/60 hover:bg-yellow-100',
        };
      case 'IN_PROGRESS':
        return {
          label: currentLang === 'vi' ? 'Đang diễn ra' : 'In Progress',
          className: 'bg-sky-50 text-sky-700 border border-sky-200/60 hover:bg-sky-50',
        };
      case 'COMPLETED':
        return {
          label: currentLang === 'vi' ? 'Hoàn thành' : 'Completed',
          className: 'bg-green-50 text-green-700 border border-green-200/60 hover:bg-green-50',
        };
      case 'REJECTED':
        return {
          label: currentLang === 'vi' ? 'Đã từ chối' : 'Rejected',
          className: 'bg-red-50 text-red-700 border border-red-200/60 hover:bg-red-50',
        };
      default:
        return {
          label: status,
          className: '',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight">
          {currentLang === 'vi' ? 'Chiến dịch gần đây' : 'Recent campaigns'}
        </h3>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_CAMPAIGNS)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer transition-colors duration-200"
        >
          {currentLang === 'vi' ? 'Xem tất cả' : 'View all'}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 divide-y divide-gray-50">
        {recentCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            {currentLang === 'vi' ? 'Chưa có chiến dịch nào.' : 'No campaigns yet.'}
          </div>
        ) : (
          recentCampaigns.map((campaign) => {
            const statusBadge = getStatusBadgeConfig(campaign.status);
            return (
              <button
                key={campaign.id}
                type="button"
                className="w-full text-left flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
                onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[260px]">
                    {campaign.title}
                  </p>
                  <p className="text-[12px] text-gray-400 font-medium">
                    {campaign.categoryName}{' '}
                    <span className="text-gray-300">· {campaign.creatorName}</span>
                  </p>
                </div>
                <Badge className={`text-[11px] font-semibold shrink-0 ${statusBadge.className}`}>
                  {statusBadge.label}
                </Badge>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
