import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Archive, Calendar, Lock, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardLabel, Task, TaskUser, TaskView } from '../../types/campaignTask';
import { getTaskDragPermissionState } from '../../utils/taskDragPermissions';
import { AssigneeAvatarGroup } from './AssigneeAvatarGroup';
import { TaskLabel } from './TaskLabel';

interface TaskCardProps {
  task: Task;
  isCampaignAdmin: boolean;
  currentUser: TaskUser | null;
  boardLabels: BoardLabel[];
  isColorblindMode?: boolean;
  /** When true the card renders as a static DragOverlay clone (no drag hooks). */
  isOverlay?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onArchive?: (taskId: number) => void;
  onUnarchive?: (taskId: number) => void;
  view?: TaskView;
  dragDisabled?: boolean;
  isPending?: boolean;
  onClick?: () => void;
}

// ─── Due-date badge helper ─────────────────────────────────────────────────────

function getDueDateStatus(dateStr: string) {
  if (!dateStr) return { text: 'No due date', bg: 'bg-slate-50 text-slate-400 border-slate-100' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: 'Overdue', bg: 'bg-rose-50 text-rose-600 border-rose-100' };
  if (diffDays === 0) return { text: 'Today', bg: 'bg-amber-50 text-amber-600 border-amber-100' };
  if (diffDays <= 3)
    return { text: `${diffDays}d left`, bg: 'bg-orange-50 text-orange-600 border-orange-100' };
  return { text: dateStr, bg: 'bg-slate-50 text-slate-500 border-slate-100' };
}

// ─── Inline Delete Confirm Dialog ──────────────────────────────────────────────

