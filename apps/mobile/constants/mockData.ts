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
    role_at_time_of_shift: "SERVER",
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
  {
    id: "shift-003",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-02-25T12:00:00-07:00",
    end_time: "2026-02-25T22:00:00-07:00",
    status: "PUBLISHED",
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "SERVER",
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
  {
    id: "shift-004",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-02-26T12:00:00-07:00",
    end_time: "2026-02-26T22:00:00-07:00",
    status: "PUBLISHED",
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "SERVER",
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
  {
    id: "shift-005",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-03-03T12:00:00-07:00",
    end_time: "2026-03-03T22:00:00-07:00",
    status: "PUBLISHED",
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "SERVER",
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
  {
    id: "shift-006",
    employee_id: "user-123-uuid",
    manager_id: "mgr-999",
    start_time: "2026-03-04T12:00:00-07:00",
    end_time: "2026-03-04T22:00:00-07:00",
    status: "PUBLISHED",
    unpaid_break_minutes: 45,
    is_holiday: false,
    location_id: "damascus-hq",
    role_at_time_of_shift: "SERVER",
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null
  },
];

// 3. Mock Tasks (Daily Checklist)

type Priority = "low" | "medium" | "high";
type Status = "pending" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  area?: string;
  status: Status;
}

export const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Check fridge temperatures",
    description:
      "Inspect and record the current temperature of all fridges and freezers in the kitchen and storage area.\nEnsure all units are operating below 4°C (40°F) for food safety compliance.\nReport any equipment showing abnormal readings immediately to your manager before beginning prep work.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
  {
    id: "2",
    title: "Prepare service counter",
    description:
      "Set up the service counter with all necessary utensils, napkins, and condiments.\nEnsure the counter is clean and sanitized before placing any items.\nCheck that all display items are properly labeled and arranged.",
    priority: "medium",
    area: "service",
    status: "pending",
  },
  {
    id: "3",
    title: "Wipe prep surfaces",
    description:
      "Clean and sanitize all preparation surfaces using approved cleaning solution.\nPay special attention to cutting boards and stainless steel areas.\nAllow surfaces to air dry before use.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
  {
    id: "4",
    title: "Refill sauces and condiments",
    description:
      "Check all sauce bottles and condiment containers at each station.\nRefill any that are below half capacity using FIFO rotation.\nWipe down all containers after refilling.",
    priority: "medium",
    area: "service",
    status: "pending",
  },
  {
    id: "5",
    title: "Log food waste if applicable",
    description:
      "Record any food waste from the shift in the waste log sheet.\nInclude item name, quantity, and reason for disposal.\nNotify the manager if waste exceeds normal levels.",
    priority: "low",
    area: "kitchen",
    status: "completed",
  },
  {
    id: "6",
    title: "Turn off equipment",
    description:
      "Power down all kitchen equipment that is not needed for the next shift.\nCheck that ovens, grills, and fryers are properly turned off.\nEnsure all pilot lights are extinguished where applicable.",
    priority: "high",
    area: "kitchen",
    status: "pending",
  },
];

// 4. Profile Edit Form Fields

export interface ProfileField {
  name: string;
  label: string;
  placeholder: string;
}

export const PROFILE_FIELDS: ProfileField[] = [
  {
    name: "first_name",
    label: "First Name",
    placeholder: "Your First Name",
  },
  {
    name: "last_name",
    label: "Last Name",
    placeholder: "Your Last Name",
  },
  {
    name: "phone_number",
    label: "Phone Number",
    placeholder: "(xxx) xxx-xxxx",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "user@example.com",
  },
];
