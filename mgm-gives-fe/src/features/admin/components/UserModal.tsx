import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useAuthUser } from '@/features/auth/hooks';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import type { AdminUserResponse, UserRole, UserStatus } from '../types';

const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
});

const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
});

interface UserFormValues {
  email?: string;
  fullName: string;
  phone?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserSaveResult {
  success: boolean;
  message?: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AdminUserResponse | null;
  onSave: (data: UserFormValues) => Promise<UserSaveResult | undefined> | undefined;
}

export function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
  const { t, i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const { data: currentUser } = useAuthUser();
  // Capture user state when opening to prevent form layout shifts during modal close transition
  const [activeUser, setActiveUser] = useState<AdminUserResponse | null>(null);

  const isSelf = activeUser?.id === currentUser?.id;
  const schema = activeUser ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Only reset form state when the modal is opened.
  // This avoids resetting form fields and layout shifts during close transition, preventing performance jank.
  useEffect(() => {
    if (isOpen) {
      setActiveUser(user || null);
      if (user) {
        reset({
          fullName: user.fullName,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          password: '',
        });
      } else {
        reset({
          email: '',
          fullName: '',
          phone: '',
          password: '',
          role: 'USER',
          status: 'ACTIVE',
        });
      }
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: UserFormValues) => {
    const res = await onSave(data);
    if (res && typeof res === 'object') {
      if (res.success) {
        onClose();
      } else if (res.message) {
        const lower = res.message.toLowerCase();
        const fieldName: keyof UserFormValues = lower.includes('email')
          ? 'email'
          : lower.includes('phone')
            ? 'phone'
            : lower.includes('password')
              ? 'password'
              : 'fullName';
        setError(fieldName, { type: 'manual', message: res.message });
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={activeUser ? t('userTable.editUser') : t('userTable.createNewUser')}
      disableAnimation={true}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        {activeUser ? (
          <div className="space-y-2">
            <Label htmlFor="email">
              {currentLang === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
            </Label>
            <Input
              id="email"
              type="email"
              value={activeUser.email}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="email">
              {currentLang === 'vi' ? 'Địa chỉ Email' : 'Email Address'}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="e.g. john.doe@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">
            {currentLang === 'vi' ? 'Họ và tên' : 'Full Name'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder={currentLang === 'vi' ? 'Ví dụ: Nguyễn Văn A' : 'e.g. John Doe'}
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{currentLang === 'vi' ? 'Số điện thoại' : 'Phone Number'}</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="e.g. +84 901 234 567"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {currentLang === 'vi' ? 'Mật khẩu' : 'Password'}{' '}
            {!activeUser && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder={
              activeUser
                ? currentLang === 'vi'
                  ? 'Để trống nếu không đổi mật khẩu'
                  : 'Leave blank to keep unchanged'
                : currentLang === 'vi'
                  ? 'Tối thiểu 6 ký tự'
                  : 'Min 6 characters'
            }
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">
              {currentLang === 'vi' ? 'Vai trò' : 'Role'} <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} modal={false}>
                  <SelectTrigger
                    id="role"
                    className="h-11 w-full bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer"
                  >
                    <SelectValue
                      placeholder={currentLang === 'vi' ? 'Chọn vai trò' : 'Select role'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">{t('userTable.userRole')}</SelectItem>
                    <SelectItem value="ADMIN">{t('userTable.adminRole')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              {t('userTable.status')} <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} modal={false}>
                  <SelectTrigger
                    id="status"
                    className="h-11 w-full bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer"
                  >
                    <SelectValue placeholder={t('userTable.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('userTable.active')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('userTable.inactive')}</SelectItem>
                    {!isSelf && <SelectItem value="BANNED">{t('userTable.banned')}</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
            {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
            {activeUser ? t('userTable.editUser') : t('userTable.addUser')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
