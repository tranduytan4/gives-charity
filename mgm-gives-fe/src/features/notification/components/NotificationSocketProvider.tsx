import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';
import { useNotificationSocket } from '@/features/notification/hooks/useNotificationSocket.ts';
import type { NotificationPayload } from '@/features/notification/types/types.ts';
import { navigateNotification } from '@/shared/utils/navigation';

interface NotificationSocketProviderProps {
  children: ReactNode;
}

export function NotificationSocketProvider({ children }: NotificationSocketProviderProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useNotificationSocket((notification) => {
    const toastContent = getNotificationToastContent(notification);

    toast(toastContent.title, {
      description: toastContent.description,
      action: notification.linkUrl
        ? {
            label: 'View',
            onClick: () => navigateNotification(navigate, notification.linkUrl as string),
          }
        : undefined,
    });

    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    invalidateRelatedQueries(notification, queryClient);
  });

  return <>{children}</>;
}

function getNotificationToastContent(notification: NotificationPayload) {
  switch (notification.type) {
    case 'DONATION_CONFIRMED':
      return { title: `💖 ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_DONATION_CONFIRMED':
      return { title: `🎉 ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_RESULT_POSTED':
      return { title: `📣 ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_ANNOUNCEMENT':
      return {
        title: `📢 ${notification.title}`,
        description: `"${notification.message}"`,
      };

    case 'ANNOUNCEMENT_REPLY':
      return { title: `💬 ${notification.title}`, description: notification.message };

    case 'TASK_ASSIGNED':
      return { title: `📋 ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_UNJOIN_REQUESTED':
      return { title: `⏳ ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_UNJOIN_APPROVED':
      return { title: `👋 ${notification.title}`, description: notification.message };

    case 'CAMPAIGN_UNJOIN_REJECTED':
      return { title: `🙅 ${notification.title}`, description: notification.message };

    default:
      return { title: notification.title, description: notification.message };
  }
}

function invalidateRelatedQueries(notification: NotificationPayload, queryClient: QueryClient) {
  switch (notification.type) {
    case 'DONATION_CONFIRMED':
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.myDonations });
      queryClient.invalidateQueries({ queryKey: ['campaignDonations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      break;

    case 'CAMPAIGN_DONATION_CONFIRMED':
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.adminDonations });
      queryClient.invalidateQueries({ queryKey: ['campaignDonations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      break;

    case 'CAMPAIGN_RESULT_POSTED':
      queryClient.invalidateQueries({ queryKey: ['campaignResult'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      break;

    case 'CAMPAIGN_ANNOUNCEMENT':
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      break;

    case 'ANNOUNCEMENT_REPLY':
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      break;

    case 'TASK_ASSIGNED':
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks'] });
      break;

    case 'CAMPAIGN_UNJOIN_REQUESTED':
      queryClient.invalidateQueries({ queryKey: ['unjoin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      break;

    case 'CAMPAIGN_UNJOIN_APPROVED':
    case 'CAMPAIGN_UNJOIN_REJECTED':
      queryClient.invalidateQueries({ queryKey: ['joined-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      break;

    default:
      break;
  }
}
