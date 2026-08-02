import DOMPurify from 'dompurify';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileVideo,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CAMPAIGN_IMAGE_TYPES,
  CAMPAIGN_MEDIA_ACCEPT,
  CAMPAIGN_MEDIA_TYPE_ERROR,
  CAMPAIGN_VIDEO_TYPES,
} from '@/features/campaign/constants/media';
import { useConnectWebex, useWebexStatus } from '@/features/integrations/useWebexIntegration.ts';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Calendar } from '@/shared/components/ui/Calendar';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import { cn } from '@/shared/utils/cn';
import {
  isMeetingTimeConflictError,
  MEETING_TIME_CONFLICT_MESSAGE,
  useCampaignMeeting,
  useCampaignMeetingAttachments,
  useCampaignMeetingInvitedMembers,
  useCampaignMeetingNotes,
  useCampaignMeetingRecipients,
  useCampaignMeetings,
  useCancelCampaignMeeting,
  useCreateCampaignMeeting,
  useDeleteCampaignMeetingAttachment,
  useUpdateCampaignMeeting,
  useUpdateCampaignMeetingNotes,
  useUploadCampaignMeetingAttachment,
} from '../hooks';
import type {
  CampaignMeeting,
  CampaignMeetingAttachment,
  CampaignMeetingNotes,
  CampaignMeetingRecipient,
  CampaignMeetingView,
} from '../types';

type RecipientMode = 'all' | 'selected';
type MeetingType = 'ONLINE' | 'OFFLINE' | 'HYBRID';
type MeetingDetailTab = 'overview' | 'invited' | 'notes' | 'attachments';
type MeetingForm = {
  title: string;
  description: string;
  meetingType: MeetingType;
  location: string;
  meetingUrl: string;
  startTime: string;
  endTime: string;
};
type MeetingFormErrors = Partial<Record<keyof MeetingForm, string>>;

interface CampaignMeetingsProps {
  campaignId: number;
  canManageMeetings: boolean;
  campaignName?: string;
}

const initialForm: MeetingForm = {
  title: '',
  description: '',
  meetingType: 'ONLINE',
  location: '',
  meetingUrl: '',
  startTime: '',
  endTime: '',
};

const detailTabs: Array<{ label: string; value: MeetingDetailTab }> = [
  { label: 'Overview', value: 'overview' },
  { label: 'Invited Members', value: 'invited' },
  { label: 'Notes', value: 'notes' },
  { label: 'Attachments', value: 'attachments' },
];

const WEBEX_SIGNUP_URL = 'https://signup.webex.com/sign-up';
const MIN_MEETING_DURATION_MINUTES = 10;
const MEETING_TYPES: Array<{ value: MeetingType; label: string }> = [
  { value: 'ONLINE', label: 'ONLINE' },
  { value: 'OFFLINE', label: 'OFFLINE' },
  { value: 'HYBRID', label: 'HYBRID' },
];
const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return { value, label: value };
});
const toBackendLocalDateTime = (value: string) => {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
};

