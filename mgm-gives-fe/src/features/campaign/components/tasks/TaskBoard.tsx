import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  Accessibility,
  ArrowLeft,
  Calendar,
  Check,
  Download,
  FileText,
  Filter,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';
import { ROUTES } from '@/shared/constants/routes';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { getAvatarUrl, getMediaUrl } from '@/shared/utils/media';
import {
  archiveCampaignTask,
  createCampaignTaskLabel,
  deleteCampaignTaskLabel,
  deleteTaskAttachment,
  isTaskMoveConflict,
  moveCampaignTask,
  permanentlyDeleteCampaignTask,
  unarchiveCampaignTask,
  updateCampaignTask,
  updateCampaignTaskLabel,
  uploadTaskAttachment,
} from '../../api/campaignTaskApi';
import { campaignTaskQueryKeys } from '../../constants/taskQueryKeys';
import { useCampaignTaskSocket } from '../../hooks/useCampaignTaskSocket';
import {
  useCampaignTaskLabels,
  useCampaignTasks,
  useCreateCampaignTask,
  useTaskAssignableMembers,
  useTaskStatusMutation,
} from '../../hooks/useCampaignTasks';
import type { BoardLabel, Task, TaskStatus, TaskUser, TaskView } from '../../types/campaignTask';
import { toBackendDueDate } from '../../types/campaignTask';
import { deduplicateTasks, optimisticallyMoveTask } from '../../utils/taskCache';
import { removeTaskAcrossViews, syncTaskAcrossViews } from '../../utils/taskQueryCache';
import { TaskActivityPanel } from './TaskActivityPanel';
import { TaskCard } from './TaskCard';
import { TaskColumn } from './TaskColumn';
import { getColorblindPattern, TaskLabel } from './TaskLabel';

// ─── Trello's 10 canonical colours (pastel versions) ──────────────────────────
const TRELLO_COLORS = [
  '#4DA379', // green
  '#DFAC34', // yellow
  '#E08550', // orange
  '#E25C5F', // red
  '#9F72C6', // purple
  '#5988D6', // blue
  '#86BE54', // lime
  '#E6739A', // pink
  '#55B5CC', // sky
  '#5C6F8E', // dark
];

const getColorblindStorageKey = (userId?: number) =>
  `campaign-task-colorblind-mode:${userId ?? 'anonymous'}`;

type TaskSortOption = 'date-newest' | 'date-oldest' | 'label';

interface ColumnSort {
  sortBy: TaskSortOption;
  priorityLabelId?: number;
}

const sortColumnTasks = (tasks: Task[], sort?: ColumnSort): Task[] => {
  const byBoardPosition = (a: Task, b: Task) => a.position - b.position || a.id - b.id;
  return [...tasks].sort((a, b) => {
    if (!sort) return byBoardPosition(a, b);
    if (sort.sortBy === 'date-newest') {
      const firstDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const secondDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return firstDueDate - secondDueDate || byBoardPosition(a, b);
    }
    if (sort.sortBy === 'date-oldest') {
      const firstDueDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const secondDueDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return secondDueDate - firstDueDate || byBoardPosition(a, b);
    }
    if (sort.sortBy === 'label' && sort.priorityLabelId) {
      const firstHasLabel = a.labels.includes(sort.priorityLabelId);
      const secondHasLabel = b.labels.includes(sort.priorityLabelId);
      return firstHasLabel === secondHasLabel ? byBoardPosition(a, b) : firstHasLabel ? -1 : 1;
    }
    return byBoardPosition(a, b);
  });
};

const isTaskUpdateConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const payload = error as {
    code?: number;
    response?: { status?: number; data?: { code?: number } };
  };
  return (
    payload.code === 5014 ||
    payload.response?.status === 409 ||
    payload.response?.data?.code === 5014
  );
};

const useDismissPickerOnOutsideInteraction = (
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (event: PointerEvent | FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || pickerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideInteraction);
    document.addEventListener('focusin', handleOutsideInteraction);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideInteraction);
      document.removeEventListener('focusin', handleOutsideInteraction);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setIsOpen]);

  return pickerRef;
};

// ─── LabelSelector ────────────────────────────────────────────────────────────

interface LabelSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  boardLabels: BoardLabel[];
  isColorblindMode: boolean;
  onUpdateBoardLabel: (label: BoardLabel) => void;
  onDeleteBoardLabel: (id: number) => Promise<void>;
  onCreateBoardLabel: (label: Omit<BoardLabel, 'id'>) => Promise<BoardLabel>;
}

