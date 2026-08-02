import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@/shared/constants/role';
import { getAvatarUrl } from '@/shared/utils/media';
import {
  PasswordSecuritySection,
  PersonalInfoSection,
  ProfilePageError,
  ProfilePageSkeleton,
  ProfilePictureCard,
} from '../components';
import { useProfileForm } from '../hooks';

interface ProfilePageProps {
  /** When true, skip the role-based redirect (used inside AdminLayout) */
  isAdminRoute?: boolean;
}

export default function ProfilePage({ isAdminRoute = false }: ProfilePageProps) {
  const { t } = useTranslation('profile');
  const {
    user,
    isLoading,
    isSavingInfo,
    isSavingPassword,
    isUploadingAvatar,
    isInfoModified,
    isPasswordModified,
    isError,
    refetch,
    infoForm,
    passwordForm,
    handleFileSelect,
    handleCancelInfo,
    handleCancelPassword,
    handleSaveInfo,
    handleSavePassword,
  } = useProfileForm();

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <ProfilePageSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-5xl mx-auto">
        <ProfilePageError onRetry={() => refetch()} />
      </div>
    );
  }

  // Role-based redirect: ADMIN users should not access /profile (user route)
  if (!isAdminRoute && user?.role === ROLES.ADMIN) {
    return <Navigate to="/admin/profile" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Top row: Profile picture + Personal info */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-6">
        <ProfilePictureCard
          fullName={user?.fullName}
          email={user?.email}
          role={user?.role}
          avatarUrl={getAvatarUrl(user?.avatarUrl)}
          isUploading={isUploadingAvatar}
          onFileSelect={handleFileSelect}
        />
        <PersonalInfoSection
          register={infoForm.register}
          errors={infoForm.formState.errors}
          email={user?.email ?? ''}
          onSave={handleSaveInfo}
          onCancel={handleCancelInfo}
          isSaving={isSavingInfo}
          isModified={isInfoModified}
        />
      </div>

      {/* Password & Security */}
      <div className="mb-6">
        <PasswordSecuritySection
          register={passwordForm.register}
          errors={passwordForm.formState.errors}
          onSave={handleSavePassword}
          onCancel={handleCancelPassword}
          isSaving={isSavingPassword}
          isModified={isPasswordModified}
        />
      </div>
    </div>
  );
}
