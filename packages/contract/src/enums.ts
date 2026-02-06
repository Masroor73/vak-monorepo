import { z } from 'zod';

/* --- SECURITY ROLES (Who are you?) --- */
export const SystemRoleEnum = z.enum(['OWNER', 'MANAGER', 'EMPLOYEE']);

/* --- OPERATIONAL ROLES (What are you doing?) --- */
export const JobRoleEnum = z.enum([
  'SERVER',
  'BARTENDER',
  'LINE_COOK',
  'PREP_COOK',
  'DISHWASHER',
  'HOST',
  'MANAGER_ON_DUTY'
]);

/* --- STATUS ENUMS --- */
export const ShiftStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'VOID']);
export const SwapStatusEnum = z.enum(['PENDING', 'MANAGER_REVIEW', 'APPROVED', 'DENIED']);
export const NotificationTypeEnum = z.enum(['SHIFT_PUBLISHED', 'SWAP_REQUEST', 'SWAP_APPROVED', 'GENERAL']);