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
export const MOCK_HELP_SUPPORT_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { question: "How do I clock in and out?", answer: "Navigate to your shift details and tap the 'Clock In' button when you arrive at your workplace. Make sure location services are enabled so your clock-in can be verified. To clock out, return to the shift screen and tap 'Clock Out'." },
      { question: "How do I view my schedule?", answer: "Tap 'My Schedule' from the home screen or the bottom navigation bar. You can view your upcoming shifts, filter by week or month, and see shift details including start time, end time, and assigned role." },
      { question: "How do I update my profile?", answer: "Go to 'My Profile' from the menu, then tap the edit icon. You can update your personal information, contact details, and profile picture." },
    ],
  },
  {
    title: "Shifts & Scheduling",
    items: [
      { question: "How do I set my availability?", answer: "Navigate to 'Set Availability' from the home screen. Select the days and time slots you are available to work. Your manager will use this information when creating schedules." },
      { question: "What if I can't make a scheduled shift?", answer: "Contact your manager as soon as possible through the Messages section. You can also check if shift swaps are available with other team members." },
      { question: "Why can't I clock in?", answer: "Clock-in requires you to be within the designated work location. Make sure your GPS is enabled and you are at the correct location. If the issue persists, contact your manager." },
    ],
  },
  {
    title: "Notifications",
    items: [
      { question: "How do I manage my notifications?", answer: "Go to 'Notification Preferences' in your profile settings. You can toggle notifications for schedule updates, messages, task reminders, and announcements." },
      { question: "I'm not receiving notifications", answer: "Ensure notifications are enabled in your device settings for this app. Also check that your notification preferences within the app are turned on." },
    ],
  },
  {
    title: "Account & Security",
    items: [
      { question: "How do I reset my password?", answer: "On the login screen, tap 'Forgot Password'. Enter your registered email address and follow the instructions sent to your inbox to create a new password." },
      { question: "How do I log out?", answer: "Open the side menu and tap 'Log Out' at the bottom. You will be redirected to the login screen." },
    ],
  },
  {
    title: "Contact Support",
    items: [
      { question: "How do I reach support?", answer: "For technical issues, please email support@vakapp.com. For workplace-related concerns, use the 'Report an Issue' feature or speak directly with your manager." },
    ],
  },
];