import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Fancybox } from '@/shared/components/ui/Fancybox';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatNumberWithCommas } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import {
  useCampaignSpendings,
  useCreateCampaignSpending,
  useDeleteCampaignSpending,
  useRemoveSpendingPhoto,
  useUpdateCampaignSpending,
  useUploadSpendingPhoto,
} from '../hooks/useCampaignSpending';
import type { CampaignStatus } from '../types';
import type { Spending } from '../types/campaignSpending';

interface CampaignSpendingTabProps {
  campaignId: number;
  campaignStatus: CampaignStatus;
  campaignStartDate: string | null;
  isCampaignAdmin: boolean;
}

interface SpendingFormState {
  amount: string;
  description: string;
  spentAt: string;
}

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

const emptyForm: SpendingFormState = { amount: '', description: '', spentAt: '' };

const MAX_SPENDING_AMOUNT = 500_000_000_000;
const MAX_DESCRIPTION_LENGTH = 5000;

/** Position in `formatted` right after the `digitsBeforeCursor`-th digit, used to keep the
 * caret in place when a comma-formatted number reflows around it as the user types. */
const cursorPositionForDigitCount = (formatted: string, digitsBeforeCursor: number): number => {
  let digitCount = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted.charAt(i))) digitCount++;
    if (digitCount === digitsBeforeCursor) return i + 1;
  }
  return formatted.length;
};

