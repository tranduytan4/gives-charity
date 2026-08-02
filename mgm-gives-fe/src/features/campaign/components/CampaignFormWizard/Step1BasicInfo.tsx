import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/features/category';
import { Combobox } from '@/shared/components/ui/Combobox';
import { DateRangePicker } from '@/shared/components/ui/DateRangePicker';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { cn } from '@/shared/utils/cn';
import type { CampaignFormValues } from '../../hooks/useCampaignForm';

interface Step1BasicInfoProps {
  register: UseFormRegister<CampaignFormValues>;
  control: Control<CampaignFormValues>;
  errors: FieldErrors<CampaignFormValues>;
  watch: UseFormWatch<CampaignFormValues>;
  setValue: UseFormSetValue<CampaignFormValues>;
  allCategories: Category[];
  handleToggleCategory: (id: number) => void;
  trigger: UseFormTrigger<CampaignFormValues>;
  hasAttemptedNext: boolean;
  disabled?: boolean;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function Step1BasicInfo({
  register,
  control,
  errors,
  watch,
  setValue,
  allCategories,
  handleToggleCategory,
  trigger,
  hasAttemptedNext,
  disabled = false,
}: Step1BasicInfoProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-gray-900 border-b pb-2">
        {currentLang === 'vi' ? 'Thông tin cơ bản' : 'Campaign Basics'}
      </h2>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="title" required>
            {currentLang === 'vi' ? 'Tên chiến dịch' : 'Campaign title'}
          </Label>
          <Input
            id="title"
            disabled={disabled}
            {...register('title', {
              onBlur: () => {
                if (hasAttemptedNext) {
                  trigger('title');
                }
              },
            })}
            placeholder={
              currentLang === 'vi'
                ? 'Tên ngắn gọn, rõ ràng và truyền cảm hứng'
                : 'A clear, compelling name'
            }
            className={errors.title ? 'border-red-500' : ''}
            error={!!errors.title}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Category selection */}
        <div className="space-y-1">
          <Label htmlFor="categories" required>
            {currentLang === 'vi' ? 'Danh mục' : 'Category'}
          </Label>
          <Controller
            control={control}
            name="categories"
            render={({ field }) => (
              <Combobox
                options={allCategories}
                selectedIds={field.value || []}
                onToggle={(id) => handleToggleCategory(id)}
                placeholder={currentLang === 'vi' ? 'Chọn danh mục...' : 'Select category...'}
                disabled={disabled}
                error={!!errors.categories}
                onBlur={() => {
                  field.onBlur();
                  if (hasAttemptedNext) {
                    trigger('categories');
                  }
                }}
              />
            )}
          />
          {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
        </div>

        {/* Duration and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Date range picker */}
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="dateRange" required>
              {currentLang === 'vi' ? 'Thời gian diễn ra chiến dịch' : 'Campaign duration'}
            </Label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => {
                const startDateStr = watch('startDate');
                const endDateStr = watch('endDate');
                const rangeValue = {
                  from: startDateStr ? new Date(startDateStr) : undefined,
                  to: endDateStr ? new Date(endDateStr) : undefined,
                };
                return (
                  <DateRangePicker
                    value={rangeValue}
                    disabled={disabled}
                    error={!!errors.startDate || !!errors.endDate}
                    onChange={(range) => {
                      setValue('startDate', range?.from ? formatLocalDate(range.from) : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue('endDate', range?.to ? formatLocalDate(range.to) : '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (hasAttemptedNext) {
                        trigger('startDate');
                        trigger('endDate');
                      }
                    }}
                  />
                );
              }}
            />
            {(errors.startDate || errors.endDate) && (
              <p className="text-xs text-red-500">
                {errors.startDate?.message || errors.endDate?.message}
              </p>
            )}
          </div>

          {/* Priority selection */}
          <div className="md:col-span-1 space-y-1">
            <Label htmlFor="priority" required>
              {currentLang === 'vi' ? 'Mức độ ưu tiên' : 'Priority'}
            </Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <div className="flex w-full rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 gap-0.5 mt-1">
                  {[
                    {
                      value: 'NORMAL',
                      label: currentLang === 'vi' ? 'Bình thường' : 'Normal',
                      activeClass: 'bg-blue-600 text-white border-blue-700 shadow-xs',
                    },
                    {
                      value: 'HIGH',
                      label: currentLang === 'vi' ? 'Cao' : 'High',
                      activeClass: 'bg-amber-500 text-white border-amber-600 shadow-xs',
                    },
                    {
                      value: 'URGENT',
                      label: currentLang === 'vi' ? 'Khẩn cấp' : 'Urgent',
                      activeClass: 'bg-red-600 text-white border-red-700 shadow-xs',
                    },
                  ].map((opt) => {
                    const isActive = field.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          field.onChange(opt.value);
                          if (hasAttemptedNext) {
                            trigger('priority');
                          }
                        }}
                        className={cn(
                          'flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all duration-150 border border-transparent select-none',
                          disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer',
                          isActive
                            ? opt.activeClass
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50',
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
