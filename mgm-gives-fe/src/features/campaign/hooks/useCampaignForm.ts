import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import * as z from 'zod';
import { useCategories } from '@/features/category/hooks/useCategories';
import { usePayOSStatus } from '@/features/integrations/usePayOSIntegration';
import { campaignApi } from '../api/campaignApi';
import type { CampaignMedia, CampaignRequest, CampaignResponse, CampaignStatus } from '../types';
import { useCreateCampaignMutation, useUpdateCampaignMutation } from './useCampaigns';

export const isEmptyHtml = (html?: string | null) => {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
};

export const getCampaignSchema = (lang: string = 'en') => {
  const isVi = lang === 'vi';
  return z
    .object({
      title: z
        .string()
        .min(1, isVi ? 'Vui lòng nhập tên chiến dịch' : 'Title is required')
        .max(
          100,
          isVi
            ? 'Tên chiến dịch không được vượt quá 100 ký tự'
            : 'Title must not exceed 100 characters',
        ),
      description: z.string().optional().nullable(),
      categories: z
        .array(z.number())
        .min(1, isVi ? 'Vui lòng chọn ít nhất một danh mục' : 'At least one category is required'),
      acceptsMoney: z.boolean(),
      acceptsGoods: z.boolean(),
      target: z.string().or(z.number()).optional().nullable(),
      startDate: z
        .string()
        .min(1, isVi ? 'Vui lòng chọn ngày bắt đầu' : 'Start date is required')
        .refine(
          (val) => {
            if (!val) return true;
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            return val >= todayStr;
          },
          {
            message: isVi
              ? 'Ngày bắt đầu không được trong quá khứ'
              : 'Start date cannot be in the past',
          },
        ),
      endDate: z.string().min(1, isVi ? 'Vui lòng chọn ngày kết thúc' : 'End date is required'),
      priority: z.enum(['NORMAL', 'HIGH', 'URGENT']),
      donationMethod: z.enum(['MANUAL_QR', 'PAYOS', 'HYBRID']),
      qrImageUrl: z.string().nullable().optional(),
      qrBankInfo: z.string().max(500).nullable().optional(),
      bankName: z.string().nullable().optional(),
      bankCode: z.string().nullable().optional(),
      bankBin: z.string().nullable().optional(),
      bankAccountNumber: z.string().nullable().optional(),
      bankAccountHolderName: z.string().nullable().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: isVi
          ? 'Ngày bắt đầu phải trước ngày kết thúc'
          : 'Start date must be before end date',
        path: ['endDate'],
      },
    )
    .refine(
      (data) => {
        if (data.acceptsMoney) {
          const raw =
            typeof data.target === 'string'
              ? data.target.replace(/\D/g, '')
              : String(data.target ?? '');
          const parsed = raw !== '' ? Number.parseInt(raw, 10) : null;
          if (parsed === null || parsed < 500000) return false;
          if (raw.length > 12) return false;
        }
        return true;
      },
      {
        message: isVi
          ? 'Số tiền mục tiêu là bắt buộc và phải từ 500.000 đến 999.999.999.999 VNĐ'
          : 'Goal amount is required and must be between 500,000 and 999,999,999,999.',
        path: ['target'],
      },
    )
    .refine(
      (data) => {
        if (
          data.acceptsMoney &&
          (data.donationMethod === 'MANUAL_QR' || data.donationMethod === 'HYBRID')
        ) {
          return !!data.bankCode && data.bankCode.trim().length > 0;
        }
        return true;
      },
      {
        message: isVi ? 'Vui lòng chọn ngân hàng' : 'Bank is required',
        path: ['bankCode'],
      },
    )
    .refine(
      (data) => {
        if (
          data.acceptsMoney &&
          (data.donationMethod === 'MANUAL_QR' || data.donationMethod === 'HYBRID')
        ) {
          return !!data.bankAccountNumber && data.bankAccountNumber.trim().length > 0;
        }
        return true;
      },
      {
        message: isVi ? 'Vui lòng nhập số tài khoản' : 'Account number is required',
        path: ['bankAccountNumber'],
      },
    )
    .refine(
      (data) => {
        if (
          data.acceptsMoney &&
          (data.donationMethod === 'MANUAL_QR' || data.donationMethod === 'HYBRID')
        ) {
          return !!data.bankAccountHolderName && data.bankAccountHolderName.trim().length > 0;
        }
        return true;
      },
      {
        message: isVi ? 'Vui lòng nhập tên chủ tài khoản' : 'Account holder name is required',
        path: ['bankAccountHolderName'],
      },
    );
};