const toDateTimeInputValue = (value: string) => {
  if (!value) return '';
  return value.slice(0, 16);
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDatePickerValue = (value: string) => {
  const date = parseDateInputValue(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimePickerValue = (value: string) => {
  return TIME_OPTIONS.find((option) => option.value === value)?.label ?? value;
};

const getDefaultCreateMeetingForm = (): MeetingForm => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const meetingDate = toDateInputValue(tomorrow);

  return {
    ...initialForm,
    startTime: `${meetingDate}T08:00`,
    endTime: `${meetingDate}T08:30`,
  };
};

const splitDateTimeInputValue = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
};

const combineDateTimeInputValue = (
  currentValue: string,
  changedPart: 'date' | 'time',
  nextValue: string,
) => {
  const current = splitDateTimeInputValue(currentValue);
  const date = changedPart === 'date' ? nextValue : current.date;
  const time = changedPart === 'time' ? nextValue : current.time;

  if (!date && !time) return '';
  return `${date}T${time}`;
};

const formatMeetingDate = (value: string) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatLabel = (value?: string | null, fallback = 'Unknown') =>
  value ? value.replaceAll('_', ' ') : fallback;

const formatStatus = (status?: string | null) => formatLabel(status);

const requiresOnlineDetails = (type: MeetingType) => type === 'ONLINE' || type === 'HYBRID';

const requiresRoom = (type: MeetingType) => type === 'OFFLINE' || type === 'HYBRID';

const isValidMeetingUrl = (value: string) => {
  if (!value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'UPCOMING':
      return 'default';
    case 'IN_PROGRESS':
      return 'success';
    case 'ENDED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    case 'EXPIRED':
      return 'warning';
    default:
      return 'secondary';
  }
};

const getMeetingTypeLabel = (type?: string | null) => {
  switch (type) {
    case 'OFFLINE':
      return 'Offline';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return 'Online';
  }
};

const canJoinMeeting = (meeting: CampaignMeeting) =>
  !!meeting.meetingUrl && ['UPCOMING', 'LIVE', 'IN_PROGRESS'].includes(meeting.displayStatus);

const getInvitedText = (meeting: CampaignMeeting) =>
  meeting.notifyAll
    ? `Invited: All members (${meeting.invitedCount})`
    : `Invited: ${meeting.invitedCount} selected`;

const getEmptyMeetingsText = (view: CampaignMeetingView) => {
  switch (view) {
    case 'in-progress':
      return 'No meetings are in progress.';
    case 'past':
      return 'No past meetings yet.';
    case 'all':
      return 'No meetings created yet.';
    default:
      return 'No upcoming meetings scheduled.';
  }
};

const getMeetingAttachmentMediaUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  const mediaPath = url
    .replace(/^\/+/, '')
    .replace(/^api\/media\//, '')
    .replace(/^media\//, '');
  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  if (apiUrl.endsWith('/api')) {
    return `${apiUrl}/media/${mediaPath}`;
  }

  if (apiUrl) {
    try {
      const parsedUrl = new URL(apiUrl);
      return `${parsedUrl.origin}/api/media/${mediaPath}`;
    } catch {
      return `/api/media/${mediaPath}`;
    }
  }

  return `/api/media/${mediaPath}`;
};

const getAttachmentFileName = (url: string) => {
  return url.split('/').pop() || 'meeting-attachment';
};

const getMeetingFormErrors = (form: MeetingForm, showRequired = false): MeetingFormErrors => {
  const errors: MeetingFormErrors = {};
  const now = Date.now();
  const startTime = form.startTime ? new Date(form.startTime).getTime() : null;
  const endTime = form.endTime ? new Date(form.endTime).getTime() : null;

  if (showRequired && !form.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (showRequired && !form.meetingType) {
    errors.meetingType = 'Meeting type is required.';
  }

  if (showRequired && requiresRoom(form.meetingType) && !form.location.trim()) {
    errors.location = 'Enter a location.';
  }

  if (form.meetingUrl.trim() && !isValidMeetingUrl(form.meetingUrl)) {
    errors.meetingUrl = 'Enter a valid HTTP or HTTPS meeting link.';
  }

  if (showRequired && !form.startTime) {
    errors.startTime = 'Start time is required.';
  } else if (form.startTime && Number.isNaN(startTime)) {
    errors.startTime = 'Start time is invalid.';
  } else if (startTime !== null && startTime <= now) {
    errors.startTime = 'Start time must be in the future.';
  }

  if (showRequired && !form.endTime) {
    errors.endTime = 'End time is required.';
  } else if (form.endTime && Number.isNaN(endTime)) {
    errors.endTime = 'End time is invalid.';
  }

  if (
    startTime !== null &&
    endTime !== null &&
    !Number.isNaN(startTime) &&
    !Number.isNaN(endTime)
  ) {
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    if (endTime <= startTime) {
      errors.endTime = 'End time must be after start time.';
    } else if (durationMinutes < MIN_MEETING_DURATION_MINUTES) {
      errors.endTime = `Meeting must be at least ${MIN_MEETING_DURATION_MINUTES} minutes long.`;
    }
  }

  return errors;
};

const getFirstMeetingFormError = (errors: MeetingFormErrors) => {
  return (
    errors.title ||
    errors.meetingType ||
    errors.location ||
    errors.meetingUrl ||
    errors.startTime ||
    errors.endTime ||
    null
  );
};

const validateAttachmentFile = (file: File) => {
  const isImage = CAMPAIGN_IMAGE_TYPES.has(file.type);
  const isVideo = CAMPAIGN_VIDEO_TYPES.has(file.type);

  if (!isImage && !isVideo) {
    return CAMPAIGN_MEDIA_TYPE_ERROR;
  }

  if (isImage && file.size > 15 * 1024 * 1024) {
    return 'Images must be 15MB or smaller.';
  }

  if (isVideo && file.size > 200 * 1024 * 1024) {
    return 'Videos must be 200MB or smaller.';
  }

  return null;
};

function RecipientChecklist({
  recipients,
  selectedIds,
  isLoading,
  onToggle,
}: {
  recipients: CampaignMeetingRecipient[];
  selectedIds: number[];
  isLoading: boolean;
  onToggle: (userId: number, checked: boolean) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading members...
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 px-3 py-4 text-sm text-gray-500">
        No selectable members found.
      </div>
    );
  }

  return (
    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
      {recipients.map((recipient) => (
        <div
          key={recipient.userId}
          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
        >
          <Checkbox
            checked={selectedIds.includes(recipient.userId)}
            onChange={(event) => onToggle(recipient.userId, event.target.checked)}
            label={
              <span className="block">
                <span className="block font-medium text-gray-900">{recipient.fullName}</span>
                <span className="block text-xs text-gray-500">
                  {recipient.email} - {formatLabel(recipient.roleInCampaign, 'Member')}
                </span>
              </span>
            }
          />
        </div>
      ))}
    </div>
  );
}

function MeetingDatePicker({
  value,
  placeholder,
  ariaLabel,
  error,
  describedBy,
  onChange,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  error?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateInputValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'relative h-10 w-full justify-start rounded-md bg-white px-3 pr-10 text-left font-normal shadow-none hover:bg-white',
            !value && 'text-gray-400',
            error
              ? 'border-red-500 text-red-900 focus-visible:ring-red-500/20'
              : 'border-gray-200 text-gray-900 focus-visible:ring-primary/20',
          )}
        >
          <span className="truncate">{value ? formatDatePickerValue(value) : placeholder}</span>
          <CalendarDays className="absolute right-3 h-4 w-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-xl"
      >
        <Calendar
          initialFocus
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateInputValue(date));
            setOpen(false);
          }}
          className="rounded-xl p-3"
        />
      </PopoverContent>
    </Popover>
  );
}

