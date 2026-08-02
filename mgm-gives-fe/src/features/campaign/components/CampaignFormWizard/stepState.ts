import type { FieldErrors } from 'react-hook-form';
import type { CampaignFormValues } from '../../hooks/useCampaignForm';
import { isEmptyHtml } from '../../hooks/useCampaignForm';
import type { CampaignMedia } from '../../types';

export const isStep1Valid = (
  values: CampaignFormValues,
  errors?: FieldErrors<CampaignFormValues>,
): boolean => {
  const hasBasicFields = !!(
    values.title?.trim() &&
    values.categories &&
    values.categories.length > 0 &&
    values.startDate &&
    values.endDate &&
    values.priority
  );
  if (!hasBasicFields) return false;

  if (values.startDate && values.endDate) {
    if (new Date(values.startDate) >= new Date(values.endDate)) {
      return false;
    }
  }

  if (errors) {
    return !(
      errors.title ||
      errors.categories ||
      errors.startDate ||
      errors.endDate ||
      errors.priority
    );
  }
  return true;
};

export const isStep2Valid = (
  values: CampaignFormValues,
  uploadedMedia: CampaignMedia[],
  errors?: FieldErrors<CampaignFormValues>,
): boolean => {
  const hasCoverImage = uploadedMedia.some((m) => m.isCover);
  const hasBasicFields = hasCoverImage && values.description && !isEmptyHtml(values.description);
  if (!hasBasicFields) return false;

  if (errors) {
    return !errors.description;
  }
  return true;
};

export const isStep3Valid = (
  values: CampaignFormValues,
  payOSConnected = true,
  errors?: FieldErrors<CampaignFormValues>,
): boolean => {
  const acceptsMoney = values.acceptsMoney;
  const acceptsGoods = values.acceptsGoods;
  const target = values.target;

  if (!acceptsMoney && !acceptsGoods) return false;

  if (acceptsMoney) {
    const rawTarget = typeof target === 'string' ? target.replace(/\D/g, '') : target;
    const parsedTarget =
      rawTarget !== null && rawTarget !== undefined && rawTarget !== ''
        ? Number.parseInt(rawTarget.toString(), 10)
        : null;

    if (parsedTarget === null || parsedTarget < 500000) return false;

    const method = values.donationMethod || 'MANUAL_QR';
    if (
      (method === 'MANUAL_QR' || method === 'HYBRID') &&
      (!values.bankCode || !values.bankAccountNumber || !values.bankAccountHolderName)
    ) {
      return false;
    }
    if ((method === 'PAYOS' || method === 'HYBRID') && !payOSConnected) {
      return false;
    }
  }

  if (errors) {
    return (
      !errors.target &&
      !errors.bankCode &&
      !errors.bankAccountNumber &&
      !errors.bankAccountHolderName
    );
  }
  return true;
};

export const getDirtySteps = (dirtyFields: Record<string, never>): Record<number, boolean> => {
  return {
    1: ['title', 'categories', 'startDate', 'endDate', 'priority'].some(
      (field) => dirtyFields[field],
    ),
    2: !!dirtyFields.description,
    3: [
      'acceptsMoney',
      'acceptsGoods',
      'target',
      'donationMethod',
      'bankName',
      'bankCode',
      'bankBin',
      'bankAccountNumber',
      'bankAccountHolderName',
    ].some((field) => dirtyFields[field]),
    4: false,
  };
};

export const getStepStates = ({
  values,
  errors,
  uploadedMedia,
  payOSConnected,
  visitedSteps,
  isEditMode,
}: {
  values: CampaignFormValues;
  errors?: FieldErrors<CampaignFormValues>;
  uploadedMedia: CampaignMedia[];
  payOSConnected: boolean;
  visitedSteps: Set<number>;
  isEditMode: boolean;
}): Record<number, 'unvisited' | 'incomplete' | 'complete'> => {
  const step1 = isStep1Valid(values, errors);
  const step2 = isStep2Valid(values, uploadedMedia, errors);
  const step3 = isStep3Valid(values, payOSConnected, errors);

  return {
    1: isEditMode || visitedSteps.has(1) ? (step1 ? 'complete' : 'incomplete') : 'unvisited',
    2: isEditMode || visitedSteps.has(2) ? (step2 ? 'complete' : 'incomplete') : 'unvisited',
    3: isEditMode || visitedSteps.has(3) ? (step3 ? 'complete' : 'incomplete') : 'unvisited',
    4:
      isEditMode || visitedSteps.has(4)
        ? step1 && step2 && step3
          ? 'complete'
          : 'incomplete'
        : 'unvisited',
  };
};
