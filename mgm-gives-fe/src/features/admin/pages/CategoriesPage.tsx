import { Archive, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryModal, useCategoryMutations, useCategoryQuery } from '@/features/admin';

import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/Table';
import { checkCategoryDeletion } from '../api';
import type { AdminCategoryResponse } from '../types';

export default function CategoriesPage() {
  const { t, i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const {
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    showDeleted,
    setShowDeleted,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,
    refetch,
  } = useCategoryQuery();

  const {
    handleRestore,
    handleDeleteConfirm,
    handlePermanentDeleteConfirm,
    handleSaveCategory,
    isMutating,
  } = useCategoryMutations({
    onSuccess: refetch,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryResponse | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryResponse | null>(null);
  const [categoryToPermanentDelete, setCategoryToPermanentDelete] =
    useState<AdminCategoryResponse | null>(null);
  const [categoryToRestore, setCategoryToRestore] = useState<{ id: number; name: string } | null>(
    null,
  );

  const categoryToDeleteRef = useRef<AdminCategoryResponse | null>(null);
  if (categoryToDelete) categoryToDeleteRef.current = categoryToDelete;
  const activeCategoryToDelete = categoryToDelete || categoryToDeleteRef.current;

  const categoryToRestoreRef = useRef<{ id: number; name: string } | null>(null);
  if (categoryToRestore) categoryToRestoreRef.current = categoryToRestore;
  const activeCategoryToRestore = categoryToRestore || categoryToRestoreRef.current;

  // Transition-safe name state helpers to avoid flickering empty strings during modal closing animation
  const [permanentDeleteName, setPermanentDeleteName] = useState('');

  const [deleteCheckLoading, setDeleteCheckLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteCheckData, setDeleteCheckData] = useState<{
    assignedCampaignsCount: number;
    onlyCategoryCampaignsCount: number;
  } | null>(null);

  const deleteCheckDataRef = useRef<typeof deleteCheckData>(null);
  if (deleteCheckData) deleteCheckDataRef.current = deleteCheckData;
  const activeDeleteCheckData = deleteCheckData || deleteCheckDataRef.current;

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: AdminCategoryResponse) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleOpenDelete = async (category: AdminCategoryResponse) => {
    setCategoryToDelete(category);
    setDeleteCheckData(null);
    deleteCheckDataRef.current = null;
    setDeleteError(null);
    setDeleteCheckLoading(true);
    try {
      const response = await checkCategoryDeletion(category.id);
      if (response.success && response.result) {
        setDeleteCheckData(response.result);
      }
    } catch {
      // Silently catch to satisfy user request of removing the toast error
    } finally {
      setDeleteCheckLoading(false);
    }
  };

  const handleOpenPermanentDelete = async (category: AdminCategoryResponse) => {
    setCategoryToPermanentDelete(category);
    setPermanentDeleteName(category.name);
    setDeleteCheckData(null);
    setDeleteCheckLoading(true);
    try {
      const response = await checkCategoryDeletion(category.id);
      if (response.success && response.result) {
        setDeleteCheckData(response.result);
      }
    } catch {
      // Silently catch
    } finally {
      setDeleteCheckLoading(false);
    }
  };

  const closeAddEdit = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingCategory(null), 200);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t('categoryTable.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('categoryTable.subtitle')}</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('categoryTable.addCategory')}
        </Button>
      </div>

      {/* Toolbar / Search (Wrapped in a distinct box) */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder={
              currentLang === 'vi'
                ? 'Tìm kiếm theo tên hoặc mô tả...'
                : 'Search by name or description...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={showDeleted ? 'Deleted' : 'Active'}
            onValueChange={(val) => setShowDeleted(val === 'Deleted')}
            modal={false}
          >
            <SelectTrigger className="h-11 bg-white border-gray-200 text-sm text-gray-900">
              <SelectValue placeholder={currentLang === 'vi' ? 'Trạng thái' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">{t('categoryTable.activeCategories')}</SelectItem>
              <SelectItem value="Deleted">{t('categoryTable.deletedCategories')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div
        className={`bg-white rounded-lg border shadow-sm transition-opacity duration-200 ${isMutating ? 'pointer-events-none opacity-60' : ''}`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categoryTable.categoryName')}</TableHead>
              <TableHead>{t('categoryTable.description')}</TableHead>
              <TableHead className="text-center">{t('categoryTable.campaignCount')}</TableHead>
              <TableHead className="text-center">
                {currentLang === 'vi' ? 'Thao tác' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-gray-500">
                  {currentLang === 'vi' ? 'Đang tải danh mục...' : 'Loading categories...'}
                </TableCell>
              </TableRow>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                  <TableCell className="text-gray-500">
                    <div
                      className="max-w-50 sm:max-w-xs md:max-w-md truncate"
                      title={category.description}
                    >
                      {category.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-500 font-medium">
                    {category.campaignsCount ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      {category.deletedAt ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(category.id)}
                            title="Restore Category"
                          >
                            <RotateCcw className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPermanentDelete(category)}
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(category)}
                            title="Edit Category"
                          >
                            <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(category)}
                            title="Archive Category"
                          >
                            <Archive className="h-4 w-4 text-gray-500 hover:text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 py-6">
                    <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-base">No categories found</p>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        Your search query didn't match any categories in our taxonomy.
                      </p>
                    </div>
                    {(searchQuery || showDeleted) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setShowDeleted(false);
                        }}
                        className="mt-2 text-xs font-semibold cursor-pointer border-slate-200 hover:bg-slate-50"
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * pageSize, totalElements)}
                </span>{' '}
                of <span className="font-medium">{totalElements}</span> results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 font-medium">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={closeAddEdit}
        category={editingCategory}
        existingCategories={categories}
        onSave={async (data) => {
          const res = await handleSaveCategory(editingCategory, data);
          if (res?.success) {
            closeAddEdit();
            return { success: true };
          } else if (res?.isDeletedCollision && res?.deletedId !== undefined) {
            setCategoryToRestore({ id: res.deletedId, name: res.name || '' });
            return {
              success: false,
              message: `Category with name '${res.name}' already exists in archives.`,
            };
          }
          return { success: false, message: res?.message };
        }}
      />

      {/* Archive Confirmation Modal */}
      <Dialog
        isOpen={categoryToDelete !== null}
        onClose={() => {
          setCategoryToDelete(null);
          setDeleteCheckData(null);
          setDeleteError(null);
        }}
        title="Archive Category"
      >
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to archive the category{' '}
            <span className="font-semibold text-gray-900">"{activeCategoryToDelete?.name}"</span>?
          </p>

          {deleteError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {deleteError}
            </div>
          )}

          {deleteCheckLoading ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-center">
              <p className="text-xs text-amber-700 animate-pulse">Checking category usage...</p>
            </div>
          ) : activeDeleteCheckData && activeDeleteCheckData.assignedCampaignsCount > 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-amber-900">⚠️ Warning:</p>
              <p className="leading-relaxed">
                This category is assigned to{' '}
                <span className="font-bold">{activeDeleteCheckData.assignedCampaignsCount}</span>{' '}
                campaigns, and is the only category for{' '}
                <span className="font-bold">
                  {activeDeleteCheckData.onlyCategoryCampaignsCount}
                </span>{' '}
                campaigns.
              </p>
            </div>
          ) : activeDeleteCheckData && activeDeleteCheckData.assignedCampaignsCount === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              This category is not assigned to any active campaigns and can be safely deleted.
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCategoryToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteCheckLoading || isMutating}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!categoryToDelete) return;
              const id = categoryToDelete.id;
              // Close dialog immediately to prevent ghost clicks
              setCategoryToDelete(null);
              await handleDeleteConfirm(id);
            }}
          >
            Archive
          </Button>
        </div>
      </Dialog>

      {/* Permanent Delete Confirmation Modal */}
      <Dialog
        isOpen={categoryToPermanentDelete !== null}
        onClose={() => {
          setCategoryToPermanentDelete(null);
          setDeleteCheckData(null);
        }}
        title="Delete Category Permanently"
      >
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to permanently delete the category{' '}
            <span className="font-semibold text-gray-900">"{permanentDeleteName}"</span>? This
            action cannot be undone.
          </p>

          {deleteCheckLoading ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-center">
              <p className="text-xs text-amber-700 animate-pulse">Checking category usage...</p>
            </div>
          ) : deleteCheckData && deleteCheckData.assignedCampaignsCount > 0 ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-red-900">
                ⚠️ Cannot Delete:
              </p>
              <p className="leading-relaxed">
                This category is currently assigned to{' '}
                <span className="font-bold">{deleteCheckData.assignedCampaignsCount}</span>{' '}
                campaigns. You must reassign or remove this category from those campaigns before it
                can be permanently deleted.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCategoryToPermanentDelete(null);
              setDeleteCheckData(null);
              setDeleteError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              deleteCheckLoading ||
              isMutating ||
              (deleteCheckData !== null && deleteCheckData.assignedCampaignsCount > 0)
            }
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (categoryToPermanentDelete) {
                const id = categoryToPermanentDelete.id;
                setCategoryToPermanentDelete(null);
                setDeleteCheckData(null);
                await handlePermanentDeleteConfirm(id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Restore Confirmation Modal */}
      <Dialog
        isOpen={categoryToRestore !== null}
        onClose={() => setCategoryToRestore(null)}
        title="Restore Category"
      >
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-500">
            A category named{' '}
            <span className="font-semibold text-gray-900">"{activeCategoryToRestore?.name}"</span>{' '}
            already exists in the archives. Would you like to restore it instead of creating a new
            one?
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setCategoryToRestore(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (categoryToRestore) {
                const id = categoryToRestore.id;
                setCategoryToRestore(null);
                closeAddEdit();
                await handleRestore(id);
              }
            }}
          >
            Restore
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
