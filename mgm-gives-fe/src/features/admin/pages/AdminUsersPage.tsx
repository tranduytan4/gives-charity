import {
  AlertCircle,
  Ban,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthUser } from '@/features/auth/hooks';
import { Badge } from '@/shared/components/ui/Badge';
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
import { localizeShortDate } from '@/shared/utils/localizeContent';
import { getAvatarUrl } from '@/shared/utils/media';
import { UserModal } from '../components/UserModal';
import { useUserMutations } from '../hooks/useUserMutations';
import { useUserQuery } from '../hooks/useUserQuery';
import type { AdminUserResponse, UserRole, UserStatus } from '../types';

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const {
    users,
    isLoading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,
    refetch,
  } = useUserQuery();

  const {
    importErrors,
    isMutating,
    handleDeleteConfirm,
    handleImportUsers,
    handleSaveUser,
    setImportErrors,
  } = useUserMutations({
    onSuccess: refetch,
  });

  const { data: currentUser } = useAuthUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUserResponse | null>(null);

  const userToDeleteRef = useRef<AdminUserResponse | null>(null);
  if (userToDelete) userToDeleteRef.current = userToDelete;
  const activeUserToDelete = userToDelete || userToDeleteRef.current;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUserResponse) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeAddEdit = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const closeImport = () => {
    setIsImportModalOpen(false);
    setSelectedImportFile(null);
    setImportErrors([]);
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedImportFile(event.target.files?.[0] || null);
    setImportErrors([]);
  };

  const handleImportSubmit = async () => {
    if (!selectedImportFile) return;

    const imported = await handleImportUsers(selectedImportFile);
    if (imported) {
      closeImport();
    }
  };

  const handleDownloadTemplate = () => {
    const csv =
      'email,fullName,phone,password,role,status\njane.doe@example.com,Jane Doe,+84 901 234 567,secret123,USER,ACTIVE\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'BANNED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getVisiblePageItems = () => {
    const currentPageNumber = currentPage + 1;
    const pages = new Set<number>([1, totalPages]);

    for (
      let pageNumber = Math.max(1, currentPageNumber - 1);
      pageNumber <= Math.min(totalPages, currentPageNumber + 1);
      pageNumber++
    ) {
      pages.add(pageNumber);
    }

    if (currentPageNumber <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }

    if (currentPageNumber >= totalPages - 2) {
      pages.add(totalPages - 3);
      pages.add(totalPages - 2);
      pages.add(totalPages - 1);
    }

    const sortedPages = Array.from(pages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
      .sort((a, b) => a - b);

    return sortedPages.reduce<Array<number | string>>((items, pageNumber, index) => {
      const previousPage = sortedPages[index - 1];
      if (previousPage && pageNumber - previousPage > 1) {
        items.push(`ellipsis-${previousPage}-${pageNumber}`);
      }
      items.push(pageNumber);
      return items;
    }, []);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {t('userTable.title')}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{t('userTable.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setIsImportModalOpen(true);
            }}
            className="shrink-0 shadow-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('userTable.importCsv')}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAdd();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('userTable.addUser')}
          </Button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder={t('userTable.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full bg-white border-gray-200"
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

        {/* Role Filter */}
        <div className="w-full md:w-48 shrink-0">
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val as UserRole | 'All')}
            modal={false}
          >
            <SelectTrigger className="h-11 bg-white border-gray-200 text-sm text-gray-900">
              <SelectValue placeholder={t('userTable.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('userTable.allRoles')}</SelectItem>
              <SelectItem value="ADMIN">{t('userTable.adminRole')}</SelectItem>
              <SelectItem value="USER">{t('userTable.userRole')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48 shrink-0">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as UserStatus | 'All')}
            modal={false}
          >
            <SelectTrigger className="h-11 bg-white border-gray-200 text-sm text-gray-900">
              <SelectValue placeholder={t('userTable.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('userTable.allStatuses')}</SelectItem>
              <SelectItem value="ACTIVE">{t('userTable.active')}</SelectItem>
              <SelectItem value="INACTIVE">{t('userTable.inactive')}</SelectItem>
              <SelectItem value="BANNED">{t('userTable.banned')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/75">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 py-3.5">
                {t('userTable.name')}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                {currentLang === 'vi' ? 'Số điện thoại' : 'Phone'}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">{t('userTable.role')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('userTable.status')}</TableHead>
              <TableHead className="font-semibold text-gray-700">{t('userTable.joined')}</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right pr-6">
                {t('userTable.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
                    <p className="text-sm text-gray-500">
                      {currentLang === 'vi'
                        ? 'Đang tải danh sách người dùng...'
                        : 'Loading users...'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={getAvatarUrl(user.avatarUrl) || undefined}
                          alt={user.fullName}
                          className="h-10 w-10 rounded-full object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm border border-blue-100 shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-900 truncate">{user.fullName}</span>
                        <span className="text-xs text-gray-500 truncate">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 font-normal">
                    {user.phone || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'warning' : 'outline'}>
                      {user.role === 'ADMIN' ? t('userTable.adminRole') : t('userTable.userRole')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status === 'ACTIVE'
                        ? t('userTable.active')
                        : user.status === 'INACTIVE'
                          ? t('userTable.inactive')
                          : t('userTable.banned')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {user.createdAt ? localizeShortDate(user.createdAt, currentLang) : '—'}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(user);
                        }}
                        className="h-8 w-8 hover:bg-gray-100"
                        title={t('userTable.editUser')}
                      >
                        <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600 transition-colors" />
                      </Button>
                      {user.status !== 'BANNED' && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(user);
                          }}
                          className="h-8 w-8 hover:bg-red-50"
                          title={t('userTable.banned')}
                        >
                          <Ban className="h-4 w-4 text-gray-500 hover:text-red-600 transition-colors" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 py-6">
                    <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-base">
                        {currentLang === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}
                      </p>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        {currentLang === 'vi'
                          ? 'Bộ lọc hiện tại không phù hợp với người dùng nào.'
                          : 'Your filters did not match any platform users.'}
                      </p>
                    </div>
                    {(searchQuery || roleFilter !== 'All' || statusFilter !== 'All') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('All');
                          setStatusFilter('All');
                        }}
                        className="mt-2 text-xs font-semibold cursor-pointer border-slate-200 hover:bg-slate-50"
                      >
                        {currentLang === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
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
        <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
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
              <div className="flex max-w-[360px] items-center justify-center gap-1 overflow-hidden">
                {getVisiblePageItems().map((item) =>
                  typeof item === 'number' ? (
                    <Button
                      key={item}
                      onClick={() => setCurrentPage(item - 1)}
                      variant={currentPage === item - 1 ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {item}
                    </Button>
                  ) : (
                    <span
                      key={item}
                      className="flex h-8 w-8 items-center justify-center text-sm text-gray-400"
                    >
                      ...
                    </span>
                  ),
                )}
              </div>
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

      {/* User Save Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={closeAddEdit}
        user={editingUser}
        onSave={(data) => handleSaveUser(editingUser, data)}
      />

      {/* User CSV Import Dialog */}
      <Dialog
        isOpen={isImportModalOpen}
        onClose={closeImport}
        title="Import Users"
        className="max-w-2xl"
        disableAnimation={true}
        closeOnOutsideClick={!isMutating}
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">Required CSV columns</p>
            <p className="mt-1 text-blue-800">email, fullName, phone, password, role, status</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="userCsvFile" className="text-sm font-medium text-gray-700">
                CSV File
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <FileText className="h-4 w-4" />
                Template
              </Button>
            </div>
            <label
              htmlFor="userCsvFile"
              className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:bg-gray-100"
            >
              <Upload className="mb-2 h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {selectedImportFile ? selectedImportFile.name : 'Choose CSV file'}
              </span>
              <span className="mt-1 text-xs text-gray-500">CSV files only</span>
              <input
                id="userCsvFile"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleImportFileChange}
                disabled={isMutating}
              />
            </label>
          </div>

          {importErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-center gap-2 border-b border-red-200 px-4 py-3 text-sm font-medium text-red-800">
                <AlertCircle className="h-4 w-4" />
                {importErrors.length} validation issue{importErrors.length === 1 ? '' : 's'}
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-red-50 text-xs uppercase text-red-700">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Row</th>
                      <th className="px-4 py-2 font-semibold">Field</th>
                      <th className="px-4 py-2 font-semibold">Issue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 bg-white">
                    {importErrors.map((error) => (
                      <tr key={`${error.row}-${error.field}-${error.message}`}>
                        <td className="px-4 py-2 text-gray-700">{error.row}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{error.field}</td>
                        <td className="px-4 py-2 text-gray-700">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={closeImport} disabled={isMutating}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={!selectedImportFile || isMutating}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import Users
            </Button>
          </div>
        </div>
      </Dialog>

      {/* User Ban Dialog */}
      <Dialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Ban User"
        disableAnimation={true}
        closeOnOutsideClick={false}
      >
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to ban{' '}
            <span className="font-medium text-gray-950">{activeUserToDelete?.fullName}</span> (
            <span className="text-xs">{activeUserToDelete?.email}</span>)? This will immediately
            prevent them from logging into the platform or participating in campaigns.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (userToDelete) {
                  handleDeleteConfirm(userToDelete);
                  setUserToDelete(null);
                }
              }}
            >
              Ban
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
