export type LeftActionType = 'cancel' | 'previous';
export type SecondaryActionType = 'save_draft' | 'save_draft_step4';
export type TertiaryActionType = 'save_changes';
export type PrimaryActionType = 'next' | 'submit' | 'back_to_campaigns';

export interface FooterActionState<T> {
  type: T;
  label: string;
  isVisible: boolean;
  disabled: boolean;
  isLoading: boolean;
}

export interface FooterState {
  left: FooterActionState<LeftActionType>;
  tertiary?: FooterActionState<TertiaryActionType>;
  secondary?: FooterActionState<SecondaryActionType>;
  primary: FooterActionState<PrimaryActionType>;
}

interface GetFooterStateParams {
  isEditMode: boolean;
  isEditable: boolean;
  currentStep: number;
  isDirty: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  submittingType: 'DRAFT' | 'PENDING' | null;
  lang?: string;
}

export function getFooterState({
  isEditMode,
  isEditable,
  currentStep,
  isDirty,
  isPending,
  isSubmitting,
  submittingType,
  lang = 'en',
}: GetFooterStateParams): FooterState {
  const isVi = lang === 'vi';

  // 1. Left Action
  const left: FooterActionState<LeftActionType> =
    currentStep === 1
      ? {
          type: 'cancel',
          label: isEditMode
            ? isVi
              ? 'Quay lại Chiến dịch của tôi'
              : 'Back to My Campaigns'
            : isVi
              ? 'Hủy bỏ'
              : 'Cancel',
          isVisible: true,
          disabled: false,
          isLoading: false,
        }
      : {
          type: 'previous',
          label: isVi ? 'Quay lại' : 'Previous',
          isVisible: true,
          disabled: false,
          isLoading: false,
        };

  // 2. Tertiary Action: "Save changes" for PENDING campaigns (steps 1-3)
  let tertiary: FooterActionState<TertiaryActionType> | undefined;
  if (isEditMode && isEditable && isPending && currentStep < 4) {
    tertiary = {
      type: 'save_changes',
      label: isVi ? 'Lưu thay đổi' : 'Save changes',
      isVisible: true,
      disabled: isSubmitting,
      isLoading: isSubmitting && submittingType === 'DRAFT',
    };
  }

  // 3. Secondary Action (Optional)
  let secondary: FooterActionState<SecondaryActionType> | undefined;

  if (isEditMode && isEditable && currentStep < 4) {
    secondary = {
      type: 'save_draft',
      label: isPending
        ? isVi
          ? 'Hủy gửi & lưu bản nháp'
          : 'Unsubmit and save draft'
        : isVi
          ? 'Lưu thay đổi'
          : 'Save changes',
      isVisible: isPending ? isDirty : true,
      disabled: isSubmitting,
      isLoading: isSubmitting && submittingType === 'DRAFT',
    };
  } else if (isEditable && currentStep === 4) {
    let label = isVi ? 'Lưu thành bản nháp' : 'Save as draft';
    if (isEditMode) {
      label = isPending
        ? isVi
          ? 'Hủy gửi & lưu thay đổi'
          : 'Unsubmit & save changes'
        : isVi
          ? 'Lưu thay đổi'
          : 'Save changes';
    }
    secondary = {
      type: 'save_draft_step4',
      label,
      isVisible: true,
      disabled: isSubmitting,
      isLoading: isSubmitting && submittingType === 'DRAFT',
    };
  }

  // 4. Primary Action
  let primary: FooterActionState<PrimaryActionType>;

  if (currentStep < 4) {
    primary = {
      type: 'next',
      label: isVi ? 'Tiếp theo' : 'Next',
      isVisible: true,
      disabled: false,
      isLoading: false,
    };
  } else if (isEditable) {
    primary = {
      type: 'submit',
      label: isEditMode
        ? isVi
          ? 'Gửi thay đổi để duyệt'
          : 'Submit changes for approval'
        : isVi
          ? 'Gửi duyệt chiến dịch'
          : 'Submit for approval',
      isVisible: true,
      disabled: isSubmitting,
      isLoading: isSubmitting && submittingType === 'PENDING',
    };
  } else {
    primary = {
      type: 'back_to_campaigns',
      label: isVi ? 'Quay lại Chiến dịch của tôi' : 'Back to My Campaigns',
      isVisible: true,
      disabled: false,
      isLoading: false,
    };
  }

  return {
    left,
    tertiary,
    secondary,
    primary,
  };
}
