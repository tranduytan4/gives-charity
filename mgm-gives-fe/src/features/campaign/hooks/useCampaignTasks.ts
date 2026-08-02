import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCampaignTask,
  getCampaignTaskActivities,
  getCampaignTaskLabels,
  getCampaignTasks,
  getTaskAssignableMembers,
  isTaskMoveConflict,
  moveCampaignTask,
} from '../api/campaignTaskApi';
import { campaignTaskQueryKeys } from '../constants/taskQueryKeys';
import type { CreateCampaignTaskRequest, Task, TaskStatus, TaskView } from '../types/campaignTask';
import { optimisticallyMoveTask, rollbackFailedTaskMove } from '../utils/taskCache';
import { syncTaskAcrossViews } from '../utils/taskQueryCache';

export const useCampaignTasks = (campaignId: number, view: TaskView, enabled = true) =>
  useQuery({
    queryKey: campaignTaskQueryKeys.list(campaignId, view),
    queryFn: () => getCampaignTasks(campaignId, view),
    enabled: enabled && campaignId > 0,
  });

export const useCampaignTaskLabels = (campaignId: number, enabled = true) =>
  useQuery({
    queryKey: campaignTaskQueryKeys.labels(campaignId),
    queryFn: () => getCampaignTaskLabels(campaignId),
    enabled: enabled && campaignId > 0,
  });

export const useTaskAssignableMembers = (campaignId: number, enabled = true) =>
  useQuery({
    queryKey: campaignTaskQueryKeys.members(campaignId),
    queryFn: () => getTaskAssignableMembers(campaignId),
    enabled: enabled && campaignId > 0,
  });

export const useLatestCampaignTaskActivity = (taskId: number, enabled = true) =>
  useQuery({
    queryKey: campaignTaskQueryKeys.latestActivity(taskId),
    queryFn: () => getCampaignTaskActivities(taskId, 0, 1),
    enabled: enabled && taskId > 0,
  });

export const useCampaignTaskActivityHistory = (taskId: number, enabled = true) =>
  useInfiniteQuery({
    queryKey: campaignTaskQueryKeys.activityHistory(taskId),
    queryFn: ({ pageParam }) => getCampaignTaskActivities(taskId, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: enabled && taskId > 0,
  });

export const useCreateCampaignTask = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCampaignTaskRequest) => createCampaignTask(campaignId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: campaignTaskQueryKeys.list(campaignId, 'active'),
        exact: true,
      });
    },
  });
};

export const useTaskStatusMutation = (campaignId: number, view: TaskView) => {
  const queryClient = useQueryClient();
  const queryKey = campaignTaskQueryKeys.list(campaignId, view);
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      expectedVersion,
      position,
    }: {
      taskId: number;
      status: TaskStatus;
      expectedVersion: number;
      position?: number;
    }) => moveCampaignTask(taskId, { status, expectedVersion, position }),
    onMutate: ({ taskId, status, position }) => {
      const cancellation = queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (tasks = []) =>
        optimisticallyMoveTask(tasks, taskId, status, position),
      );
      return cancellation.then(() => ({ previousTasks }));
    },
    onSuccess: (serverTask) => {
      syncTaskAcrossViews(queryClient, campaignId, serverTask);
      void queryClient.invalidateQueries({
        queryKey: campaignTaskQueryKeys.activities(serverTask.id),
      });
    },
    onError: (error, variables, context) => {
      if (isTaskMoveConflict(error) && error.result) {
        syncTaskAcrossViews(queryClient, campaignId, error.result);
        return;
      }
      queryClient.setQueryData<Task[]>(queryKey, (tasks = []) =>
        rollbackFailedTaskMove(
          tasks,
          context?.previousTasks,
          variables.taskId,
          variables.expectedVersion,
        ),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.campaign(campaignId) }),
  });
};
