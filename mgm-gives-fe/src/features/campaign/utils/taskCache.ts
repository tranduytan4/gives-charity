import type { CampaignTaskChangedEvent, Task, TaskStatus, TaskView } from '../types/campaignTask';

const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export interface TaskDropTarget {
  status: TaskStatus;
  position?: number;
}

export const deduplicateTasks = (tasks: Task[]): Task[] => {
  const tasksById = new Map<string, Task>();
  const taskIds: string[] = [];

  for (const task of tasks) {
    const taskId = String(task.id);
    const current = tasksById.get(taskId);
    if (!current) taskIds.push(taskId);
    if (!current || task.version >= current.version) tasksById.set(taskId, task);
  }

  return taskIds
    .map((taskId) => tasksById.get(taskId))
    .filter((task): task is Task => task !== undefined);
};

export const resolveTaskDropTarget = (
  tasks: Task[],
  origin: Task,
  overId: string | number,
): TaskDropTarget | null => {
  const overTask = tasks.find((task) => task.id === Number(overId));
  const status = TASK_STATUSES.includes(overId as TaskStatus)
    ? (overId as TaskStatus)
    : overTask?.status;
  if (!status) return null;

  if (!overTask) return { status };
  const position =
    origin.status === status && origin.position < overTask.position
      ? overTask.position + 1
      : overTask.position;
  return { status, position };
};

export const optimisticallyMoveTask = (
  tasks: Task[],
  taskId: number,
  status: TaskStatus,
  position?: number,
): Task[] => {
  const movedTask = tasks.find((task) => task.id === taskId);
  if (!movedTask) return tasks;
  const updatedTask = { ...movedTask, status };
  if (position !== undefined) {
    // A tiny offset so it visually sits right before the target item
    // This resolves ties until the server syncs real positions.
    updatedTask.position = position - 0.1;
  } else {
    const destinationEnd = tasks
      .filter((task) => task.id !== taskId && task.status === status)
      .reduce((maximum, task) => Math.max(maximum, task.position), 0);
    updatedTask.position = destinationEnd + 1;
  }
  return [...tasks.filter((task) => task.id !== taskId), updatedTask];
};

export const upsertTask = (tasks: Task[], replacement: Task): Task[] =>
  deduplicateTasks([...tasks, replacement]);

export const replaceTask = (tasks: Task[], replacement: Task): Task[] =>
  tasks.some((task) => task.id === replacement.id) ? upsertTask(tasks, replacement) : tasks;

export const removeTask = (tasks: Task[], taskId: number): Task[] =>
  tasks.filter((task) => task.id !== taskId);

export const rollbackFailedTaskMove = (
  tasks: Task[],
  previousTasks: Task[] | undefined,
  taskId: number,
  expectedVersion: number,
): Task[] => {
  const currentTask = tasks.find((task) => task.id === taskId);
  if (!currentTask || currentTask.version > expectedVersion) return tasks;
  return previousTasks ?? tasks;
};

export const taskEventRequiresReconciliation = (event: CampaignTaskChangedEvent): boolean =>
  event.action === 'MOVED';

export const syncTaskForView = (tasks: Task[], task: Task, view: TaskView): Task[] => {
  const belongsToView =
    task.deletedAt === null && (view === 'archived' ? task.isArchived : !task.isArchived);
  return belongsToView ? upsertTask(tasks, task) : removeTask(tasks, task.id);
};

export const getLatestTaskVersion = (
  taskId: number,
  ledger: Map<number, number>,
  ...taskLists: Array<Task[] | undefined>
): number => {
  let latestVersion = ledger.get(taskId) ?? -1;
  for (const tasks of taskLists) {
    const cached = tasks?.find((task) => task.id === taskId);
    if (cached) latestVersion = Math.max(latestVersion, cached.version);
  }
  return latestVersion;
};

export const applyTaskChangedEvent = (
  tasks: Task[],
  event: CampaignTaskChangedEvent,
  view: TaskView,
): Task[] => {
  if (event.action === 'PERMANENTLY_DELETED' || !event.task) {
    return removeTask(tasks, event.taskId);
  }
  return syncTaskForView(tasks, event.task, view);
};
