import type { Task } from '../types/campaignTask';

interface TaskDragPermissionInput {
  task: Task;
  currentUserId?: number;
  isCampaignAdmin: boolean;
  dragDisabled: boolean;
  isPending: boolean;
}

export interface TaskDragPermissionState {
  hasDragPermission: boolean;
  canMoveFromStatus: boolean;
  canDrag: boolean;
}

export const getTaskDragPermissionState = ({
  task,
  currentUserId,
  isCampaignAdmin,
  dragDisabled,
  isPending,
}: TaskDragPermissionInput): TaskDragPermissionState => {
  const isAssignee =
    currentUserId !== undefined && task.assignees.some((user) => user.id === currentUserId);
  const hasDragPermission = isCampaignAdmin || isAssignee;
  const canMoveFromStatus = task.status !== 'DONE' || isCampaignAdmin;
  return {
    hasDragPermission,
    canMoveFromStatus,
    canDrag: !dragDisabled && !isPending && hasDragPermission && canMoveFromStatus,
  };
};
