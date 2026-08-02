import { AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import {
  CategoryMixChart,
  DashboardHeader,
  DashboardStatCards,
  PlatformActivityChart,
  RecentCampaignsList,
  RecentDonationsList,
} from '../components';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded-lg bg-gray-200" />
            <div className="h-4 w-96 rounded-lg bg-gray-100" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-36 rounded-xl bg-gray-200" />
            <div className="h-10 w-32 rounded-xl bg-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-72 rounded-2xl bg-gray-200" />
          <div className="lg:col-span-2 h-72 rounded-2xl bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-gray-200" />
          <div className="h-80 rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-600 mb-6">
          Failed to load dashboard data. Please try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  const { overview, recentDonations, recentCampaigns, categoryMix, monthlyActivity } = data;

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardStatCards overview={overview} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl bg-white border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <PlatformActivityChart data={monthlyActivity} />
        </div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: the full dashboard card is a navigation target */}
        <div
          className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:col-span-2"
          onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') navigate(ROUTES.ADMIN_CATEGORIES);
          }}
        >
          <CategoryMixChart data={categoryMix} totalCampaigns={overview.totalCampaigns} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDonationsList recentDonations={recentDonations} />
        <RecentCampaignsList recentCampaigns={recentCampaigns} />
      </div>
    </div>
  );
}
