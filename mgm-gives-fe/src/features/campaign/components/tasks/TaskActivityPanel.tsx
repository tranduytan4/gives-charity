import { Activity, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAvatarUrl } from '@/shared/utils/media';
import {
  useCampaignTaskActivityHistory,
  useLatestCampaignTaskActivity,
} from '../../hooks/useCampaignTasks';
import type { CampaignTaskActivity, CampaignTaskActivityAction } from '../../types/campaignTask';

interface TaskActivityPanelProps {
  taskId: number;
}

const statusLabel = (value: unknown) => {
  if (value === 'TODO') return 'To Do';
  if (value === 'IN_PROGRESS') return 'In Progress';
  if (value === 'DONE') return 'Done';
  return typeof value === 'string' ? value : 'Unknown';
};

const detailText = (details: Record<string, unknown>, key: string, fallback: string) => {
  const value = details[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
};

const formatDueDate = (value: unknown) => {
  if (typeof value !== 'string' || !value) return 'no due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const activityMessage = (action: CampaignTaskActivityAction, details: Record<string, unknown>) => {
  switch (action) {
    case 'TASK_CREATED':
      return 'created this task';
    case 'STATUS_CHANGED':
      return `moved this task from ${statusLabel(details.fromStatus)} to ${statusLabel(details.toStatus)}`;
    case 'TITLE_UPDATED':
      return `changed the title to “${detailText(details, 'toTitle', 'Untitled task')}”`;
    case 'DESCRIPTION_UPDATED':
      return 'updated the description';
    case 'DUE_DATE_UPDATED':
      return `changed the due date from ${formatDueDate(details.fromDueDate)} to ${formatDueDate(details.toDueDate)}`;
    case 'ASSIGNEE_ADDED':
      return `assigned ${detailText(details, 'name', 'a member')} to this task`;
    case 'ASSIGNEE_REMOVED':
      return `removed ${detailText(details, 'name', 'a member')} from this task`;
    case 'LABEL_ADDED':
      return `added the ${detailText(details, 'name', 'label')} label`;
    case 'LABEL_REMOVED':
      return `removed the ${detailText(details, 'name', 'label')} label`;
    case 'ATTACHMENT_ADDED':
      return `attached ${detailText(details, 'name', 'a file')}`;
    case 'ATTACHMENT_REMOVED':
      return `removed the attachment ${detailText(details, 'name', 'a file')}`;
    case 'TASK_ARCHIVED':
      return 'archived this task';
    case 'TASK_UNARCHIVED':
      return 'returned this task to the board';
    case 'TASK_DELETED':
      return 'deleted this task';
    case 'TASK_RESTORED':
      return 'restored this task';
  }
};

const activityDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

function ActivityItem({ activity }: { activity: CampaignTaskActivity }) {
  const avatarUrl = getAvatarUrl(activity.actor.avatarUrl) ?? undefined;
  const initial = activity.actor.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <li className="flex gap-2.5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full border border-white object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-extrabold text-primary">
          {initial}
        </div>
      )}
      <div className="min-w-0 pt-0.5">
        <p className="break-words text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
          <span className="font-bold text-slate-800">{activity.actor.name}</span>{' '}
          {activityMessage(activity.action, activity.details)}
        </p>
        <time
          dateTime={activity.createdAt}
          className="mt-0.5 block text-[10px] font-medium text-slate-400"
        >
          {activityDate(activity.createdAt)}
        </time>
      </div>
    </li>
  );
}

export function TaskActivityPanel({ taskId }: TaskActivityPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const latestQuery = useLatestCampaignTaskActivity(taskId, !showDetails);
  const historyQuery = useCampaignTaskActivityHistory(taskId, showDetails);

  const activities = useMemo(
    () =>
      showDetails
        ? (historyQuery.data?.pages.flatMap((page) => page.content) ?? [])
        : (latestQuery.data?.content ?? []),
    [historyQuery.data, latestQuery.data, showDetails],
  );

  useEffect(() => {
    if (!showDetails || !historyQuery.hasNextPage || historyQuery.isFetchingNextPage) return;
    const target = loadMoreRef.current;
    const root = scrollContainerRef.current;
    if (!target || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void historyQuery.fetchNextPage();
        }
      },
      { root, rootMargin: '80px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    historyQuery.fetchNextPage,
    historyQuery.hasNextPage,
    historyQuery.isFetchingNextPage,
    showDetails,
  ]);

  const activeQuery = showDetails ? historyQuery : latestQuery;

  return (
    <aside className="flex min-h-[220px] min-w-0 flex-col rounded-2xl border border-slate-150/40 bg-slate-50/60 p-5 md:min-h-[520px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 shrink-0 text-slate-500" />
          <h3 className="truncate text-xs font-extrabold text-slate-800">Activity</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((current) => !current)}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:border-primary/30 hover:text-primary"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto pr-1 md:max-h-[62vh] custom-scrollbar"
      >
        {activeQuery.isLoading ? (
          <div className="space-y-4" role="status" aria-label="Loading task activity">
            {[0, 1].slice(0, showDetails ? 2 : 1).map((item) => (
              <div key={item} className="flex animate-pulse gap-2.5">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-2.5 w-full rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : activeQuery.isError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-center">
            <p className="text-[11px] font-semibold text-rose-700">Unable to load activity.</p>
            <button
              type="button"
              onClick={() => void activeQuery.refetch()}
              className="mx-auto mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-700 underline"
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </button>
          </div>
        ) : activities.length > 0 ? (
          <ul className="space-y-5">
            {activities.map((item) => (
              <ActivityItem key={item.id} activity={item} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-[11px] italic text-slate-400">
            No activity recorded yet.
          </div>
        )}
        <div ref={loadMoreRef} className="h-1" />
        {historyQuery.isFetchingNextPage && (
          <p className="py-3 text-center text-[10px] font-semibold text-slate-400">
            Loading more activity...
          </p>
        )}
      </div>
    </aside>
  );
}
