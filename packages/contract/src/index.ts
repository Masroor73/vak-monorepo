// packages/contract/src/index.ts

// --- 1. CORE ENUMS (The Rules) ---

export type UserRole = 'MANAGER' | 'EMPLOYEE';

export type ShiftStatus = 
  | 'DRAFT'      // Manager is still planning
  | 'PUBLISHED'  // Visible to employees
  | 'COMPLETED'  // Shift is over
  | 'VOID';      // Cancelled

export type SwapStatus = 
  | 'PENDING'    // Waiting for peer to accept
  | 'MANAGER_REVIEW' // Peer accepted, waiting for manager
  | 'APPROVED'   // Manager said yes
  | 'DENIED';    // Manager said no

// --- 2. DATABASE MODELS (Supabase Mirrors) ---

export interface Profile {
  id: string; // UUID from auth.users
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  hourly_rate?: number; // Only visible to Managers
  created_at: string;
}

export interface Shift {
  id: string;
  employee_id: string;
  manager_id: string; // Who created it
  start_time: string; // ISO 8601 (2026-01-25T09:00:00Z)
  end_time: string;
  location_id?: string;
  role_at_time_of_shift?: string; // e.g., "Line Cook" vs "Dishwasher"
  status: ShiftStatus;
  
  // Compliance Fields (For Squad C)
  unpaid_break_minutes: number;
  is_holiday: boolean;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  recipient_id?: string; // Optional (Open market swap)
  shift_id: string;
  status: SwapStatus;
  reason?: string;
  created_at: string;
}

// --- 3. PAYROLL ENGINE DTOs (For .NET) ---

// Input: What C# receives
export interface PayrollCalculationRequest {
  employee_id: string;
  start_date: string;
  end_date: string;
  shifts: Shift[]; 
}

// Output: What C# returns
export interface PayrollReport {
  employee_id: string;
  period_start: string;
  period_end: string;
  
  total_hours: number;
  regular_hours: number;
  overtime_hours: number; // Calculated via 8/44 Rule
  holiday_pay_hours: number;
  
  gross_pay: number;
  breakdown_html?: string; // For generating PDF
}