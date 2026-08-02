import DOMPurify from 'dompurify';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/features/category';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils/cn';
import { formatNumberWithCommas } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import type { CampaignFormValues } from '../../hooks/useCampaignForm';
import { isEmptyHtml } from '../../hooks/useCampaignForm';
import type { CampaignMedia } from '../../types';
import { isStep1Valid, isStep2Valid, isStep3Valid } from './stepState';

interface Step4ReviewProps {
  watch: UseFormWatch<CampaignFormValues>;
  uploadedMedia: CampaignMedia[];
  allCategories: Category[];
  onJumpToStep: (step: number) => void;
  disabled?: boolean;
  payOSConnected?: boolean;
}

const getPriorityBadgeClass = (priority?: string) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'URGENT':
      return 'bg-red-100 text-red-700 border border-red-300 animate-pulse';
    default:
      return 'bg-blue-50 text-blue-700 border border-blue-100';
  }
};

// Inline red "missing field" indicator
function MissingField({ label, lang = 'en' }: { label: string; lang?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500">
      <XCircle className="h-3 w-3 shrink-0" />
      {label} {lang === 'vi' ? 'là bắt buộc' : 'is required'}
    </span>
  );
}

export function Step4Review({
  watch,
  uploadedMedia,
  allCategories,
  onJumpToStep,
  disabled = false,
  payOSConnected = true,
}: Step4ReviewProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const values = watch();
  const coverImage = uploadedMedia.find((m) => m.isCover);
  const galleryItems = uploadedMedia.filter((m) => !m.isCover);

  // Embla carousel for gallery preview
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const onSelect = useCallback((api: ReturnType<typeof useEmblaCarousel>[1]) => {
    if (!api) return;
    setPrevBtnEnabled(api.canScrollPrev());
    setNextBtnEnabled(api.canScrollNext());
  }, []);
  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // Resolve Category Names
  const selectedCategoryNames = (values.categories || [])
    .map((id) => allCategories.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  // Per-field validation
  const missingTitle = !values.title?.trim();
  const missingCategories = !values.categories || values.categories.length === 0;
  const missingStartDate = !values.startDate;
  const missingEndDate = !values.endDate;
  const missingDescription = !values.description || isEmptyHtml(values.description);

  const requiresBankDetails =
    values.acceptsMoney &&
    (values.donationMethod === 'MANUAL_QR' || values.donationMethod === 'HYBRID');
  const missingBankCode = requiresBankDetails && !values.bankCode;
  const missingBankAccountNumber = requiresBankDetails && !values.bankAccountNumber;
  const missingBankHolderName = requiresBankDetails && !values.bankAccountHolderName;

  const rawTarget =
    typeof values.target === 'string' ? values.target.replace(/\D/g, '') : values.target;
  const parsedTarget =
    rawTarget !== null && rawTarget !== undefined && rawTarget !== ''
      ? Number.parseInt(rawTarget.toString(), 10)
      : null;
  const missingTarget = values.acceptsMoney && (parsedTarget === null || parsedTarget < 500000);
  const missingAcceptance = !values.acceptsMoney && !values.acceptsGoods;

  const requiresPayOS =
    values.acceptsMoney &&
    (values.donationMethod === 'PAYOS' || values.donationMethod === 'HYBRID');
  const missingPayOS = requiresPayOS && !payOSConnected;

  // Section-level validation
  const isBasicValid = isStep1Valid(values);
  const isMediaValid = isStep2Valid(values, uploadedMedia);
  const isDonationValid = isStep3Valid(values, payOSConnected);
  const isReady = isBasicValid && isMediaValid && isDonationValid;

  const sectionCardClass = (valid: boolean) =>
    cn(
      'bg-white p-6 rounded-2xl border shadow-sm relative group/card',
      valid ? 'border-gray-100' : 'border-red-200',
    );

  const incompleteChip = (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 border border-red-200">
      <XCircle className="h-3 w-3" /> {currentLang === 'vi' ? 'Chưa hoàn thành' : 'Incomplete'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      {isReady && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 text-sm flex items-start gap-3 shadow-xs">
          <div className="bg-emerald-500 rounded-full p-1 text-white shrink-0">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-950">
              {currentLang === 'vi' ? 'Sẵn sàng gửi duyệt' : 'Ready to Submit'}
            </p>
            <p className="text-xs mt-0.5 text-emerald-800 leading-relaxed">
              {currentLang === 'vi'
                ? 'Vui lòng xem lại các thông tin bên dưới trước khi gửi phê duyệt chiến dịch của bạn. Bạn có thể nhấn Chỉnh sửa ở bất kỳ phần nào để quay lại.'
                : 'Please review the details below before submitting your campaign for approval. You can click Edit on any section to go back.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Section 1: Basic Info Review */}
        <div className={sectionCardClass(isBasicValid)}>
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <FileText className="h-4 w-4 text-primary" />
              <span>{currentLang === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}</span>
              {!isBasicValid && incompleteChip}
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onJumpToStep(1)}
                className="text-xs text-gray-500 hover:text-primary hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {/* Title */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Tên chiến dịch' : 'Title'}
              </span>
              {missingTitle ? (
                <MissingField
                  label={currentLang === 'vi' ? 'Tên chiến dịch' : 'Title'}
                  lang={currentLang}
                />
              ) : (
                <p className="text-gray-800 font-medium text-base">{values.title}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Mức độ ưu tiên' : 'Priority'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                  getPriorityBadgeClass(values.priority),
                )}
              >
                {values.priority === 'HIGH'
                  ? currentLang === 'vi'
                    ? 'CAO'
                    : 'HIGH'
                  : values.priority === 'URGENT'
                    ? currentLang === 'vi'
                      ? 'KHẨN CẤP'
                      : 'URGENT'
                    : currentLang === 'vi'
                      ? 'BÌNH THƯỜNG'
                      : 'NORMAL'}
              </span>
            </div>

            {/* Categories */}
            <div className="md:col-span-2 space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Danh mục' : 'Categories'}
              </span>
              {missingCategories ? (
                <MissingField
                  label={currentLang === 'vi' ? 'Ít nhất một danh mục' : 'At least one category'}
                  lang={currentLang}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategoryNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="md:col-span-2 space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Thời gian' : 'Duration'}
              </span>
              {missingStartDate || missingEndDate ? (
                <div className="flex flex-col gap-1 mt-1">
                  {missingStartDate && (
                    <MissingField
                      label={currentLang === 'vi' ? 'Ngày bắt đầu' : 'Start date'}
                      lang={currentLang}
                    />
                  )}
                  {missingEndDate && (
                    <MissingField
                      label={currentLang === 'vi' ? 'Ngày kết thúc' : 'End date'}
                      lang={currentLang}
                    />
                  )}
                </div>
              ) : (
                <p className="text-gray-800 font-medium">
                  {values.startDate} <ChevronRight className="inline h-3 w-3 text-gray-400" />{' '}
                  {values.endDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Media & Story Review */}
        <div className={sectionCardClass(isMediaValid)}>
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>
                {currentLang === 'vi'
                  ? 'Hình ảnh & Câu chuyện chiến dịch'
                  : 'Media & Campaign Story'}
              </span>
              {!isMediaValid && incompleteChip}
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onJumpToStep(2)}
                className="text-xs text-gray-500 hover:text-primary hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Cover Image — centred, same as Step 2 */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 block">
                {currentLang === 'vi'
                  ? 'Ảnh bìa (Bắt buộc để gửi duyệt)'
                  : 'Cover Image (Required for submission)'}
              </span>
              <div className="max-w-md mx-auto w-full">
                {coverImage ? (
                  <div className="relative rounded-xl border overflow-hidden aspect-video bg-gray-50 shadow-sm border-gray-200">
                    <img
                      src={getMediaUrl(coverImage.url)}
                      alt="Campaign Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl border-2 border-dashed border-red-200 aspect-video bg-red-50/20 flex flex-col items-center justify-center p-4 text-center">
                    <XCircle className="h-8 w-8 text-red-400 mb-2" />
                    <p className="text-sm font-semibold text-red-600">
                      {currentLang === 'vi' ? 'Chưa có ảnh bìa' : 'No Cover Image'}
                    </p>
                    <p className="text-xs text-red-400 mt-1 max-w-[240px]">
                      {currentLang === 'vi'
                        ? 'Bắt buộc phải có trước khi gửi phê duyệt.'
                        : 'Required before submitting for approval.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Gallery — carousel like Step 2 */}
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                <span className="text-xs font-semibold text-gray-500 block">
                  {currentLang === 'vi'
                    ? `Thư viện chiến dịch (${galleryItems.length} mục)`
                    : `Campaign Gallery (${galleryItems.length} item${galleryItems.length !== 1 ? 's' : ''})`}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center min-h-[175px] relative">
                {galleryItems.length > 0 ? (
                  <div className="relative group/carousel w-full py-1">
                    <div className="overflow-hidden w-full" ref={emblaRef}>
                      <div className="flex gap-4">
                        {galleryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-11px)] md:flex-[0_0_calc(25%-12px)] min-w-0 relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"
                          >
                            {item.mediaType === 'VIDEO' ? (
                              <div className="w-full h-full flex items-center justify-center bg-black relative">
                                <video
                                  src={getMediaUrl(item.url)}
                                  className="w-full h-full object-contain"
                                >
                                  <track kind="captions" />
                                </video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                  <VideoIcon className="h-8 w-8 text-white opacity-85" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={getMediaUrl(item.url)}
                                alt="Gallery item"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* Media type tag */}
                            <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium pointer-events-none">
                              {item.mediaType === 'VIDEO' ? (
                                <>
                                  <VideoIcon className="h-3 w-3" /> Video
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-3 w-3" /> Image
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {prevBtnEnabled && (
                      <button
                        type="button"
                        onClick={scrollPrev}
                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer focus:outline-none"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    {nextBtnEnabled && (
                      <button
                        type="button"
                        onClick={scrollNext}
                        className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer focus:outline-none"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-gray-150 rounded-xl bg-gray-50/50 text-center gap-1.5 w-full">
                    <ImageIcon className="h-8 w-8 text-gray-300" />
                    <span className="text-xs font-semibold text-gray-500">
                      {currentLang === 'vi'
                        ? 'Chưa có hình ảnh/video thư viện'
                        : 'No gallery items'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {currentLang === 'vi'
                        ? 'Chuyển sang Bước 2 để thêm ảnh/video'
                        : 'Go to Step 2 to add photos/videos'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Story Description */}
            <div className="space-y-1 border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Câu chuyện chiến dịch' : 'Story Description'}
              </span>
              {missingDescription ? (
                <div className="border border-dashed border-red-200 rounded-xl bg-red-50/20 p-5 flex flex-col items-center justify-center text-center mt-1">
                  <XCircle className="h-6 w-6 text-red-400 mb-2" />
                  <p className="text-xs font-semibold text-red-600">
                    {currentLang === 'vi'
                      ? 'Chưa có câu chuyện chiến dịch'
                      : 'No Story Description'}
                  </p>
                  <p className="text-[11px] text-red-400 mt-1 max-w-md">
                    {currentLang === 'vi'
                      ? 'Bắt buộc phải có trước khi gửi phê duyệt. Vui lòng thêm ở Bước 2.'
                      : 'Required before submitting for approval. Add one in Step 2.'}
                  </p>
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-3.5 border border-gray-100 max-h-48 overflow-y-auto mt-1"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: description is HTML from rich text editor, sanitized with DOMPurify
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(values.description ?? ''),
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Donation Review */}
        <div className={sectionCardClass(isDonationValid)}>
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>{currentLang === 'vi' ? 'Thiết lập quyên góp' : 'Donation Setup'}</span>
              {!isDonationValid && incompleteChip}
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onJumpToStep(3)}
                className="text-xs text-gray-500 hover:text-primary hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Acceptance Methods */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {currentLang === 'vi' ? 'Hình thức tiếp nhận' : 'Acceptance Methods'}
              </span>
              {missingAcceptance ? (
                <MissingField
                  label={
                    currentLang === 'vi'
                      ? 'Ít nhất một hình thức tiếp nhận (Tiền hoặc Hiện vật)'
                      : 'At least one acceptance method (Monetary or Goods)'
                  }
                  lang={currentLang}
                />
              ) : (
                <div className="flex gap-4 pt-1">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
                      values.acceptsMoney
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {currentLang === 'vi' ? 'Tiền quyên góp' : 'Monetary'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
                      values.acceptsGoods
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {currentLang === 'vi' ? 'Hiện vật' : 'Goods'}
                  </span>
                </div>
              )}
            </div>

            {/* Goal Amount */}
            {values.acceptsMoney && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  {currentLang === 'vi' ? 'Số tiền mục tiêu' : 'Goal Amount'}
                </span>
                <div className="mt-1">
                  {missingTarget ? (
                    <MissingField
                      label={
                        currentLang === 'vi'
                          ? 'Số tiền mục tiêu (tối thiểu 500.000 VNĐ)'
                          : 'Goal amount (min. 500,000 VND)'
                      }
                      lang={currentLang}
                    />
                  ) : (
                    <span className="text-gray-800 font-bold text-base">
                      {formatNumberWithCommas(values.target)} VND
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            {values.acceptsMoney && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  {currentLang === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}
                </span>
                <p className="text-gray-800 font-medium mt-1">
                  {values.donationMethod === 'PAYOS' &&
                    (currentLang === 'vi' ? 'Cổng thanh toán PayOS' : 'PayOS Gateway')}
                  {values.donationMethod === 'MANUAL_QR' &&
                    (currentLang === 'vi' ? 'Mã QR thủ công' : 'Manual QR Code')}
                  {values.donationMethod === 'HYBRID' &&
                    (currentLang === 'vi'
                      ? 'Kết hợp (PayOS + QR thủ công)'
                      : 'Hybrid (PayOS + Manual QR)')}
                </p>
                {missingPayOS && (
                  <MissingField
                    label={
                      currentLang === 'vi' ? 'Kết nối tài khoản PayOS' : 'PayOS account connection'
                    }
                    lang={currentLang}
                  />
                )}
              </div>
            )}

            {/* Bank Details */}
            {requiresBankDetails && (
              <div className="space-y-2 md:col-span-2 border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  {currentLang === 'vi' ? 'Thông tin ngân hàng' : 'Bank Details'}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm mt-1">
                  {/* Bank */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      {currentLang === 'vi' ? 'Ngân hàng' : 'Bank'}
                    </span>
                    {missingBankCode ? (
                      <MissingField
                        label={currentLang === 'vi' ? 'Ngân hàng' : 'Bank'}
                        lang={currentLang}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800">
                        {values.bankName}
                        {values.bankCode ? ` (${values.bankCode})` : ''}
                      </span>
                    )}
                  </div>

                  {/* Account Number */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      {currentLang === 'vi' ? 'Số tài khoản' : 'Account Number'}
                    </span>
                    {missingBankAccountNumber ? (
                      <MissingField
                        label={currentLang === 'vi' ? 'Số tài khoản' : 'Account number'}
                        lang={currentLang}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800">
                        {values.bankAccountNumber}
                      </span>
                    )}
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      {currentLang === 'vi' ? 'Tên chủ tài khoản' : 'Account Holder Name'}
                    </span>
                    {missingBankHolderName ? (
                      <MissingField
                        label={currentLang === 'vi' ? 'Tên chủ tài khoản' : 'Account holder name'}
                        lang={currentLang}
                      />
                    ) : (
                      <span className="text-sm font-medium uppercase text-gray-800">
                        {values.bankAccountHolderName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
