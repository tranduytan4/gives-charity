import type { AxiosProgressEvent } from 'axios';
import apiClient from '@/lib/apiClient';
import type { ApiResponse } from '@/shared/types/ApiResponse';
import type {
  BoardLabel,
  CampaignTaskActivity,
  CampaignTaskResponse,
  CreateCampaignTaskRequest,
  MoveCampaignTaskRequest,
  SpringPage,
  Task,
  TaskAttachment,
  TaskUser,
  TaskView,
  UpdateCampaignTaskRequest,
} from '../types/campaignTask';
import { toTask } from '../types/campaignTask';
import { deduplicateTasks } from '../utils/taskCache';

const getResult = <T>(response: { data: ApiResponse<T> }): T => response.data.result;

export const getCampaignTasks = async (campaignId: number, view: TaskView): Promise<Task[]> => {
  const tasks: Task[] = [];
  let page = 0;
  let last = false;
  while (!last) {
    const response = await apiClient.get<ApiResponse<SpringPage<CampaignTaskResponse>>>(
      `/campaigns/${campaignId}/tasks`,
      {
        params: {
          page,
          size: 100,
          sort: ['position,asc', 'id,asc'],
          isArchived: view === 'archived',
        },
        paramsSerializer: { indexes: null },
      },
    );
    const result = getResult(response);
    tasks.push(...result.content.map(toTask));
    last = result.last || page + 1 >= result.totalPages;
    page += 1;
  }
  return deduplicateTasks(tasks);
};

export const getCampaignTask = async (taskId: number): Promise<Task> => {
  const response = await apiClient.get<ApiResponse<CampaignTaskResponse>>(`/tasks/${taskId}`);
  return toTask(getResult(response));
};

export const getCampaignTaskActivities = async (
  taskId: number,
  page: number,
  size: number,
): Promise<SpringPage<CampaignTaskActivity>> => {
  const response = await apiClient.get<ApiResponse<SpringPage<CampaignTaskActivity>>>(
    `/tasks/${taskId}/activities`,
    {
      params: {
        page,
        size,
        sort: ['createdAt,desc', 'id,desc'],
      },
      paramsSerializer: { indexes: null },
    },
  );
  return getResult(response);
};

export const createCampaignTask = async (
  campaignId: number,
  request: CreateCampaignTaskRequest,
): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<CampaignTaskResponse>>(
    `/campaigns/${campaignId}/tasks`,
    request,
  );
  return toTask(getResult(response));
};

export const updateCampaignTask = async (
  taskId: number,
  request: UpdateCampaignTaskRequest,
): Promise<Task> => {
  const response = await apiClient.patch<ApiResponse<CampaignTaskResponse>>(
    `/tasks/${taskId}`,
    request,
  );
  return toTask(getResult(response));
};

export const moveCampaignTask = async (
  taskId: number,
  request: MoveCampaignTaskRequest,
): Promise<Task> => {
  try {
    const response = await apiClient.patch<ApiResponse<CampaignTaskResponse>>(
      `/tasks/${taskId}/move`,
      request,
    );
    return toTask(getResult(response));
  } catch (error) {
    const apiError = error as ApiResponse<CampaignTaskResponse>;
    if (apiError.code === 5014 && apiError.result) {
      throw {
        ...apiError,
        success: false as const,
        code: 5014,
        result: toTask(apiError.result),
      } satisfies TaskMoveError;
    }
    throw error;
  }
};

export interface TaskMoveError {
  success: false;
  code: number;
  message?: string;
  result?: Task;
}

export const isTaskMoveConflict = (error: unknown): error is TaskMoveError =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 5014;

export const permanentlyDeleteCampaignTask = async (taskId: number) =>
  apiClient.delete(`/tasks/${taskId}/permanently`);
export const archiveCampaignTask = async (taskId: number) =>
  toTask(
    getResult(await apiClient.post<ApiResponse<CampaignTaskResponse>>(`/tasks/${taskId}/archive`)),
  );
export const unarchiveCampaignTask = async (taskId: number) =>
  toTask(
    getResult(
      await apiClient.post<ApiResponse<CampaignTaskResponse>>(`/tasks/${taskId}/unarchive`),
    ),
  );
export const getCampaignTaskLabels = async (campaignId: number): Promise<BoardLabel[]> => {
  const response = await apiClient.get<
    ApiResponse<Array<{ id: number; name: string; color: string }>>
  >(`/campaigns/${campaignId}/labels`);
  return getResult(response).map((label) => ({
    id: label.id,
    title: label.name,
    color: label.color,
  }));
};

export const createCampaignTaskLabel = async (
  campaignId: number,
  label: Omit<BoardLabel, 'id'>,
): Promise<BoardLabel> => {
  const response = await apiClient.post<ApiResponse<{ id: number; name: string; color: string }>>(
    `/campaigns/${campaignId}/labels`,
    { name: label.title, color: label.color },
  );
  const result = getResult(response);
  return { id: result.id, title: result.name, color: result.color };
};

export const updateCampaignTaskLabel = async (label: BoardLabel): Promise<BoardLabel> => {
  const response = await apiClient.patch<ApiResponse<{ id: number; name: string; color: string }>>(
    `/labels/${label.id}`,
    { name: label.title, color: label.color },
  );
  const result = getResult(response);
  return { id: result.id, title: result.name, color: result.color };
};

export const deleteCampaignTaskLabel = async (labelId: number) =>
  apiClient.delete(`/labels/${labelId}`);

export const getTaskAssignableMembers = async (campaignId: number): Promise<TaskUser[]> => {
  const response = await apiClient.get<ApiResponse<Array<TaskUser & { avatarUrl: string | null }>>>(
    `/campaigns/${campaignId}/task-assignees`,
  );
  return getResult(response).map((member) => ({
    ...member,
    avatarUrl: member.avatarUrl ?? undefined,
  }));
};

export const addTaskAssignee = async (taskId: number, userId: number) =>
  apiClient.post(`/tasks/${taskId}/assignees/${userId}`);
export const removeTaskAssignee = async (taskId: number, userId: number) =>
  apiClient.delete(`/tasks/${taskId}/assignees/${userId}`);
export const addTaskLabel = async (taskId: number, labelId: number) =>
  apiClient.post(`/tasks/${taskId}/labels/${labelId}`);
export const removeTaskLabel = async (taskId: number, labelId: number) =>
  apiClient.delete(`/tasks/${taskId}/labels/${labelId}`);

export const uploadTaskAttachment = async (
  taskId: number,
  file: File,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
): Promise<TaskAttachment> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<TaskAttachment>>(
    `/tasks/${taskId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress },
  );
  return getResult(response);
};

export const deleteTaskAttachment = async (taskId: number, attachmentId: number) =>
  apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
