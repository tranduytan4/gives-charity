import { getAvatarUrl } from '@/shared/utils/media';
import type { TaskUser } from '../../types/campaignTask';

interface AssigneeAvatarGroupProps {
  assignees: TaskUser[];
  maxCount?: number;
}

export function AssigneeAvatarGroup({ assignees, maxCount = 3 }: AssigneeAvatarGroupProps) {
  const visibleAssignees = assignees.slice(0, maxCount);
  const extraCount = assignees.length - maxCount;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {visibleAssignees.map((user) => (
        <div key={user.id} className="relative group cursor-pointer inline-block shrink-0">
          {user.avatarUrl ? (
            <img
              src={getAvatarUrl(user.avatarUrl) ?? undefined}
              alt={user.fullName}
              className="h-6 w-6 rounded-full border-2 border-white object-cover shadow-xs ring-1 ring-slate-100 transition-transform duration-200 group-hover:scale-110"
            />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-xs ring-1 ring-slate-100 transition-transform duration-200 group-hover:scale-110">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 bg-slate-900/90 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-sm whitespace-nowrap backdrop-blur-xs">
            {user.fullName} ({user.role === 'CAMPAIGN_ADMIN' ? 'Admin' : 'Volunteer'})
          </div>
        </div>
      ))}

      {extraCount > 0 && (
        <div className="relative group flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500 shadow-xs ring-1 ring-slate-100">
          +{extraCount}
          {/* Overflow tooltip: shows the hidden names */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 bg-slate-900/90 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-sm whitespace-nowrap backdrop-blur-xs">
            {assignees
              .slice(maxCount)
              .map((u) => u.fullName)
              .join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
