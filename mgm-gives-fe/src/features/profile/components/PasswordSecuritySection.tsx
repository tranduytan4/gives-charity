import { Eye, EyeOff, Save } from 'lucide-react';
import { useState } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import type { ChangePasswordInput } from '@/shared/utils/validate';

interface PasswordSecuritySectionProps {
  register: UseFormRegister<ChangePasswordInput>;
  errors: FieldErrors<ChangePasswordInput>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isModified: boolean;
}

export default function PasswordSecuritySection({
  register,
  errors,
  onSave,
  onCancel,
  isSaving,
  isModified,
}: PasswordSecuritySectionProps) {
  const { t } = useTranslation('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <form onSubmit={onSave} className="rounded-xl border border-border bg-card p-6">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">{t('passwordSecurityTitle')}</h2>
      </div>

      {/* Password fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="profile-current-password" required>
            {t('currentPassword')}
          </Label>
          <Input
            id="profile-current-password"
            type={showCurrent ? 'text' : 'password'}
            placeholder="••••••••"
            error={!!errors.currentPassword}
            endAdornment={
              <EyeToggle show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
            }
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="profile-new-password" required>
            {t('newPassword')}
          </Label>
          <Input
            id="profile-new-password"
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            error={!!errors.newPassword}
            endAdornment={<EyeToggle show={showNew} onToggle={() => setShowNew(!showNew)} />}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-xs text-red-500 font-medium mt-1 whitespace-pre-line">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="profile-confirm-password" required>
            {t('confirmNewPassword')}
          </Label>
          <Input
            id="profile-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            error={!!errors.confirmPassword}
            endAdornment={
              <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
            }
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Section Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="default"
          onClick={onCancel}
          type="button"
          disabled={isSaving || !isModified}
          className="cursor-pointer"
        >
          {t('cancel')}
        </Button>
        <Button
          size="default"
          type="submit"
          disabled={isSaving || !isModified}
          className="cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('saving') : t('changePassword')}
        </Button>
      </div>
    </form>
  );
}
