import { useDroppable } from '@dnd-kit/core';
import {
  ArrowLeft,
  ChevronDown,
  FileQuestion,
  ListFilter,
  MoreHorizontal,
  Plus,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BoardLabel, Task, TaskUser, TaskView } from '../../types/campaignTask';
import { TaskCard } from './TaskCard';
import { getColorblindPattern } from './TaskLabel';

// Maximum number of cards displayed before the column list becomes scrollable
const SCROLL_THRESHOLD = 6;

interface TaskColumnProps {
  /** Column identifier — one of 'TODO' | 'IN_PROGRESS' | 'DONE' */
  id: string;
  title: string;
  tasks: Task[];
  isCampaignAdmin: boolean;
  currentUser: TaskUser | null;
  boardLabels: BoardLabel[];
  isColorblindMode?: boolean;
  theme: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onQuickAdd?: (title: string) => Promise<boolean>;
  onMoveAllTasks?: (sourceColumnId: string, targetColumnId: string) => void;
  onSortTasks?: (
    columnId: string,
    sortBy: 'date-newest' | 'date-oldest' | 'label',
    priorityLabelId?: number,
  ) => void;
  onCardClick?: (task: Task) => void;
  isMenuOpen?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
  dragDisabled?: boolean;
  pendingTaskId?: number;
  view?: TaskView;
  onArchive?: (taskId: number) => void;
  onUnarchive?: (taskId: number) => void;
}