export function CampaignSpendingTab({
  campaignId,
  campaignStatus,
  campaignStartDate,
  isCampaignAdmin,
}: CampaignSpendingTabProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { data, isLoading } = useCampaignSpendings(campaignId);
  const minSpentAt = campaignStartDate ? campaignStartDate.slice(0, 10) : undefined;
  const maxSpentAt = new Date().toISOString().slice(0, 10);
  const createMutation = useCreateCampaignSpending(campaignId);
  const updateMutation = useUpdateCampaignSpending(campaignId);
  const deleteMutation = useDeleteCampaignSpending(campaignId);
  const uploadPhotoMutation = useUploadSpendingPhoto(campaignId);
  const removePhotoMutation = useRemoveSpendingPhoto(campaignId);

  const canLogSpending = isCampaignAdmin && campaignStatus === 'IN_PROGRESS';
  const canDeleteSpending = isCampaignAdmin && campaignStatus === 'IN_PROGRESS';

  const [editingSpending, setEditingSpending] = useState<Spending | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<SpendingFormState>(emptyForm);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingSpending, setViewingSpending] = useState<Spending | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const pendingAmountCursorDigits = useRef<number | null>(null);

  useEffect(() => {
    const digitsBeforeCursor = pendingAmountCursorDigits.current;
    if (digitsBeforeCursor === null || !amountInputRef.current) return;
    const pos = cursorPositionForDigitCount(
      formatNumberWithCommas(form.amount),
      digitsBeforeCursor,
    );
    amountInputRef.current.setSelectionRange(pos, pos);
    pendingAmountCursorDigits.current = null;
  }, [form.amount]);

  const clearPendingPhotos = () => {
    for (const photo of pendingPhotos) URL.revokeObjectURL(photo.previewUrl);
    setPendingPhotos([]);
  };

  const openCreateForm = () => {
    setEditingSpending(null);
    setForm({ ...emptyForm, spentAt: maxSpentAt });
    clearPendingPhotos();
    setIsFormOpen(true);
  };

  const openEditForm = (spending: Spending) => {
    setEditingSpending(spending);
    setForm({
      amount: String(spending.amount),
      description: spending.description,
      spentAt: spending.spentAt,
    });
    clearPendingPhotos();
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const openViewDialog = (spending: Spending) => {
    setViewingSpending(spending);
    setIsViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue !== '' && !/^\d+$/.test(rawValue)) return;

    if (rawValue !== '') {
      const numValue = Number.parseInt(rawValue, 10);
      if (numValue > MAX_SPENDING_AMOUNT) {
        toast.error('Spending amount is too large.');
        return;
      }
    }

    const cursor = e.target.selectionStart ?? rawValue.length;
    let digitsBeforeCursor = 0;
    for (let i = 0; i < cursor; i++) {
      if (/\d/.test(e.target.value.charAt(i))) digitsBeforeCursor++;
    }
    pendingAmountCursorDigits.current = digitsBeforeCursor;

    setForm((prev) => ({ ...prev, amount: rawValue }));
  };

  const addPendingPhotos = (files: FileList) => {
    const newPending: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }
      newPending.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPendingPhotos((prev) => [...prev, ...newPending]);
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number.parseInt(form.amount, 10);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }
    if (amountNum > MAX_SPENDING_AMOUNT) {
      toast.error('Spending amount is too large.');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required.');
      return;
    }
    if (form.description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
      return;
    }
    if (!form.spentAt) {
      toast.error('Spent date is required.');
      return;
    }

    try {
      if (editingSpending) {
        await updateMutation.mutateAsync({
          spendingId: editingSpending.id,
          request: {
            amount: amountNum,
            description: form.description.trim(),
            spentAt: form.spentAt,
          },
        });
        toast.success('Spending updated.');
      } else {
        const created = await createMutation.mutateAsync({
          amount: amountNum,
          description: form.description.trim(),
          spentAt: form.spentAt,
        });
        for (const pending of pendingPhotos) {
          await uploadPhotoMutation.mutateAsync({
            spendingId: created.id,
            file: pending.file,
          });
        }
        clearPendingPhotos();
        toast.success('Spending logged.');
      }
      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save spending.'));
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success('Spending deleted.');
      setDeletingId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete the spending entry.'));
    }
  };

  const handlePhotoUpload = async (spendingId: number, files: FileList) => {
    try {
      for (const file of Array.from(files)) {
        const updated = await uploadPhotoMutation.mutateAsync({ spendingId, file });
        setEditingSpending(updated);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to upload the photo.'));
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const { current } = carouselRef;
    if (!current) return;
    if (direction === 'left') {
      if (current.scrollLeft <= 10) {
        current.scrollTo({ left: current.scrollWidth, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: -current.offsetWidth, behavior: 'smooth' });
      }
    } else {
      const isAtEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 10;
      if (isAtEnd) {
        current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: current.offsetWidth, behavior: 'smooth' });
      }
    }
  };

  const handlePhotoRemove = async (spendingId: number, mediaId: number) => {
    try {
      const updated = await removePhotoMutation.mutateAsync({ spendingId, mediaId });
      setEditingSpending(updated);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove the photo.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const totalRaised = data?.totalRaised ?? 0;
  const totalSpent = data?.totalSpent ?? 0;
  const remainingFunds = data?.remainingFunds ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-100/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {currentLang === 'vi' ? 'Tổng tiền đã nhận' : 'Total Raised'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#102820]">{formatCurrency(totalRaised)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {currentLang === 'vi' ? 'Tổng tiền đã chi' : 'Total Spent'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#102820]">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {currentLang === 'vi' ? 'Số dư còn lại' : 'Remaining Funds'}
          </p>
          <p
            className={`mt-1 text-xl font-bold ${remainingFunds < 0 ? 'text-red-600' : 'text-[#102820]'}`}
          >
            {formatCurrency(remainingFunds)}
          </p>
        </div>
      </div>

      {canLogSpending && (
        <div className="flex justify-end">
          <Button onClick={openCreateForm} className="flex items-center gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4" />
            {currentLang === 'vi' ? 'Ghi nhận thu chi' : 'Log Spending'}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-white/60 p-10 text-center text-sm text-gray-500">
          {currentLang === 'vi'
            ? 'Chưa có khoản thu chi nào được ghi nhận cho chiến dịch này.'
            : 'No spending has been logged for this campaign yet.'}
        </div>
      ) : (
        <div className="group/carousel relative @container">
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="absolute -left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary opacity-0 group-hover/carousel:opacity-100 lg:flex cursor-pointer"
                aria-label="Scroll spending list left"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="absolute -right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary opacity-0 group-hover/carousel:opacity-100 lg:flex cursor-pointer"
                aria-label="Scroll spending list right"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}
          <div className="overflow-hidden lg:mx-10">
            <div
              ref={carouselRef}
              className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item) => (
                // biome-ignore lint/a11y/useSemanticElements: card has nested edit/delete action buttons
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openViewDialog(item)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                      openViewDialog(item);
                    }
                  }}
                  className="flex w-full shrink-0 snap-start cursor-pointer flex-col rounded-2xl border border-blue-100/80 bg-white p-4 shadow-[0_4px_12px_rgba(37,99,235,0.03)] transition-shadow hover:shadow-md @min-[560px]:w-[calc(50%-8px)] @min-[900px]:w-[calc(33.333%-11px)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-[#102820]">
                      {formatCurrency(item.amount)}
                    </span>
                    {item.isEdited && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        {currentLang === 'vi' ? 'Đã chỉnh sửa' : 'Edited'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 min-h-0 flex-1 text-sm text-gray-700">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatDate(item.spentAt)}
                    </span>
                    {item.photos.length > 0 && (
                      <div className="flex shrink-0 items-center -space-x-1.5">
                        {item.photos.slice(0, 3).map((photo) => (
                          <img
                            key={photo.id}
                            src={getMediaUrl(photo.url)}
                            alt=""
                            className="h-6 w-6 shrink-0 rounded-full border-2 border-white object-cover ring-1 ring-blue-100"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {isCampaignAdmin && (
                    <div className="mt-3 flex shrink-0 items-center gap-0.5 border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(item);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-primary cursor-pointer"
                        aria-label="Edit spending"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {canDeleteSpending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(item.id);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          aria-label="Delete spending"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editingSpending
            ? currentLang === 'vi'
              ? 'Chỉnh sửa thu chi'
              : 'Edit Spending'
            : currentLang === 'vi'
              ? 'Ghi nhận thu chi'
              : 'Log Spending'
        }
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="spending-amount" className="text-xs font-semibold text-gray-600">
              {currentLang === 'vi' ? 'Số tiền (VNĐ)' : 'Amount (VND)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              ref={amountInputRef}
              id="spending-amount"
              type="text"
              inputMode="numeric"
              placeholder={currentLang === 'vi' ? 'ví dụ: 1.000.000' : 'e.g. 1,000,000'}
              value={formatNumberWithCommas(form.amount)}
              onChange={handleAmountChange}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="spending-description" className="text-xs font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Mô tả khoản chi' : 'Description'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] ${form.description.length > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-400'}`}
              >
                {form.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              id="spending-description"
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder={
                currentLang === 'vi'
                  ? 'Khoản tiền này được sử dụng vào việc gì?'
                  : 'What was this money used for?'
              }
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="spending-date" className="text-xs font-semibold text-gray-600">
              {currentLang === 'vi' ? 'Ngày chi' : 'Spent on'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="spending-date"
              type="date"
              min={minSpentAt}
              max={maxSpentAt}
              value={form.spentAt}
              onChange={(e) => setForm((prev) => ({ ...prev, spentAt: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-600">
              {currentLang === 'vi' ? 'Hình ảnh chứng từ' : 'Supporting photos'}
            </span>
            {editingSpending ? (
              <Fancybox options={{ Carousel: { infinite: false } }}>
                <div className="flex flex-wrap gap-2">
                  {editingSpending.photos.map((photo) => (
                    <div key={photo.id} className="group relative h-16 w-16">
                      <a
                        href={getMediaUrl(photo.url)}
                        data-fancybox={`spending-edit-${editingSpending.id}`}
                        className="block h-16 w-16 cursor-zoom-in"
                      >
                        <img
                          src={getMediaUrl(photo.url)}
                          alt="Spending proof"
                          className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(editingSpending.id, photo.id)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer"
                    aria-label="Add photo"
                  >
                    {uploadPhotoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const { files } = e.target;
                      if (files && files.length > 0)
                        void handlePhotoUpload(editingSpending.id, files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </Fancybox>
            ) : (
              <Fancybox options={{ Carousel: { infinite: false } }}>
                <div className="flex flex-wrap gap-2">
                  {pendingPhotos.map((photo, index) => (
                    <div key={photo.previewUrl} className="group relative h-16 w-16">
                      <a
                        href={photo.previewUrl}
                        data-fancybox="spending-pending"
                        className="block h-16 w-16 cursor-zoom-in"
                      >
                        <img
                          src={photo.previewUrl}
                          alt="Spending proof preview"
                          className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => removePendingPhoto(index)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => pendingFileInputRef.current?.click()}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary cursor-pointer"
                    aria-label="Add photo"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <input
                    ref={pendingFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const { files } = e.target;
                      if (files && files.length > 0) addPendingPhotos(files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </Fancybox>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeForm} className="cursor-pointer">
              {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {editingSpending
                ? currentLang === 'vi'
                  ? 'Lưu thay đổi'
                  : 'Save Changes'
                : currentLang === 'vi'
                  ? 'Ghi nhận thu chi'
                  : 'Log Spending'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isViewDialogOpen}
        onClose={closeViewDialog}
        title={currentLang === 'vi' ? 'Chi tiết thu chi' : 'Spending Details'}
        className="max-w-lg"
      >
        {viewingSpending && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold text-[#102820]">
                {formatCurrency(viewingSpending.amount)}
              </span>
              {viewingSpending.isEdited && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {currentLang === 'vi' ? 'Đã chỉnh sửa' : 'Edited'}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {viewingSpending.description}
            </p>
            <p className="text-xs text-gray-400">{formatDate(viewingSpending.spentAt)}</p>
            {viewingSpending.photos.length > 0 && (
              <Fancybox options={{ Carousel: { infinite: false } }}>
                <div className="flex flex-wrap gap-2">
                  {viewingSpending.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={getMediaUrl(photo.url)}
                      data-fancybox={`spending-view-${viewingSpending.id}`}
                      className="block h-16 w-16 cursor-zoom-in overflow-hidden rounded-lg border border-gray-200"
                    >
                      <img
                        src={getMediaUrl(photo.url)}
                        alt="Spending proof"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </Fancybox>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title={currentLang === 'vi' ? 'Xóa khoản thu chi' : 'Delete spending entry'}
        confirmLabel={currentLang === 'vi' ? 'Xóa' : 'Delete'}
        pendingLabel={currentLang === 'vi' ? 'Đang xóa...' : 'Deleting...'}
        isPending={deleteMutation.isPending}
      >
        {currentLang === 'vi'
          ? 'Hành động này sẽ xóa vĩnh viễn khoản thu chi này và không thể hoàn tác.'
          : 'This will permanently remove this spending entry. This action cannot be undone.'}
      </ConfirmDialog>
    </div>
  );
}
