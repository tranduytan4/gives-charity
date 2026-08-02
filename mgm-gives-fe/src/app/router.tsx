import { createBrowserRouter, Navigate } from 'react-router-dom';
import { adminRoutes } from '@/features/admin/router';
import { AnnouncementDetailPage } from '@/features/announcement';
import { useAuthUser } from '@/features/auth/hooks';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import VerifyEmailSentPage from '@/features/auth/pages/VerifyEmailSentPage';
import { authRoutes } from '@/features/auth/routes';
import {
  BrowseCampaignPage,
  CampaignDetailApprovalsPage,
  CampaignDetailPage,
  CampaignDonationPage,
  CampaignTaskBoardPage,
  CampaignUnjoinRequestsPage,
} from '@/features/campaign';
import CampaignFinalReportPage from '@/features/campaign/pages/CampaignFinalReportPage';
import CampaignFormPage from '@/features/campaign/pages/CampaignFormPage';
import MyCampaignsPage from '@/features/campaign/pages/MyCampaignsPage';
import { JoinedCampaignsPage } from '@/features/campaign_member/pages/JoinedCampaignsPage';
import { DashboardPage } from '@/features/dashboard';
import MyDonationsPage from '@/features/donations/pages/MyDonationsPage';
import LandingPage from '@/features/landing/pages/LandingPage';
import { ProfilePage } from '@/features/profile';
import GuestRoute from '@/shared/components/GuestRoute';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import PublicRoute from '@/shared/components/PublicRoute';
import RootNotFoundRedirect from '@/shared/components/RootNotFoundRedirect';
import { ROUTES } from '@/shared/constants/routes';
import { AppLayout } from '@/shared/layouts';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import NotificationsPage from '@/shared/layouts/NotificationsPage';
import SettingsPage from '@/shared/layouts/SettingsPage';

const AuthAwareLandingPage = () => {
  const { data: user, isLoading } = useAuthUser();
  const storedRedirect = window.localStorage.getItem('mgmGivesAuthRedirect');
  const safeStoredRedirect =
    storedRedirect?.startsWith('/') && !storedRedirect.startsWith('//') ? storedRedirect : null;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (user) {
    if (safeStoredRedirect && user.role !== 'ADMIN') {
      window.localStorage.removeItem('mgmGivesAuthRedirect');
      return <Navigate to={safeStoredRedirect} replace />;
    }
    return <Navigate to={user.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD} replace />;
  }

  return <LandingPage />;
};

export const router = createBrowserRouter([
  // Public routes: accessible by anyone
  {
    element: <PublicRoute />,
    children: [
      { path: ROUTES.DEFAULT, element: <AuthAwareLandingPage /> },
      { path: ROUTES.VERIFY_EMAIL, element: <VerifyEmailPage /> },
      { path: ROUTES.VERIFY_EMAIL_SENT, element: <VerifyEmailSentPage /> },
      { path: ROUTES.PUBLIC_CAMPAIGN_DETAIL, element: <CampaignDetailPage publicMode /> },
    ],
  },

  // Guest routes: redirect authenticated users to their home page
  {
    element: <GuestRoute />,
    children: authRoutes,
  },

  // Protected routes: require authentication
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            // Redirect root → /dashboard
            path: '/',
            element: <Navigate to={ROUTES.DASHBOARD} replace />,
          },
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },
          {
            path: ROUTES.CAMPAIGNS,
            element: <BrowseCampaignPage />,
          },
          {
            path: ROUTES.CAMPAIGN_DETAIL,
            element: <CampaignDetailPage />,
          },
          {
            path: ROUTES.CAMPAIGN_TASKS,
            element: <CampaignTaskBoardPage />,
          },
          {
            path: ROUTES.CAMPAIGN_DONATE,
            element: <CampaignDonationPage />,
          },
          {
            path: ROUTES.CAMPAIGN_APPROVALS,
            element: <CampaignDetailApprovalsPage />,
          },
          {
            path: ROUTES.CAMPAIGN_UNJOIN_REQUESTS,
            element: <CampaignUnjoinRequestsPage />,
          },
          {
            path: ROUTES.CAMPAIGN_RESULT,
            element: <CampaignFinalReportPage />,
          },
          {
            path: ROUTES.CAMPAIGN_ANNOUNCEMENT_DETAIL,
            element: <AnnouncementDetailPage />,
          },
          {
            path: ROUTES.MY_CAMPAIGNS,
            element: <MyCampaignsPage />,
          },
          {
            path: ROUTES.CREATE_CAMPAIGN,
            element: <CampaignFormPage />,
          },
          {
            path: ROUTES.EDIT_CAMPAIGN,
            element: <CampaignFormPage />,
          },
          {
            path: ROUTES.JOINED_CAMPAIGNS,
            element: <JoinedCampaignsPage />,
          },
          {
            path: ROUTES.NOTIFICATIONS,
            element: <NotificationsPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
          },
          {
            path: ROUTES.INTEGRATION_SETTINGS,
            element: <SettingsPage />,
          },
          {
            path: ROUTES.MY_DONATIONS,
            element: <MyDonationsPage />,
          },
          {
            path: 'not-found',
            element: <NotFoundPage backTo={ROUTES.DASHBOARD} backToText="Back to Dashboard" />,
          },
        ],
      },
    ],
  },

  // Admin-only routes: require authentication + ADMIN role
  {
    element: <ProtectedRoute adminOnly />,
    children: adminRoutes,
  },

  // Root fallback for unauthenticated users & invalid paths
  {
    path: '*',
    element: <RootNotFoundRedirect />,
  },
]);