export function TaskColumn({
  id,
  title,
  tasks,
  isCampaignAdmin,
  currentUser,
  boardLabels,
  isColorblindMode = false,
  theme,
  onEdit,
  onDelete,
  onQuickAdd,
  onMoveAllTasks,
  onSortTasks,
  onCardClick,
  isMenuOpen = false,
  onMenuOpenChange,
  dragDisabled = false,
  pendingTaskId,
  view = 'active',
  onArchive,
  onUnarchive,
}: TaskColumnProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { isOver, setNodeRef } = useDroppable({ id });

  const displayTitle = useMemo(() => {
    if (currentLang === 'vi') {
      const upperId = id.toUpperCase();
      if (upperId === 'TODO' || title.toLowerCase() === 'to do') return 'Cần làm';
      if (upperId === 'IN_PROGRESS' || title.toLowerCase() === 'in progress') return 'Đang làm';
      if (
        upperId === 'DONE' ||
        title.toLowerCase() === 'done' ||
        title.toLowerCase() === 'completed'
      )
        return 'Hoàn thành';
      if (upperId === 'ARCHIVED' || title.toLowerCase().includes('archive')) return 'Đã lưu trữ';
    }
    return title;
  }, [currentLang, id, title]);

  const [menuView, setMenuView] = useState<'main' | 'move-all' | 'sort' | 'sort-by-label'>('main');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const quickAddInputRef = useRef<HTMLTextAreaElement>(null);
  const [isAssigneeSortOpen, setIsAssigneeSortOpen] = useState(false);
  const [assigneeSortView, setAssigneeSortView] = useState<'sort' | 'sort-by-label'>('sort');

  useEffect(() => {
    if (!isMenuOpen) {
      setMenuView('main');
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (isQuickAddOpen) quickAddInputRef.current?.focus({ preventScroll: true });
  }, [isQuickAddOpen]);

  // Build the list of valid target columns for "Move all cards"
  const getMoveTargets = () => {
    const targets: { id: string; label: string }[] = [];
    if (id !== 'TODO')
      targets.push({
        id: 'TODO',
        label: currentLang === 'vi' ? 'Cần làm (TODO)' : 'To Do (TODO)',
      });
    if (id !== 'IN_PROGRESS')
      targets.push({
        id: 'IN_PROGRESS',
        label: currentLang === 'vi' ? 'Đang làm (IN_PROGRESS)' : 'In Progress (IN_PROGRESS)',
      });
    if (id !== 'DONE')
      targets.push({
        id: 'DONE',
        label: currentLang === 'vi' ? 'Hoàn thành (DONE)' : 'Done (DONE)',
      });
    return targets;
  };

  const openQuickAdd = () => {
    setIsQuickAddOpen(true);
    onMenuOpenChange?.(false);
  };

  const closeQuickAdd = () => {
    if (isQuickAdding) return;
    setQuickAddTitle('');
    setIsQuickAddOpen(false);
  };

  const submitQuickAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = quickAddTitle.trim();
    if (!title || !onQuickAdd) return;

    setIsQuickAdding(true);
    try {
      const created = await onQuickAdd(title);
      if (created) {
        setQuickAddTitle('');
        setIsQuickAddOpen(false);
      }
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Scroll is enabled once the card count exceeds SCROLL_THRESHOLD
  const listClassName = [
    'flex-1 flex flex-col gap-3 pr-0.5 custom-scrollbar',
    tasks.length > SCROLL_THRESHOLD ? 'overflow-y-auto max-h-[680px]' : 'overflow-visible',
  ].join(' ');

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col w-full min-h-[500px] rounded-2xl p-4 border transition-[background-color,border-color,box-shadow] duration-200',
        isOver
          ? 'bg-slate-200/50 border-slate-300 shadow-inner'
          : 'bg-slate-100/80 border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.015)]',
      ].join(' ')}
    >
      {/* ── Column header ── */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/40 relative">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.bg}`} />
          <h3 className="font-extrabold text-slate-800 text-sm">{displayTitle}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${theme.badge}`}>
            {tasks.length}
          </span>
        </div>

        {/* Administrators retain the full actions menu; assignees get a direct sort selector. */}
        {isCampaignAdmin ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onMenuOpenChange?.(!isMenuOpen);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-[90] w-full h-full cursor-default bg-transparent border-none p-0 focus:outline-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuOpenChange?.(false);
                  }}
                />
                <div
                  className={[
                    'absolute mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-150',
                    'shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-3.5 z-[100] text-slate-800',
                    'animate-in fade-in zoom-in-95 duration-100',
                    id.toUpperCase() === 'DONE' ? 'right-0' : 'left-0',
                  ].join(' ')}
                >
                  {/* VIEW 1 — Main actions */}
                  {menuView === 'main' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">Actions</span>
                        <button
                          type="button"
                          onClick={() => onMenuOpenChange?.(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {view === 'active' && onQuickAdd && (
                          <button
                            type="button"
                            onClick={openQuickAdd}
                            className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {currentLang === 'vi' ? 'Thêm thẻ...' : 'Add card...'}
                          </button>
                        )}
                        {onMoveAllTasks && (
                          <button
                            type="button"
                            onClick={() => setMenuView('move-all')}
                            className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {currentLang === 'vi'
                              ? 'Di chuyển tất cả thẻ trong danh sách...'
                              : 'Move all cards in list...'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setMenuView('sort')}
                          className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {currentLang === 'vi' ? 'Sắp xếp theo...' : 'Sort by...'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 2 — Move all cards */}
                  {menuView === 'move-all' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMenuView('main')}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center text-xs font-bold"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        </button>
                        <span className="text-xs font-bold text-slate-800">
                          {currentLang === 'vi' ? 'Di chuyển danh sách' : 'Move List'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onMenuOpenChange?.(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-450 tracking-wider uppercase block">
                          {currentLang === 'vi' ? 'Chọn cột đích' : 'Select destination column'}
                        </span>
                        <div className="flex flex-col gap-1">
                          {getMoveTargets().map((target) => (
                            <button
                              key={target.id}
                              type="button"
                              onClick={() => {
                                onMoveAllTasks?.(id, target.id);
                                onMenuOpenChange?.(false);
                              }}
                              className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              {target.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW 3 — Sort options */}
                  {menuView === 'sort' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMenuView('main')}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center text-xs font-bold"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        </button>
                        <span className="text-xs font-bold text-slate-800">
                          {currentLang === 'vi' ? 'Sắp xếp danh sách' : 'Sort List'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onMenuOpenChange?.(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSortTasks?.(id, 'date-newest');
                            onMenuOpenChange?.(false);
                          }}
                          className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {currentLang === 'vi'
                            ? 'Hạn hoàn thành (sớm nhất trước)'
                            : 'Due date (earliest first)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSortTasks?.(id, 'date-oldest');
                            onMenuOpenChange?.(false);
                          }}
                          className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {currentLang === 'vi'
                            ? 'Hạn hoàn thành (muộn nhất trước)'
                            : 'Due date (latest first)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMenuView('sort-by-label')}
                          className="w-full text-xs font-semibold text-left py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {currentLang === 'vi' ? 'Sắp xếp theo Nhãn...' : 'Sort by Label...'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 4 — Priority label picker */}
                  {menuView === 'sort-by-label' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMenuView('sort')}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center text-xs font-bold"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        </button>
                        <span className="text-xs font-bold text-slate-800">
                          {currentLang === 'vi' ? 'Nhãn ưu tiên' : 'Priority Label'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onMenuOpenChange?.(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-0.5 custom-scrollbar">
                        {boardLabels.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              onSortTasks?.(id, 'label', l.id);
                              onMenuOpenChange?.(false);
                            }}
                            style={{ backgroundColor: l.color }}
                            title={l.title || 'Untitled label'}
                            className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-[4px] px-3 py-2 text-left text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs transition-all hover:brightness-95"
                          >
                            {isColorblindMode && (
                              <span className="w-3.5 h-3.5 -ml-1 flex items-center justify-center scale-75 shrink-0 opacity-90 select-none">
                                {getColorblindPattern(l.color)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {l.title || 'Untitled label'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isAssigneeSortOpen}
              onClick={() => {
                setAssigneeSortView('sort');
                setIsAssigneeSortOpen((isOpen) => !isOpen);
              }}
              className="flex items-center justify-between w-[140px] rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <div className="flex items-center gap-1.5">
                <ListFilter className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentLang === 'vi' ? 'Sắp xếp...' : 'Sort by...'}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {isAssigneeSortOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close sort options"
                  className="fixed inset-0 z-[90] cursor-default bg-transparent"
                  onClick={() => setIsAssigneeSortOpen(false)}
                />
                <div
                  role="dialog"
                  aria-label={`Sort ${title} tasks`}
                  className={[
                    'absolute top-[calc(100%+0.5rem)] z-[100] w-64 rounded-2xl border border-slate-150 bg-white/95 p-3.5 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100',
                    id.toUpperCase() === 'DONE' ? 'right-0' : 'left-0',
                  ].join(' ')}
                >
                  {assigneeSortView === 'sort' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800">
                          {currentLang === 'vi' ? 'Sắp xếp danh sách' : 'Sort List'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAssigneeSortOpen(false)}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSortTasks?.(id, 'date-newest');
                            setIsAssigneeSortOpen(false);
                          }}
                          className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          {currentLang === 'vi'
                            ? 'Hạn hoàn thành (sớm nhất trước)'
                            : 'Due date (earliest first)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSortTasks?.(id, 'date-oldest');
                            setIsAssigneeSortOpen(false);
                          }}
                          className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          {currentLang === 'vi'
                            ? 'Hạn hoàn thành (muộn nhất trước)'
                            : 'Due date (latest first)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssigneeSortView('sort-by-label')}
                          className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          {currentLang === 'vi' ? 'Sắp xếp theo Nhãn...' : 'Sort by Label...'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <button
                          type="button"
                          onClick={() => setAssigneeSortView('sort')}
                          className="flex cursor-pointer items-center text-xs font-bold text-slate-400 hover:text-slate-700"
                        >
                          <ArrowLeft className="mr-1 h-3.5 w-3.5" />{' '}
                          {currentLang === 'vi' ? 'Quay lại' : 'Back'}
                        </button>
                        <span className="text-xs font-bold text-slate-800">
                          {currentLang === 'vi' ? 'Nhãn ưu tiên' : 'Priority Label'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAssigneeSortOpen(false)}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-0.5 custom-scrollbar">
                        {boardLabels.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => {
                              onSortTasks?.(id, 'label', label.id);
                              setIsAssigneeSortOpen(false);
                            }}
                            style={{ backgroundColor: label.color }}
                            title={label.title || 'Untitled label'}
                            className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-[4px] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs transition-all hover:brightness-95"
                          >
                            {isColorblindMode && (
                              <span className="-ml-1 flex h-3.5 w-3.5 shrink-0 scale-75 items-center justify-center opacity-90 select-none">
                                {getColorblindPattern(label.color)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {label.title || 'Untitled label'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Card list — scrollable when > SCROLL_THRESHOLD cards ── */}
      <div className={listClassName}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCampaignAdmin={isCampaignAdmin}
              currentUser={currentUser}
              boardLabels={boardLabels}
              isColorblindMode={isColorblindMode}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={() => onCardClick?.(task)}
              dragDisabled={dragDisabled}
              isPending={pendingTaskId === task.id}
              view={view}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
          ))
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/60 rounded-xl p-6 text-center bg-white/40">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <FileQuestion className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-0.5">
              {currentLang === 'vi' ? 'Chưa có công việc nào' : 'No tasks yet'}
            </p>
            <p className="text-[10px] text-slate-400 leading-normal max-w-[150px] mx-auto">
              {currentLang === 'vi'
                ? 'Kéo thẻ vào đây hoặc nhấn "Thêm thẻ" để bắt đầu.'
                : 'Drag cards here or click "Add card" to get started.'}
            </p>
          </div>
        )}
      </div>

      {isCampaignAdmin && view === 'active' && isQuickAddOpen && (
        <form
          onSubmit={submitQuickAdd}
          className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <textarea
            ref={quickAddInputRef}
            rows={3}
            value={quickAddTitle}
            onChange={(event) => setQuickAddTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeQuickAdd();
              }
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submitQuickAdd(event);
              }
            }}
            placeholder={
              currentLang === 'vi'
                ? 'Nhập tiêu đề hoặc dán liên kết'
                : 'Enter a title or paste a link'
            }
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!quickAddTitle.trim() || isQuickAdding}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isQuickAdding
                ? currentLang === 'vi'
                  ? 'Đang thêm...'
                  : 'Adding...'
                : currentLang === 'vi'
                  ? 'Thêm thẻ'
                  : 'Add card'}
            </button>
            <button
              type="button"
              onClick={closeQuickAdd}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cancel quick add"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* ── Quick "Add card" button ── */}
      {isCampaignAdmin && view === 'active' && !isQuickAddOpen && (
        <button
          type="button"
          onClick={openQuickAdd}
          className="flex items-center gap-1.5 w-full mt-3 py-2 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs font-semibold text-left cursor-pointer"
        >
          <Plus className="h-4 w-4 text-slate-450 shrink-0" />
          <span>{currentLang === 'vi' ? 'Thêm thẻ...' : 'Add a card...'}</span>
        </button>
      )}
    </div>
  );
}
