import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import type { AdminCategoryResponse } from '../types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategorySaveResult {
  success: boolean;
  message?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: AdminCategoryResponse | null;
  existingCategories: AdminCategoryResponse[];
  onSave: (data: CategoryFormValues) => Promise<CategorySaveResult | boolean>;
}

export function CategoryModal({
  isOpen,
  onClose,
  category,
  existingCategories,
  onSave,
}: CategoryModalProps) {
  const { t } = useTranslation('admin');
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
        });
      } else {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (data: CategoryFormValues) => {
    const isDuplicate = existingCategories.some(
      (c) =>
        !c.deletedAt &&
        c.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        (!category || c.id !== category.id),
    );
    if (isDuplicate) {
      setError('name', {
        type: 'manual',
        message: `Category with name '${data.name}' already exists.`,
      });
      return;
    }
    const res = await onSave(data);
    if (typeof res === 'object') {
      if (res.success) {
        onClose();
      } else if (res.message) {
        setError('name', { type: 'manual', message: res.message });
      }
    } else if (res) {
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={category ? t('categoryTable.editCategory') : t('categoryTable.addCategory')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('categoryTable.categoryName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g. Education, Health"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('categoryTable.description')}</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            placeholder="..."
            className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {category ? t('categoryTable.editCategory') : t('categoryTable.addCategory')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
