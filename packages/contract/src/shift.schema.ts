import { z } from 'zod';
import { JobRoleEnum, ShiftStatusEnum, SwapStatusEnum } from './enums';

/* --- SHIFT SCHEMA --- */
export const ShiftSchema = z.object({
  id: z.string().uuid().optional(),
  employee_id: z.string().uuid(),
  manager_id: z.string().uuid(),
  
  // SCHEDULED (The Plan)
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  
  // ACTUALS (The Reality - Required for Geo-Fencing & Payroll)
  actual_start_time: z.string().datetime({ offset: true }).nullable().optional(),
  actual_end_time: z.string().datetime({ offset: true }).nullable().optional(),
  
  // GEO-FENCING (The Compliance Proof)
  clock_in_lat: z.number().min(-90).max(90).nullable().optional(),
  clock_in_long: z.number().min(-180).max(180).nullable().optional(),
  
  // METADATA
  role_at_time_of_shift: JobRoleEnum,
  status: ShiftStatusEnum.default('DRAFT'),
  location_id: z.string().default('damascus-hq'),
  
  // COMPLIANCE DATA
  unpaid_break_minutes: z.number().int().min(0).default(0),
  is_holiday: z.boolean().default(false),
})
.refine((data) => {
  const end = data.actual_end_time || data.end_time;
  const start = data.actual_start_time || data.start_time;
  return new Date(end) > new Date(start);
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

/* --- SWAP SCHEMA (The Marketplace) --- */
export const SwapSchema = z.object({
  id: z.string().uuid().optional(),
  requester_id: z.string().uuid(),
  recipient_id: z.string().uuid().nullable().optional(), // Nullable = Open Market Swap
  shift_id: z.string().uuid(),
  status: SwapStatusEnum.default('PENDING'),
  reason: z.string().min(5, "Reason is required"),
});

export type Shift = z.infer<typeof ShiftSchema>;
export type ShiftSwap = z.infer<typeof SwapSchema>;