import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Upload,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import type { Control, FieldErrors, UseFormTrigger } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/Button';
import { Label } from '@/shared/components/ui/Label';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';
import { cn } from '@/shared/utils/cn';
import { getMediaUrl } from '@/shared/utils/media';
import type { CampaignFormValues } from '../../hooks/useCampaignForm';
import type { CampaignMedia } from '../../types';

interface Step2MediaProps {
  uploadedMedia: CampaignMedia[];
  isUploading: boolean;
  handleMediaUpload: (file: File, mediaType: 'image' | 'video' | 'gallery-image') => Promise<void>;
  handleMediaDelete: (mediaId: number) => Promise<void>;
  control: Control<CampaignFormValues>;
  errors: FieldErrors<CampaignFormValues>;
  trigger: UseFormTrigger<CampaignFormValues>;
  hasAttemptedNext: boolean;
  disabled?: boolean;
}

export function Step2Media({
  uploadedMedia,
  isUploading,
  handleMediaUpload,
  handleMediaDelete,
  control,
  errors,
  trigger,
  hasAttemptedNext,
  disabled = false,
}: Step2MediaProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  // Filter media into Cover Image vs Gallery Items
  const coverImage = uploadedMedia.find((m) => m.isCover);
  const galleryItems = uploadedMedia.filter((m) => !m.isCover);

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

  // Cover Image Dropzone handler
  const onDropCover = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        toast.error('Only JPG, JPEG, PNG, WEBP, and GIF images up to 15MB are supported.');
        return;
      }
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error('Cover image is too large. Max size is 15MB.');
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase();
        const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!ext || !supportedExts.includes(ext)) {
          toast.error('Unsupported file type. Please upload JPG, PNG, WEBP, or GIF.');
          return;
        }
        handleMediaUpload(file, 'image');
      }
    },
    [handleMediaUpload],
  );

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive,
  } = useDropzone({
    onDrop: onDropCover,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    disabled,
  });

  // Gallery Dropzone handler
  const onDropGallery = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        toast.error(
          'Some files were rejected. Only JPG, PNG, WEBP, GIF (Max 15MB) and MP4, MOV, AVI, WEBM (Max 200MB) are supported.',
        );
      }

      for (const file of acceptedFiles) {
        const isVideo =
          file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi)$/i.test(file.name);
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (isVideo) {
          const supportedVideoExts = ['mp4', 'mov', 'avi', 'webm'];
          if (!ext || !supportedVideoExts.includes(ext)) {
            toast.error(
              `Unsupported video format for "${file.name}". Please upload MP4, MOV, AVI, or WEBM.`,
            );
            continue;
          }
          if (file.size > 200 * 1024 * 1024) {
            toast.error(`Video "${file.name}" is too large. Max size for video is 200MB.`);
            continue;
          }
          await handleMediaUpload(file, 'video');
        } else {
          const supportedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
          if (!ext || !supportedImageExts.includes(ext)) {
            toast.error(
              `Unsupported file type for "${file.name}". Only images (JPG, PNG, WEBP, GIF) and videos (MP4, MOV, AVI, WEBM) are supported.`,
            );
            continue;
          }
          if (file.size > 15 * 1024 * 1024) {
            toast.error(`Image "${file.name}" is too large. Max size for image is 15MB.`);
            continue;
          }
          await handleMediaUpload(file, 'gallery-image');
        }
      }
    },
    [handleMediaUpload],
  );

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps } = useDropzone({
    onDrop: onDropGallery,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/webm': ['.webm'],
    },
    disabled,
  });

  return (
    <div className="space-y-6">
      {/* Media Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-gray-900 border-b pb-2">
          {currentLang === 'vi' ? 'Hình ảnh chiến dịch' : 'Campaign Media'}
        </h2>

        <div className="space-y-6">
          {/* Cover Image Upload Area */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">
              {currentLang === 'vi'
                ? 'Ảnh bìa (Bắt buộc để gửi duyệt)'
                : 'Cover Image (Required for submission)'}{' '}
              <span className="text-red-500">*</span>
            </span>
            <div className="max-w-md mx-auto w-full">
              {coverImage ? (
                <div className="relative group rounded-xl border overflow-hidden aspect-video bg-gray-50 shadow-sm border-gray-200">
                  <img
                    src={getMediaUrl(coverImage.url)}
                    alt="Campaign Cover"
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={() => handleMediaDelete(coverImage.id)}
                      >
                        <X className="h-4 w-4" />{' '}
                        {currentLang === 'vi' ? 'Xóa ảnh bìa' : 'Remove Cover Image'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  {...getCoverRootProps()}
                  className={cn(
                    'flex flex-col items-center justify-center border-2 border-dashed rounded-xl aspect-video p-4 transition-all text-center gap-2',
                    disabled
                      ? 'cursor-not-allowed bg-gray-50 border-gray-200 opacity-60'
                      : 'cursor-pointer hover:bg-gray-50 hover:border-primary/50',
                    isCoverDragActive ? 'border-primary bg-primary/5' : 'border-gray-200',
                  )}
                >
                  <input {...getCoverInputProps()} />
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400 group-hover:scale-105 transition-transform" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {disabled
                      ? currentLang === 'vi'
                        ? 'Tải ảnh bìa bị vô hiệu hóa'
                        : 'Cover image upload disabled'
                      : currentLang === 'vi'
                        ? 'Kéo & thả ảnh bìa vào đây'
                        : 'Drag & drop cover image here'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {currentLang === 'vi'
                      ? 'Hỗ trợ JPG, PNG, WEBP (Tối đa 15MB)'
                      : 'Supports JPG, PNG, WEBP (Max 15MB)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Gallery Section */}
          <div className="flex flex-col space-y-2 w-full justify-between">
            <div className="flex items-center justify-between border-b pb-2 border-gray-100 min-h-[40px]">
              <span className="text-xs font-semibold text-gray-500 block">
                {currentLang === 'vi'
                  ? 'Thư viện chiến dịch (Tùy chọn - Thêm nhiều ảnh/video)'
                  : 'Campaign Gallery (Optional - Add multiple photos/videos)'}
              </span>
              {!disabled && (
                <div {...getGalleryRootProps()}>
                  <input {...getGalleryInputProps()} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || isUploading}
                    className="flex items-center gap-1.5 cursor-pointer text-xs py-1.5 px-3 h-8 shadow-xs"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {currentLang === 'vi' ? 'Thêm hình ảnh' : 'Add Media'}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery Carousel or Placeholder */}
            <div className="flex-1 flex flex-col justify-center min-h-[175px] relative">
              {galleryItems.length > 0 ? (
                <div className="relative group/carousel w-full py-1">
                  {/* Viewport */}
                  <div className="overflow-hidden w-full" ref={emblaRef}>
                    {/* Container */}
                    <div className="flex gap-4">
                      {galleryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-11px)] md:flex-[0_0_calc(25%-12px)] min-w-0 relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm group"
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

                          {/* Hover overlay with delete button */}
                          {!disabled && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-lg cursor-pointer"
                                onClick={() => handleMediaDelete(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
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

                  {/* Prev Button */}
                  {prevBtnEnabled && (
                    <button
                      type="button"
                      onClick={scrollPrev}
                      className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer focus:outline-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  {/* Next Button */}
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
                      ? 'Chưa tải lên mục thư viện nào'
                      : 'No gallery items uploaded yet'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {currentLang === 'vi'
                      ? 'Thêm nhiều ảnh/video để trình bày chiến dịch của bạn'
                      : 'Add multiple photos/videos to showcase your campaign'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Story Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 border-b pb-2">
            {currentLang === 'vi' ? 'Câu chuyện chiến dịch' : 'Campaign Story'}{' '}
            <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {currentLang === 'vi'
              ? 'Giải thích lý do bạn gây quỹ và số tiền sẽ được sử dụng như thế nào.'
              : 'Explain why you are raising funds and how the money will be used.'}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description" className="sr-only">
            Story description
          </Label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: captures bubbled blur events for validation
              <div
                onBlur={() => {
                  field.onBlur();
                  if (hasAttemptedNext) {
                    trigger('description');
                  }
                }}
              >
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={
                    currentLang === 'vi'
                      ? 'Mô tả lý do, kế hoạch và tác động...'
                      : 'Describe the cause, the plan, and the impact...'
                  }
                  disabled={disabled}
                  error={!!errors.description}
                />
              </div>
            )}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
