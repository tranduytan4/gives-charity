import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Activity, ChevronDown, Flag, Search, Tag } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/features/category';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';

export type SortOption = 'newest' | 'ending_soon' | 'following';

interface CampaignFiltersProps {
  categories: Category[];
  selectedCategoryIds: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  status: string;
  onStatusChange: (status: string) => void;
  priority?: string;
  onPriorityChange?: (priority: string) => void;
  allowedStatuses?: string[];
}

export function CampaignFilters({
  categories,
  selectedCategoryIds,
  onCategoryChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  allowedStatuses,
}: CampaignFiltersProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const [categorySearch, setCategorySearch] = useState('');

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const allStatusOptions = [
    { value: 'ALL', label: currentLang === 'vi' ? 'Tất cả trạng thái' : 'All statuses' },
    { value: 'DRAFT', label: currentLang === 'vi' ? 'Bản nháp' : 'Draft' },
    { value: 'PENDING', label: currentLang === 'vi' ? 'Đang chờ duyệt' : 'Pending' },
    { value: 'APPROVED', label: currentLang === 'vi' ? 'Đã duyệt' : 'Approved' },
    { value: 'IN_PROGRESS', label: currentLang === 'vi' ? 'Đang diễn ra' : 'In Progress' },
    { value: 'REJECTED', label: currentLang === 'vi' ? 'Đã từ chối' : 'Rejected' },
    { value: 'COMPLETED', label: currentLang === 'vi' ? 'Hoàn thành' : 'Completed' },
  ];

  const statusOptions = allowedStatuses
    ? allStatusOptions.filter((opt) => opt.value === 'ALL' || allowedStatuses.includes(opt.value))
    : allStatusOptions;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
      <div className="w-full sm:w-[240px] relative z-10">
        <Listbox value={selectedCategoryIds} onChange={onCategoryChange} multiple>
          <ListboxButton className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <div className="flex items-center gap-2 truncate">
              <Tag className="h-4 w-4 opacity-50 shrink-0" />
              <span className="block truncate text-left">
                {selectedCategoryIds.length === 0
                  ? currentLang === 'vi'
                    ? 'Tất cả danh mục'
                    : 'All categories'
                  : selectedCategoryIds.length === 1
                    ? categories.find((c) => c.id === selectedCategoryIds[0])?.name ||
                      (currentLang === 'vi' ? '1 danh mục' : '1 category')
                    : `${selectedCategoryIds.length} ${currentLang === 'vi' ? 'danh mục' : 'categories'}`}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </ListboxButton>
          <ListboxOptions className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md outline-none animate-in fade-in-80">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={currentLang === 'vi' ? 'Tìm danh mục...' : 'Search category...'}
                  className="h-8 w-full rounded-md border border-input bg-transparent px-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>
            </div>
            {selectedCategoryIds.length > 0 && (
              <button
                type="button"
                className="w-full sticky top-[49px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCategoryChange([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onCategoryChange([]);
                  }
                }}
              >
                <div className="w-full flex items-center justify-center rounded-sm px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
                  {currentLang === 'vi' ? 'Xóa chọn tất cả' : 'Clear all selected'}
                </div>
              </button>
            )}
            <div className="py-1">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <ListboxOption
                      key={category.id}
                      value={category.id}
                      className="relative flex w-full cursor-pointer select-none items-center py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground ui-active:bg-accent ui-active:text-accent-foreground transition-colors"
                    >
                      <div className="pointer-events-none flex items-center w-full">
                        <Checkbox
                          checked={isSelected}
                          readOnly
                          tabIndex={-1}
                          label={<span className="truncate">{category.name}</span>}
                        />
                      </div>
                    </ListboxOption>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {currentLang === 'vi' ? 'Không tìm thấy danh mục' : 'No category found'}
                </div>
              )}
            </div>
          </ListboxOptions>
        </Listbox>
      </div>

      <div className="w-full sm:w-[140px]">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 bg-background">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
              <SelectValue placeholder={currentLang === 'vi' ? 'Trạng thái' : 'Status'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[140px]">
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="h-10 bg-background">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground shrink-0" />
              <SelectValue placeholder={currentLang === 'vi' ? 'Mức ưu tiên' : 'Priority'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {currentLang === 'vi' ? 'Tất cả mức ưu tiên' : 'All priorities'}
            </SelectItem>
            <SelectItem value="NORMAL">
              {currentLang === 'vi' ? 'Bình thường' : 'Normal'}
            </SelectItem>
            <SelectItem value="HIGH">{currentLang === 'vi' ? 'Cao' : 'High'}</SelectItem>
            <SelectItem value="URGENT">{currentLang === 'vi' ? 'Khẩn cấp' : 'Urgent'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Standalone sort dropdown, used in the section header */
export function CampaignSortSelect({
  sortBy,
  onSortChange,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {currentLang === 'vi' ? 'Sắp xếp:' : 'Sort:'}
      </span>
      <Select value={sortBy} onValueChange={(val) => onSortChange(val as SortOption)}>
        <SelectTrigger className="w-[120px] h-9 border-0 shadow-none font-semibold text-foreground focus:ring-0 px-1 gap-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{currentLang === 'vi' ? 'Mới nhất' : 'Newest'}</SelectItem>
          <SelectItem value="ending_soon">
            {currentLang === 'vi' ? 'Sắp kết thúc' : 'Ending Soon'}
          </SelectItem>
          <SelectItem value="following">
            {currentLang === 'vi' ? 'Đang theo dõi' : 'Following'}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