interface DeleteConfirmProps {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ taskTitle, onConfirm, onCancel }: DeleteConfirmProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Delete confirmation"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-slate-800">
            {currentLang === 'vi' ? 'Xóa công việc' : 'Delete Task'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed break-words [overflow-wrap:anywhere]">
            {currentLang === 'vi' ? (
              <>
                Xóa vĩnh viễn công việc{' '}
                <span className="font-semibold text-slate-700">"{taskTitle}"</span>? Hành động này
                không thể hoàn tác.
              </>
            ) : (
              <>
                Permanently delete{' '}
                <span className="font-semibold text-slate-700">"{taskTitle}"</span>? This action
                cannot be undone.
              </>
            )}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition-all active:scale-95"
          >
            {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-rose-200"
          >
            {currentLang === 'vi' ? 'Xóa' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface TaskCardContentProps extends TaskCardProps {
  canDrag: boolean;
  hasDragPermission: boolean;
  draggable?: ReturnType<typeof useDraggable>;
}

export function TaskCard(props: TaskCardProps) {
  if (props.isOverlay) {
    return <TaskCardContent {...props} canDrag={false} hasDragPermission />;
  }
  return <DraggableTaskCard {...props} />;
}

function DraggableTaskCard(props: TaskCardProps) {
  const { canDrag, hasDragPermission } = getTaskDragPermissionState({
    task: props.task,
    currentUserId: props.currentUser?.id,
    isCampaignAdmin: props.isCampaignAdmin,
    dragDisabled: props.dragDisabled ?? false,
    isPending: props.isPending ?? false,
  });
  const draggable = useDraggable({ id: props.task.id, disabled: !canDrag });
  return (
    <TaskCardContent
      {...props}
      canDrag={canDrag}
      hasDragPermission={hasDragPermission}
      draggable={draggable}
    />
  );
}

function TaskCardContent({
  task,
  isCampaignAdmin,
  boardLabels,
  isColorblindMode = false,
  isOverlay = false,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  view = 'active',
  onClick,
  canDrag,
  hasDragPermission,
  isPending = false,
  draggable,
}: TaskCardContentProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const wasDraggingRef = useRef(false);

  const attributes = draggable?.attributes;
  const listeners = draggable?.listeners;
  const setNodeRef = draggable?.setNodeRef;
  const isDragging = draggable?.isDragging ?? false;
  const transform = draggable?.transform ?? null;

  if (isDragging) wasDraggingRef.current = true;

  useEffect(() => {
    if (isDragging || !wasDraggingRef.current) return;
    const resetTimer = window.setTimeout(() => {
      wasDraggingRef.current = false;
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [isDragging]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    // DragOverlay is the only visible representation while dragging. Keeping the
    // source card in the document (but invisible) preserves the list layout and
    // avoids the double-card/overlap effect during a move.
    opacity: isDragging ? 0 : isPending ? 0.65 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const dateStatus = getDueDateStatus(task.dueDate);

  const cardClassName = isOverlay
    ? 'relative min-w-0 w-full shrink-0 bg-white rounded-xl p-3 border border-slate-200 shadow-[0_16px_36px_rgba(0,0,0,0.08)] cursor-grabbing'
    : [
        'group relative min-w-0 w-full shrink-0 bg-white rounded-xl p-3 border border-slate-100',
        'shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)]',
        'transition-[box-shadow,border-color] duration-200',
        'hover:shadow-[0_10px_28px_rgba(149,157,165,0.08)] hover:border-slate-200/90',
        canDrag ? 'cursor-grab' : 'cursor-default',
        isDragging ? 'cursor-grabbing' : '',
      ].join(' ');

  return (
    <>
      {/* Delete confirmation dialog (portal-style, rendered above everything) */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          taskTitle={task.title}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete?.(task.id);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <article
        ref={setNodeRef}
        style={style}
        {...(!isOverlay && canDrag ? listeners : {})}
        {...(!isOverlay && canDrag ? attributes : {})}
        onClick={(e) => {
          // Do not trigger card click when an action button was pressed
          if ((e.target as HTMLElement).closest('button')) return;
          if (wasDraggingRef.current) {
            wasDraggingRef.current = false;
            return;
          }
          onClick?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
        className={cardClassName}
      >
        {/* Hover actions are positioned independently so they do not increase card height. */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
          {!isOverlay &&
            isCampaignAdmin &&
            (view === 'archived' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnarchive?.(task.id);
                }}
                className="text-slate-350 hover:text-emerald-600 hover:bg-slate-100 p-0.5 rounded cursor-pointer"
                title="Unarchive task"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(task.id);
                }}
                className="text-slate-350 hover:text-amber-600 hover:bg-slate-100 p-0.5 rounded cursor-pointer"
                title="Archive task"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            ))}
          {!isOverlay && isCampaignAdmin && view === 'active' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(task);
              }}
              className="text-slate-350 hover:text-primary hover:bg-slate-100 p-0.5 rounded transition-all duration-150 cursor-pointer"
              title="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {!isOverlay && isCampaignAdmin && view === 'archived' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="text-slate-350 hover:text-rose-600 hover:bg-slate-100 p-0.5 rounded transition-all duration-150 cursor-pointer"
              title="Permanently delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Lock icon — shown when the current user has no drag permission. */}
        {!isOverlay && !hasDragPermission && (
          <div
            className="absolute right-3 top-3 text-slate-300 p-0.5"
            title="Only admins or assignees can drag this card"
          >
            <Lock className="h-3.5 w-3.5" />
          </div>
        )}

        {task.labels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 pr-14">
            {task.labels.map((labelId) => {
              const label = boardLabels.find((l) => l.id === labelId);
              if (!label) return null;
              return <TaskLabel key={labelId} label={label} isColorblindMode={isColorblindMode} />;
            })}
          </div>
        )}

        <h4 className="min-w-0 pr-14 font-bold text-slate-800 text-sm leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
          {task.title}
        </h4>

        {(task.dueDate || task.assignees.length > 0) && (
          <div className="mt-3 flex items-center gap-2">
            {task.dueDate && (
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${dateStatus.bg}`}
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{dateStatus.text}</span>
              </div>
            )}
            {task.assignees.length > 0 && (
              <div className="ml-auto">
                <AssigneeAvatarGroup assignees={task.assignees} />
              </div>
            )}
          </div>
        )}
      </article>
    </>
  );
}
