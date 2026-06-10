import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email().refine(
    (e) => e.toLowerCase().endsWith('@gmail.com'),
    { message: 'only Gmail addresses are allowed' }
  ),
  password: z.string().min(8, 'password must be at least 8 characters'),
  displayName: z.string().min(1).max(100).trim(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'new password must be at least 8 characters'),
})

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  preferredLang: z.enum(['hindi', 'english', 'tamil', 'telugu', 'punjabi']).optional(),
  audioQuality: z.enum(['12kbps', '48kbps', '96kbps', '160kbps', '320kbps']).optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
