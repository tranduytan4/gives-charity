import type { QueryClient } from '@tanstack/react-query';
import { campaignTaskQueryKeys } from '../constants/taskQueryKeys';
import type { Task, TaskView } from '../types/campaignTask';
import { removeTask, syncTaskForView } from './taskCache';

const TASK_VIEWS: TaskView[] = ['active', 'archived'];

export const syncTaskAcrossViews = (queryClient: QueryClient, campaignId: number, task: Task) => {
  for (const view of TASK_VIEWS) {
    queryClient.setQueryData<Task[]>(campaignTaskQueryKeys.list(campaignId, view), (tasks = []) =>
      syncTaskForView(tasks, task, view),
    );
  }
};

export const removeTaskAcrossViews = (
  queryClient: QueryClient,
  campaignId: number,
  taskId: number,
) => {
  for (const view of TASK_VIEWS) {
    queryClient.setQueryData<Task[]>(campaignTaskQueryKeys.list(campaignId, view), (tasks = []) =>
      removeTask(tasks, taskId),
    );
  }
};
