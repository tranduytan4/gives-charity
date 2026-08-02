import type { TaskView } from '../types/campaignTask';

export const campaignTaskQueryKeys = {
  all: ['campaign-tasks'] as const,
  campaign: (campaignId: number) => ['campaign-tasks', campaignId] as const,
  list: (campaignId: number, view: TaskView) => ['campaign-tasks', campaignId, view] as const,
  detail: (taskId: number) => ['campaign-task', taskId] as const,
  activities: (taskId: number) => ['campaign-task-activities', taskId] as const,
  latestActivity: (taskId: number) => ['campaign-task-activities', taskId, 'latest'] as const,
  activityHistory: (taskId: number) => ['campaign-task-activities', taskId, 'history'] as const,
  labels: (campaignId: number) => ['campaign-task-labels', campaignId] as const,
  members: (campaignId: number) => ['campaign-task-members', campaignId] as const,
};
