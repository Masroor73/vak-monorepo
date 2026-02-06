import { z } from 'zod';
import { SystemRoleEnum } from './enums';
export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2).nullable(),
  role: SystemRoleEnum.default('EMPLOYEE'),
  // We keep hourly_rate loose here, but strictly typed as number
  hourly_rate: z.number().min(0).default(15.00), 
  avatar_url: z.string().url().nullable().optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
 