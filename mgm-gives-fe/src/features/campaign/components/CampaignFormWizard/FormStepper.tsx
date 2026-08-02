import {
  AlertTriangle,
  Check,
  FileCheck,
  FileText,
  HeartHandshake,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

interface FormStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  stepStates: Record<number, 'unvisited' | 'incomplete' | 'complete'>;
  dirtySteps: Record<number, boolean>;
}

export function FormStepper({
  currentStep,
  onStepClick,
  stepStates,
  dirtySteps,
}: FormStepperProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  const STEPS = [
    { number: 1, label: currentLang === 'vi' ? 'Thông tin cơ bản' : 'Basic Info' },
    { number: 2, label: currentLang === 'vi' ? 'Hình ảnh & Câu chuyện' : 'Media & Story' },
    { number: 3, label: currentLang === 'vi' ? 'Hình thức quyên góp' : 'Donation' },
    { number: 4, label: currentLang === 'vi' ? 'Xem lại & Gửi duyệt' : 'Review & Submit' },
  ];

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

        {/* Steps */}
        {STEPS.map((step) => {
          const state = stepStates[step.number] || 'unvisited';
          const isDirty = dirtySteps[step.number];
          const isActive = currentStep === step.number;
          const isClickable = true;

          // Icon resolver based on state and active status
          const renderStepIcon = () => {
            if (!isActive) {
              if (state === 'complete') {
                return <Check className="h-5 w-5 animate-in zoom-in-50 duration-200" />;
              }
              if (state === 'incomplete') {
                return <AlertTriangle className="h-5 w-5" />;
              }
            }

            switch (step.number) {
              case 1:
                return <FileText className="h-5 w-5" />;
              case 2:
                return <ImageIcon className="h-5 w-5" />;
              case 3:
                return <HeartHandshake className="h-5 w-5" />;
              default:
                return <FileCheck className="h-5 w-5" />;
            }
          };

          return (
            <button
              key={step.number}
              type="button"
              disabled={!isClickable}
              onClick={() => onStepClick(step.number)}
              className={cn(
                'relative z-10 flex flex-col items-center gap-2 group focus:outline-none transition-all duration-200',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary border-primary text-white shadow-sm ring-2 ring-primary/20 scale-105'
                    : state === 'complete'
                      ? 'bg-green-50 border-green-500 text-green-600'
                      : state === 'incomplete'
                        ? 'bg-amber-50 border-amber-500 text-amber-600'
                        : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300',
                )}
              >
                {/* Step Content: Icon */}
                {renderStepIcon()}

                {/* Unsaved Changes Indicator (Amber Dot) */}
                {isDirty && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full animate-bounce shadow-sm"
                    title="Unsaved changes"
                  />
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-xs font-semibold tracking-wide transition-colors duration-200',
                  isActive
                    ? 'text-primary'
                    : state === 'complete'
                      ? 'text-gray-700'
                      : state === 'incomplete'
                        ? 'text-amber-700'
                        : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
