import { z } from 'zod';
import { SystemRoleEnum } from './enums';

// ─── Password Rules ───────────────────────────────────────────────────────────
// label        → shown in the requirements box in the UI
// errorMessage → shown under the field on submit if the rule fails
// test         → the actual check
export const PASSWORD_RULES: {
  label: string;
  errorMessage: string;
  test: (val: string) => boolean;
}[] = [
    {
      label: "At least 6 characters. Max 72 characters.",
      errorMessage: "Password does not meet requirements",
      test: (val) => val.length >= 6,
    },
  ];

// Empty field → "Password is required"
// Rules fail  → "Password does not meet requirements"
const passwordSchema = z
  .string()
  .min(1, { message: "Password is required" })
  .max(72, { message: "Max 72 characters." })
  .superRefine((val, ctx) => {
    PASSWORD_RULES.forEach((rule) => {
      if (!rule.test(val)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.errorMessage });
      }
    });
  });

export const LoginSchema = z.object({
  email: z.string()
    .min(1, { message: "Email is required" })
    .max(254, { message: "Max 254 characters." })
    .email({ message: "Invalid email address" }),
  password: passwordSchema,
});

export const SignupSchema = LoginSchema.extend({
  full_name: z.string()
    .min(2, { message: "Full name is required" })
    .max(50, { message: "Max 50 characters." })
  ,
  confirmPassword: z.string().min(1, { message: "Confirm Password is required" })
}).refine(
  (data) => data.password === data.confirmPassword,
  { path: ["confirmPassword"], message: "Passwords do not match" }
)

export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: "Please enter your email address." })
    .email({ message: "Please enter a valid email address." }),
});

export const ResetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine(
  (data) => data.password === data.confirmPassword,
  { path: ["confirmPassword"], message: "Passwords do not match." }
);

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2).nullable(),
  role: SystemRoleEnum.default('EMPLOYEE'),
  phone_number: z.string().nullable().optional(),
  hourly_rate: z.number().min(0).default(15.00),
  avatar_url: z.string().url().nullable().optional(),
  is_approved: z.boolean().default(false),
});

export const EditProfileSchema = z.object({
  full_name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: "Max 50 characters." }),
  phone_number: z.string()
    .max(14, { message: "Max 14 characters." })
    .nullable()
    .optional(),
  email: z.string()
    .max(254, { message: "Max 254 characters." })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type EditProfileInput = z.infer<typeof EditProfileSchema>
