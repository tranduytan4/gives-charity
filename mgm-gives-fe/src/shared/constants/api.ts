export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    OAUTH2_GOOGLE: 'oauth2/authorization/google',
    REGISTER: 'auth/register',
    LOGOUT: 'auth/logout',
    ME: 'auth/me',
    VERIFY_EMAIL: 'auth/verify',
    RESEND_ACTIVATION: 'auth/resend-activation',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    REFRESH: 'auth/refresh',
    UPDATE_PROFILE: 'auth/profile',
    CHANGE_PASSWORD: 'auth/change-password',
  },
  ADMIN_CATEGORIES: {
    BASE: 'admin/categories',
  },
  ADMIN_CAMPAIGNS: {
    BASE: 'admin/campaigns',
    APPROVE: (id: number) => `admin/campaigns/${id}/approve`,
    REJECT: (id: number) => `admin/campaigns/${id}/reject`,
  },
  ADMIN_USERS: {
    BASE: 'admin/users',
    IMPORT_CSV: 'admin/users/import-csv',
  },
  CATEGORY: {
    LIST: 'categories',
  },
  CAMPAIGN: {
    BASE: 'campaigns',
    MEDIA: 'media',
    MEDIA_CAMPAIGN: 'media/campaign',
    MEDIA_COVER: 'media/campaign/cover',
    RESULT: (id: number) => `campaigns/${id}/result`,
    RESULT_GENERATE: (id: number) => `campaigns/${id}/result/generate`,
    RESULT_PDF: (id: number) => `campaigns/${id}/result/pdf`,
  },
  PUBLIC_CAMPAIGN: {
    BASE: 'public/campaigns',
  },
  ANNOUNCEMENTS: {
    BASE: (campaignId: number) => `campaigns/${campaignId}/announcements`,
    DETAIL: (campaignId: number, announcementId: number) =>
      `campaigns/${campaignId}/announcements/${announcementId}`,
    LIKE: (campaignId: number, announcementId: number) =>
      `campaigns/${campaignId}/announcements/${announcementId}/like`,
    REPLIES: (campaignId: number, announcementId: number) =>
      `campaigns/${campaignId}/announcements/${announcementId}/replies`,
    REPLY_DETAIL: (campaignId: number, announcementId: number, replyId: number) =>
      `campaigns/${campaignId}/announcements/${announcementId}/replies/${replyId}`,
  },
  NOTIFICATIONS: {
    BASE: 'notifications',
    READ: (id: number) => `notifications/${id}/read`,
    READ_ALL: 'notifications/read-all',
    DELETE: (id: number) => `notifications/${id}`,
    UNREAD_COUNT: 'notifications/unread-count',
  },
};
