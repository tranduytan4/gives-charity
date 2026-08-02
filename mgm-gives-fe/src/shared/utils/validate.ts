import { z } from 'zod';

export const passwordRequirements = [
  {
    label: 'At least 8 characters',
    isMet: (value: string) => value.length >= 8,
  },
  {
    label: 'At least one letter',
    isMet: (value: string) => /[A-Za-z]/.test(value),
  },
  {
    label: 'At least one number',
    isMet: (value: string) => /\d/.test(value),
  },
] as const;

export const isPasswordValid = (value: string) =>
  passwordRequirements.every((requirement) => requirement.isMet(value));

const passwordRequirementMessage =
  'Password must include:\n- At least 8 characters\n- At least one letter\n- At least one number';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters long'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .regex(passwordPattern, passwordRequirementMessage),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Confirm password does not match your password',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .regex(passwordPattern, passwordRequirementMessage),
    confirmNewPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Confirm password does not match your password',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters long'),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9\s\-()]{7,18}$/,
      'Phone must be a valid international number (e.g., +1 234 567 890 or 0901234567)',
    )
    .optional()
    .or(z.literal('')), // Allows empty since phone is nullable
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .regex(passwordPattern, passwordRequirementMessage),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Confirm password does not match your password',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
