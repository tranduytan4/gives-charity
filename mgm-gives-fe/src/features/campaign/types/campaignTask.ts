export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskView = 'active' | 'archived';

export interface TaskUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: 'CAMPAIGN_ADMIN' | 'VOLUNTEER' | 'ADMIN';
}

export interface BoardLabel {
  id: number;
  title: string;
  color: string;
}

export interface TaskAttachment {
  id: number;
  originalFilename: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadedBy: TaskUser | null;
  uploadedAt: string;
}

export interface Task {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  dueDate: string;
  position: number;
  version: number;
  labels: number[];
  status: TaskStatus;
  assignees: TaskUser[];
  createdBy: TaskUser | null;
  attachments: TaskAttachment[];
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type CampaignTaskActivityAction =
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'TITLE_UPDATED'
  | 'DESCRIPTION_UPDATED'
  | 'DUE_DATE_UPDATED'
  | 'ASSIGNEE_ADDED'
  | 'ASSIGNEE_REMOVED'
  | 'LABEL_ADDED'
  | 'LABEL_REMOVED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REMOVED'
  | 'TASK_ARCHIVED'
  | 'TASK_UNARCHIVED'
  | 'TASK_DELETED'
  | 'TASK_RESTORED';

export interface CampaignTaskActivity {
  id: number;
  action: CampaignTaskActivityAction;
  actor: {
    id: number | null;
    name: string;
    avatarUrl: string | null;
  };
  details: Record<string, unknown>;
  createdAt: string;
}

export interface CampaignTaskResponse {
  id: number;
  campaignId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  version: number;
  dueDate: string | null;
  isArchived: boolean;
  deletedAt: string | null;
  createdBy: TaskUser | null;
  assignees: TaskUser[];
  labels: Array<{ id: number; name: string; color: string }>;
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  assigneeIds?: number[];
  labelIds?: number[];
  status?: TaskStatus;
}

export interface UpdateCampaignTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  clearDueDate?: boolean;
  assigneeIds?: number[];
  labelIds?: number[];
  status?: TaskStatus;
  version?: number;
}

export interface MoveCampaignTaskRequest {
  status: TaskStatus;
  expectedVersion: number;
  position?: number;
}

export type CampaignTaskChangeAction =
  | 'CREATED'
  | 'UPDATED'
  | 'MOVED'
  | 'ARCHIVED'
  | 'UNARCHIVED'
  | 'DELETED'
  | 'RESTORED'
  | 'PERMANENTLY_DELETED';

export interface CampaignTaskChangedEvent<TTask = Task> {
  type: 'TASK_CHANGED';
  action: CampaignTaskChangeAction;
  campaignId: number;
  taskId: number;
  version: number;
  task: TTask | null;
  updatedAt: string;
  updatedBy: number;
}

export const toBackendDueDate = (date: string): string | undefined =>
  date ? `${date}T23:59:59` : undefined;

export const toTask = (task: CampaignTaskResponse): Task => ({
  ...task,
  description: task.description ?? '',
  dueDate: task.dueDate?.slice(0, 10) ?? '',
  labels: [...task.labels]
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((label) => label.id),
  assignees: task.assignees.map((user) => ({ ...user, avatarUrl: user.avatarUrl ?? undefined })),
  createdBy: task.createdBy
    ? { ...task.createdBy, avatarUrl: task.createdBy.avatarUrl ?? undefined }
    : null,
  attachments: task.attachments ?? [],
  deletedAt: task.deletedAt ?? null,
});
