import type { RouteObject } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import BrowseCampaignPage from './pages/BrowseCampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';

export const campaignRoutes: RouteObject[] = [
  {
    path: ROUTES.CAMPAIGNS,
    element: <BrowseCampaignPage />,
  },
  {
    path: ROUTES.CAMPAIGN_DETAIL,
    element: <CampaignDetailPage />,
  },
];
