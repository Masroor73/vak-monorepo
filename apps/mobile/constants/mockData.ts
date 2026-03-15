import { Profile, ProfileUpdateInput, Shift } from '@vak/contract';

// 1. Mock User Profile

export const MOCK_USER: Profile = {
  id: "user-123-uuid",
  full_name: "Wasif Ahmed",
  email: "wasif@damascus.com",
  role: "EMPLOYEE",
  hourly_rate: 18.50,
  avatar_url: null,
  is_approved: true,
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
  name: keyof ProfileUpdateInput;
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
//Mock Privacy Policy 
export const MOCK_PRIVACY_POLICY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We may collect personal information that you provide directly, such as your name, email address, phone number, and employment details. We also automatically collect certain data when you use the app, including device information, usage patterns, and log data.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use the information we collect to provide and maintain our services, manage your account, communicate with you about schedules and tasks, send notifications, improve our app experience, and comply with legal obligations.",
  },
  {
    title: "3. Sharing of Information",
    body: "We do not sell your personal information. We may share your data with your employer or organization as necessary for workforce management, with service providers who assist in operating our platform, and when required by law or to protect our legal rights.",
  },
  {
    title: "4. Data Security",
    body: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of electronic transmission or storage is 100% secure.",
  },
  {
    title: "5. Data Retention",
    body: "We retain your personal information for as long as your account is active or as needed to provide you services. We may also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.",
  },
  {
    title: "6. Your Rights",
    body: "Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data, object to or restrict certain processing, request data portability, and withdraw consent where processing is based on consent.",
  },
  {
    title: "7. Third-Party Services",
    body: "Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these external services. We encourage you to review their privacy policies before providing any personal information.",
  },
  {
    title: "8. Children's Privacy",
    body: "Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete such information.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy within the app and updating the effective date. Your continued use of the app constitutes acceptance of the updated policy.",
  },
  {
    title: "10. Contact Us",
    body: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through the Help and Support section of the app or reach out to your organization's administrator.",
  },
];
