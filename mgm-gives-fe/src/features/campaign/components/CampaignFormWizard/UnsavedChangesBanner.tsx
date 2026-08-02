import { AlertTriangle, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';

interface UnsavedChangesBannerProps {
  isDirty: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function UnsavedChangesBanner({ isDirty, onSave, isSaving }: UnsavedChangesBannerProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  if (!isDirty) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm flex items-center justify-between shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-semibold text-amber-900">
            {currentLang === 'vi' ? 'Thay đổi chưa lưu' : 'Unsaved changes'}
          </span>
          <p className="text-xs text-amber-700">
            {currentLang === 'vi'
              ? 'Bạn có thay đổi chưa lưu ở bước này.'
              : 'You have unsaved changes in this form step.'}
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={isSaving}
        onClick={onSave}
        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none cursor-pointer"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {currentLang === 'vi' ? 'Lưu thay đổi' : 'Save changes'}
      </Button>
    </div>
  );
}
