import { Bell, Check, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteNotificationMutation,
  useInfiniteNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/notification/hooks';
import {
  localizeNotificationMessage,
  localizeNotificationTitle,
  localizeTimeAgo,
} from '@/shared/utils/localizeContent';
import { navigateNotification } from '@/shared/utils/navigation';

export default function NotificationsPage() {
  const { t, i18n } = useTranslation('notification');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const pageSize = 10;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteNotificationsQuery(pageSize);

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNotificationClick = (id: number, linkUrl: string | null, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
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

  const notifications = data?.pages.flatMap((page) => page.content) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {currentLang === 'vi'
              ? 'Hoạt động và các cập nhật mới nhất của bạn.'
              : 'Your activity and updates in one place.'}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/50 rounded-xl transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            disabled={markAllReadMutation.isPending}
          >
            <Check className="w-4 h-4" />
            {t('markAllAsRead')}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">
              {currentLang === 'vi' ? 'Đang tải thông báo...' : 'Loading notifications...'}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <Bell className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
            <p className="text-base font-semibold text-gray-900 mb-1">{t('noNotifications')}</p>
            <p className="text-sm max-w-xs text-gray-400">
              {currentLang === 'vi'
                ? 'Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới.'
                : 'We will notify you when something important happens.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-150">
            {/* List */}
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex justify-between items-start group transition-all duration-200 hover:bg-gray-50/50 px-6 py-4 ${
                    notification.isRead ? 'opacity-70' : 'bg-blue-50/10'
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
                    className="flex-1 min-w-0 text-left cursor-pointer focus:outline-none"
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm truncate ${
                            notification.isRead
                              ? 'font-semibold text-gray-700'
                              : 'font-bold text-gray-950'
                          }`}
                        >
                          {localizeNotificationTitle(notification.title, currentLang)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 leading-relaxed ${
                          notification.isRead
                            ? 'text-gray-500 font-normal'
                            : 'text-gray-700 font-medium'
                        }`}
                      >
                        {localizeNotificationMessage(notification.message, currentLang)}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">
                        {localizeTimeAgo(notification.createdAt, currentLang)}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center self-center pl-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-xl cursor-pointer"
                      title={currentLang === 'vi' ? 'Xóa thông báo' : 'Delete notification'}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite Scroll Loader Trigger */}
            <div
              ref={loadMoreRef}
              className={`py-6 flex justify-center items-center ${
                hasNextPage ? 'border-t border-gray-100 bg-gray-50/20' : ''
              }`}
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {currentLang === 'vi'
                      ? 'Đang tải thêm thông báo...'
                      : 'Loading more notifications...'}
                  </span>
                </div>
              ) : hasNextPage ? (
                <span className="text-xs font-medium text-gray-400 animate-pulse">
                  {currentLang === 'vi' ? 'Cuộn xuống để tải thêm' : 'Scroll down to load more'}
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-400 py-2">
                  {currentLang === 'vi'
                    ? 'Bạn đã xem hết tất cả thông báo.'
                    : "You've reached the end of your notifications."}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
