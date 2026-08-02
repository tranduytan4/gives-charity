import { CircleDollarSign, ClipboardCheck, Heart, Target, Users } from 'lucide-react';
import type { CampaignResult } from '@/features/campaign/types/finalPost';
import { formatCurrency } from '@/shared/utils/currency';

interface CampaignFinalReportStatsProps {
  campaignResult: CampaignResult;
}

export function CampaignFinalReportStats({ campaignResult }: CampaignFinalReportStatsProps) {
  const goalPct = Math.round(campaignResult.goalPercent);
  const raisedAmount = campaignResult.finalAmountRaised ?? campaignResult.totalRaised;

  const stats = [
    {
      icon: <CircleDollarSign className="h-5.5 w-5.5" />,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-100/60 group-hover:bg-emerald-500',
      value: formatCurrency(raisedAmount),
      label: 'Raised',
    },
    {
      icon: <Heart className="h-5.5 w-5.5 fill-current" />,
      accent: 'bg-blue-50 text-blue-600 border-blue-100/60 group-hover:bg-blue-500',
      value: String(campaignResult.donorCount),
      label: 'Donors',
    },
    {
      icon: <Users className="h-5.5 w-5.5" />,
      accent: 'bg-amber-50 text-amber-600 border-amber-100/60 group-hover:bg-amber-500',
      value: String(campaignResult.volunteerCount),
      label: 'Volunteers',
    },
    {
      icon: <Target className="h-5.5 w-5.5" />,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-100/60 group-hover:bg-emerald-500',
      value: `${goalPct}%`,
      label: 'Goal reached',
    },
    // Omitted entirely (not shown as "0/0") when no tasks were tracked — consistent with how
    // the narrative sections below hide themselves rather than rendering an empty state.
    ...(campaignResult.taskCount > 0
      ? [
          {
            icon: <ClipboardCheck className="h-5.5 w-5.5" />,
            accent: 'bg-violet-50 text-violet-600 border-violet-100/60 group-hover:bg-violet-500',
            value: `${campaignResult.completedTaskCount}/${campaignResult.taskCount}`,
            label: 'Tasks completed',
          },
        ]
      : []),
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Impact at a glance</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col items-start gap-3"
          >
            <div
              className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:text-white group-hover:scale-105 ${stat.accent}`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