export function LabelSelector({
  selectedIds,
  onChange,
  isOpen: controlledIsOpen,
  onOpenChange,
  boardLabels,
  isColorblindMode,
  onUpdateBoardLabel,
  onDeleteBoardLabel,
  onCreateBoardLabel,
}: LabelSelectorProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingLabel, setEditingLabel] = useState<BoardLabel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempColor, setTempColor] = useState('');
  const [labelPendingDeletion, setLabelPendingDeletion] = useState<BoardLabel | null>(null);
  const [isDeletingLabel, setIsDeletingLabel] = useState(false);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const setIsOpen = onOpenChange ?? setUncontrolledIsOpen;
  const pickerRef = useDismissPickerOnOutsideInteraction(isOpen, setIsOpen);

  const startEdit = (label: BoardLabel) => {
    setEditingLabel(label);
    setTempTitle(label.title);
    setTempColor(label.color);
  };

  const startCreate = () => {
    setIsCreating(true);
    setTempTitle('');
    setTempColor(TRELLO_COLORS[0] ?? '#61bd4f');
  };

  const saveEdit = () => {
    if (!editingLabel) return;
    onUpdateBoardLabel({ ...editingLabel, title: tempTitle.trim(), color: tempColor });
    setEditingLabel(null);
  };

  const saveCreate = async () => {
    if (!tempTitle.trim()) {
      toast.error(
        currentLang === 'vi' ? 'Tiêu đề nhãn không được để trống.' : 'Label title is required.',
      );
      return;
    }

    try {
      const newLabel = await onCreateBoardLabel({
        title: tempTitle.trim(),
        color: tempColor,
      });
      onChange([...selectedIds, newLabel.id]);
      setIsCreating(false);
    } catch {
      toast.error(
        currentLang === 'vi' ? 'Không thể tạo nhãn này.' : 'Unable to create this label.',
      );
    }
  };

  const confirmDeleteLabel = async () => {
    if (!labelPendingDeletion) return;
    setIsDeletingLabel(true);
    try {
      await onDeleteBoardLabel(labelPendingDeletion.id);
      onChange(selectedIds.filter((sid) => sid !== labelPendingDeletion.id));
      setEditingLabel(null);
      setLabelPendingDeletion(null);
      toast.success(currentLang === 'vi' ? 'Đã xóa nhãn.' : 'Label deleted.');
    } catch {
      toast.error(
        currentLang === 'vi' ? 'Không thể xóa nhãn này.' : 'Unable to delete this label.',
      );
    } finally {
      setIsDeletingLabel(false);
    }
  };

  const back = () => {
    setEditingLabel(null);
    setIsCreating(false);
  };

  const filteredLabels = boardLabels.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleLabel = (labelId: number) => {
    onChange(
      selectedIds.includes(labelId)
        ? selectedIds.filter((id) => id !== labelId)
        : [...selectedIds, labelId],
    );
  };

  return (
    <div ref={pickerRef} className="relative">
      {/* Selected label chips + add button */}
      <div className="flex min-h-[38px] min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2 shadow-2xs transition-all duration-200">
        {selectedIds.map((id) => {
          const lObj = boardLabels.find((l) => l.id === id);
          if (!lObj) return null;
          return <TaskLabel key={id} label={lObj} isColorblindMode={isColorblindMode} />;
        })}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 w-6 rounded-[4px] bg-slate-100 hover:bg-slate-200 border border-slate-250/60 flex items-center justify-center text-slate-500 cursor-pointer transition-all duration-150 shadow-2xs active:scale-90"
          title="Select labels"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 mt-1.5 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 z-[100] text-slate-800 animate-in fade-in zoom-in-95 duration-200">
          {/* VIEW: label list */}
          {!editingLabel && !isCreating && (
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  {currentLang === 'vi' ? 'Nhãn' : 'Labels'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={currentLang === 'vi' ? 'Tìm kiếm nhãn...' : 'Search labels...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-2xs bg-slate-50/30 focus:bg-white transition-all duration-200"
                />
              </div>

              <div className="max-h-40 space-y-1.5 overflow-y-auto overflow-x-hidden pr-0.5 custom-scrollbar">
                {filteredLabels.map((l) => {
                  const isChecked = selectedIds.includes(l.id);
                  return (
                    <div key={l.id} className="flex min-w-0 items-center gap-1.5">
                      <label className="relative flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors duration-150 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          aria-label={`${isChecked ? 'Remove' : 'Add'} label ${l.title}`}
                          onChange={() => toggleLabel(l.id)}
                          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <span
                          aria-hidden="true"
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 ${
                            isChecked
                              ? 'border-primary bg-primary text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </span>
                        <div
                          style={{ backgroundColor: l.color }}
                          title={l.title}
                          className={`flex min-h-[26px] min-w-0 flex-1 items-center justify-between gap-1 overflow-hidden rounded-[4px] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs transition-all hover:brightness-95 ${!l.title.trim() ? 'h-3.5' : ''}`}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-1.5">
                            {isColorblindMode && (
                              <span className="w-3.5 h-3.5 -ml-1 flex items-center justify-center scale-75 shrink-0 opacity-90 select-none">
                                {getColorblindPattern(l.color)}
                              </span>
                            )}
                            <span className="min-w-0 truncate">{l.title}</span>
                          </span>
                          {isChecked && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={startCreate}
                className="w-full text-xs font-bold py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors duration-150 cursor-pointer shadow-2xs"
              >
                {currentLang === 'vi' ? 'Tạo nhãn mới' : 'Create a new label'}
              </button>
            </div>
          )}

          {/* VIEW: edit / create label */}
          {(editingLabel || isCreating) && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={back}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold flex items-center text-xs"
                >
                  ←
                </button>
                <span className="text-xs font-bold text-slate-800">
                  {isCreating
                    ? currentLang === 'vi'
                      ? 'Tạo nhãn'
                      : 'Create label'
                    : currentLang === 'vi'
                      ? 'Chỉnh sửa nhãn'
                      : 'Edit label'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-center">
                <div
                  style={{ backgroundColor: tempColor || '#6b778c' }}
                  className="flex min-h-[34px] w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[4px] py-2.5 text-center text-xs font-bold text-white uppercase tracking-wider shadow-sm"
                >
                  {isColorblindMode && (
                    <span className="w-4 h-4 flex items-center justify-center scale-90 opacity-90 select-none">
                      {getColorblindPattern(tempColor || '#6b778c')}
                    </span>
                  )}
                  <span className="min-w-0 truncate">{tempTitle || '\u00A0'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="label-title-edit"
                  className="text-[10px] font-bold text-slate-450 block uppercase tracking-wide"
                >
                  {currentLang === 'vi' ? 'Tiêu đề' : 'Title'}
                </label>
                <input
                  id="label-title-edit"
                  type="text"
                  placeholder={
                    currentLang === 'vi' ? 'Nhập tiêu đề nhãn...' : 'Enter label title...'
                  }
                  value={tempTitle}
                  maxLength={255}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wide">
                  {currentLang === 'vi' ? 'Chọn màu sắc' : 'Select a color'}
                </span>
                <div className="grid grid-cols-5 gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                  {TRELLO_COLORS.map((c) => {
                    const isSelected = tempColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        style={{ backgroundColor: c }}
                        onClick={() => setTempColor(c)}
                        className="aspect-video w-full rounded-md hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center text-white cursor-pointer shadow-2xs border border-black/5"
                      >
                        {isColorblindMode ? (
                          <span className="w-full h-full flex items-center justify-center scale-[0.65] opacity-90 select-none">
                            {getColorblindPattern(c)}
                          </span>
                        ) : isSelected ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTempColor('#6b778c')}
                className="w-full text-[10px] font-bold py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors duration-150 cursor-pointer shadow-2xs"
              >
                <X className="h-3 w-3" /> {currentLang === 'vi' ? 'Xóa màu sắc' : 'Remove color'}
              </button>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  className="text-xs px-3.5 py-1.5 rounded-lg border-slate-200 cursor-pointer"
                >
                  {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <div className="flex gap-1.5">
                  {!isCreating && (
                    <button
                      type="button"
                      onClick={() => editingLabel && setLabelPendingDeletion(editingLabel)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold cursor-pointer transition-colors"
                    >
                      {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                    </button>
                  )}
                  <Button
                    type="button"
                    onClick={isCreating ? saveCreate : saveEdit}
                    className="text-xs px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white cursor-pointer font-bold"
                  >
                    {currentLang === 'vi' ? 'Lưu' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Dialog
        isOpen={!!labelPendingDeletion}
        onClose={() => !isDeletingLabel && setLabelPendingDeletion(null)}
        title={currentLang === 'vi' ? 'Xóa nhãn' : 'Delete label'}
        className="max-w-sm"
      >
        <div className="space-y-5 pt-1">
          <p className="text-sm leading-relaxed text-slate-600">
            {currentLang === 'vi' ? (
              <>
                Hành động này sẽ xóa nhãn <strong>{labelPendingDeletion?.title}</strong> khỏi tất cả
                công việc. Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                This will remove <strong>{labelPendingDeletion?.title}</strong> from all tasks. This
                action cannot be undone.
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingLabel}
              onClick={() => setLabelPendingDeletion(null)}
              className="cursor-pointer"
            >
              {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={isDeletingLabel}
              onClick={() => void confirmDeleteLabel()}
              className="bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
            >
              {isDeletingLabel
                ? currentLang === 'vi'
                  ? 'Đang xóa...'
                  : 'Deleting...'
                : currentLang === 'vi'
                  ? 'Xóa'
                  : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ─── MemberSelector ───────────────────────────────────────────────────────────

interface MemberSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  members: TaskUser[];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function MemberSelector({
  selectedIds,
  onChange,
  members,
  isOpen: controlledIsOpen,
  onOpenChange,
}: MemberSelectorProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const setIsOpen = onOpenChange ?? setUncontrolledIsOpen;
  const pickerRef = useDismissPickerOnOutsideInteraction(isOpen, setIsOpen);

  const addMember = (id: number) => onChange([...selectedIds, id]);
  const removeMember = (id: number) => onChange(selectedIds.filter((mid) => mid !== id));

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const unselectedMembers = members.filter(
    (m) => !selectedIds.includes(m.id) && m.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const Avatar = ({ user, size = 'sm' }: { user: TaskUser; size?: 'sm' | 'md' }) => {
    const cls = size === 'sm' ? 'h-5.5 w-5.5 text-[9px]' : 'h-6 w-6 text-[9px]';
    return user.avatarUrl ? (
      <img
        src={getAvatarUrl(user.avatarUrl) ?? undefined}
        alt={user.fullName}
        className={`${cls} rounded-full object-cover shadow-2xs border border-white`}
      />
    ) : (
      <div
        className={`${cls} rounded-full bg-slate-200 border border-white flex items-center justify-center font-bold text-slate-600`}
      >
        {user.fullName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div ref={pickerRef} className="relative">
      {/* Selected member avatars + add button */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 border border-slate-200/80 rounded-xl bg-white shadow-2xs transition-all duration-200">
        {selectedMembers.map((user) => (
          <button
            key={user.id}
            type="button"
            className="relative cursor-pointer group shrink-0 transition-transform duration-150 active:scale-90 rounded-full focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            onClick={() => removeMember(user.id)}
            title={`Remove ${user.fullName}`}
          >
            <Avatar user={user} size="md" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity duration-150">
              <X className="h-2.5 w-2.5 text-white" />
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-250/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-2xs active:scale-90"
          title="Select members"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 z-[100] text-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {currentLang === 'vi' ? 'Thành viên' : 'Members'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={currentLang === 'vi' ? 'Tìm kiếm thành viên...' : 'Search members...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-2xs bg-slate-50/30 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Card members (assigned) */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-450 block uppercase tracking-wide">
                {currentLang === 'vi' ? 'Thành viên trong thẻ' : 'Card members'}
              </span>
              {selectedMembers.length > 0 ? (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5 custom-scrollbar">
                  {selectedMembers.map((user) => (
                    <div
                      key={user.id}
                      role="option"
                      aria-selected={true}
                      tabIndex={0}
                      onClick={() => removeMember(user.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') removeMember(user.id);
                      }}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors group/member"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar user={user} />
                        <span className="text-xs font-semibold text-slate-700">
                          {user.fullName}
                        </span>
                      </div>
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500 opacity-60 group-hover/member:opacity-100 shrink-0 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic block pl-1">
                  {currentLang === 'vi'
                    ? 'Chưa phân công thành viên nào'
                    : 'No members assigned yet'}
                </span>
              )}
            </div>

            {/* Board members (unassigned) */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-slate-450 block uppercase tracking-wide">
                {currentLang === 'vi' ? 'Thành viên trong bảng' : 'Board members'}
              </span>
              {unselectedMembers.length > 0 ? (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                  {unselectedMembers.map((user) => (
                    <div
                      key={user.id}
                      role="option"
                      aria-selected={false}
                      tabIndex={0}
                      onClick={() => addMember(user.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') addMember(user.id);
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors"
                    >
                      <Avatar user={user} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-700">
                          {user.fullName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {user.role === 'CAMPAIGN_ADMIN'
                            ? currentLang === 'vi'
                              ? 'Quản trị viên'
                              : 'Admin'
                            : currentLang === 'vi'
                              ? 'Tình nguyện viên'
                              : 'Volunteer'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic block pl-1">
                  {currentLang === 'vi'
                    ? 'Không tìm thấy thành viên khác'
                    : 'No other members found'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TaskBoard (main component) ───────────────────────────────────────────────

interface TaskBoardProps {
  campaignId: number;
  campaignTitle: string;
  campaignStartDate?: string | null;
  campaignEndDate?: string | null;
  isCampaignAdmin: boolean;
  currentUser: TaskUser | null;
}

export function TaskBoard({
  campaignId,
  campaignTitle,
  campaignStartDate,
  campaignEndDate,
  isCampaignAdmin,
  currentUser,
}: TaskBoardProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [view, setView] = useState<TaskView>('active');
  const [boardLabels, setBoardLabels] = useState<BoardLabel[]>([]);
  const [columnSorts, setColumnSorts] = useState<Partial<Record<TaskStatus, ColumnSort>>>({});
  const [dragOriginTask, setDragOriginTask] = useState<Task | null>(null);
  const [dragPreviewTasks, setDragPreviewTasks] = useState<Task[] | null>(null);
  const [isColorblindMode, setIsColorblindMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'my-tasks'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('TODO');
  const [activeMenuColumnId, setActiveMenuColumnId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [attachmentMenuId, setAttachmentMenuId] = useState<number | null>(null);
  const colorblindStorageKey = getColorblindStorageKey(currentUser?.id);

  useEffect(() => {
    try {
      setIsColorblindMode(window.localStorage.getItem(colorblindStorageKey) === 'true');
    } catch {
      setIsColorblindMode(false);
    }
  }, [colorblindStorageKey]);

  // Unified task detail/edit dialog
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editLabelIds, setEditLabelIds] = useState<number[]>([]);
  const [editAssigneeIds, setEditAssigneeIds] = useState<number[]>([]);

  // Create task form
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);
  const [activePicker, setActivePicker] = useState<
    'create-labels' | 'create-members' | 'edit-labels' | 'edit-members' | null
  >(null);

  const tasksQuery = useCampaignTasks(campaignId, view);
  const labelsQuery = useCampaignTaskLabels(campaignId);
  const membersQuery = useTaskAssignableMembers(campaignId, isCampaignAdmin);
  const createTaskMutation = useCreateCampaignTask(campaignId);
  const statusMutation = useTaskStatusMutation(campaignId, view);
  useCampaignTaskSocket(campaignId);
  const serverTasks = useMemo(() => deduplicateTasks(tasksQuery.data ?? []), [tasksQuery.data]);
  const tasks = useMemo(
    () => deduplicateTasks(dragPreviewTasks ?? serverTasks),
    [dragPreviewTasks, serverTasks],
  );

  const syncTaskCaches = (task: Task) => {
    syncTaskAcrossViews(queryClient, campaignId, task);
    void queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.activities(task.id) });
  };

  const removeTaskFromCaches = (taskId: number) =>
    removeTaskAcrossViews(queryClient, campaignId, taskId);

  const refreshTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.campaign(campaignId) });
  };

  useEffect(() => {
    const nextTasks = tasksQuery.data ?? [];
    setEditingTask((current) =>
      current ? (nextTasks.find((task) => task.id === current.id) ?? null) : null,
    );
  }, [tasksQuery.data]);

  useEffect(() => {
    setBoardLabels(labelsQuery.data ?? []);
  }, [labelsQuery.data]);

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // ── Label management ──────────────────────────────────────────────────────
  const handleUpdateBoardLabel = async (updated: BoardLabel) => {
    try {
      await updateCampaignTaskLabel(updated);
      await queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.labels(campaignId) });
    } catch {
      toast.error('Unable to update this label.');
    }
  };

  const handleDeleteBoardLabel = async (labelId: number) => {
    try {
      await deleteCampaignTaskLabel(labelId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.labels(campaignId) }),
        refreshTasks(),
      ]);
    } catch {
      toast.error('Unable to delete this label.');
      throw new Error('Unable to delete this label.');
    }
  };

  const handleCreateBoardLabel = async (newLabel: Omit<BoardLabel, 'id'>) => {
    const created = await createCampaignTaskLabel(campaignId, newLabel);
    await queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.labels(campaignId) });
    return created;
  };

  const handleToggleColorblindMode = () => {
    const nextEnabled = !isColorblindMode;
    try {
      window.localStorage.setItem(colorblindStorageKey, String(nextEnabled));
      setIsColorblindMode(nextEnabled);
    } catch {
      toast.error('Unable to save colour-blind mode preference.');
    }
  };

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    if (view !== 'active' || statusMutation.isPending) return;
    const origin = serverTasks.find((task) => task.id === Number(event.active.id));
    if (!origin) return;
    if (origin.status === 'DONE' && !isCampaignAdmin) {
      toast.error('Completed tasks can only be reopened by a campaign admin.');
      return;
    }
    setActiveMenuColumnId(null);
    setActiveId(origin.id);
    setDragOriginTask(origin);
    setDragPreviewTasks(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragOriginTask(null);
    setDragPreviewTasks(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const origin = dragOriginTask;
    if (view !== 'active' || statusMutation.isPending || !origin) {
      handleDragCancel();
      return;
    }
    const { over } = event;
    if (!over) {
      handleDragCancel();
      return;
    }

    const destination = ['TODO', 'IN_PROGRESS', 'DONE'].includes(String(over.id))
      ? (String(over.id) as TaskStatus)
      : null;
    if (!destination) {
      handleDragCancel();
      return;
    }

    // Reordering within a column is intentionally disabled.
    if (origin.status === destination) {
      handleDragCancel();
      return;
    }

    if (origin.status === 'DONE' && !isCampaignAdmin) {
      handleDragCancel();
      toast.error('Completed tasks can only be reopened by a campaign admin.');
      return;
    }

    const isAssignee = currentUser
      ? origin.assignees.some((user) => user.id === currentUser.id)
      : false;
    if (!isCampaignAdmin && !isAssignee) {
      handleDragCancel();
      toast.error('You do not have permission to move this task.');
      return;
    }

    const previousDestinationSort = columnSorts[destination];
    setColumnSorts((current) => {
      if (!current[destination]) return current;
      const next = { ...current };
      delete next[destination];
      return next;
    });
    setDragPreviewTasks(optimisticallyMoveTask(serverTasks, origin.id, destination));
    setActiveId(null);
    setDragOriginTask(null);
    statusMutation.mutate(
      {
        taskId: origin.id,
        status: destination,
        expectedVersion: origin.version,
      },
      {
        onError: (error) => {
          if (previousDestinationSort) {
            setColumnSorts((current) => ({
              ...current,
              [destination]: previousDestinationSort,
            }));
          }
          toast.error(
            isTaskMoveConflict(error)
              ? 'Task was updated by another member. The latest status is now displayed.'
              : 'Unable to move the task. Its previous status was restored.',
          );
        },
        onSettled: () => setDragPreviewTasks(null),
      },
    );
  };

  // ── Edit handler ──────────────────────────────────────────────────────────
  const handleEditClick = (task: Task) => {
    setActiveMenuColumnId(null);
    setEditingTask(task);
    setEditSummary(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.dueDate);
    setEditLabelIds(task.labels);
    setEditAssigneeIds(task.assignees.map((u) => u.id));
  };

  const handleCardClick = (task: Task) => {
    handleEditClick(task);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const canEditTask =
      view === 'active' &&
      (isCampaignAdmin || editingTask.assignees.some((user) => user.id === currentUser?.id));
    if (!canEditTask) return;
    if (!editSummary.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }

    const dueDateError = getDueDateError(editDueDate);
    if (dueDateError) {
      toast.error(dueDateError);
      return;
    }

    try {
      const updatedTask = await updateCampaignTask(editingTask.id, {
        title: editSummary.trim(),
        description: editDescription.trim(),
        dueDate: toBackendDueDate(editDueDate),
        clearDueDate: !editDueDate,
        version: editingTask.version,
        ...(isCampaignAdmin ? { assigneeIds: editAssigneeIds, labelIds: editLabelIds } : {}),
      });
      syncTaskCaches(updatedTask);
    } catch (error) {
      if (isTaskUpdateConflict(error)) {
        await refreshTasks();
        toast.error(
          'This task was updated by someone else. Review the latest version and try again.',
        );
      } else {
        toast.error(getApiErrorMessage(error, 'Unable to update the task.'));
      }
      return;
    }

    setEditingTask(null);
    setActivePicker(null);
    toast.success('Task updated successfully.');
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleHardDeleteArchivedTask = async (taskId: number) => {
    try {
      await permanentlyDeleteCampaignTask(taskId);
      if (editingTask?.id === taskId) setEditingTask(null);
      removeTaskFromCaches(taskId);
      toast.success('Task permanently deleted.');
    } catch {
      toast.error('Unable to permanently delete this task.');
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    try {
      const updatedTask = await archiveCampaignTask(taskId);
      syncTaskCaches(updatedTask);
      toast.success('Task archived.');
    } catch {
      toast.error('Unable to archive this task.');
    }
  };

  const handleUnarchiveTask = async (taskId: number) => {
    try {
      const updatedTask = await unarchiveCampaignTask(taskId);
      syncTaskCaches(updatedTask);
      toast.success('Task returned to the active board.');
    } catch {
      toast.error('Unable to unarchive this task.');
    }
  };

  const handleAttachmentUpload = async (task: Task, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    let successCount = 0;
    let failCount = 0;
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (!file) continue;
        setUploadProgress(`${i + 1}/${fileArray.length} (0%)`);
        try {
          await uploadTaskAttachment(task.id, file, (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setUploadProgress(`${i + 1}/${fileArray.length} (${percent}%)`);
            }
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
      await refreshTasks();
      if (successCount > 0 && failCount === 0) {
        toast.success(
          successCount === 1
            ? 'Attachment uploaded.'
            : `Successfully uploaded ${successCount} attachments.`,
        );
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Uploaded ${successCount} attachments, but ${failCount} failed. Check types/sizes.`,
        );
      } else if (failCount > 0) {
        toast.error('All attachment uploads failed. Check file types and sizes.');
      }
    } finally {
      setUploadProgress(null);
    }
  };

  const handleAttachmentDelete = async (taskId: number, attachmentId: number) => {
    try {
      await deleteTaskAttachment(taskId, attachmentId);
      await Promise.all([
        refreshTasks(),
        queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.activities(taskId) }),
      ]);
      toast.success('Attachment removed.');
    } catch {
      toast.error('Unable to remove this attachment.');
    }
  };

  const handleAttachmentDownload = async (attachment: Task['attachments'][number]) => {
    try {
      const response = await apiClient.get<Blob>(getMediaUrl(attachment.url), {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(response.data);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = attachment.originalFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Unable to download this attachment.');
    }
  };

  // ── Create handlers ───────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createTaskMutation.isPending) return;
    if (!newSummary.trim()) {
      toast.error('Task title is required.');
      return;
    }
    const dueDateError = getDueDateError(newDueDate);
    if (dueDateError) {
      toast.error(dueDateError);
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        title: newSummary.trim(),
        description: newDescription.trim() || undefined,
        dueDate: toBackendDueDate(newDueDate),
        labelIds: selectedLabelIds,
        assigneeIds: selectedAssigneeIds,
        status: createTaskStatus,
      });
      setNewSummary('');
      setNewDescription('');
      setNewDueDate('');
      setSelectedLabelIds([]);
      setSelectedAssigneeIds([]);
      setIsCreateDialogOpen(false);
      setView('active');
      toast.success('Task created successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create the task.'));
    }
  };

  const handleQuickAddTask = async (status: TaskStatus, title: string): Promise<boolean> => {
    try {
      await createTaskMutation.mutateAsync({ title, status });
      toast.success('Task created successfully.');
      return true;
    } catch {
      toast.error('Unable to create the task. Try again.');
      return false;
    }
  };

  // ── Column operations ──────────────────────────────────────────────────────
  const handleSortTasks = (columnId: string, sortBy: TaskSortOption, priorityLabelId?: number) => {
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(columnId)) return;
    setColumnSorts((current) => ({
      ...current,
      [columnId]: { sortBy, priorityLabelId },
    }));

    if (sortBy === 'label' && priorityLabelId) {
      const lbl = boardLabels.find((l) => l.id === priorityLabelId);
      toast.success(`Sorted by priority label: ${lbl?.title ?? 'Untitled'}`);
    } else {
      const labels: Record<string, string> = {
        'date-newest': 'Due date (earliest first)',
        'date-oldest': 'Due date (latest first)',
        label: 'By label',
      };
      toast.success(`Sorted by: ${labels[sortBy]}`);
    }
  };

  const handleMoveAllTasks = async (sourceColumnId: string, targetColumnId: string) => {
    const taskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (
      view !== 'active' ||
      !isCampaignAdmin ||
      isMovingAll ||
      !taskStatuses.includes(sourceColumnId as TaskStatus) ||
      !taskStatuses.includes(targetColumnId as TaskStatus)
    ) {
      return;
    }

    const sourceStatus = sourceColumnId as TaskStatus;
    const targetStatus = targetColumnId as TaskStatus;
    const tasksToMove = tasks.filter((task) => task.status === sourceStatus);
    if (tasksToMove.length === 0) {
      toast.message('There are no cards to move.');
      return;
    }

    setIsMovingAll(true);
    queryClient.setQueryData<Task[]>(
      campaignTaskQueryKeys.list(campaignId, view),
      (currentTasks = []) =>
        currentTasks.map((task) =>
          task.status === sourceStatus ? { ...task, status: targetStatus } : task,
        ),
    );

    const results = await Promise.allSettled(
      tasksToMove.map((task) =>
        moveCampaignTask(task.id, { status: targetStatus, expectedVersion: task.version }),
      ),
    );
    await Promise.all([
      refreshTasks(),
      ...tasksToMove.map((task) =>
        queryClient.invalidateQueries({ queryKey: campaignTaskQueryKeys.activities(task.id) }),
      ),
    ]);
    setIsMovingAll(false);

    const failedCount = results.filter((result) => result.status === 'rejected').length;
    if (failedCount === 0) {
      toast.success(`${tasksToMove.length} card${tasksToMove.length === 1 ? '' : 's'} moved.`);
    } else {
      toast.error(
        `${failedCount} card${failedCount === 1 ? '' : 's'} could not be moved. The board was refreshed.`,
      );
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const tasksByStatus = useMemo(() => {
    const filteredTasks =
      filterType === 'my-tasks' && currentUser
        ? tasks.filter((task) => task.assignees.some((user) => user.id === currentUser.id))
        : tasks;
    return {
      TODO: sortColumnTasks(
        filteredTasks.filter((task) => task.status === 'TODO'),
        columnSorts.TODO,
      ),
      IN_PROGRESS: sortColumnTasks(
        filteredTasks.filter((task) => task.status === 'IN_PROGRESS'),
        columnSorts.IN_PROGRESS,
      ),
      DONE: sortColumnTasks(
        filteredTasks.filter((task) => task.status === 'DONE'),
        columnSorts.DONE,
      ),
    };
  }, [columnSorts, currentUser, filterType, tasks]);

  const todoTasks = tasksByStatus.TODO;
  const inProgressTasks = tasksByStatus.IN_PROGRESS;
  const doneTasks = tasksByStatus.DONE;
  const activeDragTask = activeId === null ? null : tasks.find((task) => task.id === activeId);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  const campaignStartDay = campaignStartDate?.slice(0, 10) ?? '';
  const campaignEndDay = campaignEndDate?.slice(0, 10) ?? '';
  const minimumDueDate = campaignStartDay > todayStr ? campaignStartDay : todayStr;
  const getDueDateError = (date: string): string | null => {
    if (!date) return null;
    if (date < todayStr) return 'Due date cannot be in the past.';
    if (campaignStartDay && date < campaignStartDay) {
      return 'Due date cannot be before the campaign start date.';
    }
    if (campaignEndDay && date > campaignEndDay) {
      return 'Due date cannot be after the campaign end date.';
    }
    return null;
  };

  // Helper to compute due-date display for the detail modal
  const dueDateDisplay = (dateStr: string) => {
    if (!dateStr) {
      return { text: 'No due date', color: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (days < 0)
      return { text: `${dateStr} (Overdue)`, color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (days === 0)
      return { text: `${dateStr} (Today)`, color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (days <= 3)
      return {
        text: `${dateStr} (${days}d left)`,
        color: 'text-orange-600 bg-orange-50 border-orange-100',
      };
    return { text: dateStr, color: 'text-slate-600 bg-slate-50 border-slate-100' };
  };

  // ── Shared column props ────────────────────────────────────────────────────
  const sharedColumnProps = {
    isCampaignAdmin,
    currentUser,
    boardLabels,
    isColorblindMode,
    onEdit: handleEditClick,
    onDelete: handleHardDeleteArchivedTask,
    onArchive: handleArchiveTask,
    onUnarchive: handleUnarchiveTask,
    view,
    dragDisabled: view !== 'active' || isMovingAll,
    pendingTaskId: statusMutation.isPending ? statusMutation.variables?.taskId : undefined,
    onMoveAllTasks:
      isCampaignAdmin && view === 'active' && !isMovingAll ? handleMoveAllTasks : undefined,
    onSortTasks: handleSortTasks,
    onCardClick: handleCardClick,
  };
  const canEditSelectedTask =
    !!editingTask &&
    view === 'active' &&
    (isCampaignAdmin || editingTask.assignees.some((user) => user.id === currentUser?.id));

  // ── Render ─────────────────────────────────────────────────────────────────
  if (tasksQuery.isLoading || labelsQuery.isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
        Loading tasks...
      </div>
    );
  }

  if (tasksQuery.isError || labelsQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-700">Unable to load the Task Board.</p>
        <button
          type="button"
          onClick={() => void tasksQuery.refetch()}
          className="mt-3 text-xs font-bold text-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md py-4 px-5 rounded-2xl border border-slate-150/50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignId)))}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            title="Back to campaign detail"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary block">
              {currentLang === 'vi' ? 'Bảng công việc chiến dịch' : 'Campaign task board'}
            </span>
            <h2
              className="font-extrabold text-slate-800 text-base leading-snug truncate"
              title={campaignTitle}
            >
              {campaignTitle}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isCampaignAdmin && (
            <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
              {(['active', 'archived'] as TaskView[]).map((taskView) => (
                <button
                  key={taskView}
                  type="button"
                  onClick={() => setView(taskView)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${view === taskView ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {taskView === 'active'
                    ? currentLang === 'vi'
                      ? 'Đang hoạt động'
                      : 'Active'
                    : currentLang === 'vi'
                      ? 'Đã lưu trữ'
                      : 'Archived'}
                </button>
              ))}
            </div>
          )}
          {/* Filter toggle */}
          <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${filterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Filter className="h-3.5 w-3.5" /> {currentLang === 'vi' ? 'Tất cả' : 'All'}
            </button>
            <button
              type="button"
              disabled={!currentUser}
              onClick={() => setFilterType('my-tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${filterType === 'my-tasks' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="h-3.5 w-3.5" />{' '}
              {currentLang === 'vi' ? 'Công việc của tôi' : 'My tasks'}
            </button>
          </div>
          <button
            type="button"
            aria-pressed={isColorblindMode}
            onClick={handleToggleColorblindMode}
            title={isColorblindMode ? 'Disable colour-blind mode' : 'Enable colour-blind mode'}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isColorblindMode
                ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                : 'bg-slate-100/80 border-slate-200/50 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80'
            }`}
          >
            <Accessibility className="h-3.5 w-3.5" />
            {isColorblindMode
              ? currentLang === 'vi'
                ? 'Màu hỗ trợ'
                : 'Colour-blind on'
              : currentLang === 'vi'
                ? 'Màu hỗ trợ'
                : 'Colour-blind'}
          </button>

          {/* Create task button */}
          {isCampaignAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveMenuColumnId(null);
                setCreateTaskStatus('TODO');
                setIsCreateDialogOpen(true);
              }}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-bold py-2 px-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] text-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {currentLang === 'vi' ? 'Tạo công việc' : 'Create Task'}
            </button>
          )}
        </div>
      </div>

      {/* ── Kanban board ────────────────────────────────────────────── */}
      <DndContext
        sensors={statusMutation.isPending ? [] : sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <TaskColumn
            {...sharedColumnProps}
            id="TODO"
            title="TO DO"
            tasks={todoTasks}
            isMenuOpen={activeMenuColumnId === 'TODO'}
            onMenuOpenChange={(isOpen) => setActiveMenuColumnId(isOpen ? 'TODO' : null)}
            onQuickAdd={isCampaignAdmin ? (title) => handleQuickAddTask('TODO', title) : undefined}
            theme={{
              bg: 'bg-blue-500',
              text: 'text-blue-800',
              border: 'border-blue-100',
              badge: 'bg-blue-50 text-blue-700 border border-blue-100',
            }}
          />
          <TaskColumn
            {...sharedColumnProps}
            id="IN_PROGRESS"
            title="IN PROGRESS"
            tasks={inProgressTasks}
            isMenuOpen={activeMenuColumnId === 'IN_PROGRESS'}
            onMenuOpenChange={(isOpen) => setActiveMenuColumnId(isOpen ? 'IN_PROGRESS' : null)}
            onQuickAdd={
              isCampaignAdmin ? (title) => handleQuickAddTask('IN_PROGRESS', title) : undefined
            }
            theme={{
              bg: 'bg-amber-500',
              text: 'text-amber-800',
              border: 'border-amber-100',
              badge: 'bg-amber-50 text-amber-700 border border-amber-100',
            }}
          />
          <TaskColumn
            {...sharedColumnProps}
            id="DONE"
            title="DONE"
            tasks={doneTasks}
            isMenuOpen={activeMenuColumnId === 'DONE'}
            onMenuOpenChange={(isOpen) => setActiveMenuColumnId(isOpen ? 'DONE' : null)}
            onQuickAdd={isCampaignAdmin ? (title) => handleQuickAddTask('DONE', title) : undefined}
            theme={{
              bg: 'bg-emerald-500',
              text: 'text-emerald-800',
              border: 'border-emerald-100',
              badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
            }}
          />
        </div>

        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeDragTask && (
            <div className="h-full w-full cursor-grabbing">
              <TaskCard
                task={activeDragTask}
                isCampaignAdmin={isCampaignAdmin}
                currentUser={currentUser}
                boardLabels={boardLabels}
                isColorblindMode={isColorblindMode}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Create task dialog ──────────────────────────────────────── */}
      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setActivePicker(null);
        }}
        title={currentLang === 'vi' ? 'Tạo công việc mới' : 'Create New Task'}
        className="max-w-2xl md:max-w-3xl !overflow-visible"
      >
        <form onSubmit={handleCreateTask} noValidate className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left — title & description */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-summary"
                  className="text-xs font-extrabold text-slate-450 tracking-wider uppercase block"
                >
                  {currentLang === 'vi' ? 'TIÊU ĐỀ CÔNG VIỆC' : 'Task title'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-summary"
                  type="text"
                  required
                  placeholder={
                    currentLang === 'vi'
                      ? 'Nhập tiêu đề công việc ngắn gọn...'
                      : 'Enter a short task title...'
                  }
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full text-sm font-semibold px-4 py-3 border border-slate-200/80 rounded-2xl focus:outline-hidden focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs bg-slate-50/20 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-450 tracking-wider uppercase block">
                  {currentLang === 'vi' ? 'MÔ TẢ' : 'Description'}
                </span>
                <RichTextEditor
                  value={newDescription}
                  onChange={setNewDescription}
                  placeholder={
                    currentLang === 'vi'
                      ? 'Mô tả các bước cần thực hiện cho công việc này...'
                      : 'Describe the steps required for this task...'
                  }
                />
              </div>
            </div>

            {/* Right — metadata */}
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-150/40">
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-450 tracking-wider uppercase block">
                  {currentLang === 'vi' ? 'NHÃN' : 'Labels'}
                </span>
                <LabelSelector
                  selectedIds={selectedLabelIds}
                  onChange={setSelectedLabelIds}
                  isOpen={activePicker === 'create-labels'}
                  onOpenChange={(isOpen) => setActivePicker(isOpen ? 'create-labels' : null)}
                  boardLabels={boardLabels}
                  isColorblindMode={isColorblindMode}
                  onUpdateBoardLabel={handleUpdateBoardLabel}
                  onDeleteBoardLabel={handleDeleteBoardLabel}
                  onCreateBoardLabel={handleCreateBoardLabel}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-450 tracking-wider uppercase block">
                  {currentLang === 'vi' ? 'NGƯỜI THỰC HIỆN' : 'Assignees'}
                </span>
                <MemberSelector
                  selectedIds={selectedAssigneeIds}
                  onChange={setSelectedAssigneeIds}
                  members={membersQuery.data ?? []}
                  isOpen={activePicker === 'create-members'}
                  onOpenChange={(isOpen) => setActivePicker(isOpen ? 'create-members' : null)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="new-due-date"
                  className="text-[10px] font-extrabold text-slate-450 tracking-wider uppercase block"
                >
                  {currentLang === 'vi' ? 'HẠN HOÀN THÀNH' : 'Due date'}
                </label>
                <input
                  id="new-due-date"
                  type="date"
                  min={minimumDueDate}
                  max={campaignEndDay || undefined}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-2xs text-slate-700 cursor-pointer transition-all"
                />
                {getDueDateError(newDueDate) && (
                  <p className="text-[10px] font-medium text-rose-600">
                    {getDueDateError(newDueDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setActivePicker(null);
              }}
              className="text-xs px-5 py-2.5 rounded-xl border-slate-250 font-bold cursor-pointer active:scale-95"
            >
              {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="text-xs px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer active:scale-95 shadow-md shadow-primary/10"
            >
              {createTaskMutation.isPending
                ? currentLang === 'vi'
                  ? 'Đang tạo...'
                  : 'Creating...'
                : currentLang === 'vi'
                  ? 'Tạo công việc'
                  : 'Create Task'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── Unified task detail/edit dialog ──────────────────────────── */}
      <Dialog
        isOpen={!!editingTask}
        onClose={() => {
          setEditingTask(null);
          setActivePicker(null);
        }}
        title="Task Detail"
        className="max-w-2xl md:max-w-4xl lg:max-w-[1180px] !overflow-visible "
      >
        {editingTask && (
          <form onSubmit={handleUpdateTask} noValidate className="space-y-6 pt-2">
            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
              <div className="grid min-w-0 grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Left — title & description */}
                <div className="min-w-0 md:col-span-2 space-y-6">
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                      Task title
                    </span>
                    {canEditSelectedTask ? (
                      <input
                        id="edit-summary"
                        type="text"
                        required
                        maxLength={255}
                        value={editSummary}
                        onChange={(event) => setEditSummary(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    ) : (
                      <h3 className="min-w-0 max-w-full text-lg font-bold text-slate-800 leading-snug whitespace-normal break-words [overflow-wrap:anywhere]">
                        {editingTask.title}
                      </h3>
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">
                      Description
                    </span>
                    {canEditSelectedTask ? (
                      <RichTextEditor
                        value={editDescription}
                        onChange={setEditDescription}
                        placeholder="Describe the steps required for this task..."
                      />
                    ) : editingTask.description ? (
                      <RichTextEditor
                        value={editingTask.description}
                        onChange={() => undefined}
                        readOnly
                      />
                    ) : (
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-xs text-slate-655 leading-relaxed min-h-[120px]">
                        <span className="italic text-slate-400">No description provided.</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                        Attachments
                      </span>
                      {canEditSelectedTask && (
                        <label className="cursor-pointer rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/15">
                          {uploadProgress === null ? 'Upload file' : `Uploading ${uploadProgress}`}
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            disabled={uploadProgress !== null}
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                            onChange={(event) => {
                              void handleAttachmentUpload(editingTask, event.target.files);
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {editingTask.attachments.length > 0 ? (
                      <div className="space-y-3">
                        <span className="block text-[10px] font-bold text-slate-500">Files</span>
                        {editingTask.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
                          >
                            {attachment.fileType.startsWith('image/') ? (
                              <img
                                src={getMediaUrl(attachment.url)}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-500">
                                {attachment.fileType.startsWith('video/') ? (
                                  <ImageIcon className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <a
                                href={getMediaUrl(attachment.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-xs font-semibold text-slate-700 hover:text-primary hover:underline"
                              >
                                {attachment.originalFilename}
                              </a>
                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                Added {new Date(attachment.uploadedAt).toLocaleDateString()} by{' '}
                                {attachment.uploadedBy?.fullName ?? 'Unknown'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleAttachmentDownload(attachment)}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                              aria-label={`Download ${attachment.originalFilename}`}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setAttachmentMenuId((current) =>
                                    current === attachment.id ? null : attachment.id,
                                  )
                                }
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                aria-label={`Actions for ${attachment.originalFilename}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {attachmentMenuId === attachment.id && (
                                <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                  <a
                                    href={getMediaUrl(attachment.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    Open
                                  </a>
                                  {(isCampaignAdmin ||
                                    attachment.uploadedBy?.id === currentUser?.id) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttachmentMenuId(null);
                                        void handleAttachmentDelete(editingTask.id, attachment.id);
                                      }}
                                      className="block w-full rounded-md px-2 py-1.5 text-left text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">No attachments</p>
                    )}
                    <p className="text-[9px] text-slate-400">
                      Images 15 MB, documents 10 MB, videos 200 MB maximum.
                    </p>
                  </div>
                </div>

                {/* Right — metadata */}
                <div className="space-y-5 bg-slate-50/60 p-5 rounded-2xl border border-slate-150/40">
                  {/* Status */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-450 tracking-wider uppercase block">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        editingTask.status === 'TODO'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : editingTask.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {editingTask.status === 'TODO'
                        ? 'To Do'
                        : editingTask.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : 'Done'}
                    </span>
                  </div>

                  {/* Labels */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-450 tracking-wider uppercase block">
                      Labels
                    </span>
                    {isCampaignAdmin && canEditSelectedTask ? (
                      <LabelSelector
                        selectedIds={editLabelIds}
                        onChange={setEditLabelIds}
                        isOpen={activePicker === 'edit-labels'}
                        onOpenChange={(isOpen) => setActivePicker(isOpen ? 'edit-labels' : null)}
                        boardLabels={boardLabels}
                        isColorblindMode={isColorblindMode}
                        onUpdateBoardLabel={handleUpdateBoardLabel}
                        onDeleteBoardLabel={handleDeleteBoardLabel}
                        onCreateBoardLabel={handleCreateBoardLabel}
                      />
                    ) : editingTask.labels.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {editingTask.labels.map((labelId) => {
                          const lbl = boardLabels.find((l) => l.id === labelId);
                          if (!lbl) return null;
                          return (
                            <TaskLabel
                              key={labelId}
                              label={lbl}
                              isColorblindMode={isColorblindMode}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No labels</span>
                    )}
                  </div>

                  {/* Due date */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-450 tracking-wider uppercase block">
                      Due date
                    </span>
                    {canEditSelectedTask ? (
                      <>
                        <input
                          id="edit-due-date"
                          type="date"
                          min={minimumDueDate}
                          max={campaignEndDay || undefined}
                          value={editDueDate}
                          onChange={(event) => setEditDueDate(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        {getDueDateError(editDueDate) && (
                          <p className="text-[10px] font-medium text-rose-600">
                            {getDueDateError(editDueDate)}
                          </p>
                        )}
                      </>
                    ) : (
                      (() => {
                        const d = dueDateDisplay(editingTask.dueDate);
                        return (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${d.color}`}
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{d.text}</span>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Assignees */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-450 tracking-wider uppercase block">
                      Assignees
                    </span>
                    {isCampaignAdmin && canEditSelectedTask && (
                      <MemberSelector
                        selectedIds={editAssigneeIds}
                        onChange={setEditAssigneeIds}
                        members={membersQuery.data ?? []}
                        isOpen={activePicker === 'edit-members'}
                        onOpenChange={(isOpen) => setActivePicker(isOpen ? 'edit-members' : null)}
                      />
                    )}
                    {editingTask.assignees.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {editingTask.assignees.map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            {user.avatarUrl ? (
                              <img
                                src={getAvatarUrl(user.avatarUrl) ?? undefined}
                                alt={user.fullName}
                                className="h-6.5 w-6.5 rounded-full object-cover shadow-2xs border border-white"
                              />
                            ) : (
                              <div className="h-6.5 w-6.5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {user.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700 leading-none">
                                {user.fullName}
                              </span>
                              <span className="text-[8px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                                {user.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Reporter */}
                  <div className="space-y-1.5 pt-3.5 border-t border-slate-150/40">
                    <span className="text-[9px] font-extrabold text-slate-450 tracking-wider uppercase block">
                      Reporter
                    </span>
                    <div className="flex items-center gap-2">
                      {editingTask.createdBy?.avatarUrl ? (
                        <img
                          src={getAvatarUrl(editingTask.createdBy.avatarUrl) ?? undefined}
                          alt={editingTask.createdBy.fullName}
                          className="h-6.5 w-6.5 rounded-full object-cover shadow-2xs border border-white"
                        />
                      ) : (
                        <div className="h-6.5 w-6.5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {editingTask.createdBy?.fullName.charAt(0).toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 leading-none">
                          {editingTask.createdBy?.fullName ?? 'Unknown'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-medium uppercase mt-0.5">
                          Reporter
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <TaskActivityPanel key={editingTask.id} taskId={editingTask.id} />
            </div>

            {/* Footer actions */}
            <div className="flex justify-end items-center gap-2.5 pt-4 border-t border-slate-150/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingTask(null);
                  setActivePicker(null);
                }}
                className="text-xs px-5 py-2.5 rounded-xl border-slate-250 font-bold cursor-pointer active:scale-95"
              >
                {canEditSelectedTask ? 'Cancel' : 'Close'}
              </Button>
              {canEditSelectedTask && (
                <button
                  type="submit"
                  className="text-xs px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-primary/10 flex items-center gap-1.5"
                >
                  Save Changes
                </button>
              )}
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