export const campaignSchema = getCampaignSchema('en');

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const getFormValuesFromResponse = (campaign: CampaignResponse): CampaignFormValues => {
  return {
    title: campaign.title,
    description: campaign.description || '',
    categories: (campaign.categories || []).map((c) => c.id),
    acceptsMoney: campaign.acceptsMoney,
    acceptsGoods: campaign.acceptsGoods,
    target: campaign.target || '',
    startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
    endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
    priority: campaign.priority ?? 'NORMAL',
    donationMethod: campaign.donationMethod ?? 'MANUAL_QR',
    qrImageUrl: campaign.qrImageUrl || null,
    qrBankInfo: campaign.qrBankInfo || '',
    bankName: campaign.bankName || '',
    bankCode: campaign.bankCode || '',
    bankBin: campaign.bankBin || '',
    bankAccountNumber: campaign.bankAccountNumber || '',
    bankAccountHolderName: campaign.bankAccountHolderName || '',
  };
};

export const buildCampaignPayload = (
  values: CampaignFormValues,
  status: CampaignStatus,
): CampaignRequest => {
  const rawTarget =
    typeof values.target === 'string' ? values.target.replace(/\D/g, '') : values.target;
  const parsedTarget =
    rawTarget !== null && rawTarget !== undefined && rawTarget !== ''
      ? Number.parseInt(rawTarget.toString(), 10)
      : null;

  return {
    title: values.title?.trim() || `Draft Campaign - ${new Date().toISOString().slice(0, 10)}`,
    description: values.description || null,
    categories: values.categories || [],
    acceptsMoney: values.acceptsMoney,
    acceptsGoods: values.acceptsGoods,
    target: values.acceptsMoney ? parsedTarget : null,
    startDate: values.startDate ? `${values.startDate}T00:00:00` : null,
    endDate: values.endDate ? `${values.endDate}T23:59:59` : null,
    priority: values.priority ?? 'NORMAL',
    status,
    donationMethod: values.donationMethod ?? 'MANUAL_QR',
    qrImageUrl: values.qrImageUrl || null,
    qrBankInfo: values.qrBankInfo || null,
    bankName: values.bankName || null,
    bankCode: values.bankCode || null,
    bankBin: values.bankBin || null,
    bankAccountNumber: values.bankAccountNumber || null,
    bankAccountHolderName: values.bankAccountHolderName || null,
  };
};

interface UseCampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: CampaignResponse | null;
  onSuccess?: () => void;
}

