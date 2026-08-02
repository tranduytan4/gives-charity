import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Lock, Save, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type NavigateFunction, useBlocker, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { ROUTES } from '@/shared/constants/routes';
import { useCampaignForm } from '../../hooks/useCampaignForm';
import type { CampaignResponse } from '../../types';
// Subcomponents
import { FormStepper } from './FormStepper';
import { getFooterState } from './footerActions';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Media } from './Step2Media';
import { Step3Donation } from './Step3Donation';
import { Step4Review } from './Step4Review';
import {
  getDirtySteps,
  getStepStates,
  isStep1Valid,
  isStep2Valid,
  isStep3Valid,
} from './stepState';

interface CampaignFormWizardProps {
  campaign?: CampaignResponse | null;
  campaignId: number | null;
  navigate: NavigateFunction;
}

export function CampaignFormWizard({ campaign, campaignId, navigate }: CampaignFormWizardProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const location = useLocation();
  const isEditMode = campaignId !== null;
  const isEditable = campaign ? campaign.isEditable : true;

  const {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    dirtyFields,
    submittingType,
    handleToggleCategory,
    handleAction,
    handleSavePending,
    getValues,
    watch,
    setValue,
    setError,
    trigger,
    activeId,
    uploadedMedia,
    isUploading,
    handleMediaUpload,
    handleMediaDelete,
    handleAutoSaveDraft,
    allCategories,
    hasAttemptedNext,
    setHasAttemptedNext,
    payOSConnected,
  } = useCampaignForm({
    isOpen: true,
    onClose: () => handleBackToPreviousPage(),
    campaign,
  });

  const handleBackToPreviousPage = () => {
    const targetId = activeId || campaignId;
    if (location.state?.fromDetail && targetId) {
      navigate(ROUTES.CAMPAIGN_DETAIL.replace(':id', String(targetId)));
    } else {
      navigate(ROUTES.MY_CAMPAIGNS);
    }
  };

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => {
    if (campaign) {
      return new Set([1, 2, 3, 4]);
    }
    return new Set([1]);
  });

  const bypassExitGuardRef = useRef(false);

  // Reset bypass on successful path change
  useEffect(() => {
    bypassExitGuardRef.current = false;
    void location.pathname;
  }, [location.pathname]);

  // Sync route replacement when draft gets created dynamically
  useEffect(() => {
    if (activeId && String(activeId) !== String(campaignId)) {
      bypassExitGuardRef.current = true;
      navigate(ROUTES.EDIT_CAMPAIGN.replace(':id', String(activeId)), { replace: true });
    }
  }, [activeId, campaignId, navigate]);

  // Unsaved changes navigation guard
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !bypassExitGuardRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitDialog(true);
    }
  }, [blocker.state]);

  const handleStay = () => {
    setShowExitDialog(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleLeave = () => {
    setShowExitDialog(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  // Warn user on browser close / reload when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !bypassExitGuardRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Derive dirty state per step
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const dirtySteps = getDirtySteps(dirtyFields);

  const stepStates = getStepStates({
    values: watch(),
    errors,
    uploadedMedia,
    payOSConnected,
    visitedSteps,
    isEditMode,
  });

  // Navigation Logic
  const handleNext = async () => {
    // 1. Validate step 1 before moving forward
    if (currentStep === 1) {
      const isValid = await trigger(['title', 'categories', 'startDate', 'endDate', 'priority']);
      if (!isValid) {
        setHasAttemptedNext(true);
        toast.error(
          currentLang === 'vi'
            ? 'Vui lòng khắc phục các lỗi ở Bước 1 trước.'
            : 'Please resolve Step 1 errors first.',
        );
        return;
      }
    }

    // 2. Auto-save draft on step transition during creation ONLY when leaving step 1
    if (!isEditMode && currentStep === 1) {
      const saveResult = await handleAutoSaveDraft();
      if (!saveResult.ok) {
        toast.error(
          currentLang === 'vi'
            ? 'Tự động lưu bản nháp thất bại. Không thể tiếp tục.'
            : 'Failed to auto-save draft. Cannot proceed.',
        );
        return;
      }
    }

    // 3. Move to next step
    const nextStep = currentStep + 1;
    setVisitedSteps((prev) => new Set([...prev, nextStep]));
    setCurrentStep(nextStep);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (step: number) => {
    if (step === currentStep) return;

    // Validate only when leaving step 1
    if (currentStep === 1) {
      const isValid = await trigger(['title', 'categories', 'startDate', 'endDate', 'priority']);
      if (!isValid) {
        setHasAttemptedNext(true);
        toast.error(
          currentLang === 'vi'
            ? 'Vui lòng khắc phục các lỗi ở Bước 1 trước.'
            : 'Please resolve Step 1 errors first.',
        );
        return;
      }

      // Auto-save draft on step transition during creation ONLY when leaving step 1
      if (!isEditMode) {
        const saveResult = await handleAutoSaveDraft();
        if (!saveResult.ok) {
          toast.error(
            currentLang === 'vi'
              ? 'Tự động lưu bản nháp thất bại. Không thể tiếp tục.'
              : 'Failed to auto-save draft. Cannot proceed.',
          );
          return;
        }
      }
    }

    setVisitedSteps((prev) => new Set([...prev, step]));
    setCurrentStep(step);
  };

  // Manual save for edit mode (steps 1-3)
  const handleSaveEdit = async () => {
    await handleAction(false); // saves draft without submitting/closing
  };

  // Manual save as draft on review page (step 4)
  const handleSaveDraftStep4 = async () => {
    const shouldClose = !isEditMode || isPending; // close for new drafts or unsubmitting pending campaigns
    if (shouldClose) {
      bypassExitGuardRef.current = true;
    }
    await handleAction(false, shouldClose);
  };

  // Final submission handler
  const handleSubmitApproval = async () => {
    const values = getValues();

    // Validate Step 1
    const step1Valid = isStep1Valid(values);
    if (!step1Valid) {
      await trigger(['title', 'categories', 'startDate', 'endDate', 'priority']);
      toast.error(
        currentLang === 'vi'
          ? 'Vui lòng sửa các lỗi ở Bước 1 trước khi gửi.'
          : 'Please fix the errors in Step 1 before submitting.',
      );
      setCurrentStep(1);
      return;
    }

    // Validate Step 2
    const step2Valid = isStep2Valid(values, uploadedMedia);
    if (!step2Valid) {
      const hasCoverImage = uploadedMedia.some((m) => m.isCover);
      if (!hasCoverImage) {
        toast.error(
          currentLang === 'vi'
            ? 'Cần có ảnh bìa để gửi phê duyệt chiến dịch. Vui lòng tải lên ở Bước 2.'
            : 'A cover image is required to submit campaign for approval. Please upload one in Step 2.',
        );
      } else {
        setError('description', { message: 'Description is required for submission' });
        toast.error(
          currentLang === 'vi'
            ? 'Mô tả là bắt buộc. Vui lòng thêm câu chuyện mô tả ở Bước 2.'
            : 'Description is required. Please add a story description in Step 2.',
        );
      }
      setCurrentStep(2);
      return;
    }

    // Validate Step 3
    const step3Valid = isStep3Valid(values, payOSConnected);
    if (!step3Valid) {
      await trigger([
        'acceptsMoney',
        'acceptsGoods',
        'target',
        'bankCode',
        'bankName',
        'bankAccountNumber',
        'bankAccountHolderName',
      ]);
      if (values.acceptsMoney) {
        const method = values.donationMethod || 'MANUAL_QR';
        if ((method === 'PAYOS' || method === 'HYBRID') && !payOSConnected) {
          toast.error(
            currentLang === 'vi'
              ? 'Bạn phải kết nối tài khoản PayOS trước khi gửi.'
              : 'You must connect your PayOS account before submitting.',
          );
        } else {
          toast.error(
            currentLang === 'vi'
              ? 'Vui lòng sửa các lỗi ở Bước 3 trước khi gửi.'
              : 'Please fix the errors in Step 3 before submitting.',
          );
        }
      } else {
        toast.error(
          currentLang === 'vi'
            ? 'Vui lòng sửa các lỗi ở Bước 3 trước khi gửi.'
            : 'Please fix the errors in Step 3 before submitting.',
        );
      }
      setCurrentStep(3);
      return;
    }

    // Call submit action
    bypassExitGuardRef.current = true;
    await handleAction(true); // PENDING submit
  };

  const [initialStatus] = useState(campaign?.status);
  const isPending = initialStatus === 'PENDING';

  const footerState = getFooterState({
    isEditMode,
    isEditable,
    currentStep,
    isDirty,
    isPending,
    isSubmitting,
    submittingType,
    lang: currentLang,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBackToPreviousPage}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {currentLang === 'vi' ? 'Quay lại' : 'Back'}
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {campaignId
              ? currentLang === 'vi'
                ? 'Chỉnh sửa ý tưởng chiến dịch'
                : 'Edit Campaign Idea'
              : currentLang === 'vi'
                ? 'Đề xuất chiến dịch mới'
                : 'Propose a New Campaign'}
          </h1>
          {campaignId && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
              ID: #{campaignId}
            </span>
          )}
        </div>
      </div>

      {/* View-only mode warning banner */}
      {!isEditable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm flex items-start gap-3 shadow-xs">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              {currentLang === 'vi' ? 'Chiến dịch chỉ có thể xem' : 'Campaign is view-only'}
            </p>
            <p className="text-xs mt-0.5 text-amber-700 leading-relaxed">
              {currentLang === 'vi'
                ? 'Chiến dịch này đã được phê duyệt hoặc đang diễn ra và không thể chỉnh sửa.'
                : 'This campaign has been approved or is in progress and cannot be edited.'}
            </p>
          </div>
        </div>
      )}

      {/* Warning Notification for PENDING edits */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              {currentLang === 'vi' ? 'Cảnh báo đang chờ duyệt' : 'Pending review warning'}
            </p>
            <p className="text-xs mt-0.5 text-amber-700 leading-relaxed">
              {currentLang === 'vi'
                ? 'Chiến dịch này hiện đang chờ xem xét. Việc lưu thay đổi của bạn sẽ hủy gửi và chuyển lại về trạng thái bản nháp.'
                : 'This campaign is currently pending review. Saving your changes will unsubmit it and revert it back to draft status.'}
            </p>
          </div>
        </div>
      )}

      {/* Stepper Indicator */}
      <FormStepper
        currentStep={currentStep}
        onStepClick={handleStepClick}
        stepStates={stepStates}
        dirtySteps={dirtySteps}
      />

      {/* Step Components */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {currentStep === 1 && (
          <Step1BasicInfo
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            allCategories={allCategories}
            handleToggleCategory={handleToggleCategory}
            trigger={trigger}
            hasAttemptedNext={hasAttemptedNext}
            disabled={!isEditable}
          />
        )}

        {currentStep === 2 && (
          <Step2Media
            uploadedMedia={uploadedMedia}
            isUploading={isUploading}
            handleMediaUpload={handleMediaUpload}
            handleMediaDelete={handleMediaDelete}
            control={control}
            errors={errors}
            trigger={trigger}
            hasAttemptedNext={hasAttemptedNext}
            disabled={!isEditable}
          />
        )}

        {currentStep === 3 && (
          <Step3Donation
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            disabled={!isEditable}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            watch={watch}
            uploadedMedia={uploadedMedia}
            allCategories={allCategories}
            onJumpToStep={handleStepClick}
            disabled={!isEditable}
            payOSConnected={payOSConnected}
          />
        )}
        {/* Navigation / Action Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          {/* Left Buttons: Cancel / Previous */}
          <div className="flex gap-3">
            {footerState.left.type === 'cancel' ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToPreviousPage}
                className="cursor-pointer"
              >
                {footerState.left.label}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> {footerState.left.label}
              </Button>
            )}
          </div>

          {/* Right Buttons: Save changes (pending) / Unsubmit / Next / Save / Submit / Back */}
          <div className="flex items-center gap-2">
            {/* Tertiary: Save changes (keeps PENDING status) */}
            {footerState.tertiary?.isVisible && (
              <Button
                type="button"
                variant="outline"
                disabled={footerState.tertiary.disabled}
                onClick={handleSavePending}
                className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {footerState.tertiary.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {footerState.tertiary.label}
              </Button>
            )}

            {/* Secondary: Unsubmit (pending) / Save changes (non-pending, step 4) */}
            {footerState.secondary?.isVisible && footerState.secondary && (
              <Button
                type="button"
                variant="outline"
                disabled={footerState.secondary.disabled}
                onClick={
                  footerState.secondary.type === 'save_draft'
                    ? handleSaveEdit
                    : handleSaveDraftStep4
                }
                className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {footerState.secondary.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                {footerState.secondary.label}
              </Button>
            )}

            {footerState.primary.type === 'next' ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                {footerState.primary.label} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : footerState.primary.type === 'submit' ? (
              <Button
                type="button"
                disabled={footerState.primary.disabled}
                onClick={handleSubmitApproval}
                className="flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary/95 text-white"
              >
                {footerState.primary.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {footerState.primary.label}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleBackToPreviousPage}
                className="flex items-center gap-1.5 cursor-pointer bg-primary hover:bg-primary/95 text-white"
              >
                {footerState.primary.label}
              </Button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showExitDialog}
        onClose={handleStay}
        onConfirm={handleLeave}
        title={currentLang === 'vi' ? 'Thay đổi chưa lưu' : 'Unsaved Changes'}
        confirmLabel={currentLang === 'vi' ? 'Rời khỏi trang' : 'Leave Page'}
      >
        {currentLang === 'vi'
          ? 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi không?'
          : 'You have unsaved changes. Are you sure you want to leave?'}
      </ConfirmDialog>
    </div>
  );
}
