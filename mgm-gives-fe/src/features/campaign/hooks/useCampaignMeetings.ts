import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { campaignApi } from '../api/campaignApi';
import type {
  CampaignMeetingView,
  CreateCampaignMeetingRequest,
  UpdateCampaignMeetingNotesRequest,
  UpdateCampaignMeetingRequest,
} from '../types';

export const MEETING_TIME_CONFLICT_MESSAGE =
  'This campaign already has a meeting scheduled during this time.';
const MEETING_STATUS_REFETCH_INTERVAL_MS = 30_000;

type ApiErrorLike = {
  code?: unknown;
  errorCode?: unknown;
  message?: unknown;
  response?: {
    data?: {
      code?: unknown;
      errorCode?: unknown;
      message?: unknown;
    };
  };
};

const getErrorPayloads = (error: unknown) => {
  if (!error || typeof error !== 'object') return [];

  const apiError = error as ApiErrorLike;
  return [apiError, apiError.response?.data].filter(Boolean);
};

export const isMeetingTimeConflictError = (error: unknown) => {
  return getErrorPayloads(error).some((payload) => {
    const code = payload?.code;
    const errorCode = payload?.errorCode;
    const message = typeof payload?.message === 'string' ? payload.message : '';

    return (
      code === 4004 ||
      code === '4004' ||
      code === 'MEETING_TIME_CONFLICT' ||
      errorCode === 'MEETING_TIME_CONFLICT' ||
      message.toLowerCase().includes(MEETING_TIME_CONFLICT_MESSAGE.toLowerCase())
    );
  });
};

const getRawErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object') return null;

  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  const responseMessage = (error as { response?: { data?: { message?: unknown } } }).response?.data
    ?.message;
  return typeof responseMessage === 'string' ? responseMessage : null;
};

const sanitizeMeetingErrorMessage = (message: string, fallback: string) => {
  const lowerMessage = message.toLowerCase();
  const hasProviderPayload =
    message.includes('{') ||
    message.includes('}') ||
    lowerMessage.includes('trackingid') ||
    lowerMessage.includes('"errors"') ||
    lowerMessage.includes('malformed syntax');

  if (
    lowerMessage.includes('webex_not_connected') ||
    lowerMessage.includes('connect your webex account')
  ) {
    return 'Please connect your Webex account before creating a meeting.';
  }

  if (!hasProviderPayload) return message;

  if (
    lowerMessage.includes('duration') ||
    lowerMessage.includes('shorter than 10') ||
    lowerMessage.includes('less than 10')
  ) {
    return 'Meeting must be at least 10 minutes long.';
  }

  if (lowerMessage.includes('failed to create webex meeting')) {
    return 'Unable to create the meeting. Please check the start and end time, then try again.';
  }

  if (lowerMessage.includes('failed to update webex meeting')) {
    return 'Unable to update the meeting. Please check the start and end time, then try again.';
  }

  if (lowerMessage.includes('failed to cancel webex meeting')) {
    return 'Unable to cancel the meeting. Please try again later.';
  }

  return fallback;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isMeetingTimeConflictError(error)) {
    return MEETING_TIME_CONFLICT_MESSAGE;
  }

  const message = getRawErrorMessage(error);
  if (message) {
    return sanitizeMeetingErrorMessage(message, fallback);
  }
  return fallback;
};

export const campaignMeetingKeys = {
  lists: (campaignId: number) => ['campaignMeetings', campaignId] as const,
  list: (campaignId: number, view: CampaignMeetingView) =>
    ['campaignMeetings', campaignId, view] as const,
  detail: (campaignId: number, meetingId: number) =>
    ['campaignMeeting', campaignId, meetingId] as const,
  invitedMembers: (campaignId: number, meetingId: number) =>
    ['campaignMeetingInvitedMembers', campaignId, meetingId] as const,
  notes: (campaignId: number, meetingId: number) =>
    ['campaignMeetingNotes', campaignId, meetingId] as const,
  activity: (campaignId: number, meetingId: number) =>
    ['campaignMeetingActivity', campaignId, meetingId] as const,
  attachments: (campaignId: number, meetingId: number) =>
    ['campaignMeetingAttachments', campaignId, meetingId] as const,
  recipients: (campaignId: number) => ['campaignMeetingRecipients', campaignId] as const,
};

export const useCampaignMeetings = (
  campaignId?: number,
  view: CampaignMeetingView = 'upcoming',
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.list(campaignId ?? 0, view),
    queryFn: () => campaignApi.getCampaignMeetings(campaignId as number, view),
    enabled: !!campaignId,
    refetchInterval: MEETING_STATUS_REFETCH_INTERVAL_MS,
  });
};