export function useCampaignForm({ isOpen, onClose, campaign, onSuccess }: UseCampaignFormProps) {
  const [activeId, setActiveId] = useState<number | null>(campaign ? campaign.id : null);
  const [submittingType, setSubmittingType] = useState<'DRAFT' | 'PENDING' | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<CampaignMedia[]>(() => {
    if (campaign) {
      const mediaList = campaign.media || campaign.medias;
      if (mediaList) {
        return mediaList.map(
          (m: {
            id: number;
            url?: string;
            mediaUrl?: string;
            mediaType?: string;
            type?: string;
            isCover?: boolean;
            cover?: boolean;
          }) => ({
            id: m.id,
            url: m.url || m.mediaUrl || '',
            mediaType: m.mediaType || m.type || 'IMAGE',
            isCover: typeof m.isCover === 'boolean' ? m.isCover : m.cover || false,
          }),
        );
      }
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const lastOpenedRef = useRef<boolean>(false);
  const lastCampaignIdRef = useRef<number | null | undefined>(undefined);

  const { i18n } = useTranslation('campaign');
  const { data: approvedCategories = [] } = useCategories();
  const createCampaignMutation = useCreateCampaignMutation();
  const updateCampaignMutation = useUpdateCampaignMutation();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    setError,
    clearErrors,
    control,
    trigger,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(getCampaignSchema(i18n.language)),
    mode: 'onBlur',
    defaultValues: campaign
      ? getFormValuesFromResponse(campaign)
      : {
          title: '',
          description: '',
          categories: [],
          acceptsMoney: true,
          acceptsGoods: true,
          target: '',
          startDate: '',
          endDate: '',
          priority: 'NORMAL',
          donationMethod: 'MANUAL_QR',
          qrImageUrl: null,
          qrBankInfo: '',
          bankName: '',
          bankCode: '',
          bankBin: '',
          bankAccountNumber: '',
          bankAccountHolderName: '',
        },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const { data: payOSStatus } = usePayOSStatus(watch('acceptsMoney'));

  const selectedCategoryIds = watch('categories') || [];

  const syncCampaignToForm = useCallback(
    (campaignData: CampaignResponse) => {
      setActiveId(campaignData.id);
      lastCampaignIdRef.current = campaignData.id;
      reset(getFormValuesFromResponse(campaignData));

      const mediaList = campaignData.media || campaignData.medias;
      if (mediaList) {
        const mapped = mediaList.map(
          (m: {
            id: number;
            url?: string;
            mediaUrl?: string;
            mediaType?: string;
            type?: string;
            isCover?: boolean;
            cover?: boolean;
          }) => ({
            id: m.id,
            url: m.url || m.mediaUrl || '',
            mediaType: m.mediaType || m.type || 'IMAGE',
            isCover: typeof m.isCover === 'boolean' ? m.isCover : m.cover || false,
          }),
        );
        setUploadedMedia(mapped);
      } else {
        setUploadedMedia([]);
      }
    },
    [reset],
  );

  // Reset form when modal opens / campaign changes
  useEffect(() => {
    if (!isOpen) {
      lastOpenedRef.current = false;
      return;
    }

    const hasOpened = !lastOpenedRef.current;
    const campaignChanged = lastCampaignIdRef.current !== campaign?.id;

    if (hasOpened || campaignChanged) {
      lastOpenedRef.current = true;

      if (campaign) {
        syncCampaignToForm(campaign);
      } else {
        setActiveId(null);
        lastCampaignIdRef.current = null;
        reset({
          title: '',
          description: '',
          categories: [],
          acceptsMoney: true,
          acceptsGoods: true,
          target: '',
          startDate: '',
          endDate: '',
          priority: 'NORMAL',
          donationMethod: 'MANUAL_QR',
          qrImageUrl: null,
          qrBankInfo: '',
          bankName: '',
          bankCode: '',
          bankBin: '',
          bankAccountNumber: '',
          bankAccountHolderName: '',
        });
      }
      setSubmittingType(null);
      setHasAttemptedNext(false);
    }
  }, [isOpen, campaign, reset, syncCampaignToForm]);

  const handleToggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      setValue(
        'categories',
        selectedCategoryIds.filter((cid) => cid !== id),
        { shouldDirty: true },
      );
    } else {
      setValue('categories', [...selectedCategoryIds, id], { shouldDirty: true });
    }
    clearErrors('categories');
  };

  const handleMediaUpload = async (file: File, mediaType: 'image' | 'video' | 'gallery-image') => {
    const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

    if (mediaType !== 'video' && file.size > MAX_IMAGE_SIZE) {
      toast.error('Image size must be less than 15MB');
      return;
    }
    if (mediaType === 'video' && file.size > MAX_VIDEO_SIZE) {
      toast.error('Video size must be less than 200MB');
      return;
    }

    setIsUploading(true);
    try {
      let currentCampaignId = activeId;
      const currentValues = getValues();
      const payload = buildCampaignPayload(currentValues, 'DRAFT');

      if (!currentCampaignId) {
        const createdDraft = await createCampaignMutation.mutateAsync(payload);
        currentCampaignId = createdDraft.id;
        syncCampaignToForm(createdDraft);
        toast.info('Draft campaign auto-created to attach media.');
      }

      const isCover = mediaType === 'image';
      const newMedia = await campaignApi.uploadCampaignMedia(currentCampaignId, file, isCover);
      setUploadedMedia((prev) => [...prev, newMedia]);
      toast.success(
        `${isCover ? 'Cover image' : mediaType === 'video' ? 'Video' : 'Gallery image'} uploaded successfully!`,
      );
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaDelete = async (mediaId: number) => {
    try {
      await campaignApi.deleteCampaignMedia(mediaId);
      setUploadedMedia((prev) => prev.filter((m) => m.id !== mediaId));
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to delete media');
    }
  };

  const handleAutoSaveDraft = async (): Promise<{
    ok: boolean;
    campaignId?: number;
    error?: unknown;
  }> => {
    const values = getValues();
    const payload = buildCampaignPayload(values, 'DRAFT');

    try {
      if (activeId) {
        const updated = await updateCampaignMutation.mutateAsync({
          id: activeId,
          data: payload,
        });
        syncCampaignToForm(updated);
        toast.success('Draft auto-saved on server');
        onSuccess?.();
        return { ok: true, campaignId: updated.id };
      } else {
        const created = await createCampaignMutation.mutateAsync(payload);
        syncCampaignToForm(created);
        toast.success('Draft saved on server');
        onSuccess?.();
        return { ok: true, campaignId: created.id };
      }
    } catch (err: unknown) {
      console.error('Failed to auto-save draft:', err);
      return { ok: false, error: err };
    }
  };

  const handleAction = async (isSubmit: boolean, shouldClose = false) => {
    setSubmittingType(isSubmit ? 'PENDING' : 'DRAFT');

    if (!isSubmit) {
      // Save Draft logic: bypass full zodResolver validation to allow saving incomplete drafts
      const values = getValues();
      if (!values.title?.trim()) {
        toast.error('Title is required to save a draft.');
        setSubmittingType(null);
        return;
      }

      const payload = buildCampaignPayload(values, 'DRAFT');

      try {
        if (activeId) {
          // Edit Mode
          const updated = await updateCampaignMutation.mutateAsync({
            id: activeId,
            data: payload,
          });
          if (shouldClose) {
            toast.success('Draft campaign saved successfully!');
            onSuccess?.();
            onClose();
          } else {
            toast.success('Draft updated successfully!');
            syncCampaignToForm(updated);
            onSuccess?.();
          }
        } else {
          // Create Mode
          const created = await createCampaignMutation.mutateAsync(payload);
          if (shouldClose) {
            toast.success('Draft campaign saved successfully!');
            onSuccess?.();
            onClose();
          } else {
            toast.success('Draft saved successfully!');
            syncCampaignToForm(created);
            onSuccess?.();
          }
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || 'Failed to save campaign');
      } finally {
        setSubmittingType(null);
      }
      return;
    }

    // Submit mode (runs hook form validation resolver)
    return handleSubmit(
      async (values) => {
        const payload = buildCampaignPayload(values, 'PENDING');

        // Execute Create/Update Mutation
        try {
          if (activeId) {
            // Edit Mode (PUT)
            await updateCampaignMutation.mutateAsync({
              id: activeId,
              data: payload,
            });
            toast.success('Campaign idea submitted successfully!');
            onSuccess?.();
            onClose();
          } else {
            // Create Mode (POST)
            await createCampaignMutation.mutateAsync(payload);
            toast.success('Campaign idea submitted successfully!');
            onSuccess?.();
            onClose();
          }
        } catch (err: unknown) {
          const error = err as { message?: string };
          toast.error(error.message || 'Failed to submit campaign');
        } finally {
          setSubmittingType(null);
        }
      },
      (errors) => {
        setSubmittingType(null);
        console.error('Validation errors:', errors);

        // Show validation errors to user
        const errorMessages = Object.values(errors)
          .map((err) => err?.message)
          .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0);

        if (errorMessages.length > 0) {
          toast.error(`Please correct the following errors:\n• ${errorMessages.join('\n• ')}`);
        }
      },
    )();
  };

  // Save campaign data while keeping PENDING status (no unsubmit)
  const handleSavePending = async () => {
    setSubmittingType('DRAFT'); // reuse DRAFT loading indicator
    const values = getValues();
    if (!values.title?.trim()) {
      toast.error('Title is required to save.');
      setSubmittingType(null);
      return;
    }
    const payload = buildCampaignPayload(values, 'PENDING');
    try {
      if (activeId) {
        const updated = await updateCampaignMutation.mutateAsync({ id: activeId, data: payload });
        toast.success('Changes saved!');
        syncCampaignToForm(updated);
        onSuccess?.();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSubmittingType(null);
    }
  };

  const allCategories = approvedCategories;

  return {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    dirtyFields,
    submittingType,
    selectedCategoryIds,
    handleToggleCategory,
    handleAction,
    handleSavePending,
    watch,
    getValues,
    setValue,
    setError,
    trigger,
    reset,
    activeId,
    uploadedMedia,
    isUploading,
    handleMediaUpload,
    handleMediaDelete,
    handleAutoSaveDraft,
    allCategories,
    hasAttemptedNext,
    setHasAttemptedNext,
    payOSConnected: payOSStatus?.connected ?? false,
  };
}
