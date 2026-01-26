import { Profile, Shift, ShiftStatus } from '@vak/contract';

// 1. Mock User Profile
export const MOCK_USER: Profile = {
  id: "user-123-uuid",
  full_name: "Wasif Ahmed",
  email: "wasif@damascus.com",
  role: "EMPLOYEE", // Try changing this to "ADMIN" -> It will error red!
  created_at: new Date().toISOString(),
};

// 2. Mock Shifts (Compliance Ready)
export const MOCK_SHIFTS: Shift[] = [
  {
    id: "shift-001",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-01-26T09:00:00Z",
    end_time: "2026-01-26T17:00:00Z", // 8 hours
    status: "PUBLISHED" as ShiftStatus,
    unpaid_break_minutes: 30,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "Line Cook"
  },
  {
    id: "shift-002",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-01-27T12:00:00Z",
    end_time: "2026-01-27T22:00:00Z", // 10 hours (Overtime risk!)
    status: "PUBLISHED" as ShiftStatus,
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq"
  }
];