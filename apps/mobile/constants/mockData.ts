import { Profile, Shift } from '@vak/contract';
 
// 1. Mock User Profile

export const MOCK_USER: Profile = {
  id: "user-123-uuid",
  full_name: "Wasif Ahmed",
  email: "wasif@damascus.com",
  role: "EMPLOYEE",
  hourly_rate: 18.50, 
  avatar_url: null,
};
 
// 2. Mock Shifts (Compliance & Geo-Fencing Ready)
export const MOCK_SHIFTS: Shift[] = [
  {
    id: "shift-001",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-01-26T09:00:00-07:00", // Using Alberta Offset
    end_time: "2026-01-26T17:00:00-07:00",
    status: "PUBLISHED", 
    unpaid_break_minutes: 30,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "LINE_COOK", // FIXED: Uppercase to match Enum
    // Actuals can be null for published shifts
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
  {
    id: "shift-002",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-01-27T12:00:00-07:00",
    end_time: "2026-01-27T22:00:00-07:00",
    status: "PUBLISHED",
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "SERVER", // FIXED: Was missing entirely
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  }
];
 