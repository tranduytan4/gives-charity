export type NotificationType =
  | 'DONATION_CONFIRMED'
  | 'CAMPAIGN_DONATION_CONFIRMED'
  | 'CAMPAIGN_DONATION_SUMMARY'
  | 'CAMPAIGN_MILESTONE_REACHED'
  | 'CAMPAIGN_WHALE_DONATION'
  | 'CAMPAIGN_RESULT_POSTED'
  | 'CAMPAIGN_ANNOUNCEMENT'
  | 'ANNOUNCEMENT_REPLY'
  | 'TASK_ASSIGNED'
  | 'CAMPAIGN_STATUS_CHANGED'
  | 'CAMPAIGN_UNJOIN_REQUESTED'
  | 'CAMPAIGN_UNJOIN_APPROVED'
  | 'CAMPAIGN_UNJOIN_REJECTED';

export interface NotificationPayload {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}
