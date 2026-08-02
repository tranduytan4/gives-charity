import { useState } from 'react';
import { toast } from 'sonner';
import {
  createCategory,
  deleteCategory,
  permanentDeleteCategory,
  restoreCategory,
  updateCategory,
} from '../api';
import type { AdminCategoryResponse } from '../types';

interface UseCategoryMutationsProps {
  onSuccess?: () => void;
}

export function useCategoryMutations({ onSuccess }: UseCategoryMutationsProps = {}) {
  const [isMutating, setIsMutating] = useState(false);

  const handleRestore = async (id: number) => {
    setIsMutating(true);
    try {
      const response = await restoreCategory(id);
      if (response.success) {
        toast.success('Category restored successfully');
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to restore category');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to restore category');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteConfirm = async (
    id: number,
  ): Promise<{ success: boolean; message?: string }> => {
    setIsMutating(true);
    try {
      const response = await deleteCategory(id);
      if (response.success) {
        toast.success('Category archived successfully');
        onSuccess?.();
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to delete category' };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete category';
      return { success: false, message: errMsg };
    } finally {
      setIsMutating(false);
    }
  };

  const handlePermanentDeleteConfirm = async (id: number) => {
    setIsMutating(true);
    try {
      const response = await permanentDeleteCategory(id);
      if (response.success) {
        toast.success('Category permanently deleted');
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to permanently delete category');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to permanently delete category');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveCategory = async (
    editingCategory: AdminCategoryResponse | null,
    data: { name: string; description?: string },
  ): Promise<{
    success: boolean;
    isDeletedCollision?: boolean;
    deletedId?: number;
    name?: string;
    message?: string;
  }> => {
    setIsMutating(true);
    try {
      if (editingCategory) {
        const response = await updateCategory(editingCategory.id, {
          name: data.name,
          description: data.description,
        });
        if (response.success) {
          toast.success('Category updated successfully');
          onSuccess?.();
          return { success: true };
        }
        toast.error(response.message || 'Failed to update category');
        return { success: false, message: response.message };
      } else {
        const response = await createCategory({
          name: data.name,
          description: data.description,
        });
        if (response.success) {
          toast.success('Category created successfully');
          onSuccess?.();
          return { success: true };
        }
        toast.error(response.message || 'Failed to create category');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const err = error as {
        code?: number;
        message?: string;
        result?: { id: number };
        response?: {
          data?: {
            message?: string;
            code?: number;
            result?: { id: number };
          };
        };
      };

      const errCode = err.code ?? err.response?.data?.code;
      const errMsg = err.message ?? err.response?.data?.message;
      const errResult = err.result ?? err.response?.data?.result;

      if (errCode === 1023) {
        return {
          success: false,
          isDeletedCollision: true,
          deletedId: errResult?.id,
          name: data.name,
        };
      }
      return { success: false, message: errMsg || 'Failed to save category' };
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    handleRestore,
    handleDeleteConfirm,
    handlePermanentDeleteConfirm,
    handleSaveCategory,
  };
}
