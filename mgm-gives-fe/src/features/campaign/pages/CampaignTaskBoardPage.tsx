import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useAuthUser } from '@/features/auth/hooks';
import { useCampaignDetails } from '@/features/campaign/hooks';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { TaskBoard } from '../components/tasks/TaskBoard';
import type { TaskUser } from '../types/campaignTask';

export default function CampaignTaskBoardPage() {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { campaignId } = useParams<{ campaignId: string }>();
  const { state } = useLocation();

  // Fetch campaign data from the API to display the title and resolve admin permissions
  const { data: response, isLoading, error } = useCampaignDetails(campaignId || '');
  const campaign = response?.result;

  const { data: user } = useAuthUser();

  // Determine admin access using the same logic as the rest of the application
  const isCampaignCreator = campaign?.creatorId && user?.id === campaign.creatorId;

  const isCampaignAdmin = !!isCampaignCreator || !!campaign?.campaignAdmin;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <NotFoundPage
        title={currentLang === 'vi' ? 'Không tìm thấy chiến dịch' : 'Campaign Not Found'}
        description={
          currentLang === 'vi'
            ? 'Chiến dịch yêu cầu không tồn tại hoặc bạn không có quyền xem các công việc của chiến dịch này.'
            : 'The requested campaign does not exist, or you do not have permission to view its tasks.'
        }
        backTo={ROUTES.CAMPAIGNS}
        backToText={currentLang === 'vi' ? 'Quay lại danh sách chiến dịch' : 'Back to Campaigns'}
      />
    );
  }

  // Map the authenticated user to the TaskUser shape expected by TaskBoard
  const currentUserMapped: TaskUser | null = user
    ? {
        id: user.id,
        fullName: user.fullName || user.email || 'Member',
        email: user.email || '',
        avatarUrl: user.avatarUrl || undefined,
        role: isCampaignAdmin ? 'CAMPAIGN_ADMIN' : 'VOLUNTEER',
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/60 via-zinc-50/30 to-slate-100/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-xs py-2 px-4 rounded-full border border-gray-100/50 w-fit shadow-[var(--shadow-card)]">
          <Link
            to={isCampaignCreator ? ROUTES.MY_CAMPAIGNS : ROUTES.CAMPAIGNS}
            className="hover:text-primary transition-all duration-200 font-medium"
          >
            {isCampaignCreator
              ? currentLang === 'vi'
                ? 'Chiến dịch của tôi'
                : 'My Campaigns'
              : currentLang === 'vi'
                ? 'Chiến dịch'
                : 'Campaigns'}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link
            to={ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaign.id))}
            state={state}
            className="hover:text-primary transition-all duration-200 font-medium truncate max-w-[200px]"
            title={campaign.title}
          >
            {campaign.title}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-semibold">
            {currentLang === 'vi' ? 'Quản lý công việc' : 'Task Board'}
          </span>
        </nav>

        {/* Task Board Component */}
        <TaskBoard
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          campaignStartDate={campaign.startDate}
          campaignEndDate={campaign.endDate}
          isCampaignAdmin={isCampaignAdmin}
          currentUser={currentUserMapped}
        />
      </div>
    </div>
  );
}
