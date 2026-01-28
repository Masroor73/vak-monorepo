// --- 1. CORE ENUMS ---
export type UserRole = 'OWNER' | 'MANAGER' | 'EMPLOYEE';

export type ShiftStatus = 
  | 'DRAFT'      
  | 'PUBLISHED'  
  | 'COMPLETED'  
  | 'VOID';      

export type SwapStatus = 
  | 'PENDING'        
  | 'MANAGER_REVIEW' 
  | 'APPROVED'   
  | 'DENIED';    

export type NotificationType = 
  | 'SHIFT_PUBLISHED' 
  | 'SWAP_REQUEST' 
  | 'SWAP_APPROVED' 
  | 'GENERAL';

// --- 2. DATABASE MODELS ---

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string; 
  role: UserRole;
  avatar_url?: string;
  hourly_rate?: number; 
  created_at: string;
}

export interface Shift {
  id: string;
  employee_id: string;
  manager_id: string;
  
  // Scheduled (Plan)
  start_time: string; 
  end_time: string;
  
  // Actuals:
  actual_start_time?: string; 
  actual_end_time?: string;   
  clock_in_lat?: number;
  clock_in_long?: number;
  
  location_id?: string;
  role_at_time_of_shift?: string;
  status: ShiftStatus;
  
  //Compliance Fields:
  unpaid_break_minutes: number;
  is_holiday: boolean;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  recipient_id?: string; 
  shift_id: string;
  status: SwapStatus;
  reason?: string;
  created_at: string;
}

//AI Waste Log:
export interface WasteLog {
  id: string;
  reporter_id: string;
  photo_url: string;
  item_name?: string;
  estimated_cost?: number;
  created_at: string;
}

//Notifications:
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_id?: string;
  created_at: string;
}

// --- 3. PAYROLL ENGINE DTOs ---

export interface PayrollCalculationRequest {
  employee_id: string;
  start_date: string;
  end_date: string;
  shifts: Shift[]; 
}

export interface PayrollReport {
  employee_id: string;
  period_start: string;
  period_end: string;
  
  total_hours: number;
  regular_hours: number;
  overtime_hours: number; 
  holiday_pay_hours: number;
  
  gross_pay: number; 
  breakdown_html?: string; 
}