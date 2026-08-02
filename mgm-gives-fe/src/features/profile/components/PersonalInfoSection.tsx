import { Save } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import type { UpdateProfileInput } from '@/shared/utils/validate';

interface PersonalInfoSectionProps {
  register: UseFormRegister<UpdateProfileInput>;
  errors: FieldErrors<UpdateProfileInput>;
  email: string;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isModified: boolean;
}

export default function PersonalInfoSection({
  register,
  errors,
  email,
  onSave,
  onCancel,
  isSaving,
  isModified,
}: PersonalInfoSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <form
      onSubmit={onSave}
      className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between"
    >
      <div>
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-foreground">{t('personalInfoTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('personalInfoSubtitle')}</p>
        </div>

        {/* Form fields */}
        <div className="space-y-5">
          <div>
            <Label htmlFor="profile-fullname" required>
              {t('fullName')}
            </Label>
            <Input
              id="profile-fullname"
              type="text"
              error={!!errors.fullName}
              placeholder={t('fullNamePlaceholder')}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="profile-email">{t('email')}</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              disabled
              placeholder="your.email@mgm-tp.com"
            />
          </div>
          <div>
            <Label htmlFor="profile-phone">{t('phone')}</Label>
            <Input
              id="profile-phone"
              type="tel"
              error={!!errors.phone}
              placeholder={t('phonePlaceholder')}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.phone.message}</p>
            )}
          </div>
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
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