export const useCampaignMeeting = (
  campaignId?: number,
  meetingId?: number | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.detail(campaignId ?? 0, meetingId ?? 0),
    queryFn: () => campaignApi.getCampaignMeeting(campaignId as number, meetingId as number),
    enabled: !!campaignId && !!meetingId && enabled,
    refetchInterval: enabled ? MEETING_STATUS_REFETCH_INTERVAL_MS : false,
  });
};

export const useCampaignMeetingRecipients = (campaignId?: number, enabled = false) => {
  return useQuery({
    queryKey: campaignMeetingKeys.recipients(campaignId ?? 0),
    queryFn: () => campaignApi.getCampaignMeetingRecipients(campaignId as number),
    enabled: !!campaignId && enabled,
  });
};

export const useCampaignMeetingInvitedMembers = (
  campaignId?: number,
  meetingId?: number | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.invitedMembers(campaignId ?? 0, meetingId ?? 0),
    queryFn: () =>
      campaignApi.getCampaignMeetingInvitedMembers(campaignId as number, meetingId as number),
    enabled: !!campaignId && !!meetingId && enabled,
  });
};

export const useCampaignMeetingNotes = (
  campaignId?: number,
  meetingId?: number | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.notes(campaignId ?? 0, meetingId ?? 0),
    queryFn: () => campaignApi.getCampaignMeetingNotes(campaignId as number, meetingId as number),
    enabled: !!campaignId && !!meetingId && enabled,
  });
};

export const useCampaignMeetingActivity = (
  campaignId?: number,
  meetingId?: number | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.activity(campaignId ?? 0, meetingId ?? 0),
    queryFn: () =>
      campaignApi.getCampaignMeetingActivity(campaignId as number, meetingId as number),
    enabled: !!campaignId && !!meetingId && enabled,
  });
};

export const useCampaignMeetingAttachments = (
  campaignId?: number,
  meetingId?: number | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: campaignMeetingKeys.attachments(campaignId ?? 0, meetingId ?? 0),
    queryFn: () =>
      campaignApi.getCampaignMeetingAttachments(campaignId as number, meetingId as number),
    enabled: !!campaignId && !!meetingId && enabled,
  });
};

export const useCreateCampaignMeeting = (campaignId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignMeetingRequest) =>
      campaignApi.createCampaignMeeting(campaignId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignMeetingKeys.lists(campaignId) });
      toast.success('Meeting created successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create meeting.'));
    },
  });
};

export const useUpdateCampaignMeeting = (campaignId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      payload,
    }: {
      meetingId: number;
      payload: UpdateCampaignMeetingRequest;
    }) => campaignApi.updateCampaignMeeting(campaignId, meetingId, payload),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: campaignMeetingKeys.lists(campaignId) });
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.detail(campaignId, meeting.id),
      });
      toast.success('Meeting updated successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update meeting.'));
    },
  });
};

export const useCancelCampaignMeeting = (campaignId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: number) => campaignApi.cancelCampaignMeeting(campaignId, meetingId),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: campaignMeetingKeys.lists(campaignId) });
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.detail(campaignId, meeting.id),
      });
      toast.success('Meeting cancelled successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to cancel meeting.'));
    },
  });
};

export const useUpdateCampaignMeetingNotes = (campaignId: number, meetingId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCampaignMeetingNotesRequest) =>
      campaignApi.updateCampaignMeetingNotes(campaignId, meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.notes(campaignId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.activity(campaignId, meetingId),
      });
      toast.success('Meeting notes saved successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to save meeting notes.'));
    },
  });
};

export const useUploadCampaignMeetingAttachment = (campaignId: number, meetingId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) =>
      Promise.allSettled(
        files.map((file) =>
          campaignApi.uploadCampaignMeetingAttachment(campaignId, meetingId, file),
        ),
      ),
    onSuccess: (attachments) => {
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.attachments(campaignId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.activity(campaignId, meetingId),
      });

      const fulfilled = attachments.filter((attachment) => attachment.status === 'fulfilled');
      const rejected = attachments.filter((attachment) => attachment.status === 'rejected');

      if (fulfilled.length > 0) {
        toast.success(
          fulfilled.length === 1
            ? 'Attachment uploaded successfully.'
            : `${fulfilled.length} attachments uploaded successfully.`,
        );
      }

      if (rejected.length > 0) {
        toast.error(
          rejected.length === 1
            ? 'Failed to upload attachment.'
            : `${rejected.length} attachments failed to upload.`,
        );
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to upload attachment.'));
    },
  });
};

export const useDeleteCampaignMeetingAttachment = (campaignId: number, meetingId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: number) =>
      campaignApi.deleteCampaignMeetingAttachment(campaignId, meetingId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.attachments(campaignId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: campaignMeetingKeys.activity(campaignId, meetingId),
      });
      toast.success('Attachment deleted successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete attachment.'));
    },
  });
};