function MeetingTimePicker({
  value,
  placeholder,
  ariaLabel,
  error,
  describedBy,
  onChange,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  error?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md bg-white px-3 text-left font-normal shadow-none hover:bg-white',
            !value && 'text-gray-400',
            error
              ? 'border-red-500 text-red-900 focus-visible:ring-red-500/20'
              : 'border-gray-200 text-gray-900 focus-visible:ring-primary/20',
          )}
        >
          <span className="truncate">{value ? formatTimePickerValue(value) : placeholder}</span>
          <Clock className="ml-3 h-4 w-4 shrink-0 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="max-h-72 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
      >
        {TIME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              'flex h-8 w-full items-center rounded-md px-3 text-left text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
              value === option.value &&
                'bg-primary/10 font-medium text-primary hover:bg-primary/10',
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function MeetingFormFields({
  form,
  errors,
  timeRangeError,
  showTypeSelector = false,
  allowMeetingUrl = true,
  onChange,
  currentLang = 'en',
}: {
  form: MeetingForm;
  errors?: MeetingFormErrors;
  timeRangeError?: string | null;
  showTypeSelector?: boolean;
  allowMeetingUrl?: boolean;
  onChange: (field: keyof MeetingForm, value: string) => void;
  currentLang?: string;
}) {
  const showOnlineLocation = requiresOnlineDetails(form.meetingType);
  const showRoomLocation = requiresRoom(form.meetingType);
  const showWhere = showRoomLocation || showOnlineLocation;
  const start = splitDateTimeInputValue(form.startTime);
  const end = splitDateTimeInputValue(form.endTime);
  const titleErrorId = errors?.title ? 'meeting-title-error' : undefined;
  const typeErrorId = errors?.meetingType ? 'meeting-type-error' : undefined;
  const locationErrorId = errors?.location ? 'meeting-location-error' : undefined;
  const meetingUrlErrorId = errors?.meetingUrl ? 'meeting-url-error' : undefined;
  const startErrorId = errors?.startTime ? 'meeting-start-error' : undefined;
  const endErrorId = errors?.endTime ? 'meeting-end-error' : undefined;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
        <Input
          id="meeting-title"
          value={form.title}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder={currentLang === 'vi' ? 'Thêm tiêu đề' : 'Add a title'}
          aria-label="Meeting title"
          aria-invalid={!!errors?.title}
          aria-describedby={titleErrorId}
          className="h-10 rounded-md"
          error={!!errors?.title}
        />
        <Select
          value={form.meetingType}
          disabled={!showTypeSelector}
          onValueChange={(value) => onChange('meetingType', value as MeetingType)}
        >
          <SelectTrigger
            aria-label="Meeting type"
            aria-invalid={!!errors?.meetingType}
            aria-describedby={typeErrorId}
            className={cn(
              'h-10 rounded-md bg-white',
              errors?.meetingType && 'border-red-300 focus:ring-red-500/30',
            )}
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {MEETING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(errors?.title || errors?.meetingType) && (
        <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
          {errors?.title ? (
            <p id="meeting-title-error" className="text-xs font-medium text-red-600">
              {errors.title}
            </p>
          ) : (
            <span />
          )}
          {errors?.meetingType && (
            <p id="meeting-type-error" className="text-xs font-medium text-red-600">
              {errors.meetingType}
            </p>
          )}
        </div>
      )}

      {showWhere && (
        <div className="space-y-1.5">
          {showRoomLocation ? (
            <div className="space-y-2">
              <Input
                id="meeting-location"
                value={form.location}
                onChange={(event) => onChange('location', event.target.value)}
                placeholder={currentLang === 'vi' ? 'Địa điểm' : 'Where'}
                aria-label="Where"
                aria-invalid={!!errors?.location}
                aria-describedby={locationErrorId}
                className="h-10 rounded-md"
                error={!!errors?.location}
              />
              {allowMeetingUrl && showOnlineLocation && (
                <Input
                  id="meeting-url"
                  value={form.meetingUrl}
                  onChange={(event) => onChange('meetingUrl', event.target.value)}
                  placeholder={
                    currentLang === 'vi' ? 'Link online (không bắt buộc)' : 'Online link (optional)'
                  }
                  aria-label="Online meeting link"
                  aria-invalid={!!errors?.meetingUrl}
                  aria-describedby={meetingUrlErrorId}
                  className="h-10 rounded-md"
                  error={!!errors?.meetingUrl}
                />
              )}
            </div>
          ) : (
            <Input
              id="meeting-url"
              value={form.meetingUrl}
              onChange={(event) => onChange('meetingUrl', event.target.value)}
              placeholder={currentLang === 'vi' ? 'Địa điểm hoặc link' : 'Where'}
              aria-label="Where"
              aria-invalid={!!errors?.meetingUrl}
              aria-describedby={meetingUrlErrorId}
              disabled={!allowMeetingUrl}
              className="h-10 rounded-md"
              error={!!errors?.meetingUrl}
            />
          )}

          {allowMeetingUrl && showOnlineLocation && (
            <p className="text-xs text-gray-500">
              {currentLang === 'vi'
                ? 'Để trống link online để tạo cuộc họp Webex bằng tài khoản đã kết nối.'
                : 'Leave the online link blank to create a Webex meeting with your connected account.'}
            </p>
          )}
          {errors?.location && (
            <p id="meeting-location-error" className="text-xs font-medium text-red-600">
              {errors.location}
            </p>
          )}
          {errors?.meetingUrl && (
            <p id="meeting-url-error" className="text-xs font-medium text-red-600">
              {errors.meetingUrl}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <MeetingDatePicker
            value={start.date}
            placeholder={currentLang === 'vi' ? 'Ngày bắt đầu' : 'Start date'}
            ariaLabel="Start date"
            error={!!errors?.startTime}
            describedBy={startErrorId}
            onChange={(value) =>
              onChange('startTime', combineDateTimeInputValue(form.startTime, 'date', value))
            }
          />
          <MeetingTimePicker
            value={start.time}
            placeholder={currentLang === 'vi' ? 'Giờ bắt đầu' : 'Start time'}
            ariaLabel="Start time"
            error={!!errors?.startTime}
            describedBy={startErrorId}
            onChange={(value) =>
              onChange('startTime', combineDateTimeInputValue(form.startTime, 'time', value))
            }
          />
        </div>
        {errors?.startTime && (
          <p id="meeting-start-error" className="text-xs font-medium text-red-600">
            {errors.startTime}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <MeetingDatePicker
            value={end.date}
            placeholder={currentLang === 'vi' ? 'Ngày kết thúc' : 'End date'}
            ariaLabel="End date"
            error={!!errors?.endTime}
            describedBy={endErrorId}
            onChange={(value) =>
              onChange('endTime', combineDateTimeInputValue(form.endTime, 'date', value))
            }
          />
          <MeetingTimePicker
            value={end.time}
            placeholder={currentLang === 'vi' ? 'Giờ kết thúc' : 'End time'}
            ariaLabel="End time"
            error={!!errors?.endTime}
            describedBy={endErrorId}
            onChange={(value) =>
              onChange('endTime', combineDateTimeInputValue(form.endTime, 'time', value))
            }
          />
        </div>
        {errors?.endTime && (
          <p id="meeting-end-error" className="text-xs font-medium text-red-600">
            {errors.endTime}
          </p>
        )}
      </div>

      {timeRangeError && (
        <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {timeRangeError}
        </p>
      )}

      <div className="[&_.ProseMirror]:min-h-[210px] [&_.tiptap]:min-h-[210px]">
        <RichTextEditor
          value={form.description}
          onChange={(value) => onChange('description', value)}
          placeholder={
            currentLang === 'vi'
              ? 'Thêm mô tả, agenda hoặc hướng dẫn tham gia'
              : 'Add a description, agenda, or joining instructions'
          }
          ariaLabel="Meeting description"
          contentClassName="max-h-[280px] overflow-y-auto"
        />
      </div>
    </div>
  );
}

function MeetingDescription({ html, compact = false }: { html: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'break-words text-sm leading-6 text-gray-600 prose prose-sm max-w-none',
        '[&_a]:text-primary [&_a]:underline [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2',
        compact ? 'max-h-24 overflow-hidden' : 'max-h-80 overflow-y-auto rounded-md pr-2',
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Meeting descriptions are sanitized before rendering.
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

function MeetingCard({
  meeting,
  onView,
}: {
  meeting: CampaignMeeting;
  onView: (meetingId: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition-all duration-300 hover:border-gray-200/80 hover:bg-slate-50/50 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-gray-900">{meeting.title}</h3>
            <Badge variant={getStatusBadgeVariant(meeting.displayStatus)}>
              {formatStatus(meeting.displayStatus)}
            </Badge>
            <Badge variant="secondary">{getMeetingTypeLabel(meeting.meetingType)}</Badge>
          </div>
          {meeting.description && <MeetingDescription html={meeting.description} compact />}
          <div className="grid gap-1 text-sm text-gray-600">
            <span>Start: {formatMeetingDate(meeting.startTime)}</span>
            <span>End: {formatMeetingDate(meeting.endTime)}</span>
            {requiresRoom(meeting.meetingType as MeetingType) && meeting.location && (
              <span>Location: {meeting.location}</span>
            )}
            <span>Created by: {meeting.createdByName || 'Unknown'}</span>
            <span>{getInvitedText(meeting)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canJoinMeeting(meeting) && (
            <Button asChild size="sm" variant="outline">
              <a href={meeting.meetingUrl ?? undefined} target="_blank" rel="noreferrer">
                <LinkIcon className="h-4 w-4" />
                Join
              </a>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onView(meeting.id)}>
            <Eye className="h-4 w-4" />
            Detail
          </Button>
        </div>
      </div>
    </div>
  );
}

function MeetingDetailRows({
  meeting,
  campaignName,
}: {
  meeting: CampaignMeeting;
  campaignName?: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
      {campaignName && <div>Campaign: {campaignName}</div>}
      <div>Start: {formatMeetingDate(meeting.startTime)}</div>
      <div>End: {formatMeetingDate(meeting.endTime)}</div>
      <div>Type: {getMeetingTypeLabel(meeting.meetingType)}</div>
      {requiresRoom(meeting.meetingType as MeetingType) && meeting.location && (
        <div className="break-words">Location: {meeting.location}</div>
      )}
      <div>Created by: {meeting.createdByName || 'Unknown'}</div>
      <div>{getInvitedText(meeting)}</div>
      {meeting.meetingUrl && (
        <div className="break-all">
          Meeting URL:{' '}
          <a
            href={meeting.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {meeting.meetingUrl}
          </a>
        </div>
      )}
      <div>Created: {formatMeetingDate(meeting.createdAt)}</div>
      <div>Updated: {formatMeetingDate(meeting.updatedAt)}</div>
    </div>
  );
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

function InvitedMembersTab({
  members,
  isLoading,
}: {
  members: CampaignMeetingRecipient[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading invited members...
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No invited members found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(member.fullName) || '?'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{member.fullName}</div>
            <div className="truncate text-xs text-gray-500">{member.email}</div>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {formatLabel(member.roleInCampaign, 'Member')}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function NotesTab({
  notes,
  isLoading,
  content,
  onContentChange,
  onSave,
  isSaving,
  canEdit,
}: {
  notes?: CampaignMeetingNotes;
  isLoading: boolean;
  content: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  canEdit: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notes...
      </div>
    );
  }

  if (!canEdit && !notes?.content?.trim()) {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No notes have been added yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canEdit ? (
        <>
          <RichTextEditor
            value={content}
            onChange={onContentChange}
            placeholder="Meeting summary and decisions..."
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              {notes?.updatedAt && notes.updatedByName
                ? `Last updated by ${notes.updatedByName} at ${formatMeetingDate(notes.updatedAt)}`
                : 'Notes are editable for this meeting.'}
            </div>
            <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </div>
        </>
      ) : (
        <div
          className="prose prose-sm max-w-none rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Meeting notes are sanitized by DOMPurify before rendering.
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(notes?.content || ''),
          }}
        />
      )}
    </div>
  );
}

function AttachmentsTab({
  attachments,
  isLoading,
  isError,
  canManage,
  isUploading,
  deletingAttachmentId,
  onUpload,
  onDelete,
}: {
  attachments: CampaignMeetingAttachment[];
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  isUploading: boolean;
  deletingAttachmentId?: number;
  onUpload: (files: File[]) => void;
  onDelete: (attachmentId: number) => void;
}) {
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    onUpload(files);
  };

  const handleDownload = async (attachment: CampaignMeetingAttachment, mediaUrl: string) => {
    setDownloadingAttachmentId(attachment.id);
    try {
      const response = await fetch(mediaUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = getAttachmentFileName(attachment.url);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error('Unable to download attachment.');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading attachments...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-8 text-center text-sm text-red-600">
        Unable to load attachments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5">
          <input
            type="file"
            className="sr-only"
            accept={CAMPAIGN_MEDIA_ACCEPT}
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="mb-2 h-5 w-5 animate-spin text-primary" />
          ) : (
            <Upload className="mb-2 h-5 w-5 text-primary" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {isUploading ? 'Uploading attachments...' : 'Upload images or videos'}
          </span>
          <span className="mt-1 text-xs text-gray-500">Images up to 15MB. Videos up to 200MB.</span>
        </label>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No attachments yet.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            {attachments.map((attachment) => {
              const mediaUrl = getMeetingAttachmentMediaUrl(attachment.url);
              const isImage = attachment.mediaType === 'IMAGE';

              return (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isImage) {
                        setPreviewImage({
                          url: mediaUrl,
                          fileName: getAttachmentFileName(attachment.url),
                        });
                        return;
                      }
                      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex aspect-video items-center justify-center bg-gray-100"
                    title="Open attachment"
                  >
                    {isImage ? (
                      <img
                        src={mediaUrl}
                        alt="Meeting attachment"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <FileVideo className="h-8 w-8" />
                        <span className="text-xs font-medium">{attachment.mediaType}</span>
                      </div>
                    )}
                  </button>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <Badge variant="secondary">{attachment.mediaType}</Badge>
                    <div className="flex gap-2">
                      <Button asChild size="icon" variant="outline" title="Open attachment">
                        <a href={mediaUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        title="Download attachment"
                        disabled={downloadingAttachmentId === attachment.id}
                        onClick={() => handleDownload(attachment, mediaUrl)}
                      >
                        {downloadingAttachmentId === attachment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      {canManage && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          title="Delete attachment"
                          disabled={deletingAttachmentId === attachment.id}
                          onClick={() => onDelete(attachment.id)}
                        >
                          {deletingAttachmentId === attachment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.fileName || 'Attachment preview'}
        className="max-w-4xl"
      >
        {previewImage && (
          <div className="space-y-4">
            <div className="max-h-[75vh] overflow-auto rounded-lg bg-gray-950 p-2">
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <a href={previewImage.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export function CampaignMeetings({
  campaignId,
  canManageMeetings,
  campaignName,
}: CampaignMeetingsProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const location = useLocation();
  const [activeView, setActiveView] = useState<CampaignMeetingView>('upcoming');
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<MeetingDetailTab>('overview');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [notesContent, setNotesContent] = useState('');
  const [createForm, setCreateForm] = useState<MeetingForm>(() => getDefaultCreateMeetingForm());
  const [editForm, setEditForm] = useState(initialForm);
  const [createSubmitted, setCreateSubmitted] = useState(false);
  const [editSubmitted, setEditSubmitted] = useState(false);
  const [createConflictError, setCreateConflictError] = useState<string | null>(null);
  const [editConflictError, setEditConflictError] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const meetingsQuery = useCampaignMeetings(campaignId, activeView);
  const meetingDetailQuery = useCampaignMeeting(campaignId, selectedMeetingId, !!selectedMeetingId);
  const invitedMembersQuery = useCampaignMeetingInvitedMembers(
    campaignId,
    selectedMeetingId,
    activeDetailTab === 'invited',
  );
  const notesQuery = useCampaignMeetingNotes(
    campaignId,
    selectedMeetingId,
    activeDetailTab === 'notes',
  );
  const attachmentsQuery = useCampaignMeetingAttachments(
    campaignId,
    selectedMeetingId,
    activeDetailTab === 'attachments',
  );
  const webexStatus = useWebexStatus(canManageMeetings);
  const recipientsQuery = useCampaignMeetingRecipients(campaignId, isCreateOpen);
  const createMeeting = useCreateCampaignMeeting(campaignId);
  const updateMeeting = useUpdateCampaignMeeting(campaignId);
  const cancelMeeting = useCancelCampaignMeeting(campaignId);
  const updateNotes = useUpdateCampaignMeetingNotes(campaignId, selectedMeetingId ?? 0);
  const uploadAttachment = useUploadCampaignMeetingAttachment(campaignId, selectedMeetingId ?? 0);
  const deleteAttachment = useDeleteCampaignMeetingAttachment(campaignId, selectedMeetingId ?? 0);
  const connectWebex = useConnectWebex();

  const selectedMeeting = meetingDetailQuery.data;
  const recipients = recipientsQuery.data ?? [];
  const meetings = useMemo(() => meetingsQuery.data ?? [], [meetingsQuery.data]);
  const webexReturnTo = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', 'meetings');
    const search = searchParams.toString();

    return `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
  }, [location.hash, location.pathname, location.search]);
  const visibleMeetings = showAllMeetings ? meetings : meetings.slice(0, 2);
  const hasMoreMeetings = meetings.length > 2;
  const isBusy = cancelMeeting.isPending || updateMeeting.isPending;
  const createFormErrors = useMemo(
    () => getMeetingFormErrors(createForm, createSubmitted),
    [createForm, createSubmitted],
  );
  const editFormErrors = useMemo(
    () => getMeetingFormErrors(editForm, editSubmitted),
    [editForm, editSubmitted],
  );

  const handleOpenDetail = (meetingId: number) => {
    setActiveDetailTab('overview');
    setSelectedMeetingId(meetingId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setIsEditOpen(false);
  };

  useEffect(() => {
    if (!isCreateOpen) return;
    setCreateForm(getDefaultCreateMeetingForm());
    setCreateSubmitted(false);
    setCreateConflictError(null);
    setRecipientMode('all');
    setSelectedRecipientIds([]);
  }, [isCreateOpen]);

  useEffect(() => {
    if (isDetailOpen || !selectedMeetingId) return;

    const timeoutId = window.setTimeout(() => {
      setSelectedMeetingId(null);
      setActiveDetailTab('overview');
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [isDetailOpen, selectedMeetingId]);

  useEffect(() => {
    if (!notesQuery.data) return;
    setNotesContent(notesQuery.data.content ?? '');
  }, [notesQuery.data]);

  useEffect(() => {
    if (!selectedMeeting || !isEditOpen) return;
    setEditForm({
      title: selectedMeeting.title,
      description: selectedMeeting.description ?? '',
      meetingType: selectedMeeting.meetingType ?? 'ONLINE',
      location: selectedMeeting.location ?? '',
      meetingUrl: selectedMeeting.meetingUrl ?? '',
      startTime: toDateTimeInputValue(selectedMeeting.startTime),
      endTime: toDateTimeInputValue(selectedMeeting.endTime),
    });
    setEditSubmitted(false);
    setEditConflictError(null);
  }, [selectedMeeting, isEditOpen]);

  const handleCreateFormChange = (field: keyof MeetingForm, value: string) => {
    if (field === 'startTime' || field === 'endTime') {
      setCreateConflictError(null);
    }
    setCreateForm((current) => {
      if (field !== 'meetingType') {
        return { ...current, [field]: value };
      }
      const meetingType = value as MeetingType;
      return {
        ...current,
        meetingType,
        location: requiresRoom(meetingType) ? current.location : '',
        meetingUrl: requiresOnlineDetails(meetingType) ? current.meetingUrl : '',
      };
    });
  };

  const handleEditFormChange = (field: keyof MeetingForm, value: string) => {
    if (field === 'startTime' || field === 'endTime') {
      setEditConflictError(null);
    }
    setEditForm((current) => {
      if (field !== 'meetingType') {
        return { ...current, [field]: value };
      }
      const meetingType = value as MeetingType;
      return {
        ...current,
        meetingType,
        location: requiresRoom(meetingType) ? current.location : '',
        meetingUrl: requiresOnlineDetails(meetingType) ? current.meetingUrl : '',
      };
    });
  };

  const toggleRecipient = (userId: number, checked: boolean) => {
    setSelectedRecipientIds((current) =>
      checked ? [...current, userId] : current.filter((id) => id !== userId),
    );
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateSubmitted(true);

    const validationError = getFirstMeetingFormError(getMeetingFormErrors(createForm, true));
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const needsAutoWebex =
      requiresOnlineDetails(createForm.meetingType) && !createForm.meetingUrl.trim();
    if (needsAutoWebex && !webexStatus.data?.connected) {
      toast.error(
        currentLang === 'vi'
          ? 'Vui lòng kết nối tài khoản Webex hoặc nhập link cuộc họp hợp lệ.'
          : 'Please connect your Webex account or provide a valid meeting link.',
      );
      return;
    }
    if (recipientMode === 'selected' && selectedRecipientIds.length === 0) {
      toast.error(
        currentLang === 'vi'
          ? 'Vui lòng chọn ít nhất một thành viên.'
          : 'Select at least one member.',
      );
      return;
    }
    setCreateConflictError(null);

    try {
      await createMeeting.mutateAsync({
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
        meetingType: createForm.meetingType,
        location: requiresRoom(createForm.meetingType) ? createForm.location.trim() : null,
        meetingUrl: requiresOnlineDetails(createForm.meetingType)
          ? createForm.meetingUrl.trim() || null
          : null,
        startTime: toBackendLocalDateTime(createForm.startTime),
        endTime: toBackendLocalDateTime(createForm.endTime),
        notifyAll: recipientMode === 'all',
        recipientUserIds: recipientMode === 'all' ? [] : selectedRecipientIds,
      });
      setActiveView('upcoming');
      setCreateSubmitted(false);
      setIsCreateOpen(false);
    } catch (error) {
      if (isMeetingTimeConflictError(error)) {
        setCreateConflictError(MEETING_TIME_CONFLICT_MESSAGE);
      }
      return;
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditSubmitted(true);
    if (!selectedMeeting?.canUpdate) return;

    const validationError = getFirstMeetingFormError(getMeetingFormErrors(editForm, true));
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setEditConflictError(null);

    try {
      await updateMeeting.mutateAsync({
        meetingId: selectedMeeting.id,
        payload: {
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          meetingType: editForm.meetingType,
          location: requiresRoom(editForm.meetingType) ? editForm.location.trim() : null,
          startTime: toBackendLocalDateTime(editForm.startTime),
          endTime: toBackendLocalDateTime(editForm.endTime),
        },
      });
      setEditSubmitted(false);
      setIsEditOpen(false);
    } catch (error) {
      if (isMeetingTimeConflictError(error)) {
        setEditConflictError(MEETING_TIME_CONFLICT_MESSAGE);
      }
      return;
    }
  };

  const handleCancel = async (meeting: CampaignMeeting) => {
    if (!window.confirm(currentLang === 'vi' ? 'Hủy cuộc họp này?' : 'Cancel this meeting?'))
      return;
    try {
      await cancelMeeting.mutateAsync(meeting.id);
      setIsEditOpen(false);
      setIsDetailOpen(false);
    } catch {
      return;
    }
  };

  const handleCopyLink = async (meetingUrl: string) => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      toast.success(
        currentLang === 'vi' ? 'Đã sao chép liên kết cuộc họp.' : 'Meeting link copied.',
      );
    } catch {
      toast.error(
        currentLang === 'vi'
          ? 'Không thể sao chép liên kết cuộc họp.'
          : 'Unable to copy meeting link.',
      );
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMeetingId) return;
    try {
      await updateNotes.mutateAsync({ content: notesContent });
    } catch {
      return;
    }
  };

  const handleOpenCreateMeeting = () => {
    setCreateForm(getDefaultCreateMeetingForm());
    webexStatus.refetch();
    setIsCreateOpen(true);
  };

  const handleUploadAttachment = async (files: File[]) => {
    const invalidFile = files
      .map((file) => ({ file, error: validateAttachmentFile(file) }))
      .find(({ error }) => !!error);

    if (invalidFile?.error) {
      toast.error(`${invalidFile.file.name}: ${invalidFile.error}`);
      return;
    }

    try {
      await uploadAttachment.mutateAsync(files);
    } catch {
      return;
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (
      !window.confirm(
        currentLang === 'vi' ? 'Xóa tập tin đính kèm này?' : 'Delete this attachment?',
      )
    )
      return;
    try {
      await deleteAttachment.mutateAsync(attachmentId);
    } catch {
      return;
    }
  };

  const isCreateOnlineMeeting = requiresOnlineDetails(createForm.meetingType);
  const createNeedsAutoWebex = isCreateOnlineMeeting && !createForm.meetingUrl.trim();
  const isCreateFormDisabled =
    createNeedsAutoWebex && (webexStatus.isLoading || !webexStatus.data?.connected);

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-900 font-display">
          <CalendarClock className="h-5 w-5 text-primary" />
          {currentLang === 'vi' ? 'Cuộc họp chiến dịch' : 'Campaign Meetings'}
        </div>
        {canManageMeetings && (
          <Button
            onClick={handleOpenCreateMeeting}
            size="sm"
            className="rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {currentLang === 'vi' ? 'Tạo cuộc họp' : 'Create Meeting'}
          </Button>
        )}
      </div>

      <div className="sticky top-0 z-20 mb-4 flex overflow-x-auto rounded-lg bg-gray-100 p-1 text-sm font-medium shadow-sm">
        {[
          { label: currentLang === 'vi' ? 'Sắp diễn ra' : 'Upcoming', value: 'upcoming' },
          { label: currentLang === 'vi' ? 'Đang diễn ra' : 'In Progress', value: 'in-progress' },
          { label: currentLang === 'vi' ? 'Đã diễn ra' : 'Past', value: 'past' },
          { label: currentLang === 'vi' ? 'Tất cả' : 'All', value: 'all' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveView(tab.value as CampaignMeetingView);
              setShowAllMeetings(false);
            }}
            className={cn(
              'min-w-fit rounded-md px-3 py-2 transition-colors cursor-pointer',
              activeView === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {meetingsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50/50 px-4 py-4 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {currentLang === 'vi' ? 'Đang tải danh sách cuộc họp...' : 'Loading meetings...'}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-2xl bg-slate-50/50 px-4 py-4 text-center text-xs font-semibold text-gray-400 border border-slate-100/30">
          {getEmptyMeetingsText(activeView)}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onView={handleOpenDetail} />
          ))}
          {hasMoreMeetings && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllMeetings((current) => !current)}
                className="cursor-pointer"
              >
                {showAllMeetings
                  ? currentLang === 'vi'
                    ? 'Thu gọn danh sách'
                    : 'Show fewer meetings'
                  : currentLang === 'vi'
                    ? 'Xem tất cả cuộc họp'
                    : 'View all meetings'}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={currentLang === 'vi' ? 'Tạo cuộc họp' : 'Create Meeting'}
        className="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          {isCreateOnlineMeeting && webexStatus.isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentLang === 'vi'
                ? 'Đang kiểm tra kết nối Webex...'
                : 'Checking Webex connection...'}
            </div>
          ) : isCreateOnlineMeeting && webexStatus.data?.connected ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{currentLang === 'vi' ? 'Chủ trì:' : 'Host:'}</span>
              <span className="truncate">{webexStatus.data.webexEmail}</span>
            </div>
          ) : isCreateOnlineMeeting ? (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
              <div className="space-y-2">
                <div className="font-semibold">
                  {currentLang === 'vi'
                    ? 'Kết nối Webex trước khi tạo cuộc họp'
                    : 'Connect Webex before creating meetings'}
                </div>
                <div>
                  {currentLang === 'vi'
                    ? 'mgmGives sử dụng tài khoản Webex đã kết nối của bạn làm chủ trì cho các cuộc họp được tạo.'
                    : 'mgmGives uses your connected Webex account as the host for meetings you create.'}
                </div>
                <div>
                  {currentLang === 'vi'
                    ? 'Nếu bạn đã có tài khoản Webex, hãy kết nối ngay. Nếu chưa có, vui lòng tạo tài khoản Webex miễn phí trước, sau đó quay lại đây để kết nối.'
                    : 'If you already have a Webex account, connect it now. If you do not have one yet, create a free Webex account first, then return here and connect it.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => connectWebex.mutate({ returnTo: webexReturnTo })}
                  disabled={connectWebex.isPending}
                  className="cursor-pointer"
                >
                  {connectWebex.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {currentLang === 'vi' ? 'Kết nối Webex' : 'Connect Webex'}
                </Button>
                <Button
                  asChild
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <a href={WEBEX_SIGNUP_URL} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {currentLang === 'vi' ? 'Tạo tài khoản Webex' : 'Create Webex account'}
                  </a>
                </Button>
              </div>
              <div className="text-xs text-amber-800">
                {currentLang === 'vi'
                  ? 'Sau khi đăng ký xong, hãy quay lại hộp thoại này và nhấn Kết nối Webex.'
                  : 'After signing up, come back to this modal and click Connect Webex.'}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-800">
              <MapPin className="h-4 w-4" />
              Offline meetings only need a location. Webex is not required.
            </div>
          )}

          <fieldset className="space-y-3">
            <MeetingFormFields
              form={createForm}
              errors={createFormErrors}
              timeRangeError={createConflictError}
              showTypeSelector
              onChange={handleCreateFormChange}
              currentLang={currentLang}
            />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-900">
                {currentLang === 'vi' ? 'Người nhận thông báo' : 'Recipients'}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['all', 'selected'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRecipientMode(mode)}
                    aria-pressed={recipientMode === mode}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      recipientMode === mode
                        ? 'border-primary bg-primary/5 text-gray-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                    )}
                  >
                    {mode === 'all' ? (
                      <Users className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">
                      {mode === 'all'
                        ? currentLang === 'vi'
                          ? 'Mời tất cả thành viên'
                          : 'Invite all campaign members'
                        : currentLang === 'vi'
                          ? 'Chọn thành viên cụ thể'
                          : 'Select specific members'}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {recipientMode === 'selected' && (
              <RecipientChecklist
                recipients={recipients}
                selectedIds={selectedRecipientIds}
                isLoading={recipientsQuery.isLoading}
                onToggle={toggleRecipient}
              />
            )}
          </fieldset>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="cursor-pointer"
            >
              {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={
                createMeeting.isPending ||
                isCreateFormDisabled ||
                !!getFirstMeetingFormError(createFormErrors)
              }
              className="cursor-pointer"
            >
              {createMeeting.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {currentLang === 'vi' ? 'Tạo cuộc họp' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        title="Meeting Detail"
        className="max-w-2xl"
      >
        {meetingDetailQuery.isLoading || !selectedMeeting ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading meeting...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{selectedMeeting.title}</h3>
                <Badge variant={getStatusBadgeVariant(selectedMeeting.displayStatus)}>
                  {formatStatus(selectedMeeting.displayStatus)}
                </Badge>
              </div>
              {selectedMeeting.description && (
                <MeetingDescription html={selectedMeeting.description} />
              )}
            </div>

            <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 text-sm font-medium">
              {detailTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveDetailTab(tab.value)}
                  className={cn(
                    'min-w-fit rounded-md px-3 py-2 transition-colors',
                    activeDetailTab === tab.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeDetailTab === 'overview' && (
              <div className="space-y-4">
                <MeetingDetailRows meeting={selectedMeeting} campaignName={campaignName} />

                <div className="flex flex-wrap justify-end gap-2">
                  {selectedMeeting.meetingUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopyLink(selectedMeeting.meetingUrl ?? '')}
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                  )}
                  {canJoinMeeting(selectedMeeting) && (
                    <Button asChild variant="outline">
                      <a
                        href={selectedMeeting.meetingUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                  {selectedMeeting.canUpdate && (
                    <Button variant="outline" onClick={() => setIsEditOpen(true)} disabled={isBusy}>
                      <Pencil className="h-4 w-4" />
                      Edit Meeting
                    </Button>
                  )}
                  {selectedMeeting.canCancel && (
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedMeeting)}
                      disabled={isBusy}
                    >
                      {cancelMeeting.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Cancel Meeting
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeDetailTab === 'invited' && (
              <InvitedMembersTab
                members={invitedMembersQuery.data ?? []}
                isLoading={invitedMembersQuery.isLoading}
              />
            )}

            {activeDetailTab === 'notes' && (
              <NotesTab
                notes={notesQuery.data}
                isLoading={notesQuery.isLoading}
                content={notesContent}
                onContentChange={setNotesContent}
                onSave={handleSaveNotes}
                isSaving={updateNotes.isPending}
                canEdit={!!notesQuery.data?.canEdit && !!selectedMeeting.canEditNotes}
              />
            )}

            {activeDetailTab === 'attachments' && (
              <AttachmentsTab
                attachments={attachmentsQuery.data ?? []}
                isLoading={attachmentsQuery.isLoading}
                isError={attachmentsQuery.isError}
                canManage={!!selectedMeeting.canManage}
                isUploading={uploadAttachment.isPending}
                deletingAttachmentId={deleteAttachment.variables}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
              />
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Meeting"
        className="max-w-3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3">
          <MeetingFormFields
            form={editForm}
            errors={editFormErrors}
            timeRangeError={editConflictError}
            showTypeSelector
            allowMeetingUrl={false}
            onChange={handleEditFormChange}
            currentLang={currentLang}
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMeeting.isPending || !!getFirstMeetingFormError(editFormErrors)}
            >
              {updateMeeting.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
