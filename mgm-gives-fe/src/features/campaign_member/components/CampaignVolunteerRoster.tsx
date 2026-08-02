import { Clock, Eye, EyeOff, Globe, Lock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCampaignRoster,
  useUpdateMyRosterVisibility,
  useUpdateRosterVisibility,
} from '@/features/campaign_member/hooks/hooks';
import { useCampaignRosterSocket } from '@/features/campaign_member/hooks/useCampaignRosterSocket';
import type { MemberListVisibility } from '@/features/campaign_member/types/types';
import { Button } from '@/shared/components/ui/Button';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { parseUTCDate } from '@/shared/utils/format';

interface CampaignVolunteerRosterProps {
  campaignId: number;
}

function formatJoinedDate(dateStr: string) {
  return parseUTCDate(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Volunteer roster for a campaign. The backend shapes the response per viewer
 * (admin/member/signed-in guest/anonymous), so this component only renders what it
 * receives: the full list, or a count-only summary when the list isn't visible to this
 * viewer (members-only setting, or a public list viewed while not signed in).
 */
export function CampaignVolunteerRoster({ campaignId }: CampaignVolunteerRosterProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { data: roster, isLoading, isError, refetch } = useCampaignRoster(campaignId);
  const updateVisibility = useUpdateRosterVisibility(campaignId);
  const updateMyVisibility = useUpdateMyRosterVisibility(campaignId);
  // Live updates: refetch whenever anyone joins, leaves, or changes a visibility setting.
  useCampaignRosterSocket(campaignId);

  const visibilityOptions: {
    value: MemberListVisibility;
    label: string;
    icon: typeof Globe;
  }[] = [
    {
      value: 'MEMBERS_ONLY',
      label: currentLang === 'vi' ? 'Chỉ thành viên' : 'Members only',
      icon: Lock,
    },
    {
      value: 'PUBLIC',
      label: currentLang === 'vi' ? 'Công khai' : 'Public',
      icon: Globe,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-secondary" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-40 rounded bg-secondary" />
              <div className="h-3 w-24 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !roster) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {currentLang === 'vi'
            ? 'Không thể tải danh sách tình nguyện viên.'
            : 'Could not load the volunteer list.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 cursor-pointer"
          onClick={() => refetch()}
        >
          {currentLang === 'vi' ? 'Thử lại' : 'Try again'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
            {currentLang === 'vi'
              ? `Tình nguyện viên (${roster.totalVolunteers})`
              : `Volunteers (${roster.totalVolunteers})`}
          </h3>
        </div>

        {roster.viewerIsAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {currentLang === 'vi' ? 'Quyền riêng tư danh sách:' : 'List visibility:'}
            </span>
            <div className="flex rounded-lg bg-secondary p-1 text-xs font-semibold">
              {visibilityOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  disabled={updateVisibility.isPending}
                  onClick={() => {
                    if (roster.visibility !== value) {
                      updateVisibility.mutate(value);
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 cursor-pointer ${
                    roster.visibility === value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {roster.viewerIsAdmin && (
        <p className="text-xs text-muted-foreground">
          {roster.visibility === 'PUBLIC'
            ? currentLang === 'vi'
              ? 'Bất kỳ ai đã đăng nhập đều có thể xem danh sách tình nguyện viên, trừ những người chọn ẩn tên. Khách chưa đăng nhập chỉ thấy số lượng.'
              : "Anyone signed in can see the volunteer list, except volunteers who chose to hide their name. Visitors who aren't logged in only see the count."
            : currentLang === 'vi'
              ? 'Chỉ bạn và các thành viên trong chiến dịch mới có thể xem danh sách tình nguyện viên. Những người khác chỉ thấy số lượng.'
              : 'Only you and campaign members can see the volunteer list. Others see just the count.'}
        </p>
      )}

      {roster.viewerIsMember && !roster.viewerIsAdmin && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentLang === 'vi'
                ? 'Ẩn tên của tôi khỏi danh sách công khai'
                : 'Hide my name from the public list'}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentLang === 'vi'
                ? 'Các thành viên khác và Quản trị viên vẫn nhìn thấy bạn.'
                : 'Campaign members and the admin will still see you.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={updateMyVisibility.isPending}
            onClick={() => updateMyVisibility.mutate(!roster.viewerHidden)}
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            {roster.viewerHidden ? (
              <>
                <Eye className="h-4 w-4 text-emerald-500" />
                {currentLang === 'vi' ? 'Hiển thị tên tôi' : 'Show my name'}
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-red-500" />
                {currentLang === 'vi' ? 'Ẩn tên tôi' : 'Hide my name'}
              </>
            )}
          </Button>
        </div>
      )}

      {roster.membersVisible ? (
        roster.members.length === 0 ? (
          <div className="py-12 text-center text-sm italic text-gray-400">
            {currentLang === 'vi'
              ? 'Chưa có tình nguyện viên nào tham gia chiến dịch này.'
              : 'No volunteers have joined this campaign yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roster.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-secondary/40"
              >
                <UserAvatar name={member.fullName} avatarUrl={member.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{member.fullName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {currentLang === 'vi' ? 'Tham gia ngày' : 'Joined'}{' '}
                    {formatJoinedDate(member.joinedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {roster.totalVolunteers}{' '}
            {currentLang === 'vi'
              ? 'người đã tham gia chiến dịch này'
              : roster.totalVolunteers === 1
                ? 'person has joined this campaign'
                : 'people have joined this campaign'}
          </p>
          <p className="text-xs text-muted-foreground">
            {roster.visibility === 'PUBLIC'
              ? currentLang === 'vi'
                ? 'Đăng nhập để xem danh sách thành viên.'
                : 'Log in to see who has joined.'
              : currentLang === 'vi'
                ? 'Danh sách tình nguyện viên chỉ hiển thị cho thành viên chiến dịch.'
                : 'The volunteer list is visible to campaign members only.'}
          </p>
        </div>
      )}
    </div>
  );
}
