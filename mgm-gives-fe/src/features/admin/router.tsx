import type { RouteObject } from 'react-router-dom';
import { ProfilePage } from '@/features/profile';
import { AdminAppLayout } from '@/shared/layouts';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import {
  AdminCampaignDetailPage,
  AdminCampaignsPage,
  AdminDashboardPage,
  AdminReportsPage,
  AdminUsersPage,
  CategoriesPage,
} from './pages';
import AdminDonationManagement from './pages/AdminDonationManagement';

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminAppLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'donations',
        element: <AdminDonationManagement />,
      },
      {
        path: 'campaigns',
        element: <AdminCampaignsPage />,
      },
      {
        path: 'campaigns/:id',
        element: <AdminCampaignDetailPage />,
      },
      {
        path: 'reports',
        element: <AdminReportsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage isAdminRoute />,
      },
      {
        path: '*',
        element: <NotFoundPage backTo="/admin" backToText="Back to Admin Dashboard" />,
      },
    ],
  },
];
