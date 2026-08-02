import { Bell, Check, Trash2 } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  localizeNotificationMessage,
  localizeNotificationTitle,
  localizeTimeAgo,
} from '@/shared/utils/localizeContent';
import { navigateNotification } from '@/shared/utils/navigation';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks';

interface NotificationDropdownProps {
  onClose: () => void;
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'CAMPAIGN_ANNOUNCEMENT':
      return '📢';
    case 'ANNOUNCEMENT_REPLY':
      return '💬';
    case 'DONATION_CONFIRMED':
      return '💖';
    case 'CAMPAIGN_DONATION_CONFIRMED':
      return '🎉';
    case 'CAMPAIGN_RESULT_POSTED':
      return '📣';
    case 'CAMPAIGN_STATUS_CHANGED':
      return '🔔';
    case 'TASK_ASSIGNED':
      return '📋';
    case 'CAMPAIGN_UNJOIN_REQUESTED':
      return '⏳';
    case 'CAMPAIGN_UNJOIN_APPROVED':
      return '👋';
    case 'CAMPAIGN_UNJOIN_REJECTED':
      return '🙅';
    default:
      return '🔔';
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation('notification');
  const navigate = useNavigate();

  const { data, isLoading } = useNotificationsQuery(0, 5);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const handleNotificationClick = (id: number, linkUrl: string | null, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
    onClose();
    if (linkUrl) {
      navigateNotification(navigate, linkUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl py-1 z-50 ring-1 ring-black/5 border border-gray-100 divide-y divide-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium transition-colors cursor-pointer disabled:opacity-50"
          disabled={markAllReadMutation.isPending}
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          {t('markAllAsRead')}
        </button>
      </div>

      <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="px-4 py-8 text-sm text-gray-500 text-center flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            Loading...
          </div>
        ) : data?.content.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 flex flex-col items-center justify-center">
            <Bell className="w-8 h-8 mb-2 text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-medium">{t('noNotifications')}</p>
          </div>
        ) : (
          <div>
            {data?.content.map((notification) => (
              <div
                key={notification.id}
                className={`flex justify-between items-start group transition-colors hover:bg-gray-50/80 ${
                  notification.isRead ? 'opacity-70' : 'bg-blue-50/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.linkUrl,
                      notification.isRead,
                    )
                  }
                  className="flex-1 min-w-0 text-left px-4 py-3 cursor-pointer focus:outline-none"
                >
                  <div className="pr-2">
                    <p
                      className={`text-sm truncate ${
                        notification.isRead
                          ? 'font-medium text-gray-600'
                          : 'font-semibold text-gray-900'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}{' '}
                      {localizeNotificationTitle(notification.title, i18n.language)}
                    </p>
                    <p
                      className={`text-sm mt-0.5 line-clamp-2 ${
                        notification.isRead
                          ? 'font-normal text-gray-450'
                          : 'font-medium text-gray-700'
                      }`}
                    >
                      {localizeNotificationMessage(notification.message, i18n.language)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                      {localizeTimeAgo(notification.createdAt, i18n.language)}
                    </p>
                  </div>
                </button>
                <div className="py-3 pr-4 flex items-center self-stretch">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Delete notification"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && data && data.totalElements > 5 && (
        <div className="p-1.5 bg-gray-50/30">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/notifications');
            }}
            className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 rounded-lg transition-colors font-semibold cursor-pointer text-center"
          >
            {t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};
